// src/app/editor/page.tsx
'use client'
import React, { useState, useRef, useCallback } from "react";
import { useRouter } from 'next/navigation';
import axios from 'axios';

// Upload components
import { VideoUploadArea } from '@/components/video/VideoUploadArea';
import { VideoUploadProgress } from '@/components/video/VideoUploadProgress';
import { VideoPreview } from '@/components/video/VideoPreview';
import { VideoInfo } from '@/components/video/VideoInfo';

// Editor components
import SegmentCard from "@/components/editor/SegmentCard";
import VideoCard from "@/components/editor/VideoPreview";
import SegmentSetting from "@/components/editor/SegmentSetting";
import { Button } from "@/components/ui/button";
import SegmentStyle from "@/components/editor/SegmentStyle";
import SuggestionBox from "@/components/editor/SuggestionBox";
import HydrationWrapper from "@/components/HydrationWrapper";

// Types
interface Word {
  text: string;
  start: number;
  end: number;
}

interface Segment {
  text: string;
  start: number;
  end: number;
}

interface BrollImages {
  [keyword: string]: string | null;
}

interface RGBAColor {
  r: number;
  g: number;
  b: number;
  a: number;
}

interface SegmentData {
  id: string;
  type: 'subtitle' | 'broll';
  startTime: string;
  endTime: string;
  content: string;
  highlightedKeyword?: string;
  imageUrl?: string;
  isSelected: boolean;
}

interface StyleSettings {
  fontFamily: string;
  fontSize: string;
  fontWeight: string;
  color: RGBAColor;
  textAlign: 'left' | 'center' | 'right';
  backgroundColor?: RGBAColor;
  borderRadius?: number;
  padding?: number;
  margin?: number;
}

interface EditorSettings {
  wordCount: 3 | 5 | 7;
  autoSave: boolean;
  previewMode: boolean;
  showTimestamps: boolean;
  snapToGrid: boolean;
}

interface ProjectData {
  id: string;
  name: string;
  videoUrl?: string;
  duration?: number;
  segments: SegmentData[];
  globalStyle: StyleSettings;
  settings: EditorSettings;
  originalFile?: File;
  metadata?: {
    originalFile?: string;
    transcript?: string;
    words?: Word[];
    segments?: Segment[];
    keywords?: string[];
    brollImages?: BrollImages;
    subtitlesEnabled?: boolean;
    brollsEnabled?: boolean;
  };
}

// Default values
const defaultStyle: StyleSettings = {
  fontFamily: 'Inter',
  fontSize: '16',
  fontWeight: '500',
  color: { r: 255, g: 255, b: 255, a: 1 },
  textAlign: 'center',
  backgroundColor: { r: 0, g: 0, b: 0, a: 0.8 },
  borderRadius: 8,
  padding: 12,
  margin: 4,
};

const defaultSettings: EditorSettings = {
  wordCount: 3,
  autoSave: true,
  previewMode: false,
  showTimestamps: true,
  snapToGrid: false,
};

// Utility functions
const generateId = () => `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;

const timeToSeconds = (timeStr: string): number => {
  const [minutes, seconds] = timeStr.split(':').map(Number);
  return minutes * 60 + seconds;
};

const formatTime = (seconds: number): string => {
  const mins = Math.floor(seconds / 60);
  const secs = Math.floor(seconds % 60);
  return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
};

const splitTextByWordCount = (text: string, maxWords: number): string[] => {
  const words = text.split(' ').filter(word => word.trim().length > 0);
  const chunks: string[] = [];
  
  for (let i = 0; i < words.length; i += maxWords) {
    chunks.push(words.slice(i, i + maxWords).join(' '));
  }
  
  return chunks.length > 0 ? chunks : [text];
};

const processSegmentsWithWordCount = (segments: SegmentData[], wordCount: number): SegmentData[] => {
  return segments.flatMap(segment => {
    if (segment.type !== 'subtitle') return [segment];
    
    const chunks = splitTextByWordCount(segment.content, wordCount);
    if (chunks.length === 1) return [segment];
    
    const startTime = timeToSeconds(segment.startTime);
    const endTime = timeToSeconds(segment.endTime);
    const duration = endTime - startTime;
    const segmentDuration = duration / chunks.length;

    return chunks.map((chunk, index) => {
      const segmentStartTime = startTime + (index * segmentDuration);
      const segmentEndTime = segmentStartTime + segmentDuration;
      
      return {
        ...segment,
        id: index === 0 ? segment.id : `${segment.id}-chunk-${index}`,
        content: chunk,
        startTime: formatTime(segmentStartTime),
        endTime: formatTime(segmentEndTime),
        highlightedKeyword: chunk.toLowerCase().includes(segment.highlightedKeyword?.toLowerCase() || '') 
          ? segment.highlightedKeyword 
          : undefined
      };
    });
  });
};

function CombinedVideoEditorPage() {
  // Upload state
  const [mode, setMode] = useState<'upload' | 'editor'>('upload');
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
  const [subtitlesEnabled, setSubtitlesEnabled] = useState(true);
  const [brollsEnabled, setBrollsEnabled] = useState(true);
  
  // Backend data
  const [transcript, setTranscript] = useState('');
  const [words, setWords] = useState<Word[]>([]);
  const [segments, setSegments] = useState<Segment[]>([]);
  const [keywords, setKeywords] = useState<string[]>([]);
  const [brollImages, setBrollImages] = useState<BrollImages>({});
  const [error, setError] = useState<string | null>(null);
  const [currentProcessStep, setCurrentProcessStep] = useState('');

  // Editor state
  const [currentProject, setCurrentProject] = useState<ProjectData | null>(null);
  const [selectedSegmentId, setSelectedSegmentId] = useState<string | null>(null);
  const [isExporting, setIsExporting] = useState(false);
  const [exportProgress, setExportProgress] = useState(0);
  const [currentStyle, setCurrentStyle] = useState<StyleSettings>(defaultStyle);
  const [editorSettings, setEditorSettings] = useState<EditorSettings>(defaultSettings);
  const [suggestions, setSuggestions] = useState<string[]>([]);

  const fileInputRef = useRef<HTMLInputElement>(null);
  const videoRef = useRef<HTMLVideoElement>(null);

  const baseUrl = "https://aivideo-production-2603.up.railway.app";

  // Determine aspect ratio based on video dimensions
  const getAspectRatio = (width: number, height: number): string => {
    const ratio = width / height;
    if (Math.abs(ratio - 16 / 9) < 0.1) return '16/9';
    if (Math.abs(ratio - 9 / 16) < 0.1) return '9/16';
    if (Math.abs(ratio - 1) < 0.1) return '1/1';
    if (Math.abs(ratio - 4 / 3) < 0.1) return '4/3';
    if (Math.abs(ratio - 3 / 4) < 0.1) return '3/4';
    if (Math.abs(ratio - 21 / 9) < 0.1) return '21/9';
    if (Math.abs(ratio - 2 / 1) < 0.1) return '2/1';
    if (Math.abs(ratio - 3 / 2) < 0.1) return '3/2';
    if (Math.abs(ratio - 2 / 3) < 0.1) return '2/3';
    if (ratio > 1.5) return '16/9';
    if (ratio > 0.8) return '4/3';
    return '9/16';
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
    processVideo(file);
  }, []);

  // Handle drag state changes
  const handleDragStateChange = useCallback((active: boolean) => {
    setDragActive(active);
  }, []);

  // Process video with backend
  const processVideo = async (file: File) => {
    try {
      setError(null);
      setUploadProgress(0);
      setCurrentProcessStep('Uploading and transcribing...');

      // Step 1: Transcribe
      const formData = new FormData();
      formData.append("file", file);

      const transcribeResponse = await axios.post(`${baseUrl}/transcribe`, formData, {
        headers: { "Content-Type": "multipart/form-data" },
        timeout: 300000,
        onUploadProgress: (progressEvent) => {
          if (progressEvent.total) {
            const progress = Math.round((progressEvent.loaded * 100) / progressEvent.total);
            setUploadProgress(Math.min(progress, 25));
          }
        },
      });

      setTranscript(transcribeResponse.data.text);
      setWords(transcribeResponse.data.words || []);
      setSegments(transcribeResponse.data.segments || []);
      setUploadProgress(30);

      if (!subtitlesEnabled && !brollsEnabled) {
        setUploadProgress(100);
        setTimeout(() => setStep(3), 500);
        return;
      }

      if (subtitlesEnabled && brollsEnabled) {
        // Step 2: Extract keywords
        setCurrentProcessStep('Extracting keywords...');
        const keywordsResponse = await axios.post(`${baseUrl}/extract-keywords`, {
          transcript: transcribeResponse.data.text,
        });

        setKeywords(keywordsResponse.data.keywords);
        setUploadProgress(60);

        // Step 3: Fetch B-roll images
        setCurrentProcessStep('Fetching B-roll images...');
        const brollResponse = await axios.post(`${baseUrl}/broll-images`, {
          keywords: keywordsResponse.data.keywords,
        });

        setBrollImages(brollResponse.data.images);
        setUploadProgress(90);
      } else if (brollsEnabled) {
        setCurrentProcessStep('Extracting keywords for B-roll...');
        const keywordsResponse = await axios.post(`${baseUrl}/extract-keywords`, {
          transcript: transcribeResponse.data.text,
        });

        setKeywords(keywordsResponse.data.keywords);
        setUploadProgress(70);

        setCurrentProcessStep('Fetching B-roll images...');
        const brollResponse = await axios.post(`${baseUrl}/broll-images`, {
          keywords: keywordsResponse.data.keywords,
        });

        setBrollImages(brollResponse.data.images);
        setUploadProgress(90);
      }

      setUploadProgress(100);
      setCurrentProcessStep('Processing complete!');
      setTimeout(() => setStep(3), 500);

    } catch (err: any) {
      const errorMsg = err.response?.data?.details || err.message || "Processing failed";
      setError(`Processing failed: ${errorMsg}`);
      console.error("Processing error:", err);
      setUploadProgress(0);
    }
  };

  // Convert to editor format
  const convertToEditorFormat = () => {
    const editorSegments = [];

    // Add subtitle segments
    if (subtitlesEnabled && segments.length > 0) {
      segments.forEach((segment) => {
        const segmentKeywords = keywords.filter(keyword => 
          segment.text.toLowerCase().includes(keyword.toLowerCase())
        );
        
        const highlightedKeyword = segmentKeywords.length > 0 ? segmentKeywords[0] : undefined;

        editorSegments.push({
          id: `subtitle-${Date.now()}-${Math.random()}`,
          type: 'subtitle' as const,
          startTime: formatTime(segment.start),
          endTime: formatTime(segment.end),
          content: segment.text,
          highlightedKeyword,
          isSelected: false
        });
      });
    }

    // Add B-roll segments based on keywords
    if (brollsEnabled && keywords.length > 0) {
      keywords.forEach((keyword) => {
        const imageUrl = brollImages[keyword];
        if (imageUrl) {
          const segmentWithKeyword = segments.find(seg => 
            seg.text.toLowerCase().includes(keyword.toLowerCase())
          );

          if (segmentWithKeyword) {
            editorSegments.push({
              id: `broll-${Date.now()}-${Math.random()}`,
              type: 'broll' as const,
              startTime: formatTime(segmentWithKeyword.start),
              endTime: formatTime(segmentWithKeyword.end),
              content: keyword,
              imageUrl,
              isSelected: false
            });
          }
        }
      });
    }

    return editorSegments;
  };

  const formatTimeFromSeconds = (seconds: number): string => {
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  // Handle generate button click - switch to editor mode
  const handleGenerate = useCallback(async () => {
    try {
      // Create project
      const projectName = selectedFile?.name?.replace(/\.[^/.]+$/, "") || `Project ${Date.now()}`;
      const editorSegments = convertToEditorFormat();

      const newProject: ProjectData = {
        id: generateId(),
        name: projectName,
        videoUrl: videoUrl,
        duration: videoDuration,
        segments: editorSegments,
        globalStyle: { ...defaultStyle },
        settings: { ...defaultSettings },
        originalFile: selectedFile || undefined,
        metadata: {
          originalFile: selectedFile?.name,
          transcript,
          words,
          segments,
          keywords,
          brollImages,
          subtitlesEnabled,
          brollsEnabled
        }
      };

      setCurrentProject(newProject);
      setCurrentStyle(newProject.globalStyle);
      setEditorSettings(newProject.settings);
      setSelectedSegmentId(null);

      // Switch to editor mode
      setMode('editor');
    } catch (error) {
      console.error('Error creating project:', error);
      setError('Failed to create project. Please try again.');
    }
  }, [selectedFile, videoUrl, videoDuration, transcript, words, keywords, brollImages, subtitlesEnabled, brollsEnabled]);

  // Editor Actions
  const addSegment = useCallback((segment: Omit<SegmentData, 'id'>) => {
    if (currentProject) {
      const newSegment: SegmentData = {
        ...segment,
        id: generateId(),
      };
      const updatedProject = {
        ...currentProject,
        segments: [...currentProject.segments, newSegment]
      };
      setCurrentProject(updatedProject);
      setSelectedSegmentId(newSegment.id);
    }
  }, [currentProject]);

  const updateSegment = useCallback((id: string, updates: Partial<SegmentData>) => {
    if (currentProject) {
      const updatedSegments = currentProject.segments.map(segment =>
        segment.id === id ? { ...segment, ...updates } : segment
      );
      setCurrentProject({ ...currentProject, segments: updatedSegments });
    }
  }, [currentProject]);

  const deleteSegment = useCallback((id: string) => {
    if (currentProject) {
      const updatedSegments = currentProject.segments.filter(segment => segment.id !== id);
      setCurrentProject({ ...currentProject, segments: updatedSegments });
      if (selectedSegmentId === id) {
        setSelectedSegmentId(null);
      }
    }
  }, [currentProject, selectedSegmentId]);

  const selectSegment = useCallback((id: string | null) => {
    if (currentProject) {
      const updatedSegments = currentProject.segments.map(segment => ({
        ...segment,
        isSelected: segment.id === id
      }));
      setCurrentProject({ ...currentProject, segments: updatedSegments });
    }
    setSelectedSegmentId(id);
  }, [currentProject]);

  const duplicateSegment = useCallback((id: string) => {
    if (currentProject) {
      const segment = currentProject.segments.find(s => s.id === id);
      if (segment) {
        const duplicated: SegmentData = {
          ...segment,
          id: generateId(),
          isSelected: false,
        };
        const index = currentProject.segments.findIndex(s => s.id === id);
        const updatedSegments = [...currentProject.segments];
        updatedSegments.splice(index + 1, 0, duplicated);
        setCurrentProject({ ...currentProject, segments: updatedSegments });
      }
    }
  }, [currentProject]);

  const updateStyle = useCallback((updates: Partial<StyleSettings>) => {
    setCurrentStyle(prev => ({ ...prev, ...updates }));
    if (currentProject) {
      setCurrentProject(prev => prev ? { ...prev, globalStyle: { ...prev.globalStyle, ...updates } } : null);
    }
  }, [currentProject]);

  const updateSettings = useCallback((updates: Partial<EditorSettings>) => {
    setEditorSettings(prev => ({ ...prev, ...updates }));
    if (currentProject) {
      setCurrentProject(prev => prev ? { ...prev, settings: { ...prev.settings, ...updates } } : null);
    }
  }, [currentProject]);

  // Export functionality
  const exportVideo = useCallback(async (): Promise<string | null> => {
    if (!currentProject || !currentProject.metadata || !currentProject.originalFile) {
      throw new Error('Missing required data for export. Please re-upload your video.');
    }

    try {
      setIsExporting(true);
      setExportProgress(0);

      const formData = new FormData();
      
      // Add original file
      formData.append("file", currentProject.originalFile);
      formData.append("transcript", currentProject.metadata.transcript || '');
      formData.append("words", JSON.stringify(currentProject.metadata.words || []));
      formData.append("keywords", JSON.stringify(currentProject.metadata.keywords || []));
      formData.append("broll_images", JSON.stringify(currentProject.metadata.brollImages || {}));
      formData.append("words_per_subtitle", editorSettings.wordCount.toString());
      
      // Add style settings
      formData.append("font_family", currentStyle.fontFamily);
      formData.append("font_size", currentStyle.fontSize);
      formData.append("font_weight", currentStyle.fontWeight);
      formData.append("font_color", JSON.stringify(currentStyle.color));

      const response = await fetch(`${baseUrl}/generate-video`, {
        method: 'POST',
        body: formData,
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.detail || 'Export failed');
      }

      const result = await response.json();
      const videoUrl = `${baseUrl}/download-video/${result.video_filename}`;
      
      setExportProgress(100);
      setIsExporting(false);
      
      // Reset progress after delay
      setTimeout(() => {
        setExportProgress(0);
      }, 2000);
      
      return videoUrl;
      
    } catch (error) {
      console.error('Export failed:', error);
      setIsExporting(false);
      setExportProgress(0);
      throw error;
    }
  }, [currentProject, editorSettings, currentStyle]);

  // Get processed segments with word count
  const getProcessedSegments = useCallback(() => {
    if (!currentProject?.segments) return [];
    return processSegmentsWithWordCount(currentProject.segments, editorSettings.wordCount);
  }, [currentProject?.segments, editorSettings.wordCount]);

  // Reset to upload mode
  const resetToUpload = useCallback(() => {
    setMode('upload');
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
    setSubtitlesEnabled(true);
    setBrollsEnabled(true);
    setTranscript('');
    setWords([]);
    setSegments([]);
    setKeywords([]);
    setBrollImages({});
    setError(null);
    setCurrentProcessStep('');
    
    // Reset editor state
    setCurrentProject(null);
    setSelectedSegmentId(null);
    setIsExporting(false);
    setExportProgress(0);
    setCurrentStyle(defaultStyle);
    setEditorSettings(defaultSettings);
    setSuggestions([]);
    
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  }, []);

  // Create a custom ExportButton component to replace the imported one
  const CustomExportButton = () => {
    const [exportError, setExportError] = useState<string | null>(null);
    const [videoExportUrl, setVideoExportUrl] = useState<string | null>(null);

    const handleExport = async () => {
      try {
        setExportError(null);
        setVideoExportUrl(null);
        
        if (!currentProject?.metadata) {
          setExportError('No project data available. Please upload a video first.');
          return;
        }

        if (!currentProject?.originalFile) {
          setExportError('Original video file is missing. Please re-upload your video to enable export.');
          return;
        }

        const resultUrl = await exportVideo();
        
        if (resultUrl) {
          setVideoExportUrl(resultUrl);
          // Automatically download the video
          const link = document.createElement('a');
          link.href = resultUrl;
          link.download = `${currentProject.name}.mp4`;
          document.body.appendChild(link);
          link.click();
          document.body.removeChild(link);
        } else {
          setExportError('Export failed. Please try again.');
        }
      } catch (err: any) {
        console.error('Export error:', err);
        
        let errorMessage = 'Export failed. Please try again.';
        
        if (err.message?.includes('Missing required data')) {
          errorMessage = 'Missing required data for export. Please re-upload your video.';
        } else if (err.message?.includes('network') || err.message?.includes('fetch')) {
          errorMessage = 'Network error. Please check your connection and try again.';
        } else if (err.message?.includes('timeout')) {
          errorMessage = 'Export timed out. Please try again with a shorter video.';
        } else if (err.message) {
          errorMessage = err.message;
        }
        
        setExportError(errorMessage);
      }
    };

    const canExport = currentProject?.metadata && currentProject?.originalFile && !isExporting;

    return (
      <div className='p-3 rounded-2xl flex flex-col gap-2 bg-neutral-800'>
        {/* Export Button */}
        <div className="flex flex-row items-center justify-between">
          <span className='text-sm text-neutral-400'>Export the video</span>
          <Button 
            disabled={!canExport} 
            onClick={handleExport} 
            size={'lg'} 
            className="bg-white/90 hover:bg-white/80 text-neutral-800 disabled:opacity-50"
          >
            {isExporting ? 
              <div className='flex relative items-center justify-center'>
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-neutral-800" />
                <span className="ml-2">Export</span>
              </div> 
              : 'Export'
            }
          </Button>
        </div>

        {/* Progress Bar */}
        {isExporting && (
          <div className="space-y-2">
            <div className="w-full bg-neutral-700 rounded-full h-2">
              <div
                className="bg-blue-500 h-2 rounded-full transition-all duration-300"
                style={{ width: `${exportProgress}%` }}
              />
            </div>
            <div className="text-xs text-neutral-400 text-center">
              Exporting... {exportProgress}%
            </div>
          </div>
        )}

        {/* Error Message */}
        {exportError && (
          <div className="flex items-start gap-2 p-2 bg-red-900/20 border border-red-500/30 rounded-lg">
            <div className="text-red-400 text-sm font-medium">Export Failed</div>
            <div className="text-red-300 text-xs mt-1">{exportError}</div>
          </div>
        )}

        {/* Success Message */}
        {videoExportUrl && !isExporting && (
          <div className="flex items-center justify-between p-2 bg-green-900/20 border border-green-500/30 rounded-lg">
            <div>
              <div className="text-green-400 text-sm font-medium">Export Complete!</div>
              <div className="text-green-300 text-xs mt-1">Video downloaded successfully</div>
            </div>
          </div>
        )}

        {/* Export Info/Status */}
        {!currentProject?.metadata && (
          <div className="text-xs text-neutral-500 text-center">
            Upload a video to enable export
          </div>
        )}
        
        {currentProject?.metadata && !currentProject?.originalFile && (
          <div className="flex items-center justify-center gap-2 p-2 bg-yellow-900/20 border border-yellow-500/30 rounded-lg">
            <div className="text-yellow-300 text-xs">
              Original file missing - export disabled
            </div>
          </div>
        )}

        {canExport && (
          <div className="text-xs text-neutral-400 text-center">
            Ready to export with current settings
          </div>
        )}
      </div>
    );
  };

  // Upload mode rendering
  if (mode === 'upload') {
    if (step === 1) {
      return (
        <div className='w-full h-screen bg-neutral-900 flex items-center justify-center'>
          <VideoUploadArea
            dragActive={dragActive}
            onFileSelect={handleFileSelect}
            onDragStateChange={handleDragStateChange}
            fileInputRef={fileInputRef}
          />
        </div>
      );
    }

    if (step === 2) {
      return (
        <div className='w-full h-screen bg-neutral-900 flex items-center justify-center'>
          <VideoUploadProgress
            selectedFile={selectedFile}
            uploadProgress={uploadProgress}
            currentStep={currentProcessStep}
            error={error}
            onRetry={() => {
              if (selectedFile) {
                processVideo(selectedFile);
              }
            }}
            onCancel={resetToUpload}
          />
        </div>
      );
    }

    if (step === 3) {
      return (
        <div className='w-full h-screen bg-neutral-900 flex items-center justify-center'>
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
              onReset={resetToUpload}
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
              transcript={transcript}
              wordsCount={words.length}
              segmentsCount={segments.length}
              keywordsCount={keywords.length}
              brollImagesCount={Object.values(brollImages).filter(Boolean).length}
            />
          </div>
        </div>
      );
    }
  }

  // Editor mode rendering
  if (mode === 'editor') {
    // Create context object to pass to child components
    const editorContext = {
      // Project data
      currentProject,
      selectedSegmentId,
      segments: currentProject?.segments || [],
      processedSegments: getProcessedSegments(),
      
      // Style and settings
      currentStyle,
      editorSettings,
      
      // State
      isExporting,
      exportProgress,
      suggestions,
      
      // Actions
      addSegment,
      updateSegment,
      deleteSegment,
      selectSegment,
      duplicateSegment,
      updateStyle,
      updateSettings,
      exportVideo,
      
      // Utilities
      formatTime: formatTimeFromSeconds,
      generateId,
    };

    return (
      <HydrationWrapper>
        <div className="grid grid-cols-9 grid-rows-5 bg-neutral-900 min-h-screen overflow-hidden h-screen">
          {/* Content sidebar */}
          <div className="col-span-2 row-span-5 bg-neutral-800 border-r border-neutral-700">
            <div className="flex items-center justify-between px-4 pt-3">
              <h1 className="text-2xl text-white">Layers</h1>
              <Button
                variant="outline"
                size="sm"
                onClick={resetToUpload}
                className="text-xs"
              >
                New Video
              </Button>
            </div>
            <hr className="mt-4 border-neutral-700" />
            <div className="px-3 pt-4 overflow-y-auto h-screen MyScrollbar">
              {/* Custom SegmentCard that uses local state */}
              <div className="space-y-2">
                {editorContext.processedSegments.map((segment, index) => (
                  <div
                    key={segment.id}
                    className={`p-3 rounded-lg cursor-pointer transition-all duration-200 ${
                      segment.isSelected 
                        ? 'bg-blue-600/20 border border-blue-500/50' 
                        : 'bg-neutral-700/50 hover:bg-neutral-700/70'
                    }`}
                    onClick={() => selectSegment(segment.id)}
                  >
                    <div className="flex items-center justify-between mb-2">
                      <span className={`px-2 py-1 rounded text-xs font-medium ${
                        segment.type === 'subtitle' 
                          ? 'bg-green-500/20 text-green-400' 
                          : 'bg-purple-500/20 text-purple-400'
                      }`}>
                        {segment.type === 'subtitle' ? 'Subtitle' : 'B-roll'}
                      </span>
                      <span className="text-xs text-neutral-400">
                        {segment.startTime} - {segment.endTime}
                      </span>
                    </div>
                    
                    <p className="text-sm text-neutral-200 line-clamp-2">
                      {segment.content}
                    </p>
                    
                    {segment.highlightedKeyword && (
                      <div className="mt-2">
                        <span className="text-xs text-blue-400 bg-blue-500/20 px-2 py-1 rounded">
                          {segment.highlightedKeyword}
                        </span>
                      </div>
                    )}
                    
                    {segment.imageUrl && (
                      <div className="mt-2">
                        <img 
                          src={segment.imageUrl} 
                          alt={segment.content}
                          className="w-full h-20 object-cover rounded"
                        />
                      </div>
                    )}
                    
                    <div className="flex gap-2 mt-2">
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          duplicateSegment(segment.id);
                        }}
                        className="text-xs text-neutral-400 hover:text-neutral-200 px-2 py-1 hover:bg-neutral-600 rounded"
                      >
                        Duplicate
                      </button>
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          deleteSegment(segment.id);
                        }}
                        className="text-xs text-red-400 hover:text-red-300 px-2 py-1 hover:bg-red-500/20 rounded"
                      >
                        Delete
                      </button>
                    </div>
                  </div>
                ))}
                
                {editorContext.processedSegments.length === 0 && (
                  <div className="text-center text-neutral-400 py-8">
                    <p>No segments available</p>
                    <p className="text-sm mt-2">Upload a video to get started</p>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Video preview area */}
          <div className="col-span-5 row-span-5 col-start-3 flex items-center justify-center">
            {/* Custom VideoCard that uses local state */}
            <div className="w-full h-full flex items-center justify-center p-4">
              {currentProject?.videoUrl ? (
                <div className="relative max-w-full max-h-full">
                  <video
                    ref={videoRef}
                    src={currentProject.videoUrl}
                    onLoadedMetadata={handleVideoLoad}
                    onPlay={handleVideoPlay}
                    onPause={handleVideoPause}
                    className="w-full h-full object-contain cursor-pointer rounded-lg"
                    onClick={togglePlay}
                    muted={isMuted}
                    style={{ aspectRatio: videoAspectRatio }}
                  >
                    Your browser does not support the video tag.
                  </video>
                  
                  {/* Video Controls Overlay */}
                  <div className="absolute inset-0 opacity-0 hover:opacity-100 transition-opacity duration-200 bg-black/10 rounded-lg">
                    <div className="absolute inset-0 flex items-center justify-center">
                      <button
                        onClick={togglePlay}
                        className="w-16 h-16 bg-black/60 hover:bg-black/80 border-0 rounded-full backdrop-blur-sm shadow-lg transition-all duration-200 hover:scale-110 flex items-center justify-center"
                      >
                        {isPlaying ? (
                          <svg className="w-6 h-6 text-white" fill="currentColor" viewBox="0 0 24 24">
                            <path d="M6 4h4v16H6V4zm8 0h4v16h-4V4z" />
                          </svg>
                        ) : (
                          <svg className="w-6 h-6 text-white ml-1" fill="currentColor" viewBox="0 0 24 24">
                            <path d="M8 5v14l11-7z" />
                          </svg>
                        )}
                      </button>
                    </div>
                  </div>
                </div>
              ) : (
                <div className="flex items-center justify-center h-64 w-full bg-neutral-800 rounded-lg">
                  <p className="text-neutral-400">No video loaded</p>
                </div>
              )}
            </div>
          </div>

          {/* Settings sidebar */}
          <div className="col-span-2 row-span-5 flex flex-col col-start-8 p-3">
            {/* Custom Export Button */}
            <CustomExportButton />
            
            <div className="mt-5">
              {/* Custom Segment Settings */}
              <div className="bg-neutral-800 rounded-2xl p-4 mb-4">
                <h3 className="text-white text-sm font-medium mb-3">Segment Settings</h3>
                
                <div className="space-y-3">
                  <div>
                    <label className="text-sm text-neutral-400 block mb-2">
                      Words per subtitle
                    </label>
                    <select
                      value={editorSettings.wordCount}
                      onChange={(e) => updateSettings({ wordCount: Number(e.target.value) as 3 | 5 | 7 })}
                      className="w-full bg-neutral-700 border border-neutral-600 rounded-lg px-3 py-2 text-white text-sm focus:outline-none focus:border-blue-500"
                    >
                      <option value={3}>3 words</option>
                      <option value={5}>5 words</option>
                      <option value={7}>7 words</option>
                    </select>
                  </div>
                  
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-neutral-400">Show timestamps</span>
                    <button
                      onClick={() => updateSettings({ showTimestamps: !editorSettings.showTimestamps })}
                      className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                        editorSettings.showTimestamps ? 'bg-blue-600' : 'bg-neutral-600'
                      }`}
                    >
                      <span
                        className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                          editorSettings.showTimestamps ? 'translate-x-6' : 'translate-x-1'
                        }`}
                      />
                    </button>
                  </div>
                </div>
              </div>

              {/* Custom Style Settings */}
              <div className="bg-neutral-800 rounded-2xl p-4 mb-4">
                <h3 className="text-white text-sm font-medium mb-3">Style Settings</h3>
                
                <div className="space-y-3">
                  <div>
                    <label className="text-sm text-neutral-400 block mb-2">
                      Font Family
                    </label>
                    <select
                      value={currentStyle.fontFamily}
                      onChange={(e) => updateStyle({ fontFamily: e.target.value })}
                      className="w-full bg-neutral-700 border border-neutral-600 rounded-lg px-3 py-2 text-white text-sm focus:outline-none focus:border-blue-500"
                    >
                      <option value="Inter">Inter</option>
                      <option value="Arial">Arial</option>
                      <option value="Helvetica">Helvetica</option>
                      <option value="Times New Roman">Times New Roman</option>
                      <option value="Georgia">Georgia</option>
                    </select>
                  </div>
                  
                  <div>
                    <label className="text-sm text-neutral-400 block mb-2">
                      Font Size: {currentStyle.fontSize}px
                    </label>
                    <input
                      type="range"
                      min="12"
                      max="32"
                      value={currentStyle.fontSize}
                      onChange={(e) => updateStyle({ fontSize: e.target.value })}
                      className="w-full accent-blue-500"
                    />
                  </div>
                  
                  <div>
                    <label className="text-sm text-neutral-400 block mb-2">
                      Text Align
                    </label>
                    <div className="flex gap-2">
                      {['left', 'center', 'right'].map((align) => (
                        <button
                          key={align}
                          onClick={() => updateStyle({ textAlign: align as 'left' | 'center' | 'right' })}
                          className={`flex-1 px-3 py-2 rounded-lg text-sm transition-colors ${
                            currentStyle.textAlign === align
                              ? 'bg-blue-600 text-white'
                              : 'bg-neutral-700 text-neutral-300 hover:bg-neutral-600'
                          }`}
                        >
                          {align.charAt(0).toUpperCase() + align.slice(1)}
                        </button>
                      ))}
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Custom Suggestions Box */}
            <div className="bg-neutral-800 rounded-2xl p-4 mt-auto">
              <h3 className="text-white text-sm font-medium mb-3">Suggestions</h3>
              {suggestions.length > 0 ? (
                <div className="space-y-2 max-h-32 overflow-y-auto">
                  {suggestions.map((suggestion, index) => (
                    <div key={index} className="text-sm text-neutral-300 p-2 bg-neutral-700/50 rounded">
                      {suggestion}
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-sm text-neutral-400">
                  No suggestions available. Try adjusting your settings or segments.
                </p>
              )}
            </div>
          </div>
        </div>
      </HydrationWrapper>
    );
  }

  return null;
}

export default CombinedVideoEditorPage;