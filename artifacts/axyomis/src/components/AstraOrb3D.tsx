// @ts-nocheck
import React, { useRef, useEffect } from 'react';
import { Canvas, useFrame } from '@react-three/fiber';
import { MeshWobbleMaterial, Sparkles, OrbitControls, Effects } from '@react-three/drei';
import * as THREE from 'three';

interface AstraOrb3DProps {
  state: 'idle' | 'listening' | 'thinking' | 'speaking';
  analyserRef?: React.MutableRefObject<AnalyserNode | null>;
  size?: number;
}

const STATE_PALETTE: Record<AstraOrb3DProps['state'], string[]> = {
  idle: ['#4285f4', '#9b72cb', '#d96570', '#f59e0b', '#4285f4'],
  listening: ['#22d3ee', '#3b82f6', '#a855f7', '#22d3ee', '#3b82f6'],
  thinking: ['#a855f7', '#ec4899', '#f59e0b', '#22d3ee', '#a855f7'],
  speaking: ['#4285f4', '#9b72cb', '#ec4899', '#f59e0b', '#22d3ee'],
};

function OrbMesh({ state, analyserRef }: { state: AstraOrb3DProps['state']; analyserRef?: React.MutableRefObject<AnalyserNode | null> }) {
  const mesh = useRef<any>(null);
  const materialRef = useRef<any>(null);
  const posRef = useRef(0);
  const dataRef = useRef<Uint8Array | null>(null);

  useFrame((stateFrame, delta) => {
    posRef.current += delta * 0.8;

    // audio level sampling
    let level = 0;
    const analyser = analyserRef?.current;
    if (analyser && (state === 'speaking' || state === 'listening')) {
      if (!dataRef.current || dataRef.current.length !== analyser.frequencyBinCount) {
        dataRef.current = new Uint8Array(analyser.frequencyBinCount);
      }
      const data = dataRef.current;
      analyser.getByteTimeDomainData(data as unknown as Uint8Array);
      let sum = 0;
      for (let i = 0; i < data.length; i++) {
        const v = (data[i] - 128) / 128;
        sum += v * v;
      }
      const rms = Math.sqrt(sum / data.length);
      level = Math.min(1, rms * 6);
    }

    // breathing / wobble factor
    const base = state === 'speaking' ? 0.35 : state === 'thinking' ? 0.25 : state === 'listening' ? 0.18 : 0.08;
    const wobble = base + level * 0.9 + Math.sin(posRef.current * 3.0) * 0.06;

    if (mesh.current) {
      mesh.current.scale.lerp(new THREE.Vector3(1 + wobble, 1 + wobble, 1 + wobble), 0.12);
      mesh.current.rotation.y += delta * 0.2 + level * 0.08;
      mesh.current.rotation.x = Math.sin(posRef.current * 0.6) * 0.08;
    }

    if (materialRef.current) {
      // materialRef.factor influences the wobble effect in MeshWobbleMaterial
      materialRef.current.factor = 0.8 + level * 1.6 + Math.sin(posRef.current * 2.2) * 0.12;
      materialRef.current.speed = 1.2 + level * 2.0;
    }
  });

  const colors = STATE_PALETTE[state];
  const orbColor = colors[1];
  const accentColor = colors[3];

  return (
    <group>
      <mesh ref={mesh} position={[0, 0, 0]}>
        <sphereGeometry args={[1, 128, 128]} />
        <MeshWobbleMaterial
          ref={materialRef as any}
          {...({
            envMapIntensity: 0.8,
            metalness: 0.1,
            roughness: 0.2,
            color: orbColor,
            emissive: accentColor,
            emissiveIntensity: 0.45,
            clearcoat: 0.28,
            clearcoatRoughness: 0.22,
            factor: 0.6,
            speed: 1.0,
          } as any)}
        />
      </mesh>

      <Sparkles count={120} scale={[2.2, 2.2, 2.2]} noise={2.2} size={6} speed={0.4} />
    </group>
  );
}

const AstraOrb3D: React.FC<AstraOrb3DProps> = ({ state, analyserRef, size = 320 }) => {
  // canvas pixel ratio management
  return (
    <div style={{ width: size, height: size }}>
      <Canvas dpr={Math.min(2, window.devicePixelRatio)} camera={{ position: [0, 0, 4], fov: 40 }}>
        <ambientLight intensity={0.6} />
        <pointLight position={[5, 5, 5]} intensity={1.2} />
        <pointLight position={[-5, -5, -5]} intensity={0.8} />
        <OrbMesh state={state} analyserRef={analyserRef} />
        <OrbitControls enableZoom={false} enablePan={false} enableRotate={false} />
      </Canvas>
    </div>
  );
};

export default AstraOrb3D;
