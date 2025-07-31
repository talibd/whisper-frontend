'use client';
import React, { useState, useRef, useCallback } from 'react';
import { Upload, Play, CheckCircle, Film, X, FileVideo, Pause, Volume2, VolumeX, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Switch } from './ui/switch';
import { IoSparkles } from "react-icons/io5";

export default function VideoUpload() {
    const [step, setStep] = useState(1);
    const [selectedFile, setSelectedFile] = useState<File | null>(null);
    const [dragActive, setDragActive] = useState(false);
    const [uploadProgress, setUploadProgress] = useState(0);
    const [videoUrl, setVideoUrl] = useState('');
    const [videoAspectRatio, setVideoAspectRatio] = useState('16/9');
    const [videoDimensions, setVideoDimensions] = useState({ width: 0, height: 0 });
    const [videoDuration, setVideoDuration] = useState(0);
    const [isPlaying, setIsPlaying] = useState(false);
    const [isMuted, setIsMuted] = useState(false);
    const [subtitlesEnabled, setSubtitlesEnabled] = useState(false);
    const [brollsEnabled, setBrollsEnabled] = useState(false);
    const fileInputRef = useRef<HTMLInputElement>(null);
    const videoRef = useRef<HTMLVideoElement>(null);
    const [isGenerating, setIsGenerating] = useState(false);

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

    // Format duration to MM:SS
    const formatDuration = (seconds: number): string => {
        const mins = Math.floor(seconds / 60);
        const secs = Math.floor(seconds % 60);
        return `${mins}:${secs.toString().padStart(2, '0')}`;
    };

    // Get file format from filename
    const getFileFormat = (filename: string): string => {
        const extension = filename.split('.').pop()?.toLowerCase();
        return extension?.toUpperCase() || 'UNKNOWN';
    };

    // Handle video metadata loading
    const handleVideoLoad = (e: React.SyntheticEvent<HTMLVideoElement>) => {
        const video = e.currentTarget;
        const aspectRatio = getAspectRatio(video.videoWidth, video.videoHeight);
        setVideoAspectRatio(aspectRatio);
        setVideoDimensions({ width: video.videoWidth, height: video.videoHeight });
        setVideoDuration(video.duration);
    };

    // Video control functions
    const togglePlay = () => {
        if (videoRef.current && !isGenerating) {
            if (isPlaying) {
                videoRef.current.pause();
            } else {
                videoRef.current.play();
            }
            setIsPlaying(!isPlaying);
        }
    };

    const toggleMute = () => {
        if (videoRef.current && !isGenerating) {
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

    // Handle generate button click
    const handleGenerate = () => {
        setIsGenerating(true);
        // Simulate generation process
        setTimeout(() => {
            setIsGenerating(false);
        }, 5000);
    };

    // Reset to step 1
    const resetUpload = () => {
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
    };

    // Step 1: Upload Area
    if (step === 1) {
        return (
            <Card className="w-[500px] h-[300px] bg-gradient-to-br from-neutral-800/80 via-neutral-800/70 to-neutral-900/80 border-2 border-dashed border-neutral-300 hover:border-neutral-200 transition-all duration-300 hover:shadow-lg hover:shadow-neutral-900/20">
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

                    <div className={`flex flex-col items-center justify-center transition-all duration-300 ${
                        dragActive ? 'scale-105 text-blue-400' : 'text-muted-foreground'
                    }`}>
                        <div className={`p-6 rounded-full mb-6 transition-all duration-300 ${
                            dragActive ? 'bg-blue-500/20 border-2 border-blue-400/50' : 'bg-muted/50 border-2 border-transparent'
                        }`}>
                            <Upload size={40} className={`transition-transform duration-300 ${dragActive ? 'scale-110' : ''}`} />
                        </div>

                        <h3 className="text-xl font-bold mb-3 text-foreground transition-colors duration-300">
                            {dragActive ? 'Drop your video here' : 'Upload Video'}
                        </h3>

                        <p className="text-sm text-muted-foreground text-center mb-6 max-w-xs leading-relaxed">
                            Drag and drop your video file here or click to browse from your device
                        </p>

                        <Badge variant="secondary" className="text-xs px-3 py-1 bg-neutral-700/50 border-neutral-600">
                            MP4, AVI, MOV, WMV supported
                        </Badge>
                    </div>

                    {dragActive && (
                        <div className="absolute inset-0 bg-blue-500/10 rounded-lg border-2 border-blue-400 border-dashed animate-pulse" />
                    )}
                </CardContent>
            </Card>
        );
    }

    // Step 2: Upload Progress
    if (step === 2) {
        return (
            <Card className="w-[500px] bg-gradient-to-br from-neutral-800/80 via-neutral-800/70 to-neutral-900/80 border border-neutral-700 shadow-xl">
                <CardContent className="p-8">
                    <div className="space-y-6">
                        {/* File Info */}
                        <div className="flex items-center space-x-4">
                            <div className="w-14 h-14 bg-gradient-to-br from-red-500 to-red-600 rounded-xl flex items-center justify-center flex-shrink-0 shadow-lg">
                                <FileVideo size={24} className="text-white" />
                            </div>
                            <div className="flex-1 min-w-0">
                                <div className="flex items-center justify-between mb-2">
                                    <span className="text-foreground font-semibold truncate text-lg">
                                        {selectedFile?.name || 'video-file.mp4'}
                                    </span>
                                    <div className="flex items-center space-x-2 ml-4">
                                        {uploadProgress < 100 ? (
                                            <Badge variant="outline" className="text-sm px-2 py-1 border-blue-400/50 text-blue-400">
                                                {Math.round(uploadProgress)}%
                                            </Badge>
                                        ) : (
                                            <div className="flex items-center space-x-1">
                                                <CheckCircle size={18} className="text-green-500" />
                                                <span className="text-green-500 text-sm font-medium">Complete</span>
                                            </div>
                                        )}
                                    </div>
                                </div>
                                <div className="text-muted-foreground text-sm">
                                    {selectedFile ? `${(selectedFile.size / (1024 * 1024)).toFixed(1)} MB` : '3.2 MB'} uploaded
                                </div>
                            </div>
                        </div>

                        {/* Progress Bar */}
                        <div className="space-y-3">
                            <Progress value={uploadProgress} className="h-3 bg-neutral-700" />
                            <div className="flex justify-between text-xs text-muted-foreground">
                                <span>Uploading...</span>
                                <span>{uploadProgress < 100 ? 'Processing' : 'Ready'}</span>
                            </div>
                        </div>
                    </div>
                </CardContent>
            </Card>
        );
    }

    // Step 3: Video Preview
    if (step === 3) {
        return (
            <div className='relative'>
                <Card className="bg-black p-0 border border-neutral-700 overflow-hidden relative group shadow-2xl" style={{ aspectRatio: videoAspectRatio, maxWidth: '800px', maxHeight: '600px' }}>
                    <CardContent className="p-0 h-full relative">
                        {/* Video Element - Always Present */}
                        <video
                            ref={videoRef}
                            src={videoUrl}
                            onLoadedMetadata={handleVideoLoad}
                            onPlay={handleVideoPlay}
                            onPause={handleVideoPause}
                            className="w-full h-full object-contain"
                            muted={isMuted}
                        >
                            Your browser does not support the video tag.
                        </video>

                        {/* Loading Overlay */}
                        {isGenerating && (
                            <div className="absolute inset-0 z-20 flex items-center justify-center overflow-hidden">
                                <div 
                                    className="absolute inset-0 opacity-95"
                                    style={{
                                        background: 'linear-gradient(135deg, #0a0a0a, #1a1a1a, #2a2a2a, #1a1a1a, #0a0a0a)',
                                        backgroundSize: '400% 400%',
                                        animation: 'shimmer 4s ease-in-out infinite'
                                    }}
                                />
                                <style jsx>{`
                                    @keyframes shimmer {
                                        0% { background-position: 0% 50%; }
                                        50% { background-position: 100% 50%; }
                                        100% { background-position: 0% 50%; }
                                    }
                                    @keyframes pulse-glow {
                                        0%, 100% { box-shadow: 0 0 20px rgba(255, 255, 255, 0.3); }
                                        50% { box-shadow: 0 0 40px rgba(255, 255, 255, 0.6); }
                                    }
                                    @keyframes float {
                                        0%, 100% { transform: translateY(0px); }
                                        50% { transform: translateY(-10px); }
                                    }
                                `}</style>
                                
                                <div className="relative z-10 text-center space-y-6">
                                    <div className="relative inline-block">
                                        <div 
                                            className="w-20 h-20 border-4 border-neutral-600 border-t-white rounded-full animate-spin"
                                            style={{ animation: 'spin 2s linear infinite, pulse-glow 2s ease-in-out infinite' }}
                                        />
                                        <IoSparkles 
                                            className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 text-white w-8 h-8"
                                            style={{ animation: 'float 3s ease-in-out infinite' }}
                                        />
                                    </div>
                                    <div className="space-y-2">
                                        <h3 className="text-white text-xl font-bold">Generating Content</h3>
                                        <p className="text-neutral-300 text-base">Processing your video with AI magic...</p>
                                     
                                    </div>
                                </div>
                            </div>
                        )}

                        {/* Video Controls - Only show when not generating */}
                        {!isGenerating && (
                            <>
                                {/* Clickable Play Area */}
                                <div 
                                    className="absolute inset-0 z-10 cursor-pointer"
                                    onClick={togglePlay}
                                />

                                {/* Control Buttons */}
                                <div className="absolute inset-0 z-10 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity duration-300 pointer-events-none">
                                    <Button
                                        onClick={togglePlay}
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
                                <div className="absolute bottom-0 left-0 right-0 p-6 opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                                    <div className="flex justify-between items-end">
                                        {/* <Button
                                            onClick={toggleMute}
                                            size="icon"
                                            variant="secondary"
                                            className="w-12 h-12 bg-black/60 hover:bg-black/80 backdrop-blur-sm border-0 rounded-full shadow-lg transition-all duration-200 hover:scale-105"
                                        >
                                            {isMuted ? (
                                                <VolumeX size={20} className="text-white" />
                                            ) : (
                                                <Volume2 size={20} className="text-white" />
                                            )}
                                        </Button> */}
                                        <Badge variant="secondary" className="text-sm bg-black/60 backdrop-blur-sm py-2 px-3 text-white border-white/20 shadow-lg">
                                            {videoAspectRatio}
                                        </Badge>
                                    </div>
                                </div>
                            </>
                        )}

                        {/* Reset Button */}
                        <Button
                            onClick={resetUpload}
                            size="icon"
                            variant="secondary"
                            className="absolute top-4 right-4 w-10 h-10 opacity-0 group-hover:opacity-100 transition-all duration-300 bg-black/60 hover:bg-black/80 backdrop-blur-sm border-0 shadow-lg hover:scale-105 z-30"
                        >
                            <X size={18} className="text-white" />
                        </Button>
                    </CardContent>
                </Card>

                {/* Side Panel */}
                <div className='absolute top-0 left-full ml-6 w-[320px] flex flex-col gap-4'>
                    {/* Video Info Panel */}
                    <div className='w-full bg-gradient-to-br from-neutral-800/90 to-neutral-900/90 p-4 rounded-xl border border-neutral-700 shadow-lg backdrop-blur-sm'>
                        <h3 className='text-base font-semibold text-neutral-100 mb-4 flex items-center gap-2'>
                            <Film size={18} />
                            Video Info
                        </h3>
                        <div className='grid grid-cols-2 gap-3 text-sm'>
                            <span className='text-neutral-400 font-medium'>Name:</span>
                            <p title={selectedFile?.name || 'video-file.mp4'} className='text-neutral-200 truncate font-mono text-xs'>
                                {selectedFile?.name || 'video-file.mp4'}
                            </p>
                            
                            <span className='text-neutral-400 font-medium'>Size:</span>
                            <p className='text-neutral-200 font-mono text-xs'>
                                {selectedFile ? `${(selectedFile.size / (1024 * 1024)).toFixed(1)} MB` : '3.2 MB'}
                            </p>
                            
                            <span className='text-neutral-400 font-medium'>Resolution:</span>
                            <p className='text-neutral-200 font-mono text-xs'>
                                {videoDimensions.width > 0 ? `${videoDimensions.width}×${videoDimensions.height}` : '1920×1080'}
                            </p>
                            
                            <span className='text-neutral-400 font-medium'>Duration:</span>
                            <p className='text-neutral-200 font-mono text-xs'>
                                {videoDuration > 0 ? formatDuration(videoDuration) : '2:34'}
                            </p>
                            
                            <span className='text-neutral-400 font-medium'>Format:</span>
                            <p className='text-neutral-200 font-mono text-xs'>
                                {selectedFile ? getFileFormat(selectedFile.name) : 'MP4'}
                            </p>
                        </div>
                    </div>

                    {/* Options Panel */}
                    <div className='w-full bg-gradient-to-br from-neutral-800/90 to-neutral-900/90 p-4 rounded-xl border border-neutral-700 shadow-lg backdrop-blur-sm'>
                        <h3 className='text-base font-semibold text-neutral-100 mb-4'>Enhancement Options</h3>
                        <div className='flex flex-col gap-3'>
                            <div className='flex items-center justify-between p-4 bg-neutral-700/50 rounded-lg border border-neutral-600/50 transition-all duration-200 hover:bg-neutral-600/50'>
                                <div className='flex flex-col'>
                                    <label htmlFor="transcribe" className='text-sm font-medium text-neutral-200'>Auto Subtitles</label>
                                    <span className='text-xs text-neutral-400'>Generate captions automatically</span>
                                </div>
                                <Switch 
                                    id="transcribe" 
                                    checked={subtitlesEnabled}
                                    onCheckedChange={setSubtitlesEnabled}
                                    disabled={isGenerating}
                                />
                            </div>
                            <div className='flex items-center justify-between p-4 bg-neutral-700/50 rounded-lg border border-neutral-600/50 transition-all duration-200 hover:bg-neutral-600/50'>
                                <div className='flex flex-col'>
                                    <label htmlFor="brolls" className='text-sm font-medium text-neutral-200'>B-roll images</label>
                                    <span className='text-xs text-neutral-400'>Add supplementary images.</span>
                                </div>
                                <Switch 
                                    id="brolls" 
                                    checked={brollsEnabled}
                                    onCheckedChange={setBrollsEnabled}
                                    disabled={isGenerating}
                                />
                            </div>
                        </div>
                    </div>

                    {/* Generate Button */}
                    <div className='w-full p-4 bg-gradient-to-br from-neutral-800/90 to-neutral-900/90 rounded-xl border border-neutral-700 shadow-lg backdrop-blur-sm'>
                        <Button 
                            size={'lg'} 
                            className='w-full h-12 bg-gradient-to-r from-neutral-100 to-neutral-200 hover:from-neutral-100 hover:to-neutral-200 border-0 shadow-lg transition-all duration-200  ' 
                            onClick={handleGenerate}
                            disabled={isGenerating}
                        >
                            {isGenerating ? (
                                <>
                                    <Loader2 className="w-5 h-5 animate-spin mr-2" />
                                    Generating...
                                </>
                            ) : (
                                <>
                                    <IoSparkles className="w-5 h-5 mr-1" />
                                    Generate Enhanced Video
                                </>
                            )}
                        </Button>
                    </div>
                </div>
            </div>
        );
    }

    return null;
}