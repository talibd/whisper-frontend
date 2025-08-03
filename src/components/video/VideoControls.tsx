'use client';
import React from 'react';
import { Play, Pause, Volume2, VolumeX } from 'lucide-react';
import { Button } from '@/components/ui/button';

interface VideoControlsProps {
  isPlaying: boolean;
  isMuted: boolean;
  isGenerating: boolean;
  onTogglePlay: () => void;
  onToggleMute: () => void;
}

export const VideoControls: React.FC<VideoControlsProps> = ({
  isPlaying,
  isMuted,
  isGenerating,
  onTogglePlay,
  onToggleMute
}) => {
  if (isGenerating) return null;

  return (
    <>
      {/* Clickable Play Area */}
      <div 
        className="absolute inset-0 z-10 cursor-pointer"
        onClick={onTogglePlay}
      />

      {/* Center Play Button */}
      <div className="absolute inset-0 z-10 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity duration-300 pointer-events-none">
        <Button
          onClick={onTogglePlay}
          size="icon"
          variant="secondary"
          className="w-16 h-16 bg-black/60 hover:bg-black/80 border-0 rounded-full backdrop-blur-sm shadow-lg pointer-events-auto transition-all duration-200 hover:scale-110"
        >
          {isPlaying ? (
            <Pause size={24} className="text-white" />
          ) : (
            <Play size={24} className="text-white ml-0" />
          )}
        </Button>
      </div>

      {/* Bottom Controls */}
      <div className="absolute bottom-0 left-0 right-0 p-4 opacity-0 group-hover:opacity-100 transition-opacity duration-200">
        <div className="flex justify-between items-end">
          <Button
            onClick={onToggleMute}
            size="icon"
            variant="secondary"
            className="w-10 h-10 bg-black/50 backdrop-blur-xs hover:bg-neutral-800 border-0 rounded-full"
          >
            {isMuted ? (
              <VolumeX size={20} className="text-white" />
            ) : (
              <Volume2 size={20} className="text-white" />
            )}
          </Button>
        </div>
      </div>
    </>
  );
};