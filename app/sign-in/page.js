'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { getAuth, signInWithPopup, GoogleAuthProvider, onAuthStateChanged } from 'firebase/auth'
import { app } from '@/firebase'
import { Chrome, LogIn } from 'lucide-react'

const auth = getAuth(app);
const provider = new GoogleAuthProvider();

export default function SignIn() {
  const [loading, setLoading] = useState(true);
  const router = useRouter();

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      setLoading(false);
      if (user) {
        router.push('/room-generation');
      }
    });

    return () => unsubscribe();
  }, [router]);

  const handleSignIn = async () => {
    try {
      await signInWithPopup(auth, provider);
      // The user will be redirected in the onAuthStateChanged listener
    } catch (error) {
      console.error('Error signing in with Google:', error);
    }
  };

  if (loading) {
    return <div>Loading...</div>;
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-b from-purple-400 to-pink-300 relative overflow-hidden">
      {/* Animated background elements */}
      {[...Array(8)].map((_, i) => (
        <div
          key={i}
          className="absolute w-64 h-64 bg-white/10 rounded-full blur-3xl animate-float"
          style={{
            left: `${Math.random() * 100}%`,
            top: `${Math.random() * 100}%`,
            animationDelay: `${Math.random() * 5}s`,
            animationDuration: `${15 + Math.random() * 10}s`
          }}
        />
      ))}
      
      <div className="relative">
        {/* Card container with glass effect */}
        <div className="bg-white/10 backdrop-blur-lg p-8 rounded-2xl shadow-2xl 
                      border border-white/20 transform transition-all duration-500 
                      hover:scale-[1.02] hover:shadow-purple-500/25">
          {/* Decorative top light effect */}
          <div className="absolute -top-10 left-1/2 -translate-x-1/2 w-40 h-40 bg-purple-400 
                        rounded-full blur-3xl opacity-30 animate-pulse" />
          
          {/* Content container */}
          <div className="relative z-10 space-y-6 w-80">
            {/* Header */}
            <div className="text-center space-y-2">
              <div className="flex justify-center">
                <LogIn className="w-12 h-12 text-white animate-bounce" 
                      style={{ animationDuration: '2s' }} />
              </div>
              <h1 className="text-3xl font-bold bg-gradient-to-r from-white to-purple-100 
                           text-transparent bg-clip-text">
                Welcome Back
              </h1>
              <p className="text-white/60">Sign in to continue your journey</p>
            </div>

            {/* Sign in button */}
            <button
              onClick={handleSignIn}
              className="group relative w-full bg-white/10 text-white py-3 px-4 rounded-xl 
                       hover:bg-white/20 transition-all duration-300 transform hover:scale-105 
                       active:scale-95 overflow-hidden border border-white/30"
            >
              {/* Button gradient overlay */}
              <div className="absolute inset-0 bg-gradient-to-r from-purple-500/20 to-pink-500/20 
                           opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
              
              {/* Button content */}
              <div className="relative flex items-center justify-center gap-3">
                {/* Google icon with spin animation */}
                <div className="w-6 h-6 bg-white rounded-full flex items-center justify-center 
                              group-hover:rotate-180 transition-transform duration-500">
                  <Chrome className="w-4 h-4 text-gray-600" />
                </div>
                
                <span className="font-semibold text-lg">Sign in with Google</span>
                
                {/* Hover arrow */}
                <span className="opacity-0 group-hover:opacity-100 transform translate-x-2 
                               group-hover:translate-x-0 transition-all duration-300">→</span>
              </div>
            </button>

            {/* Additional text */}
            <p className="text-white/40 text-center text-sm">
              By signing in, you agree to our Terms of Service
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}