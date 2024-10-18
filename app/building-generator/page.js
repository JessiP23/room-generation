'use client'

import React, { useState, useRef, useEffect } from 'react'
import { Canvas, useFrame, useThree } from '@react-three/fiber'
import { OrbitControls, PerspectiveCamera, useTexture, Sky, Environment, Text } from '@react-three/drei'
import * as THREE from 'three'

function Building({ floors, realisticMode, onWallClick, selectedFloor, selectedRoom, selectedWall }) {
  const buildingRef = useRef()
  const floorHeight = 3
  const roomSize = 5

  const brickTexture = useTexture('/door_texture.jpg')
  const windowTexture = useTexture('/window_texture.jpg')
  const doorTexture = useTexture('/door_texture.jpg')

  brickTexture.wrapS = brickTexture.wrapT = THREE.RepeatWrapping
  brickTexture.repeat.set(0.1, 0.1)

  return (
    <group ref={buildingRef}>
      {floors.map((floor, floorIndex) => (
        <group key={floorIndex} position={[0, floorIndex * floorHeight, 0]}>
          {floor.rooms.map((room, roomIndex) => (
            <group key={roomIndex} position={[roomIndex * roomSize, 0, 0]}>
              {/* Floor */}
              <mesh position={[0, 0, 0]} receiveShadow>
                <boxGeometry args={[roomSize, 0.1, roomSize]} />
                <meshStandardMaterial color="#8B4513" roughness={0.8} />
              </mesh>
              {/* Walls */}
              {['front', 'back', 'left', 'right'].map((side, wallIndex) => (
                <mesh
                  key={side}
                  position={[
                    side === 'left' ? -roomSize / 2 : side === 'right' ? roomSize / 2 : 0,
                    floorHeight / 2,
                    side === 'front' ? roomSize / 2 : side === 'back' ? -roomSize / 2 : 0
                  ]}
                  rotation={[0, side === 'left' || side === 'right' ? Math.PI / 2 : 0, 0]}
                  onClick={(e) => {
                    e.stopPropagation()
                    onWallClick(floorIndex, roomIndex, wallIndex)
                  }}
                  castShadow
                  receiveShadow
                >
                  <planeGeometry args={[roomSize, floorHeight]} />
                  <meshStandardMaterial
                    color="#D3D3D3"
                    map={realisticMode ? brickTexture : null}
                    roughness={0.7}
                    metalness={0.1}
                    emissive={selectedFloor === floorIndex && selectedRoom === roomIndex && selectedWall === wallIndex ? new THREE.Color(0x666666) : undefined}
                  />
                </mesh>
              ))}
              {/* Roof */}
              <mesh position={[0, floorHeight, 0]} receiveShadow>
                <boxGeometry args={[roomSize, 0.1, roomSize]} />
                <meshStandardMaterial color="#A9A9A9" roughness={0.6} />
              </mesh>
              {/* Features (doors and windows) */}
              {room.features.map((feature, featureIndex) => (
                <mesh
                  key={featureIndex}
                  position={[
                    feature.wall === 'left' ? -roomSize / 2 : feature.wall === 'right' ? roomSize / 2 : feature.position[0],
                    feature.position[1] + floorHeight / 2,
                    feature.wall === 'front' ? roomSize / 2 : feature.wall === 'back' ? -roomSize / 2 : feature.position[2]
                  ]}
                  rotation={[0, feature.wall === 'left' || feature.wall === 'right' ? Math.PI / 2 : 0, 0]}
                >
                  <planeGeometry args={feature.type === 'door' ? [1, 2] : [1, 1]} />
                  <meshStandardMaterial
                    map={feature.type === 'door' ? doorTexture : windowTexture}
                    transparent
                    opacity={0.8}
                  />
                </mesh>
              ))}
            </group>
          ))}
        </group>
      ))}
    </group>
  )
}

function BuildingControls({ floorCount, setFloorCount, addRoom, toggleRealisticMode, realisticMode }) {
  return (
    <div className="absolute top-4 left-4 bg-white p-4 rounded shadow-md">
      <div className="mb-4">
        <label htmlFor="floorCount" className="block text-sm font-medium text-gray-700">Number of Floors:</label>
        <input
          type="number"
          id="floorCount"
          value={floorCount}
          onChange={(e) => setFloorCount(Math.max(1, parseInt(e.target.value)))}
          className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-300 focus:ring focus:ring-indigo-200 focus:ring-opacity-50"
        />
      </div>
      <button onClick={addRoom} className="w-full bg-blue-500 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded mb-2">
        Add Room
      </button>
      <button onClick={toggleRealisticMode} className="w-full bg-green-500 hover:bg-green-700 text-white font-bold py-2 px-4 rounded">
        {realisticMode ? 'Disable' : 'Enable'} Realistic Mode
      </button>
    </div>
  )
}

export default function BuildingCreator() {
  const [floors, setFloors] = useState([{ rooms: [{ features: [] }] }])
  const [floorCount, setFloorCount] = useState(1)
  const [realisticMode, setRealisticMode] = useState(false)
  const [selectedFloor, setSelectedFloor] = useState(null)
  const [selectedRoom, setSelectedRoom] = useState(null)
  const [selectedWall, setSelectedWall] = useState(null)

  useEffect(() => {
    setFloors(prevFloors => {
      const newFloors = [...prevFloors]
      while (newFloors.length < floorCount) {
        newFloors.push({ rooms: [{ features: [] }] })
      }
      while (newFloors.length > floorCount) {
        newFloors.pop()
      }
      return newFloors
    })
  }, [floorCount])

  const addRoom = () => {
    setFloors(prevFloors => {
      const newFloors = [...prevFloors]
      const lastFloor = newFloors[newFloors.length - 1]
      lastFloor.rooms.push({ features: [] })
      return newFloors
    })
  }

  const toggleRealisticMode = () => {
    setRealisticMode(prev => !prev)
  }

  const handleWallClick = (floorIndex, roomIndex, wallIndex) => {
    setSelectedFloor(floorIndex)
    setSelectedRoom(roomIndex)
    setSelectedWall(wallIndex)
  }

  const addFeature = (type) => {
    if (selectedFloor === null || selectedRoom === null || selectedWall === null) return

    setFloors(prevFloors => {
      const newFloors = [...prevFloors]
      const room = newFloors[selectedFloor].rooms[selectedRoom]
      const wallNames = ['front', 'back', 'left', 'right']
      room.features.push({
        type,
        wall: wallNames[selectedWall],
        position: [0, type === 'door' ? 0 : 1, 0]
      })
      return newFloors
    })
  }

  return (
    <div className="w-full h-screen relative">
      <Canvas shadows>
        <PerspectiveCamera makeDefault position={[20, 20, 20]} />
        <OrbitControls />
        <ambientLight intensity={0.5} />
        <pointLight position={[10, 10, 10]} castShadow />
        {realisticMode && (
          <>
            <Sky sunPosition={[100, 100, 20]} />
            <Environment preset="sunset" />
          </>
        )}
        <Building
          floors={floors}
          realisticMode={realisticMode}
          onWallClick={handleWallClick}
          selectedFloor={selectedFloor}
          selectedRoom={selectedRoom}
          selectedWall={selectedWall}
        />
      </Canvas>
      <BuildingControls
        floorCount={floorCount}
        setFloorCount={setFloorCount}
        addRoom={addRoom}
        toggleRealisticMode={toggleRealisticMode}
        realisticMode={realisticMode}
      />
      {selectedWall !== null && (
        <div className="absolute bottom-4 right-4 bg-white p-4 rounded shadow-md">
          <button onClick={() => addFeature('door')} className="bg-yellow-500 hover:bg-yellow-700 text-white font-bold py-2 px-4 rounded mr-2">
            Add Door
          </button>
          <button onClick={() => addFeature('window')} className="bg-purple-500 hover:bg-purple-700 text-white font-bold py-2 px-4 rounded">
            Add Window
          </button>
        </div>
      )}
    </div>
  )
}