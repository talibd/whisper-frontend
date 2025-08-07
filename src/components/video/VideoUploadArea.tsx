'use client';
import React, { useCallback } from 'react';
import { Upload } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';

interface VideoUploadAreaProps {
  dragActive: boolean;
  onFileSelect: (file: File) => void;
  onDragStateChange: (active: boolean) => void;
  fileInputRef: React.RefObject<HTMLInputElement>;
}

export const VideoUploadArea: React.FC<VideoUploadAreaProps> = ({
  dragActive,
  onFileSelect,
  onDragStateChange,
  fileInputRef
}) => {
  const handleDrag = useCallback((e: React.DragEvent<HTMLInputElement>) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === "dragenter" || e.type === "dragover") {
      onDragStateChange(true);
    } else if (e.type === "dragleave") {
      onDragStateChange(false);
    }
  }, [onDragStateChange]);

  const handleDrop = useCallback((e: React.DragEvent<HTMLInputElement>) => {
    e.preventDefault();
    e.stopPropagation();
    onDragStateChange(false);

    const files = e.dataTransfer.files;
    if (files && files[0]) {
      handleFile(files[0]);
    }
  }, [onDragStateChange]);

  const handleFile = (file: File) => {
    if (file?.type.startsWith('video/')) {
      onFileSelect(file);
    } else {
      alert('Please select a valid video file');
    }
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) handleFile(file);
  };

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
};