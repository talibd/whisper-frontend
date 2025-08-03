'use client';
import React from 'react';
import { Switch } from '@/components/ui/switch';
import { Button } from '@/components/ui/button';
import { IoSparkles } from "react-icons/io5";

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
  onGenerate
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

  return (
    <div className="absolute top-0 left-full ml-4 w-[300px] flex items-center justify-center gap-2 flex-col">
      {/* Video Info */}
      <div className="w-full bg-neutral-800 p-3 rounded-xl">
        <span className="text-sm text-neutral-200">info</span>
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

      {/* Settings */}
      <div className="w-full bg-neutral-800 p-2 rounded-xl flex flex-col gap-2">
        <div className="flex items-center justify-between p-3 bg-neutral-700/70 rounded-lg">
          <div className="flex flex-col">
            <label htmlFor="transcribe" className="text-sm text-neutral-200">subtitles</label>
            <span className="text-[12px] text-neutral-400">Add captions automatically</span>
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
            <span className="text-[12px] text-neutral-400">Add supplementary images.</span>
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
        <Button size="lg" className="w-full" onClick={onGenerate}>
          <IoSparkles className="mr-2" />
          Generate
        </Button>
      </div>
    </div>
  );
};