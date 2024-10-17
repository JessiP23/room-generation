'use client'

import React, { useState } from 'react';
import { Home, Building, Compass, Users } from 'lucide-react';

const CircularMenu = () => {
  const [isOpen, setIsOpen] = useState(false);

  const toggleMenu = () => setIsOpen(!isOpen);

  const menuItems = [
    { icon: Home, label: 'Home' },
    { icon: Building, label: 'Projects' },
    { icon: Compass, label: 'Explore' },
    { icon: Users, label: 'Team' },
  ];

  return (
    <div className="fixed top-24 right-16 z-50">
      <div className={`relative w-16 h-16 ${isOpen ? 'animate-menu-open' : ''}`}>
        {/* Main menu button */}
        <button
          onClick={toggleMenu}
          className="absolute inset-0 bg-gradient-to-br from-indigo-600 to-purple-600 rounded-full shadow-lg focus:outline-none transform transition-transform duration-300 ease-in-out hover:scale-110"
        >
          <div className="relative w-8 h-8 mx-auto">
            <span className={`absolute h-1 w-8 bg-white rounded transform transition-transform duration-300 ${isOpen ? 'rotate-45 translate-y-3' : '-translate-y-3'}`}></span>
            <span className={`absolute h-1 w-8 bg-white rounded transform transition-opacity duration-300 ${isOpen ? 'opacity-0' : 'opacity-100'}`}></span>
            <span className={`absolute h-1 w-8 bg-white rounded transform transition-transform duration-300 ${isOpen ? '-rotate-45 -translate-y-3' : 'translate-y-3'}`}></span>
          </div>
        </button>

        {/* Menu items */}
        {menuItems.map((item, index) => (
          <button
            key={index}
            className={`absolute w-12 h-12 rounded-full bg-white shadow-lg transform transition-all duration-300 ease-in-out ${
              isOpen ? `translate-x-${-Math.cos(Math.PI * index / 2) * 100} translate-y-${-Math.sin(Math.PI * index / 2) * 100} scale-100 opacity-100` : 'scale-0 opacity-0'
            }`}
            style={{
              transform: isOpen ? `translate(${-Math.cos(Math.PI * index / 2) * 100}px, ${-Math.sin(Math.PI * index / 2) * 100}px) scale(1)` : 'scale(0)',
            }}
          >
            <item.icon className="w-6 h-6 mx-auto text-indigo-600" />
          </button>
        ))}
      </div>

      {/* 3D building backdrop */}
      <div className={`absolute bottom-0 right-0 w-64 h-64 transition-all duration-300 ease-in-out ${isOpen ? 'opacity-20 scale-100' : 'opacity-0 scale-0'}`}>
        <div className="relative w-full h-full animate-rotate-slow">
          <div className="absolute left-1/2 top-1/2 w-32 h-64 bg-indigo-200 transform -translate-x-1/2 -translate-y-1/2 rotate-45 skew-y-12">
            {[...Array(8)].map((_, i) => (
              <div key={i} className="absolute w-full h-8" style={{top: `${i * 32}px`}}>
                {[...Array(3)].map((_, j) => (
                  <div key={j} className="absolute w-6 h-4 bg-indigo-400 animate-window-light" style={{left: `${j * 10 + 2}px`, top: '2px'}}></div>
                ))}
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

export default CircularMenu;