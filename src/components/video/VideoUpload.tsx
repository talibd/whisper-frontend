// src/components/video/VideoUpload.tsx
'use client';
import React, { useState, useRef, useCallback } from 'react';
import { VideoUploadArea } from './VideoUploadArea';
import { VideoUploadProgress } from './VideoUploadProgress';
import { VideoPreview } from './VideoPreview';
import { VideoInfo } from './VideoInfo';

export default function VideoUpload() {
  const [step, setStep] = useState(1);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [dragActive, setDragActive] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [videoUrl, setVideoUrl] = useState('');
  const [videoAspectRatio, setVideoAspectRatio] = useState('16/9');
  const [isPlaying, setIsPlaying] = useState(false);
  const [isMuted, setIsMuted] = useState(false);
  const [isGenerating, setIsGenerating] = useState(false);
  const [videoDimensions, setVideoDimensions] = useState({ width: 0, height: 0 });
  const [videoDuration, setVideoDuration] = useState(0);
  const [subtitlesEnabled, setSubtitlesEnabled] = useState(false);
  const [brollsEnabled, setBrollsEnabled] = useState(false);
  
  const fileInputRef = useRef<HTMLInputElement>(null);
  const videoRef = useRef<HTMLVideoElement>(null);

  // Determine aspect ratio based on video dimensions
  const getAspectRatio = (width: number, height: number): string => {
    const ratio = width / height;

    // Common aspect ratios with tolerance
    if (Math.abs(ratio - 16 / 9) < 0.1) return '16/9';      // 1.78 - Widescreen
    if (Math.abs(ratio - 9 / 16) < 0.1) return '9/16';     // 0.56 - Vertical/Stories
    if (Math.abs(ratio - 1) < 0.1) return '1/1';           // 1.0 - Square
    if (Math.abs(ratio - 4 / 3) < 0.1) return '4/3';       // 1.33 - Traditional TV
    if (Math.abs(ratio - 3 / 4) < 0.1) return '3/4';       // 0.75 - Portrait
    if (Math.abs(ratio - 21 / 9) < 0.1) return '21/9';     // 2.33 - Ultra-wide
    if (Math.abs(ratio - 2 / 1) < 0.1) return '2/1';       // 2.0 - Cinema
    if (Math.abs(ratio - 3 / 2) < 0.1) return '3/2';       // 1.5 - Photo standard
    if (Math.abs(ratio - 2 / 3) < 0.1) return '2/3';       // 0.67 - Portrait photo

    // Fallback to closest common ratio
    if (ratio > 1.5) return '16/9';   // Wide videos
    if (ratio > 0.8) return '4/3';    // Square-ish videos
    return '9/16';                    // Tall videos
  };

  // Handle video metadata loading
  const handleVideoLoad = useCallback((e: React.SyntheticEvent<HTMLVideoElement>) => {
    const video = e.currentTarget;
    const aspectRatio = getAspectRatio(video.videoWidth, video.videoHeight);
    setVideoAspectRatio(aspectRatio);
    setVideoDimensions({ width: video.videoWidth, height: video.videoHeight });
    setVideoDuration(video.duration);
  }, []);

  // Video control functions
  const togglePlay = useCallback(() => {
    if (videoRef.current && !isGenerating) {
      if (isPlaying) {
        videoRef.current.pause();
      } else {
        videoRef.current.play();
      }
      setIsPlaying(!isPlaying);
    }
  }, [isPlaying, isGenerating]);

  const toggleMute = useCallback(() => {
    if (videoRef.current && !isGenerating) {
      videoRef.current.muted = !isMuted;
      setIsMuted(!isMuted);
    }
  }, [isMuted, isGenerating]);

  const handleVideoPlay = useCallback(() => setIsPlaying(true), []);
  const handleVideoPause = useCallback(() => setIsPlaying(false), []);

  // Handle file selection
  const handleFileSelect = useCallback((file: File) => {
    setSelectedFile(file);
    setVideoUrl(URL.createObjectURL(file));
    setStep(2);
    simulateUpload();
  }, []);

  // Handle drag state changes
  const handleDragStateChange = useCallback((active: boolean) => {
    setDragActive(active);
  }, []);

  // Simulate upload progress
  const simulateUpload = useCallback(() => {
    setUploadProgress(0);
    const interval = setInterval(() => {
      setUploadProgress(prev => {
        if (prev >= 100) {
          clearInterval(interval);
          setTimeout(() => setStep(3), 500);
          return 100;
        }
        return prev + Math.random() * 15;
      });
    }, 200);
  }, []);

  // Handle generate button click
  const handleGenerate = useCallback(() => {
    setIsGenerating(true);
    // Pause video if playing
    if (isPlaying && videoRef.current) {
      videoRef.current.pause();
      setIsPlaying(false);
    }
    
    // Simulate generation process
    setTimeout(() => {
      setIsGenerating(false);
    }, 5000);
  }, [isPlaying]);

  // Reset to step 1
  const resetUpload = useCallback(() => {
    setStep(1);
    setSelectedFile(null);
    setUploadProgress(0);
    setVideoUrl('');
    setVideoAspectRatio('16/9');
    setVideoDimensions({ width: 0, height: 0 });
    setVideoDuration(0);
    setIsPlaying(false);
    setIsMuted(false);
    setIsGenerating(false);
    setSubtitlesEnabled(false);
    setBrollsEnabled(false);
    
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  }, []);

  // Render based on current step
  if (step === 1) {
    return (
      <VideoUploadArea
        dragActive={dragActive}
        onFileSelect={handleFileSelect}
        onDragStateChange={handleDragStateChange}
        fileInputRef={fileInputRef}
      />
    );
  }

  if (step === 2) {
    return (
      <VideoUploadProgress
        selectedFile={selectedFile}
        uploadProgress={uploadProgress}
      />
    );
  }

  if (step === 3) {
    return (
      <div className="relative">
        <VideoPreview
          videoUrl={videoUrl}
          videoAspectRatio={videoAspectRatio}
          isPlaying={isPlaying}
          isMuted={isMuted}
          isGenerating={isGenerating}
          videoRef={videoRef}
          onVideoLoad={handleVideoLoad}
          onVideoPlay={handleVideoPlay}
          onVideoPause={handleVideoPause}
          onTogglePlay={togglePlay}
          onToggleMute={toggleMute}
          onReset={resetUpload}
        />
        
        <VideoInfo
          selectedFile={selectedFile}
          videoDimensions={videoDimensions}
          videoDuration={videoDuration}
          videoAspectRatio={videoAspectRatio}
          subtitlesEnabled={subtitlesEnabled}
          brollsEnabled={brollsEnabled}
          onSubtitlesChange={setSubtitlesEnabled}
          onBrollsChange={setBrollsEnabled}
          onGenerate={handleGenerate}
        />
      </div>
    );
  }

  return null;
}