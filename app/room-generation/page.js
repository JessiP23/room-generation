'use client'

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
import { Crown, Sparkles, DollarSign, RotateCcw, ClipboardCheck, Mouse, Keyboard, Info, ChevronDown, ChevronRight, AppWindow, AppWindowIcon, DoorOpen, Link2, Download, Save, Upload, Plus, Layout, Box, Eye, PenTool, Layers } from 'lucide-react'
import { EnvironmentScene } from '../components/environments'
import { CSG } from 'three-csg-ts'
import { motion, AnimatePresence } from 'framer-motion'
import ButtonInstructions from '../components/ButtonInstructions'
import { saveAs } from 'file-saver'
import { CardElement, Elements, useElements, useStripe } from '@stripe/react-stripe-js'
import { loadStripe } from '@stripe/stripe-js'

// Room component
const Room = React.memo(({ 
  structure, wallColors, features, onFeatureMove, onWallClick, selectedWall, realisticMode, roomIndex, selectedRoom, wallTextures, onFeatureSelect, wallThickness, modifiedWalls, wallDesigns 
}) => {
  const { width, height, depth } = structure

  const sides = useMemo(() => [
    { pos: [0, 0, depth/2], rot: [0, 0, 0], scale: [width, height, wallThickness], size: [width, height] },
    { pos: [0, 0, -depth/2], rot: [0, 0, 0], scale: [width, height, wallThickness], size: [width, height] },
    { pos: [width/2, 0, 0], rot: [0, Math.PI/2, 0], scale: [depth, height, wallThickness], size: [depth, height] },
    { pos: [-width/2, 0, 0], rot: [0, Math.PI/2, 0], scale: [depth, height, wallThickness], size: [depth, height] },
    { pos: [0, height/2, 0], rot: [Math.PI/2, 0, 0], scale: [width, depth, wallThickness], size: [width, depth] },
    { pos: [0, -height/2, 0], rot: [Math.PI/2, 0, 0], scale: [width, depth, wallThickness], size: [width, depth] },
  ], [width, height, depth, wallThickness])

  const textureLoader = useMemo(() => new THREE.TextureLoader(), [])
  const loadedTextures = useMemo(() => wallTextures.map(texture => textureLoader.load(texture)), [wallTextures, textureLoader])

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
              {wallDesigns && wallDesigns[index] && (
                <Text
                  position={[0, 0, 0.01]}
                  fontSize={0.5}
                  color="#000000"
                  anchorX="center"
                  anchorY="middle"
                >
                  {wallDesigns[index]}
                </Text>
              )}
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
    depth: type === 'door' || type === 'window' ? wallThickness + 0.016 : wallThickness
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
        position={[position[0], position[1], 0]}
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

// WalkingCamera component
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
            camera.position.y += 0.5;
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

// EnvironmentWrapper component
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

const stripePromise = loadStripe('pk_live_51POkrBKqHeRNv81GpdjhZT418vSsp3oUqemp4dN9CPZ9r1zGnxZIYo3m6ByKjS7hW44sJCIiglukgVsiWOvNRT5S00Erl4Icpy')

const StripeCheckoutForm = ({ onSuccess }) => {
  const stripe = useStripe();
  const elements = useElements();
  const [isProcessing, setIsProcessing] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');

  const handleSubmit = async (event) => {
    event.preventDefault();
    setIsProcessing(true);
    setErrorMessage('');

    if (!stripe || !elements) {
      setIsProcessing(false);
      return;
    }

    const { error, paymentMethod } = await stripe.createPaymentMethod({
      type: 'card',
      card: elements.getElement(CardElement),
    });

    if (error) {
      console.log('[error]', error);
      setErrorMessage(error.message);
      setIsProcessing(false);
    } else {
      console.log('[PaymentMethod]', paymentMethod);
      // Here you would typically send the paymentMethod.id to your server
      // to complete the subscription process
      onSuccess();
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="bg-gray-800 p-4 rounded-lg">
        <h3 className="text-lg font-semibold text-white mb-2">Room Designer Pro</h3>
        <p className="text-gray-300">Upgrade to Premium for $9.99/month</p>
      </div>
      <div className="bg-gray-800 p-4 rounded-lg">
        <label className="block text-sm font-medium text-gray-300 mb-2">
          Card Information
        </label>
        <CardElement
          options={{
            style: {
              base: {
                fontSize: '16px',
                color: '#ffffff',
                '::placeholder': {
                  color: '#aab7c4',
                },
              },
              invalid: {
                color: '#fa755a',
                iconColor: '#fa755a',
              },
            },
          }}
          className="p-3 bg-gray-700 rounded-md"
        />
      </div>
      {errorMessage && (
        <div className="text-red-500 text-sm">{errorMessage}</div>
      )}
      <button
        type="submit"
        disabled={!stripe || isProcessing}
        className="w-full bg-gradient-to-r from-purple-500 to-indigo-600 text-white py-2 px-4 rounded-lg hover:from-purple-600 hover:to-indigo-700 transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
      >
        {isProcessing ? 'Processing...' : 'Subscribe Now'}
      </button>
    </form>
  );
};


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

  const [wallDesigns, setWallDesigns] = useState(Array(6).fill(''))

  const [wallStyle, setWallStyle] = useState('')
  const [openPanels, setOpenPanels] = useState({
    subscription: true,
    roomProperties: true,
    features: true,
    view: true,
    actions: true,
    wallSettings: true
  });

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

  const getTextureForStyle = useCallback((style) => {
    switch (style.toLowerCase()) {
      case 'brick':
        return '/brick_texture.jpg'
      case 'wood':
        return '/wood_texture.jpg'
      case 'stone':
        return '/stone_texture.jpg'
      case 'plaster':
        return '/plaster.jpg'
      default:
        return '/wall_texture.jpg'
    }
  }, [])

  const handleSubmit = useCallback(async (e) => {
    e.preventDefault()
    
    const newRooms = [...rooms]
    const currentRoom = newRooms[selectedRoom]

    // Update wall textures based on the input style
    const newTexture = getTextureForStyle(wallStyle)
    currentRoom.wallTextures = Array(6).fill(newTexture)

    setRooms(newRooms)
  }, [rooms, selectedRoom, wallStyle, getTextureForStyle])

  const handleWallDesignChange = useCallback((index, design) => {
    setWallDesigns(prev => {
      const newWallDesigns = [...prev]
      newWallDesigns[index] = design
      return newWallDesigns
    })
  }, [])

  const handleUpgrade = async () => {
    setShowUpgradeModal(true);
  };

  const confirmUpgrade = async () => {
    // This function will now be called after successful payment
    try {
      const userRef = doc(db, 'users', user.uid);
      await updateDoc(userRef, {
        subscription: 'premium'
      });
      setSubscription('premium');
      setNotification('Subscription upgraded to premium successfully');
      setShowUpgradeModal(false);
    } catch (error) {
      console.error('Error upgrading subscription:', error);
      setNotification('Error upgrading subscription');
    }
    setTimeout(() => setNotification(''), 2000);
  };


  // Initialize rooms state
  useEffect(() => {
    setRooms([
      {
        id: 1,
        prompt: '',
        structure: { width: 10, height: 8, depth: 10 },
        wallColors: Array(6).fill('#FFFFFF'),
        wallTextures: Array(6).fill('/wall_texture.jpg'),
        features: [],
        position: [0, 0, 0],
        wallThickness: 0.2,
        modifiedWalls: {}
      }
    ])
  }, [])

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

  const exportToBlender = async () => {
    const scene = new THREE.Scene()
    const textureLoader = new THREE.TextureLoader()

    // Function to load texture and return a promise
    const loadTexture = (url) => {
      return new Promise((resolve, reject) => {
        textureLoader.load(url, resolve, undefined, reject)
      })
    }

    try {
      // Add all rooms and their features to the scene
      for (const room of rooms) {
        const roomGroup = new THREE.Group()

        // Create room geometry
        const roomGeometry = new THREE.BoxGeometry(room.structure.width, room.structure.height, room.structure.depth)
        const roomTexture = await loadTexture(room.wallTextures[0])
        const roomMaterial = new THREE.MeshStandardMaterial({
          color: room.wallColors[0],
          map: roomTexture
        })
        const roomMesh = new THREE.Mesh(roomGeometry, roomMaterial)
        roomGroup.add(roomMesh)

        // Add features (doors, windows, etc.)
        for (const feature of room.features) {
          const featureGeometry = new THREE.BoxGeometry(
            feature.dimensions?.width || 1,
            feature.dimensions?.height || 1,
            feature.type === 'door' || feature.type === 'window' ? 0.1 : room.wallThickness
          )
          const featureTexture = feature.texture ? await loadTexture(feature.texture) : null
          const featureMaterial = new THREE.MeshStandardMaterial({
            color: feature.type === 'door' ? 0x8B4513 : 0x87CEEB,
            map: featureTexture
          })
          const featureMesh = new THREE.Mesh(featureGeometry, featureMaterial)
          featureMesh.position.set(...feature.position)
          roomGroup.add(featureMesh)
        }

        roomGroup.position.set(...room.position)
        scene.add(roomGroup)
      }

      // Export the scene
      const exporter = new GLTFExporter()
      exporter.parse(
        scene,
        (gltf) => {
          const output = JSON.stringify(gltf, null, 2)
          const blob = new Blob([output], { type: 'application/octet-stream' })
          saveAs(blob, 'room_design.gltf')
        },
        (error) => {
          console.error('Error exporting to GLTF:', error)
          setNotification('Error exporting to GLTF: ' + error.message)
        },
        { binary: false }
      )
    } catch (error) {
      console.error('Error preparing scene for export:', error)
      setNotification('Error preparing scene for export: ' + error.message)
    }
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

  const fetchSavedProjects = async (userId) => {
    const userRef = doc(db, 'users', userId)
    const roomsCollectionRef = collection(userRef, 'rooms')
    const querySnapshot = await getDocs(roomsCollectionRef)
    setSavedProjects(querySnapshot.docs.map(doc => ({ id: doc.id, name: doc.data().name })))
  }


  useEffect(() => {
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
  }, [realisticMode, rooms])

  const handleFeatureMove = useCallback((featureIndex, newPosition) => {
    const newRooms = [...rooms]
    if (newRooms[selectedRoom] && newRooms[selectedRoom].features[featureIndex]) {
      newRooms[selectedRoom].features[featureIndex].position = newPosition
      setRooms(newRooms)
    }
  }, [rooms, selectedRoom])

  const handleFeatureSelect = useCallback((featureIndex) => {
    setSelectedFeature(featureIndex)
  }, [])

  const handleWallClick = useCallback((roomIndex, wallIndex) => {
    setSelectedRoom(roomIndex)
    setSelectedWall(wallIndex)
    setNotification(`Room ${roomIndex + 1}, Wall ${wallIndex + 1} selected`)
    setTimeout(() => setNotification(''), 2000)
  }, [])

  const handleRoomMove = useCallback((index, newPosition) => {
    setRooms(prevRooms => {
      const newRooms = [...prevRooms]
      newRooms[index].position = newPosition
      return newRooms
    })
  }, [])
  

  const renderRooms = useCallback(() => {
    return !isTopView ? rooms.map((room, index) => (
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
          wallDesigns={wallDesigns}
        />
      </group>
    )) : rooms.map((room, index) => (
      <TopViewRoom
        key={room.id}
        structure={room.structure}
        position={room.position}
        onMove={(newPosition) => handleRoomMove(index, newPosition)}
        isSelected={index === selectedRoom}
        onSelect={() => setSelectedRoom(index)}
      />
    ))
  }, [isTopView, rooms, selectedRoom, selectedWall, realisticMode, wallThickness, handleFeatureMove, handleRoomMove, wallDesigns, handleFeatureSelect, handleWallClick])

  
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



  // const handleSubmit = async (e) => {
  //   e.preventDefault()
    
  //   const newRooms = [...rooms]
  //   newRooms[selectedRoom].structure = { 
  //     width: Math.random() * 10 + 5, 
  //     height: Math.random() * 5 + 3, 
  //     depth: Math.random() * 10 + 5 
  //   }
  //   setRooms(newRooms)
  // }

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
  

  const handleRoofStyleChange = (e) => {
    setSelectedRoofStyle(e.target.value);
  };

  const togglePanel = (panel) => {
    setOpenPanels(prev => ({ ...prev, [panel]: !prev[panel] }));
  };

  const PanelHeader = ({ title, isOpen, onClick, icon: Icon }) => (
    <div
      onClick={onClick}
      className="flex items-center gap-2 p-2 hover:bg-white/5 cursor-pointer rounded-lg transition-colors duration-200"
    >
      {isOpen ? <ChevronDown className="w-4 h-4" /> : <ChevronRight className="w-4 h-4" />}
      <Icon className="w-4 h-4" />
      <span className="font-medium">{title}</span>
    </div>
  );

  return (
    <div className="flex h-screen bg-gray-900">
      <FlowerMenu />
      <div className="w-1/5 min-w-[300px] bg-gradient-to-b from-gray-900 to-gray-800 border-r border-gray-700 overflow-y-auto shadow-xl">
        <div className="p-6 border-b border-gray-700/50 bg-gray-900/50">
        <h1 className="text-2xl font-bold bg-gradient-to-r from-blue-400 to-purple-400 bg-clip-text text-transparent">
          Room Designer
        </h1>
          
          {/* Subscription Badge */}
        <div className="mt-4 flex items-center gap-3 bg-gray-800/50 p-3 rounded-lg backdrop-blur-sm border border-gray-700/50">
          <div className={`p-1.5 rounded-full ${subscription === 'premium' ? 'bg-gradient-to-r from-yellow-400 to-amber-500' : 'bg-gray-700'}`}>
            {subscription === 'premium' ? (
              <Crown className="w-4 h-4 text-gray-900" />
            ) : (
              <div className="w-4 h-4 rounded-full bg-gray-600" />
            )}
          </div>
          <span className={`text-sm font-medium ${subscription === 'premium' ? 'text-amber-400' : 'text-gray-400'}`}>
            {subscription === 'premium' ? 'Premium' : 'Free'}
          </span>
          {subscription === 'free' && (
            <button onClick={handleUpgrade} className="ml-auto text-xs bg-gradient-to-r from-blue-500 to-purple-500 hover:from-blue-600 hover:to-purple-600 px-3 py-1.5 rounded-full font-medium transition-all duration-200 transform hover:scale-105">
              Upgrade
            </button>
          )}
          </div>
        </div>

        {/* Tools Sections */}
        <div className="p-4 space-y-6">
          {/* Room Structure Form */}
          <form onSubmit={handleSubmit} className="space-y-3">
          <div className="flex items-center justify-between">
            <h2 className="text-sm font-semibold text-gray-300 uppercase tracking-wider">Room Structure</h2>
            <div className="h-px flex-1 bg-gradient-to-r from-transparent via-gray-700 to-transparent ml-4" />
          </div>
          <div className="space-y-3">
            <div className="flex gap-2">
              <input
                type="text"
                value={wallStyle}
                onChange={(e) => setWallStyle(e.target.value)}
                placeholder="Wall style"
                className="flex-1 bg-gray-800/50 border border-gray-700/50 rounded-lg px-4 py-2.5 text-sm text-gray-300 placeholder-gray-500 focus:border-blue-500/50 focus:ring-2 focus:ring-blue-500/20 transition-all duration-200"
              />
              <button 
                type="submit"
                className="bg-gradient-to-r from-blue-500 to-purple-500 hover:from-blue-600 hover:to-purple-600 px-4 py-2.5 rounded-lg text-sm font-medium text-white shadow-lg shadow-blue-500/20 transition-all duration-200 transform hover:scale-105"
              >
                Apply
              </button>
            </div>
            
            <div className="grid grid-cols-2 gap-3">
              {['Width', 'Height', 'Depth', 'Wall Thickness'].map((label, index) => (
                <div key={label} className="relative">
                  <input
                    type="number"
                    value={index === 3 ? wallThickness : rooms[selectedRoom].structure[label.toLowerCase()]}
                    onChange={(e) => index === 3 ? handleWallThicknessChange(e) : handleDimensionChange(label.toLowerCase(), e.target.value)}
                    step={index === 3 ? "0.1" : "1"}
                    className="w-full bg-gray-800/50 border border-gray-700/50 rounded-lg px-4 py-2.5 text-sm text-gray-300 placeholder-gray-500 focus:border-blue-500/50 focus:ring-2 focus:ring-blue-500/20 transition-all duration-200"
                  />
                  <span className="absolute -top-2 left-3 px-2 text-xs font-medium text-gray-400 bg-gray-800">
                    {label}
                  </span>
                </div>
              ))}
            </div>
          </div>
          </form>

          {/* Environment Settings */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <h2 className="text-sm font-semibold text-gray-300 uppercase tracking-wider">Environment</h2>
              <div className="h-px flex-1 bg-gradient-to-r from-transparent via-gray-700 to-transparent ml-4" />
            </div>
            <div className="space-y-3">
            <div className="bg-gray-800/50 p-3 rounded-lg border border-gray-700/50">
              <label className="flex items-center cursor-pointer">
                <input
                  type="checkbox"
                  checked={realisticMode}
                  onChange={(e) => setRealisticMode(e.target.checked)}
                  className="sr-only peer"
                />
                <div className="relative w-11 h-6 bg-gray-700 peer-focus:ring-4 peer-focus:ring-purple-500/20 rounded-full peer peer-checked:after:translate-x-full after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-gradient-to-r peer-checked:from-blue-500 peer-checked:to-purple-500"></div>
                <span className="ml-3 text-sm font-medium text-gray-300">Realistic Mode</span>
              </label>
            </div>
            
            <select
              id="environment"
              value={environment}
              onChange={handleEnvironmentChange}
              className="w-full bg-gray-800/50 border border-gray-700/50 rounded-lg px-4 py-2.5 text-sm text-gray-300 focus:border-blue-500/50 focus:ring-2 focus:ring-blue-500/20 transition-all duration-200"
            >
              <option value="forest">Forest</option>
              <option value="city">City</option>
              <option value="desert">Desert</option>
              <option value="snow">Snow</option>
            </select>
          </div>
        </div>

          {/* Feature Settings */}
          {selectedFeature !== null && rooms[selectedRoom] && rooms[selectedRoom].features[selectedFeature] && (
  <div className="space-y-4">
    <div className="flex items-center justify-between">
      <h2 className="text-sm font-semibold text-gray-300 uppercase tracking-wider">Feature Settings</h2>
      <div className="h-px flex-1 bg-gradient-to-r from-transparent via-gray-700 to-transparent ml-4" />
    </div>
    <div className="space-y-3">
      <div className="relative">
        <input
          type="number"
          value={rooms[selectedRoom].features[selectedFeature].dimensions?.width || 1}
          onChange={(e) => handleFeatureResize('width', e.target.value)}
          step="0.1"
          className="w-full bg-gray-800/50 border border-gray-700/50 rounded-lg px-4 py-2.5 text-sm text-gray-300 placeholder-gray-500 focus:border-blue-500/50 focus:ring-2 focus:ring-blue-500/20 transition-all duration-200"
        />
        <span className="absolute -top-2 left-3 px-2 text-xs font-medium text-gray-400 bg-gray-800">
          Width
        </span>
      </div>
      <div className="relative">
        <input
          type="number"
          value={rooms[selectedRoom].features[selectedFeature].dimensions?.height || (rooms[selectedRoom].features[selectedFeature].type === 'door' ? 2 : 1)}
          onChange={(e) => handleFeatureResize('height', e.target.value)}
          step="0.1"
          className="w-full bg-gray-800/50 border border-gray-700/50 rounded-lg px-4 py-2.5 text-sm text-gray-300 placeholder-gray-500 focus:border-blue-500/50 focus:ring-2 focus:ring-blue-500/20 transition-all duration-200"
        />
        <span className="absolute -top-2 left-3 px-2 text-xs font-medium text-gray-400 bg-gray-800">
          Height
        </span>
      </div>
      <select
        value={rooms[selectedRoom].features[selectedFeature].texture || (rooms[selectedRoom].features[selectedFeature].type === 'door' ? doorTextures[0] : windowTextures[0])}
        onChange={(e) => handleFeatureTextureChange(e.target.value)}
        className="w-full bg-gray-800/50 border border-gray-700/50 rounded-lg px-4 py-2.5 text-sm text-gray-300 focus:border-blue-500/50 focus:ring-2 focus:ring-blue-500/20 transition-all duration-200"
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

          {/* Wall Settings */}
          {selectedWall !== null && (
            <div className="space-y-3">
              <h2 className="text-sm font-semibold text-gray-400 uppercase">Wall Settings</h2>
              <div className="space-y-2">
                <div className="grid grid-cols-2 gap-2">
                  <button onClick={() => addFeature('door')} className="bg-gray-700 hover:bg-gray-600 px-3 py-2 rounded text-sm text-gray-300">
                    Add Door
                  </button>
                  <button onClick={() => addFeature('window')} className="bg-gray-700 hover:bg-gray-600 px-3 py-2 rounded text-sm text-gray-300">
                    Add Window
                  </button>
                </div>
                <button onClick={addHallway} className="w-full bg-gray-700 hover:bg-gray-600 px-3 py-2 rounded text-sm text-gray-300">
                  Add Hallway
                </button>
                <div className="flex gap-2">
                  <input
                    type="color"
                    value={rooms[selectedRoom].wallColors[selectedWall]}
                    onChange={(e) => handleColorChange(e.target.value)}
                    className="w-10 h-10 rounded bg-gray-900 border border-gray-700"
                  />
                  <input
                    type="text"
                    value={rooms[selectedRoom].wallColors[selectedWall]}
                    onChange={(e) => handleColorChange(e.target.value)}
                    placeholder="Hex color"
                    className="flex-1 bg-gray-900 border border-gray-700 rounded px-3 py-2 text-sm text-gray-300"
                  />
                </div>
                <select
                  value={rooms[selectedRoom].wallTextures[selectedWall]}
                  onChange={(e) => handleTextureChange(e.target.value)}
                  className="w-full bg-gray-900 border border-gray-700 rounded px-3 py-2 text-sm text-gray-300"
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

          {/* Hallway Settings */}
{selectedHallway !== null && (
  <div className="space-y-4">
    <div className="flex items-center justify-between">
      <h2 className="text-sm font-semibold text-gray-300 uppercase tracking-wider">Hallway Settings</h2>
      <div className="h-px flex-1 bg-gradient-to-r from-transparent via-gray-700 to-transparent ml-4" />
    </div>
    <div className="space-y-3">
      <div className="relative">
        <input
          type="number"
          value={hallwayDimensions.width}
          onChange={(e) => handleHallwayResize('width', e.target.value)}
          step="0.1"
          className="w-full bg-gray-800/50 border border-gray-700/50 rounded-lg px-4 py-2.5 text-sm text-gray-300 placeholder-gray-500 focus:border-blue-500/50 focus:ring-2 focus:ring-blue-500/20 transition-all duration-200"
        />
        <span className="absolute -top-2 left-3 px-2 text-xs font-medium text-gray-400 bg-gray-800">
          Width
        </span>
      </div>
      <div className="relative">
        <input
          type="number"
          value={hallwayDimensions.height}
          onChange={(e) => handleHallwayResize('height', e.target.value)}
          step="0.1"
          className="w-full bg-gray-800/50 border border-gray-700/50 rounded-lg px-4 py-2.5 text-sm text-gray-300 placeholder-gray-500 focus:border-blue-500/50 focus:ring-2 focus:ring-blue-500/20 transition-all duration-200"
        />
        <span className="absolute -top-2 left-3 px-2 text-xs font-medium text-gray-400 bg-gray-800">
          Height
        </span>
      </div>
      <button 
        onClick={confirmHallway} 
        className="w-full bg-gradient-to-r from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700 px-4 py-2.5 rounded-lg text-sm font-medium text-white shadow-lg shadow-blue-500/20 transition-all duration-200 transform hover:scale-105"
      >
        Confirm Hallway
      </button>
    </div>
  </div>
)}


          {/* Action Buttons */}
          <div className="space-y-2">
          <div className="flex items-center justify-between">
            <h2 className="text-sm font-semibold text-gray-300 uppercase tracking-wider">Actions</h2>
            <div className="h-px flex-1 bg-gradient-to-r from-transparent via-gray-700 to-transparent ml-4" />
            {/* actions */}
          </div>
          <div className="grid grid-cols-2 gap-3">
            <button onClick={handleDownload} className="bg-gradient-to-r from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700 px-4 py-2.5 rounded-lg text-sm font-medium text-white shadow-lg shadow-blue-500/20 transition-all duration-200 transform hover:scale-105">
              Download
            </button>
            <button onClick={handleSave} className="bg-gradient-to-r from-green-500 to-emerald-600 hover:from-green-600 hover:to-emerald-700 px-4 py-2.5 rounded-lg text-sm font-medium text-white shadow-lg shadow-green-500/20 transition-all duration-200 transform hover:scale-105">
              Save
            </button>
            <button onClick={handleLoad} className="bg-gradient-to-r from-amber-500 to-yellow-600 hover:from-amber-600 hover:to-yellow-700 px-4 py-2.5 rounded-lg text-sm font-medium text-white shadow-lg shadow-amber-500/20 transition-all duration-200 transform hover:scale-105">
              Load
            </button>
            <button onClick={addRoom} className="bg-gradient-to-r from-purple-500 to-pink-600 hover:from-purple-600 hover:to-pink-700 px-4 py-2.5 rounded-lg text-sm font-medium text-white shadow-lg shadow-purple-500/20 transition-all duration-200 transform hover:scale-105">
              Add Room
            </button>
          </div>
          <button onClick={joinRooms} className="w-full bg-gradient-to-r from-indigo-500 to-purple-600 hover:from-indigo-600 hover:to-purple-700 px-4 py-2.5 rounded-lg text-sm font-medium text-white shadow-lg shadow-indigo-500/20 transition-all duration-200 transform hover:scale-105">
            Join Rooms
          </button>
          <button
            onClick={exportToBlender}
            className="bg-gradient-to-r from-orange-500 to-red-600 hover:from-orange-600 hover:to-red-700 px-4 py-2.5 rounded-lg text-sm font-medium text-white shadow-lg shadow-orange-500/20 transition-all duration-200 transform hover:scale-105"
          >
            Export to Blender
          </button>
          <div className="grid grid-cols-2 gap-3">
            <button
              onClick={() => {
                toggleView()
                setIsInternalView(!isInternalView)
              }}
              className="bg-gray-700 hover:bg-gray-600 px-4 py-2.5 rounded-lg text-sm font-medium text-gray-300 border border-gray-600/50 transition-all duration-200 transform hover:scale-105"
            >
              {isInternalView ? 'External' : 'Internal'}
            </button>
            <button
              onClick={() => {
                toggleTopView()
                setIsTopView(!isTopView)
              }}
              className="bg-gray-700 hover:bg-gray-600 px-4 py-2.5 rounded-lg text-sm font-medium text-gray-300 border border-gray-600/50 transition-all duration-200 transform hover:scale-105"
            >
              {isTopView ? 'Normal' : 'Top'}
            </button>
          </div>
          </div>
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
                modifiedWalls={room.modifiedWalls} wallDesigns={wallDesigns}
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
        {/* button */}
        <ButtonInstructions isInternalView={isInternalView} isTopView={isTopView} />

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
            <Elements stripe={stripePromise}>
              <StripeCheckoutForm onSuccess={confirmUpgrade} />
            </Elements>
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

const Button = React.memo(({ children, onClick, variant = 'primary', className = '' }) => {
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
})