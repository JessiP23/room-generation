'use client'

// code
import React, { useState, useEffect, useRef, useMemo, useCallback } from 'react'
import * as THREE from 'three'
import { Canvas, useThree, useFrame } from '@react-three/fiber'
import { OrbitControls, Text, PerspectiveCamera, PointerLockControls, useTexture, SpotLight, Sky, Environment, Html } from '@react-three/drei'
import { GLTFExporter } from 'three/examples/jsm/exporters/GLTFExporter'
import FlowerMenu from '../components/Menu'
import { db, auth } from '@/firebase'
import { getAuth, onAuthStateChanged } from 'firebase/auth'
import { getFirestore, collection, addDoc, query, where, getDocs, limit, doc, getDoc, updateDoc, setDoc } from 'firebase/firestore'
import { useRouter } from 'next/navigation'
import { Crown, Sparkles, DollarSign } from 'lucide-react'
import { EnvironmentScene } from '../components/environments'
import { CSG } from 'three-csg-ts'
import { motion, AnimatePresence } from 'framer-motion'

// room 
// Room component

const Room = React.memo(({ 
  structure, wallColors, features, onFeatureMove, onWallClick, selectedWall, realisticMode, roomIndex, selectedRoom, wallTextures, onFeatureSelect, wallThickness, modifiedWalls 
}) => {
  const { width, height, depth } = structure

  const sides = [
    { pos: [0, 0, depth/2], rot: [0, 0, 0], scale: [width, height, wallThickness], size: [width, height] },
    { pos: [0, 0, -depth/2], rot: [0, 0, 0], scale: [width, height, wallThickness], size: [width, height] },
    { pos: [width/2, 0, 0], rot: [0, Math.PI/2, 0], scale: [depth, height, wallThickness], size: [depth, height] },
    { pos: [-width/2, 0, 0], rot: [0, Math.PI/2, 0], scale: [depth, height, wallThickness], size: [depth, height] },
    { pos: [0, height/2, 0], rot: [Math.PI/2, 0, 0], scale: [width, depth, wallThickness], size: [width, depth] },
    { pos: [0, -height/2, 0], rot: [Math.PI/2, 0, 0], scale: [width, depth, wallThickness], size: [width, depth] },
  ]

  const textureLoader = new THREE.TextureLoader()
  const loadedTextures = wallTextures.map(texture => textureLoader.load(texture))

  return (
    <group>
      {sides.map((side, index) => (
        <group key={index} position={side.pos} rotation={side.rot}>
          {modifiedWalls && modifiedWalls[index] ? (
            <primitive object={modifiedWalls[index]} />
          ) : (
            <mesh 
              scale={side.scale}
              onClick={(e) => {
                e.stopPropagation()
                onWallClick(roomIndex, index)
              }}
              castShadow
              receiveShadow
            >
              <boxGeometry args={[1, 1, 1]} />
              <meshStandardMaterial 
                color={wallColors[index]} 
                side={THREE.DoubleSide}
                emissive={selectedRoom === roomIndex && selectedWall === index ? new THREE.Color(0x666666) : undefined}
                roughness={realisticMode ? 0.8 : 0.5}
                metalness={realisticMode ? 0.2 : 0}
                map={loadedTextures[index]}
              />
            </mesh>
          )}
          {selectedRoom === roomIndex && selectedWall === index && (
            <Html>
              <div className="bg-black text-white px-2 py-1 rounded text-sm">
                {`${side.size[0].toFixed(2)}m x ${side.size[1].toFixed(2)}m`}
              </div>
            </Html>
          )}
        </group>
      ))}
      {features.map((feature, index) => (
        <Feature 
          key={index} 
          {...feature} 
          wallDimensions={sides[feature.wallIndex]?.scale || [1, 1, 1]}
          wallRotation={sides[feature.wallIndex]?.rot || [0, 0, 0]}
          wallPosition={sides[feature.wallIndex]?.pos || [0, 0, 0]}
          realisticMode={realisticMode}
          onMove={(newPosition) => onFeatureMove(index, newPosition)}
          onSelect={() => onFeatureSelect(index)}
          wallThickness={wallThickness}
        />
      ))}
    </group>
  )
})



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

  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.code === 'KeyR' && isSelected) {
        setIsDragging(false);
        onMove([mesh.current.position.x, 0, mesh.current.position.z]);
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [isSelected, onMove]);

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
    >
      <boxGeometry args={[width, 0.1, depth]} />
      <meshStandardMaterial color={isSelected ? '#ff0000' : '#cccccc'} />
    </mesh>
  )
}


// feauure
const Feature = React.memo(({ 
  type, 
  position, 
  wallIndex, 
  onMove, 
  wallDimensions, 
  wallRotation, 
  wallPosition, 
  realisticMode, 
  dimensions, 
  texture, 
  selectedFeature, 
  onSelect,
  wallThickness
}) => {
  const mesh = useRef()
  const { camera } = useThree()
  const [isMoving, setIsMoving] = useState(false)
  const [featureDimensions, setFeatureDimensions] = useState({
    width: dimensions?.width || (type === 'door' ? 1 : 1),
    height: dimensions?.height || (type === 'door' ? 2 : 1),
    depth: type === 'door' || type === 'window' ? wallThickness + 0.016 : wallThickness // Add 8mm to each side for doors and windows
  })

  useEffect(() => {
    setFeatureDimensions({
      width: dimensions?.width || (type === 'door' ? 1 : 1),
      height: dimensions?.height || (type === 'door' ? 2 : 1),
      depth: type === 'door' || type === 'window' ? wallThickness + 0.016 : wallThickness
    })
  }, [dimensions, type, wallThickness])

  const doorTextures = [
    '/door_texture.jpg',
    '/door_texture2.jpg',
    '/door_texture3.jpg',
    '/door_texture4.jpg',
    '/door_texture5.jpg',
    '/door_texture6.jpg',
  ]

  const windowTextures = [
    '/window_texture.jpg',
    '/window_texture2.jpg',
    '/window_texture3.jpg',
  ]

  const featureTexture = useTexture(texture || (type === 'door' ? doorTextures[0] : windowTextures[0]))

  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.code === 'KeyR') {
        setIsMoving(false)
      }
    }

    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [])

  const handleMove = useCallback((newPosition) => {
    if (onMove) {
      onMove(newPosition)
    }
  }, [onMove])

  useFrame(({ mouse }) => {
    if (isMoving && mesh.current) {
      const wallNormal = new THREE.Vector3(0, 0, 1).applyEuler(new THREE.Euler(...wallRotation))
      const planeIntersect = new THREE.Plane(wallNormal, 0)
      const raycaster = new THREE.Raycaster()
      raycaster.setFromCamera(new THREE.Vector2(mouse.x, mouse.y), camera)
      
      const intersectPoint = new THREE.Vector3()
      raycaster.ray.intersectPlane(planeIntersect, intersectPoint)

      const rotatedIntersectPoint = intersectPoint.clone()
      rotatedIntersectPoint.applyEuler(new THREE.Euler(...wallRotation))

      const localPoint = rotatedIntersectPoint.sub(new THREE.Vector3(...wallPosition))
      const halfWidth = wallDimensions[0] / 2
      const halfHeight = wallDimensions[1] / 2

      // Ensure consistent movement across all walls
      const newX = THREE.MathUtils.clamp(localPoint.x, -halfWidth + featureDimensions.width / 2, halfWidth - featureDimensions.width / 2)
      const newY = THREE.MathUtils.clamp(localPoint.y, -halfHeight + featureDimensions.height / 2, halfHeight - featureDimensions.height / 2)

      const newPosition = [newX, newY, 0]
      mesh.current.position.set(...newPosition)
      handleMove(newPosition)
    }
  })

  const handlePointerDown = (e) => {
    e.stopPropagation()
    setIsMoving(true)
    if (onSelect) {
      onSelect()
    }
  }

  return (
    <group position={wallPosition} rotation={wallRotation}>
      <mesh
        ref={mesh}
        position={[position[0], position[1], 0]} // Center the feature in the wall
        onPointerDown={handlePointerDown}
        castShadow
        receiveShadow
      >
        <boxGeometry args={[featureDimensions.width, featureDimensions.height, featureDimensions.depth]} />
        <meshStandardMaterial 
          color={type === 'door' ? '#8B4513' : type === 'window' ? '#87CEEB' : '#FFFFFF'} 
          roughness={realisticMode ? 0.6 : 0.3}
          metalness={realisticMode ? 0.1 : 0}
          map={featureTexture}
        />
      </mesh>
      {selectedFeature && (
        <Html position={[position[0], position[1] - featureDimensions.height / 2 - 0.5, position[2]]}>
          <div className="bg-black text-white px-2 py-1 rounded text-sm">
            {`Width: ${featureDimensions.width.toFixed(2)}m\nHeight: ${featureDimensions.height.toFixed(2)}m`}
          </div>
        </Html>
      )}
    </group>
  )
})

// walking camera
const WalkingCamera = React.memo(({ initialPosition = [0, 1.7, 0], moveSpeed = 0.1, sprintMultiplier = 2, room }) => {
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
        case 'KeyR':
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
})



const EnvironmentWrapper = React.memo(({ environment, rooms }) => {
  const { scene } = useThree()
  const envRef = useRef()

  useEffect(() => {
    if (envRef.current) {
      const lowestY = Math.min(...rooms.map(room => room.position[1] - room.structure.height / 2))
      envRef.current.position.y = lowestY
    }
  }, [rooms, environment])

  return (
    <group ref={envRef}>
      <EnvironmentScene environment={environment} />
    </group>
  )
})




export default function CustomizableRoom() {

  const [wallThickness, setWallThickness] = useState(0.2)

  const handleWallThicknessChange = (e) => {
    setWallThickness(Number(e.target.value))
  }

  const [rooms, setRooms] = useState([
    {
      id: 1,
      prompt: '',
      structure: { width: 10, height: 8, depth: 10 },
      wallColors: Array(6).fill('#FFFFFF'),
      wallTextures: Array(6).fill('/wall_texture.jpg'),
      features: [],
      position: [0, 0, 0],
      wallThickness: 0.2, // Add default wall thickness
      modifiedWalls: {}
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
  const [selectedFeature, setSelectedFeature] = useState(null)
  const [loading, setLoading] = useState(true);
  const router = useRouter();

  // handling roof
  const [roofs, setRoofs] = useState([]);
  const [selectedRoomForRoof, setSelectedRoomForRoof] = useState(null);
  const [selectedRoofStyle, setSelectedRoofStyle] = useState('pyramid'); 

  const [user, setUser] = useState(null)
  const [subscription, setSubscription] = useState('free')
  const [showSaveModal, setShowSaveModal] = useState(false)
  const [projectName, setProjectName] = useState('')
  const [savedProjects, setSavedProjects] = useState([])
  const [showLoadModal, setShowLoadModal] = useState(false)
  const [showUpgradeModal, setShowUpgradeModal] = useState(false)

  const [environment, setEnvironment] = useState('forest')
  const [price, setPrice] = useState(0)

  const [selectedHallway, setSelectedHallway] = useState(null)
  const [hallwayDimensions, setHallwayDimensions] = useState({ width: 2, height: 2.5 })
  const [modifiedWalls, setModifiedWalls] = useState({})

  const [fenceMode, setFenceMode] = useState(false)
  const [fencePoints, setFencePoints] = useState([])
  const [fenceDesign, setFenceDesign] = useState('wooden')

  // Memoize expensive computations
  const memoizedRooms = useMemo(() => rooms, [rooms])
  const memoizedEnvironment = useMemo(() => environment, [environment])

  const [showNotification, setShowNotification] = useState(false)

  useEffect(() => {
    if (notification) {
      setShowNotification(true)
      const timer = setTimeout(() => setShowNotification(false), 3000)
      return () => clearTimeout(timer)
    }
  }, [notification])
  


  const addHallway = () => {
    if (selectedWall === null) return
    const newRooms = [...rooms]
    const newHallway = {
      type: 'hallway',
      position: [0, 0, 0.05],
      wallIndex: selectedWall,
      dimensions: { ...hallwayDimensions }
    }
    newRooms[selectedRoom].features.push(newHallway)
    setRooms(newRooms)
    setSelectedHallway(newRooms[selectedRoom].features.length - 1)
  }

  const handleHallwayMove = (hallwayIndex, newPosition) => {
    const newRooms = [...rooms]
    if (newRooms[selectedRoom] && newRooms[selectedRoom].features[hallwayIndex]) {
      newRooms[selectedRoom].features[hallwayIndex].position = newPosition
      setRooms(newRooms)
    }
  }

  const handleHallwayResize = (dimension, value) => {
    setHallwayDimensions(prev => ({ ...prev, [dimension]: Number(value) }))
    if (selectedHallway !== null) {
      const newRooms = [...rooms]
      if (newRooms[selectedRoom] && newRooms[selectedRoom].features[selectedHallway]) {
        newRooms[selectedRoom].features[selectedHallway].dimensions = {
          ...newRooms[selectedRoom].features[selectedHallway].dimensions,
          [dimension]: Number(value)
        }
        setRooms(newRooms)
      }
    }
  }

  const confirmHallway = () => {
    if (selectedHallway !== null) {
      const newRooms = [...rooms]
      const hallway = newRooms[selectedRoom].features[selectedHallway]
      const wallIndex = hallway.wallIndex
      const wallDimensions = [
        newRooms[selectedRoom].structure.width,
        newRooms[selectedRoom].structure.height,
        newRooms[selectedRoom].structure.depth
      ]

      // Calculate the area to remove from the wall
      const removeWidth = hallway.dimensions.width
      const removeHeight = hallway.dimensions.height
      const removeDepth = wallThickness

      // Create a new mesh to represent the removed area
      const removeMesh = new THREE.Mesh(
        new THREE.BoxGeometry(removeWidth, removeHeight, removeDepth),
        new THREE.MeshBasicMaterial({ color: 0x000000 })
      )

      // Position the remove mesh relative to the wall
      removeMesh.position.set(
        hallway.position[0],
        hallway.position[1],
        0
      )

      // Create the wall geometry
      const wallGeometry = new THREE.BoxGeometry(
        wallIndex % 2 === 0 ? wallDimensions[0] : wallThickness,
        wallDimensions[1],
        wallIndex % 2 === 0 ? wallThickness : wallDimensions[2]
      )
      const wallMesh = new THREE.Mesh(wallGeometry)

      // Perform CSG operation to remove the hallway area from the wall
      const wallCSG = CSG.fromMesh(wallMesh)
      const removeCSG = CSG.fromMesh(removeMesh)
      const resultCSG = wallCSG.subtract(removeCSG)

      // Create a new mesh from the result
      const resultMesh = CSG.toMesh(resultCSG, wallMesh.matrix)
      resultMesh.material = new THREE.MeshStandardMaterial({
        color: newRooms[selectedRoom].wallColors[wallIndex],
        side: THREE.DoubleSide,
        roughness: realisticMode ? 0.8 : 0.5,
        metalness: realisticMode ? 0.2 : 0,
        map: new THREE.TextureLoader().load(newRooms[selectedRoom].wallTextures[wallIndex])
      })

      // Update the modified walls
      newRooms[selectedRoom].modifiedWalls = {
        ...newRooms[selectedRoom].modifiedWalls,
        [wallIndex]: resultMesh
      }

      // Remove the hallway feature
      newRooms[selectedRoom].features = newRooms[selectedRoom].features.filter((_, index) => index !== selectedHallway)

      setRooms(newRooms)
      setSelectedHallway(null)
    }
  }

  const fetchSubscription = async (userId) => {
    const userDoc = await getDocs(query(collection(db, 'users'), where('userId', '==', userId)))
    if (!userDoc.empty) {
      setSubscription(userDoc.docs[0].data().subscription || 'free')
    }
  }

  const handleEnvironmentChange = (e) => {
    setEnvironment(e.target.value)
  }

  const handlePriceChange = (e) => {
    setPrice(Number(e.target.value))
  }

  const sellRoom = async () => {
    if (!user) {
      setNotification('Please sign in to sell rooms')
      setTimeout(() => setNotification(''), 2000)
      return
    }

    try {
      const userRef = doc(db, 'users', user.uid)
      const roomsCollectionRef = collection(userRef, 'rooms')
      await addDoc(roomsCollectionRef, {
        name: `Room for Sale - $${price}`,
        rooms: rooms,
        price: price,
        createdAt: new Date(),
        status: 'for sale'
      })
      setNotification('Room listed for sale successfully')
    } catch (error) {
      setNotification('Error listing room for sale: ' + error.message)
    }
    setTimeout(() => setNotification(''), 2000)
  }

  const createOrUpdateUserDocument = async (userId) => {
    const userRef = doc(db, 'users', userId)
    const userSnap = await getDoc(userRef)

    if (!userSnap.exists()) {
      await setDoc(userRef, {
        userId: userId,
        subscription: 'free'
      })
    }

    const userData = userSnap.data()
    setSubscription(userData?.subscription || 'free')
  }

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (currentUser) => {
      setUser(currentUser)
      setLoading(false)
      if (currentUser) {
        await createOrUpdateUserDocument(currentUser.uid)
        fetchSavedProjects(currentUser.uid)
      } else {
        router.push('/sign-in')
      }
    })

    return () => unsubscribe()
  }, [router])

  const fetchSavedProjects = async (userId) => {
    const userRef = doc(db, 'users', userId)
    const roomsCollectionRef = collection(userRef, 'rooms')
    const querySnapshot = await getDocs(roomsCollectionRef)
    setSavedProjects(querySnapshot.docs.map(doc => ({ id: doc.id, name: doc.data().name })))
  }

  const enhanceRealisticMode = () => {
    if (realisticMode) {
      // Add more realistic lighting
      const newRooms = [...rooms]
      newRooms.forEach(room => {
        if (!room.features.some(f => f.type === 'light')) {
          room.features.push({
            type: 'light',
            position: [0, room.structure.height - 0.5, 0],
            intensity: 1,
            color: '#FFFFFF',
          })
        }
      })
      setRooms(newRooms)
    }
  }

  useEffect(() => {
    enhanceRealisticMode()
  }, [realisticMode])

  const handleFeatureMove = (featureIndex, newPosition) => {
    const newRooms = [...rooms]
    if (newRooms[selectedRoom] && newRooms[selectedRoom].features[featureIndex]) {
      newRooms[selectedRoom].features[featureIndex].position = newPosition
      setRooms(newRooms)
    }
  }

  const handleFeatureSelect = (featureIndex) => {
    setSelectedFeature(featureIndex)
  }
  const handleWallClick = (roomIndex, wallIndex) => {
    setSelectedRoom(roomIndex)
    setSelectedWall(wallIndex)
    setNotification(`Room ${roomIndex + 1}, Wall ${wallIndex + 1} selected`)
    setTimeout(() => setNotification(''), 2000)
  }
  

  const renderRooms = useCallback(() => {
    return !isTopView ? memoizedRooms.map((room, index) => (
      <group key={room.id} position={room.position}>
        <Room
          structure={room.structure}
          wallColors={room.wallColors}
          wallTextures={room.wallTextures}
          features={room.features}
          onFeatureMove={handleFeatureMove}
          onFeatureSelect={handleFeatureSelect}
          onWallClick={handleWallClick}
          selectedWall={selectedRoom === index ? selectedWall : null}
          realisticMode={realisticMode}
          roomIndex={index}
          
          selectedRoom={selectedRoom}
          wallThickness={wallThickness}
          modifiedWalls={room.modifiedWalls}
        />
      </group>
    )) : memoizedRooms.map((room, index) => (
      <TopViewRoom
        key={room.id}
        structure={room.structure}
        position={room.position}
        onMove={(newPosition) => handleRoomMove(index, newPosition)}
        isSelected={index === selectedRoom}
        onSelect={() => setSelectedRoom(index)}
      />
    ))
  }, [isTopView, memoizedRooms, selectedRoom, selectedWall, realisticMode, wallThickness])


  
  if (loading) {
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="animate-spin rounded-full h-32 w-32 border-t-2 border-b-2 border-purple-500"></div>
      </div>
    )
  }

  if (!user) {
    return null; // This will prevent the component from rendering while redirecting
  }



  // textures
  const availableTextures = [
    '/wall_texture.jpg',
    '/brick_texture.jpg',
    '/wood_texture.jpg',
    '/stone_texture.jpg',
    '/plaster.jpg',
    '/plaster1.jpg',
    '/plaster2.jpg',
  ]

  // door
  const doorTextures = [
    '/door_texture.jpg',
    '/door_texture2.jpg',
    '/door_texture3.jpg',
    '/door_texture4.jpg',
    '/door_texture5.jpg',
    '/door_texture6.jpg',
  ]

  const windowTextures = [
    '/window_texture.jpg',
    '/window_texture1.jpg',
    '/window_texture2.jpg',
    '/window_texture3.jpg',
    '/window_texture4.jpg',
  ]



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

  const handleTextureChange = (texture) => {
    if (selectedWall !== null) {
      const newRooms = [...rooms]
      newRooms[selectedRoom].wallTextures[selectedWall] = texture
      setRooms(newRooms)
    }
  }


  const addFeature = (type) => {
    if (selectedWall === null) return
    const newRooms = [...rooms]
    const newFeature = { type, position: [0, 0, 0.05], wallIndex: selectedWall }
    newRooms[selectedRoom].features.push(newFeature)
    setRooms(newRooms)
  }


  const handleFeatureResize = (dimension, value) => {
    const newRooms = [...rooms]
    if (newRooms[selectedRoom] && newRooms[selectedRoom].features[selectedFeature]) {
      newRooms[selectedRoom].features[selectedFeature].dimensions = {
        ...newRooms[selectedRoom].features[selectedFeature].dimensions,
        [dimension]: Number(value)
      }
      setRooms(newRooms)
    }
  }

  const handleFeatureTextureChange = (newTexture) => {
    const newRooms = [...rooms]
    if (newRooms[selectedRoom] && newRooms[selectedRoom].features[selectedFeature]) {
      newRooms[selectedRoom].features[selectedFeature].texture = newTexture
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
          feature.dimensions?.width || (feature.type === 'door' ? 1 : 1),
          feature.dimensions?.height || (feature.type === 'door' ? 2 : 1),
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

  const handleSave = async () => {
    if (!user) {
      setNotification('Please sign in to save rooms')
      setTimeout(() => setNotification(''), 2000)
      return
    }

    const userRef = doc(db, 'users', user.uid)
    const roomsCollectionRef = collection(userRef, 'rooms')
    const querySnapshot = await getDocs(roomsCollectionRef)
    const userRoomsCount = querySnapshot.size

    if ((subscription === 'free' && userRoomsCount >= 1) || (subscription === 'premium' && userRoomsCount >= 5)) {
      setNotification('You have reached your room limit. Please upgrade your subscription to save more rooms.')
      setTimeout(() => setNotification(''), 2000)
      return
    }

    setShowSaveModal(true)
  }

  
  const confirmSave = async () => {
    if (!projectName) {
      setNotification('Please enter a project name');
      return;
    }
  
    try {
      const userRef = doc(db, 'users', user.uid);
      const roomsCollectionRef = collection(userRef, 'rooms');
  
      // Create the project object
      const projectData = {
        name: projectName,
        rooms: rooms,
        createdAt: new Date(),
        // Use optional chaining to safely add properties if they exist
        environment: environment ?? undefined,
        fencePoints: fencePoints ?? undefined,
        fenceDesign: fenceDesign ?? undefined,
      };
  
      // Remove undefined properties from projectData
      Object.keys(projectData).forEach(key => {
        if (projectData[key] === undefined) {
          delete projectData[key];
        }
      });
  
      // Save the project to Firestore
      await addDoc(roomsCollectionRef, projectData);
      setNotification('Project saved successfully');
      setShowSaveModal(false);
      setProjectName('');
      fetchSavedProjects(user.uid);
    } catch (error) {
      setNotification('Error saving project: ' + error.message);
    }
    
    // Clear notification after 2 seconds
    setTimeout(() => setNotification(''), 2000);
  };

  const handleLoad = () => {
    setShowLoadModal(true);
  };

  const loadProject = async (projectId) => {
    try {
      const userRef = doc(db, 'users', user.uid)
      const projectRef = doc(collection(userRef, 'rooms'), projectId)
      const projectSnap = await getDoc(projectRef)
      
      if (projectSnap.exists()) {
        const projectData = projectSnap.data()
        setRooms(projectData.rooms || [])
        setEnvironment(projectData.environment || 'forest')
        setFencePoints(projectData.fencePoints || [])
        setFenceDesign(projectData.fenceDesign || 'wooden')
        setSelectedRoom(0)
        setShowLoadModal(false)
        setNotification('Project loaded successfully')
        setTimeout(() => setNotification(''), 2000)
      } else {
        setNotification('Project not found')
        setTimeout(() => setNotification(''), 2000)
      }
    } catch (error) {
      console.error('Error loading project:', error)
      setNotification('Error loading project')
      setTimeout(() => setNotification(''), 2000)
    }
  }


  const handleUpgrade = async () => {
    setShowUpgradeModal(true)
  }

  const confirmUpgrade = async () => {
    try {
      const userRef = doc(db, 'users', user.uid)
      await updateDoc(userRef, {
        subscription: 'premium'
      })
      setSubscription('premium')
      setNotification('Subscription upgraded to premium successfully')
      setShowUpgradeModal(false)
    } catch (error) {
      console.error('Error upgrading subscription:', error)
      setNotification('Error upgrading subscription')
    }
    setTimeout(() => setNotification(''), 2000)
  }

  const addRoom = () => {
    const lastRoom = rooms[rooms.length - 1]
    const newRoom = {
      id: rooms.length + 1,
      prompt: '',
      structure: { width: 10, height: 8, depth: 10 },
      wallColors: Array(6).fill('#FFFFFF'),
      wallTextures: Array(6).fill('/wall_texture.jpg'),
      features: [],
      position: [lastRoom.position[0] + lastRoom.structure.width + 2, 0, 0],
    }
    setRooms([...rooms, newRoom])
    setSelectedRoom(rooms.length)
  }

  const roofStyles = {
    pyramid: (width, height) => new THREE.ConeGeometry(width / 2, height, 4),
    gable: (width, height) => {
      const shape = new THREE.Shape();
      shape.moveTo(-width / 2, 0);
      shape.lineTo(0, height);
      shape.lineTo(width / 2, 0);
      return new THREE.ExtrudeGeometry(shape, { depth: width, bevelEnabled: false });
    },
    flat: (width) => new THREE.BoxGeometry(width, 0.1, width),
    dome: (width, height) => new THREE.SphereGeometry(width / 2, 32, 16, 0, Math.PI * 2, 0, Math.PI / 2)
  };

  const handleRoomClick = (roomIndex) => {
    setSelectedRoomForRoof(roomIndex);
  };

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

  

  const handleRoofStyleChange = (e) => {
    setSelectedRoofStyle(e.target.value);
  };

  return (
    <div className="flex flex-col h-screen">
      <FlowerMenu />
      <div className="min-h-screen bg-gradient-to-br from-gray-900 via-indigo-900 to-purple-900 text-white p-6 overflow-y-auto">
      <div className="max-w-7xl mx-auto bg-black/30 backdrop-blur-xl rounded-3xl shadow-2xl border border-white/10 p-8 transition-all duration-300 hover:shadow-purple-500/20">
        <h1 className="text-4xl font-bold mb-8 text-transparent bg-clip-text bg-gradient-to-r from-blue-400 to-purple-600 animate-pulse">
          Customizable Room Designer
        </h1>
        
        <div className="flex items-center justify-between mb-8 bg-gradient-to-r from-blue-500/20 to-purple-500/20 p-4 rounded-2xl backdrop-blur-sm">
          <div className="flex items-center gap-4">
            <div className={`p-2 rounded-full ${subscription === 'premium' ? 'bg-yellow-400 animate-bounce' : 'bg-gray-600'}`}>
              {subscription === 'premium' ? (
                <Crown className="w-6 h-6 text-gray-900" />
              ) : (
                <div className="w-6 h-6 rounded-full bg-gray-500" />
              )}
            </div>
            <span className={`font-semibold text-lg ${
              subscription === 'premium'
                ? 'text-yellow-400'
                : 'text-gray-300'
            }`}>
              {subscription === 'premium' ? 'Premium' : 'Free'}
            </span>
          </div>
          
          {subscription === 'free' && (
            <button
              onClick={handleUpgrade}
              className="group relative overflow-hidden px-6 py-3 bg-gradient-to-r from-purple-500 to-pink-500 rounded-full text-white font-semibold text-lg transition-all duration-300 hover:from-purple-600 hover:to-pink-600 focus:outline-none focus:ring-2 focus:ring-purple-400 focus:ring-opacity-50 transform hover:scale-105"
            >
              <span className="relative z-10 flex items-center">
                Upgrade to Premium
                <Sparkles className="w-5 h-5 ml-2 animate-spin" />
              </span>
              <span className="absolute inset-0 bg-gradient-to-r from-purple-600 to-pink-600 opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
            </button>
          )}
        </div>

        <form onSubmit={handleSubmit} className="mb-8 bg-white/5 p-6 rounded-2xl backdrop-blur-sm">
          <div className="flex flex-wrap gap-4 mb-4">
            <input
              type="text"
              value={rooms[selectedRoom]?.prompt || ''}
              onChange={(e) => {
                const newRooms = [...rooms]
                newRooms[selectedRoom].prompt = e.target.value
                setRooms(newRooms)
              }}
              placeholder="Describe the house or room..."
              className="flex-grow p-3 bg-gray-800/50 border border-gray-700 rounded-xl text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-purple-500 transition-all duration-300"
            />
            <button type="submit" className="px-6 py-3 bg-gradient-to-r from-blue-500 to-purple-500 rounded-xl text-white font-semibold hover:from-blue-600 hover:to-purple-600 transition-all duration-300 transform hover:scale-105 focus:outline-none focus:ring-2 focus:ring-purple-400 focus:ring-opacity-50">
              Generate
            </button>
          </div>
          <div className="flex flex-wrap items-center gap-6 mb-4">
            <label className="flex items-center cursor-pointer">
              <input
                type="checkbox"
                checked={realisticMode}
                onChange={(e) => setRealisticMode(e.target.checked)}
                className="sr-only peer"
              />
              <div className="relative w-11 h-6 bg-gray-600 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-purple-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-purple-600"></div>
              <span className="ml-3 text-sm font-medium text-gray-300">Realistic Mode</span>
            </label>
            <div className="flex items-center gap-2">
              <label htmlFor="environment" className="text-sm font-medium text-gray-300">Environment</label>
              <select
                id="environment"
                value={environment}
                onChange={handleEnvironmentChange}
                className="p-2 bg-gray-800/50 border border-gray-700 rounded-xl text-white focus:outline-none focus:ring-2 focus:ring-purple-500 transition-all duration-300"
              >
                <option value="forest">Forest</option>
                <option value="city">City</option>
                <option value="desert">Desert</option>
                <option value="snow">Snow</option>
              </select>
            </div>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-4">
            <input
              type="number"
              value={rooms[selectedRoom].structure.width}
              onChange={(e) => handleDimensionChange('width', e.target.value)}
              placeholder="Width"
              className="p-3 bg-gray-800/50 border border-gray-700 rounded-xl text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-purple-500 transition-all duration-300"
            />
            <input
              type="number"
              value={rooms[selectedRoom].structure.height}
              onChange={(e) => handleDimensionChange('height', e.target.value)}
              placeholder="Height"
              className="p-3 bg-gray-800/50 border border-gray-700 rounded-xl text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-purple-500 transition-all duration-300"
            />
            <input
              type="number"
              value={rooms[selectedRoom].structure.depth}
              onChange={(e) => handleDimensionChange('depth', e.target.value)}
              placeholder="Depth"
              className="p-3 bg-gray-800/50 border border-gray-700 rounded-xl text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-purple-500 transition-all duration-300"
            />
          </div>
          <div className="flex items-center gap-4">
            <label htmlFor="wall-thickness" className="text-sm font-medium text-gray-300">Wall Thickness</label>
            <input
              type="number"
              id="wall-thickness"
              value={wallThickness}
              onChange={handleWallThicknessChange}
              placeholder="Thickness"
              step="0.1"
              className="p-3 bg-gray-800/50 border border-gray-700 rounded-xl text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-purple-500 transition-all duration-300"
            />
          </div>
        </form>

        {selectedFeature !== null && rooms[selectedRoom] && rooms[selectedRoom].features[selectedFeature] && (
          <div className="mb-8 bg-white/5 p-6 rounded-2xl backdrop-blur-sm">
            <h3 className="text-xl font-semibold mb-4 text-purple-300">Feature Settings</h3>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <input
                type="number"
                value={rooms[selectedRoom].features[selectedFeature].dimensions?.width || 1}
                onChange={(e) => handleFeatureResize('width', e.target.value)}
                placeholder="Width"
                step="0.1"
                className="p-3 bg-gray-800/50 border border-gray-700 rounded-xl text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-purple-500 transition-all duration-300"
              />
              <input
                type="number"
                value={rooms[selectedRoom].features[selectedFeature].dimensions?.height || (rooms[selectedRoom].features[selectedFeature].type === 'door' ? 2 : 1)}
                onChange={(e) => handleFeatureResize('height', e.target.value)}
                placeholder="Height"
                step="0.1"
                className="p-3 bg-gray-800/50 border border-gray-700 rounded-xl text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-purple-500 transition-all duration-300"
              />
              <select
                value={rooms[selectedRoom].features[selectedFeature].texture || (rooms[selectedRoom].features[selectedFeature].type === 'door' ? doorTextures[0] : windowTextures[0])}
                onChange={(e) => handleFeatureTextureChange(e.target.value)}
                className="p-3 bg-gray-800/50 border border-gray-700 rounded-xl text-white focus:outline-none focus:ring-2 focus:ring-purple-500 transition-all duration-300"
              >
                {(rooms[selectedRoom].features[selectedFeature].type === 'door' ? doorTextures : windowTextures).map((texture, index) => (
                  <option key={index} value={texture}>
                    {`${rooms[selectedRoom].features[selectedFeature].type === 'door' ? 'Door' : 'Window'} Texture ${index + 1}`}
                  </option>
                ))}
              </select>
            </div>
          </div>
        )}

        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4 mb-8">
          <button onClick={handleDownload} className="p-3 bg-gradient-to-r from-blue-500 to-purple-500 rounded-xl text-white font-semibold hover:from-blue-600 hover:to-purple-600 transition-all duration-300 transform hover:scale-105 focus:outline-none focus:ring-2 focus:ring-purple-400 focus:ring-opacity-50">Download 3D Room</button>
          <button onClick={handleSave} className="p-3 bg-gradient-to-r from-green-500 to-teal-500 rounded-xl text-white font-semibold hover:from-green-600 hover:to-teal-600 transition-all duration-300 transform hover:scale-105 focus:outline-none focus:ring-2 focus:ring-green-400 focus:ring-opacity-50">Save Rooms</button>
          <button onClick={handleLoad} className="p-3 bg-gradient-to-r from-yellow-500 to-orange-500 rounded-xl text-white font-semibold hover:from-yellow-600 hover:to-orange-600 transition-all duration-300 transform hover:scale-105 focus:outline-none focus:ring-2 focus:ring-yellow-400 focus:ring-opacity-50">Load Rooms</button>
          <button onClick={addRoom} className="p-3 bg-gradient-to-r from-pink-500 to-red-500 rounded-xl text-white font-semibold hover:from-pink-600 hover:to-red-600 transition-all duration-300 transform hover:scale-105 focus:outline-none focus:ring-2 focus:ring-pink-400 focus:ring-opacity-50">Add Room</button>
          <button onClick={joinRooms} className="p-3 bg-gradient-to-r from-indigo-500 to-blue-500 rounded-xl text-white font-semibold hover:from-indigo-600 hover:to-blue-600 transition-all duration-300 transform hover:scale-105 focus:outline-none focus:ring-2 focus:ring-indigo-400 focus:ring-opacity-50">Join Rooms</button>
          <button onClick={() => {
            toggleView()
            setIsInternalView(!isInternalView)
          }} className="p-3 bg-gradient-to-r from-purple-500 to-pink-500 rounded-xl text-white font-semibold hover:from-purple-600 hover:to-pink-600 transition-all duration-300 transform hover:scale-105 focus:outline-none focus:ring-2 focus:ring-purple-400 focus:ring-opacity-50">
            {isInternalView ? 'External View' : 'Internal View'}
          </button>
          <button onClick={() => {
            toggleTopView()
            setIsTopView(!isTopView)
          }} className="p-3 bg-gradient-to-r from-teal-500 to-cyan-500 rounded-xl text-white font-semibold hover:from-teal-600 hover:to-cyan-600 transition-all duration-300 transform hover:scale-105 focus:outline-none focus:ring-2 focus:ring-teal-400  focus:ring-opacity-50">
            {isTopView ? 'Normal View' : 'Top View'}
          </button>
        </div>

        {selectedWall !== null && (
          <div className="mb-8 bg-white/5 p-6 rounded-2xl backdrop-blur-sm">
            <h3 className="text-xl font-semibold mb-4 text-purple-300">Wall Settings</h3>
            <div className="flex flex-wrap gap-4">
              <button onClick={() => addFeature('door')} className="p-3 bg-gradient-to-r from-amber-500 to-orange-500 rounded-xl text-white font-semibold hover:from-amber-600 hover:to-orange-600 transition-all duration-300 transform hover:scale-105 focus:outline-none focus:ring-2 focus:ring-amber-400 focus:ring-opacity-50">Add Door</button>
              <button onClick={() => addFeature('window')} className="p-3 bg-gradient-to-r from-sky-500 to-blue-500 rounded-xl text-white font-semibold hover:from-sky-600 hover:to-blue-600 transition-all duration-300 transform hover:scale-105 focus:outline-none focus:ring-2 focus:ring-sky-400 focus:ring-opacity-50">Add Window</button>
              <button onClick={addHallway} className="p-3 bg-gradient-to-r from-lime-500 to-green-500 rounded-xl text-white font-semibold hover:from-lime-600 hover:to-green-600 transition-all duration-300 transform hover:scale-105 focus:outline-none focus:ring-2 focus:ring-lime-400 focus:ring-opacity-50">Add Hallway</button>
              <input
                type="color"
                value={rooms[selectedRoom].wallColors[selectedWall]}
                onChange={(e) => handleColorChange(e.target.value)}
                className="w-12 h-12 rounded-xl border-2 border-white/20 cursor-pointer transition-all duration-300 hover:scale-110"
              />
              <input
                type="text"
                value={rooms[selectedRoom].wallColors[selectedWall]}
                onChange={(e) => handleColorChange(e.target.value)}
                placeholder="Hex color"
                className="p-3 bg-gray-800/50 border border-gray-700 rounded-xl text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-purple-500 transition-all duration-300"
              />
              <select
                value={rooms[selectedRoom].wallTextures[selectedWall]}
                onChange={(e) => handleTextureChange(e.target.value)}
                className="p-3 bg-gray-800/50 border border-gray-700 rounded-xl text-white focus:outline-none focus:ring-2 focus:ring-purple-500 transition-all duration-300"
              >
                {availableTextures.map((texture, index) => (
                  <option key={index} value={texture}>
                    {texture.split('/').pop().split('.')[0]}
                  </option>
                ))}
              </select>
            </div>
          </div>
        )}

        {selectedHallway !== null && (
          <div className="mb-8 bg-white/5 p-6 rounded-2xl backdrop-blur-sm">
            <h3 className="text-xl font-semibold mb-4 text-purple-300">Hallway Settings</h3>
            <div className="flex flex-wrap gap-4 mb-4">
              <input
                type="number"
                value={hallwayDimensions.width}
                onChange={(e) => handleHallwayResize('width', e.target.value)}
                placeholder="Width"
                step="0.1"
                className="p-3 bg-gray-800/50 border border-gray-700 rounded-xl text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-purple-500 transition-all duration-300"
              />
              <input
                type="number"
                value={hallwayDimensions.height}
                onChange={(e) => handleHallwayResize('height', e.target.value)}
                placeholder="Height"
                step="0.1"
                className="p-3 bg-gray-800/50 border border-gray-700 rounded-xl text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-purple-500 transition-all duration-300"
              />
            </div>
            <button onClick={confirmHallway} className="p-3 bg-gradient-to-r from-emerald-500 to-green-500 rounded-xl text-white font-semibold hover:from-emerald-600 hover:to-green-600 transition-all duration-300 transform hover:scale-105 focus:outline-none focus:ring-2 focus:ring-emerald-400 focus:ring-opacity-50">Confirm Hallway</button>
          </div>
        )}
      </div>
      </div>
      <div className="flex-grow relative min-h-screen bg-gradient-to-br from-gray-900 via-indigo-900 to-purple-900 p-4">
        <Canvas shadows className="w-full h-full rounded-3xl overflow-hidden border-4 border-purple-500/30">
          {isInternalView ? (
            <WalkingCamera
              initialPosition={cameraPosition}
              room={rooms[selectedRoom]}
            />
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
          <EnvironmentWrapper environment={environment} rooms={rooms} />
          {renderRooms()}
          {!isTopView && rooms.map((room, index) => (
            <group key={room.id} position={room.position}>
              <Room
                structure={room.structure}
                wallColors={room.wallColors}
                wallTextures={room.wallTextures}
                features={room.features}
                onFeatureMove={handleFeatureMove}
                onFeatureSelect={handleFeatureSelect}
                onWallClick={handleWallClick}
                selectedWall={selectedRoom === index ? selectedWall : null}
                realisticMode={realisticMode}
                roomIndex={index}
                selectedRoom={selectedRoom}
                wallThickness={wallThickness}
                modifiedWalls={room.modifiedWalls}
              />
            </group>
          ))}
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
                  wallTextures={room.wallTextures}
                  features={room.features.map((feature, featureIndex) => ({
                    ...feature,
                    onMove: (newPosition) => handleFeatureMove(featureIndex, newPosition),
                    onResize: (newDimensions) => handleFeatureResize(featureIndex, newDimensions),
                    onSelect: () => handleFeatureSelect(featureIndex),
                    selectedFeature: selectedFeature === featureIndex,
                  }))}
                  onWallClick={handleWallClick}
                  selectedWall={selectedRoom === index ? selectedWall : null}
                  realisticMode={realisticMode}
                  roomIndex={index}
                  selectedRoom={selectedRoom}
                  wallThickness={wallThickness}
                  modifiedWalls={room.modifiedWalls}
                />
              </group>
            ))
          )}
          {realisticMode && (
            <>
              <Sky sunPosition={[100, 100, 20]} />
              <Environment preset="sunset" />
              {memoizedRooms.map((room, index) => (
                room.features.filter(f => f.type === 'light').map((light, lightIndex) => (
                  <SpotLight
                    key={`${index}-${lightIndex}`}
                    position={[
                      room.position[0] + light.position[0],
                      room.position[1] + light.position[1],
                      room.position[2] + light.position[2]
                    ]}
                    angle={0.6}
                    penumbra={0.5}
                    intensity={light.intensity}
                    color={light.color}
                    castShadow
                  />
                ))
              ))}
            </>
          )}
        </Canvas>

        <AnimatePresence>
          {showNotification && (
            <motion.div
              initial={{ opacity: 0, y: -50 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -50 }}
              className="absolute top-4 right-4 bg-gradient-to-r from-green-400 to-blue-500 text-white p-3 rounded-lg shadow-lg"
            >
              {notification}
            </motion.div>
          )}
        </AnimatePresence>

        <AnimatePresence>
          {showSaveModal && (
            <Modal title="Save Project" onClose={() => setShowSaveModal(false)}>
              <input
                type="text"
                value={projectName}
                onChange={(e) => setProjectName(e.target.value)}
                placeholder="Enter project name"
                className="w-full px-4 py-2 bg-gray-800 text-white border border-gray-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500 transition-all duration-300"
              />
              <div className="flex justify-end space-x-2 mt-4">
                <Button onClick={() => setShowSaveModal(false)} variant="secondary">
                  Cancel
                </Button>
                <Button onClick={confirmSave} variant="primary">
                  Save
                </Button>
              </div>
            </Modal>
          )}
        </AnimatePresence>

        <AnimatePresence>
          {showLoadModal && (
            <Modal title="Load Project" onClose={() => setShowLoadModal(false)}>
              <ul className="max-h-60 overflow-y-auto space-y-2">
                {savedProjects.map((project) => (
                  <li key={project.id}>
                    <button
                      onClick={() => loadProject(project.id)}
                      className="w-full text-left px-4 py-2 bg-gray-800 hover:bg-gray-700 text-white rounded-lg transition-all duration-300"
                    >
                      {project.name}
                    </button>
                  </li>
                ))}
              </ul>
              <Button onClick={() => setShowLoadModal(false)} variant="secondary" className="mt-4">
                Cancel
              </Button>
            </Modal>
          )}
        </AnimatePresence>

        <AnimatePresence>
          {showUpgradeModal && (
            <Modal title="Upgrade to Premium" onClose={() => setShowUpgradeModal(false)}>
              <p className="text-gray-300 mb-4">
                Upgrade to Premium to save up to 5 rooms and enjoy additional features!
              </p>
              <div className="flex justify-end space-x-2">
                <Button onClick={() => setShowUpgradeModal(false)} variant="secondary">
                  Cancel
                </Button>
                <Button onClick={confirmUpgrade} variant="premium">
                  Upgrade
                </Button>
              </div>
            </Modal>
          )}
        </AnimatePresence>
      </div>
    </div>
  )
}

const Modal = ({ title, children, onClose }) => (
  <motion.div
    initial={{ opacity: 0 }}
    animate={{ opacity: 1 }}
    exit={{ opacity: 0 }}
    className="fixed inset-0 bg-black bg-opacity-50 backdrop-blur-sm flex items-center justify-center z-50"
  >
    <motion.div
      initial={{ scale: 0.9, y: 20 }}
      animate={{ scale: 1, y: 0 }}
      exit={{ scale: 0.9, y: 20 }}
      className="bg-gray-900 p-6 rounded-2xl shadow-2xl border border-purple-500/30 max-w-md w-full"
    >
      <h2 className="text-2xl font-bold mb-4 text-white">{title}</h2>
      {children}
    </motion.div>
  </motion.div>
)

const Button = ({ children, onClick, variant = 'primary', className = '' }) => {
  const baseStyle = "px-4 py-2 rounded-lg font-semibold transition-all duration-300 transform hover:scale-105 focus:outline-none focus:ring-2 focus:ring-opacity-50"
  const variants = {
    primary: "bg-gradient-to-r from-purple-500 to-indigo-600 text-white hover:from-purple-600 hover:to-indigo-700 focus:ring-purple-400",
    secondary: "bg-gray-700 text-white hover:bg-gray-600 focus:ring-gray-400",
    premium: "bg-gradient-to-r from-yellow-400 to-orange-500 text-gray-900 hover:from-yellow-500 hover:to-orange-600 focus:ring-yellow-400",
  }

  return (
    <button
      onClick={onClick}
      className={`${baseStyle} ${variants[variant]} ${className}`}
    >
      {children}
    </button>
  )
}