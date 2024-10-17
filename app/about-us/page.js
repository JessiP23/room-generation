'use client'
import React from 'react';
import { Users, Briefcase, Award } from 'lucide-react';

const AboutUsPage = () => {
  return (
    <div className="min-h-screen bg-gradient-to-b from-purple-400 to-pink-300 flex items-center justify-center p-4">
      <div className="max-w-4xl w-full bg-white rounded-2xl shadow-2xl overflow-hidden flex flex-col md:flex-row">
        {/* 3D Globe Animation */}
        <div className="w-full md:w-1/2 h-96 md:h-auto relative overflow-hidden bg-indigo-900">
          <div className="absolute inset-0 flex items-center justify-center">
            <div className="relative w-64 h-64 animate-globe-rotate">
              {/* Globe */}
              <div className="absolute inset-0 rounded-full bg-blue-500 shadow-2xl overflow-hidden">
                <div className="absolute inset-0 bg-[url('data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHdpZHRoPSI0MDAiIGhlaWdodD0iNDAwIiB2aWV3Qm94PSIwIDAgNDAwIDQwMCI+CiAgPHBhdGggZD0iTTAgMTM1IEwxNTAgMCBMMzAwIDEzNSBNNzUgMjUgTDIyNSAyNSBNMCAyNzUgTDE1MCA0MDAgTDMwMCAyNzUgTTc1IDM3NSBMMjI1IDM3NSIgc3Ryb2tlPSIjNEZBOERBIiBzdHJva2Utd2lkdGg9IjIiIGZpbGw9Im5vbmUiIC8+CiAgPHBhdGggZD0iTTAgMjAwIEw0MDAgMjAwIE0yMDAgMCBMMjAwIDQwMCIgc3Ryb2tlPSIjNEZBOERBIiBzdHJva2Utd2lkdGg9IjIiIGZpbGw9Im5vbmUiIC8+Cjwvc3ZnPg==')] bg-repeat animate-globe-map-rotate"></div>
              </div>
              
              {/* Continents */}
              <div className="absolute inset-4 rounded-full bg-green-400 opacity-60 overflow-hidden">
                <div className="absolute inset-0 bg-[url('data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHdpZHRoPSI0MDAiIGhlaWdodD0iNDAwIiB2aWV3Qm94PSIwIDAgNDAwIDQwMCI+CiAgPHBhdGggZD0iTTUwIDUwIEwxMDAgMTAwIEwxNTAgNTAgTDIwMCAxMDAgTDI1MCA1MCBMMzAwIDEwMCBMMzUwIDUwIE01MCAxNTAgTDEwMCAyMDAgTDE1MCAxNTAgTDIwMCAyMDAgTDI1MCAxNTAgTDMwMCAyMDAgTDM1MCAxNTAgTTUwIDI1MCBMMTAwIDMwMCBMMTUwIDI1MCBMMjAwIDMwMCBMMjUwIDI1MCBMMzAwIDMwMCBMMzUwIDI1MCBNNTAgMzUwIEwxMDAgNDAwIEwxNTAgMzUwIEwyMDAgNDAwIEwyNTAgMzUwIEwzMDAgNDAwIEwzNTAgMzUwIiBzdHJva2U9IiMzNEQzOTkiIHN0cm9rZS13aWR0aD0iMjAiIGZpbGw9Im5vbmUiIC8+Cjwvc3ZnPg==')] bg-repeat animate-globe-continents-rotate"></div>
              </div>
              
              {/* Atmosphere */}
              <div className="absolute -inset-2 rounded-full bg-blue-200 opacity-20"></div>
              
              {/* Orbiting satellite */}
              <div className="absolute top-0 left-1/2 w-4 h-4 -mt-8 -ml-2 animate-satellite-orbit">
                <div className="w-full h-full bg-gray-300 rounded-sm transform rotate-45"></div>
              </div>
            </div>
          </div>
          
          {/* Stars background */}
          <div className="absolute inset-0 bg-[url('data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHdpZHRoPSIxMDAlIiBoZWlnaHQ9IjEwMCUiPgogIDxyZWN0IHdpZHRoPSIxMDAlIiBoZWlnaHQ9IjEwMCUiIGZpbGw9Im5vbmUiIC8+CiAgPGNpcmNsZSBjeD0iNSUiIGN5PSIxMCUiIHI9IjEiIGZpbGw9IndoaXRlIiAvPgogIDxjaXJjbGUgY3g9IjIwJSIgY3k9IjMwJSIgcj0iMSIgZmlsbD0id2hpdGUiIC8+CiAgPGNpcmNsZSBjeD0iNDAlIiBjeT0iNSUiIHI9IjEiIGZpbGw9IndoaXRlIiAvPgogIDxjaXJjbGUgY3g9IjYwJSIgY3k9IjIwJSIgcj0iMSIgZmlsbD0id2hpdGUiIC8+CiAgPGNpcmNsZSBjeD0iODAlIiBjeT0iNDAlIiByPSIxIiBmaWxsPSJ3aGl0ZSIgLz4KICA8Y2lyY2xlIGN4PSI5NSUiIGN5PSI3MCUiIHI9IjEiIGZpbGw9IndoaXRlIiAvPgogIDxjaXJjbGUgY3g9IjEwJSIgY3k9IjkwJSIgcj0iMSIgZmlsbD0id2hpdGUiIC8+CiAgPGNpcmNsZSBjeD0iMzAlIiBjeT0iNjUlIiByPSIxIiBmaWxsPSJ3aGl0ZSIgLz4KICA8Y2lyY2xlIGN4PSI3NSUiIGN5PSI4NSUiIHI9IjEiIGZpbGw9IndoaXRlIiAvPgo8L3N2Zz4=')] animate-twinkle"></div>
        </div>

        {/* About Us Content */}
        <div className="w-full md:w-1/2 p-8">
          <h2 className="text-3xl font-bold mb-6 text-indigo-800">About Us</h2>
          <p className="mb-6 text-gray-700">
            We are a passionate team dedicated to creating innovative solutions that make a difference in people lives. Our mission is to combine cutting-edge technology with user-centered design to build products that inspire and empower.
          </p>
          <div className="space-y-4">
            <div className="flex items-center">
              <Users className="w-8 h-8 mr-4 text-purple-500" />
              <div>
                <h3 className="font-semibold text-lg text-green-800">Our Team</h3>
                <p className="text-sm text-gray-600">Diverse experts united by a common goal</p>
              </div>
            </div>
            <div className="flex items-center">
              <Briefcase className="w-8 h-8 mr-4 text-purple-500" />
              <div>
                <h3 className="font-semibold text-lg text-green-800">Our Work</h3>
                <p className="text-sm text-gray-600">Impactful projects that push boundaries</p>
              </div>
            </div>
            <div className="flex items-center">
              <Award className="w-8 h-8 mr-4 text-purple-500" />
              <div>
                <h3 className="font-semibold text-lg text-green-800">Our Achievements</h3>
                <p className="text-sm text-gray-600">Recognition for excellence and innovation</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AboutUsPage;