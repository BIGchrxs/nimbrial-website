"use client";

import { useFrame, useThree } from "@react-three/fiber";
import { useEffect, useMemo, useRef } from "react";
import * as THREE from "three";
import { GPUComputationRenderer } from "three/examples/jsm/misc/GPUComputationRenderer.js";
import { sampleEmblem } from "./emblemSampling";
import { FluidField } from "./fluidField";

/*
  The Nimbrial emblem as ~150,000 GPU-simulated particles, stirred by a fluid simulation.
  Moving the pointer stirs the fluid; particles are carried by the flow at their spot on
  screen, glow as they speed up, and drift back into the logo as the flow calms down.
  The emblem never rotates.
*/

// ---- Tuning (all motion feel lives here) -----------------------------------------------
export const TUNING = {
  /** Particles per side of the simulation texture (total = side x side). */
  sideDesktop: 384, // 147,456 particles
  sideMobile: 200, // 40,000 particles
  /** How strongly a particle is carried by the fluid (0..1 per frame). */
  flowCoupling: 0.16,
  /** Converts fluid speed to world speed; higher sends particles further. */
  flowScale: 1.0,
  /** Pull back to the logo shape when the fluid is calm. */
  spring: 0.0065,
  /** How much moving fluid relaxes the spring (1 = fully released while stirred). */
  release: 0.95,
  /** Velocity kept each frame (lower = settles sooner). */
  friction: 0.93,
  /** Gentle idle shimmer, so the logo always feels alive. */
  shimmer: 0.00022,
  /** Point size in pixels at the default camera distance. */
  pointSize: 2.1,
  /** Fluid feel. */
  fluid: {
    resolution: 128,
    velocityDissipation: 0.975,
    pressureDissipation: 0.8,
    pressureIterations: 6,
    splatRadius: 0.004,
    splatForce: 5200,
  },
};

// ---- GPU simulation shaders -------------------------------------------------------------
// Velocity: flow from the fluid + spring to home + shimmer, with friction. w = smoothed speed.
const velocityShader = /* glsl */ `
  uniform sampler2D tHome;
  uniform sampler2D tFluid;
  uniform mat4 uMVP;
  uniform vec3 uRight;
  uniform vec3 uUp;
  uniform float uDtRatio;
  uniform float uTime;
  uniform float uFlowCoupling;
  uniform float uFlowToWorld;
  uniform float uSpring;
  uniform float uRelease;
  uniform float uFriction;
  uniform float uShimmer;

  void main() {
    vec2 uv = gl_FragCoord.xy / resolution.xy;
    vec4 pos = texture2D(texturePosition, uv);
    vec4 vel = texture2D(textureVelocity, uv);
    vec4 home = texture2D(tHome, uv);
    float seed = home.w;

    // Where is this particle on screen? Read the fluid's velocity there.
    vec4 clip = uMVP * vec4(pos.xyz, 1.0);
    vec2 screen = clip.xy / clip.w * 0.5 + 0.5;
    float onScreen = step(0.0, screen.x) * step(screen.x, 1.0) * step(0.0, screen.y) * step(screen.y, 1.0);
    vec2 fluid = texture2D(tFluid, screen).xy * onScreen;

    // Fluid velocity (texels/s) -> world units per frame, along the camera's screen axes.
    vec3 flow = (uRight * fluid.x + uUp * fluid.y) * uFlowToWorld;
    // A little depth so the cloud breaks up in 3D instead of sliding like a sticker.
    flow.z += (seed - 0.5) * length(fluid) * uFlowToWorld * 0.9;

    float strength = clamp(length(fluid) * uFlowToWorld * 40.0, 0.0, 1.0);
    float carry = 1.0 - pow(1.0 - uFlowCoupling * (0.6 + 0.8 * seed), uDtRatio);
    vel.xyz += (flow - vel.xyz) * carry * strength;

    // Spring home, released while the fluid around the particle is moving.
    vel.xyz += (home.xyz - pos.xyz) * uSpring * (0.75 + 0.5 * seed) * (1.0 - strength * uRelease) * uDtRatio;

    // Idle shimmer: a smooth, slowly changing swirl.
    vec3 p = pos.xyz * 2.3 + vec3(seed * 6.28);
    float t = uTime * 0.35;
    vec3 swirl = vec3(sin(p.y + t) + sin(p.z * 1.7 - t * 0.8), sin(p.z + t * 1.1) + sin(p.x * 1.5 + t), sin(p.x + t * 0.9) + sin(p.y * 1.3 - t));
    vel.xyz += swirl * uShimmer * uDtRatio;

    vel.xyz *= pow(uFriction, uDtRatio);
    vel.w = mix(vel.w, length(vel.xyz), 1.0 - pow(0.9, uDtRatio));
    gl_FragColor = vel;
  }
`;

const positionShader = /* glsl */ `
  uniform float uDtRatio;
  void main() {
    vec2 uv = gl_FragCoord.xy / resolution.xy;
    vec4 pos = texture2D(texturePosition, uv);
    vec4 vel = texture2D(textureVelocity, uv);
    pos.xyz += vel.xyz * uDtRatio;
    gl_FragColor = pos;
  }
`;

// ---- Render shaders -----------------------------------------------------------------------
const renderVertex = /* glsl */ `
  uniform sampler2D tPosition;
  uniform sampler2D tVelocity;
  uniform sampler2D tHome;
  uniform float uSize;
  uniform float uPixelRatio;
  attribute vec2 reference;
  varying float vSpeed;
  varying float vDepth;
  varying float vSeed;
  void main() {
    vec4 pos = texture2D(tPosition, reference);
    vec4 home = texture2D(tHome, reference);
    vSpeed = clamp(texture2D(tVelocity, reference).w * 22.0, 0.0, 1.0);
    vDepth = home.z;
    vSeed = home.w;
    vec4 mv = modelViewMatrix * vec4(pos.xyz, 1.0);
    gl_Position = projectionMatrix * mv;
    gl_PointSize = uSize * (0.8 + vSeed * 0.45) * uPixelRatio * (7.8 / -mv.z);
  }
`;

const renderFragment = /* glsl */ `
  uniform vec3 uLight;
  uniform vec3 uDark;
  uniform vec3 uFast;
  varying float vSpeed;
  varying float vDepth;
  varying float vSeed;
  void main() {
    vec2 c = gl_PointCoord * 2.0 - 1.0;
    float r2 = dot(c, c);
    if (r2 > 1.0) discard;
    // Shade each point like a tiny sphere lit from the upper left.
    vec3 n = vec3(c.x, -c.y, sqrt(1.0 - r2));
    float lit = clamp(dot(n, normalize(vec3(-0.5, 0.65, 0.6))), 0.0, 1.0);
    float front = clamp(vDepth * 1.4 + 0.55, 0.0, 1.0);
    vec3 col = mix(uDark, uLight, 0.25 + 0.75 * lit * (0.55 + 0.45 * front));
    col = mix(col, uFast, vSpeed * vSpeed);
    // Fast particles fade a little: reads like motion blur.
    float alpha = smoothstep(1.0, 0.6, r2) * mix(1.0, 0.55, vSpeed);
    gl_FragColor = vec4(col, alpha);
  }
`;

/** True if this device can run the GPU particle simulation. */
export function supportsGpuParticles(gl: THREE.WebGLRenderer) {
  return (
    gl.capabilities.isWebGL2 &&
    gl.capabilities.maxVertexTextures > 0 && // points read their position from a texture
    gl.extensions.has("EXT_color_buffer_float") // simulation writes float textures
  );
}

/** Owns the GPU simulation, the fluid and the render objects; updated once per frame. */
class FluidParticleSystem {
  readonly geometry: THREE.BufferGeometry;
  readonly material: THREE.ShaderMaterial;
  private gpu: GPUComputationRenderer;
  private velVar: ReturnType<GPUComputationRenderer["addVariable"]>;
  private posVar: ReturnType<GPUComputationRenderer["addVariable"]>;
  private homeTex: THREE.DataTexture;
  private fluid: FluidField;
  private gl: THREE.WebGLRenderer;
  private pointer = { x: 0, y: 0, px: 0, py: 0, has: false, moved: false };
  private mvp = new THREE.Matrix4();
  private inv = new THREE.Matrix4();
  private right = new THREE.Vector3();
  private up = new THREE.Vector3();
  private worldPos = new THREE.Vector3();
  private worldScale = new THREE.Vector3();

  constructor(gl: THREE.WebGLRenderer, side: number) {
    this.gl = gl;
    const count = side * side;
    const { home, seeds } = sampleEmblem(count);

    const gpu = new GPUComputationRenderer(side, side, gl);
    const homeTex = gpu.createTexture();
    const posTex = gpu.createTexture();
    const velTex = gpu.createTexture();
    const h = homeTex.image.data as Float32Array;
    const p = posTex.image.data as Float32Array;
    for (let i = 0; i < count; i++) {
      const seed = seeds[i];
      h[i * 4] = home[i * 3];
      h[i * 4 + 1] = home[i * 3 + 1];
      h[i * 4 + 2] = home[i * 3 + 2];
      h[i * 4 + 3] = seed;
      // Start loosely scattered so the logo gathers itself on load.
      const a = seed * Math.PI * 2 * 7.13;
      const r = 0.6 + seed * 1.4;
      p[i * 4] = home[i * 3] + Math.cos(a) * r;
      p[i * 4 + 1] = home[i * 3 + 1] + Math.sin(a) * r;
      p[i * 4 + 2] = home[i * 3 + 2] + (seed - 0.5) * 2;
      p[i * 4 + 3] = 1;
    }

    const velVar = gpu.addVariable("textureVelocity", velocityShader, velTex);
    const posVar = gpu.addVariable("texturePosition", positionShader, posTex);
    gpu.setVariableDependencies(velVar, [velVar, posVar]);
    gpu.setVariableDependencies(posVar, [velVar, posVar]);
    Object.assign(velVar.material.uniforms, {
      tHome: { value: homeTex },
      tFluid: { value: null },
      uMVP: { value: new THREE.Matrix4() },
      uRight: { value: new THREE.Vector3(1, 0, 0) },
      uUp: { value: new THREE.Vector3(0, 1, 0) },
      uDtRatio: { value: 1 },
      uTime: { value: 0 },
      uFlowCoupling: { value: TUNING.flowCoupling },
      uFlowToWorld: { value: 0 },
      uSpring: { value: TUNING.spring },
      uRelease: { value: TUNING.release },
      uFriction: { value: TUNING.friction },
      uShimmer: { value: TUNING.shimmer },
    });
    posVar.material.uniforms.uDtRatio = { value: 1 };
    const error = gpu.init();
    if (error) throw new Error(`GPU particles unavailable: ${error}`);

    // One point per texel; "reference" tells each point which texel holds its state.
    const geometry = new THREE.BufferGeometry();
    const refs = new Float32Array(count * 2);
    for (let i = 0; i < count; i++) {
      refs[i * 2] = ((i % side) + 0.5) / side;
      refs[i * 2 + 1] = (Math.floor(i / side) + 0.5) / side;
    }
    geometry.setAttribute("position", new THREE.BufferAttribute(new Float32Array(count * 3), 3));
    geometry.setAttribute("reference", new THREE.BufferAttribute(refs, 2));

    this.material = new THREE.ShaderMaterial({
      vertexShader: renderVertex,
      fragmentShader: renderFragment,
      transparent: true,
      depthWrite: false,
      uniforms: {
        tPosition: { value: null },
        tVelocity: { value: null },
        tHome: { value: homeTex },
        uSize: { value: TUNING.pointSize },
        uPixelRatio: { value: Math.min(window.devicePixelRatio, 1.75) },
        uLight: { value: new THREE.Color("#f8f7f3") },
        uDark: { value: new THREE.Color("#3b5578") },
        uFast: { value: new THREE.Color("#dbe8ff") },
      },
    });
    this.geometry = geometry;
    this.gpu = gpu;
    this.velVar = velVar;
    this.posVar = posVar;
    this.homeTex = homeTex;
    this.fluid = new FluidField(gl, TUNING.fluid);
  }

  /** Record a pointer position in page (client) pixels. */
  pointerMove(clientX: number, clientY: number) {
    this.pointer.x = clientX;
    this.pointer.y = clientY;
    this.pointer.moved = true;
  }

  update(obj: THREE.Object3D, camera: THREE.Camera, elapsed: number, rawDt: number) {
    const dt = Math.min(rawDt, 1 / 20);
    const dtRatio = dt * 60;

    // Pointer movement -> fluid stir (canvas coordinates, 0..1, y up).
    const rect = this.gl.domElement.getBoundingClientRect();
    const p = this.pointer;
    const x = (p.x - rect.left) / rect.width;
    const y = 1 - (p.y - rect.top) / rect.height;
    if (p.moved) {
      if (p.has && x > -0.1 && x < 1.1 && y > -0.1 && y < 1.1) this.fluid.addSplat(x, y, x - p.px, y - p.py);
      p.px = x;
      p.py = y;
      p.has = true;
      p.moved = false;
    }
    this.fluid.aspect = rect.width / Math.max(rect.height, 1);
    this.fluid.step(dt);

    // Camera screen axes in the emblem's local space, and fluid units -> world units.
    obj.updateMatrixWorld();
    this.mvp.multiplyMatrices(camera.projectionMatrix, camera.matrixWorldInverse).multiply(obj.matrixWorld);
    this.inv.copy(obj.matrixWorld).invert();
    this.right.setFromMatrixColumn(camera.matrixWorld, 0).transformDirection(this.inv);
    this.up.setFromMatrixColumn(camera.matrixWorld, 1).transformDirection(this.inv);
    const fov = (camera as THREE.PerspectiveCamera).fov ?? 38;
    const distance = camera.position.distanceTo(obj.getWorldPosition(this.worldPos));
    const viewHeight = 2 * distance * Math.tan(THREE.MathUtils.degToRad(fov / 2));
    const scale = obj.getWorldScale(this.worldScale).x || 1;
    // fluid texels/s -> canvas fraction/s -> world units/s -> per frame
    const flowToWorld = ((viewHeight / TUNING.fluid.resolution) * TUNING.flowScale) / scale / 60;

    const u = this.velVar.material.uniforms;
    u.tFluid.value = this.fluid.texture;
    u.uMVP.value.copy(this.mvp);
    u.uRight.value.copy(this.right);
    u.uUp.value.copy(this.up);
    u.uDtRatio.value = dtRatio;
    u.uTime.value = elapsed;
    u.uFlowToWorld.value = flowToWorld;
    this.posVar.material.uniforms.uDtRatio.value = dtRatio;
    this.gpu.compute();

    this.material.uniforms.tPosition.value = this.gpu.getCurrentRenderTarget(this.posVar).texture;
    this.material.uniforms.tVelocity.value = this.gpu.getCurrentRenderTarget(this.velVar).texture;
  }

  dispose() {
    this.gpu.dispose();
    this.homeTex.dispose();
    this.fluid.dispose();
    this.geometry.dispose();
    this.material.dispose();
  }
}

export default function FluidParticleEmblem() {
  const { gl, camera, size } = useThree();
  const points = useRef<THREE.Points>(null);
  const side = size.width < 768 ? TUNING.sideMobile : TUNING.sideDesktop;
  const system = useMemo(() => new FluidParticleSystem(gl, side), [gl, side]);

  useEffect(() => () => system.dispose(), [system]);

  // Track the pointer on the window, so text layered over the canvas doesn't block it.
  useEffect(() => {
    const onMove = (e: PointerEvent) => system.pointerMove(e.clientX, e.clientY);
    window.addEventListener("pointermove", onMove, { passive: true });
    return () => window.removeEventListener("pointermove", onMove);
  }, [system]);

  useFrame((state, dt) => {
    if (points.current) system.update(points.current, camera, state.clock.elapsedTime, dt);
  });

  return <points ref={points} geometry={system.geometry} material={system.material} frustumCulled={false} />;
}
