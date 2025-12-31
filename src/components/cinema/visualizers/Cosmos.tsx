"use client"

import { useRef, useMemo } from "react"
import { Stars } from "@react-three/drei"
import { useFrame } from "@react-three/fiber"
import * as THREE from "three"
import { METADJ_VISUALIZER_COLORS } from "@/lib/color/metadj-visualizer-palette"

interface CosmosProps {
  bassLevel: number
  midLevel: number
  highLevel: number
  /** When true, uses reduced particle counts for smoother rendering. */
  performanceMode?: boolean
}

function seededRandom(seed: number): () => number {
  return function () {
    seed = (seed * 9301 + 49297) % 233280
    return seed / 233280
  }
}

function generateParticleData(particleCount: number) {
  const positions = new Float32Array(particleCount * 3)
  const sizes = new Float32Array(particleCount)
  const randoms = new Float32Array(particleCount * 3)
  const velocities = new Float32Array(particleCount * 3)
  const colorIndex = new Float32Array(particleCount)
  const random = seededRandom(42)

  for (let i = 0; i < particleCount; i++) {
    const u = random()
    const v = random()
    const theta = u * 2 * Math.PI
    const phi = Math.acos(2 * v - 1)

    const radiusBase = random() * random()
    const radius = radiusBase * 9.6 + 0.8

    const x = radius * Math.sin(phi) * Math.cos(theta)
    const y = radius * Math.sin(phi) * Math.sin(theta)
    const z = radius * Math.cos(phi)

    const stretch = 1.0 + (random() - 0.5) * 0.15

    positions[i * 3] = x * stretch
    positions[i * 3 + 1] = y
    positions[i * 3 + 2] = z * stretch

    sizes[i] = random() * 0.6 + 0.15

    randoms[i * 3] = (random() - 0.5)
    randoms[i * 3 + 1] = (random() - 0.5)
    randoms[i * 3 + 2] = (random() - 0.5)

    colorIndex[i] = random()

    velocities[i * 3] = (random() - 0.5) * 2.0
    velocities[i * 3 + 1] = (random() - 0.5) * 2.0
    velocities[i * 3 + 2] = (random() - 0.5) * 2.0
  }

  return { positions, sizes, randoms, velocities, colorIndex }
}

const HIGH_PARTICLE_COUNT = 14000
const LOW_PARTICLE_COUNT = 10000
const HIGH_PARTICLE_DATA = generateParticleData(HIGH_PARTICLE_COUNT)
const LOW_PARTICLE_DATA = generateParticleData(LOW_PARTICLE_COUNT)

// Dust layer: distant, slower particles for depth
const DUST_PARTICLE_COUNT = 3000
const DUST_PARTICLE_COUNT_LOW = 1500

function generateDustData(particleCount: number) {
  const positions = new Float32Array(particleCount * 3)
  const sizes = new Float32Array(particleCount)
  const randoms = new Float32Array(particleCount * 3)
  const random = seededRandom(1337) // Different seed for variety

  for (let i = 0; i < particleCount; i++) {
    // Spherical distribution at larger radius
    const u = random()
    const v = random()
    const theta = u * 2 * Math.PI
    const phi = Math.acos(2 * v - 1)

    // Dust exists in outer shell (radius 15-35)
    const radius = 15 + random() * 20

    positions[i * 3] = radius * Math.sin(phi) * Math.cos(theta)
    positions[i * 3 + 1] = radius * Math.sin(phi) * Math.sin(theta)
    positions[i * 3 + 2] = radius * Math.cos(phi)

    // Smaller, more uniform sizes
    sizes[i] = random() * 0.3 + 0.08

    randoms[i * 3] = random() - 0.5
    randoms[i * 3 + 1] = random() - 0.5
    randoms[i * 3 + 2] = random() - 0.5
  }

  return { positions, sizes, randoms }
}

const HIGH_DUST_DATA = generateDustData(DUST_PARTICLE_COUNT)
const LOW_DUST_DATA = generateDustData(DUST_PARTICLE_COUNT_LOW)

// Accent sparkle layer: bright, sparse highlights
const ACCENT_PARTICLE_COUNT = 800
const ACCENT_PARTICLE_COUNT_LOW = 400

function generateAccentData(particleCount: number) {
  const positions = new Float32Array(particleCount * 3)
  const sizes = new Float32Array(particleCount)
  const randoms = new Float32Array(particleCount * 3)
  const random = seededRandom(9999)

  for (let i = 0; i < particleCount; i++) {
    const u = random()
    const v = random()
    const theta = u * 2 * Math.PI
    const phi = Math.acos(2 * v - 1)

    // Accents scattered through the main volume
    const radius = 2 + random() * random() * 12

    positions[i * 3] = radius * Math.sin(phi) * Math.cos(theta)
    positions[i * 3 + 1] = radius * Math.sin(phi) * Math.sin(theta)
    positions[i * 3 + 2] = radius * Math.cos(phi)

    // Larger, brighter particles
    sizes[i] = random() * 1.2 + 0.6

    randoms[i * 3] = random() - 0.5
    randoms[i * 3 + 1] = random() - 0.5
    randoms[i * 3 + 2] = random() - 0.5
  }

  return { positions, sizes, randoms }
}

const HIGH_ACCENT_DATA = generateAccentData(ACCENT_PARTICLE_COUNT)
const LOW_ACCENT_DATA = generateAccentData(ACCENT_PARTICLE_COUNT_LOW)

const ExplosionShaderMaterial = {
  uniforms: {
    uTime: { value: 0 },
    uBass: { value: 0 },
    uMid: { value: 0 },
    uHigh: { value: 0 },
    uShapeMorph: { value: 0 },
    uShapeBlend: { value: 0 },
    uCurrentShape: { value: 0 },
    uNextShape: { value: 1 },
    uRotationPhase: { value: 0 },
    uColorPhase: { value: 0 },
    uPixelRatio: { value: 1.0 },
    uScatter: { value: 0 },
    uColor1: { value: new THREE.Color(METADJ_VISUALIZER_COLORS.purple) },
    uColor2: { value: new THREE.Color(METADJ_VISUALIZER_COLORS.cyan) },
    uColor3: { value: new THREE.Color(METADJ_VISUALIZER_COLORS.magenta) },
    uColor4: { value: new THREE.Color(METADJ_VISUALIZER_COLORS.indigo) },
    uColor5: { value: new THREE.Color(METADJ_VISUALIZER_COLORS.cyanTint) },
    uColor6: { value: new THREE.Color(METADJ_VISUALIZER_COLORS.purpleTint) },
    uColor7: { value: new THREE.Color(METADJ_VISUALIZER_COLORS.magentaTint) },
    uColor8: { value: new THREE.Color(METADJ_VISUALIZER_COLORS.cyanTintLight) },
  },
  vertexShader: `
    uniform float uTime;
    uniform float uBass;
    uniform float uMid;
    uniform float uHigh;
    uniform float uShapeMorph;
    uniform float uShapeBlend;
    uniform float uCurrentShape;
    uniform float uNextShape;
    uniform float uRotationPhase;
    uniform float uPixelRatio;
    uniform float uScatter;
    
    attribute float aSize;
    attribute vec3 aRandom;
    attribute vec3 aVelocity;
    attribute float aColorIdx;

    varying float vAlpha;
    varying float vRadius;
    varying float vColorIdx;
    varying float vEnergy;
    varying float vRandom;
    varying vec3 vWorldPos;
    varying float vSpeed;
    varying vec2 vVelocityDir;

    vec3 mod289(vec3 x) { return x - floor(x * (1.0 / 289.0)) * 289.0; }
    vec4 mod289(vec4 x) { return x - floor(x * (1.0 / 289.0)) * 289.0; }
    vec4 permute(vec4 x) { return mod289(((x*34.0)+1.0)*x); }
    vec4 taylorInvSqrt(vec4 r) { return 1.79284291400159 - 0.85373472095314 * r; }
    float snoise(vec3 v) {
      const vec2  C = vec2(1.0/6.0, 1.0/3.0) ;
      const vec4  D = vec4(0.0, 0.5, 1.0, 2.0);
      vec3 i  = floor(v + dot(v, C.yyy) );
      vec3 x0 = v - i + dot(i, C.xxx) ;
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
      vec3  ns = n_ * D.wyz - D.xzx;
      vec4 j = p - 49.0 * floor(p * ns.z * ns.z);
      vec4 x_ = floor(j * ns.z);
      vec4 y_ = floor(j - 7.0 * x_ );
      vec4 x = x_ *ns.x + ns.yyyy;
      vec4 y = y_ *ns.x + ns.yyyy;
      vec4 h = 1.0 - abs(x) - abs(y);
      vec4 b0 = vec4( x.xy, y.xy );
      vec4 b1 = vec4( x.zw, y.zw );
      vec4 s0 = floor(b0)*2.0 + 1.0;
      vec4 s1 = floor(b1)*2.0 + 1.0;
      vec4 sh = -step(h, vec4(0.0));
      vec4 a0 = b0.xzyw + s0.xzyw*sh.xxyy ;
      vec4 a1 = b1.xzyw + s1.xzyw*sh.zzww ;
      vec3 p0 = vec3(a0.xy,h.x);
      vec3 p1 = vec3(a0.zw,h.y);
      vec3 p2 = vec3(a1.xy,h.z);
      vec3 p3 = vec3(a1.zw,h.w);
      vec4 norm = taylorInvSqrt(vec4(dot(p0,p0), dot(p1,p1), dot(p2, p2), dot(p3,p3)));
      p0 *= norm.x;
      p1 *= norm.y;
      p2 *= norm.z;
      p3 *= norm.w;
      vec4 m = max(0.6 - vec4(dot(x0,x0), dot(x1,x1), dot(x2,x2), dot(x3,x3)), 0.0);
      m = m * m;
      return 42.0 * dot( m*m, vec4( dot(p0,x0), dot(p1,x1), 
                                    dot(p2,x2), dot(p3,x3) ) );
    }

    vec3 shapeSphere(vec3 pos, float radius, float energy) {
      return vec3(0.0);
    }
    
    vec3 shapeTorus(vec3 pos, float radius, float energy) {
      float theta = atan(pos.z, pos.x);
      float phi = acos(pos.y / max(radius, 0.001));
      float torusFactor = sin(phi) * sin(phi);
      return normalize(pos) * torusFactor * energy * 2.0;
    }
    
    vec3 shapeElongated(vec3 pos, float radius, float energy) {
      float phi = acos(pos.y / max(radius, 0.001));
      float elongation = abs(cos(phi)) * energy * 2.5;
      return vec3(0.0, pos.y * 0.3, 0.0) + normalize(pos) * elongation * 0.3;
    }
    
    vec3 shapeSpiral(vec3 pos, float radius, float energy) {
      float theta = atan(pos.z, pos.x);
      float spiralAngle = theta + radius * 0.4;
      float spiralArm = sin(spiralAngle * 4.0) * 0.5 + 0.5;
      vec3 spiral = normalize(pos) * spiralArm * energy * 1.5;
      spiral.y *= 0.3;
      return spiral;
    }
    
    vec3 shapeStarburst(vec3 pos, float radius, float energy) {
      float theta = atan(pos.z, pos.x);
      float phi = acos(pos.y / max(radius, 0.001));
      float star = sin(theta * 5.0) * sin(phi * 4.0);
      return normalize(pos) * star * energy * 1.8;
    }
    
    vec3 shapeHelix(vec3 pos, float radius, float energy) {
      float y = pos.y;
      float helixAngle = y * 1.5;
      float helix1 = sin(helixAngle);
      float helix2 = cos(helixAngle);
      vec3 offset = vec3(helix1 * energy, 0.0, helix2 * energy) * 1.2;
      return offset;
    }
    
    vec3 shapeCube(vec3 pos, float radius, float energy) {
      vec3 absPos = abs(pos);
      float maxCoord = max(max(absPos.x, absPos.y), absPos.z);
      vec3 cubeDir = sign(pos) * step(maxCoord - 0.01, absPos);
      return cubeDir * energy * 0.8;
    }
    
    vec3 shapeWave(vec3 pos, float radius, float energy) {
      float wave = sin(pos.x * 0.8 + pos.z * 0.6) * energy;
      return vec3(0.0, wave * 1.5, 0.0);
    }

    vec3 getShapeDeform(float shapeIndex, vec3 pos, float radius, float energy) {
      int shape = int(mod(shapeIndex, 8.0));
      if (shape == 0) return shapeSphere(pos, radius, energy);
      if (shape == 1) return shapeTorus(pos, radius, energy);
      if (shape == 2) return shapeElongated(pos, radius, energy);
      if (shape == 3) return shapeSpiral(pos, radius, energy);
      if (shape == 4) return shapeStarburst(pos, radius, energy);
      if (shape == 5) return shapeHelix(pos, radius, energy);
      if (shape == 6) return shapeCube(pos, radius, energy);
      if (shape == 7) return shapeWave(pos, radius, energy);
      return vec3(0.0);
    }

    void main() {
      vec3 pos = position;
      float baseRadius = length(pos);
      vec3 normalDir = normalize(pos);
      
      float audioEnergy = uBass + uMid * 0.5 + uHigh * 0.3;
      vEnergy = audioEnergy;
      
      vec3 currentDeform = getShapeDeform(uCurrentShape, pos, baseRadius, audioEnergy);
      vec3 nextDeform = getShapeDeform(uNextShape, pos, baseRadius, audioEnergy);
      vec3 shapeDeform = mix(currentDeform, nextDeform, uShapeBlend);
      
      pos += shapeDeform;
      
      // Scatter effect during shape transitions - particles briefly expand outward
      float scatterPush = uScatter * (1.0 + aRandom.x * 0.5);
      pos += normalDir * scatterPush * 2.5;
      
      float waveFreq = 3.0 + uMid * 1.0;
      float theta = atan(pos.z, pos.x);
      float phi = acos(pos.y / max(length(pos), 0.001));
      float surfaceWave = sin(theta * waveFreq + uShapeMorph * 1.5) * 
                          sin(phi * waveFreq * 0.5 + uShapeMorph * 1.2) * 
                          audioEnergy * 0.25;
      pos += normalDir * surfaceWave;
      
      float angle = -uRotationPhase * (1.0 + aRandom.x * 0.1);
      float cosA = cos(angle);
      float sinA = sin(angle);
      vec3 rotatedPos = vec3(
        pos.x * cosA - pos.z * sinA,
        pos.y + sin(uTime * 0.15 + baseRadius * 0.2) * 0.08 * uMid,
        pos.x * sinA + pos.z * cosA
      );
      pos = rotatedPos;
      
      float breathe = sin(uTime * 0.25 + baseRadius * 0.2) * 0.08;
      pos += normalize(pos) * breathe * (1.0 + audioEnergy * 0.3);
      
      float noise = snoise(pos * 0.15 + uTime * 0.06);
      float expansion = uBass * 0.8 * (1.0 + noise * 0.3);
      pos += normalize(pos) * expansion;

      vec3 turbulence = aRandom * uMid * 0.2;
      turbulence += vec3(
        snoise(pos * 0.25 + uTime * 0.08),
        snoise(pos * 0.25 + uTime * 0.08 + 100.0),
        snoise(pos * 0.25 + uTime * 0.08 + 200.0)
      ) * uHigh * 0.15;
      pos += turbulence;

      vec4 mvPosition = modelViewMatrix * vec4(pos, 1.0);
      gl_Position = projectionMatrix * mvPosition;

      float sizePulse = 1.0 + sin(uTime * 0.5 + baseRadius * 0.6) * 0.1;
      float sizeBase = aSize * sizePulse * (1.2 + uHigh * 0.7 + uBass * 0.35);
      
      gl_PointSize = sizeBase * (180.0 / -mvPosition.z) * uPixelRatio; 
      gl_PointSize = clamp(gl_PointSize, 1.0, 50.0);   

      vRadius = length(pos);
      vColorIdx = aColorIdx;
      vRandom = aRandom.x;
      vWorldPos = pos;

      // Calculate velocity-based motion blur data
      vec3 worldVelocity = aVelocity * (1.0 + audioEnergy * 2.0);
      vec4 velClip = projectionMatrix * modelViewMatrix * vec4(worldVelocity, 0.0);
      vSpeed = length(worldVelocity) * 0.15;
      vVelocityDir = normalize(velClip.xy + vec2(0.001));

      float edgeFade = 1.0 - smoothstep(10.0, 18.0 + uBass * 4.0, vRadius);
      // Softer center fade: push the origin out slightly to clear the high-density jitter zone
      float centerFade = smoothstep(0.2, 0.9, vRadius);
      vAlpha = edgeFade * centerFade;
    }
  `,
  fragmentShader: `
    uniform vec3 uColor1;
    uniform vec3 uColor2;
    uniform vec3 uColor3;
    uniform vec3 uColor4;
    uniform vec3 uColor5;
    uniform vec3 uColor6;
    uniform vec3 uColor7;
    uniform vec3 uColor8;
    uniform float uBass;
    uniform float uMid;
    uniform float uHigh;
    uniform float uTime;
    uniform float uShapeMorph;
    uniform float uColorPhase;

    varying float vAlpha;
    varying float vRadius;
    varying float vColorIdx;
    varying float vEnergy;
    varying float vRandom;
    varying vec3 vWorldPos;
    varying float vSpeed;
    varying vec2 vVelocityDir;

    // Helper for hue shift
    vec3 hueShift(vec3 color, float hue) {
      const vec3 k = vec3(0.57735, 0.57735, 0.57735);
      float cosAngle = cos(hue);
      return color * cosAngle + cross(k, color) * sin(hue) + k * dot(k, color) * (1.0 - cosAngle);
    }

    vec3 mod289(vec3 x) { return x - floor(x * (1.0 / 289.0)) * 289.0; }
    vec4 mod289(vec4 x) { return x - floor(x * (1.0 / 289.0)) * 289.0; }
    vec4 permute(vec4 x) { return mod289(((x*34.0)+1.0)*x); }
    vec4 taylorInvSqrt(vec4 r) { return 1.79284291400159 - 0.85373472095314 * r; }
    float snoise(vec3 v) {
      const vec2  C = vec2(1.0/6.0, 1.0/3.0) ;
      const vec4  D = vec4(0.0, 0.5, 1.0, 2.0);
      vec3 i  = floor(v + dot(v, C.yyy) );
      vec3 x0 = v - i + dot(i, C.xxx) ;
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
      vec3  ns = n_ * D.wyz - D.xzx;
      vec4 j = p - 49.0 * floor(p * ns.z * ns.z);
      vec4 x_ = floor(j * ns.z);
      vec4 y_ = floor(j - 7.0 * x_ );
      vec4 x = x_ *ns.x + ns.yyyy;
      vec4 y = y_ *ns.x + ns.yyyy;
      vec4 h = 1.0 - abs(x) - abs(y);
      vec4 b0 = vec4( x.xy, y.xy );
      vec4 b1 = vec4( x.zw, y.zw );
      vec4 s0 = floor(b0)*2.0 + 1.0;
      vec4 s1 = floor(b1)*2.0 + 1.0;
      vec4 sh = -step(h, vec4(0.0));
      vec4 a0 = b0.xzyw + s0.xzyw*sh.xxyy ;
      vec4 a1 = b1.xzyw + s1.xzyw*sh.zzww ;
      vec3 p0 = vec3(a0.xy,h.x);
      vec3 p1 = vec3(a0.zw,h.y);
      vec3 p2 = vec3(a1.xy,h.z);
      vec3 p3 = vec3(a1.zw,h.w);
      vec4 norm = taylorInvSqrt(vec4(dot(p0,p0), dot(p1,p1), dot(p2, p2), dot(p3,p3)));
      p0 *= norm.x;
      p1 *= norm.y;
      p2 *= norm.z;
      p3 *= norm.w;
      vec4 m = max(0.6 - vec4(dot(x0,x0), dot(x1,x1), dot(x2,x2), dot(x3,x3)), 0.0);
      m = m * m;
      return 42.0 * dot( m*m, vec4( dot(p0,x0), dot(p1,x1), 
                                    dot(p2,x2), dot(p3,x3) ) );
    }

    void main() {
      vec2 uv = gl_PointCoord.xy - 0.5;

      // Motion trail: stretch UV along velocity direction
      float trailStrength = min(vSpeed, 0.4);
      vec2 stretchDir = vVelocityDir;
      // Elongate the UV space opposite to velocity for trailing effect
      float alignment = dot(normalize(uv + vec2(0.0001)), stretchDir);
      float trailFactor = 1.0 + trailStrength * max(-alignment, 0.0) * 0.8;
      vec2 trailUv = uv;
      trailUv -= stretchDir * trailStrength * 0.15 * max(-alignment, 0.0);

      float d = length(trailUv / vec2(1.0, trailFactor));

      if (d > 0.5) discard;

      // Vibrant Sharpness - crisp core with a tight energy body
      // This provides the body for the Bloom pass to catch while staying sharp
      float core = 1.0 - smoothstep(0.0, 0.05, d);
      float innerGlow = 1.0 - smoothstep(0.0, 0.15, d);
      innerGlow = pow(innerGlow, 3.0);

      // Per-particle glow variance: each particle has unique glow intensity
      float glowVariance = 0.7 + 0.6 * sin(vRandom * 12.56 + vColorIdx * 4.0);
      // Add slow breathing to individual glow levels
      glowVariance *= 0.85 + 0.3 * sin(uTime * 0.3 + vRandom * 8.0);

      float intensity = core * 1.6 + innerGlow * 0.6 * glowVariance;

      // Twinkle: Organic, low-frequency pulse to provide life without flicker
      // Multi-frequency twinkle for more organic feel
      float twinkle1 = sin(uTime * (1.6 + vColorIdx * 0.8) + vRandom * 18.0);
      float twinkle2 = sin(uTime * (0.9 + vRandom * 0.5) + vColorIdx * 12.0) * 0.5;
      float twinkle = 1.0 + (twinkle1 * 0.18 + twinkle2 * 0.12);
      intensity *= twinkle;

      // Color Alignment: Match Disco Ball's cycling coefficients for a consistent "feel"
      float colorCycle = uColorPhase * 0.04 + vRadius * 0.02 + vColorIdx * 12.0 + uShapeMorph * 0.05;
      float phase = fract(colorCycle);
      
      vec3 baseColor;
      float t;
      if (phase < 0.125) {
        t = phase * 8.0;
        baseColor = mix(uColor1, uColor2, t);
      } else if (phase < 0.25) {
        t = (phase - 0.125) * 8.0;
        baseColor = mix(uColor2, uColor3, t);
      } else if (phase < 0.375) {
        t = (phase - 0.25) * 8.0;
        baseColor = mix(uColor3, uColor4, t);
      } else if (phase < 0.5) {
        t = (phase - 0.375) * 8.0;
        baseColor = mix(uColor4, uColor5, t);
      } else if (phase < 0.625) {
        t = (phase - 0.5) * 8.0;
        baseColor = mix(uColor5, uColor6, t);
      } else if (phase < 0.75) {
        t = (phase - 0.625) * 8.0;
        baseColor = mix(uColor6, uColor7, t);
      } else if (phase < 0.875) {
        t = (phase - 0.75) * 8.0;
        baseColor = mix(uColor7, uColor8, t);
      } else {
        t = (phase - 0.875) * 8.0;
        baseColor = mix(uColor8, uColor1, t);
      }

      vec3 accentCyan = uColor2;
      vec3 accentPurple = uColor1;
      vec3 accentMagenta = uColor3;
      
      float accentPhase = uColorPhase + vColorIdx * 2.5;
      float a1 = pow(sin(accentPhase) * 0.5 + 0.5, 0.6);
      float a2 = pow(sin(accentPhase + 2.09) * 0.5 + 0.5, 0.6);
      float a3 = pow(sin(accentPhase + 4.18) * 0.5 + 0.5, 0.6);
      vec3 accentBlend = accentCyan * a1 + accentPurple * a2 + accentMagenta * a3;
      accentBlend = accentBlend * 0.45;
      
      float accentStrength = 0.65 + uBass * 0.45 + uHigh * 0.25;
      baseColor = baseColor + accentBlend * accentStrength;

      vec3 warmShift = vec3(1.0 + uBass * 0.15, 1.0, 1.0 - uBass * 0.08);
      vec3 coolShift = vec3(1.0 - uHigh * 0.08, 1.0, 1.0 + uHigh * 0.15);
      baseColor *= warmShift * coolShift;

      baseColor *= 1.35 + vEnergy * 0.48;
      
      // Spectral Shimmer: Subtle hue dispersion on particle edges
      float dispersion = smoothstep(0.05, 0.35, d) * 0.35;
      baseColor = hueShift(baseColor, dispersion);

      // Nebula Depth: Large-scale noise cloud modulation
      float cloud = snoise(vWorldPos * 0.08 + uTime * 0.02) * 0.12 + 0.88;
      baseColor *= cloud;

      // Radial Brightness Normalization: Prevent Bloom hot-spotting in the dense center
      float centerMask = smoothstep(0.0, 2.0, vRadius) * 0.1 + 0.9;
      baseColor *= centerMask;

      // Color pop/Vibrance: Push saturation curve before clamping
      baseColor = pow(baseColor, vec3(0.88));

      // Moderated clamp to prevent hot spots that cause flickering (aligned with Black Hole)
      baseColor = clamp(baseColor, vec3(0.0), vec3(1.3));

      float finalAlpha = vAlpha * intensity * 1.0;
      
      // Soft Alpha Discard: Lower threshold to prevent snapping, with a smooth cubic falloff
      if (finalAlpha < 0.08) discard;
      finalAlpha *= smoothstep(0.08, 0.2, finalAlpha);

      gl_FragColor = vec4(baseColor, finalAlpha);
    }
  `
}

// Dust layer shader - simpler, subtle background particles
const DustShaderMaterial = {
  uniforms: {
    uTime: { value: 0 },
    uBass: { value: 0 },
    uPixelRatio: { value: 1.0 },
    uColor: { value: new THREE.Color(METADJ_VISUALIZER_COLORS.purpleTint) },
  },
  vertexShader: `
    uniform float uTime;
    uniform float uBass;
    uniform float uPixelRatio;

    attribute float aSize;
    attribute vec3 aRandom;

    varying float vAlpha;
    varying float vRandom;

    void main() {
      vec3 pos = position;

      // Very slow drift
      float drift = sin(uTime * 0.03 + aRandom.x * 10.0) * 0.3;
      pos += normalize(pos) * drift;

      // Gentle rotation (opposite to main particles for parallax)
      float angle = uTime * 0.02;
      float cosA = cos(angle);
      float sinA = sin(angle);
      pos = vec3(
        pos.x * cosA + pos.z * sinA,
        pos.y,
        -pos.x * sinA + pos.z * cosA
      );

      vec4 mvPosition = modelViewMatrix * vec4(pos, 1.0);
      gl_Position = projectionMatrix * mvPosition;

      // Distance-based sizing
      float sizeFactor = aSize * (1.0 + uBass * 0.3);
      gl_PointSize = sizeFactor * (120.0 / -mvPosition.z) * uPixelRatio;
      gl_PointSize = clamp(gl_PointSize, 0.5, 8.0);

      vAlpha = 0.25 + aRandom.y * 0.15;
      vRandom = aRandom.x;
    }
  `,
  fragmentShader: `
    uniform vec3 uColor;
    uniform float uTime;

    varying float vAlpha;
    varying float vRandom;

    void main() {
      vec2 uv = gl_PointCoord.xy - 0.5;
      float d = length(uv);

      if (d > 0.5) discard;

      // Soft circular falloff
      float alpha = 1.0 - smoothstep(0.0, 0.5, d);
      alpha *= alpha;

      // Subtle twinkle
      float twinkle = 0.8 + sin(uTime * 0.8 + vRandom * 20.0) * 0.2;

      gl_FragColor = vec4(uColor, alpha * vAlpha * twinkle);
    }
  `
}

// Accent sparkle shader - bright highlights with star-like glow
const AccentShaderMaterial = {
  uniforms: {
    uTime: { value: 0 },
    uBass: { value: 0 },
    uHigh: { value: 0 },
    uPixelRatio: { value: 1.0 },
    uColorPhase: { value: 0 },
    uColor1: { value: new THREE.Color(METADJ_VISUALIZER_COLORS.cyan) },
    uColor2: { value: new THREE.Color(METADJ_VISUALIZER_COLORS.magenta) },
    uColor3: { value: new THREE.Color("#ffffff") },
  },
  vertexShader: `
    uniform float uTime;
    uniform float uBass;
    uniform float uPixelRatio;

    attribute float aSize;
    attribute vec3 aRandom;

    varying float vAlpha;
    varying float vRandom;
    varying float vSize;

    void main() {
      vec3 pos = position;

      // Pulsing expansion with bass
      float pulse = 1.0 + uBass * 0.4;
      pos *= pulse;

      // Subtle individual motion
      pos += aRandom * sin(uTime * 0.5 + aRandom.x * 10.0) * 0.3;

      vec4 mvPosition = modelViewMatrix * vec4(pos, 1.0);
      gl_Position = projectionMatrix * mvPosition;

      float sizeFactor = aSize * (1.5 + uBass * 1.0);
      gl_PointSize = sizeFactor * (200.0 / -mvPosition.z) * uPixelRatio;
      gl_PointSize = clamp(gl_PointSize, 2.0, 40.0);

      vSize = gl_PointSize;
      vAlpha = 0.6 + aRandom.y * 0.4;
      vRandom = aRandom.x;
    }
  `,
  fragmentShader: `
    uniform vec3 uColor1;
    uniform vec3 uColor2;
    uniform vec3 uColor3;
    uniform float uTime;
    uniform float uHigh;
    uniform float uColorPhase;

    varying float vAlpha;
    varying float vRandom;
    varying float vSize;

    void main() {
      vec2 uv = gl_PointCoord.xy - 0.5;
      float d = length(uv);

      if (d > 0.5) discard;

      // Star-like shape with 4-point cross flare
      float angle = atan(uv.y, uv.x);
      float star = pow(abs(cos(angle * 2.0)), 8.0) * 0.3;

      // Core glow
      float core = 1.0 - smoothstep(0.0, 0.08, d);
      float glow = 1.0 - smoothstep(0.0, 0.35 + star, d);
      glow = pow(glow, 2.0);

      float intensity = core * 2.0 + glow * 0.8;

      // Sparkle animation
      float sparkle = sin(uTime * 3.0 + vRandom * 30.0) * 0.5 + 0.5;
      sparkle = pow(sparkle, 3.0);
      intensity *= 0.6 + sparkle * 0.6;

      // Color cycling between cyan, magenta, and white
      float phase = fract(uColorPhase * 0.02 + vRandom * 5.0);
      vec3 color;
      if (phase < 0.33) {
        color = mix(uColor1, uColor2, phase * 3.0);
      } else if (phase < 0.66) {
        color = mix(uColor2, uColor3, (phase - 0.33) * 3.0);
      } else {
        color = mix(uColor3, uColor1, (phase - 0.66) * 3.0);
      }

      // High frequencies boost white tint
      color = mix(color, uColor3, uHigh * 0.4);

      gl_FragColor = vec4(color * intensity, intensity * vAlpha);
    }
  `
}

// Shape morphing constants
const SHAPE_COUNT = 8
const SHAPE_DURATION_MIN = 8
const SHAPE_DURATION_MAX = 15

// Instance-scoped state interface (prevents module-level pollution and HMR bugs)
interface CosmosState {
  smoothedRotationSpeed: number
  accumulatedRotationPhase: number
  smoothedBass: number
  smoothedMid: number
  smoothedHigh: number
  colorShiftAccum: number
  currentShape: number
  nextShape: number
  shapeBlend: number
  shapeTransitionTimer: number
  nextShapeChangeTime: number
}

function createInitialCosmosState(): CosmosState {
  return {
    smoothedRotationSpeed: 0.3,
    accumulatedRotationPhase: 0,
    smoothedBass: 0,
    smoothedMid: 0,
    smoothedHigh: 0,
    colorShiftAccum: 0,
    currentShape: 0,
    nextShape: 1,
    shapeBlend: 0,
    shapeTransitionTimer: 0,
    nextShapeChangeTime: 10,
  }
}

// Camera drift component for subtle parallax motion
function CameraDrift({ bassLevel, performanceMode }: { bassLevel: number; performanceMode: boolean }) {
  useFrame((state) => {
    if (performanceMode) return // Skip camera motion in performance mode

    const t = state.clock.getElapsedTime()
    const camera = state.camera

    // Slow orbital drift with subtle bass influence
    const driftSpeed = 0.08
    const driftRadius = 1.5 + bassLevel * 0.5

    camera.position.x = Math.sin(t * driftSpeed) * driftRadius
    camera.position.y = Math.cos(t * driftSpeed * 0.7) * driftRadius * 0.6
    camera.position.z = 25 + Math.sin(t * driftSpeed * 0.5) * 2 // Subtle depth oscillation

    camera.lookAt(0, 0, 0)
  })

  return null
}

// Dust layer component
function DustLayer({ bassLevel, performanceMode }: { bassLevel: number; performanceMode: boolean }) {
  const materialRef = useRef<THREE.ShaderMaterial>(null)
  const dustData = useMemo(
    () => (performanceMode ? LOW_DUST_DATA : HIGH_DUST_DATA),
    [performanceMode],
  )

  useFrame((state) => {
    if (!materialRef.current) return
    materialRef.current.uniforms.uTime.value = state.clock.getElapsedTime()
    materialRef.current.uniforms.uBass.value = bassLevel
    materialRef.current.uniforms.uPixelRatio.value = state.viewport.dpr
  })

  return (
    <points>
      <bufferGeometry>
        <bufferAttribute attach="attributes-position" args={[dustData.positions, 3]} />
        <bufferAttribute attach="attributes-aSize" args={[dustData.sizes, 1]} />
        <bufferAttribute attach="attributes-aRandom" args={[dustData.randoms, 3]} />
      </bufferGeometry>
      <shaderMaterial
        ref={materialRef}
        args={[DustShaderMaterial]}
        transparent
        depthWrite={false}
        blending={THREE.AdditiveBlending}
      />
    </points>
  )
}

// Accent sparkle layer component
function AccentLayer({
  bassLevel,
  highLevel,
  colorPhase,
  performanceMode,
}: {
  bassLevel: number
  highLevel: number
  colorPhase: number
  performanceMode: boolean
}) {
  const materialRef = useRef<THREE.ShaderMaterial>(null)
  const pointsRef = useRef<THREE.Points>(null)
  const accentData = useMemo(
    () => (performanceMode ? LOW_ACCENT_DATA : HIGH_ACCENT_DATA),
    [performanceMode],
  )

  useFrame((state) => {
    if (!materialRef.current || !pointsRef.current) return
    const time = state.clock.getElapsedTime()

    materialRef.current.uniforms.uTime.value = time
    materialRef.current.uniforms.uBass.value = bassLevel
    materialRef.current.uniforms.uHigh.value = highLevel
    materialRef.current.uniforms.uPixelRatio.value = state.viewport.dpr
    materialRef.current.uniforms.uColorPhase.value = colorPhase

    // Gentle counter-rotation for depth
    pointsRef.current.rotation.y = time * 0.03
  })

  return (
    <points ref={pointsRef}>
      <bufferGeometry>
        <bufferAttribute attach="attributes-position" args={[accentData.positions, 3]} />
        <bufferAttribute attach="attributes-aSize" args={[accentData.sizes, 1]} />
        <bufferAttribute attach="attributes-aRandom" args={[accentData.randoms, 3]} />
      </bufferGeometry>
      <shaderMaterial
        ref={materialRef}
        args={[AccentShaderMaterial]}
        transparent
        depthWrite={false}
        blending={THREE.AdditiveBlending}
      />
    </points>
  )
}

export function Cosmos({ bassLevel, midLevel, highLevel, performanceMode = false }: CosmosProps) {
  const pointsRef = useRef<THREE.Points>(null)
  const materialRef = useRef<THREE.ShaderMaterial>(null)
  const stateRef = useRef<CosmosState>(createInitialCosmosState())

  const particles = useMemo(
    () => (performanceMode ? LOW_PARTICLE_DATA : HIGH_PARTICLE_DATA),
    [performanceMode],
  )

  const accumulatedMorphRef = useRef(0)

  useFrame((state, delta) => {
    if (!materialRef.current || !pointsRef.current) return
    const time = state.clock.getElapsedTime()
    const s = stateRef.current

    const dynamicBass = Math.pow(bassLevel, 1.6)
    const dynamicMid = midLevel
    const dynamicHigh = Math.pow(highLevel, 1.3)

    s.smoothedBass = THREE.MathUtils.lerp(s.smoothedBass, dynamicBass, 0.04)
    s.smoothedMid = THREE.MathUtils.lerp(s.smoothedMid, dynamicMid, 0.035)
    s.smoothedHigh = THREE.MathUtils.lerp(s.smoothedHigh, dynamicHigh, 0.04)

    const audioEnergy = s.smoothedBass + s.smoothedMid * 0.4 + s.smoothedHigh * 0.25

    const baseRotationSpeed = 0.18
    const bassBoost = Math.pow(s.smoothedBass, 1.6) * 0.3
    const midBoost = s.smoothedMid * 0.18
    const highBoost = Math.pow(s.smoothedHigh, 1.2) * 0.12

    const varietyWave = (Math.sin(time * 0.05) * 0.5 + 0.5) * 0.12
    const accentWave = (Math.sin(time * 0.15) * 0.5 + 0.5) * audioEnergy * 0.08

    const targetRotationSpeed = baseRotationSpeed + bassBoost + midBoost + highBoost + varietyWave + accentWave

    // Increased inertia: slow down deceleration significantly for cinematic weight
    const rotAccelRate = targetRotationSpeed > s.smoothedRotationSpeed ? 0.025 : 0.0035
    s.smoothedRotationSpeed = THREE.MathUtils.lerp(s.smoothedRotationSpeed, targetRotationSpeed, rotAccelRate)

    const clampedDelta = Math.min(delta, 0.1)
    s.accumulatedRotationPhase += s.smoothedRotationSpeed * clampedDelta

    s.shapeTransitionTimer += delta

    if (s.shapeTransitionTimer >= s.nextShapeChangeTime) {
      s.currentShape = s.nextShape
      s.nextShape = (s.nextShape + 1) % SHAPE_COUNT
      s.shapeBlend = 0
      s.shapeTransitionTimer = 0
      s.nextShapeChangeTime = SHAPE_DURATION_MIN + Math.random() * (SHAPE_DURATION_MAX - SHAPE_DURATION_MIN)
    }

    if (s.shapeBlend < 1.0) {
      const blendSpeed = 0.25 + audioEnergy * 0.15
      s.shapeBlend = Math.min(1.0, s.shapeBlend + delta * blendSpeed)
    }

    // Scatter tied to blend progress - peaks in middle of transition, settles at ends
    // Uses sine curve: 0 at blend=0, peaks at blend=0.5, returns to 0 at blend=1
    const scatterValue = Math.sin(s.shapeBlend * Math.PI) * 0.5

    const easedBlend = s.shapeBlend * s.shapeBlend * (3.0 - 2.0 * s.shapeBlend)

    const morphSpeed = 0.2 + audioEnergy * 0.5
    accumulatedMorphRef.current += morphSpeed * delta

    materialRef.current.uniforms.uTime.value = time
    materialRef.current.uniforms.uPixelRatio.value = state.viewport.dpr
    materialRef.current.uniforms.uShapeMorph.value = accumulatedMorphRef.current
    materialRef.current.uniforms.uRotationPhase.value = s.accumulatedRotationPhase
    materialRef.current.uniforms.uCurrentShape.value = s.currentShape
    materialRef.current.uniforms.uNextShape.value = s.nextShape
    materialRef.current.uniforms.uShapeBlend.value = easedBlend
    materialRef.current.uniforms.uScatter.value = scatterValue

    materialRef.current.uniforms.uBass.value = s.smoothedBass
    materialRef.current.uniforms.uMid.value = s.smoothedMid
    materialRef.current.uniforms.uHigh.value = s.smoothedHigh

    const colorSpeed = 0.4 + s.smoothedBass * 1.1 + s.smoothedMid * 0.45 + s.smoothedHigh * 0.3
    s.colorShiftAccum += colorSpeed * clampedDelta
    materialRef.current.uniforms.uColorPhase.value = s.colorShiftAccum

    const gentleRotationY = 0.014 + s.smoothedBass * 0.012 + s.smoothedMid * 0.006
    const gentleRotationX = 0.004 + s.smoothedHigh * 0.003
    pointsRef.current.rotation.y += gentleRotationY * clampedDelta
    pointsRef.current.rotation.x += gentleRotationX * clampedDelta

    const breatheScale = 1.0 + Math.sin(time * 0.2) * 0.015 + s.smoothedBass * 0.02
    pointsRef.current.scale.setScalar(breatheScale)
  })

  // Get current color phase for accent layer sync
  const colorPhase = stateRef.current.colorShiftAccum

  return (
    <>
      {/* Camera drift for parallax effect */}
      <CameraDrift bassLevel={bassLevel} performanceMode={performanceMode} />

      {/* Background star field - furthest layer */}
      {!performanceMode && (
        <Stars
          radius={80}
          depth={60}
          count={2500}
          factor={3}
          saturation={0.15}
          fade
          speed={0.2}
        />
      )}

      {/* Dust layer - distant, slow-moving particles */}
      <DustLayer bassLevel={bassLevel} performanceMode={performanceMode} />

      {/* Main cosmos particles */}
      <points ref={pointsRef}>
        <bufferGeometry>
          <bufferAttribute attach="attributes-position" args={[particles.positions, 3]} />
          <bufferAttribute attach="attributes-aSize" args={[particles.sizes, 1]} />
          <bufferAttribute attach="attributes-aRandom" args={[particles.randoms, 3]} />
          <bufferAttribute attach="attributes-aVelocity" args={[particles.velocities, 3]} />
          <bufferAttribute attach="attributes-aColorIdx" args={[particles.colorIndex, 1]} />
        </bufferGeometry>
        <shaderMaterial
          ref={materialRef}
          args={[ExplosionShaderMaterial]}
          transparent
          depthWrite={false}
          blending={THREE.AdditiveBlending}
        />
      </points>

      {/* Accent sparkle layer - bright highlights */}
      <AccentLayer
        bassLevel={bassLevel}
        highLevel={highLevel}
        colorPhase={colorPhase}
        performanceMode={performanceMode}
      />
    </>
  )
}
