'use client'

import { useState, useEffect, useRef } from 'react'
import * as THREE from 'three'
import { Canvas, useThree, useFrame } from '@react-three/fiber'
import { OrbitControls, Text } from '@react-three/drei'
import { GLTFExporter } from 'three/examples/jsm/exporters/GLTFExporter'

// room
function Room({ structure, wallColors, features, onFeatureMove, onWallClick, selectedWall, realisticMode }) {
  const { width, height, depth } = structure

  const sides = [
    { pos: [0, 0, depth/2], rot: [0, 0, 0], scale: [width, height, 1] },
    { pos: [0, 0, -depth/2], rot: [0, 0, 0], scale: [width, height, 1] },
    { pos: [width/2, 0, 0], rot: [0, Math.PI/2, 0], scale: [depth, height, 1] },
    { pos: [-width/2, 0, 0], rot: [0, Math.PI/2, 0], scale: [depth, height, 1] },
    { pos: [0, height/2, 0], rot: [Math.PI/2, 0, 0], scale: [width, depth, 1] },
    { pos: [0, -height/2, 0], rot: [Math.PI/2, 0, 0], scale: [width, depth, 1] },
  ]

  return (
    <group>
      {sides.map((side, index) => (
        <mesh 
          key={index} 
          position={side.pos} 
          rotation={side.rot} 
          scale={side.scale}
          onClick={(e) => {
            e.stopPropagation()
            onWallClick(index)
          }}
        >
          <planeGeometry args={[1, 1]} />
          <meshStandardMaterial 
            color={wallColors[index]} 
            side={THREE.DoubleSide}
            emissive={selectedWall === index ? new THREE.Color(0x666666) : undefined}
            roughness={realisticMode ? 0.8 : 0.5}
            metalness={realisticMode ? 0.2 : 0}
          />
        </mesh>
      ))}
      {features.map((feature, index) => (
        <Feature 
          key={index} 
          {...feature} 
          onMove={(newPosition) => onFeatureMove(index, newPosition)} 
          wallDimensions={sides[feature.wallIndex].scale}
          wallRotation={sides[feature.wallIndex].rot}
          wallPosition={sides[feature.wallIndex].pos}
          realisticMode={realisticMode}
        />
      ))}
      <axesHelper args={[Math.max(width, height, depth)]} />
      <Text position={[width/2 + 0.5, 0, 0]} rotation={[0, -Math.PI/2, 0]} fontSize={0.5}>
        {`Width: ${width.toFixed(2)}`}
      </Text>
      <Text position={[0, height/2 + 0.5, 0]} rotation={[0, 0, Math.PI/2]} fontSize={0.5}>
        {`Height: ${height.toFixed(2)}`}
      </Text>
      <Text position={[0, 0, depth/2 + 0.5]} rotation={[0, Math.PI, 0]} fontSize={0.5}>
        {`Depth: ${depth.toFixed(2)}`}
      </Text>
      <ambientLight intensity={0.5} />
      <pointLight position={[10, 10, 10]} />
    </group>
  )
}

function Feature({ type, position, wallIndex, onMove, wallDimensions, wallRotation, wallPosition, realisticMode }) {
  const mesh = useRef()
  const { size, viewport } = useThree()
  const [isMoving, setIsMoving] = useState(false)

  useFrame(({ mouse, camera }) => {
    if (isMoving && mesh.current) {
      const x = (mouse.x * viewport.width) / 2
      const y = (mouse.y * viewport.height) / 2
      
      // Convert mouse position to wall-relative position
      const wallNormal = new THREE.Vector3(0, 0, 1).applyEuler(new THREE.Euler(...wallRotation))
      const planeIntersect = new THREE.Plane(wallNormal, 0)
      const raycaster = new THREE.Raycaster()
      raycaster.setFromCamera(new THREE.Vector2(mouse.x, mouse.y), camera)
      const intersectPoint = new THREE.Vector3()
      raycaster.ray.intersectPlane(planeIntersect, intersectPoint)

      // Constrain position within wall boundaries
      const halfWidth = wallDimensions[0] / 2
      const halfHeight = wallDimensions[1] / 2
      const newX = THREE.MathUtils.clamp(intersectPoint.x - wallPosition[0], -halfWidth + 0.5, halfWidth - 0.5)
      const newY = THREE.MathUtils.clamp(intersectPoint.y - wallPosition[1], -halfHeight + (type === 'door' ? 1 : 0.5), halfHeight - (type === 'door' ? 1 : 0.5))

      mesh.current.position.set(newX, newY, 0.05)
    }
  })

  const handlePointerDown = (e) => {
    e.stopPropagation()
    setIsMoving(!isMoving)
    if (!isMoving) {
      onMove(mesh.current.position)
    }
  }

  return (
    <group position={wallPosition} rotation={wallRotation}>
      <mesh
        ref={mesh}
        position={position}
        onPointerDown={handlePointerDown}
      >
        <boxGeometry args={type === 'door' ? [1, 2, 0.1] : [1, 1, 0.1]} />
        <meshStandardMaterial 
          color={type === 'door' ? '#8B4513' : '#87CEEB'} 
          roughness={realisticMode ? 0.6 : 0.3}
          metalness={realisticMode ? 0.1 : 0}
        />
      </mesh>
    </group>
  )
}

export default function CustomizableRoom() {
  const [rooms, setRooms] = useState([
    {
      id: 1,
      prompt: '',
      structure: { width: 10, height: 8, depth: 10 },
      wallColors: Array(6).fill('#FFFFFF'),
      features: [],
      position: [0, 0, 0],
    }
  ])
  const [selectedRoom, setSelectedRoom] = useState(0)
  const [selectedWall, setSelectedWall] = useState(null)
  const [notification, setNotification] = useState('')
  const [realisticMode, setRealisticMode] = useState(false)

  const handleSubmit = async (e) => {
    e.preventDefault()
    const newRooms = [...rooms]
    newRooms[selectedRoom].structure = { 
      width: Math.random() * 10 + 5, 
      height: Math.random() * 5 + 3, 
      depth: Math.random() * 10 + 5 
    }
    setRooms(newRooms)
  }

  const handleColorChange = (color) => {
    if (selectedWall !== null) {
      const newRooms = [...rooms]
      newRooms[selectedRoom].wallColors[selectedWall] = color
      setRooms(newRooms)
    }
  }

  const handleWallClick = (index) => {
    setSelectedWall(index)
    setNotification(`Wall ${index + 1} selected`)
    setTimeout(() => setNotification(''), 2000)
  }

  const addFeature = (type) => {
    if (selectedWall === null) return
    const newRooms = [...rooms]
    const newFeature = { type, position: [0, 0, 0.05], wallIndex: selectedWall }
    newRooms[selectedRoom].features.push(newFeature)
    setRooms(newRooms)
  }

  const handleFeatureMove = (index, newPosition) => {
    const newRooms = [...rooms]
    newRooms[selectedRoom].features[index].position = [newPosition.x, newPosition.y, newPosition.z]
    setRooms(newRooms)
  }

  const handleDownload = () => {
    const exporter = new GLTFExporter()
    exporter.parse(
      document.querySelector('canvas').scene,
      (gltf) => {
        const output = JSON.stringify(gltf, null, 2)
        const blob = new Blob([output], { type: 'text/plain' })
        const url = URL.createObjectURL(blob)
        const link = document.createElement('a')
        link.href = url
        link.download = 'room.gltf'
        link.click()
        URL.revokeObjectURL(url)
      },
      { binary: false }
    )
  }

  const handleSave = () => {
    const savedRooms = JSON.stringify(rooms)
    localStorage.setItem('savedRooms', savedRooms)
    setNotification('Rooms saved successfully')
    setTimeout(() => setNotification(''), 2000)
  }

  const handleLoad = () => {
    const savedRooms = localStorage.getItem('savedRooms')
    if (savedRooms) {
      setRooms(JSON.parse(savedRooms))
      setNotification('Rooms loaded successfully')
      setTimeout(() => setNotification(''), 2000)
    }
  }

  const addRoom = () => {
    const lastRoom = rooms[rooms.length - 1]
    const newRoom = {
      id: rooms.length + 1,
      prompt: '',
      structure: { width: 10, height: 8, depth: 10 },
      wallColors: Array(6).fill('#FFFFFF'),
      features: [],
      position: [lastRoom.position[0] + lastRoom.structure.width + 2, 0, 0],
    }
    setRooms([...rooms, newRoom])
    setSelectedRoom(rooms.length)
  }

  const handleDimensionChange = (dimension, value) => {
    const newRooms = [...rooms]
    newRooms[selectedRoom].structure[dimension] = Number(value)
    setRooms(newRooms)
  }

  return (
    <div className="flex flex-col h-screen">
      <div className="p-4 bg-gray-100">
        <form onSubmit={handleSubmit} className="flex gap-2 mb-4">
          <input
            type="text"
            value={rooms[selectedRoom].prompt}
            onChange={(e) => {
              const newRooms = [...rooms]
              newRooms[selectedRoom].prompt = e.target.value
              setRooms(newRooms)
            }}
            placeholder="Describe the house or room..."
            className="flex-grow p-2 border rounded text-gray-900"
          />
          <button type="submit" className="px-4 py-2 bg-green-500 text-white rounded hover:bg-green-600">Generate</button>
        </form>
        <div className="flex items-center gap-4 mb-4">
          <label htmlFor="realistic-mode" className="text-gray-700">Realistic Mode</label>
          <input
            type="checkbox"
            id="realistic-mode"
            checked={realisticMode}
            onChange={(e) => setRealisticMode(e.target.checked)}
            className="form-checkbox h-5 w-5 text-blue-600"
          />
        </div>
        <div className="flex gap-2 mb-4">
          <input
            type="number"
            value={rooms[selectedRoom].structure.width}
            onChange={(e) => handleDimensionChange('width', e.target.value)}
            className="w-20 p-2 border rounded text-gray-900"
            placeholder="Width"
          />
          <input
            type="number"
            value={rooms[selectedRoom].structure.height}
            onChange={(e) => handleDimensionChange('height', e.target.value)}
            className="w-20 p-2 border rounded text-gray-900"
            placeholder="Height"
          />
          <input
            type="number"
            value={rooms[selectedRoom].structure.depth}
            onChange={(e) => handleDimensionChange('depth', e.target.value)}
            className="w-20 p-2 border rounded text-gray-900"
            placeholder="Depth"
          />
        </div>
        {selectedWall !== null && (
          <div className="flex gap-2 mb-4">
            <button onClick={() => addFeature('door')} className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600">Add Door</button>
            <button onClick={() => addFeature('window')} className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600">Add Window</button>
            <input
              type="color"
              value={rooms[selectedRoom].wallColors[selectedWall]}
              onChange={(e) => handleColorChange(e.target.value)}
              className="w-12 h-10 border-none"
            />
            <input
              type="text"
              value={rooms[selectedRoom].wallColors[selectedWall]}
              onChange={(e) => handleColorChange(e.target.value)}
              placeholder="Hex color"
              className="w-28 p-2 border rounded text-gray-900"
            />
          </div>
        )}
        <div className="flex gap-2">
          <button onClick={handleDownload} className="px-4 py-2 bg-purple-500 text-white rounded hover:bg-purple-600">Download 3D Room</button>
          <button onClick={handleSave} className="px-4 py-2 bg-yellow-500 text-white rounded hover:bg-yellow-600">Save Rooms</button>
          <button onClick={handleLoad} className="px-4 py-2 bg-yellow-500 text-white rounded hover:bg-yellow-600">Load Rooms</button>
          <button onClick={addRoom} className="px-4 py-2 bg-pink-500 text-white rounded hover:bg-pink-600">Add Room</button>
        </div>
      </div>
      <div className="flex-grow relative">
        <Canvas camera={{ position: [20, 20, 20] }}>
          
          <OrbitControls />
          {rooms.map((room, index) => (
            <group key={room.id} position={room.position}>
              <Room
                structure={room.structure}
                wallColors={room.wallColors}
                features={room.features}
                onFeatureMove={(featureIndex, newPosition) => handleFeatureMove(featureIndex, newPosition)}
                onWallClick={handleWallClick}
                selectedWall={selectedRoom === index ? selectedWall : null}
                realisticMode={realisticMode}
              />
            </group>
          ))}
        </Canvas>
        {notification && (
          <div className="absolute top-4 right-4 bg-green-500 text-white p-2 rounded">
            {notification}
          </div>
        )}
      </div>
    </div>
  )
}