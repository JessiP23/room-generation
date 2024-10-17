'use client'
import React from 'react';
import { Users, Briefcase, Award } from 'lucide-react';

const AboutUsPage = () => {
  return (
    <div className="min-h-screen bg-gradient-to-b from-purple-400 to-pink-300 flex items-center justify-center p-4">
      <div className="max-w-4xl w-full bg-white rounded-2xl shadow-2xl overflow-hidden flex flex-col md:flex-row">
        {/* 3D Globe Animation */}
        <div className="w-full md:w-1/2 h-64 md:h-auto relative overflow-hidden">
          <div className="absolute inset-0 bg-indigo-900 flex items-center justify-center">
            <div className="relative w-48 h-48">
              <div className="absolute inset-0 rounded-full bg-blue-500 animate-globe-rotate"></div>
              <div className="absolute inset-2 rounded-full bg-green-400 animate-globe-rotate-reverse"></div>
              <div className="absolute inset-4 rounded-full bg-yellow-300 animate-globe-rotate"></div>
              <div className="absolute inset-0 w-full h-full flex items-center justify-center">
                <div className="w-1 h-full bg-white opacity-50 rotate-45 transform -translate-x-12"></div>
                <div className="w-1 h-full bg-white opacity-50 -rotate-45 transform translate-x-12"></div>
              </div>
            </div>
          </div>
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