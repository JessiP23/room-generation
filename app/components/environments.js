import React, { useMemo } from 'react'
import * as THREE from 'three'
import { useFrame } from '@react-three/fiber'
import { Instances, Instance } from '@react-three/drei'
import { Color, MathUtils } from 'three'

const randomInRange = (min, max) => Math.random() * (max - min) + min

const Forest = ({ count = 100, spread = 20 }) => {
  const trees = useMemo(() => {
    return new Array(count).fill(null).map(() => ({
      position: [randomInRange(-spread, spread), 0, randomInRange(-spread, spread)],
      scale: randomInRange(0.5, 1.5),
      rotation: [0, randomInRange(0, Math.PI * 2), 0],
    }))
  }, [count, spread])

  return (
    <group>
      <Instances>
        <cylinderGeometry args={[0.2, 0.4, 4]} />
        <meshStandardMaterial color="#4d3326" />
        {trees.map((tree, i) => (
          <group key={i} position={tree.position} scale={[tree.scale, tree.scale, tree.scale]} rotation={tree.rotation}>
            <Instance />
            <mesh position={[0, 2.5, 0]}>
              <coneGeometry args={[1.5, 3, 8]} />
              <meshStandardMaterial color="#2d4c1e" />
            </mesh>
          </group>
        ))}
      </Instances>
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, -0.01, 0]}>
        <planeGeometry args={[100, 100]} />
        <meshStandardMaterial color="#3a7e1f" />
      </mesh>
    </group>
  )
}

const City = ({ buildingCount = 50, spread = 30 }) => {
  const buildings = useMemo(() => {
    return new Array(buildingCount).fill(null).map(() => ({
        position: [randomInRange(-spread, spread), 0, randomInRange(-spread, spread)],
        scale: randomInRange(0.5, 1.5),
      color: new THREE.Color(randomInRange(0.3, 0.8), randomInRange(0.3, 0.8), randomInRange(0.3, 0.8)),
    }))
  }, [buildingCount, spread])

  return (
    <group>
      <Instances>
        <boxGeometry args={[1, 1, 1]} />
        <meshStandardMaterial />
        {buildings.map((building, i) => (
          <Instance key={i} position={building.position} scale={building.scale} color={building.color} />
        ))}
      </Instances>
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, -0.01, 0]}>
        <planeGeometry args={[100, 100]} />
        <meshStandardMaterial color="#555555" />
      </mesh>
    </group>
  )
}


const Desert = ({ duneCount = 20, spread = 40 }) => {
    // Generate fewer, smaller dunes for corners
    const sandMountains = useMemo(() => {
      const cornerDunes = [];
      // Define corners where we want dunes
      const corners = [
        [spread, -spread],     // Back right
        [-spread, -spread],    // Back left
        [spread, spread],      // Front right
        [-spread, spread]      // Front left
      ];
      
      // Fewer dunes per corner
      const dunesPerCorner = 2; // 2 dunes per corner = 8 total dunes
      
      corners.forEach(corner => {
        for (let i = 0; i < dunesPerCorner; i++) {
          // Calculate position with natural variation
          const angle = (i / dunesPerCorner) * Math.PI / 2 + randomInRange(-0.3, 0.3);
          const radius = randomInRange(10, 20); // Smaller radius for tighter clustering
          
          // Create main dune with smaller proportions
          const mainDune = {
            position: [
              corner[0] + Math.cos(angle) * radius,
              randomInRange(-1, 0), // Less height variation
              corner[1] + Math.sin(angle) * radius
            ],
            scale: [
              randomInRange(10, 15), // Smaller width
              randomInRange(15, 20), // Smaller height
              randomInRange(10, 15)  // Smaller depth
            ],
            rotation: [0, angle + randomInRange(-0.15, 0.15), 0],
            color: `hsl(43, ${randomInRange(35, 45)}%, ${randomInRange(65, 75)}%)`
          };
          cornerDunes.push(mainDune);

          // Add one small companion dune
          const companionRadius = radius + randomInRange(-5, 5);
          const companionAngle = angle + randomInRange(-0.2, 0.2);
          cornerDunes.push({
            position: [
              corner[0] + Math.cos(companionAngle) * companionRadius,
              randomInRange(-0.5, 0),
              corner[1] + Math.sin(companionAngle) * companionRadius
            ],
            scale: [
              randomInRange(5, 8),   // Very small width
              randomInRange(8, 12),  // Very small height
              randomInRange(5, 8)    // Very small depth
            ],
            rotation: [0, companionAngle + randomInRange(-0.2, 0.2), 0],
            color: `hsl(43, ${randomInRange(40, 50)}%, ${randomInRange(70, 80)}%)`
          });
        }
      });
      
      return cornerDunes;
    }, [spread]);

    return (
      <group>
        {/* Enhanced lighting for desert environment */}
        <ambientLight intensity={0.5} />
        <directionalLight 
          position={[50, 50, 0]} 
          intensity={1.4} 
          castShadow
          shadow-mapSize-width={2048}
          shadow-mapSize-height={2048}
          shadow-camera-far={300}
          shadow-camera-left={-100}
          shadow-camera-right={100}
          shadow-camera-top={100}
          shadow-camera-bottom={-100}
        />

        {/* Desert-specific sky lighting */}
        <hemisphereLight 
          args={[new Color('#ffd700'), new Color('#e6c587'), 0.4]}
        />

        {/* Render the dunes */}
        {sandMountains.map((dune, i) => (
          <mesh
            key={`dune-${i}`}
            position={dune.position}
            scale={dune.scale}
            rotation={dune.rotation}
            castShadow
            receiveShadow
          >
            <sphereGeometry args={[1, 32, 32, 0, Math.PI, 0, Math.PI]} />
            <meshStandardMaterial
              color={dune.color}
              roughness={0.95}
              metalness={0.05}
              envMapIntensity={0.6}
            />
          </mesh>
        ))}

        {/* Enhanced ground plane with desert styling */}
        <mesh 
          rotation={[-Math.PI / 2, 0, 0]} 
          position={[0, -0.01, 0]}
          receiveShadow
        >
          <planeGeometry args={[spread * 4, spread * 4, 128, 128]} />
          <meshStandardMaterial
            color="#e6c587"
            roughness={1}
            metalness={0}
            onBeforeCompile={(shader) => {
              shader.uniforms.time = { value: 0 };
              shader.vertexShader = `
                uniform float time;
                
                //  Simplex 3D Noise 
                //  by Ian McEwan, Ashima Arts
                vec4 permute(vec4 x){return mod(((x*34.0)+1.0)*x, 289.0);}
                vec4 taylorInvSqrt(vec4 r){return 1.79284291400159 - 0.85373472095314 * r;}
                
                float snoise(vec3 v){ 
                  const vec2  C = vec2(1.0/6.0, 1.0/3.0) ;
                  const vec4  D = vec4(0.0, 0.5, 1.0, 2.0);
                  
                  vec3 i  = floor(v + dot(v, C.yyy) );
                  vec3 x0 =   v - i + dot(i, C.xxx) ;
                  
                  vec3 g = step(x0.yzx, x0.xyz);
                  vec3 l = 1.0 - g;
                  vec3 i1 = min( g.xyz, l.zxy );
                  vec3 i2 = max( g.xyz, l.zxy );
                  
                  vec3 x1 = x0 - i1 + 1.0 * C.xxx;
                  vec3 x2 = x0 - i2 + 2.0 * C.xxx;
                  vec3 x3 = x0 - 1. + 3.0 * C.xxx;
                  
                  i = mod(i, 289.0 ); 
                  vec4 p = permute( permute( permute( 
                             i.z + vec4(0.0, i1.z, i2.z, 1.0 ))
                           + i.y + vec4(0.0, i1.y, i2.y, 1.0 )) 
                           + i.x + vec4(0.0, i1.x, i2.x, 1.0 ));
                           
                  float n_ = 1.0/7.0;
                  vec3  ns = n_ * D.wyz - D.xzx;
                  
                  vec4 j = p - 49.0 * floor(p * ns.z *ns.z);
                  
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
                ${shader.vertexShader}
              `;
              
              shader.vertexShader = shader.vertexShader.replace(
                '#include <begin_vertex>',
                `
                  vec3 transformed = vec3(position);
                  
                  // Base terrain undulation
                  float noise = snoise(vec3(position.x * 0.02, position.z * 0.02, time * 0.1)) * 0.5;
                  noise += snoise(vec3(position.x * 0.1, position.z * 0.1, time * 0.05)) * 0.25;
                  
                  // Add ripple effect for sand texture
                  float ripples = sin(position.x * 2.0 + position.z * 2.0 + time) * 0.05;
                  ripples *= smoothstep(0.0, 10.0, abs(position.x)) * smoothstep(0.0, 10.0, abs(position.z));
                  
                  transformed.y += noise + ripples;
                  
                  // Add elevation near corners
                  vec2 cornerDist = abs(position.xz);
                  float cornerElevation = smoothstep(80.0, 20.0, length(cornerDist)) * 0.5;
                  transformed.y += cornerElevation;
                `
              );
            }}
          />
        </mesh>

        {/* Desert atmosphere */}
        <fog attach="fog" args={['#ffd700', 100, 400]} />
      </group>
    );
};


const Snow = ({ particleCount = 5000, spread = 50 }) => {
  const snowflakes = useMemo(() => {
    return new Array(particleCount).fill(null).map(() => ({
      position: [
        randomInRange(-spread, spread),
        randomInRange(0, spread),
        randomInRange(-spread, spread),
      ],
      speed: randomInRange(0.01, 0.05),
    }))
  }, [particleCount, spread])

  useFrame((state) => {
    const time = state.clock.getElapsedTime()
    snowflakes.forEach((snowflake, i) => {
      snowflake.position[1] -= snowflake.speed
      if (snowflake.position[1] < 0) snowflake.position[1] = spread
      snowflake.position[0] += Math.sin(time + i) * 0.01
    })
  })

  return (
    <group>
      <Instances>
        <sphereGeometry args={[0.05, 8, 8]} />
        <meshStandardMaterial color="white" />
        {snowflakes.map((snowflake, i) => (
          <Instance key={i} position={snowflake.position} />
        ))}
      </Instances>
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, -0.01, 0]}>
        <planeGeometry args={[100, 100]} />
        <meshStandardMaterial color="#e6f2ff" />
      </mesh>
    </group>
  )
}

export const EnvironmentScene = ({ environment }) => {
  switch (environment) {
    case 'forest':
      return <Forest />
    case 'city':
      return <City />
    case 'desert':
      return <Desert />
    case 'snow':
      return <Snow />
    default:
      return null
  }
}