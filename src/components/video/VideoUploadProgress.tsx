'use client';
import React from 'react';
import { CheckCircle, FileVideo } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';

interface VideoUploadProgressProps {
  selectedFile: File | null;
  uploadProgress: number;
}

export const VideoUploadProgress: React.FC<VideoUploadProgressProps> = ({
  selectedFile,
  uploadProgress
}) => {
  return (
    <Card className="w-[450px] bg-neutral-800/70 border-2 border-neutral-300">
      <CardContent className="h-full p-6 flex flex-col items-center justify-center">
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
        </div>
      </CardContent>
    </Card>
  );
};