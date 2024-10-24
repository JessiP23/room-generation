import React, { useMemo } from 'react'
import * as THREE from 'three'
import { useLoader } from '@react-three/fiber'
import { TextureLoader } from 'three/src/loaders/TextureLoader'

export default function Fence({ points, design = 'wooden', height = 5 }) {
  const fenceTexture = useLoader(TextureLoader, '/fence_texture.jpg')

  const fenceSegments = useMemo(() => {
    if (points.length < 2) return []

    const segments = []
    for (let i = 0; i < points.length - 1; i++) {
      const start = points[i]
      const end = points[i + 1]
      const direction = end.clone().sub(start)
      const length = direction.length()
      const center = start.clone().add(direction.multiplyScalar(0.5))
      const angle = Math.atan2(direction.z, direction.x)

      segments.push({ start, end, center, length, angle })
    }
    return segments
  }, [points])

  const fenceMaterial = useMemo(() => {
    return new THREE.MeshStandardMaterial({
      map: fenceTexture,
      side: THREE.DoubleSide,
      roughness: 0.8,
      metalness: 0.2,
    })
  }, [fenceTexture])

  return (
    <group>
      {fenceSegments.map((segment, index) => (
        <mesh
          key={index}
          position={[segment.center.x, height / 2, segment.center.z]}
          rotation={[0, segment.angle, 0]}
          material={fenceMaterial}
        >
          <boxGeometry args={[segment.length, height, 0.1]} />
        </mesh>
      ))}
    </group>
  )
}