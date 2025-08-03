'use client';
import React from 'react';
import { X } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { VideoLoadingOverlay } from './VideoLoadingOverlay';
import { VideoControls } from './VideoControls';

interface VideoPreviewProps {
  videoUrl: string;
  videoAspectRatio: string;
  isPlaying: boolean;
  isMuted: boolean;
  isGenerating: boolean;
  videoRef: React.RefObject<HTMLVideoElement>;
  onVideoLoad: (e: React.SyntheticEvent<HTMLVideoElement>) => void;
  onVideoPlay: () => void;
  onVideoPause: () => void;
  onTogglePlay: () => void;
  onToggleMute: () => void;
  onReset: () => void;
}

export const VideoPreview: React.FC<VideoPreviewProps> = ({
  videoUrl,
  videoAspectRatio,
  isPlaying,
  isMuted,
  isGenerating,
  videoRef,
  onVideoLoad,
  onVideoPlay,
  onVideoPause,
  onTogglePlay,
  onToggleMute,
  onReset
}) => {
  return (
    <Card 
      className="bg-black p-0 border-0 overflow-hidden relative group" 
      style={{ 
        aspectRatio: videoAspectRatio, 
        maxWidth: '800px', 
        maxHeight: '600px' 
      }}
    >
      <CardContent className="p-0 h-full relative">
        <video
          ref={videoRef}
          src={videoUrl}
          onLoadedMetadata={onVideoLoad}
          onPlay={onVideoPlay}
          onPause={onVideoPause}
          className="w-full h-full object-contain cursor-pointer"
          onClick={onTogglePlay}
          muted={isMuted}
        >
          Your browser does not support the video tag.
        </video>

        {/* Loading Overlay */}
        <VideoLoadingOverlay isVisible={isGenerating} />

        {/* Video Controls */}
        <VideoControls
          isPlaying={isPlaying}
          isMuted={isMuted}
          isGenerating={isGenerating}
          onTogglePlay={onTogglePlay}
          onToggleMute={onToggleMute}
        />

        {/* Reset Button */}
        <Button
          onClick={onReset}
          size="icon"
          variant="secondary"
          className="absolute top-4 right-4 w-8 h-8 opacity-0 group-hover:opacity-100 transition-opacity duration-200 bg-neutral-800 hover:bg-neutral-700 border-0"
        >
          <X size={16} className="text-white" />
        </Button>

        {/* Aspect Ratio Badge */}
        <div className="absolute bottom-4 right-4 opacity-0 group-hover:opacity-100 transition-opacity duration-200">
          <Badge variant="secondary" className="text-xs bg-black/50 py-2 text-white border-white/20">
            {videoAspectRatio}
          </Badge>
        </div>
      </CardContent>
    </Card>
  );
};