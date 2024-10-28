import React, { useMemo } from 'react'
import * as THREE from 'three'
import { useFrame } from '@react-three/fiber'
import { Instances, Instance } from '@react-three/drei'
import { Color, MathUtils } from 'three'

const randomInRange = (min, max) => Math.random() * (max - min) + min

const Forest = ({ count = 100, spread = 20 }) => {
  const trees = useMemo(() => {
    return new Array(count).fill(null).map(() => {
      let x, z
      // Distribute trees in the corners
      if (Math.random() < 0.5) {
        x = randomInRange(-spread, -spread/2)
      } else {
        x = randomInRange(spread/2, spread)
      }
      if (Math.random() < 0.5) {
        z = randomInRange(-spread, -spread/2)
      } else {
        z = randomInRange(spread/2, spread)
      }
      return {
        position: [x, 0, z],
        scale: randomInRange(0.5, 1.5),
        rotation: [0, randomInRange(0, Math.PI * 2), 0],
      }
    })
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

// city
const City = ({ buildingCount = 40, spread = 20 }) => {
  const buildings = useMemo(() => {
    const buildingsArray = [];
    
    for (let i = 0; i < buildingCount; i++) {
      let positionX, positionZ;

      // Randomly select a corner
      const corner = Math.floor(Math.random() * 4);

      switch (corner) {
        case 0: // Top-left corner
          positionX = randomInRange(-spread, -spread / 2);
          positionZ = randomInRange(spread / 2, spread);
          break;
        case 1: // Top-right corner
          positionX = randomInRange(spread / 2, spread);
          positionZ = randomInRange(spread / 2, spread);
          break;
        case 2: // Bottom-left corner
          positionX = randomInRange(-spread, -spread / 2);
          positionZ = randomInRange(-spread, -spread / 2);
          break;
        case 3: // Bottom-right corner
          positionX = randomInRange(spread / 2, spread);
          positionZ = randomInRange(-spread, -spread / 2);
          break;
      }

      const height = randomInRange(8, 25);
      const width = randomInRange(1, 8);

      buildingsArray.push({
        position: [positionX, height / 2, positionZ],
        scale: [width, height, width],
        color: new THREE.Color(randomInRange(0.3, 0.8), randomInRange(0.3, 0.8), randomInRange(0.3, 0.8)),
      });
    }

    return buildingsArray;
  }, [buildingCount, spread]);

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
  );
};


  
  


const Desert = ({ duneCount = 20, spread = 40 }) => {
  const sandMountains = useMemo(() => {
    const cornerDunes = [];
    const corners = [
      [spread, -spread],
      [-spread, -spread],
      [spread, spread],
      [-spread, spread]
    ];
    
    const dunesPerCorner = 5;
    
    corners.forEach(corner => {
      for (let i = 0; i < dunesPerCorner; i++) {
        const angle = (i / dunesPerCorner) * Math.PI / 2 + randomInRange(-0.3, 0.3);
        const radius = randomInRange(10, 20);
        
        const mainDune = {
          position: [
            corner[0] + Math.cos(angle) * radius,
            randomInRange(-1, 0),
            corner[1] + Math.sin(angle) * radius
          ],
          scale: [
            randomInRange(10, 15),
            randomInRange(15, 20),
            randomInRange(10, 15)
          ],
          rotation: [0, angle + randomInRange(-0.15, 0.15), 0],
          color: `hsl(43, ${randomInRange(35, 45)}%, ${randomInRange(65, 75)}%)`
        };
        cornerDunes.push(mainDune);

        const companionRadius = radius + randomInRange(-5, 5);
        const companionAngle = angle + randomInRange(-0.2, 0.2);
        cornerDunes.push({
          position: [
            corner[0] + Math.cos(companionAngle) * companionRadius,
            randomInRange(-0.5, 0),
            corner[1] + Math.sin(companionAngle) * companionRadius
          ],
          scale: [
            randomInRange(5, 8),
            randomInRange(8, 12),
            randomInRange(5, 8)
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
      <hemisphereLight 
        args={[new Color('#ffd700'), new Color('#e6c587'), 0.4]}
      />
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
        />
      </mesh>
      <fog attach="fog" args={['#ffd700', 100, 400]} />
    </group>
  );
};

const Snow = ({ particleCount = 5000, spread = 50 }) => {
  const snowflakes = useMemo(() => {
    return new Array(particleCount).fill(null).map(() => {
      let x, z;
      if (Math.random() < 0.5) {
        x = randomInRange(-spread, -spread/2)
      } else {
        x = randomInRange(spread/2, spread)
      }
      if (Math.random() < 0.5) {
        z = randomInRange(-spread, -spread/2)
      } else {
        z = randomInRange(spread/2, spread)
      }
      return {
        position: [x, randomInRange(0, spread), z],
        speed: randomInRange(0.01, 0.05),
      }
    })
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