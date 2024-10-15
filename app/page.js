'use client'


import { useState, useEffect, useRef } from 'react'
import * as THREE from 'three'
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls'

export default function Home() {
  const [prompt, setPrompt] = useState('')
  const [structure, setStructure] = useState(null)
  const mountRef = useRef(null)

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
    const geometry = new THREE.BoxGeometry(structure.width, structure.height, structure.depth)
    const material = new THREE.MeshBasicMaterial({ color: 0xcccccc, wireframe: true })
    const mesh = new THREE.Mesh(geometry, material)
    scene.add(mesh)

    // Add floor
    const floorGeometry = new THREE.PlaneGeometry(structure.width, structure.depth)
    const floorMaterial = new THREE.MeshBasicMaterial({ color: 0x666666, side: THREE.DoubleSide })
    const floor = new THREE.Mesh(floorGeometry, floorMaterial)
    floor.rotation.x = Math.PI / 2
    floor.position.y = -structure.height / 2
    scene.add(floor)

    camera.position.set(structure.width, structure.height, structure.depth * 2)
    controls.update()

    // Animation loop
    const animate = () => {
      requestAnimationFrame(animate)
      controls.update()
      renderer.render(scene, camera)
    }
    animate()

    // Clean up
    return () => {
      mountRef.current.removeChild(renderer.domElement)
    }
  }, [structure])

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

  return (
    <div>
      <form onSubmit={handleSubmit}>
        <input
          type="text"
          value={prompt}
          onChange={(e) => setPrompt(e.target.value)}
          placeholder="Describe the house or room..."
        />
        <button type="submit">Generate</button>
      </form>
      <div ref={mountRef} style={{ width: '100%', height: '600px' }} />
    </div>
  )
}