import React, { useMemo } from 'react'
import * as THREE from 'three'
import { useFrame } from '@react-three/fiber'
import { Instances, Instance } from '@react-three/drei'

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
  const dunes = useMemo(() => {
    return new Array(duneCount).fill(null).map(() => ({
      position: [randomInRange(-spread, spread), randomInRange(-2, 2), randomInRange(-spread, spread)],
      scale: [randomInRange(5, 15), randomInRange(1, 5), randomInRange(5, 15)],
      rotation: [0, randomInRange(0, Math.PI * 2), 0],
    }))
  }, [duneCount, spread])

  return (
    <group>
      {dunes.map((dune, i) => (
        <mesh key={i} position={dune.position} scale={dune.scale} rotation={dune.rotation}>
          <sphereGeometry args={[1, 16, 16, 0, Math.PI]} />
          <meshStandardMaterial color="#e6c587" />
        </mesh>
      ))}
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, -0.01, 0]}>
        <planeGeometry args={[100, 100]} />
        <meshStandardMaterial color="#e6c587" />
      </mesh>
    </group>
  )
}

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