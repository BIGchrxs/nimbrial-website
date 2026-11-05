"use client";

import { Canvas, useFrame } from "@react-three/fiber";
import { Environment, Lightformer, Float } from "@react-three/drei";
import { useEffect, useMemo, useRef, useState } from "react";
import * as THREE from "three";
import { SVGLoader } from "three/examples/jsm/loaders/SVGLoader.js";
import { EMBLEM_PATH, EMBLEM_VIEWBOX } from "./brandPaths";

const IVORY = "#f8f7f3";
const STEEL = "#5b7ca6";
const STEEL_BRIGHT = "#8fb0d8";

/** Scroll progress through the hero (0 at top → 1 when the hero has scrolled away). */
const scrollState = { p: 0 };

/* -------------------------------------------------------------
   The real emblem, extruded into 3D from the logo SVG path.
-------------------------------------------------------------- */
function EmblemMesh() {
  const geometry = useMemo(() => {
    const data = new SVGLoader().parse(
      `<svg xmlns="http://www.w3.org/2000/svg" viewBox="${EMBLEM_VIEWBOX}"><path fill-rule="evenodd" d="${EMBLEM_PATH}"/></svg>`,
    );
    const shapes = data.paths.flatMap((p) => SVGLoader.createShapes(p));
    const g = new THREE.ExtrudeGeometry(shapes, {
      depth: 70,
      bevelEnabled: true,
      bevelThickness: 20,
      bevelSize: 11,
      bevelSegments: 10,
      curveSegments: 40,
    });
    g.center();
    // Fit to ~3 world units (SVG y-down is corrected by the mesh rotation below).
    const s = 3.1 / 593;
    g.scale(s, s, s);
    return g;
  }, []);

  return (
    // rotate 180° on X instead of a negative scale, so face normals stay outward-facing
    <mesh geometry={geometry} rotation={[Math.PI, 0, 0]}>
      <meshPhysicalMaterial
        color={IVORY}
        roughness={0.24}
        metalness={0.06}
        clearcoat={1}
        clearcoatRoughness={0.1}
        sheen={0.4}
        sheenColor={STEEL_BRIGHT}
      />
    </mesh>
  );
}

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
   Scene rig: cursor parallax + scroll-driven exit.
-------------------------------------------------------------- */
function Rig({ children }: { children: React.ReactNode }) {
  const ref = useRef<THREE.Group>(null);
  useFrame((state, dt) => {
    const g = ref.current;
    if (!g) return;
    const p = scrollState.p;
    const k = 1 - Math.exp(-dt * 4);
    g.rotation.y = THREE.MathUtils.lerp(g.rotation.y, state.pointer.x * 0.45 + p * 1.6, k);
    g.rotation.x = THREE.MathUtils.lerp(g.rotation.x, -state.pointer.y * 0.3 + p * 0.5, k);
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
        <ambientLight intensity={0.35} />
        <directionalLight position={[4, 5, 6]} intensity={1.6} />
        <pointLight position={[-5, -2, 2]} intensity={14} color={STEEL_BRIGHT} />
        <Rig>
          <Float speed={1.4} rotationIntensity={0.35} floatIntensity={0.6}>
            <EmblemMesh />
          </Float>
          <Network />
        </Rig>
        {/* Studio lighting built from light panels — no HDR file download needed */}
        <Environment resolution={256} frames={1}>
          <Lightformer form="rect" intensity={3} position={[0, 4, 4]} scale={[10, 2, 1]} />
          <Lightformer form="rect" intensity={2} color={STEEL_BRIGHT} position={[-5, 0, 2]} scale={[2, 8, 1]} />
          <Lightformer form="ring" intensity={2.5} position={[5, 1, 3]} scale={3} />
          <Lightformer form="rect" intensity={0.8} color={STEEL} position={[0, -4, 2]} scale={[10, 1, 1]} />
        </Environment>
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
