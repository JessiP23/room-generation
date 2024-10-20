'use client'

import React, { useState, useRef, useEffect } from 'react'
import * as THREE from 'three'
import { Canvas, useThree, useFrame } from '@react-three/fiber'
import { OrbitControls, useTexture, Sky, Environment, Text, Line, PerspectiveCamera, PointerLockControls } from '@react-three/drei'
import { OBJExporter } from 'three/examples/jsm/exporters/OBJExporter'
import FlowerMenu from '../components/Menu'
import { Circle, Pencil } from 'lucide-react'

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

  const roofTexture = useTexture('/roof_texture.jpg')
  roofTexture.wrapS = roofTexture.wrapT = THREE.RepeatWrapping
  roofTexture.repeat.set(4, 4)

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
            map={index === 4 ? roofTexture : (index === 5 ? floorTexture : wallTextures[index])}
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
          wallDimensions={feature.wallIndex !== undefined && feature.wallIndex < sides.length ? sides[feature.wallIndex].scale : [1, 1, 1]}
          wallRotation={feature.wallIndex !== undefined && feature.wallIndex < sides.length ? sides[feature.wallIndex].rot : [0, 0, 0]}
          wallPosition={feature.wallIndex !== undefined && feature.wallIndex < sides.length ? sides[feature.wallIndex].pos : [0, 0, 0]}
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

function Feature({ type, position, wallIndex, wallDimensions, wallRotation, wallPosition, realisticMode, dimensions, start, end, height }) {
  const doorTexture = useTexture('/door_texture.jpg')
  const windowTexture = useTexture('/window_texture.jpg')
  const wallTexture = useTexture('/wall_texture.jpg')

  if (type === 'wall') {
    const wallVector = new THREE.Vector3().subVectors(new THREE.Vector3(...end), new THREE.Vector3(...start))
    const wallLength = wallVector.length()
    const wallCenter = new THREE.Vector3().addVectors(new THREE.Vector3(...start), new THREE.Vector3(...end)).multiplyScalar(0.5)
    const wallRotation = new THREE.Euler(0, Math.atan2(wallVector.z, wallVector.x), 0)

    return (
      <mesh position={wallCenter} rotation={wallRotation}>
        <boxGeometry args={[wallLength, height, 0.1]} />
        <meshStandardMaterial map={wallTexture} roughness={realisticMode ? 0.8 : 0.5} metalness={realisticMode ? 0.2 : 0} />
      </mesh>
    )
  }

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

  const wallTexture = useTexture('/wall_texture.jpg')
  wallTexture.wrapS = wallTexture.wrapT = THREE.RepeatWrapping
  wallTexture.repeat.set(1, 1)

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
            <meshStandardMaterial {...wallMaterial} map={wallTexture} />
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

function WalkingCamera({ initialPosition = [0, 1.7, 0], moveSpeed = 0.1, sprintMultiplier = 2, room, floors, currentFloor, setCurrentFloor }) {
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
          moveDirection.current.y = 1;
          break;
        case 'KeyF':
          moveDirection.current.y = -1;
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
        case 'Space':
        case 'KeyF':
          moveDirection.current.y = 0;
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
  }, [setCurrentFloor, floors]);

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
        .addScaledVector(sideways, direction.x)
        .addScaledVector(new THREE.Vector3(0, 1, 0), direction.y);

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
  const [insideViewFloor, setInsideViewFloor] = useState(0)
  const canvasRef = useRef(null)
  const editCanvasRef = useRef(null)
  const [drawingMode, setDrawingMode] = useState(null)
  const [drawingPoints, setDrawingPoints] = useState([])
  const [circles, setCircles] = useState([])
  const [currentFloor, setCurrentFloor] = useState(0);

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
      const texture = new  THREE.TextureLoader().load(textureUrl)
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

  const finishRoom = () => {
    if (roomPoints.length >= 3) {
      const newFloors = [...floors]
      newFloors[selectedFloor].rooms.push({ points: roomPoints, isComplete: true })
      setFloors(newFloors)
      setRoomPoints([])
      setIsEditingRooms(false)

      // Clear the edit canvas
      const ctx = editCanvasRef.current.getContext('2d')
      ctx.clearRect(0, 0, editCanvasRef.current.width, editCanvasRef.current.height)
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

  const startDrawingLine = () => {
    setDrawingMode('line')
    setDrawingPoints([])
  }

  const startDrawingCircle = () => {
    setDrawingMode('circle')
    setDrawingPoints([])
  }

  const handleCanvasClick = (event) => {
    if (drawingMode) {
      const { clientX, clientY } = event
      const { left, top, width, height } = editCanvasRef.current.getBoundingClientRect()
      const x = ((clientX - left) / width) * floors[selectedFloor].structure.width - floors[selectedFloor].structure.width / 2
      const z = (-(clientY - top) / height) * floors[selectedFloor].structure.depth + floors[selectedFloor].structure.depth / 2

      const newPoint = [x, z]
      const updatedPoints = [...drawingPoints, newPoint]
      setDrawingPoints(updatedPoints)

      const ctx = editCanvasRef.current.getContext('2d')
      if (drawingMode === 'line') {
        if (updatedPoints.length === 1) {
          ctx.beginPath()
          ctx.moveTo((x + floors[selectedFloor].structure.width / 2) * width / floors[selectedFloor].structure.width, (z + floors[selectedFloor].structure.depth / 2) * height / floors[selectedFloor].structure.depth)
        } else {
          ctx.lineTo((x + floors[selectedFloor].structure.width / 2) * width / floors[selectedFloor].structure.width, (z + floors[selectedFloor].structure.depth / 2) * height / floors[selectedFloor].structure.depth)
          ctx.stroke()
        }
      } else if (drawingMode === 'circle' && updatedPoints.length === 2) {
        const [x1, z1] = updatedPoints[0]
        const [x2, z2] = updatedPoints[1]
        const radius = Math.sqrt(Math.pow(x2 - x1, 2) + Math.pow(z2 - z1, 2))
        ctx.beginPath()
        ctx.arc((x1 + floors[selectedFloor].structure.width / 2) * width / floors[selectedFloor].structure.width, (z1 + floors[selectedFloor].structure.depth / 2) * height / floors[selectedFloor].structure.depth, radius * width / floors[selectedFloor].structure.width, 0, 2 * Math.PI)
        ctx.stroke()
        setCircles([...circles, { center: [x1, z1], radius }])
        setDrawingPoints([])
      }
    }
  }

  const finishDrawing = () => {
    if (drawingMode === 'line' && drawingPoints.length >= 2) {
      const newFloors = [...floors];
      const currentFloor = newFloors[selectedFloor];
      const floorHeight = currentFloor.structure.height;

      currentFloor.rooms.push({
        points: drawingPoints,
        isComplete: true,
        height: floorHeight
      });

      generateWalls(currentFloor, drawingPoints, floorHeight);
      setFloors(newFloors);
    } else if (drawingMode === 'circle' && circles.length > 0) {
      const newFloors = [...floors];
      const currentFloor = newFloors[selectedFloor];
      const floorHeight = currentFloor.structure.height;

      circles.forEach(circle => {
        generateCircularWalls(currentFloor, circle.center, circle.radius, floorHeight);
      });

      setFloors(newFloors);
      setCircles([]);
    }

    setDrawingMode(null);
    setDrawingPoints([]);
    setIsEditingRooms(false);

    // Clear the edit canvas
    const ctx = editCanvasRef.current.getContext('2d');
    ctx.clearRect(0, 0, editCanvasRef.current.width, editCanvasRef.current.height);
  };

  const generateWalls = (floor, points, height) => {
    for (let i = 0; i < points.length; i++) {
      const start = points[i];
      const end = points[(i + 1) % points.length];
      floor.features.push({
        type: 'wall',
        start: [start[0], 0, start[1]],
        end: [end[0], 0, end[1]],
        height: height,
      });
    }
  };

  const generateCircularWalls = (floor, center, radius, height) => {
    const segments = 32;
    for (let i = 0; i < segments; i++) {
      const angle1 = (i / segments) * Math.PI * 2;
      const angle2 = ((i + 1) / segments) * Math.PI * 2;
      const start = [
        center[0] + Math.cos(angle1) * radius,
        center[1] + Math.sin(angle1) * radius
      ];
      const end = [
        center[0] + Math.cos(angle2) * radius,
        center[1] + Math.sin(angle2) * radius
      ];
      floor.features.push({
        type: 'wall',
        start: [start[0], 0, start[1]],
        end: [end[0], 0, end[1]],
        height: height,
      });
    }
  };

  const toggleInsideView = () => {
    setIsInsideView(!isInsideView);
    setIsTopView(false);
    if (!isInsideView) {
      const floorHeight = floors[selectedFloor].structure.height;
      setInsideViewPosition([0, floorHeight / 2, 0]);
      setInsideViewFloor(selectedFloor);
      setCurrentFloor(selectedFloor);
      setCameraPosition([0, floorHeight / 2, 0]);
    } else {
      setCameraPosition([15, 15, 15]);
    }
  };

  const handleInsideViewFloorChange = (event) => {
    const newFloor = Number(event.target.value);
    setInsideViewFloor(newFloor);
    setCurrentFloor(newFloor);
    const floorHeight = floors[newFloor].structure.height;
    const newPosition = [0, newFloor * floorHeight + floorHeight / 2, 0];
    setInsideViewPosition(newPosition);
    setCameraPosition(newPosition);
  };

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
          <button 
            className="bg-pink-500 hover:bg-pink-700 text-white font-bold py-2 px-4 rounded"
            onClick={startEditingRooms}
          >
            {isEditingRooms ? "Finish Room" : "Edit Floor"}
          </button>
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
          {isInsideView && (
            <select 
              className="bg-gray-700 text-white py-2 px-4 rounded"
              value={insideViewFloor}
              onChange={handleInsideViewFloorChange}
            >
              {floors.map((_, index) => (
                <option key={index} value={index}>Floor {index + 1}</option>
              ))}
            </select>
          )}
          <button
            className="bg-blue-500 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded flex items-center"
            onClick={startDrawingLine}
          >
            <Pencil className="mr-2" size={16} /> Draw Line
          </button>
          <button
            className="bg-green-500 hover:bg-green-700 text-white font-bold py-2 px-4 rounded flex items-center"
            onClick={startDrawingCircle}
          >
            <Circle className="mr-2" size={16} /> Draw Circle
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
          <div className="w-[70vw] h-[calc(100vh-12rem)] bg-white rounded-lg shadow-lg overflow-hidden" ref={canvasRef}>
          <Canvas shadows camera={{ position: cameraPosition, fov: 75 }}>
              {!isInsideView && !isEditingRooms && (
                <OrbitControls
                  enableRotate={true}
                  enablePan={true}
                  enableZoom={true}
                  target={[0, selectedFloor * floors[selectedFloor].structure.height + floors[selectedFloor].structure.height / 2, 0]}
                />
              )}
              {isInsideView && (
                <WalkingCamera
                  initialPosition={insideViewPosition}
                  room={floors[insideViewFloor]}
                  floors={floors}
                  currentFloor={currentFloor}
                  setCurrentFloor={setCurrentFloor}
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
            </Canvas>
          </div>
          {isEditingRooms && (
            <div className="w-[30vw] h-[calc(100vh-12rem)] bg-white rounded-lg shadow-lg overflow-hidden ml-4 p-4">
              <h2 className="text-xl font-bold mb-4">Edit Floor {selectedFloor + 1}</h2>
              <canvas
                ref={editCanvasRef}
                width={300}
                height={300}
                className="border border-gray-300 mb-4"
                onClick={handleCanvasClick}
              />
              <p className="mb-4">
                {drawingMode === 'line' && "Click on the canvas to draw lines for the room."}
                {drawingMode === 'circle' && "Click two points to define a circle."}
                {!drawingMode && "Select a drawing mode to start."}
              </p>
              <button 
                className="bg-green-500 hover:bg-green-700 text-white font-bold py-2 px-4 rounded"
                onClick={finishDrawing}
              >
                Done
              </button>
            </div>
          )}
        </div>
      </div>
      {/* footer */}
      <footer className="bg-gray-800 text-white p-4 text-center">
        <p>&copy; 2023 Advanced Building Creator. All rights reserved.</p>
        <p>Created with React, Three.js, and ❤️</p>
      </footer>
    </div>
  )
}