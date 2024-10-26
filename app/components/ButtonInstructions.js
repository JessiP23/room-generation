import React, {useState} from "react";
import { RotateCcw, ClipboardCheck, Mouse, Keyboard, Info } from "lucide-react";
import * as THREE from "three";

const ButtonInstructions = ({ isInternalView, isTopView }) => {
    const [isExpanded, setIsExpanded] = useState(true);
  
    return (
      <div className="absolute top-6 right-6 z-50">
        {/* Toggle Button */}
        <button 
          onClick={() => setIsExpanded(!isExpanded)}
          className="absolute -top-2 -right-2 p-2 bg-purple-600 rounded-full shadow-lg hover:bg-purple-700 
          transition-colors duration-200 z-10 transform hover:scale-105"
        >
          <Info className="w-4 h-4 text-white" />
        </button>
  
        {/* Instructions Panel */}
        <div className={`
          w-72 backdrop-blur-lg bg-black/80 rounded-2xl p-5
          border border-purple-500/20 shadow-2xl
          transform transition-all duration-300 ease-in-out
          ${isExpanded 
            ? 'opacity-100 translate-y-0 scale-100' 
            : 'opacity-0 -translate-y-4 scale-95 pointer-events-none'}
        `}>
          <div className="space-y-5">
            {/* Header */}
            <div className="mb-4">
              <h2 className="text-purple-300 text-lg font-semibold mb-1">Controls Guide</h2>
              <div className="h-1 w-12 bg-purple-500/50 rounded-full"></div>
            </div>
  
            {isInternalView ? (
              <>
                {/* Movement Controls */}
                <div className="flex items-start gap-4 transform transition-all duration-300 hover:translate-x-1 group">
                  <div className="p-3 bg-purple-500/10 rounded-xl transition-colors duration-200 group-hover:bg-purple-500/20">
                    <Keyboard className="w-6 h-6 text-purple-300" />
                  </div>
                  <div className="space-y-2">
                    <h3 className="font-semibold text-purple-200">Movement Controls</h3>
                    <div className="flex gap-2">
                      {['W', 'A', 'S', 'D'].map((key) => (
                        <kbd 
                          key={key} 
                          className="px-3 py-2 bg-purple-500/10 rounded-lg text-sm font-mono text-purple-200 
                          transition-all duration-200 hover:bg-purple-500/20 hover:scale-105 shadow-inner"
                        >
                          {key}
                        </kbd>
                      ))}
                    </div>
                    <p className="text-xs text-purple-300/70">Press keys to move in the scene</p>
                  </div>
                </div>
  
                {/* Look Around Controls */}
                <div className="flex items-start gap-4 transform transition-all duration-300 hover:translate-x-1 group">
                  <div className="p-3 bg-purple-500/10 rounded-xl transition-colors duration-200 group-hover:bg-purple-500/20">
                    <Mouse className="w-6 h-6 text-purple-300" />
                  </div>
                  <div className="space-y-2">
                    <h3 className="font-semibold text-purple-200">Look Around</h3>
                    <p className="text-sm text-purple-300/70">Move mouse to rotate camera view</p>
                    <div className="flex gap-2">
                      <span className="px-3 py-1 bg-purple-500/10 rounded-lg text-xs transition-colors duration-200 
                      hover:bg-purple-500/20">
                        Click + Drag
                      </span>
                    </div>
                  </div>
                </div>
              </>
            ) : isTopView && (
              <>
                {/* Room Selection */}
                <div className="flex items-start gap-4 transform transition-all duration-300 hover:translate-x-1 group">
                  <div className="p-3 bg-purple-500/10 rounded-xl transition-colors duration-200 group-hover:bg-purple-500/20">
                    <ClipboardCheck className="w-6 h-6 text-purple-300" />
                  </div>
                  <div className="space-y-2">
                    <h3 className="font-semibold text-purple-200">Room Selection</h3>
                    <p className="text-sm text-purple-300/70">Click on any room to select it</p>
                    <div className="flex gap-2">
                      <span className="px-3 py-1 bg-purple-500/10 rounded-lg text-xs transition-colors duration-200 
                      hover:bg-purple-500/20">
                        Left Click
                      </span>
                    </div>
                  </div>
                </div>
  
                {/* Release Room */}
                <div className="flex items-start gap-4 transform transition-all duration-300 hover:translate-x-1 group">
                  <div className="p-3 bg-purple-500/10 rounded-xl transition-colors duration-200 group-hover:bg-purple-500/20">
                    <RotateCcw className="w-6 h-6 text-purple-300" />
                  </div>
                  <div className="space-y-2">
                    <h3 className="font-semibold text-purple-200">Release Room</h3>
                    <p className="text-sm text-purple-300/70">Press R to release selected room</p>
                    <kbd className="px-3 py-2 bg-purple-500/10 rounded-lg text-sm font-mono text-purple-200 
                    transition-all duration-200 hover:bg-purple-500/20 hover:scale-105 shadow-inner">
                      R
                    </kbd>
                  </div>
                </div>
              </>
            )}
  
            {/* Footer */}
            <div className="pt-4 border-t border-purple-500/20">
              <p className="text-xs text-purple-300/60 italic">
                Hover over controls for more details
              </p>
            </div>
          </div>
        </div>
      </div>
    );
  };
  
export default ButtonInstructions;