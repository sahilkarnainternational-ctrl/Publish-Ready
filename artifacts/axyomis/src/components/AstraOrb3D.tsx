/// <reference types="@react-three/fiber" />
/// <reference types="three" />
import React, { useRef, useEffect, useMemo } from 'react';
import { Canvas, useFrame } from '@react-three/fiber';
import { Sparkles, OrbitControls } from '@react-three/drei';
import { EffectComposer, Bloom } from '@react-three/postprocessing';
import * as THREE from 'three';

const stateColors = {
  idle: new THREE.Color(0x4ef3ff),
  listening: new THREE.Color(0x48f9ff),
  thinking: new THREE.Color(0x906cff),
  speaking: new THREE.Color(0xff77ff),
};

// Shader-based orb constants
const vertexShader = `
  varying vec3 vNormal;
  varying vec3 vPosition;
  varying float vNoise;
  uniform float uTime;

  // Simplex 3D noise (Ashima) start
  vec4 mod289(vec4 x){return x - floor(x * (1.0 / 289.0)) * 289.0;}
  vec4 permute(vec4 x){return mod289(((x*34.0)+1.0)*x);} 
  vec4 taylorInvSqrt(vec4 r){return 1.79284291400159 - 0.85373472095314 * r;}
  float snoise(vec3 v){
    const vec2  C = vec2(1.0/6.0, 1.0/3.0);
    const vec4  D = vec4(0.0, 0.5, 1.0, 2.0);
    vec3 i  = floor(v + dot(v, C.yyy) );
    vec3 x0 = v - i + dot(i, C.xxx);
    vec3 g = step(x0.yzx, x0.xyz);
    vec3 l = 1.0 - g;
    vec3 i1 = min( g.xyz, l.zxy );
    vec3 i2 = max( g.xyz, l.zxy );
    vec3 x1 = x0 - i1 + C.xxx;
    vec3 x2 = x0 - i2 + C.yyy;
    vec3 x3 = x0 - D.yyy;
    i = mod289(i);
    vec4 p = permute( permute( permute(
               i.z + vec4(0.0, i1.z, i2.z, 1.0 ))
             + i.y + vec4(0.0, i1.y, i2.y, 1.0 ))
             + i.x + vec4(0.0, i1.x, i2.x, 1.0 ));
    float n_ = 0.142857142857;
    vec3 ns = n_ * D.wyz - D.xzx;
    vec4 j = p - 49.0 * floor(p * ns.z * ns.z);
    vec4 x_ = floor(j * ns.z);
    vec4 y_ = floor(j - 7.0 * x_ );
    vec4 x = x_ *ns.x + ns.y;
    vec4 y = y_ *ns.x + ns.y;
    vec4 h = 1.0 - abs(x) - abs(y);
    vec4 b0 = vec4( x.xy, y.xy );
    vec4 b1 = vec4( x.zw, y.zw );
    vec4 s0 = floor(b0)*2.0 + 1.0;
    vec4 s1 = floor(b1)*2.0 + 1.0;
    vec4 sh = -step(h, vec4(0.0));
    vec4 a0 = b0.xzyw + s0.xzyw*sh.xxyy;
    vec4 a1 = b1.xzyw + s1.xzyw*sh.zzww;
    vec3 p0 = vec3(a0.xy,h.x);
    vec3 p1 = vec3(a0.zw,h.y);
    vec3 p2 = vec3(a1.xy,h.z);
    vec3 p3 = vec3(a1.zw,h.w);
    vec4 norm = taylorInvSqrt(vec4(dot(p0,p0), dot(p1,p1), dot(p2,p2), dot(p3,p3)));
    p0 *= norm.x; p1 *= norm.y; p2 *= norm.z; p3 *= norm.w;
    vec4 m = max(0.6 - vec4(dot(x0,x0), dot(x1,x1), dot(x2,x2), dot(x3,x3)), 0.0);
    m = m * m;
    return 42.0 * dot( m*m, vec4( dot(p0,x0), dot(p1,x1), dot(p2,x2), dot(p3,x3) ) );
  }
  // Simplex noise end

  void main(){
    vNormal = normal;
    vPosition = position;
    float noise = snoise(position * 1.8 + vec3(0.0, uTime * 0.2, uTime * 0.15));
    vNoise = noise;
    vec3 displaced = position + normal * noise * 0.35;
    gl_Position = projectionMatrix * modelViewMatrix * vec4(displaced, 1.0);
  }
`;

const fragmentShader = `
  uniform float uTime;
  uniform vec3 uColor;
  varying vec3 vNormal;
  varying vec3 vPosition;
  varying float vNoise;

  float pulse(float speed, float offset) {
    return 0.5 + 0.5 * sin(uTime * speed + offset);
  }

  void main(){
    vec3 N = normalize(vNormal);
    vec3 V = normalize(-vPosition);
    float fresnel = pow(1.0 - max(dot(N, V), 0.0), 3.0);
    float glow = clamp(vNoise * 0.5 + 0.45, 0.0, 1.0);
    vec3 base = uColor * mix(0.55, 1.0, glow);
    vec3 pulseColor = vec3(0.7, 0.96, 1.0) * (0.12 + 0.22 * pulse(3.4, vNoise * 4.0));
    vec3 col = base + pulseColor * fresnel * 1.4;
    col += vec3(0.18, 0.32, 0.52) * pow(fresnel, 2.0);
    float alpha = clamp(0.28 + fresnel * 0.72 + glow * 0.22, 0.22, 0.98);
    gl_FragColor = vec4(col, alpha);
  }
`;

interface AstraOrb3DProps {
  state: 'idle' | 'listening' | 'thinking' | 'speaking';
  analyserRef?: React.MutableRefObject<AnalyserNode | null>;
  size?: number;
}

function OrbMesh({ state, analyserRef }: { state: AstraOrb3DProps['state']; analyserRef?: React.MutableRefObject<AnalyserNode | null> }) {
  const mesh = useRef<THREE.Mesh>(null!);
  const materialRef = useRef<THREE.ShaderMaterial | null>(null);
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
      const data = dataRef.current!;
      analyser.getByteTimeDomainData(data as any);
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
      materialRef.current.uniforms.uTime.value += delta;
      const targetColor = stateColors[state] || stateColors.idle;
      materialRef.current.uniforms.uColor.value.lerp(targetColor, 0.06);
    }
  });
  const material = useMemo(() => {
    const mat = new THREE.ShaderMaterial({
      uniforms: {
        uTime: { value: 0.0 },
        uColor: { value: new THREE.Color(0x0ff3ff) }
      },
      vertexShader,
      fragmentShader,
      transparent: true,
      blending: THREE.AdditiveBlending,
      depthWrite: false,
      side: THREE.DoubleSide
    });
    return mat;
  }, []);

  useEffect(() => { materialRef.current = material; }, [material]);

  return React.createElement(
    React.Fragment,
    null,
    React.createElement(
      'group' as any,
      null,
      React.createElement(
        'mesh' as any,
        { ref: mesh, position: [0, 0, 0], material },
        React.createElement('sphereGeometry' as any, { args: [1, 160, 160] })
      )
    ),
    React.createElement(Sparkles, { count: 120, scale: [2.2, 2.2, 2.2], noise: 2.2, size: 6, speed: 0.4 })
  );
}

const AstraOrb3D: React.FC<AstraOrb3DProps> = ({ state, analyserRef, size = 320 }) => {
  // canvas pixel ratio management
  return (
    <div style={{ width: size, height: size }}>
      {React.createElement(
        Canvas,
        { dpr: Math.min(2, window.devicePixelRatio), camera: { position: [0, 0, 4], fov: 40 } },
        React.createElement('ambientLight' as any, { intensity: 0.6 }),
        React.createElement('pointLight' as any, { position: [5, 5, 5], intensity: 1.2 }),
        React.createElement('pointLight' as any, { position: [-5, -5, -5], intensity: 0.8 }),
        React.createElement(OrbMesh, { state, analyserRef }),
        React.createElement(OrbitControls, { enableZoom: false, enablePan: false, enableRotate: false }),
        React.createElement(
          EffectComposer,
          null,
          React.createElement(Bloom, { luminanceThreshold: 0.2, mipmapBlur: true, intensity: 0.9 })
        )
      )}
    </div>
  );
};

export default AstraOrb3D;
