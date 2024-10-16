'use client'

import { useState, useEffect, useRef } from 'react'
import * as THREE from 'three'
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls'
import { TextGeometry } from 'three/examples/jsm/geometries/TextGeometry'
import { FontLoader } from 'three/examples/jsm/loaders/FontLoader'

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
    const { width, height, depth } = structure
    const geometry = new THREE.BoxGeometry(width, height, depth)
    const edges = new THREE.EdgesGeometry(geometry)
    const line = new THREE.LineSegments(edges, new THREE.LineBasicMaterial({ color: 0x000000 }))
    scene.add(line)

    // Add colored sides
    const sideMaterial = new THREE.MeshBasicMaterial({ color: 0xADD8E6, transparent: true, opacity: 0.5 })
    const sides = [
      { pos: [0, 0, depth/2], rot: [0, 0, 0], scale: [width, height, 1] },
      { pos: [0, 0, -depth/2], rot: [0, 0, 0], scale: [width, height, 1] },
      { pos: [width/2, 0, 0], rot: [0, Math.PI/2, 0], scale: [depth, height, 1] },
      { pos: [-width/2, 0, 0], rot: [0, Math.PI/2, 0], scale: [depth, height, 1] },
      { pos: [0, height/2, 0], rot: [Math.PI/2, 0, 0], scale: [width, depth, 1] },
      { pos: [0, -height/2, 0], rot: [Math.PI/2, 0, 0], scale: [width, depth, 1] },
    ]

    sides.forEach(side => {
      const sideGeometry = new THREE.PlaneGeometry(1, 1)
      const sideMesh = new THREE.Mesh(sideGeometry, sideMaterial)
      sideMesh.position.set(...side.pos)
      sideMesh.rotation.set(...side.rot)
      sideMesh.scale.set(...side.scale)
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
          className='text-gray-950'
        />
        <button type="submit">Generate</button>
      </form>
      <div ref={mountRef} style={{ width: '100%', height: '600px' }} />
    </div>
  )
}