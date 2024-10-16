'use client'

import { useState, useEffect, useRef } from 'react'
import * as THREE from 'three'
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls'
import { TextGeometry } from 'three/examples/jsm/geometries/TextGeometry'
import { FontLoader } from 'three/examples/jsm/loaders/FontLoader'
import { GLTFExporter } from 'three/examples/jsm/exporters/GLTFExporter'

export default function CustomizableRoom() {
  const [prompt, setPrompt] = useState('')
  const [structure, setStructure] = useState(null)
  const [wallColors, setWallColors] = useState(Array(6).fill('#ADD8E6'))
  const [selectedWall, setSelectedWall] = useState(null)
  const [notification, setNotification] = useState('')
  const mountRef = useRef(null)
  const sceneRef = useRef(null)
  const cameraRef = useRef(null)
  const rendererRef = useRef(null)

  useEffect(() => {
    if (!structure) return

    // Three.js setup
    const scene = new THREE.Scene()
    const camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 1000)
    const renderer = new THREE.WebGLRenderer()

    renderer.setSize(window.innerWidth, window.innerHeight)
    mountRef.current.appendChild(renderer.domElement)

    // Add orbit controls
    const controls = new OrbitControls(camera, renderer.domElement)

    // Create structure
    const { width, height, depth } = structure
    const geometry = new THREE.BoxGeometry(width, height, depth)
    const edges = new THREE.EdgesGeometry(geometry)
    const line = new THREE.LineSegments(edges, new THREE.LineBasicMaterial({ color: 0x000000 }))
    scene.add(line)

    // Add colored sides
    const sides = [
      { pos: [0, 0, depth/2], rot: [0, 0, 0], scale: [width, height, 1] },
      { pos: [0, 0, -depth/2], rot: [0, 0, 0], scale: [width, height, 1] },
      { pos: [width/2, 0, 0], rot: [0, Math.PI/2, 0], scale: [depth, height, 1] },
      { pos: [-width/2, 0, 0], rot: [0, Math.PI/2, 0], scale: [depth, height, 1] },
      { pos: [0, height/2, 0], rot: [Math.PI/2, 0, 0], scale: [width, depth, 1] },
      { pos: [0, -height/2, 0], rot: [Math.PI/2, 0, 0], scale: [width, depth, 1] },
    ]

    sides.forEach((side, index) => {
      const sideGeometry = new THREE.PlaneGeometry(1, 1)
      const sideMaterial = new THREE.MeshBasicMaterial({ color: wallColors[index], transparent: true, opacity: 0.5, side: THREE.DoubleSide })
      const sideMesh = new THREE.Mesh(sideGeometry, sideMaterial)
      sideMesh.position.set(...side.pos)
      sideMesh.rotation.set(...side.rot)
      sideMesh.scale.set(...side.scale)
      sideMesh.userData = { wallIndex: index }
      scene.add(sideMesh)
    })

    // Add length labels
    const loader = new FontLoader()
    loader.load('/fonts/helvetiker_regular.typeface.json', function(font) {
      const labelMaterial = new THREE.MeshBasicMaterial({ color: 0x000000 })
      const labels = [
        { text: `${width.toFixed(2)}m`, position: [0, -height/2 - 0.5, 0], rotation: [-Math.PI/2, 0, 0] },
        { text: `${depth.toFixed(2)}m`, position: [width/2 + 0.5, -height/2 - 0.5, 0], rotation: [-Math.PI/2, 0, Math.PI/2] },
        { text: `${height.toFixed(2)}m`, position: [-width/2 - 0.5, 0, depth/2 + 0.5], rotation: [0, Math.PI/2, 0] },
      ]

      labels.forEach(label => {
        const textGeometry = new TextGeometry(label.text, {
          font: font,
          size: 0.5,
          height: 0.1,
        })
        const textMesh = new THREE.Mesh(textGeometry, labelMaterial)
        textMesh.position.set(...label.position)
        textMesh.rotation.set(...label.rotation)
        scene.add(textMesh)
      })
    })

    // Set camera position
    const maxDimension = Math.max(width, height, depth)
    camera.position.set(maxDimension * 1.5, maxDimension * 1.5, maxDimension * 1.5)
    controls.update()

    // Add fixed position measurements
    const axesHelper = new THREE.AxesHelper(5)
    scene.add(axesHelper)

    const measurementDiv = document.createElement('div')
    measurementDiv.style.position = 'absolute'
    measurementDiv.style.top = '10px'
    measurementDiv.style.left = '10px'
    measurementDiv.style.backgroundColor = 'rgba(0, 0, 0, 0.5)'
    measurementDiv.style.color = 'white'
    measurementDiv.style.padding = '10px'
    mountRef.current.appendChild(measurementDiv)

    // Raycaster for wall selection
    const raycaster = new THREE.Raycaster()
    const mouse = new THREE.Vector2()

    renderer.domElement.addEventListener('click', onMouseClick, false)

    function onMouseClick(event) {
      mouse.x = (event.clientX / window.innerWidth) * 2 - 1
      mouse.y = -(event.clientY / window.innerHeight) * 2 + 1

      raycaster.setFromCamera(mouse, camera)

      const intersects = raycaster.intersectObjects(scene.children)

      for (let i = 0; i < intersects.length; i++) {
        if (intersects[i].object.userData.wallIndex !== undefined) {
          setSelectedWall(intersects[i].object.userData.wallIndex)
          setNotification(`Wall ${intersects[i].object.userData.wallIndex + 1} selected`)
          setTimeout(() => setNotification(''), 2000)
          break
        }
      }
    }

    // Animation loop
    const animate = () => {
      requestAnimationFrame(animate)
      controls.update()
      renderer.render(scene, camera)

      // Update measurements
      const position = camera.position
      measurementDiv.innerHTML = `
        X: ${position.x.toFixed(2)}
        Y: ${position.y.toFixed(2)}
        Z: ${position.z.toFixed(2)}
      `
    }
    animate()

    // Store references
    sceneRef.current = scene
    cameraRef.current = camera
    rendererRef.current = renderer

    // Clean up
    return () => {
      mountRef.current.removeChild(renderer.domElement)
      mountRef.current.removeChild(measurementDiv)
      renderer.domElement.removeEventListener('click', onMouseClick, false)
    }
  }, [structure, wallColors])

  const handleSubmit = async (e) => {
    e.preventDefault()
    
    try {
      const response = await fetch('/api/generate', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ prompt }),
      })

      if (!response.ok) {
        throw new Error('Failed to generate structure')
      }

      const data = await response.json()
      setStructure(data)
    } catch (error) {
      console.error('Error:', error)
      alert('Failed to generate structure. Please try again.')
    }
  }

  const handleColorChange = (color) => {
    if (selectedWall !== null) {
      const newColors = [...wallColors]
      newColors[selectedWall] = color
      setWallColors(newColors)
    }
  }

  const handleDownload = () => {
    if (!sceneRef.current) return

    const exporter = new GLTFExporter()
    exporter.parse(
      sceneRef.current,
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

  const addFeature = (type) => {
    if (!sceneRef.current || !cameraRef.current || selectedWall === null) return

    const { width, height, depth } = structure
    const wallDimensions = [
      { width, height },
      { width, height },
      { depth, height },
      { depth, height },
      { width, depth },
      { width, depth },
    ]

    const currentWallDimensions = wallDimensions[selectedWall]
    const featureWidth = type === 'door' ? 1 : 1
    const featureHeight = type === 'door' ? 2 : 1

    const geometry = new THREE.PlaneGeometry(featureWidth, featureHeight)
    const material = new THREE.MeshBasicMaterial({ color: 0x8B4513, side: THREE.DoubleSide })
    const feature = new THREE.Mesh(geometry, material)

    // Position the feature on the selected wall
    const wallCenter = sceneRef.current.children.find(child => child.userData.wallIndex === selectedWall).position.clone()
    const wallRotation = sceneRef.current.children.find(child => child.userData.wallIndex === selectedWall).rotation.clone()

    feature.position.copy(wallCenter)
    feature.rotation.copy(wallRotation)

    // Adjust position to be slightly in front of the wall
    const normal = new THREE.Vector3(0, 0, 1)
    normal.applyEuler(wallRotation)
    feature.position.add(normal.multiplyScalar(0.01))

    sceneRef.current.add(feature)
    rendererRef.current.render(sceneRef.current, cameraRef.current)
  }

  return (
    <div className="flex flex-col h-screen">
      <div className="p-4 bg-gray-100">
        <form onSubmit={handleSubmit} className="flex gap-2">
          <input
            type="text"
            value={prompt}
            onChange={(e) => setPrompt(e.target.value)}
            placeholder="Describe the house or room..."
            className="flex-grow p-2 border rounded text-gray-900"
          />
          <button type="submit" className="px-4 py-2 bg-blue-500 text-white rounded">Generate</button>
        </form>
        {selectedWall !== null && (
          <div className="mt-2">
            <button onClick={() => addFeature('door')} className="px-4 py-2 bg-green-500 text-white rounded mr-2">Add Door</button>
            <button onClick={() => addFeature('window')} className="px-4 py-2 bg-green-500 text-white rounded">Add Window</button>
          </div>
        )}
        <div className="mt-2">
          <input 
            type="color" 
            value={selectedWall !== null ? wallColors[selectedWall] : '#ADD8E6'}
            onChange={(e) => handleColorChange(e.target.value)}
            className="mr-2"
          />
          <button onClick={handleDownload} className="px-4 py-2 bg-purple-500 text-white rounded">Download 3D Room</button>
        </div>
      </div>
      <div className="flex-grow relative">
        <div ref={mountRef} className="absolute inset-0" />
        {notification && (
          <div className="absolute top-4 right-4 bg-green-500 text-white p-2 rounded">
            {notification}
          </div>
        )}
      </div>
    </div>
  )
}