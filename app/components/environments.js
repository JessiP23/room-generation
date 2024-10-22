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
    // Previous dunes generation code remains the same
    const dunes = useMemo(() => {
      return new Array(duneCount).fill(null).map(() => ({
        position: [randomInRange(-spread, spread), randomInRange(-2, 2), randomInRange(-spread, spread)],
        scale: [randomInRange(5, 15), randomInRange(1, 5), randomInRange(5, 15)],
        rotation: [0, randomInRange(0, Math.PI * 2), 0],
      }));
    }, [duneCount, spread]);
  
    const smallDunes = useMemo(() => {
      return new Array(duneCount * 2).fill(null).map(() => ({
        position: [randomInRange(-spread, spread), randomInRange(-1, 1), randomInRange(-spread, spread)],
        scale: [randomInRange(2, 4), randomInRange(0.5, 2), randomInRange(2, 4)],
        rotation: [0, randomInRange(0, Math.PI * 2), 0],
      }));
    }, [duneCount, spread]);
  
    const rocks = useMemo(() => {
      return new Array(duneCount / 2).fill(null).map(() => ({
        position: [randomInRange(-spread, spread), 0, randomInRange(-spread, spread)],
        scale: [randomInRange(0.2, 1), randomInRange(0.2, 1), randomInRange(0.2, 1)],
        rotation: [
          randomInRange(0, Math.PI),
          randomInRange(0, Math.PI),
          randomInRange(0, Math.PI)
        ],
      }));
    }, [duneCount, spread]);
  
    // Generate distant mountains
    const mountains = useMemo(() => {
      // Create multiple mountain ranges
      const ranges = [];
      const rangeCount = 3; // Number of mountain ranges
      
      for (let range = 0; range < rangeCount; range++) {
        const mountainCount = 15; // Mountains per range
        const rangeDistance = 150 + range * 50; // Each range is further back
        const rangeHeight = 30 - range * 5; // Each range is shorter (for perspective)
        
        for (let i = 0; i < mountainCount; i++) {
          const angle = (i / mountainCount) * Math.PI * 2;
          const radius = rangeDistance + randomInRange(-10, 10);
          
          ranges.push({
            position: [
              Math.sin(angle) * radius,
              randomInRange(-2, 2),
              Math.cos(angle) * radius
            ],
            scale: [
              randomInRange(15, 25),
              randomInRange(rangeHeight - 5, rangeHeight + 5),
              randomInRange(15, 25)
            ],
            rotation: [0, angle + Math.PI, 0],
          });
        }
      }
      return ranges;
    }, []);
  
    return (
      <group>
        {/* Environment lighting */}
        <ambientLight intensity={0.5} />
        <directionalLight 
          position={[5, 5, 5]} 
          intensity={1} 
          castShadow
          shadow-mapSize-width={2048}
          shadow-mapSize-height={2048}
        />
  
        {/* Sky hemisphere light for better ambient lighting */}
        <hemisphereLight 
          args={[new Color('#87CEEB'), new Color('#e6c587'), 0.5]}
        />
  
        {/* Distant Mountains */}
        {mountains.map((mountain, i) => (
          <mesh
            key={`mountain-${i}`}
            position={mountain.position}
            scale={mountain.scale}
            rotation={mountain.rotation}
          >
            <coneGeometry args={[1, 2, 4]} />
            <meshStandardMaterial
              color="#8b7355"
              roughness={1}
              metalness={0}
              // Fog affects mountains more for distance effect
              fog={true}
            />
          </mesh>
        ))}
  
        {/* Main large dunes */}
        {dunes.map((dune, i) => (
          <mesh 
            key={`dune-${i}`}
            position={dune.position}
            scale={dune.scale}
            rotation={dune.rotation}
            castShadow
            receiveShadow
          >
            <sphereGeometry args={[1, 32, 32, 0, Math.PI]} />
            <meshStandardMaterial 
              color="#e6c587"
              roughness={0.9}
              metalness={0.1}
              envMapIntensity={0.5}
            />
          </mesh>
        ))}
  
        {/* Smaller detail dunes */}
        {smallDunes.map((dune, i) => (
          <mesh
            key={`small-dune-${i}`}
            position={dune.position}
            scale={dune.scale}
            rotation={dune.rotation}
            castShadow
            receiveShadow
          >
            <sphereGeometry args={[1, 16, 16, 0, Math.PI]} />
            <meshStandardMaterial
              color="#dbb976"
              roughness={0.8}
              metalness={0.1}
            />
          </mesh>
        ))}
  
        {/* Scattered rocks */}
        {rocks.map((rock, i) => (
          <mesh
            key={`rock-${i}`}
            position={rock.position}
            scale={rock.scale}
            rotation={rock.rotation}
            castShadow
            receiveShadow
          >
            <dodecahedronGeometry args={[1]} />
            <meshStandardMaterial
              color="#b3a17d"
              roughness={0.9}
              metalness={0.2}
            />
          </mesh>
        ))}
  
        {/* Ground plane */}
        <mesh 
          rotation={[-Math.PI / 2, 0, 0]} 
          position={[0, -0.01, 0]}
          receiveShadow
        >
          <planeGeometry args={[100, 100, 50, 50]} />
          <meshStandardMaterial
            color="#e6c587"
            roughness={1}
            metalness={0}
            wireframe={false}
            onBeforeCompile={(shader) => {
              shader.vertexShader = shader.vertexShader.replace(
                '#include <begin_vertex>',
                `
                  vec3 transformed = vec3(position);
                  float elevation = sin(position.x * 0.05) * cos(position.z * 0.05) * 0.5;
                  transformed.y += elevation;
                  `
              );
            }}
          />
        </mesh>
  
        {/* Enhanced fog for better distance effect */}
        <fog attach="fog" args={['#e6c587', 50, 250]} />
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