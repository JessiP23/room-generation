'use client'

import React, { useState, useRef, useEffect } from 'react'
import * as THREE from 'three'
import { Canvas, useThree, useFrame } from '@react-three/fiber'
import { OrbitControls, useTexture, Sky, Environment, Text, Line } from '@react-three/drei'
import FlowerMenu from '../components/Menu'

function Floor({ structure, wallTextures, features, floorNumber, isSelected, onWallClick, rooms, isTopView }) {
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
        />
      ))}
      {isTopView && rooms.map((room, index) => (
        <Room key={index} {...room} floorHeight={height} />
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

function Feature({ type, position, wallIndex, wallDimensions, wallRotation, wallPosition }) {
  const doorTexture = useTexture('/door_texture.jpg')
  const windowTexture = useTexture('/window_texture.jpg')

  const geometry = type === 'door' 
    ? new THREE.BoxGeometry(1, 2, 0.1)
    : new THREE.BoxGeometry(1, 1, 0.1)

  return (
    <group position={wallPosition} rotation={wallRotation}>
      <mesh
        position={position}
        geometry={geometry}
      >
        <meshStandardMaterial 
          map={type === 'door' ? doorTexture : windowTexture}
        />
      </mesh>
    </group>
  )
}

function Room({ x, y, width, height, floorHeight }) {
  return (
    <Line
      points={[
        [x, floorHeight/2 + 0.01, y],
        [x + width, floorHeight/2 + 0.01, y],
        [x + width, floorHeight/2 + 0.01, y + height],
        [x, floorHeight/2 + 0.01, y + height],
        [x, floorHeight/2 + 0.01, y]
      ]}
      color="red"
      lineWidth={2}
    />
  )
}

function BuildingCreator() {
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
  const [isRealisticMode, setIsRealisticMode] = useState(false)
  const [cameraPosition, setCameraPosition] = useState([15, 15, 15])
  const [isTopView, setIsTopView] = useState(false)
  const [isEditingRooms, setIsEditingRooms] = useState(false)
  const [newRoom, setNewRoom] = useState({ x: 0, y: 0, width: 0, height: 0 })

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
      newFloors[selectedFloor].features.push({
        type,
        position: [0, 0, 0.05],
        wallIndex: selectedWall
      })
      setFloors(newFloors)
    }
  }

  const toggleTopView = () => {
    setIsTopView(!isTopView)
    if (!isTopView) {
      setCameraPosition([0, 20, 0])
    } else {
      setCameraPosition([15, 15, 15])
    }
  }

  const startEditingRooms = () => {
    setIsEditingRooms(true)
  }

  const handleCanvasClick = (event) => {
    if (isEditingRooms) {
      const { clientX, clientY } = event
      const { left, top, width, height } = event.target.getBoundingClientRect()
      const x = ((clientX - left) / width) * 2 - 1
      const y = -((clientY - top) / height) * 2 + 1

      if (newRoom.width === 0) {
        setNewRoom({ ...newRoom, x, y })
      } else {
        const newFloors = [...floors]
        newFloors[selectedFloor].rooms.push({
          x: Math.min(newRoom.x, x),
          y: Math.min(newRoom.y, y),
          width: Math.abs(x - newRoom.x),
          height: Math.abs(y - newRoom.y)
        })
        setFloors(newFloors)
        setNewRoom({ x: 0, y: 0, width: 0, height: 0 })
        setIsEditingRooms(false)
      }
    }
  }

  return (
    <div className="h-screen flex flex-col">
      <FlowerMenu />
      <div className="p-4 bg-gray-800 text-white">
        <h1 className="text-2xl font-bold mb-4">Enhanced Building Creator</h1>
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
              Edit Rooms
            </button>
          )}
        </div>
        <div className="flex space-x-4">
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
      </div>
      <div className="flex-grow" onClick={handleCanvasClick}>
        <Canvas shadows camera={{ position: cameraPosition, fov: 75 }}>
          <OrbitControls />
          <ambientLight intensity={0.5} />
          <pointLight position={[10, 10, 10]} />
          
          {isRealisticMode && (
            <>
              <Sky sunPosition={[100, 100, 20]} />
              <Environment preset="sunset" />
            </>
          )}
          
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
            />
          ))}
        </Canvas>
      </div>
    </div>
  )
}

export default BuildingCreator