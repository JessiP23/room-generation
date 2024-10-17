'use client'

import { useState, useEffect, useRef } from 'react'
import * as THREE from 'three'
import { Canvas, useThree, useFrame } from '@react-three/fiber'
import { OrbitControls, Text, PerspectiveCamera, PointerLockControls, useTexture, SpotLight, Sky, Environment } from '@react-three/drei'
import { GLTFExporter } from 'three/examples/jsm/exporters/GLTFExporter'


// room 
function Room({ structure, wallColors, features, onFeatureMove, onWallClick, selectedWall, realisticMode, roomIndex, selectedRoom }) {
  const { width, height, depth } = structure

  const sides = [
    { pos: [0, 0, depth/2], rot: [0, 0, 0], scale: [width, height, 1] },
    { pos: [0, 0, -depth/2], rot: [0, 0, 0], scale: [width, height, 1] },
    { pos: [width/2, 0, 0], rot: [0, Math.PI/2, 0], scale: [depth, height, 1] },
    { pos: [-width/2, 0, 0], rot: [0, Math.PI/2, 0], scale: [depth, height, 1] },
    { pos: [0, height/2, 0], rot: [Math.PI/2, 0, 0], scale: [width, depth, 1] },
    { pos: [0, -height/2, 0], rot: [Math.PI/2, 0, 0], scale: [width, depth, 1] },
  ]

  const wallTexture = useTexture('/wall_texture.jpg')
  wallTexture.wrapS = wallTexture.wrapT = THREE.RepeatWrapping
  wallTexture.repeat.set(2, 2)

  const floorTexture = useTexture('/floor_texture.jpg')
  floorTexture.wrapS = floorTexture.wrapT = THREE.RepeatWrapping
  floorTexture.repeat.set(4, 4)

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
            onWallClick(roomIndex, index)
          }}
          castShadow
          receiveShadow
        >
          <planeGeometry args={[1, 1]} />
          <meshStandardMaterial 
            color={wallColors[index]} 
            side={THREE.DoubleSide}
            emissive={selectedRoom === roomIndex && selectedWall === index ? new THREE.Color(0x666666) : undefined}
            roughness={realisticMode ? 0.8 : 0.5}
            metalness={realisticMode ? 0.2 : 0}
            map={index === 5 ? floorTexture : wallTexture}
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
      <SpotLight
        castShadow
        position={[0, height - 0.5, 0]}
        angle={0.6}
        penumbra={0.5}
        intensity={1}
        shadow-mapSize-width={2048}
        shadow-mapSize-height={2048}
      />
      <pointLight position={[0, height / 2, 0]} intensity={0.5} />
    </group>
  )
}





function TopViewRoom({ structure, position, onMove, isSelected, onSelect }) {
  const { width, depth } = structure
  const mesh = useRef()
  const [isDragging, setIsDragging] = useState(false)
  const [offset, setOffset] = useState({ x: 0, z: 0 })

  const handlePointerDown = (e) => {
    e.stopPropagation()
    onSelect()
    setIsDragging(true)
    const { x, z } = mesh.current.position
    setOffset({
      x: e.point.x - x,
      z: e.point.z - z
    })
  }

  const handlePointerUp = (e) => {
    e.stopPropagation()
    setIsDragging(false)
    if (mesh.current) {
      onMove([mesh.current.position.x, 0, mesh.current.position.z])
    }
  }

  useFrame(({ mouse, viewport }) => {
    if (isDragging && mesh.current) {
      const x = (mouse.x * viewport.width) / 2 - offset.x
      const z = -(mouse.y * viewport.height) / 2 - offset.z
      mesh.current.position.x = x
      mesh.current.position.z = z
    }
  })

  return (
    <mesh
      ref={mesh}
      position={position}
      onPointerDown={handlePointerDown}
      onPointerUp={handlePointerUp}
    >
      <boxGeometry args={[width, 0.1, depth]} />
      <meshStandardMaterial color={isSelected ? '#ff0000' : '#cccccc'} />
    </mesh>
  )
}




function Feature({ type, position, wallIndex, onMove, wallDimensions, wallRotation, wallPosition, realisticMode }) {
  const mesh = useRef()
  const { viewport } = useThree()
  const [isMoving, setIsMoving] = useState(false)

  const doorTexture = useTexture('/door_texture.jpg')
  const windowTexture = useTexture('/window_texture.jpg')

  useFrame(({ mouse, camera }) => {
    if (isMoving && mesh.current) {
      const wallNormal = new THREE.Vector3(0, 0, 1).applyEuler(new THREE.Euler(...wallRotation))
      const planeIntersect = new THREE.Plane(wallNormal, 0)
      const raycaster = new THREE.Raycaster()
      raycaster.setFromCamera(new THREE.Vector2(mouse.x, mouse.y), camera)
      const intersectPoint = new THREE.Vector3()
      raycaster.ray.intersectPlane(planeIntersect, intersectPoint)

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
  }

  const handlePointerUp = (e) => {
    e.stopPropagation()
    if (isMoving) {
      if (mesh.current) {
        onMove(mesh.current.position)
      }
    }
  }

  return (
    <group position={wallPosition} rotation={wallRotation}>
      <mesh
        ref={mesh}
        position={position}
        onPointerDown={handlePointerDown}
        onPointerUp={handlePointerUp}
        castShadow
        receiveShadow
      >
        <boxGeometry args={type === 'door' ? [1, 2, 0.1] : [1, 1, 0.1]} />
        <meshStandardMaterial 
          color={type === 'door' ? '#8B4513' : '#87CEEB'} 
          roughness={realisticMode ? 0.6 : 0.3}
          metalness={realisticMode ? 0.1 : 0}
          map={type === 'door' ? doorTexture : windowTexture}
        />
      </mesh>
    </group>
  )
}


// walking camera

function WalkingCamera({ initialPosition = [0, 1.7, 0], moveSpeed = 0.1, sprintMultiplier = 2 }) {
  const { camera, gl } = useThree();
  const controlsRef = useRef();
  const [moveDirection, setMoveDirection] = useState(new THREE.Vector3());
  const [isSprinting, setIsSprinting] = useState(false);

  useEffect(() => {
    camera.position.set(...initialPosition);
  }, [camera, initialPosition]);

  useEffect(() => {
    const handleKeyDown = (event) => {
      switch (event.code) {
        case 'KeyW':
        case 'ArrowUp':
          setMoveDirection((prev) => prev.setZ(-1));
          break;
        case 'KeyS':
        case 'ArrowDown':
          setMoveDirection((prev) => prev.setZ(1));
          break;
        case 'KeyA':
        case 'ArrowLeft':
          setMoveDirection((prev) => prev.setX(-1));
          break;
        case 'KeyD':
        case 'ArrowRight':
          setMoveDirection((prev) => prev.setX(1));
          break;
        case 'Space':
          if (camera.position.y === initialPosition[1]) {
            camera.position.y += 0.5; // Simple jump
          }
          break;
        case 'ShiftLeft':
          setIsSprinting(true);
          break;
      }
    };

    // improved version

    const handleKeyUp = (event) => {
      switch (event.code) {
        case 'KeyW':
        case 'KeyS':
        case 'ArrowUp':
        case 'ArrowDown':
          setMoveDirection((prev) => prev.setZ(0));
          break;
        case 'KeyA':
        case 'KeyD':
        case 'ArrowLeft':
        case 'ArrowRight':
          setMoveDirection((prev) => prev.setX(0));
          break;
        case 'ShiftLeft':
          setIsSprinting(false);
          break;
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    document.addEventListener('keyup', handleKeyUp);

    return () => {
      document.removeEventListener('keydown', handleKeyDown);
      document.removeEventListener('keyup', handleKeyUp);
    };
  }, [initialPosition]);

  useFrame(() => {
    if (controlsRef.current) {
      const speed = isSprinting ? moveSpeed * sprintMultiplier : moveSpeed;
      const direction = moveDirection.clone().normalize().multiplyScalar(speed);
      const cameraDirection = new THREE.Vector3();
      camera.getWorldDirection(cameraDirection);
      cameraDirection.y = 0;
      cameraDirection.normalize();

      const sideways = new THREE.Vector3(-cameraDirection.z, 0, cameraDirection.x);

      const movement = new THREE.Vector3()
        .addScaledVector(cameraDirection, -direction.z)
        .addScaledVector(sideways, direction.x);

      camera.position.add(movement);

      // Simple gravity
      if (camera.position.y > initialPosition[1]) {
        camera.position.y = Math.max(
          camera.position.y - 0.05,
          initialPosition[1]
        );
      }
    }
  });

  return <PointerLockControls ref={controlsRef} args={[camera, gl.domElement]} />;
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
  const [isInternalView, setIsInternalView] = useState(false)
  const [isTopView, setIsTopView] = useState(false)
  const [cameraPosition, setCameraPosition] = useState([20, 20, -10])
  const [cameraRotation, setCameraRotation] = useState([0, 0, 0])

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

  const handleWallClick = (roomIndex, wallIndex) => {
    setSelectedRoom(roomIndex)
    setSelectedWall(wallIndex)
    setNotification(`Room ${roomIndex + 1}, Wall ${wallIndex + 1} selected`)
    setTimeout(() => setNotification(''), 2000)
  }

  const addFeature = (type) => {
    if (selectedWall === null) return
    const newRooms = [...rooms]
    const newFeature = { type, position: [0, 0, 0.05], wallIndex: selectedWall }
    newRooms[selectedRoom].features.push(newFeature)
    setRooms(newRooms)
  }

  const handleFeatureMove = (featureIndex, newPosition) => {
    const newRooms = [...rooms]
    if (newRooms[selectedRoom] && newRooms[selectedRoom].features[featureIndex]) {
      newRooms[selectedRoom].features[featureIndex].position = [newPosition.x, newPosition.y, newPosition.z]
      setRooms(newRooms)
    }
  }

  const handleDownload = () => {
    const exporter = new GLTFExporter()
    const scene = new THREE.Scene()
    rooms.forEach(room => {
      const roomGroup = new THREE.Group()
      // Add room geometry
      const roomGeometry = new THREE.BoxGeometry(room.structure.width, room.structure.height, room.structure.depth)
      const roomMaterial = new THREE.MeshBasicMaterial({ color: 0xcccccc, transparent: true, opacity: 0.5 })
      const roomMesh = new THREE.Mesh(roomGeometry, roomMaterial)
      roomGroup.add(roomMesh)
      
      // Add features (doors, windows)
      room.features.forEach(feature => {
        const featureGeometry = new THREE.BoxGeometry(
          feature.type === 'door' ? 1 : 1,
          feature.type === 'door' ? 2 : 1,
          0.1
        )
        const featureMaterial = new THREE.MeshBasicMaterial({ color: feature.type === 'door' ? 0x8B4513 : 0x87CEEB })
        const featureMesh = new THREE.Mesh(featureGeometry, featureMaterial)
        featureMesh.position.set(...feature.position)
        roomGroup.add(featureMesh)
      })
      
      roomGroup.position.set(...room.position)
      scene.add(roomGroup)
    })
    
    exporter.parse(
      scene,
      (gltf) => {
        const output = JSON.stringify(gltf, null, 2)
        const blob = new Blob([output], { type: 'text/plain' })
        const url = URL.createObjectURL(blob)
        const link = document.createElement('a')
        link.href = url
        link.download = 'rooms.gltf'
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

  const joinRooms = () => {
    if (rooms.length < 2) return
    const newRooms = [...rooms]
    for (let i = 1; i < newRooms.length; i++) {
      const prevRoom = newRooms[i - 1]
      const currentRoom = newRooms[i]
      currentRoom.position = [
        prevRoom.position[0] + prevRoom.structure.width / 2 + currentRoom.structure.width / 2,
        prevRoom.position[1],
        prevRoom.position[2]
      ]
    }
    setRooms(newRooms)
  }

  const toggleView = () => {
    setIsInternalView(!isInternalView)
    if (!isInternalView) {
      setCameraPosition([rooms[selectedRoom].position[0], 1.6, rooms[selectedRoom].position[2]])
      setCameraRotation([0, 0, 0])
    } else {
      setCameraPosition([20, 20, 20])
      setCameraRotation([0, 0, 0])
    }
  }

  const toggleTopView = () => {
    setIsTopView(!isTopView)
    if (!isTopView) {
      setCameraPosition([0, 50, 0])
      setCameraRotation([-Math.PI / 2, 0, 0])
    } else {
      setCameraPosition([20, 20, 20])
      setCameraRotation([0, 0, 0])
    }
  }

  const handleRoomMove = (index, newPosition) => {
    const newRooms = [...rooms]
    newRooms[index].position = newPosition
    setRooms(newRooms)
  }

  useEffect(() => {
    const handleKeyDown = (e) => {
      if (!isInternalView) return

      const speed = 0.1
      const currentRoom = rooms[selectedRoom]
      const halfWidth = currentRoom.structure.width / 2
      const halfDepth = currentRoom.structure.depth / 2

      switch (e.key) {
        case 'w':
          setCameraPosition(prev => [
            THREE.MathUtils.clamp(prev[0] + Math.sin(cameraRotation[1]) * speed, 
              currentRoom.position[0] - halfWidth, currentRoom.position[0] + halfWidth),
            prev[1],
            THREE.MathUtils.clamp(prev[2] - Math.cos(cameraRotation[1]) * speed,
              currentRoom.position[2] - halfDepth, currentRoom.position[2] + halfDepth)
          ])
          break
        case 's':
          setCameraPosition(prev => [
            THREE.MathUtils.clamp(prev[0] - Math.sin(cameraRotation[1]) * speed,
              currentRoom.position[0] - halfWidth, currentRoom.position[0] + halfWidth),
            prev[1],
            THREE.MathUtils.clamp(prev[2] + Math.cos(cameraRotation[1]) * speed,
              currentRoom.position[2] - halfDepth, currentRoom.position[2] + halfDepth)
          ])
          break
        case 'a':
          setCameraPosition(prev => [
            THREE.MathUtils.clamp(prev[0] - Math.cos(cameraRotation[1]) * speed,
              currentRoom.position[0] - halfWidth, currentRoom.position[0] + halfWidth),
            prev[1],
            THREE.MathUtils.clamp(prev[2] - Math.sin(cameraRotation[1]) * speed,
              currentRoom.position[2] - halfDepth, currentRoom.position[2] + halfDepth)
          ])
          break
        case 'd':
          setCameraPosition(prev => [
            THREE.MathUtils.clamp(prev[0] + Math.cos(cameraRotation[1]) * speed,
              currentRoom.position[0] - halfWidth, currentRoom.position[0] + halfWidth),
            prev[1],
            THREE.MathUtils.clamp(prev[2] + Math.sin(cameraRotation[1]) * speed,
              currentRoom.position[2] - halfDepth, currentRoom.position[2] + halfDepth)
          ])
          break
      }
    }

    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', 

 handleKeyDown)
  }, [isInternalView, cameraRotation, rooms, selectedRoom])

  return (
    <div className="flex flex-col h-screen">
      <div className="p-4 bg-gray-100">
        <form onSubmit={handleSubmit} className="flex gap-2 mb-4">
          <input
            type="text"
            value={rooms[selectedRoom]?.prompt || ''}
            onChange={(e) => {
              const newRooms = [...rooms]
              newRooms[selectedRoom].prompt = e.target.value
              setRooms(newRooms)
            }}
            placeholder="Describe the house or room..."
            className="flex-grow p-2 border rounded text-gray-900"
          />
          <button type="submit" className="bg-black hover:bg-gray-800 text-white font-bold py-2 px-4 rounded focus:outline-none focus:shadow-outline">Generate</button>
        </form>
        <div className="flex items-center gap-4 mb-4">
      <label htmlFor="realistic-mode" className="text-gray-700">
        Realistic Mode
      </label>
      <label className="relative inline-block w-10 h-6">
        <input
          type="checkbox"
          id="realistic-mode"
          checked={realisticMode}
          onChange={(e) => setRealisticMode(e.target.checked)}
          className="sr-only"
        />
        <div
          className={`block bg-gray-300 w-full h-full rounded-full cursor-pointer ${
            realisticMode ? 'bg-blue-600' : ''
          }`}
        ></div>
        <div
          className={`absolute left-1 top-1 w-4 h-4 bg-white rounded-full shadow transition-transform transform ${
            realisticMode ? 'translate-x-4' : ''
          }`}
        ></div>
      </label>
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
            <button onClick={() => addFeature('door')} className="bg-gray-700 hover:bg-gray-600 text-white font-bold py-2 px-4 rounded focus:outline-none focus:shadow-outline">Add Door</button>
            <button onClick={() => addFeature('window')} className="bg-gray-700 hover:bg-gray-600 text-white font-bold py-2 px-4 rounded focus:outline-none focus:shadow-outline">Add Window</button>
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
          <button onClick={handleDownload} className="bg-black hover:bg-gray-800 text-white font-bold py-2 px-4 rounded focus:outline-none focus:shadow-outline">Download 3D Room</button>
          <button onClick={handleSave} className="bg-black hover:bg-gray-800 text-white font-bold py-2 px-4 rounded focus:outline-none focus:shadow-outline">Save Rooms</button>
          <button onClick={handleLoad} className="bg-black hover:bg-gray-800 text-white font-bold py-2 px-4 rounded focus:outline-none focus:shadow-outline">Load Rooms</button>
          <button onClick={addRoom} className="bg-black hover:bg-gray-800 text-white font-bold py-2 px-4 rounded focus:outline-none focus:shadow-outline">Add Room</button>
          <button onClick={joinRooms} className="bg-black hover:bg-gray-800 text-white font-bold py-2 px-4 rounded focus:outline-none focus:shadow-outline">Join Rooms</button>
          <button onClick={toggleView} className="bg-black hover:bg-gray-800 text-white font-bold py-2 px-4 rounded focus:outline-none focus:shadow-outline">
            {isInternalView ? 'External View' : 'Internal View'}
          </button>
          <button onClick={toggleTopView} className="bg-black hover:bg-gray-800 text-white font-bold py-2 px-4 rounded focus:outline-none focus:shadow-outline">
          {isTopView ? 'Normal View' : 'Top View'}
        </button>
        </div>
      </div>
      <div className="flex-grow relative">
        <Canvas shadows>
          {isInternalView ? (
            <WalkingCamera position={cameraPosition} rotation={cameraRotation} />
          ) : (
            <PerspectiveCamera makeDefault position={cameraPosition} rotation={cameraRotation} />
          )}
          {!isInternalView && <OrbitControls />}
          <ambientLight intensity={0.5} />
          <pointLight position={[10, 10, 10]} castShadow />
          {realisticMode && (
            <>
              <Sky sunPosition={[100, 100, 20]} />
              <Environment preset="sunset" />
            </>
          )}
          {isTopView ? (
            rooms.map((room, index) => (
              <TopViewRoom
                key={room.id}
                structure={room.structure}
                position={room.position}
                onMove={(newPosition) => handleRoomMove(index, newPosition)}
                isSelected={index === selectedRoom}
                onSelect={() => setSelectedRoom(index)}
              />
            ))
          ) : (
            rooms.map((room, index) => (
              <group key={room.id} position={room.position}>
                <Room
                  structure={room.structure}
                  wallColors={room.wallColors}
                  features={room.features}
                  onFeatureMove={(featureIndex, newPosition) => handleFeatureMove(featureIndex, newPosition)}
                  onWallClick={handleWallClick}
                  selectedWall={selectedRoom === index ? selectedWall : null}
                  realisticMode={realisticMode}
                  roomIndex={index}
                  selectedRoom={selectedRoom}
                />
              </group>
            ))
          )}
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