"use client";

import { useFrame, useThree } from "@react-three/fiber";
import { useEffect, useMemo, useRef } from "react";
import * as THREE from "three";
import { sampleEmblem } from "./emblemSampling";

/*
  The Nimbrial emblem drawn as a cloud of particles.
  Moving the pointer through it sweeps particles along the direction of travel with a swirl;
  fast particles glow brighter; everything springs back to the logo shape. A still pointer
  has no effect. The emblem itself never rotates.
*/

// Motion tuning
const RADIUS = 0.75; // how far from the pointer particles are affected
const PUSH = 0.9; // how strongly particles follow the pointer's movement
const SWIRL = 0.55; // sideways swirl around the pointer path
const SCATTER_Z = 0.35; // depth scatter, so the cloud breaks up in 3D
const SPRING = 7; // pull back to the logo shape
const DAMPING = 3.4; // how quickly movement settles
const MAX_POINTER_SPEED = 40; // world units/s; caps sudden jumps

/* ---------------------------------------------------------------
   Point sprites shaded like tiny spheres; speed brightens them.
---------------------------------------------------------------- */
const vertexShader = /* glsl */ `
  attribute float aSpeed;
  attribute float aSeed;
  uniform float uSize;
  uniform float uPixelRatio;
  varying float vSpeed;
  varying float vDepth;
  void main() {
    vec4 mv = modelViewMatrix * vec4(position, 1.0);
    gl_Position = projectionMatrix * mv;
    vSpeed = clamp(aSpeed / 2.2, 0.0, 1.0);
    vDepth = position.z;
    float size = uSize * (0.75 + aSeed * 0.5) * (1.0 + vSpeed * 0.6);
    gl_PointSize = size * uPixelRatio * (8.0 / -mv.z);
  }
`;

const fragmentShader = /* glsl */ `
  uniform vec3 uBase;
  uniform vec3 uShadow;
  uniform vec3 uGlow;
  varying float vSpeed;
  varying float vDepth;
  void main() {
    vec2 c = gl_PointCoord * 2.0 - 1.0;
    float r2 = dot(c, c);
    if (r2 > 1.0) discard;
    // Fake sphere lighting from the upper left
    vec3 n = vec3(c.x, -c.y, sqrt(1.0 - r2));
    float light = clamp(dot(n, normalize(vec3(-0.45, 0.6, 0.65))), 0.0, 1.0);
    float front = clamp(vDepth * 1.6 + 0.5, 0.0, 1.0);
    vec3 col = mix(uShadow, uBase, 0.35 + 0.65 * light * (0.6 + 0.4 * front));
    col = mix(col, uGlow, vSpeed);
    float alpha = smoothstep(1.0, 0.75, r2) * (0.92 - 0.25 * vSpeed);
    gl_FragColor = vec4(col, alpha);
  }
`;

export default function ParticleEmblem() {
  const points = useRef<THREE.Points>(null);
  const { camera, gl, size } = useThree();
  const count = size.width < 768 ? 7000 : 14000;

  const { geometry, home, seeds } = useMemo(() => {
    const { home, seeds } = sampleEmblem(count);
    const geometry = new THREE.BufferGeometry();
    const position = new THREE.BufferAttribute(home.slice(), 3);
    position.setUsage(THREE.DynamicDrawUsage);
    const speedAttr = new THREE.BufferAttribute(new Float32Array(count), 1);
    speedAttr.setUsage(THREE.DynamicDrawUsage);
    geometry.setAttribute("position", position);
    geometry.setAttribute("aSpeed", speedAttr);
    geometry.setAttribute("aSeed", new THREE.BufferAttribute(seeds, 1));
    geometry.computeBoundingSphere();
    geometry.boundingSphere!.radius *= 3; // particles fly outside the logo; avoid culling them
    return { geometry, home, seeds };
  }, [count]);

  const material = useMemo(
    () =>
      new THREE.ShaderMaterial({
        vertexShader,
        fragmentShader,
        transparent: true,
        depthWrite: false,
        uniforms: {
          uSize: { value: 3.4 },
          uPixelRatio: { value: Math.min(window.devicePixelRatio, 1.75) },
          uBase: { value: new THREE.Color("#ffffff") },
          uShadow: { value: new THREE.Color("#aab6c6") },
          uGlow: { value: new THREE.Color("#ffffff") },
        },
      }),
    [],
  );

  useEffect(
    () => () => {
      geometry.dispose();
      material.dispose();
    },
    [geometry, material],
  );

  // Pointer tracking on the window, so text layered over the canvas doesn't block it.
  const pointer = useRef({ x: 0, y: 0, lastMove: 0, fresh: false });
  useEffect(() => {
    const onMove = (e: PointerEvent) => {
      const p = pointer.current;
      p.x = e.clientX;
      p.y = e.clientY;
      p.lastMove = performance.now();
      p.fresh = true;
    };
    window.addEventListener("pointermove", onMove, { passive: true });
    return () => window.removeEventListener("pointermove", onMove);
  }, []);

  // Mutable per-frame simulation state lives in a ref (React treats useMemo values as read-only).
  const simRef = useRef<ReturnType<typeof createSim> | null>(null);

  useFrame((_, rawDt) => {
    const obj = points.current;
    if (!obj) return;
    const n = home.length / 3;
    if (!simRef.current || simRef.current.velocity.length !== n * 3) simRef.current = createSim(n);
    const sim = simRef.current;
    const dt = Math.min(rawDt, 1 / 30);
    const p = pointer.current;

    // Pointer position on the emblem's plane, in the emblem's local space
    let px = 0;
    let py = 0;
    let pvx = 0;
    let pvy = 0;
    let active = false;
    const idle = performance.now() - p.lastMove > 120;
    if (p.fresh || !idle) {
      const rect = gl.domElement.getBoundingClientRect();
      sim.ndc.set(((p.x - rect.left) / rect.width) * 2 - 1, -((p.y - rect.top) / rect.height) * 2 + 1);
      sim.raycaster.setFromCamera(sim.ndc, camera);
      obj.updateMatrixWorld();
      sim.normal.set(0, 0, 1).transformDirection(obj.matrixWorld);
      sim.origin.setFromMatrixPosition(obj.matrixWorld);
      sim.plane.setFromNormalAndCoplanarPoint(sim.normal, sim.origin);
      if (sim.raycaster.ray.intersectPlane(sim.plane, sim.hit)) {
        sim.local.copy(sim.hit);
        obj.worldToLocal(sim.local);
        if (sim.hasPrev && !idle) {
          sim.vel.copy(sim.local).sub(sim.prev).divideScalar(Math.max(dt, 1 / 240));
          if (sim.vel.length() > MAX_POINTER_SPEED) sim.vel.setLength(MAX_POINTER_SPEED);
        } else {
          sim.vel.set(0, 0, 0); // first move after a pause: no jump
        }
        sim.prev.copy(sim.local);
        sim.hasPrev = true;
        px = sim.local.x;
        py = sim.local.y;
        pvx = sim.vel.x;
        pvy = sim.vel.y;
        active = Math.abs(pvx) + Math.abs(pvy) > 0.05;
      }
      p.fresh = false;
    } else {
      sim.hasPrev = false;
    }

    if (!active && sim.settled) return; // nothing moving: skip the work

    const pos = obj.geometry.attributes.position.array as Float32Array;
    const speed = obj.geometry.attributes.aSpeed.array as Float32Array;
    const velocity = sim.velocity;
    const pSpeed = Math.hypot(pvx, pvy);
    const damp = Math.exp(-DAMPING * dt);
    const r2max = RADIUS * RADIUS;
    let moving = 0;

    for (let i = 0; i < n; i++) {
      const ix = i * 3;
      let vx = velocity[ix];
      let vy = velocity[ix + 1];
      let vz = velocity[ix + 2];
      const x = pos[ix];
      const y = pos[ix + 1];
      const z = pos[ix + 2];

      if (active) {
        const dx = x - px;
        const dy = y - py;
        const d2 = dx * dx + dy * dy;
        if (d2 < r2max) {
          const d = Math.sqrt(d2) + 1e-4;
          const falloff = (1 - d / RADIUS) ** 2;
          const s = seeds[i];
          const k = falloff * (0.55 + s * 0.9) * 60 * dt;
          vx += pvx * PUSH * k * 0.1;
          vy += pvy * PUSH * k * 0.1;
          // swirl: perpendicular to the offset from the pointer, direction set per particle
          const dir = s > 0.5 ? 1 : -1;
          vx += (-dy / d) * pSpeed * SWIRL * k * 0.1 * dir;
          vy += (dx / d) * pSpeed * SWIRL * k * 0.1 * dir;
          vz += (s - 0.5) * pSpeed * SCATTER_Z * k * 0.1;
        }
      }

      // spring back home + damping
      vx = (vx + (home[ix] - x) * SPRING * dt) * damp;
      vy = (vy + (home[ix + 1] - y) * SPRING * dt) * damp;
      vz = (vz + (home[ix + 2] - z) * SPRING * dt) * damp;

      pos[ix] = x + vx * dt;
      pos[ix + 1] = y + vy * dt;
      pos[ix + 2] = z + vz * dt;
      velocity[ix] = vx;
      velocity[ix + 1] = vy;
      velocity[ix + 2] = vz;

      const sp = Math.sqrt(vx * vx + vy * vy + vz * vz);
      speed[i] = sp;
      const off = Math.abs(home[ix] - pos[ix]) + Math.abs(home[ix + 1] - pos[ix + 1]);
      if (sp > 0.002 || off > 0.002) moving++;
    }

    sim.settled = moving === 0;
    obj.geometry.attributes.position.needsUpdate = true;
    obj.geometry.attributes.aSpeed.needsUpdate = true;
  });

  return <points ref={points} geometry={geometry} material={material} frustumCulled={false} />;
}

// Reusable objects and buffers for the per-frame simulation (no allocations inside the loop).
function createSim(count: number) {
  return {
    velocity: new Float32Array(count * 3),
    raycaster: new THREE.Raycaster(),
    plane: new THREE.Plane(new THREE.Vector3(0, 0, 1), 0),
    ndc: new THREE.Vector2(),
    hit: new THREE.Vector3(),
    normal: new THREE.Vector3(),
    origin: new THREE.Vector3(),
    local: new THREE.Vector3(),
    prev: new THREE.Vector3(),
    hasPrev: false,
    vel: new THREE.Vector3(),
    settled: true,
  };
}
