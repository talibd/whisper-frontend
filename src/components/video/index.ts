// src/components/video/index.ts
export { default as VideoUpload } from './VideoUpload';
export { VideoUploadArea } from './VideoUploadArea';
export { VideoUploadProgress } from './VideoUploadProgress';
export { VideoPreview } from './VideoPreview';
export { VideoControls } from './VideoControls';
export { VideoInfo } from './VideoInfo';
export { VideoLoadingOverlay } from './VideoLoadingOverlay';

// Types for the components
export interface VideoUploadAreaProps {
  dragActive: boolean;
  onFileSelect: (file: File) => void;
  onDragStateChange: (active: boolean) => void;
  fileInputRef: React.RefObject<HTMLInputElement>;
}

export interface VideoUploadProgressProps {
  selectedFile: File | null;
  uploadProgress: number;
}

export interface VideoLoadingOverlayProps {
  isVisible: boolean;
}

export interface VideoControlsProps {
  isPlaying: boolean;
  isMuted: boolean;
  isGenerating: boolean;
  onTogglePlay: () => void;
  onToggleMute: () => void;
}

export interface VideoInfoProps {
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

export interface VideoPreviewProps {
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