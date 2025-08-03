'use client';
import React from 'react';
import { IoSparkles } from "react-icons/io5";

interface VideoLoadingOverlayProps {
  isVisible: boolean;
}

export const VideoLoadingOverlay: React.FC<VideoLoadingOverlayProps> = ({ isVisible }) => {
  if (!isVisible) return null;

  return (
    <>
      <style jsx>{`
        @keyframes shimmer {
          0% { background-position: 0% 50%; }
          50% { background-position: 100% 50%; }
          100% { background-position: 0% 50%; }
        }
        @keyframes pulse-glow {
          0%, 100% { 
            box-shadow: 0 0 20px rgba(255, 255, 255, 0.3);
            transform: scale(1);
          }
          50% { 
            box-shadow: 0 0 40px rgba(255, 255, 255, 0.6);
            transform: scale(1.05);
          }
        }
        @keyframes float {
          0%, 100% { transform: translateY(0px); }
          50% { transform: translateY(-10px); }
        }
        @keyframes sparkle-rotate {
          0% { transform: translateX(-50%) translateY(-50%) rotate(0deg); }
          100% { transform: translateX(-50%) translateY(-50%) rotate(360deg); }
        }
        .loading-spinner {
          animation: spin 2s linear infinite, pulse-glow 3s ease-in-out infinite;
        }
        .loading-sparkle {
          animation: float 3s ease-in-out infinite, sparkle-rotate 4s linear infinite;
        }
        .loading-text {
          animation: pulse 2s ease-in-out infinite;
        }
      `}</style>
      
      <div className="absolute inset-0 z-20 flex items-center justify-center overflow-hidden">
        {/* Animated Background */}
        <div 
          className="absolute inset-0 opacity-95"
          style={{
            background: 'linear-gradient(135deg, #0a0a0a, #1a1a1a, #2a2a2a, #1a1a1a, #0a0a0a)',
            backgroundSize: '400% 400%',
            animation: 'shimmer 4s ease-in-out infinite'
          }}
        />
        
        {/* Content */}
        <div className="relative z-10 text-center space-y-8">
          <div className="relative inline-block">
            {/* Main Spinner */}
            {/* <div className="w-24 h-24 flex items-center justify-center bg-red-500" /> */}
            
            {/* Inner Sparkle Icon */}
            <IoSparkles className=" text-white w-10 h-10 loading-sparkle" />
            
            {/* Orbiting Dots */}
            {/* <div className="absolute inset-0 animate-spin" style={{ animationDuration: '3s' }}>
              <div className="absolute w-2 h-2 bg-white rounded-full -top-1 left-1/2 transform -translate-x-1/2" />
              <div className="absolute w-2 h-2 bg-white rounded-full top-1/2 -right-1 transform -translate-y-1/2" />
              <div className="absolute w-2 h-2 bg-white rounded-full -bottom-1 left-1/2 transform -translate-x-1/2" />
              <div className="absolute w-2 h-2 bg-white rounded-full top-1/2 -left-1 transform -translate-y-1/2" />
            </div> */}
          </div>
          
          <div className="space-y-1 loading-text">
            <h3 className="text-white text-2xl  tracking-wide">
              Generating Content
            </h3>
            <p className="text-neutral-300 text-sm max-w-xs mx-auto leading-relaxed">
              Processing your video with AI magic...
            </p>
            <div className="flex justify-center space-x-1 mt-4">
              <div className="w-2 h-2 bg-white rounded-full animate-bounce" style={{ animationDelay: '0ms' }} />
              <div className="w-2 h-2 bg-white rounded-full animate-bounce" style={{ animationDelay: '150ms' }} />
              <div className="w-2 h-2 bg-white rounded-full animate-bounce" style={{ animationDelay: '300ms' }} />
            </div>
          </div>
        </div>
      </div>
    </>
  );
};