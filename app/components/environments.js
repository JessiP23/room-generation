'use client'

import React, { useMemo, useEffect, useRef } from 'react'
import * as THREE from 'three'
import { useFrame, useThree } from '@react-three/fiber'
import { Color, MathUtils } from 'three'
import { Instances, Instance, useGLTF, Environment, Cloud, Stars, Effects, PerformanceMonitor, useTexture } from '@react-three/drei'
import { Vector3 } from 'three'
import { createNoise2D } from 'simplex-noise'

const randomInRange = (min, max) => Math.random() * (max - min) + min
const simplex = createNoise2D()

const GrassPlane = ({ size = 200 }) => {
  const planeRef = useRef()
  
  const grassTexture = useMemo(() => {
    const canvas = document.createElement('canvas')
    canvas.width = 256
    canvas.height = 256
    const ctx = canvas.getContext('2d')
    
    // Create grass pattern
    const drawGrassBlade = (x, y) => {
      ctx.beginPath()
      ctx.moveTo(x, y)
      ctx.quadraticCurveTo(
        x + Math.random() * 4 - 2,
        y - 10 - Math.random() * 5,
        x + Math.random() * 6 - 3,
        y - 15 - Math.random() * 5
      )
      ctx.strokeStyle = `rgb(${30 + Math.random() * 50}, ${100 + Math.random() * 50}, ${30 + Math.random() * 30})`
      ctx.lineWidth = 1 + Math.random()
      ctx.stroke()
    }
    
    // Fill background
    ctx.fillStyle = '#2d5a27'
    ctx.fillRect(0, 0, canvas.width, canvas.height)
    
    // Draw grass blades
    for (let i = 0; i < 1000; i++) {
      drawGrassBlade(
        Math.random() * canvas.width,
        canvas.height - Math.random() * 5
      )
    }
    
    const texture = new THREE.CanvasTexture(canvas)
    texture.wrapS = texture.wrapT = THREE.RepeatWrapping
    texture.repeat.set(20, 20)
    return texture
  }, [])

  return (
    <mesh 
      ref={planeRef} 
      rotation={[-Math.PI / 2, 0, 0]} 
      position={[0, -0.01, 0]}
    >
      <planeGeometry args={[size, size, 128, 128]} />
      <meshStandardMaterial
        map={grassTexture}
        roughnessMap={grassTexture}
        normalScale={new THREE.Vector3(0.5, 0.5)}
        color="#4a8505"
        roughness={0.8}
        metalness={0.1}
      />
    </mesh>
  )
}

const Vegetation = ({ count = 1000, spread = 100 }) => {
  const positions = useMemo(() => {
    const pos = []
    for (let i = 0; i < count; i++) {
      const angle = Math.random() * Math.PI * 2
      const radius = Math.random() * spread
      pos.push({
        position: [
          Math.cos(angle) * radius,
          0,
          Math.sin(angle) * radius
        ],
        scale: [
          0.3 + Math.random() * 0.4,
          0.2 + Math.random() * 0.3,
          0.3 + Math.random() * 0.4
        ],
        rotation: [0, Math.random() * Math.PI * 2, 0]
      })
    }
    return pos
  }, [count, spread])

  return (
    <Instances range={count}>
      <planeGeometry args={[1, 1]} />
      <meshStandardMaterial
        color="#3d7c32"
        roughness={0.8}
        metalness={0.1}
        transparent
        alphaTest={0.5}
        side={THREE.DoubleSide}
      />
      {positions.map((props, i) => (
        <Instance key={i} {...props} />
      ))}
    </Instances>
  )
}



// Improved noise function for more natural terrain
const noise2D = (x, z) => {
  return Math.sin(x * 0.5) * Math.sin(z * 0.5) * 0.5 + Math.sin(x * 0.2) * Math.sin(z * 0.2) * 0.25 + Math.sin(x * 0.1) * Math.sin(z * 0.1) * 0.25
}

const Simple = ({ count = 100, spread = 20 }) => {
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


const Town = ({ buildingCount = 40, spread = 20 }) => {
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

const Forest = ({ count = 100, spread = 100 }) => {
  const groupRef = useRef()
  const { camera } = useThree()
  
  // Enhanced ground mesh with better terrain
  const terrainGeometry = useMemo(() => {
    const geometry = new THREE.PlaneGeometry(200, 200, 128, 128)
    const positions = geometry.attributes.position.array
    
    for (let i = 0; i < positions.length; i += 3) {
      const x = positions[i]
      const z = positions[i + 2]
      positions[i + 1] = noise2D(x * 0.05, z * 0.05) * 2
    }
    
    geometry.computeVertexNormals()
    return geometry
  }, [])
  
  const trees = useMemo(() => {
    const treeInstances = []
    const clusterCount = 8 // More natural clusters
    const clusterCenters = []
    
    // Generate primary and secondary paths through the forest
    const paths = []
    for (let i = 0; i < 3; i++) {
      const angle = (i / 3) * Math.PI * 2
      paths.push({
        start: { x: Math.cos(angle) * spread, z: Math.sin(angle) * spread },
        end: { x: -Math.cos(angle) * spread, z: -Math.sin(angle) * spread }
      })
    }
    
    // Generate cluster centers avoiding paths
    for (let i = 0; i < clusterCount; i++) {
      const angle = (i / clusterCount) * Math.PI * 2
      const distance = randomInRange(spread * 0.3, spread * 0.8)
      const center = {
        x: Math.cos(angle) * distance,
        z: Math.sin(angle) * distance
      }
      
      // Check distance from paths
      const isFarFromPaths = paths.every(path => {
        const distToPath = Math.abs(
          (path.end.z - path.start.z) * center.x -
          (path.end.x - path.start.x) * center.z +
          path.end.x * path.start.z -
          path.end.z * path.start.x
        ) / Math.sqrt(
          Math.pow(path.end.z - path.start.z, 2) +
          Math.pow(path.end.x - path.start.x, 2)
        )
        return distToPath > 5
      })
      
      if (isFarFromPaths) {
        clusterCenters.push(center)
      }
    }

    for (let i = 0; i < count; i++) {
      let x, z
      if (Math.random() < 0.85) { // More trees in clusters
        const cluster = clusterCenters[Math.floor(Math.random() * clusterCenters.length)]
        const angle = Math.random() * Math.PI * 2
        const distance = randomInRange(0, 12) * Math.pow(Math.random(), 0.5) // More natural distribution
        x = cluster.x + Math.cos(angle) * distance
        z = cluster.z + Math.sin(angle) * distance
      } else {
        // Scattered trees
        const angle = Math.random() * Math.PI * 2
        const distance = randomInRange(spread * 0.2, spread)
        x = Math.cos(angle) * distance
        z = Math.sin(angle) * distance
      }

      // Check if tree is too close to paths
      const isFarFromPaths = paths.every(path => {
        const distToPath = Math.abs(
          (path.end.z - path.start.z) * x -
          (path.end.x - path.start.x) * z +
          path.end.x * path.start.z -
          path.end.z * path.start.x
        ) / Math.sqrt(
          Math.pow(path.end.z - path.start.z, 2) +
          Math.pow(path.end.x - path.start.x, 2)
        )
        return distToPath > 3
      })

      if (!isFarFromPaths) continue

      const positionNoise = noise2D(x * 0.1, z * 0.1)
      const height = randomInRange(2.5, 4.5) * (0.8 + positionNoise * 0.4)
      const width = randomInRange(0.7, 1.3) * (0.9 + positionNoise * 0.2)

      // Enhanced seasonal variation
      const season = Math.random()
      let leafColor
      if (season < 0.6) { // Summer trees
        leafColor = new Color().setHSL(
          0.25 + randomInRange(-0.05, 0.05),
          0.6 + randomInRange(-0.2, 0.2),
          0.35 + randomInRange(-0.1, 0.1)
        )
      } else if (season < 0.8) { // Fall trees
        leafColor = new Color().setHSL(
          0.08 + randomInRange(-0.05, 0.05),
          0.7 + randomInRange(-0.2, 0.2),
          0.4 + randomInRange(-0.1, 0.1)
        )
      } else { // Spring/Dead trees
        leafColor = new Color().setHSL(
          0.15 + randomInRange(-0.05, 0.05),
          0.4 + randomInRange(-0.2, 0.2),
          0.45 + randomInRange(-0.1, 0.1)
        )
      }

      // Add ground elevation to tree position
      const y = noise2D(x * 0.05, z * 0.05) * 2

      treeInstances.push({
        position: [x, y, z],
        scale: [width, height, width],
        rotation: [
          randomInRange(-0.1, 0.1),
          randomInRange(0, Math.PI * 2),
          randomInRange(-0.1, 0.1)
        ],
        leafColor,
        trunkColor: new Color().setHSL(
          0.05 + randomInRange(-0.02, 0.02),
          0.4 + randomInRange(-0.2, 0.2),
          0.3 + randomInRange(-0.1, 0.1)
        )
      })
    }
    return treeInstances
  }, [count, spread])

  // Enhanced wind animation
  useFrame((state) => {
    const time = state.clock.getElapsedTime()
    trees.forEach((tree, i) => {
      const instance = groupRef.current?.children[i]
      if (instance) {
        const windStrength = 0.02
        const windSpeed = 1.5
        const uniquePhase = i * 0.1
        instance.position.y = tree.position[1] + Math.sin(time * windSpeed + uniquePhase) * windStrength
        instance.rotation.z = Math.sin(time * windSpeed + uniquePhase) * windStrength * 0.2
      }
    })
  })

  return (
    <group ref={groupRef}>
      {/* Enhanced ground with better materials and shading */}
      <GrassPlane size={spread * 2} />
      <Vegetation count={count * 3} spread={spread} />
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, -0.01, 0]} geometry={terrainGeometry}>
        <meshStandardMaterial
          color="#2d5a27"
          roughness={0.9}
          metalness={0.1}
          onBeforeCompile={(shader) => {
            shader.uniforms.time = { value: 0 }
            shader.vertexShader = `
              varying vec2 vUv;
              varying float vElevation;
              uniform float time;
              
              ${shader.vertexShader.replace(
                '#include <begin_vertex>',
                `
                #include <begin_vertex>
                vElevation = position.y;
                vUv = uv;
                `
              )}
            `
            
            shader.fragmentShader = `
              varying vec2 vUv;
              varying float vElevation;
              ${shader.fragmentShader.replace(
                '#include <color_fragment>',
                `
                #include <color_fragment>
                float grassBlend = smoothstep(-1.0, 1.0, vElevation);
                vec3 grassColor = mix(
                  vec3(0.2, 0.5, 0.15),
                  vec3(0.1, 0.4, 0.1),
                  grassBlend
                );
                
                // Add subtle variation
                float noise = fract(sin(dot(vUv, vec2(12.9898, 78.233))) * 43758.5453);
                grassColor += noise * 0.05;
                
                // Add path color
                vec2 pathUv = fract(vUv * 20.0);
                float pathMask = smoothstep(0.45, 0.55, max(pathUv.x, pathUv.y));
                vec3 pathColor = vec3(0.4, 0.3, 0.2);
                
                diffuseColor.rgb = mix(pathColor, grassColor, pathMask);
                `
              )}
            `
          }}
        />
      </mesh>

      {/* Enhanced tree instances */}
      <Instances range={count}>
        <cylinderGeometry args={[0.2, 0.4, 4, 8]} />
        <meshStandardMaterial roughness={0.8} />
        {trees.map((tree, i) => (
          <group key={i} position={tree.position} scale={tree.scale} rotation={tree.rotation}>
            <Instance color={tree.trunkColor} />
            <mesh position={[0, 2.5, 0]}>
              <coneGeometry args={[1.5, 3, 8]} />
              <meshStandardMaterial
                color={tree.leafColor}
                roughness={0.7}
                metalness={0.1}
                transparent
                opacity={0.9}
              />
            </mesh>
          </group>
        ))}
      </Instances>
    </group>
  )
}


const City = ({ buildingCount = 40, spread = 150 }) => {
  const groupRef = useRef()
  const windowMaterialsRef = useRef([])
  const trafficLightRef = useRef([])
  const { camera } = useThree()

  // Define street grid
  const gridSize = 12 // Increased grid size for more spread
  const blockSize = spread / gridSize
  const streets = useMemo(() => {
    const streetArray = []
    
    for (let i = -gridSize/2; i <= gridSize/2; i++) {
      streetArray.push({
        start: { x: i * blockSize, z: -spread/2 },
        end: { x: i * blockSize, z: spread/2 }
      })
      streetArray.push({
        start: { x: -spread/2, z: i * blockSize },
        end: { x: spread/2, z: i * blockSize }
      })
    }
    
    return streetArray
  }, [spread, gridSize, blockSize])

  const buildings = useMemo(() => {
    const buildingsArray = []
    
    for (let blockX = -gridSize/2; blockX < gridSize/2; blockX++) {
      for (let blockZ = -gridSize/2; blockZ < gridSize/2; blockZ++) {
        const blockCenterX = blockX * blockSize
        const blockCenterZ = blockZ * blockSize
        
        // Calculate distance from center
        const distanceFromCenter = Math.sqrt(blockCenterX * blockCenterX + blockCenterZ * blockCenterZ)
        
        // Only place buildings if they're far enough from center (creating a ring)
        if (distanceFromCenter > spread * 0.2 && distanceFromCenter < spread * 0.45) {
          const isBusinessDistrict = Math.random() > 0.5
          
          // Number of buildings per block
          const buildingsPerBlock = isBusinessDistrict ? 
            Math.floor(randomInRange(2, 4)) : 
            Math.floor(randomInRange(2, 3))
          
          for (let i = 0; i < buildingsPerBlock; i++) {
            // Position within block, keeping distance from streets
            const margin = 2
            const x = blockCenterX + randomInRange(-blockSize/2 + margin, blockSize/2 - margin)
            const z = blockCenterZ + randomInRange(-blockSize/2 + margin, blockSize/2 - margin)
            
            let height, width, depth, style
            if (isBusinessDistrict) {
              height = randomInRange(20, 35)
              width = randomInRange(5, 8)
              depth = width
              style = Math.random() > 0.3 ? 'modern' : 'classic'
            } else {
              height = randomInRange(8, 15)
              width = randomInRange(3, 5)
              depth = width
              style = Math.random() > 0.7 ? 'modern' : 'classic'
            }

            const baseColor = new Color()
            if (style === 'modern') {
              baseColor.setHSL(
                randomInRange(0.5, 0.7),
                randomInRange(0.1, 0.3),
                randomInRange(0.6, 0.8)
              )
            } else {
              baseColor.setHSL(
                randomInRange(0.05, 0.1),
                randomInRange(0.3, 0.5),
                randomInRange(0.4, 0.6)
              )
            }

            buildingsArray.push({
              position: [x, height/2, z],
              scale: [width, height, depth],
              rotation: [0, randomInRange(0, Math.PI * 0.25), 0],
              color: baseColor,
              style,
              windows: Math.floor(height/3),
              hasRoof: Math.random() > 0.5
            })
          }
        }
      }
    }
    
    return buildingsArray
  }, [spread, gridSize, blockSize])

  // Generate traffic light positions at intersections
  const trafficLights = useMemo(() => {
    const lights = []
    
    for (let x = -gridSize/2 + 1; x < gridSize/2; x += 2) {
      for (let z = -gridSize/2 + 1; z < gridSize/2; z += 2) {
        const posX = x * blockSize
        const posZ = z * blockSize
        
        // Only add traffic lights if not too close to center
        const distanceFromCenter = Math.sqrt(posX * posX + posZ * posZ)
        if (distanceFromCenter > spread * 0.15) {
          lights.push({ x: posX, z: posZ })
        }
      }
    }
    
    return lights
  }, [gridSize, blockSize, spread])

  // Create window materials array
  useMemo(() => {
    windowMaterialsRef.current = buildings.map(() => ({
      emissiveIntensity: 0
    }))
  }, [buildings])

  // Traffic light animation state
  const lightState = useRef(0)

  // Enhanced lighting effects with traffic lights
  useFrame((state) => {
    const time = state.clock.getElapsedTime()
    const nightCycle = (Math.sin(time * 0.1) + 1) * 0.5

    // Update building windows
    groupRef.current?.children.forEach((building, index) => {
      if (building && building.children) {
        building.children.forEach(child => {
          if (child.material && child.material.emissive) {
            if (nightCycle > 0.5) {
              const windowFlicker = Math.random() > 0.997
              const flickerIntensity = randomInRange(0.2, 0.4)
              child.material.emissiveIntensity = windowFlicker ? flickerIntensity : 0.2
            } else {
              child.material.emissiveIntensity = 0
            }
          }
        })
      }
    })

    // Update traffic lights
    lightState.current = Math.floor(time % 10) // 10-second cycle
  })

  return (
    <group ref={groupRef}>
      {/* Ground plane with roads */}
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, -0.01, 0]}>
        <planeGeometry args={[200, 200, 128, 128]} />
        <meshStandardMaterial
          color="#333333"
          roughness={0.9}
          metalness={0.1}
          onBeforeCompile={(shader) => {
            shader.uniforms.time = { value: 0 }
            shader.vertexShader = `
              varying vec2 vUv;
              varying vec3 vPosition;
              ${shader.vertexShader.replace(
                '#include <begin_vertex>',
                `
                #include <begin_vertex>
                vPosition = position;
                vUv = uv;
                `
              )}
            `
            
            shader.fragmentShader = `
              varying vec2 vUv;
              varying vec3 vPosition;
              
              float hash(vec2 p) {
                return fract(sin(dot(p, vec2(12.9898, 78.233))) * 43758.5453);
              }
              
              ${shader.fragmentShader.replace(
                'gl_FragColor = vec4( outgoingLight, diffuseColor.a );',
                `
                  vec2 mainGrid = abs(fract(vUv * ${gridSize.toFixed(1)}) - 0.5);
                  float mainStreets = smoothstep(0.48, 0.52, max(mainGrid.x, mainGrid.y));
                  
                  vec2 secondaryGrid = abs(fract(vUv * ${(gridSize * 2).toFixed(1)}) - 0.5);
                  float secondaryStreets = smoothstep(0.48, 0.52, max(secondaryGrid.x, secondaryGrid.y));
                  
                  float sidewalkWidth = 0.05;
                  float sidewalks = smoothstep(0.48 - sidewalkWidth, 0.48, max(mainGrid.x, mainGrid.y)) -
                                  smoothstep(0.52, 0.52 + sidewalkWidth, max(mainGrid.x, mainGrid.y));
                  
                  float detailNoise = hash(vUv * 100.0) * 0.05;
                  
                  vec3 asphaltColor = vec3(0.2) + detailNoise;
                  vec3 sidewalkColor = vec3(0.7) + detailNoise;
                  vec3 mainStreetColor = mix(asphaltColor, vec3(0.15), mainStreets);
                  vec3 finalColor = mix(mainStreetColor, sidewalkColor, sidewalks);
                  
                  vec2 markingUv = fract(vUv * ${(gridSize * 4).toFixed(1)});
                  float markings = smoothstep(0.48, 0.52, max(
                    step(0.48, markingUv.x) * step(markingUv.x, 0.52),
                    step(0.48, markingUv.y) * step(markingUv.y, 0.52)
                  ));
                  finalColor = mix(finalColor, vec3(0.8), markings * mainStreets * 0.8);
                  
                  outgoingLight = finalColor;
                  gl_FragColor = vec4(outgoingLight, diffuseColor.a);
                `
              )}
            `
          }}
        />
      </mesh>

      {/* Buildings */}
      {buildings.map((building, i) => (
        <group key={i}>
          <mesh
            position={building.position}
            scale={building.scale}
            rotation={building.rotation}
          >
            <boxGeometry />
            <meshStandardMaterial
              color={building.color}
              roughness={0.2}
              metalness={0.8}
              envMapIntensity={1}
            />
          </mesh>
          
          {/* Windows */}
          {Array.from({ length: building.windows }).map((_, j) => (
            <mesh
              key={`window-${i}-${j}`}
              position={[
                building.position[0],
                j * 3 + 2,
                building.position[2]
              ]}
              scale={[
                building.scale[0] * 1.01,
                0.1,
                building.scale[2] * 1.01
              ]}
            >
              <boxGeometry />
              <meshStandardMaterial
                color="#444"
                emissive="#ffffff"
                emissiveIntensity={0}
                metalness={0.9}
                roughness={0.1}
              />
            </mesh>
          ))}
          
          {/* Roof */}
          {building.hasRoof && (
            <mesh
              position={[
                building.position[0],
                building.position[1] + building.scale[1]/2 + 0.5,
                building.position[2]
              ]}
              rotation={building.rotation}
            >
              <boxGeometry args={[
                building.scale[0] * 1.1,
                1,
                building.scale[2] * 1.1
              ]} />
              <meshStandardMaterial
                color={building.style === 'modern' ? '#333' : '#622'}
                roughness={0.9}
              />
            </mesh>
          )}
        </group>
      ))}

      {/* Street lamps */}
      {streets.map((street, i) => 
        Array.from({ length: 6 }).map((_, j) => {
          const t = (j + 1) / 7
          const x = street.start.x + (street.end.x - street.start.x) * t
          const z = street.start.z + (street.end.z - street.start.z) * t
          
          // Only place street lamps if not too close to center
          const distanceFromCenter = Math.sqrt(x * x + z * z)
          if (distanceFromCenter > spread * 0.15) {
            return (
              <group key={`lamp-${i}-${j}`} position={[x, 0, z]}>
                <mesh position={[0, 5, 0]}>
                  <cylinderGeometry args={[0.1, 0.1, 10]} />
                  <meshStandardMaterial color="#444" />
                </mesh>
                <mesh position={[0, 10, 0]}>
                  <sphereGeometry args={[0.5]} />
                  <meshStandardMaterial
                    color="#fff"
                    emissive="#fff"
                    emissiveIntensity={1}
                  />
                </mesh>
              </group>
            )
          }
          return null
        })
      )}

      {/* Traffic Lights */}
      {trafficLights.map((pos, i) => (
        <group key={`traffic-${i}`} position={[pos.x, 0, pos.z]}>
          <mesh position={[0, 4, 0]}>
            <cylinderGeometry args={[0.2, 0.2, 8]} />
            <meshStandardMaterial color="#333" />
          </mesh>
          {/* Traffic Light Box */}
          <group position={[0, 6, 0]}>
            <mesh>
              <boxGeometry args={[1, 2.5, 0.5]} />
              <meshStandardMaterial color="#222" />
            </mesh>
            {/* Red Light */}
            <mesh position={[0, 0.8, 0.3]}>
              <sphereGeometry args={[0.2]} />
              <meshStandardMaterial
                color="#ff0000"
                emissive="#ff0000"
                emissiveIntensity={lightState.current < 4 ? 1 : 0}
              />
            </mesh>
            {/* Yellow Light */}
            <mesh position={[0, 0, 0.3]}>
              <sphereGeometry args={[0.2]} />
              <meshStandardMaterial
                color="#ffff00"
                emissive="#ffff00"
                emissiveIntensity={lightState.current >= 4 && lightState.current < 6 ? 1 : 0}
              />
            </mesh>
            {/* Green Light */}
            <mesh position={[0, -0.8, 0.3]}>
              <sphereGeometry args={[0.2]} />
              <meshStandardMaterial
                color="#00ff00"
                emissive="#00ff00"
                emissiveIntensity={lightState.current >= 6 ? 1 : 0}
              />
            </mesh>
          </group>
        </group>
      ))}
    </group>
  )
}

const Desert = ({ duneCount = 20, spread = 40 }) => {
  const groundRef = useRef();
  const duneRefs = useRef([]);
  
  // Load textures
  const [sandDiffuse, sandNormal, sandRoughness] = useTexture([
    '/sand_diffuse.jpg',
    '/sand_normal.jpg',
    '/sand_roughness.jpg'
  ]);

  // Create more natural dune formations
  const sandMountains = useMemo(() => {
    const dunes = [];
    const duneGroups = [];
    
    // Create main dune ridge formations
    for (let i = 0; i < 4; i++) {
      const centerX = randomInRange(-spread * 0.7, spread * 0.7);
      const centerZ = randomInRange(-spread * 0.7, spread * 0.7);
      const groupRotation = Math.random() * Math.PI * 2;
      
      // Create a ridge of connected dunes
      for (let j = 0; j < 8; j++) {
        const distance = j * randomInRange(8, 12);
        const offset = Math.sin(j * 0.5) * randomInRange(5, 10);
        
        const dune = {
          position: [
            centerX + Math.cos(groupRotation) * distance + Math.cos(groupRotation + Math.PI/2) * offset,
            randomInRange(-1, 1),
            centerZ + Math.sin(groupRotation) * distance + Math.sin(groupRotation + Math.PI/2) * offset
          ],
          scale: [
            randomInRange(12, 20),
            randomInRange(15, 25),
            randomInRange(12, 20)
          ],
          rotation: [0, groupRotation + randomInRange(-0.2, 0.2), 0],
          color: `hsl(43, ${randomInRange(35, 45)}%, ${randomInRange(65, 75)}%)`,
          windEffect: randomInRange(0.2, 0.4)
        };
        
        dunes.push(dune);
        
        // Add smaller companion dunes
        for (let k = 0; k < 3; k++) {
          const companionDistance = randomInRange(5, 10);
          const companionAngle = groupRotation + randomInRange(-Math.PI/4, Math.PI/4);
          
          dunes.push({
            position: [
              dune.position[0] + Math.cos(companionAngle) * companionDistance,
              randomInRange(-0.5, 0.5),
              dune.position[2] + Math.sin(companionAngle) * companionDistance
            ],
            scale: [
              dune.scale[0] * randomInRange(0.3, 0.5),
              dune.scale[1] * randomInRange(0.3, 0.5),
              dune.scale[2] * randomInRange(0.3, 0.5)
            ],
            rotation: [0, companionAngle + randomInRange(-0.2, 0.2), 0],
            color: `hsl(43, ${randomInRange(40, 50)}%, ${randomInRange(70, 80)}%)`,
            windEffect: randomInRange(0.1, 0.3)
          });
        }
      }
    }
    
    return dunes;
  }, [spread]);

  // Animate sand particles and wind effects
  useFrame((state) => {
    const time = state.clock.getElapsedTime();
    
    // Animate ground texture
    if (groundRef.current) {
      groundRef.current.material.map.offset.x = Math.sin(time * 0.1) * 0.01;
      groundRef.current.material.map.offset.y = Math.cos(time * 0.1) * 0.01;
    }
    
    // Animate dunes slightly with wind
    duneRefs.current.forEach((dune, i) => {
      if (dune) {
        const windStrength = sandMountains[i].windEffect;
        dune.position.y += Math.sin(time + i) * 0.001 * windStrength;
        dune.rotation.y += Math.sin(time * 0.2 + i) * 0.0001 * windStrength;
      }
    });
  });

  return (
    <group>
      <ambientLight intensity={0.3} />
      <directionalLight 
        position={[50, 50, 0]} 
        intensity={1.6} 
        castShadow
        shadow-mapSize-width={4096}
        shadow-mapSize-height={4096}
        shadow-camera-far={300}
        shadow-camera-left={-100}
        shadow-camera-right={100}
        shadow-camera-top={100}
        shadow-camera-bottom={-100}
      />
      <hemisphereLight 
        args={[new Color('#ffd700'), new Color('#e6c587'), 0.6]}
      />
      
      {/* Dunes */}
      {sandMountains.map((dune, i) => (
        <mesh
          key={`dune-${i}`}
          ref={el => duneRefs.current[i] = el}
          position={dune.position}
          scale={dune.scale}
          rotation={dune.rotation}
          castShadow
          receiveShadow
        >
          <sphereGeometry args={[1, 64, 64, 0, Math.PI, 0, Math.PI]} />
          <meshStandardMaterial
            color={dune.color}
            map={sandDiffuse}
            normalMap={sandNormal}
            roughnessMap={sandRoughness}
            roughness={0.95}
            metalness={0.05}
            envMapIntensity={0.8}
          />
        </mesh>
      ))}
      
      {/* Ground */}
      <mesh 
        ref={groundRef}
        rotation={[-Math.PI / 2, 0, 0]} 
        position={[0, -0.01, 0]}
        receiveShadow
      >
        <planeGeometry args={[spread * 4, spread * 4, 256, 256]} />
        <meshStandardMaterial
          color="#e6c587"
          map={sandDiffuse}
          normalMap={sandNormal}
          roughnessMap={sandRoughness}
          roughness={1}
          metalness={0}
          envMapIntensity={0.4}
        />
      </mesh>
      
      {/* Atmospheric effects */}
      <fog attach="fog" args={['#ffd700', 150, 400]} />
    </group>
  );
};

// snow component
const Snow = ({ particleCount = 9000, spread = 50 }) => {
  const snowRef = useRef();
  const groundRef = useRef();
  const accumulatedSnow = useRef(new Array(100).fill(0));
  
  // Load snow textures
  const [snowDiffuse, snowNormal] = useTexture([
    '/snow_diffuse.jpg',
    '/snow_normal.jpg'
  ]);

  // Generate more realistic snowflakes
  const snowflakes = useMemo(() => {
    return new Array(particleCount).fill(null).map(() => {
      const radius = Math.sqrt(Math.random()) * spread;
      const theta = Math.random() * Math.PI * 2;
      
      return {
        position: new Vector3(
          Math.cos(theta) * radius,
          randomInRange(0, spread),
          Math.sin(theta) * radius
        ),
        initialY: randomInRange(0, spread),
        speed: randomInRange(0.02, 0.08),
        size: randomInRange(0.02, 0.08),
        wobble: randomInRange(0, Math.PI * 2),
        wobbleSpeed: randomInRange(0.5, 1.5)
      };
    });
  }, [particleCount, spread]);

  // Create ground heightmap for snow accumulation
  const heightMap = useMemo(() => {
    const resolution = 128;
    const data = new Float32Array(resolution * resolution);
    
    for (let i = 0; i < resolution; i++) {
      for (let j = 0; j < resolution; j++) {
        const index = i * resolution + j;
        data[index] = simplex(i / 20, j / 20) * 2;
      }
    }
    
    return data;
  }, []);

  useFrame((state) => {
    const time = state.clock.getElapsedTime();
    
    snowflakes.forEach((snowflake, i) => {
      // Update position
      snowflake.position.y -= snowflake.speed;
      
      // Add wind effect
      snowflake.position.x += Math.sin(time * snowflake.wobbleSpeed + snowflake.wobble) * 0.02;
      snowflake.position.z += Math.cos(time * snowflake.wobbleSpeed + snowflake.wobble) * 0.02;
      
      // Reset position when snowflake hits ground
      if (snowflake.position.y < 0) {
        snowflake.position.y = snowflake.initialY;
        
        // Accumulate snow where the snowflake landed
        const gridX = Math.floor((snowflake.position.x + spread) / (spread * 2) * 99);
        const gridZ = Math.floor((snowflake.position.z + spread) / (spread * 2) * 99);
        const index = Math.max(0, Math.min(99, gridX + gridZ * 100));
        accumulatedSnow.current[index] += 0.01;
      }
    });
    
    // Update ground mesh based on accumulated snow
    if (groundRef.current) {
      const vertices = groundRef.current.geometry.attributes.position.array;
      for (let i = 0; i < vertices.length; i += 3) {
        const gridX = Math.floor((vertices[i] + spread) / (spread * 2) * 99);
        const gridZ = Math.floor((vertices[i + 2] + spread) / (spread * 2) * 99);
        const index = Math.max(0, Math.min(99, gridX + gridZ * 100));
        vertices[i + 1] = heightMap[index] + accumulatedSnow.current[index];
      }
      groundRef.current.geometry.attributes.position.needsUpdate = true;
    }
  });

  return (
    <group>
      <ambientLight intensity={0.4} />
      <directionalLight 
        position={[50, 50, 0]} 
        intensity={1.2} 
        castShadow 
      />
      
      {/* Snowflakes */}
      <points ref={snowRef}>
        <bufferGeometry>
          <bufferAttribute 
            attach="attributes-position"
            count={particleCount}
            array={new Float32Array(snowflakes.flatMap(s => [s.position.x, s.position.y, s.position.z]))}
            itemSize={3}
          />
        </bufferGeometry>
        <pointsMaterial 
          size={0.1}
          color="white"
          transparent
          opacity={0.8}
          sizeAttenuation
        />
      </points>
      
      {/* Snow-covered ground */}
      <mesh 
        ref={groundRef}
        rotation={[-Math.PI / 2, 0, 0]} 
        position={[0, 0, 0]}
        receiveShadow
      >
        <planeGeometry args={[spread * 2, spread * 2, 128, 128]} />
        <meshStandardMaterial
          color="#ffffff"
          map={snowDiffuse}
          normalMap={snowNormal}
          roughness={0.3}
          metalness={0.1}
          envMapIntensity={0.8}
        />
      </mesh>
      
      {/* Atmospheric effects */}
      <fog attach="fog" args={['#e6f2ff', 50, 200]} />
    </group>
  );
};

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
    case 'simple': 
      return <Simple />
    case 'town':
      return <Town />
    default:
      return null
  }
}