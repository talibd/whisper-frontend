'use client';
import React, { useState, useRef, useCallback } from 'react';
import { Upload, Play, CheckCircle, Film, X, FileVideo } from 'lucide-react';
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
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Handle drag events
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
          
          <div className={`flex flex-col items-center justify-center transition-all duration-200 ${
            dragActive ? 'scale-105 text-primary' : 'text-muted-foreground'
          }`}>
            <div className={`p-4 rounded-full mb-4 transition-colors duration-200 ${
              dragActive ? 'bg-primary/20' : 'bg-muted/50'
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
      <Card className="w-[500px] h-[300px] bg-neutral-800/70 border-2 border-neutral-300">
        <CardContent className="h-full flex flex-col items-center justify-center p-8">
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
            <div className="text-center">
              {uploadProgress < 100 ? (
                <p className="text-muted-foreground text-sm">Uploading video...</p>
              ) : (
                <div className="flex items-center justify-center space-x-2">
                  <CheckCircle size={16} className="text-green-500" />
                  <p className="text-green-500 text-sm font-medium">Upload complete!</p>
                </div>
              )}
            </div>
          </div>
        </CardContent>
      </Card>
    );
  }

  // Step 3: Video Preview
  if (step === 3) {
    return (
      <Card className="w-[500px] h-[300px] bg-black border-0 overflow-hidden relative group">
        <CardContent className="p-0 h-full relative">
          <video
            src={videoUrl}
            controls
            className="w-full h-full object-cover"
            poster=""
          >
            Your browser does not support the video tag.
          </video>
          
          {/* Reset Button */}
          <Button
            onClick={resetUpload}
            size="icon"
            variant="secondary"
            className="absolute top-4 right-4 w-8 h-8 opacity-0 group-hover:opacity-100 transition-opacity duration-200 bg-black/50 hover:bg-black/70 border-0"
          >
            <X size={16} className="text-white" />
          </Button>
          
          {/* Video Info Overlay */}
          <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/70 to-transparent p-4 opacity-0 group-hover:opacity-100 transition-opacity duration-200">
            <p className="text-white text-sm font-medium truncate">
              {selectedFile?.name || 'video-file.mp4'}
            </p>
            <p className="text-white/70 text-xs">
              {selectedFile ? `${(selectedFile.size / (1024 * 1024)).toFixed(1)} MB` : '3.2 MB'}
            </p>
          </div>
        </CardContent>
      </Card>
    );
  }

  return null;
}