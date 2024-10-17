'use client'

import React, { useState } from 'react';
import { Send, Phone, MapPin } from 'lucide-react';

const ContactUsPage = () => {
  const [formData, setFormData] = useState({ name: '', email: '', message: '' });

  const handleInputChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    // Handle form submission here
    console.log('Form submitted:', formData);
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-purple-400 to-pink-300 flex items-center justify-center p-4">
      <div className="max-w-4xl w-full bg-white rounded-2xl shadow-2xl overflow-hidden flex flex-col md:flex-row">
        {/* 3D Building Animation */}
        <div className="w-full md:w-1/2 h-96 md:h-auto relative overflow-hidden bg-sky-900">
          <div className="absolute inset-0 flex items-center justify-center">
            <div className="w-64 h-96 relative transform perspective-1000 rotate-y-2 rotate-x-2 animate-building-float">
              {/* Main building structure */}
              <div className="absolute inset-0 bg-gray-200 rounded-lg shadow-2xl">
                <div className="absolute inset-2 bg-gradient-to-b from-gray-100 to-gray-300 rounded-lg"></div>
              </div>
              
              {/* Windows */}
              {[...Array(6)].map((_, floor) => (
                <div key={floor} className="absolute left-4 right-4 h-12" style={{ top: `${floor * 56 + 16}px` }}>
                  {[...Array(3)].map((_, window) => (
                    <div
                      key={window}
                      className="absolute w-12 h-8 bg-sky-200 rounded-sm shadow-inner animate-window-light"
                      style={{ left: `${window * 44}px` }}
                    >
                      <div className="absolute inset-0.5 bg-sky-100 rounded-sm opacity-75"></div>
                    </div>
                  ))}
                </div>
              ))}
              
              {/* Roof */}
              <div className="absolute top-0 left-0 right-0 h-16 bg-gray-400 rounded-t-lg transform -skew-x-2 origin-left shadow-lg"></div>
              
              {/* Door */}
              <div className="absolute bottom-0 left-1/2 w-16 h-24 bg-gray-700 rounded-t-lg transform -translate-x-1/2">
                <div className="absolute top-1 left-1 right-1 bottom-1 bg-gray-800 rounded-t-lg">
                  <div className="absolute top-1/2 left-1/2 w-2 h-2 bg-yellow-400 rounded-full transform -translate-x-1/2 -translate-y-1/2"></div>
                </div>
              </div>
            </div>
          </div>
          
          {/* Animated clouds */}
          <div className="absolute top-1/4 left-0 w-16 h-8 bg-white rounded-full opacity-75 animate-cloud-1"></div>
          <div className="absolute top-1/2 right-0 w-20 h-10 bg-white rounded-full opacity-75 animate-cloud-2"></div>
        </div>

        {/* Contact Form */}
        <div className="w-full md:w-1/2 p-8">
          <h2 className="text-3xl font-bold mb-6 text-indigo-800">Contact Us</h2>
          <form onSubmit={handleSubmit}>
            <div className="mb-4">
              <input
                type="text"
                name="name"
                placeholder="Your Name"
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-purple-400 text-green-800"
                onChange={handleInputChange}
                required
              />
            </div>
            <div className="mb-4">
              <input
                type="email"
                name="email"
                placeholder="Your Email"
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-purple-400 text-green-800"
                onChange={handleInputChange}
                required
              />
            </div>
            <div className="mb-4">
              <textarea
                name="message"
                placeholder="Your Message"
                rows="4"
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-purple-400 text-green-800"
                onChange={handleInputChange}
                required
              ></textarea>
            </div>
            <button
              type="submit"
              className="w-full bg-purple-500 text-white py-2 px-4 rounded-md hover:bg-purple-600 transition duration-300"
            >
              Send Message
            </button>
          </form>
          <div className="mt-8 flex flex-col space-y-2">
            <div className="flex items-center text-green-800">
              <Phone className="w-5 h-5 mr-2 text-purple-500" />
              <span>+1 (555) 123-4567</span>
            </div>
            <div className="flex items-center text-green-800">
              <MapPin className="w-5 h-5 mr-2 text-purple-500" />
              <span>123 Main St, Anytown, USA 12345</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ContactUsPage;