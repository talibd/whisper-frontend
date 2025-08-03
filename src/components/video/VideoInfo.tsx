// src/components/video/VideoInfo.tsx
'use client';
import React from 'react';
import { Switch } from '@/components/ui/switch';
import { Button } from '@/components/ui/button';
import { IoSparkles } from "react-icons/io5";
import { FileText, Image, MessageSquare, Clock } from 'lucide-react';

interface VideoInfoProps {
  selectedFile: File | null;
  videoDimensions: { width: number; height: number };
  videoDuration: number;
  videoAspectRatio: string;
  subtitlesEnabled: boolean;
  brollsEnabled: boolean;
  onSubtitlesChange: (enabled: boolean) => void;
  onBrollsChange: (enabled: boolean) => void;
  onGenerate: () => void;
  // Processing results
  transcript?: string;
  wordsCount?: number;
  segmentsCount?: number;
  keywordsCount?: number;
  brollImagesCount?: number;
}

export const VideoInfo: React.FC<VideoInfoProps> = ({
  selectedFile,
  videoDimensions,
  videoDuration,
  videoAspectRatio,
  subtitlesEnabled,
  brollsEnabled,
  onSubtitlesChange,
  onBrollsChange,
  onGenerate,
  transcript,
  wordsCount = 0,
  segmentsCount = 0,
  keywordsCount = 0,
  brollImagesCount = 0
}) => {
  const formatDuration = (seconds: number): string => {
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const getFileFormat = (filename: string): string => {
    const extension = filename.split('.').pop()?.toLowerCase();
    return extension?.toUpperCase() || 'UNKNOWN';
  };

  const hasProcessedData = transcript && transcript.length > 0;

  return (
    <div className="absolute top-0 left-full ml-4 w-[300px] flex items-center justify-center gap-2 flex-col">
      {/* Video Info */}
      <div className="w-full bg-neutral-800 p-3 rounded-xl">
        <span className="text-sm text-neutral-200">Video Info</span>
        <div className="grid grid-cols-2 gap-2 mt-2">
          <span className="text-sm text-neutral-400">name:</span>
          <p title={selectedFile?.name || 'video-file.mp4'} className="text-sm text-neutral-200 truncate">
            {selectedFile?.name || 'video-file.mp4'}
          </p>
          <span className="text-sm text-neutral-400">size:</span>
          <p className="text-sm text-neutral-200 truncate">
            {selectedFile ? `${(selectedFile.size / (1024 * 1024)).toFixed(1)} MB` : '3.2 MB'}
          </p>
          <span className="text-sm text-neutral-400">resolution:</span>
          <p className="text-sm text-neutral-200 truncate">
            {videoDimensions.width > 0 ? `${videoDimensions.width}×${videoDimensions.height}` : '1920×1080'}
          </p>
          <span className="text-sm text-neutral-400">duration:</span>
          <p className="text-sm text-neutral-200 truncate">
            {videoDuration > 0 ? formatDuration(videoDuration) : '2:34'}
          </p>
          <span className="text-sm text-neutral-400">format:</span>
          <p className="text-sm text-neutral-200 truncate">
            {selectedFile ? getFileFormat(selectedFile.name) : 'MP4'}
          </p>
          <span className="text-sm text-neutral-400">aspect:</span>
          <p className="text-sm text-neutral-200 truncate">
            {videoAspectRatio}
          </p>
        </div>
      </div>

      {/* Processing Results */}
      {hasProcessedData && (
        <div className="w-full bg-neutral-800 p-3 rounded-xl">
          <span className="text-sm text-neutral-200">Processing Results</span>
          <div className="space-y-3 mt-2">
            <div className="flex items-center justify-between">
              <div className="flex items-center">
                <FileText size={16} className="text-neutral-400 mr-2" />
                <span className="text-sm text-neutral-400">Words:</span>
              </div>
              <span className="text-sm text-neutral-200">{wordsCount}</span>
            </div>
            <div className="flex items-center justify-between">
              <div className="flex items-center">
                <MessageSquare size={16} className="text-neutral-400 mr-2" />
                <span className="text-sm text-neutral-400">Segments:</span>
              </div>
              <span className="text-sm text-neutral-200">{segmentsCount}</span>
            </div>
            <div className="flex items-center justify-between">
              <div className="flex items-center">
                <Clock size={16} className="text-neutral-400 mr-2" />
                <span className="text-sm text-neutral-400">Keywords:</span>
              </div>
              <span className="text-sm text-neutral-200">{keywordsCount}</span>
            </div>
            <div className="flex items-center justify-between">
              <div className="flex items-center">
                <Image size={16} className="text-neutral-400 mr-2" />
                <span className="text-sm text-neutral-400">B-roll images:</span>
              </div>
              <span className="text-sm text-neutral-200">{brollImagesCount}</span>
            </div>
          </div>
        </div>
      )}

      {/* Settings */}
      <div className="w-full bg-neutral-800 p-2 rounded-xl flex flex-col gap-2">
        <div className="flex items-center justify-between p-3 bg-neutral-700/70 rounded-lg">
          <div className="flex flex-col">
            <label htmlFor="transcribe" className="text-sm text-neutral-200">Subtitles</label>
            <span className="text-[12px] text-neutral-400">
              {subtitlesEnabled && hasProcessedData ? `${segmentsCount} segments ready` : 'Add captions automatically'}
            </span>
          </div>
          <Switch 
            id="transcribe" 
            checked={subtitlesEnabled}
            onCheckedChange={onSubtitlesChange}
          />
        </div>
        <div className="flex items-center justify-between p-3 bg-neutral-700/70 rounded-lg">
          <div className="flex flex-col">
            <label htmlFor="brolls" className="text-sm text-neutral-200">B-rolls</label>
            <span className="text-[12px] text-neutral-400">
              {brollsEnabled && hasProcessedData ? `${brollImagesCount} images ready` : 'Add supplementary images'}
            </span>
          </div>
          <Switch 
            id="brolls" 
            checked={brollsEnabled}
            onCheckedChange={onBrollsChange}
          />
        </div>
      </div>

      {/* Generate Button */}
      <div className="w-full p-2 bg-neutral-800 rounded-xl flex items-center justify-center">
        <Button 
          size="lg" 
          className="w-full" 
          onClick={onGenerate}
          disabled={!hasProcessedData}
        >
          <IoSparkles className="mr-2" />
          {hasProcessedData ? 'Open in Editor' : 'Processing...'}
        </Button>
      </div>

      {/* Transcript Preview */}
      {hasProcessedData && transcript && (
        <div className="w-full bg-neutral-800 p-3 rounded-xl">
          <span className="text-sm text-neutral-200">Transcript Preview</span>
          <div className="mt-2 max-h-24 overflow-y-auto">
            <p className="text-xs text-neutral-400 leading-relaxed">
              {transcript.length > 200 ? `${transcript.substring(0, 200)}...` : transcript}
            </p>
          </div>
        </div>
      )}
    </div>
  );
};