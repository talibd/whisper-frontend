'use client';
import React, { useState, useRef, useCallback } from 'react';
import { Upload, Play, CheckCircle, Film, X, FileVideo, Pause, Volume2, VolumeX } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';

export default function VideoUpload() {
    const [step, setStep] = useState(1);
    const [selectedFile, setSelectedFile] = useState<File | null>(null);
    const [dragActive, setDragActive] = useState(false);
    const [uploadProgress, setUploadProgress] = useState(0);
    const [videoUrl, setVideoUrl] = useState('');
    const [videoAspectRatio, setVideoAspectRatio] = useState('16/9');
    const [isPlaying, setIsPlaying] = useState(false);
    const [isMuted, setIsMuted] = useState(false);
    const fileInputRef = useRef<HTMLInputElement>(null);
    const videoRef = useRef<HTMLVideoElement>(null);

    // Determine aspect ratio based on video dimensions
    const getAspectRatio = (width: number, height: number): string => {
        const ratio = width / height;

        // Common aspect ratios with tolerance
        if (Math.abs(ratio - 16 / 9) < 0.1) return '16/9';      // 1.78 - Widescreen
        if (Math.abs(ratio - 9 / 16) < 0.1) return '9/16';     // 0.56 - Vertical/Stories
        if (Math.abs(ratio - 1) < 0.1) return '1/1';         // 1.0 - Square
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
    const handleVideoLoad = (e: React.SyntheticEvent<HTMLVideoElement>) => {
        const video = e.currentTarget;
        const aspectRatio = getAspectRatio(video.videoWidth, video.videoHeight);
        setVideoAspectRatio(aspectRatio);
    };

    // Video control functions
    const togglePlay = () => {
        if (videoRef.current) {
            if (isPlaying) {
                videoRef.current.pause();
            } else {
                videoRef.current.play();
            }
            setIsPlaying(!isPlaying);
        }
    };

    const toggleMute = () => {
        if (videoRef.current) {
            videoRef.current.muted = !isMuted;
            setIsMuted(!isMuted);
        }
    };

    const handleVideoPlay = () => setIsPlaying(true);
    const handleVideoPause = () => setIsPlaying(false);
    const handleDrag = useCallback((e: React.DragEvent<HTMLInputElement>) => {
        e.preventDefault();
        e.stopPropagation();
        if (e.type === "dragenter" || e.type === "dragover") {
            setDragActive(true);
        } else if (e.type === "dragleave") {
            setDragActive(false);
        }
    }, []);

    // Handle drop
    const handleDrop = useCallback((e: React.DragEvent<HTMLInputElement>) => {
        e.preventDefault();
        e.stopPropagation();
        setDragActive(false);

        const files = e.dataTransfer.files;
        if (files && files[0]) {
            handleFile(files[0]);
        }
    }, []);

    // Handle file selection
    const handleFile = (file: File) => {
        if (file?.type.startsWith('video/')) {
            setSelectedFile(file);
            setVideoUrl(URL.createObjectURL(file));
            setStep(2);
            simulateUpload();
        } else {
            alert('Please select a valid video file');
        }
    };

    // Simulate upload progress
    const simulateUpload = () => {
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
    };

    // Handle file input click
    const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (file) handleFile(file);
    };

    // Reset to step 1
    const resetUpload = () => {
        setStep(1);
        setSelectedFile(null);
        setUploadProgress(0);
        setVideoUrl('');
        setVideoAspectRatio('16/9');
        setIsPlaying(false);
        setIsMuted(false);
        if (fileInputRef.current) {
            fileInputRef.current.value = '';
        }
    };

    // Step 1: Upload Area
    if (step === 1) {
        return (
            <Card className="w-[500px] h-[300px] bg-neutral-800/70 border-2 border-dashed border-neutral-300 hover:border-neutral-200 transition-colors">
                <CardContent className="h-full flex flex-col items-center justify-center p-8 relative">
                    <input
                        ref={fileInputRef}
                        type="file"
                        accept="video/*"
                        onChange={handleInputChange}
                        className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-10"
                        onDragEnter={handleDrag}
                        onDragLeave={handleDrag}
                        onDragOver={handleDrag}
                        onDrop={handleDrop}
                    />

                    <div className={`flex flex-col items-center justify-center transition-all duration-200 ${dragActive ? 'scale-105 text-primary' : 'text-muted-foreground'
                        }`}>
                        <div className={`p-4 rounded-full mb-4 transition-colors duration-200 ${dragActive ? 'bg-primary/20' : 'bg-muted/50'
                            }`}>
                            <Upload size={32} />
                        </div>

                        <h3 className="text-lg font-semibold mb-2 text-foreground">
                            {dragActive ? 'Drop your video here' : 'Upload Video'}
                        </h3>

                        <p className="text-sm text-muted-foreground text-center mb-4">
                            Drag and drop your video file here or click to browse
                        </p>

                        <Badge variant="secondary" className="text-xs">
                            Supported formats: MP4, AVI, MOV, WMV
                        </Badge>
                    </div>

                    {dragActive && (
                        <div className="absolute inset-0 bg-primary/10 rounded-lg border-2 border-primary border-dashed" />
                    )}
                </CardContent>
            </Card>
        );
    }

    // Step 2: Upload Progress
    if (step === 2) {
        return (
            <Card className="w-[450px]  bg-neutral-800/70 border-2 border-neutral-300">
                <CardContent className="h-full p-0 flex flex-col items-center justify-center ">
                    <div className="w-full max-w-sm space-y-6">
                        {/* File Info */}
                        <div className="flex items-center space-x-4">
                            <div className="w-12 h-12 bg-red-500 rounded-lg flex items-center justify-center flex-shrink-0">
                                <FileVideo size={24} className="text-white" />
                            </div>
                            <div className="flex-1 min-w-0">
                                <div className="flex items-center justify-between mb-1">
                                    <span className="text-foreground font-medium truncate">
                                        {selectedFile?.name || 'video-file.mp4'}
                                    </span>
                                    <div className="flex items-center space-x-2 ml-2">
                                        {uploadProgress < 100 ? (
                                            <Badge variant="outline" className="text-xs">
                                                {Math.round(uploadProgress)}%
                                            </Badge>
                                        ) : (
                                            <CheckCircle size={16} className="text-green-500" />
                                        )}
                                    </div>
                                </div>
                                <div className="text-muted-foreground text-xs">
                                    {selectedFile ? `${(selectedFile.size / (1024 * 1024)).toFixed(1)} MB` : '3.2 MB'} of {selectedFile ? `${(selectedFile.size / (1024 * 1024)).toFixed(1)} MB` : '12.6 MB'}
                                </div>
                            </div>
                        </div>

                        {/* Progress Bar */}
                        <div className="space-y-2">
                            <Progress value={uploadProgress} className="h-2" />
                        </div>

                        {/* Status Text */}
                        {/* <div className="text-center">
              {uploadProgress < 100 ? (
                <p className="text-muted-foreground text-sm">Uploading video...</p>
              ) : (
                <div className="flex items-center justify-center space-x-2">
                  <CheckCircle size={16} className="text-green-500" />
                  <p className="text-green-500 text-sm font-medium">Upload complete!</p>
                </div>
              )}
            </div> */}
                    </div>
                </CardContent>
            </Card>
        );
    }

    // Step 3: Video Preview
    if (step === 3) {
        return (
            <div className=' relative '>
                <Card className="bg-black p-0 border-0 overflow-hidden relative group" style={{ aspectRatio: videoAspectRatio, maxWidth: '800px', maxHeight: '600px' }}>
                    <CardContent className="p-0 h-full relative">
                        <video
                            ref={videoRef}
                            src={videoUrl}
                            onLoadedMetadata={handleVideoLoad}
                            onPlay={handleVideoPlay}
                            onPause={handleVideoPause}
                            className="w-full h-full object-contain cursor-pointer"
                            onClick={togglePlay}
                            muted={isMuted}
                        >
                            Your browser does not support the video tag.
                        </video>

                        {/* Custom Video Controls */}
                        <div className="absolute inset-0 z-10 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity duration-200 pointer-events-none">
                            <div className="flex items-center space-x-4 pointer-events-auto ">
                                {/* Play/Pause Button */}
                                <Button
                                    onClick={togglePlay}
                                    size="icon"
                                    variant="secondary"
                                    className="w-12 scale-120 invert h-12 bg-neutral-800 hover:bg-neutral-800 border-0 rounded-full"
                                >
                                    {isPlaying ? (
                                        <Pause size={20} className="text-white" />
                                    ) : (
                                        <Play size={20} className="text-white " />
                                    )}
                                </Button>


                            </div>
                        </div>

                        {/* Reset Button */}
                        <Button
                            onClick={resetUpload}
                            size="icon"
                            variant="secondary"
                            className="absolute top-4 right-4 w-8 h-8 opacity-0 group-hover:opacity-100 transition-opacity duration-200 bg-neutral-800 hover:bg-neutral-800 border-0"
                        >
                            <X size={16} className="text-white" />
                        </Button>

                        {/* Video Info Overlay */}
                        <div className="absolute bottom-0 left-0 right-0 p-4 opacity-0 group-hover:opacity-100 transition-opacity duration-200">
                            <div className="flex justify-between items-end">
                                {/* <div>
                <p className="text-white text-sm font-medium truncate">
                  {selectedFile?.name || 'video-file.mp4'}
                </p>
                <p className="text-white/70 text-xs">
                  {selectedFile ? `${(selectedFile.size / (1024 * 1024)).toFixed(1)} MB` : '3.2 MB'}
                </p>
              </div> */}
                                {/* Mute/Unmute Button */}
                                <Button
                                    onClick={toggleMute}
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
                                <Badge variant="secondary" className="text-xs bg-black/50 py-2 text-white border-white/20">
                                    {videoAspectRatio}
                                </Badge>
                            </div>
                        </div>
                    </CardContent>
                </Card>
                <div className='bg-neutral-800 p-3 absolute top-0 left-full ml-4 rounded-2xl w-[300px] flex items-center justify-center gap-2 flex-col'>
                    <div className='w-full'>
                        <span className='text-sm text-neutral-200'>info</span>
                        <div className='grid grid-cols-2 gap-2 mt-2'>
                            <span className='text-sm text-neutral-400 '>name:</span>
                            <p title={selectedFile?.name || 'video-file.mp4'} className='text-sm text-neutral-200 truncate'>{selectedFile?.name || 'video-file.mp4'}</p>
                            <span className='text-sm text-neutral-400 '>size:</span>
                            <p title={selectedFile?.name || 'video-file.mp4'} className='text-sm text-neutral-200 truncate'>
                                {selectedFile ? `${(selectedFile.size / (1024 * 1024)).toFixed(1)} MB` : '3.2 MB'}
                            </p>
                            <span className='text-sm text-neutral-400 '>resolution:</span>
                            <p title={selectedFile?.name || 'video-file.mp4'} className='text-sm text-neutral-200 truncate'>
                                {selectedFile ? `${(selectedFile.size / (1024 * 1024)).toFixed(1)} MB` : '3.2 MB'}
                            </p>
                            <span className='text-sm text-neutral-400 '>duration:</span>
                            <p title={selectedFile?.name || 'video-file.mp4'} className='text-sm text-neutral-200 truncate'>
                                {selectedFile ? `${(selectedFile.size / (1024 * 1024)).toFixed(1)} MB` : '3.2 MB'}
                            </p>
                            <span className='text-sm text-neutral-400 '>format:</span>
                            <p title={selectedFile?.name || 'video-file.mp4'} className='text-sm text-neutral-200 truncate'>
                                {selectedFile ? `${(selectedFile.size / (1024 * 1024)).toFixed(1)} MB` : '3.2 MB'}
                            </p>
                        </div>
                    </div>
                    <div className='p-2 rounded-lg w-full bg-neutral-700/50'>
                        <span className='text-sm text-neutral-400'></span>

                    </div>
                </div>
            </div>
        );
    }

    return null;
}