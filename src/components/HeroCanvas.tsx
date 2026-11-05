"use client";

import { Canvas, useFrame, useThree } from "@react-three/fiber";
import { Float } from "@react-three/drei";
import { useEffect, useMemo, useRef, useState } from "react";
import * as THREE from "three";
import ParticleEmblem from "./ParticleEmblem";
import FluidParticleEmblem, { supportsGpuParticles } from "./FluidParticleEmblem";

const STEEL = "#5b7ca6";
const STEEL_BRIGHT = "#8fb0d8";

/** Scroll progress through the hero (0 at top → 1 when the hero has scrolled away). */
const scrollState = { p: 0 };

/* -------------------------------------------------------------
   Orbiting network: nodes + links = "connected systems".
-------------------------------------------------------------- */
function Network({ count = 64 }: { count?: number }) {
  const group = useRef<THREE.Group>(null);

  const { points, lines } = useMemo(() => {
    const rand = mulberry32(7);
    const pts: THREE.Vector3[] = [];
    for (let i = 0; i < count; i++) {
      const r = 2.3 + rand() * 1.6;
      const t = rand() * Math.PI * 2;
      const p = Math.acos(2 * rand() - 1);
      pts.push(
        new THREE.Vector3(r * Math.sin(p) * Math.cos(t), r * Math.cos(p) * 0.7, r * Math.sin(p) * Math.sin(t)),
      );
    }
    const seg: number[] = [];
    for (let i = 0; i < pts.length; i++) {
      let links = 0;
      for (let j = i + 1; j < pts.length && links < 3; j++) {
        if (pts[i].distanceTo(pts[j]) < 1.25) {
          seg.push(pts[i].x, pts[i].y, pts[i].z, pts[j].x, pts[j].y, pts[j].z);
          links++;
        }
      }
    }
    const lineGeo = new THREE.BufferGeometry();
    lineGeo.setAttribute("position", new THREE.Float32BufferAttribute(seg, 3));
    return { points: pts, lines: lineGeo };
  }, [count]);

  useFrame((_, dt) => {
    if (group.current) group.current.rotation.y += dt * 0.06;
  });

  return (
    <group ref={group}>
      <lineSegments geometry={lines}>
        <lineBasicMaterial color={STEEL} transparent opacity={0.35} />
      </lineSegments>
      {points.map((p, i) => (
        <mesh key={i} position={p}>
          <sphereGeometry args={[i % 9 === 0 ? 0.06 : 0.032, 12, 12]} />
          <meshBasicMaterial color={i % 9 === 0 ? STEEL_BRIGHT : STEEL} />
        </mesh>
      ))}
    </group>
  );
}

/* -------------------------------------------------------------
   Emblem: GPU fluid particles where supported, CPU particles otherwise.
-------------------------------------------------------------- */
function Emblem() {
  const gl = useThree((s) => s.gl);
  return supportsGpuParticles(gl) ? <FluidParticleEmblem /> : <ParticleEmblem />;
}

/* -------------------------------------------------------------
   Scene rig: scroll-driven exit (moves up and shrinks; no rotation).
-------------------------------------------------------------- */
function Rig({ children }: { children: React.ReactNode }) {
  const ref = useRef<THREE.Group>(null);
  useFrame((state, dt) => {
    const g = ref.current;
    if (!g) return;
    const p = scrollState.p;
    const k = 1 - Math.exp(-dt * 4);
    // The canvas is full width: sit the emblem at ~75% across on desktop, centred on mobile.
    const targetX = state.size.width >= 768 ? state.viewport.width * 0.25 : 0;
    g.position.x = THREE.MathUtils.lerp(g.position.x, targetX, k);
    g.position.y = THREE.MathUtils.lerp(g.position.y, p * 1.4, k);
    const s = 1 - p * 0.35;
    g.scale.setScalar(THREE.MathUtils.lerp(g.scale.x, s, k));
  });
  return <group ref={ref}>{children}</group>;
}

export default function HeroCanvas() {
  const wrap = useRef<HTMLDivElement>(null);
  const [visible, setVisible] = useState(true);

  useEffect(() => {
    const el = wrap.current;
    if (!el) return;
    const io = new IntersectionObserver(([e]) => setVisible(e.isIntersecting), { rootMargin: "100px" });
    io.observe(el);
    const onScroll = () => {
      const h = el.offsetHeight || window.innerHeight;
      scrollState.p = Math.min(1, Math.max(0, window.scrollY / h));
    };
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => {
      io.disconnect();
      window.removeEventListener("scroll", onScroll);
    };
  }, []);

  return (
    <div ref={wrap} className="absolute inset-0">
      <Canvas
        frameloop={visible ? "always" : "never"}
        dpr={[1, 1.75]}
        camera={{ position: [0, 0, 7.8], fov: 38 }}
        gl={{ antialias: true, alpha: true, powerPreference: "high-performance" }}
        aria-hidden
      >
        <Rig>
          {/* Gentle hover only: the emblem never rotates */}
          <Float speed={1.4} rotationIntensity={0} floatIntensity={0.6} floatingRange={[-0.08, 0.08]}>
            <Emblem />
          </Float>
          <Network />
        </Rig>
      </Canvas>
    </div>
  );
}

function mulberry32(a: number) {
  return () => {
    let t = (a += 0x6d2b79f5);
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}
