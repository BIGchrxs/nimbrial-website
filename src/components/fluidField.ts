import * as THREE from "three";

/*
  A small 2D fluid simulation ("stable fluids", Jos Stam 1999) that the pointer stirs.
  It runs on the GPU at low resolution and only stores velocity. Particles read this
  velocity at their position on screen, which is what makes them flow rather than just
  get pushed: the motion carries on, curls and fades out naturally after the pointer moves.
*/

const baseVertex = /* glsl */ `
  varying vec2 vUv;
  void main() {
    vUv = uv;
    gl_Position = vec4(position.xy, 0.0, 1.0);
  }
`;

// Adds a soft blob of velocity where the pointer moved.
const splatShader = /* glsl */ `
  uniform sampler2D uTarget;
  uniform vec2 uPoint;
  uniform vec2 uForce;
  uniform float uRadius;
  uniform float uAspect;
  varying vec2 vUv;
  void main() {
    vec2 d = vUv - uPoint;
    d.x *= uAspect;
    float falloff = exp(-dot(d, d) / uRadius);
    vec2 base = texture2D(uTarget, vUv).xy;
    gl_FragColor = vec4(base + uForce * falloff, 0.0, 1.0);
  }
`;

// Moves the velocity field along itself, and lets it fade.
const advectShader = /* glsl */ `
  uniform sampler2D uVelocity;
  uniform vec2 uTexel;
  uniform float uDt;
  uniform float uDissipation;
  varying vec2 vUv;
  void main() {
    vec2 coord = vUv - uDt * texture2D(uVelocity, vUv).xy * uTexel;
    gl_FragColor = vec4(uDissipation * texture2D(uVelocity, coord).xy, 0.0, 1.0);
  }
`;

const divergenceShader = /* glsl */ `
  uniform sampler2D uVelocity;
  uniform vec2 uTexel;
  varying vec2 vUv;
  void main() {
    float l = texture2D(uVelocity, vUv - vec2(uTexel.x, 0.0)).x;
    float r = texture2D(uVelocity, vUv + vec2(uTexel.x, 0.0)).x;
    float b = texture2D(uVelocity, vUv - vec2(0.0, uTexel.y)).y;
    float t = texture2D(uVelocity, vUv + vec2(0.0, uTexel.y)).y;
    gl_FragColor = vec4(0.5 * (r - l + t - b), 0.0, 0.0, 1.0);
  }
`;

// Keeps part of last frame's pressure as a warm start for the solver.
const fadeShader = /* glsl */ `
  uniform sampler2D uSource;
  uniform float uValue;
  varying vec2 vUv;
  void main() {
    gl_FragColor = vec4(uValue * texture2D(uSource, vUv).x, 0.0, 0.0, 1.0);
  }
`;

// One Jacobi iteration of the pressure solve.
const pressureShader = /* glsl */ `
  uniform sampler2D uPressure;
  uniform sampler2D uDivergence;
  uniform vec2 uTexel;
  varying vec2 vUv;
  void main() {
    float l = texture2D(uPressure, vUv - vec2(uTexel.x, 0.0)).x;
    float r = texture2D(uPressure, vUv + vec2(uTexel.x, 0.0)).x;
    float b = texture2D(uPressure, vUv - vec2(0.0, uTexel.y)).x;
    float t = texture2D(uPressure, vUv + vec2(0.0, uTexel.y)).x;
    float div = texture2D(uDivergence, vUv).x;
    gl_FragColor = vec4((l + r + b + t - div) * 0.25, 0.0, 0.0, 1.0);
  }
`;

// Removes the pressure gradient, which makes the flow swirl instead of just spreading out.
const gradientShader = /* glsl */ `
  uniform sampler2D uPressure;
  uniform sampler2D uVelocity;
  uniform vec2 uTexel;
  varying vec2 vUv;
  void main() {
    float l = texture2D(uPressure, vUv - vec2(uTexel.x, 0.0)).x;
    float r = texture2D(uPressure, vUv + vec2(uTexel.x, 0.0)).x;
    float b = texture2D(uPressure, vUv - vec2(0.0, uTexel.y)).x;
    float t = texture2D(uPressure, vUv + vec2(0.0, uTexel.y)).x;
    vec2 vel = texture2D(uVelocity, vUv).xy - vec2(r - l, t - b);
    gl_FragColor = vec4(vel, 0.0, 1.0);
  }
`;

type PingPong = { read: THREE.WebGLRenderTarget; write: THREE.WebGLRenderTarget; swap: () => void };

function makeTarget(size: number) {
  return new THREE.WebGLRenderTarget(size, size, {
    type: THREE.HalfFloatType,
    format: THREE.RGBAFormat,
    minFilter: THREE.LinearFilter,
    magFilter: THREE.LinearFilter,
    wrapS: THREE.ClampToEdgeWrapping,
    wrapT: THREE.ClampToEdgeWrapping,
    depthBuffer: false,
    stencilBuffer: false,
  });
}

function makePingPong(size: number): PingPong {
  const pp = {
    read: makeTarget(size),
    write: makeTarget(size),
    swap() {
      const t = pp.read;
      pp.read = pp.write;
      pp.write = t;
    },
  };
  return pp;
}

export type FluidSettings = {
  /** Grid resolution. 128 is plenty: particles only need the broad flow. */
  resolution: number;
  /** How much of the velocity survives each 1/60 s (lower = flow dies out sooner). */
  velocityDissipation: number;
  /** Pressure warm start kept between frames. */
  pressureDissipation: number;
  /** Jacobi iterations per frame (more = rounder swirls, more GPU work). */
  pressureIterations: number;
  /** Size of the area each pointer movement stirs, in screen-height units squared. */
  splatRadius: number;
  /** Strength of the stir relative to pointer speed. */
  splatForce: number;
};

export class FluidField {
  readonly settings: FluidSettings;
  private renderer: THREE.WebGLRenderer;
  private velocity: PingPong;
  private pressure: PingPong;
  private divergence: THREE.WebGLRenderTarget;
  private scene = new THREE.Scene();
  private camera = new THREE.OrthographicCamera(-1, 1, 1, -1, 0, 1);
  private quad: THREE.Mesh;
  private texel: THREE.Vector2;
  private materials: Record<"splat" | "advect" | "divergence" | "fade" | "pressure" | "gradient", THREE.ShaderMaterial>;
  private pending: { x: number; y: number; dx: number; dy: number }[] = [];
  aspect = 1;

  constructor(renderer: THREE.WebGLRenderer, settings: FluidSettings) {
    this.renderer = renderer;
    this.settings = settings;
    const n = settings.resolution;
    this.velocity = makePingPong(n);
    this.pressure = makePingPong(n);
    this.divergence = makeTarget(n);
    this.texel = new THREE.Vector2(1 / n, 1 / n);

    const make = (fragmentShader: string, uniforms: Record<string, THREE.IUniform>) =>
      new THREE.ShaderMaterial({ vertexShader: baseVertex, fragmentShader, uniforms, depthTest: false, depthWrite: false });
    this.materials = {
      splat: make(splatShader, {
        uTarget: { value: null },
        uPoint: { value: new THREE.Vector2() },
        uForce: { value: new THREE.Vector2() },
        uRadius: { value: settings.splatRadius },
        uAspect: { value: 1 },
      }),
      advect: make(advectShader, {
        uVelocity: { value: null },
        uTexel: { value: this.texel },
        uDt: { value: 0 },
        uDissipation: { value: 1 },
      }),
      divergence: make(divergenceShader, { uVelocity: { value: null }, uTexel: { value: this.texel } }),
      fade: make(fadeShader, { uSource: { value: null }, uValue: { value: settings.pressureDissipation } }),
      pressure: make(pressureShader, {
        uPressure: { value: null },
        uDivergence: { value: null },
        uTexel: { value: this.texel },
      }),
      gradient: make(gradientShader, {
        uPressure: { value: null },
        uVelocity: { value: null },
        uTexel: { value: this.texel },
      }),
    };
    this.quad = new THREE.Mesh(new THREE.PlaneGeometry(2, 2), this.materials.splat);
    this.quad.frustumCulled = false;
    this.scene.add(this.quad);
  }

  /** The current velocity field (x/y in texels per second). */
  get texture() {
    return this.velocity.read.texture;
  }

  /** Queue a stir at a point in 0..1 canvas coordinates (y up), moved by dx/dy (same units). */
  addSplat(x: number, y: number, dx: number, dy: number) {
    this.pending.push({ x, y, dx, dy });
  }

  private run(material: THREE.ShaderMaterial, target: THREE.WebGLRenderTarget) {
    this.quad.material = material;
    this.renderer.setRenderTarget(target);
    this.renderer.render(this.scene, this.camera);
  }

  step(dt: number) {
    const m = this.materials;
    const s = this.settings;
    const prevTarget = this.renderer.getRenderTarget();
    const prevAutoClear = this.renderer.autoClear;
    this.renderer.autoClear = false;

    for (const p of this.pending) {
      m.splat.uniforms.uTarget.value = this.velocity.read.texture;
      m.splat.uniforms.uPoint.value.set(p.x, p.y);
      m.splat.uniforms.uForce.value.set(p.dx * s.splatForce, p.dy * s.splatForce);
      m.splat.uniforms.uAspect.value = this.aspect;
      this.run(m.splat, this.velocity.write);
      this.velocity.swap();
    }
    this.pending.length = 0;

    m.divergence.uniforms.uVelocity.value = this.velocity.read.texture;
    this.run(m.divergence, this.divergence);

    m.fade.uniforms.uSource.value = this.pressure.read.texture;
    this.run(m.fade, this.pressure.write);
    this.pressure.swap();

    m.pressure.uniforms.uDivergence.value = this.divergence.texture;
    for (let i = 0; i < s.pressureIterations; i++) {
      m.pressure.uniforms.uPressure.value = this.pressure.read.texture;
      this.run(m.pressure, this.pressure.write);
      this.pressure.swap();
    }

    m.gradient.uniforms.uPressure.value = this.pressure.read.texture;
    m.gradient.uniforms.uVelocity.value = this.velocity.read.texture;
    this.run(m.gradient, this.velocity.write);
    this.velocity.swap();

    m.advect.uniforms.uVelocity.value = this.velocity.read.texture;
    m.advect.uniforms.uDt.value = dt;
    m.advect.uniforms.uDissipation.value = Math.pow(s.velocityDissipation, dt * 60);
    this.run(m.advect, this.velocity.write);
    this.velocity.swap();

    this.renderer.setRenderTarget(prevTarget);
    this.renderer.autoClear = prevAutoClear;
  }

  dispose() {
    [this.velocity.read, this.velocity.write, this.pressure.read, this.pressure.write, this.divergence].forEach((t) =>
      t.dispose(),
    );
    Object.values(this.materials).forEach((mat) => mat.dispose());
    this.quad.geometry.dispose();
  }
}
