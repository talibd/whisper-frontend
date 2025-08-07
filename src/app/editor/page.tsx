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
import ExportButton from "@/components/editor/ExportButton";
import SegmentStyle from "@/components/editor/SegmentStyle";
import SuggestionBox from "@/components/editor/SuggestionBox";
import HydrationWrapper from "@/components/HydrationWrapper";

import { useEditorActions, useCurrentProject } from '@/store/editorStore';

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

  const fileInputRef = useRef<HTMLInputElement>(null);
  const videoRef = useRef<HTMLVideoElement>(null);
  const { createProject, updateProject } = useEditorActions();
  const currentProject = useCurrentProject();

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

  const formatTime = (seconds: number): string => {
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  // Handle generate button click - switch to editor mode
  const handleGenerate = useCallback(async () => {
    try {
      // Create project in editor store
      const projectName = selectedFile?.name?.replace(/\.[^/.]+$/, "") || `Project ${Date.now()}`;
      createProject(projectName);

      // Convert data to editor format
      const editorSegments = convertToEditorFormat();

      // Update project with video data - include the actual file object
      updateProject({
        videoUrl: videoUrl,
        duration: videoDuration,
        segments: editorSegments,
        metadata: {
          originalFile: selectedFile?.name,
          originalFileObject: selectedFile, // Store the actual File object
          transcript,
          words,
          keywords,
          brollImages,
          subtitlesEnabled,
          brollsEnabled
        }
      });

      // Switch to editor mode
      setMode('editor');
    } catch (error) {
      console.error('Error creating project:', error);
      setError('Failed to create project. Please try again.');
    }
  }, [selectedFile, videoUrl, videoDuration, transcript, words, keywords, brollImages, subtitlesEnabled, brollsEnabled]);

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
    
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  }, []);

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
              <SegmentCard />
            </div>
          </div>

          {/* Video preview area */}
          <div className="col-span-5 row-span-5 col-start-3 flex items-center justify-center">
            <VideoCard />
          </div>

          {/* Settings sidebar */}
          <div className="col-span-2 row-span-5 flex flex-col col-start-8 p-3">
            <ExportButton />
            <div className="mt-5">
              <SegmentSetting />
              <SegmentStyle />
            </div>
            <SuggestionBox />
          </div>
        </div>
      </HydrationWrapper>
    );
  }

  return null;
}

export default CombinedVideoEditorPage;