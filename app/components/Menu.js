'use client'

import React, { useState } from 'react';
import { Home, Building, Compass, Users, Menu, LogOut } from 'lucide-react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { getAuth, signOut } from 'firebase/auth';

const FlowerMenu = () => {
  const [isOpen, setIsOpen] = useState(false);
  const router = useRouter();
  const auth = getAuth();

  const toggleMenu = () => setIsOpen(!isOpen);

  const handleLogout = async (e) => {
    e.preventDefault();
    try {
      await signOut(auth);
      router.push('/'); // Redirect to login page after logout
    } catch (error) {
      console.error('Logout error:', error);
    }
  };

  const menuItems = [
    { icon: Home, label: 'Home', href: '/' },
    { icon: Building, label: 'Projects', href: '/room-generation/saved-rooms' },
    { 
      icon: LogOut,
      label: 'Logout',
      href: '#',
      onClick: handleLogout,
      className: "bg-gradient-to-b from-red-400 to-orange-400 hover:from-red-500 hover:to-orange-500"
    },
    { icon: Users, label: 'Team', href: '/team' },
  ];

  return (
    <div className="fixed bottom-14 right-14 z-50">
      <div className={`relative w-16 h-16 ${isOpen ? 'flower-open' : ''}`}>
        {/* Main menu button */}
        <button
          onClick={toggleMenu}
          className="absolute inset-0 bg-gradient-to-b from-purple-400 to-pink-300 rounded-full shadow-lg 
                   focus:outline-none transform transition-all duration-300 ease-in-out hover:scale-110 z-10"
        >
          <Menu className="w-8 h-8 mx-auto text-white" />
        </button>

        {/* Flower petals (menu items) */}
        {menuItems.map((item, index) => (
          <Link
            key={index}
            href={item.href}
            onClick={item.onClick}
            className={`group absolute w-12 h-12 rounded-full shadow-lg transform transition-all duration-500 
                      ease-in-out ${isOpen ? 'scale-100 opacity-100' : 'scale-0 opacity-0'} 
                      ${item.className || 'bg-gradient-to-b from-purple-300 to-pink-200 hover:from-purple-400 hover:to-pink-300'} 
                      flex items-center justify-center`}
            style={{
              transform: isOpen
                ? `translate(${Math.cos((Math.PI * 2 * index) / menuItems.length) * 80}px, ${
                    Math.sin((Math.PI * 2 * index) / menuItems.length) * 80
                  }px) scale(1)`
                : 'scale(0)',
            }}
          >
            <item.icon className={`w-6 h-6 text-white ${
              item.label === 'Logout' ? 'group-hover:rotate-12 transition-transform duration-300' : ''
            }`} />
            <span className="absolute w-auto p-2 min-w-max rounded-md shadow-md
                           text-white bg-gray-900 text-xs font-bold
                           transition-all duration-100 scale-0 origin-left
                           group-hover:scale-100 -top-10 left-1/2 -translate-x-1/2">
              {item.label}
            </span>
          </Link>
        ))}
      </div>

      {/* Decorative elements */}
      <div className={`absolute inset-0 transition-all duration-500 ease-in-out ${isOpen ? 'opacity-100' : 'opacity-0'}`}>
        {[...Array(8)].map((_, i) => (
          <div
            key={i}
            className="absolute w-2 h-2 bg-pink-200 rounded-full animate-twinkle"
            style={{
              left: `${Math.random() * 100}%`,
              top: `${Math.random() * 100}%`,
              animationDelay: `${Math.random() * 2}s`,
            }}
          />
        ))}
      </div>
    </div>
  );
};

export default FlowerMenu;