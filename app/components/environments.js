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
    // Generate mountains for the corners
    const mountains = useMemo(() => {
      const cornerMountains = [];
      const corners = [
        [-spread * 2, -spread * 2], // Back left
        [spread * 2, -spread * 2],  // Back right
        [-spread * 2, spread * 2],  // Front left
        [spread * 2, spread * 2]    // Front right
      ];
  
      corners.forEach((corner, cornerIndex) => {
        // Generate a cluster of mountains for each corner
        const mountainCount = 8; // Mountains per corner
        
        for (let i = 0; i < mountainCount; i++) {
          // Create variation in mountain positions around the corner
          const offsetX = randomInRange(-15, 15);
          const offsetZ = randomInRange(-15, 15);
          const height = randomInRange(20, 35);
          const baseWidth = randomInRange(8, 15);
          
          // Create multiple peaks per mountain for more natural look
          const peakCount = Math.floor(randomInRange(2, 4));
          for (let peak = 0; peak < peakCount; peak++) {
            const peakOffset = {
              x: randomInRange(-3, 3),
              z: randomInRange(-3, 3),
              height: randomInRange(0.7, 1) * height
            };
  
            cornerMountains.push({
              position: [
                corner[0] + offsetX + peakOffset.x,
                0,
                corner[1] + offsetZ + peakOffset.z
              ],
              scale: [
                baseWidth * randomInRange(0.8, 1.2),
                peakOffset.height,
                baseWidth * randomInRange(0.8, 1.2)
              ],
              rotation: [0, randomInRange(0, Math.PI * 2), 0],
              color: `rgb(${139 + randomInRange(-20, 20)}, ${115 + randomInRange(-20, 20)}, ${85 + randomInRange(-20, 20)})`
            });
          }
        }
      });
      
      return cornerMountains;
    }, [spread]);
  
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
  
        {/* Corner Mountains with varied shapes */}
        {mountains.map((mountain, i) => (
          <mesh
            key={`mountain-${i}`}
            position={mountain.position}
            scale={mountain.scale}
            rotation={mountain.rotation}
          >
            {/* Use different geometries for variety */}
            {i % 3 === 0 ? (
              // Jagged peak
              <cylinderGeometry args={[0.7, 1, 2, 4]} />
            ) : i % 3 === 1 ? (
              // Rounded peak
              <coneGeometry args={[1, 2, 6]} />
            ) : (
              // Sharp peak
              <coneGeometry args={[1, 2, 4]} />
            )}
            <meshStandardMaterial
              color={mountain.color}
              roughness={1}
              metalness={0}
            />
          </mesh>
        ))}
  
        {/* Ground plane */}
        <mesh 
          rotation={[-Math.PI / 2, 0, 0]} 
          position={[0, -0.01, 0]}
          receiveShadow
        >
          <planeGeometry args={[spread * 4, spread * 4]} />
          <meshStandardMaterial
            color="#e6c587"
            roughness={1}
            metalness={0}
          />
        </mesh>
  
        {/* Enhanced fog for better distance effect */}
        <fog attach="fog" args={['#e6c587', 60, 300]} />
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