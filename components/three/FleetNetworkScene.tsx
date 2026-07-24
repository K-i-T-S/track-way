"use client";

import { useEffect, useRef } from "react";
import * as THREE from "three";

// Deliberately NOT using @react-three/fiber here: its react-reconciler
// dependency reads React's internal shared-state singletons
// (ReactCurrentOwner/ReactCurrentBatchConfig), and Next.js 15's App Router
// always substitutes its own internally-vendored React build for the
// browser bundle — a React-19-shaped build, regardless of the version
// declared in package.json — which react-reconciler@0.27.0 (built for
// React 18's internals shape) cannot read. Driving three.js imperatively
// via a plain ref sidesteps React's reconciler entirely, so this class of
// bug can't happen here.

const NODE_COUNT = 22;
const MAX_DPR = 1.75;

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

function buildRouteLineGeometry(points: THREE.Vector3[]): THREE.BufferGeometry {
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
  const geometry = new THREE.BufferGeometry();
  geometry.setAttribute(
    "position",
    new THREE.Float32BufferAttribute(positions, 3),
  );
  return geometry;
}

export default function FleetNetworkScene(): React.ReactElement {
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    const scene = new THREE.Scene();
    const camera = new THREE.PerspectiveCamera(45, 1, 0.1, 100);
    camera.position.set(0, 0, 6);

    const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, MAX_DPR));
    container.appendChild(renderer.domElement);

    scene.add(new THREE.AmbientLight(0xffffff, 1.2));
    const pointLight = new THREE.PointLight(0x00e5d4, 40);
    pointLight.position.set(5, 5, 5);
    scene.add(pointLight);

    const rig = new THREE.Group();
    scene.add(rig);

    const points = Array.from({ length: NODE_COUNT }, () =>
      randomPointInSphere(2.1),
    );

    const lineGeometry = buildRouteLineGeometry(points);
    const lineMaterial = new THREE.LineBasicMaterial({
      color: 0x00e5d4,
      transparent: true,
      opacity: 0.25,
    });
    rig.add(new THREE.LineSegments(lineGeometry, lineMaterial));

    const nodeGeometry = new THREE.SphereGeometry(0.045, 12, 12);
    const nodeMaterial = new THREE.MeshBasicMaterial({ color: 0x00e5d4 });
    const nodeMeshes = points.map((p) => {
      const mesh = new THREE.Mesh(nodeGeometry, nodeMaterial);
      mesh.position.copy(p);
      rig.add(mesh);
      return mesh;
    });

    function resize() {
      if (!container) return;
      const { clientWidth: width, clientHeight: height } = container;
      if (width === 0 || height === 0) return;
      camera.aspect = width / height;
      camera.updateProjectionMatrix();
      renderer.setSize(width, height);
    }
    resize();
    const resizeObserver = new ResizeObserver(resize);
    resizeObserver.observe(container);

    const clock = new THREE.Clock();
    let frameId: number;
    function animate() {
      frameId = requestAnimationFrame(animate);
      const elapsed = clock.getElapsedTime();
      rig.rotation.y += clock.getDelta() * 0.12;
      nodeMeshes.forEach((mesh, i) => {
        const s = 1 + Math.sin(elapsed * 1.6 + i) * 0.25;
        mesh.scale.setScalar(s);
      });
      renderer.render(scene, camera);
    }
    animate();

    return () => {
      cancelAnimationFrame(frameId);
      resizeObserver.disconnect();
      lineGeometry.dispose();
      lineMaterial.dispose();
      nodeGeometry.dispose();
      nodeMaterial.dispose();
      renderer.dispose();
      container.removeChild(renderer.domElement);
    };
  }, []);

  return <div ref={containerRef} className="h-full w-full touch-none" />;
}
