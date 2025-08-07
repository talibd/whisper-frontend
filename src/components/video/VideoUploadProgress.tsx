// src/components/video/VideoUploadProgress.tsx
'use client';
import React from 'react';
import { Button } from '@/components/ui/button';
import { AlertCircle, RefreshCw, X } from 'lucide-react';

interface VideoUploadProgressProps {
  selectedFile: File | null;
  uploadProgress: number;
  currentStep?: string;
  error?: string | null;
  onRetry?: () => void;
  onCancel?: () => void;
}

export const VideoUploadProgress: React.FC<VideoUploadProgressProps> = ({
  selectedFile,
  uploadProgress,
  currentStep,
  error,
  onRetry,
  onCancel
}) => {
  const getProgressColor = () => {
    if (error) return 'bg-red-500';
    if (uploadProgress === 100) return 'bg-green-500';
    return 'bg-blue-500';
  };

  const getProgressText = () => {
    if (error) return 'Processing failed';
    if (uploadProgress === 100) return 'Processing complete!';
    return currentStep || 'Processing...';
  };

  return (
    <div className="w-[400px] bg-neutral-800 p-6 rounded-xl">
      <div className="text-center">
        <h2 className="text-xl text-white mb-2">Processing Video</h2>
        <p className="text-sm text-neutral-400 mb-6 truncate">
          {selectedFile?.name || 'your-video.mp4'}
        </p>

        {/* Progress Bar */}
        <div className="w-full bg-neutral-700 rounded-full h-3 mb-4">
          <div
            className={`h-3 rounded-full transition-all duration-300 ${getProgressColor()}`}
            style={{ width: `${uploadProgress}%` }}
          />
        </div>

        {/* Progress Text */}
        <div className="flex items-center justify-center mb-6">
          {error ? (
            <div className="flex items-center text-red-400">
              <AlertCircle size={16} className="mr-2" />
              <span className="text-sm">{getProgressText()}</span>
            </div>
          ) : (
            <div className="text-white">
              <div className="text-sm font-medium">{getProgressText()}</div>
              <div className="text-xs text-neutral-400 mt-1">{uploadProgress}%</div>
            </div>
          )}
        </div>

        {/* Processing Steps */}
        {!error && (
          <div className="space-y-2 mb-6">
            <div className={`flex items-center text-sm ${uploadProgress >= 25 ? 'text-green-400' : 'text-neutral-500'}`}>
              <div className={`w-2 h-2 rounded-full mr-3 ${uploadProgress >= 25 ? 'bg-green-400' : 'bg-neutral-600'}`} />
              Transcription
            </div>
            <div className={`flex items-center text-sm ${uploadProgress >= 60 ? 'text-green-400' : 'text-neutral-500'}`}>
              <div className={`w-2 h-2 rounded-full mr-3 ${uploadProgress >= 60 ? 'bg-green-400' : 'bg-neutral-600'}`} />
              Keyword extraction
            </div>
            <div className={`flex items-center text-sm ${uploadProgress >= 90 ? 'text-green-400' : 'text-neutral-500'}`}>
              <div className={`w-2 h-2 rounded-full mr-3 ${uploadProgress >= 90 ? 'bg-green-400' : 'bg-neutral-600'}`} />
              B-roll images
            </div>
            <div className={`flex items-center text-sm ${uploadProgress >= 100 ? 'text-green-400' : 'text-neutral-500'}`}>
              <div className={`w-2 h-2 rounded-full mr-3 ${uploadProgress >= 100 ? 'bg-green-400' : 'bg-neutral-600'}`} />
              Finalizing
            </div>
          </div>
        )}

        {/* Error Message */}
        {error && (
          <div className="bg-red-900/30 border border-red-500/50 rounded-lg p-4 mb-4">
            <p className="text-red-400 text-sm">{error}</p>
          </div>
        )}

        {/* Action Buttons */}
        {error && (
          <div className="flex gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={onCancel}
              className="flex-1"
            >
              <X size={16} className="mr-2" />
              Cancel
            </Button>
            <Button
              size="sm"
              onClick={onRetry}
              className="flex-1"
            >
              <RefreshCw size={16} className="mr-2" />
              Retry
            </Button>
          </div>
        )}

        {/* Loading Animation */}
        {/* {!error && uploadProgress < 100 && (
          <div className="flex justify-center">
            <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-white"></div>
          </div>
        )} */}
      </div>
    </div>
  );
};