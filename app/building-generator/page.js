'use client'

import React, { useState, useRef, useEffect } from 'react'
import * as THREE from 'three'
import { Canvas, useThree, useFrame } from '@react-three/fiber'
import { OrbitControls, useTexture, Sky, Environment, Text, Line, PerspectiveCamera, PointerLockControls } from '@react-three/drei'
import { OBJExporter } from 'three/examples/jsm/exporters/OBJExporter'
import FlowerMenu from '../components/Menu'

function Floor({ structure, wallTextures, features, floorNumber, isSelected, onWallClick, rooms, isTopView, realisticMode }) {
  const { width, height, depth } = structure
  
  const sides = [
    { pos: [0, 0, depth/2], rot: [0, 0, 0], scale: [width, height, 1] },
    { pos: [0, 0, -depth/2], rot: [0, 0, 0], scale: [width, height, 1] },
    { pos: [width/2, 0, 0], rot: [0, Math.PI/2, 0], scale: [depth, height, 1] },
    { pos: [-width/2, 0, 0], rot: [0, Math.PI/2, 0], scale: [depth, height, 1] },
    { pos: [0, height/2, 0], rot: [Math.PI/2, 0, 0], scale: [width, depth, 1] },
    { pos: [0, -height/2, 0], rot: [Math.PI/2, 0, 0], scale: [width, depth, 1] },
  ]

  const floorTexture = useTexture('/floor_texture.jpg')
  floorTexture.wrapS = floorTexture.wrapT = THREE.RepeatWrapping
  floorTexture.repeat.set(4, 4)

  return (
    <group position={[0, floorNumber * height, 0]}>
      {sides.map((side, index) => (
        <mesh 
          key={index} 
          position={side.pos} 
          rotation={side.rot} 
          scale={side.scale}
          onClick={(e) => {
            e.stopPropagation()
            onWallClick(floorNumber, index)
          }}
        >
          <planeGeometry args={[1, 1]} />
          <meshStandardMaterial 
            color={isSelected ? '#ffcccc' : '#ffffff'}
            map={index === 5 ? floorTexture : wallTextures[index]}
            side={THREE.DoubleSide}
            roughness={realisticMode ? 0.8 : 0.5}
            metalness={realisticMode ? 0.2 : 0}
          />
        </mesh>
      ))}
      {features.map((feature, index) => (
        <Feature 
          key={index} 
          {...feature} 
          wallDimensions={sides[feature.wallIndex].scale}
          wallRotation={sides[feature.wallIndex].rot}
          wallPosition={sides[feature.wallIndex].pos}
          realisticMode={realisticMode}
        />
      ))}
      {rooms.map((room, index) => (
        <Room key={index} {...room} floorHeight={height} isTopView={isTopView} realisticMode={realisticMode} />
      ))}
      <Text
        position={[0, height/2 + 0.5, depth/2 + 0.1]}
        fontSize={0.5}
        color="black"
      >
        Floor {floorNumber + 1}
      </Text>
    </group>
  )
}

function Feature({ type, position, wallIndex, wallDimensions, wallRotation, wallPosition, realisticMode, dimensions }) {
  const doorTexture = useTexture('/door_texture.jpg')
  const windowTexture = useTexture('/window_texture.jpg')

  const geometry = new THREE.BoxGeometry(
    dimensions?.width || (type === 'door' ? 1 : 1),
    dimensions?.height || (type === 'door' ? 2 : 1),
    0.1
  )

  return (
    <group position={wallPosition} rotation={wallRotation}>
      <mesh
        position={position}
        geometry={geometry}
      >
        <meshStandardMaterial 
          map={type === 'door' ? doorTexture : windowTexture}
          roughness={realisticMode ? 0.6 : 0.3}
          metalness={realisticMode ? 0.1 : 0}
        />
      </mesh>
    </group>
  )
}

function Room({ points, floorHeight, isTopView, realisticMode }) {
  const wallMaterial = new THREE.MeshStandardMaterial({ 
    color: '#cccccc',
    roughness: realisticMode ? 0.8 : 0.5,
    metalness: realisticMode ? 0.2 : 0
  })

  return (
    <group>
      <Line
        points={points.map(point => [point[0], floorHeight/2 + 0.01, point[1]])}
        color="red"
        lineWidth={2}
      />
      {!isTopView && points.map((point, index) => {
        const nextPoint = points[(index + 1) % points.length]
        const wallVector = new THREE.Vector3(nextPoint[0] - point[0], 0, nextPoint[1] - point[1])
        const wallLength = wallVector.length()
        const wallCenter = new THREE.Vector3(
          (point[0] + nextPoint[0]) / 2,
          floorHeight / 2,
          (point[1] + nextPoint[1]) / 2
        )
        const wallRotation = new THREE.Euler(0, Math.atan2(wallVector.z, wallVector.x), 0)

        return (
          <mesh key={index} position={wallCenter} rotation={wallRotation}>
            <boxGeometry args={[wallLength, floorHeight, 0.1]} />
            <meshStandardMaterial {...wallMaterial} />
          </mesh>
        )
      })}
    </group>
  )
}

function TopViewGrid({ size, divisions }) {
  const points = []
  const halfSize = size / 2

  for (let i = 0; i <= divisions; i++) {
    const pos = (i / divisions) * size - halfSize
    points.push([-halfSize, 0, pos], [halfSize, 0, pos])
    points.push([pos, 0, -halfSize], [pos, 0, halfSize])
  }

  return (
    <Line
      points={points}
      color="gray"
      lineWidth={1}
    />
  )
}

function WalkingCamera({ initialPosition = [0, 1.7, 0], moveSpeed = 0.1, sprintMultiplier = 2, room }) {
  const { camera, gl } = useThree();
  const controlsRef = useRef();
  const moveDirection = useRef(new THREE.Vector3());
  const isSprinting = useRef(false);

  useEffect(() => {
    camera.position.set(...initialPosition);
  }, [camera, initialPosition]);

  useEffect(() => {
    const handleKeyDown = (event) => {
      switch (event.code) {
        case 'KeyW':
        case 'ArrowUp':
          moveDirection.current.z = -1;
          break;
        case 'KeyS':
        case 'ArrowDown':
          moveDirection.current.z = 1;
          break;
        case 'KeyA':
        case 'ArrowLeft':
          moveDirection.current.x = -1;
          break;
        case 'KeyD':
        case 'ArrowRight':
          moveDirection.current.x = 1;
          break;
        case 'Space':
          if (camera.position.y === initialPosition[1]) {
            camera.position.y += 0.5; // Simple jump
          }
          break;
        case 'ShiftLeft':
          isSprinting.current = true;
          break;
      }
    };

    const handleKeyUp = (event) => {
      switch (event.code) {
        case 'KeyW':
        case 'KeyS':
        case 'ArrowUp':
        case 'ArrowDown':
          moveDirection.current.z = 0;
          break;
        case 'KeyA':
        case 'KeyD':
        case 'ArrowLeft':
        case 'ArrowRight':
          moveDirection.current.x = 0;
          break;
        case 'ShiftLeft':
          isSprinting.current = false;
          break;
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    document.addEventListener('keyup', handleKeyUp);

    return () => {
      document.removeEventListener('keydown', handleKeyDown);
      document.removeEventListener('keyup', handleKeyUp);
    };
  }, [camera, initialPosition]);

  useFrame(() => {
    if (controlsRef.current) {
      const speed = isSprinting.current ? moveSpeed * sprintMultiplier : moveSpeed;
      const direction = moveDirection.current.clone().normalize().multiplyScalar(speed);
      const cameraDirection = new THREE.Vector3();
      camera.getWorldDirection(cameraDirection);
      cameraDirection.y = 0;
      cameraDirection.normalize();

      const sideways = new THREE.Vector3(-cameraDirection.z, 0, cameraDirection.x);

      const movement = new THREE.Vector3()
        .addScaledVector(cameraDirection, -direction.z)
        .addScaledVector(sideways, direction.x);

      camera.position.add(movement);
    }
  });

  return <PointerLockControls ref={controlsRef} args={[camera, gl.domElement]} />;
}

export default function BuildingCreator() {
  const [floors, setFloors] = useState([
    {
      structure: { width: 10, height: 3, depth: 10 },
      wallTextures: Array(6).fill(null).map(() => {
        const texture = new THREE.TextureLoader().load('/wall_texture.jpg')
        texture.wrapS = texture.wrapT = THREE.RepeatWrapping
        texture.repeat.set(2, 2)
        return texture
      }),
      features: [],
      rooms: []
    }
  ])
  const [selectedFloor, setSelectedFloor] = useState(0)
  const [selectedWall, setSelectedWall] = useState(null)
  const [selectedFeature, setSelectedFeature] = useState(null)
  const [isRealisticMode, setIsRealisticMode] = useState(false)
  const [cameraPosition, setCameraPosition] = useState([15, 15, 15])
  const [isTopView, setIsTopView] = useState(false)
  const [isEditingRooms, setIsEditingRooms] = useState(false)
  const [roomPoints, setRoomPoints] = useState([])
  const [isInsideView, setIsInsideView] = useState(false)
  const [insideViewPosition, setInsideViewPosition] = useState([0, 1.7, 0])
  const canvasRef = useRef(null)

  const addFloor = () => {
    setFloors([...floors, {
      structure: { ...floors[0].structure },
      wallTextures: Array(6).fill(null).map(() => {
        const texture = new THREE.TextureLoader().load('/wall_texture.jpg')
        texture.wrapS = texture.wrapT = THREE.RepeatWrapping
        texture.repeat.set(2, 2)
        return texture
      }),
      features: [],
      rooms: []
    }])
  }

  const handleWallClick = (floorIndex, wallIndex) => {
    setSelectedFloor(floorIndex)
    setSelectedWall(wallIndex)
    setSelectedFeature(null)
  }

  const changeWallTexture = (textureUrl) => {
    if (selectedFloor !== null && selectedWall !== null) {
      const newFloors = [...floors]
      const texture = new THREE.TextureLoader().load(textureUrl)
      texture.wrapS = texture.wrapT = THREE.RepeatWrapping
      texture.repeat.set(2, 2)
      newFloors[selectedFloor].wallTextures[selectedWall] = texture
      setFloors(newFloors)
    }
  }

  const addFeature = (type) => {
    if (selectedFloor !== null && selectedWall !== null) {
      const newFloors = [...floors]
      const newFeature = {
        type,
        position: [0, 0, 0.05],
        wallIndex: selectedWall,
        dimensions: { width: type === 'door' ? 1 : 1, height: type === 'door' ? 2 : 1 }
      }
      newFloors[selectedFloor].features.push(newFeature)
      setFloors(newFloors)
      setSelectedFeature(newFloors[selectedFloor].features.length - 1)
    }
  }

  const handleFeatureClick = (floorIndex, featureIndex) => {
    setSelectedFloor(floorIndex)
    setSelectedFeature(featureIndex)
    setSelectedWall(null)
  }

  const updateFeatureDimensions = (dimension, value) => {
    if (selectedFloor !== null && selectedFeature !== null) {
      const newFloors = [...floors]
      newFloors[selectedFloor].features[selectedFeature].dimensions[dimension] = Number(value)
      setFloors(newFloors)
    }
  }

  const toggleTopView = () => {
    setIsTopView(!isTopView)
    setIsInsideView(false)
    if (!isTopView) {
      setCameraPosition([0, 20, 0])
    } else {
      setCameraPosition([15, 15, 15])
    }
    setIsEditingRooms(false)
    setRoomPoints([])
  }

  const startEditingRooms = () => {
    setIsEditingRooms(!isEditingRooms)
    setRoomPoints([])
  }

  const handleCanvasClick = (event) => {
    if (isEditingRooms && isTopView) {
      const { clientX, clientY } = event
      const { left, top, width, height } = canvasRef.current.getBoundingClientRect()
      const x = ((clientX - left) / width) * 2 - 1
      const y = -((clientY - top) / height) * 2 + 1

      const newPoint = [x * 5, y * 5]  // Scale the point to match the floor size
      const updatedPoints = [...roomPoints, newPoint]
      setRoomPoints(updatedPoints)

      // Draw the line immediately
      if (updatedPoints.length > 1) {
        const newFloors = [...floors]
        newFloors[selectedFloor].rooms = [
          
          ...newFloors[selectedFloor].rooms.filter(room => room.isComplete),
          { points: updatedPoints, isComplete: false }
        ]
        setFloors(newFloors)
      }

      // Complete the room if it has at least 3 points and the new point is close to the start
      if (updatedPoints.length >= 3) {
        const [startX, startY] = updatedPoints[0]
        const [endX, endY] = newPoint
        const distance = Math.sqrt(Math.pow(endX - startX, 2) + Math.pow(endY - startY, 2))
        if (distance < 0.5) {  // Adjust this threshold as needed
          const newFloors = [...floors]
          newFloors[selectedFloor].rooms = [
            ...newFloors[selectedFloor].rooms.filter(room => room.isComplete),
            { points: updatedPoints, isComplete: true }
          ]
          setFloors(newFloors)
          setRoomPoints([])
          setIsEditingRooms(false)
        }
      }
    }
  }

  const exportToOBJ = () => {
    const exporter = new OBJExporter()
    const scene = new THREE.Scene()

    floors.forEach((floor, floorIndex) => {
      const floorGroup = new THREE.Group()
      floorGroup.position.y = floorIndex * floor.structure.height

      // Add walls
      const wallGeometry = new THREE.BoxGeometry(floor.structure.width, floor.structure.height, floor.structure.depth)
      const wallMaterial = new THREE.MeshBasicMaterial({ color: 0xcccccc })
      const wallMesh = new THREE.Mesh(wallGeometry, wallMaterial)
      floorGroup.add(wallMesh)

      // Add features (doors and windows)
      floor.features.forEach(feature => {
        const featureGeometry = new THREE.BoxGeometry(
          feature.dimensions.width,
          feature.dimensions.height,
          0.1
        )
        const featureMaterial = new THREE.MeshBasicMaterial({ color: feature.type === 'door' ? 0x8B4513 : 0x87CEEB })
        const featureMesh = new THREE.Mesh(featureGeometry, featureMaterial)
        featureMesh.position.set(...feature.position)
        floorGroup.add(featureMesh)
      })

      scene.add(floorGroup)
    })

    const result = exporter.parse(scene)
    const blob = new Blob([result], { type: 'text/plain' })
    const link = document.createElement('a')
    link.href = URL.createObjectURL(blob)
    link.download = 'building.obj'
    link.click()
  }

  const toggleInsideView = () => {
    setIsInsideView(!isInsideView)
    setIsTopView(false)
    if (!isInsideView) {
      setInsideViewPosition([0, floors[selectedFloor].structure.height / 2, 0])
    } else {
      setCameraPosition([15, 15, 15])
    }
  }

  return (
    <div className="h-screen flex flex-col">
      <FlowerMenu />
      <div className="p-4 bg-gray-800 text-white">
        <h1 className="text-2xl font-bold mb-4">Advanced Building Creator</h1>
        <div className="flex space-x-4 mb-4">
          <button 
            className="bg-blue-500 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded"
            onClick={addFloor}
          >
            Add Floor
          </button>
          <select 
            className="bg-gray-700 text-white py-2 px-4 rounded"
            value={selectedFloor}
            onChange={(e) => setSelectedFloor(Number(e.target.value))}
          >
            {floors.map((_, index) => (
              <option key={index} value={index}>Floor {index + 1}</option>
            ))}
          </select>
          <button 
            className="bg-green-500 hover:bg-green-700 text-white font-bold py-2 px-4 rounded"
            onClick={() => addFeature('door')}
          >
            Add Door
          </button>
          <button 
            className="bg-yellow-500 hover:bg-yellow-700 text-white font-bold py-2 px-4 rounded"
            onClick={() => addFeature('window')}
          >
            Add Window
          </button>
          <div className="flex items-center">
            <input 
              type="checkbox" 
              id="realisticMode" 
              checked={isRealisticMode} 
              onChange={(e) => setIsRealisticMode(e.target.checked)}
              className="mr-2"
            />
            <label htmlFor="realisticMode">Realistic Mode</label>
          </div>
          <button 
            className="bg-purple-500 hover:bg-purple-700 text-white font-bold py-2 px-4 rounded"
            onClick={toggleTopView}
          >
            {isTopView ? "3D View" : "Top View"}
          </button>
          {isTopView && (
            <button 
              className="bg-pink-500 hover:bg-pink-700 text-white font-bold py-2 px-4 rounded"
              onClick={startEditingRooms}
            >
              {isEditingRooms ? "Finish Room" : "Edit Rooms"}
            </button>
          )}
          <button 
            className="bg-red-500 hover:bg-red-700 text-white font-bold py-2 px-4 rounded"
            onClick={exportToOBJ}
          >
            Export to OBJ
          </button>
          <button 
            className="bg-indigo-500 hover:bg-indigo-700 text-white font-bold py-2 px-4 rounded"
            onClick={toggleInsideView}
          >
            {isInsideView ? "Exit Inside View" : "Inside View"}
          </button>
        </div>
        <div className="flex space-x-4 mb-4">
          <button 
            className="bg-purple-500 hover:bg-purple-700 text-white font-bold py-2 px-4 rounded"
            onClick={() => changeWallTexture('/brick_texture.jpg')}
          >
            Brick Texture
          </button>
          <button 
            className="bg-indigo-500 hover:bg-indigo-700 text-white font-bold py-2 px-4 rounded"
            onClick={() => changeWallTexture('/wood_texture.jpg')}
          >
            Wood Texture
          </button>
          <button 
            className="bg-pink-500 hover:bg-pink-700 text-white font-bold py-2 px-4 rounded"
            onClick={() => changeWallTexture('/concrete_texture.jpg')}
          >
            Concrete Texture
          </button>
        </div>
        {selectedFeature !== null && (
          <div className="flex space-x-4 mb-4">
            <input
              type="number"
              value={floors[selectedFloor].features[selectedFeature].dimensions.width}
              onChange={(e) => updateFeatureDimensions('width', e.target.value)}
              className="bg-gray-700 text-white py-2 px-4 rounded"
              placeholder="Width"
              step="0.1"
            />
            <input
              type="number"
              value={floors[selectedFloor].features[selectedFeature].dimensions.height}
              onChange={(e) => updateFeatureDimensions('height', e.target.value)}
              className="bg-gray-700 text-white py-2 px-4 rounded"
              placeholder="Height"
              step="0.1"
            />
          </div>
        )}
      </div>
      <div className="flex-grow bg-gray-200 p-4">
        <div className="flex">
          <div className="w-[70vw] h-[calc(100vh-12rem)] bg-white rounded-lg shadow-lg overflow-hidden" onClick={handleCanvasClick} ref={canvasRef}>
            <Canvas shadows camera={{ position: cameraPosition, fov: 75 }}>
              {!isInsideView && <OrbitControls enabled={!isEditingRooms} />}
              {isInsideView && (
                <WalkingCamera
                  initialPosition={insideViewPosition}
                  room={floors[selectedFloor]}
                />
              )}
              <ambientLight intensity={0.5} />
              <pointLight position={[10, 10, 10]} />
              
              {isRealisticMode && (
                <>
                  <Sky sunPosition={[100, 100, 20]} />
                  <Environment preset="sunset" />
                </>
              )}
              
              {isTopView && <TopViewGrid size={10} divisions={10} />}
              
              {floors.map((floor, index) => (
                <Floor  
                  key={index}
                  structure={floor.structure}
                  wallTextures={floor.wallTextures}
                  features={floor.features}
                  rooms={floor.rooms}
                  floorNumber={index}
                  isSelected={index === selectedFloor}
                  onWallClick={handleWallClick}
                  isTopView={isTopView}
                  realisticMode={isRealisticMode}
                />
              ))}

              {isEditingRooms && roomPoints.length > 0 && (
                <Line
                  points={roomPoints.map(point => [point[0], floors[selectedFloor].structure.height/2 + 0.01, point[1]])}
                  color="blue"
                  lineWidth={2}
                />
              )}
            </Canvas>
          </div>
          {isEditingRooms && (
            <div className="w-[30vw] h-[calc(100vh-12rem)] bg-white rounded-lg shadow-lg overflow-hidden ml-4 p-4">
              <h2 className="text-xl font-bold mb-4">Edit Floor {selectedFloor + 1}</h2>
              <p>Click on the canvas to add points for the room. When youre finished, click Finish Room or close the last point near the starting point.</p>
            </div>
          )}
        </div>
      </div>
      <footer className="bg-gray-800 text-white p-4 text-center">
        <p>&copy; 2023 Advanced Building Creator. All rights reserved.</p>
        <p>Created with React, Three.js, and ❤️</p>
      </footer>
    </div>
  )
}