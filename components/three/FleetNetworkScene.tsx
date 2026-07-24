"use client";

import { useMemo, useRef } from "react";
import { Canvas, useFrame } from "@react-three/fiber";
import * as THREE from "three";

const NODE_COUNT = 22;

function randomPointInSphere(radius: number): THREE.Vector3 {
  const u = Math.random();
  const v = Math.random();
  const theta = 2 * Math.PI * u;
  const phi = Math.acos(2 * v - 1);
  const r = radius * Math.cbrt(Math.random());
  return new THREE.Vector3(
    r * Math.sin(phi) * Math.cos(theta),
    r * Math.sin(phi) * Math.sin(theta) * 0.6,
    r * Math.cos(phi),
  );
}

function Nodes({ points }: { points: THREE.Vector3[] }) {
  const ref = useRef<THREE.Group>(null);

  useFrame(({ clock }) => {
    if (!ref.current) return;
    ref.current.children.forEach((child, i) => {
      const s = 1 + Math.sin(clock.getElapsedTime() * 1.6 + i) * 0.25;
      child.scale.setScalar(s);
    });
  });

  return (
    <group ref={ref}>
      {points.map((p, i) => (
        <mesh key={i} position={p}>
          <sphereGeometry args={[0.045, 12, 12]} />
          <meshBasicMaterial color="#00E5D4" />
        </mesh>
      ))}
    </group>
  );
}

function RouteLines({ points }: { points: THREE.Vector3[] }) {
  const geometry = useMemo(() => {
    const positions: number[] = [];
    // Connect each node to its two nearest neighbors for a sparse network,
    // not a dense mesh — keeps draw calls and visual noise low.
    points.forEach((p, i) => {
      const distances = points
        .map((q, j) => ({ j, d: i === j ? Infinity : p.distanceTo(q) }))
        .sort((a, b) => a.d - b.d)
        .slice(0, 2);
      distances.forEach(({ j }) => {
        const neighbor = points[j];
        if (!neighbor) return;
        positions.push(p.x, p.y, p.z, neighbor.x, neighbor.y, neighbor.z);
      });
    });
    const geo = new THREE.BufferGeometry();
    geo.setAttribute(
      "position",
      new THREE.Float32BufferAttribute(positions, 3),
    );
    return geo;
  }, [points]);

  return (
    <lineSegments geometry={geometry}>
      <lineBasicMaterial color="#00E5D4" transparent opacity={0.25} />
    </lineSegments>
  );
}

function RotatingRig() {
  const ref = useRef<THREE.Group>(null);
  const points = useMemo(
    () => Array.from({ length: NODE_COUNT }, () => randomPointInSphere(2.1)),
    [],
  );

  useFrame((_, delta) => {
    if (ref.current) ref.current.rotation.y += delta * 0.12;
  });

  return (
    <group ref={ref}>
      <RouteLines points={points} />
      <Nodes points={points} />
    </group>
  );
}

export default function FleetNetworkScene() {
  return (
    <Canvas
      camera={{ position: [0, 0, 6], fov: 45 }}
      className="!touch-none"
      gl={{ antialias: true, alpha: true }}
      dpr={[1, 1.75]}
    >
      <ambientLight intensity={1.2} />
      <pointLight position={[5, 5, 5]} intensity={40} color="#00E5D4" />
      <RotatingRig />
    </Canvas>
  );
}
