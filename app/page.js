'use client'

import React from 'react';
import { Code, Layout, Search, Share, User, Zap } from 'lucide-react';

const LandingPage = () => {
  return (
    <div className="min-h-screen bg-gradient-to-b from-purple-400 to-pink-300">
      <nav className="flex justify-between items-center p-4">
        <div className="flex items-center">
          <div className="w-8 h-8 bg-white rounded-full mr-2"></div>
          <span className="text-white font-bold">LOGO</span>
        </div>
        <div className="flex space-x-4 text-white">
          <a href="#" className="hover:underline">Contact us</a>
          <a href="#" className="hover:underline">Get started</a>
          <a href="#" className="hover:underline">About us</a>
          <a href="#" className="hover:underline">Portfolio</a>
        </div>
        <div className="flex space-x-2 text-white">
          <Search size={20} />
          <Share size={20} />
          <User size={20} />
        </div>
      </nav>
      
      <main className="flex items-center justify-between px-20 py-16">
        <div className="w-1/2">
          <h1 className="text-6xl font-bold text-white mb-4">Front end developer</h1>
          <p className="text-white mb-8">
            Lorem ipsum dolor sit amet, consectetur adipiscing elit. Sed do
            eiusmod tempor incididunt ut labore et dolore magna aliqua.
          </p>
          <button className="bg-white text-purple-600 px-6 py-2 rounded-full font-bold hover:bg-purple-100 transition-colors duration-300">
            Get Started
          </button>
        </div>
        <div className="relative w-1/2 h-96">
          {/* Room container */}
          <div className="absolute inset-0 bg-gray-100 rounded-lg shadow-2xl overflow-hidden">
            {/* Wall */}
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
          </div>
        </div>
      </main>

      {/* Features Section */}
      <section className="py-16 bg-white">
        <div className="container mx-auto px-4">
          <h2 className="text-4xl font-bold text-center mb-12">Why Choose Our 3D Architectural Platform</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <FeatureCard 
              icon={<Code className="w-12 h-12 text-purple-500" />}
              title="Immersive 3D Experiences"
              description="Create stunning, interactive 3D models of your architectural designs that clients can explore in real-time."
            />
            <FeatureCard 
              icon={<Layout className="w-12 h-12 text-blue-500" />}
              title="Intuitive Interface"
              description="Our user-friendly platform makes it easy for architects and clients alike to navigate and collaborate on projects."
            />
            <FeatureCard 
              icon={<Zap className="w-12 h-12 text-yellow-500" />}
              title="Real-time Collaboration"
              description="Work together with your team and clients in real-time, making changes and getting feedback instantly."
            />
          </div>
        </div>
      </section>

      {/* Another 3D Room Section */}
      <section className="py-16 bg-gray-100">
        <div className="container mx-auto px-4">
          <h2 className="text-4xl font-bold text-center mb-12 text-gray-800">Experience Our 3D Room Technology</h2>
          <div className="relative w-full h-[400px] perspective-1000 bg-gradient-to-br from-blue-100 to-purple-100 rounded-lg overflow-hidden">
            <div className="absolute inset-0 transform-3d rotate-y-[-20deg] rotate-x-10 animate-room-rotate">
              {/* Room walls */}
              <div className="absolute inset-0 bg-white opacity-50"></div>
              <div className="absolute top-0 left-0 w-full h-full bg-gray-200 transform-origin-left rotate-y-90 translate-x-[-200px]"></div>
              <div className="absolute top-0 right-0 w-full h-full bg-gray-300 transform-origin-right rotate-y-[-90deg] translate-x-[200px]"></div>
              <div className="absolute bottom-0 left-0 right-0 h-full bg-gray-400 transform-origin-bottom rotate-x-90 translate-y-[200px]"></div>

              {/* Furniture and decorations */}
              <div className="absolute bottom-0 left-1/4 w-1/2 h-1/4 bg-yellow-800 transform translate-z-20"></div>
              <div className="absolute top-1/4 left-1/4 w-32 h-48 bg-blue-200 border-4 border-white transform translate-z-30"></div>
              <div className="absolute bottom-1/4 right-1/4 w-24 h-36 bg-green-500 rounded-full transform translate-z-40"></div>

              {/* Animated elements */}
              <div className="absolute top-20 right-40 w-12 h-12 bg-purple-400 rounded-full animate-float transform translate-z-50"></div>
              <div className="absolute bottom-40 left-60 w-8 h-8 bg-pink-400 rounded-full animate-ping transform translate-z-60"></div>
              <div className="absolute top-1/2 left-1/2 w-16 h-16 bg-yellow-400 rounded-full animate-pulse transform translate-z-70"></div>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
};

const FeatureCard = ({ icon, title, description }) => (
  <div className="bg-gray-50 p-6 rounded-lg shadow-lg transition-transform duration-300 hover:scale-105">
    <div className="mb-4">{icon}</div>
    <h3 className="text-xl font-semibold mb-2">{title}</h3>
    <p className="text-gray-600">{description}</p>
  </div>
);

export default LandingPage;