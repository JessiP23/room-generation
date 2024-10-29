'use client'

import React, {useState, useEffect, useRef, useCallback, use} from 'react';
import { Book, Box, Camera, Check, ChevronDown, ChevronRight, Cloud, Code, Coffee, CoffeeIcon, Compass, Crown, DollarSign, Flower, Gift, Heart, HeartHandshake, Layers, Layout, Moon, Search, Share, Sparkles, Star, Sun, User, X, Zap } from 'lucide-react';
import * as THREE from 'three';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls';
import { useRouter } from 'next/navigation';

const STRIPE_DONATION_URL = 'https://buy.stripe.com/9AQcQn0Mc4u29fqbIJ'

// interactive
const InteractiveStructure = () => {
  const mountRef = useRef(null);
  const [isRotating, setIsRotating] = useState(false);
  const sceneRef = useRef(null);
  const roomRef = useRef(null);

  /// useeffect for the is rotating object in motion with an horizontal motion. 
  useEffect(() => {
    // Scene setup
    const scene = new THREE.Scene()
    sceneRef.current = scene
    const camera = new THREE.PerspectiveCamera(75, mountRef.current.clientWidth / mountRef.current.clientHeight, 0.1, 1000)
    const renderer = new THREE.WebGLRenderer({ antialias: true })
    
    renderer.setSize(mountRef.current.clientWidth, mountRef.current.clientHeight)
    mountRef.current.appendChild(renderer.domElement)

    // Room creation
    const roomGeometry = new THREE.BoxGeometry(5, 4, 5)
    const roomMaterial = new THREE.MeshPhongMaterial({ color: 0xffffff, side: THREE.BackSide })
    const room = new THREE.Mesh(roomGeometry, roomMaterial)
    roomRef.current = room
    scene.add(room)

    // Furniture
    const tableGeometry = new THREE.BoxGeometry(2, 0.1, 1)
    const tableMaterial = new THREE.MeshPhongMaterial({ color: 0x8b4513 })
    const table = new THREE.Mesh(tableGeometry, tableMaterial)
    table.position.set(0, -1.5, 0)
    scene.add(table)

    const chairGeometry = new THREE.BoxGeometry(0.5, 0.5, 0.5)
    const chairMaterial = new THREE.MeshPhongMaterial({ color: 0x4a4a4a })
    const chair = new THREE.Mesh(chairGeometry, chairMaterial)
    chair.position.set(-1, -1.75, 0)
    scene.add(chair)

    // Lighting
    const ambientLight = new THREE.AmbientLight(0xffffff, 0.5)
    scene.add(ambientLight)

    const pointLight = new THREE.PointLight(0xffffff, 1)
    pointLight.position.set(0, 2, 0)
    scene.add(pointLight)

    camera.position.z = 5

    // OrbitControls setup
    const controls = new OrbitControls(camera, renderer.domElement)
    controls.enableDamping = true
    controls.dampingFactor = 0.25
    controls.enableZoom = false

    // Animation
    const animate = () => {
      requestAnimationFrame(animate)
      if (isRotating && roomRef.current) {
        roomRef.current.rotation.y += 0.005
      }
      controls.update()
      renderer.render(scene, camera)
    }

    animate()

    // Cleanup
    return () => {
      if (mountRef.current) {
        mountRef.current.removeChild(renderer.domElement)
      }
    }
  }, [isRotating])

  // handle rotation toggle for the rotating objec tin the main page.
  const handleRotationToggle = () => {
    setIsRotating(!isRotating)
  }

  return (
    <div className="relative">
      <div ref={mountRef} className="min-w-full h-96 rounded-xl shadow-2xl" />
      <button
        className="absolute bottom-4 right-4 bg-white text-gray-800 px-4 py-2 rounded-full shadow-md hover:bg-gray-100 transition-colors duration-300"
        onClick={handleRotationToggle}
      >
        {isRotating ? 'Stop Rotation' : 'Start Rotation'}
      </button>
    </div>
  )
}


const DonationSection = () => {
  const [isHovering, setIsHovering] = useState(false);
  const router = useRouter();

  useEffect(() => {
    // Check if router.query is defined and has the payment_status property
    if (router.query && router.query.payment_status) {
      const { payment_status } = router.query;
      if (payment_status === 'paid') {
        alert('Thank you for your donation!');
      }
    }
    // remove the query params
    router.replace('/', undefined, { shallow: true });
  }, [router.query]);

  const handleDonateClick = () => {
    window.location.href = STRIPE_DONATION_URL;
  }

  return (
    <section className="py-20 bg-gradient-to-b from-white to-indigo-50 overflow-hidden">
      <div className="container mx-auto px-4 sm:px-6 md:px-8">
        
        <div className="max-w-4xl mx-auto p-6 sm:p-8 md:p-10">
          <div 
            className="relative group"
            onMouseEnter={() => setIsHovering(true)}
            onMouseLeave={() => setIsHovering(false)}
          >
            <div className="absolute inset-0 bg-gradient-to-r from-pink-400 via-purple-400 to-indigo-400 rounded-3xl opacity-75 blur-xl group-hover:opacity-100 transition-all duration-500 animate-pulse" />
            
            <div className="relative bg-white rounded-2xl shadow-xl p-2">
              <InteractiveStructure />
              
              <div className="mt-8 sm:mt-10 md:mt-12 text-center">
                <p className="text-xl sm:text-2xl md:text-3xl text-gray-700 mb-6">Your support helps us continue creating innovative 3D architectural solutions.</p>
                <button
                  onClick={handleDonateClick}
                  className="py-3 px-8 sm:py-4 sm:px-10 md:py-5 md:px-12 text-xl sm:text-2xl md:text-3xl font-bold bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600 text-white transition-all duration-300 transform hover:scale-105 rounded-xl shadow-xl relative overflow-hidden"
                >
                  <div className="relative z-10 flex items-center justify-center gap-3">
                    <HeartHandshake 
                      className={`w-6 sm:w-7 md:w-8 h-6 sm:h-7 md:h-8 transition-transform duration-300 ${
                        isHovering ? 'scale-125' : ''
                      }`}
                    />
                    Donate Now
                  </div>
                  <div className="absolute inset-0 bg-gradient-to-r from-purple-600/50 to-pink-600/50 animate-shine" />
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};


const InteractiveRoom = () => {
  const [rotation, setRotation] = useState({ x: 0, y: 0 });
  const [isDragging, setIsDragging] = useState(false);
  const [startPosition, setStartPosition] = useState({ x: 0, y: 0 });
  const roomRef = useRef(null);
  const animationRef = useRef(null);

  const handleMouseDown = (e) => {
    setIsDragging(true);
    setStartPosition({ x: e.clientX, y: e.clientY });
  };

  const handleMouseMove = useCallback((e) => {
    if (!isDragging) return;
    const deltaX = e.clientX - startPosition.x;
    const deltaY = e.clientY - startPosition.y;
    setRotation(prev => ({
      x: prev.x + deltaY * 0.5,
      y: prev.y - deltaX * 0.5
    }));
    setStartPosition({ x: e.clientX, y: e.clientY });
  }, [isDragging, startPosition]);

  const handleMouseUp = useCallback(() => {
    setIsDragging(false);
  }, []);

  useEffect(() => {
    document.addEventListener('mousemove', handleMouseMove);
    document.addEventListener('mouseup', handleMouseUp);
    return () => {
      document.removeEventListener('mousemove', handleMouseMove);
      document.removeEventListener('mouseup', handleMouseUp);
    };
  }, [handleMouseMove, handleMouseUp]);

  useEffect(() => {
    const autoRotate = () => {
      setRotation(prev => ({
        x: prev.x,
        y: (prev.y + 0.2) % 360
      }));
      animationRef.current = requestAnimationFrame(autoRotate);
    };
    autoRotate();
    return () => {
      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current);
      }
    };
  }, []);

  return (
    <div className="relative w-full h-64 md:h-96 bg-gray-100 rounded-lg overflow-hidden" ref={roomRef}>
      <div 
        className="absolute inset-0 flex items-center justify-center cursor-move"
        style={{ 
          transform: `perspective(1000px) rotateX(${rotation.x}deg) rotateY(${rotation.y}deg)`,
          transition: isDragging ? 'none' : 'transform 0.1s ease-out'
        }}
        onMouseDown={handleMouseDown}
      >
        <div className="w-64 h-64 border-4 border-indigo-600 bg-white bg-opacity-20" />
        <div className="absolute top-0 left-0 right-0 h-1 bg-indigo-600" />
        <div className="absolute bottom-0 left-0 right-0 h-1 bg-indigo-600" />
        <div className="absolute top-0 left-0 bottom-0 w-1 bg-indigo-600" />
        <div className="absolute top-0 right-0 bottom-0 w-1 bg-indigo-600" />
        {/* Adding some interior elements for better 3D effect */}
        <div className="absolute top-1/4 left-1/4 w-32 h-32 border-2 border-indigo-400 bg-indigo-100 bg-opacity-30" />
        <div className="absolute bottom-1/4 right-1/4 w-24 h-24 border-2 border-purple-400 bg-purple-100 bg-opacity-30" />
      </div>
      <div className="absolute bottom-4 left-4 bg-white bg-opacity-75 rounded p-2">
        <p className="text-sm text-indigo-600">Click and drag to interact</p>
      </div>
    </div>
  );
};

const LandingPage = () => {
  const [isDaytime, setIsDaytime] = useState(true);
  const [rotationX, setRotationX] = useState(0);
  const [rotationY, setRotationY] = useState(0);
  const [isOpen, setIsOpen] = useState(false);
  const [isHovering, setIsHovering] = useState(false);
  const mountRef = useRef(null);
  const sceneRef = useRef(null);
  const cameraRef = useRef(null);
  const rendererRef = useRef(null);
  const controlsRef = useRef(null);

  useEffect(() => {
    const handleMouseMove = (e) => {
      const { clientX, clientY } = e;
      const { innerWidth, innerHeight } = window;
      const x = (clientX / innerWidth - 0.5) * 20;
      const y = (clientY / innerHeight - 0.5) * -20;
      setRotationX(y);
      setRotationY(x);
    };
    window.addEventListener('mousemove', handleMouseMove);
    return () => window.removeEventListener('mousemove', handleMouseMove);
  }, []);

  const toggleDayNight = () => setIsDaytime(!isDaytime);

  return (
    <div className="min-h-screen bg-gradient-to-b from-purple-400 to-pink-300">
      <nav className=" p-4 relative z-50">
      <div className="container mx-auto">
        <div className="flex justify-between items-center">
          <div className="flex items-center">
            <div className="w-8 h-8 bg-white rounded-full mr-2"></div>
            <span className="text-white font-bold">LOGO</span>
          </div>
          
          {/* Large screen menu */}
          <div className="hidden lg:flex space-x-4 text-white">
            <a href="/room-generation" className="hover:underline">Get started</a>
            <a href="/contact-us" className="hover:underline">Contact us</a>
            <a href="/about-us" className="hover:underline">About us</a>
            <a href="#" className="hover:underline">Portfolio</a>
          </div>
          
          <div className="hidden lg:flex space-x-2 text-white">
            <Search size={20} />
            <Share size={20} />
            <User size={20} />
          </div>
          
          {/* Medium and small screen toggle */}
          <button
            className="lg:hidden text-white flex items-center"
            onClick={() => setIsOpen(!isOpen)}
          >
            {isOpen ? (
              <X size={24} />
            ) : (
              <>
                Menu <ChevronDown className="ml-1" />
              </>
            )}
          </button>
        </div>
        
        {/* Compact overlay menu for medium and small screens */}
        {isOpen && (
          <div className="lg:hidden absolute top-full left-0 right-0 bg-purple-900 bg-opacity-95 shadow-lg z-50 max-h-[calc(100vh-4rem)] overflow-y-auto">
            {/* get started data pipeline */}
            <div className="p-4 space-y-4">
              <a href="/room-generation" className="block text-white hover:text-indigo-300 transition-colors duration-200">Get started</a>
              <a href="/contact-us" className="block text-white hover:text-indigo-300 transition-colors duration-200">Contact us</a>
              <a href="/about-us" className="block text-white hover:text-indigo-300 transition-colors duration-200">About us</a>
              <a href="#" className="block text-white hover:text-indigo-300 transition-colors duration-200">Portfolio</a>
            </div>
            <div className="bg-purple-800 bg-opacity-50 p-4 flex justify-around">
              <Search size={20} className="text-white hover:text-indigo-300 transition-colors duration-200" />
              <Share size={20} className="text-white hover:text-indigo-300 transition-colors duration-200" />
              <User size={20} className="text-white hover:text-indigo-300 transition-colors duration-200" />
            </div>
          </div>
        )}
      </div>
    </nav>
      
      <main className="flex flex-col md:flex-row items-center justify-between px-4 md:px-12 lg:px-20 py-8 md:py-16 bg-gradient-to-b from-purple-400 to-pink-300 min-h-screen">
      <div className="w-full md:w-1/2 mb-8 md:mb-0">
        <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold text-white mb-4 animate-fade-in-down">
          Generation of 3D rooms/building
        </h1>
        <p className="text-white mb-8 text-lg animate-fade-in-up">
          Generate your 3D rooms and building with a few clicks. Take a look at our live demo.
        </p>
        <div className="flex flex-col sm:flex-row justify-center items-center space-y-4 sm:space-y-0 sm:space-x-6 my-8">
          <a
            href='/room-generation'
            className="w-full sm:w-auto bg-gradient-to-r from-purple-500 to-indigo-600 text-white px-8 py-3 rounded-full font-bold hover:from-purple-600 hover:to-indigo-700 transition-all duration-300 shadow-lg hover:shadow-xl transform hover:-translate-y-1 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:ring-opacity-50 flex items-center justify-center"
          >
            <Camera className="mr-2" size={20} />
            Room Generation
          </a>
          {/* 
          <a
            href='/building-generator'
            className="w-full sm:w-auto bg-white text-purple-600 px-8 py-3 rounded-full font-bold hover:bg-purple-100 transition-all duration-300 shadow-lg hover:shadow-xl transform hover:-translate-y-1 border-2 border-purple-500 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:ring-opacity-50 flex items-center justify-center"
          >
            <Layers className="mr-2" size={20} />
            Building Generation
          </a>
          */}
        </div>
      </div>
      
      <div className="relative w-full md:w-1/2 h-96 md:h-[450px] lg:h-[500px] animate-float">
        <div className="absolute inset-0 bg-gradient-to-br from-gray-200 to-gray-300 rounded-lg shadow-2xl overflow-hidden transform rotate-3 transition-all duration-300 hover:rotate-0">
          <div className="absolute inset-0 bg-gradient-to-b from-gray-200 to-gray-300"></div>
          
          {/* Window */}
          <div className="absolute top-4 left-4 w-32 h-40 bg-blue-200 rounded-t-lg border-4 border-white">
            <div className="absolute inset-0 bg-gradient-to-b from-blue-300 to-blue-100 opacity-50"></div>
            <div className="absolute top-1/2 left-0 w-full h-px bg-white"></div>
            <div className="absolute top-0 left-1/2 w-px h-full bg-white"></div>
          </div>
          
          {/* Desk */}
          <div className="absolute bottom-0 left-0 right-0 h-24 bg-yellow-800">
            <div className="absolute top-0 left-0 right-0 h-2 bg-yellow-900"></div>
          </div>
          
          {/* Chair */}
          <div className="absolute bottom-8 right-8 w-20 h-28">
            <div className="absolute bottom-0 w-full h-4 bg-gray-700 rounded-full"></div>
            <div className="absolute bottom-4 left-2 right-2 h-12 bg-gray-600 rounded-t-lg"></div>
            <div className="absolute top-0 left-4 right-4 h-12 bg-gray-500 rounded-t-lg"></div>
          </div>
          
          {/* Plant */}
          <div className="absolute bottom-24 left-4 w-16 h-24">
            <div className="absolute bottom-0 w-full h-6 bg-green-800 rounded-full"></div>
            <div className="absolute bottom-4 left-1/2 transform -translate-x-1/2 w-1 h-16 bg-green-700"></div>
            <div className="absolute top-0 left-1/2 transform -translate-x-1/2 w-12 h-8 bg-green-500 rounded-full animate-pulse"></div>
          </div>
          
          {/* Floating elements */}
          <div className="absolute top-8 right-8 w-8 h-8 bg-purple-400 rounded-full animate-bounce"></div>
          <div className="absolute top-24 right-16 w-6 h-6 bg-pink-400 rounded-full animate-ping"></div>
          <div className="absolute top-40 right-24 w-4 h-4 bg-yellow-400 rounded-full animate-pulse"></div>
          
          {/* New elements */}
          <Box className="absolute bottom-32 right-12 text-indigo-600 animate-spin-slow" size={32} />
          <div className="absolute top-16 left-40 w-20 h-20 bg-gradient-to-br from-green-400 to-blue-500 rounded-full opacity-50 animate-pulse"></div>
        </div>
      </div>
    </main>

      {/* Features Section */}
      <section className="py-20 bg-gradient-to-b from-gray-50 to-white">
        <div className="container mx-auto px-4">
          <h2 className="text-5xl font-bold text-center mb-16 text-transparent bg-clip-text bg-gradient-to-r from-indigo-600 to-purple-600 animate-pulse">
            Why Choose Our 3D Architectural Platform
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-12 mb-16">
            <FeatureCard
              icon={<Code className="w-8 h-8 text-white" />}
              title={<span className='text-blue-950'>Immersive 3D Experiences</span>}
              description="Create stunning, interactive 3D models of your architectural designs that clients can explore in real-time."
            />
            <FeatureCard
              icon={<Layout className="w-8 h-8 text-white" />}
              title={<span className="text-red-500">User-Friendly Interface</span>}
              description="Our intuitive platform makes it easy for architects and clients alike to navigate and collaborate on projects seamlessly."
            />
            <FeatureCard
              icon={<Zap className="w-8 h-8 text-white" />}
              title={<span className='text-gray-900'>Real-time Collaboration</span>}
              description="Work together with your team and clients in real-time, making changes and getting feedback instantly."
            />
            <FeatureCard
              icon={<Compass className="w-8 h-8 text-white" />}
              title={<span className='text-green-600'>Virtual Walkthroughs</span>}
              description="Enable clients to take virtual tours of their future spaces, providing an unparalleled sense of scale and atmosphere."
            />
            <FeatureCard
              icon={<Cloud className="w-8 h-8 text-white" />}
              title={<span className='text-purple-600'>Cloud-Based Platform</span>}
              description="Access your projects from anywhere, anytime. Our cloud-based solution ensures your work is always up-to-date and secure."
            />
            <FeatureCard
              icon={<Coffee className="w-8 h-8 text-white" />}
              title={<span className='text-yellow-600'>24/7 Support</span>}
              description="Our dedicated support team is always ready to assist you, ensuring a smooth experience throughout your design process."
            />
          </div>
          <div className="text-center mb-16">
            <h3 className="text-3xl font-bold mb-8 text-indigo-600">Experience Our Interactive 3D Room</h3>
            <InteractiveRoom />
          </div>
        </div>
      </section>

        {/* membership */}
        <section className="py-20 bg-gradient-to-b from-white to-indigo-50 overflow-hidden">
      <div className="container mx-auto px-4">
        <h2 className="text-5xl font-bold text-center mb-16 text-transparent bg-clip-text bg-gradient-to-r from-indigo-600 to-purple-600 animate-pulse">
          Support our Project
        </h2>
        
        
        
        {/* Main container */}
        <div className="w-full max-w-4xl mx-auto">
      <DonationSection />
    </div>
      </div>
    </section>

      {/* Another 3D Room Section */}
      <section className="py-20 bg-gradient-to-b from-indigo-50 to-purple-100 overflow-hidden">
      <div className="container mx-auto px-4">
        <h2 className="text-5xl font-bold text-center mb-16 text-transparent bg-clip-text bg-gradient-to-r from-indigo-600 to-purple-600">
          Immersive 3D Room Experience
        </h2>
        <div className="relative w-full h-[600px] perspective-[1000px] rounded-2xl overflow-hidden shadow-2xl">
          <div 
            className={`absolute inset-0 transition-all duration-500 ease-out`}
            style={{
              transform: `rotateX(${rotationX}deg) rotateY(${rotationY}deg)`,
            }}
          >
            {/* Room walls */}
            <div className={`absolute inset-0 transition-colors duration-500 ${isDaytime ? 'bg-gradient-to-br from-blue-100 to-indigo-200' : 'bg-gradient-to-br from-gray-900 to-indigo-900'}`}></div>
            <div className={`absolute top-0 left-0 w-full h-full transition-colors duration-500 ${isDaytime ? 'bg-gradient-to-br from-blue-200 to-indigo-300' : 'bg-gradient-to-br from-gray-800 to-indigo-800'} transform-3d rotate-y-90 translate-x-[-300px]`}></div>
            <div className={`absolute top-0 right-0 w-full h-full transition-colors duration-500 ${isDaytime ? 'bg-gradient-to-bl from-blue-300 to-indigo-400' : 'bg-gradient-to-bl from-gray-700 to-indigo-700'} transform-3d rotate-y-[-90deg] translate-x-[300px]`}></div>
            <div className={`absolute bottom-0 left-0 right-0 h-full transition-colors duration-500 ${isDaytime ? 'bg-gradient-to-t from-blue-400 to-indigo-500' : 'bg-gradient-to-t from-gray-600 to-indigo-600'} transform-3d rotate-x-90 translate-y-[300px]`}></div>

            {/* Furniture and decorations */}
            <div className="absolute bottom-0 left-1/4 w-1/2 h-1/4 bg-gradient-to-t from-amber-700 to-yellow-600 transform-3d translate-z-20 rounded-t-lg shadow-lg"></div>
            <div className={`absolute top-1/4 left-1/4 w-40 h-56 transition-colors duration-500 ${isDaytime ? 'bg-sky-200' : 'bg-sky-900'} border-4 border-white transform-3d translate-z-30 rounded-lg shadow-md`}></div>
            <div className="absolute bottom-1/3 right-1/4 w-32 h-48 bg-gradient-to-br from-emerald-400 to-green-500 rounded-full transform-3d translate-z-40 shadow-lg"></div>

            {/* Animated elements */}
            <div className="absolute top-20 right-40 w-16 h-16 bg-gradient-to-br from-purple-400 to-pink-400 rounded-full animate-float transform-3d translate-z-50 shadow-md"></div>
            <div className="absolute bottom-40 left-60 w-12 h-12 bg-gradient-to-br from-pink-400 to-red-400 rounded-full animate-ping transform-3d translate-z-60 shadow-md"></div>
            <div className="absolute top-1/2 left-1/2 w-20 h-20 bg-gradient-to-br from-yellow-300 to-orange-400 rounded-full animate-pulse transform-3d translate-z-70 shadow-md"></div>

            {/* Interactive elements */}
            <button
              onClick={toggleDayNight}
              className="absolute top-5 right-5 p-2 bg-white rounded-full shadow-md hover:shadow-lg transition-shadow"
            >
              {isDaytime ? <Moon className="w-6 h-6 text-indigo-600" /> : <Sun className="w-6 h-6 text-yellow-500" />}
            </button>

            <div className="absolute bottom-10 left-10 flex space-x-4">
              <Book className={`w-8 h-8 ${isDaytime ? 'text-indigo-600' : 'text-indigo-300'}`} />
              <Coffee className={`w-8 h-8 ${isDaytime ? 'text-amber-700' : 'text-amber-500'}`} />
              <Flower className={`w-8 h-8 ${isDaytime ? 'text-green-600' : 'text-green-400'}`} />
            </div>
          </div>
        </div>
      </div>
    </section>
    </div>
  );
};

const FeatureCard = ({ icon, title, description }) => (
  <div className="bg-gradient-to-br from-white to-gray-100 rounded-xl shadow-lg p-6 transform transition-all duration-300 hover:scale-105 hover:shadow-xl">
    <div className="flex items-center mb-4">
      <div className="mr-4 p-3 bg-gradient-to-br from-indigo-500 to-purple-600 rounded-full">
        {icon}
      </div>
      <h3 className="text-xl font-semibold">{title}</h3>
    </div>
    <p className="text-gray-600 mb-4">{description}</p>
  </div>
);

export default LandingPage;