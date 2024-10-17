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
        <div className="w-full md:w-1/2 h-64 md:h-auto relative overflow-hidden">
          <div className="absolute inset-0 bg-indigo-900 flex items-center justify-center">
            <div className="w-40 h-64 bg-white rounded-t-2xl transform -rotate-12 perspective-1000 animate-building-sway">
              <div className="w-full h-full bg-gradient-to-b from-blue-500 to-blue-600 rounded-t-2xl p-2">
                {[...Array(6)].map((_, i) => (
                  <div key={i} className="flex justify-between mb-2">
                    {[...Array(3)].map((_, j) => (
                      <div key={j} className="w-4 h-4 bg-yellow-300 rounded-sm animate-window-light"></div>
                    ))}
                  </div>
                ))}
              </div>
            </div>
          </div>
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