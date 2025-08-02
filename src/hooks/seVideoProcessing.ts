// src/hooks/useVideoProcessing.ts - Custom hook for video processing workflow
import { useState, useCallback } from 'react';
import { apiService, TranscriptionResponse, KeywordsResponse, BrollResponse } from '@/lib/api';

export interface ProcessingState {
  step: 'idle' | 'transcribing' | 'extracting-keywords' | 'fetching-broll' | 'generating-video' | 'complete' | 'error';
  progress: number;
  error: string | null;
  transcription: TranscriptionResponse | null;
  keywords: string[] | null;
  brollImages: Record<string, string | null> | null;
  videoFilename: string | null;
}

export interface ProcessingOptions {
  enableSubtitles: boolean;
  enableBroll: boolean;
  wordsPerSubtitle: number;
  language?: string;
}

export const useVideoProcessing = () => {
  const [state, setState] = useState<ProcessingState>({
    step: 'idle',
    progress: 0,
    error: null,
    transcription: null,
    keywords: null,
    brollImages: null,
    videoFilename: null,
  });

  const updateState = useCallback((updates: Partial<ProcessingState>) => {
    setState(prev => ({ ...prev, ...updates }));
  }, []);

  const resetProcessing = useCallback(() => {
    setState({
      step: 'idle',
      progress: 0,
      error: null,
      transcription: null,
      keywords: null,
      brollImages: null,
      videoFilename: null,
    });
  }, []);

  const processVideo = useCallback(async (
    file: File, 
    options: ProcessingOptions
  ) => {
    try {
      updateState({ step: 'transcribing', progress: 10, error: null });

      // Step 1: Transcribe video (only if subtitles are enabled)
      let transcription: TranscriptionResponse | null = null;
      if (options.enableSubtitles) {
        transcription = await apiService.transcribeVideo(file, options.language);
        updateState({ transcription, progress: 30 });
      }

      // Step 2: Extract keywords (only if B-roll is enabled and we have transcription)
      let keywords: string[] = [];
      let brollImages: Record<string, string | null> = {};

      if (options.enableBroll && transcription?.text) {
        updateState({ step: 'extracting-keywords', progress: 40 });
        
        const keywordsResponse = await apiService.extractKeywords(transcription.text);
        keywords = keywordsResponse.keywords;
        updateState({ keywords, progress: 60 });

        // Step 3: Fetch B-roll images
        if (keywords.length > 0) {
          updateState({ step: 'fetching-broll', progress: 70 });
          
          const brollResponse = await apiService.fetchBrollImages(keywords);
          brollImages = brollResponse.images;
          updateState({ brollImages, progress: 80 });
        }
      }

      // Step 4: Generate final video
      updateState({ step: 'generating-video', progress: 85 });
      
      const videoResponse = await apiService.generateVideo(
        file,
        transcription?.text || '',
        transcription?.words || [],
        keywords,
        brollImages,
        options.wordsPerSubtitle
      );

      updateState({
        step: 'complete',
        progress: 100,
        videoFilename: videoResponse.video_filename,
      });

      return {
        transcription,
        keywords,
        brollImages,
        videoFilename: videoResponse.video_filename,
      };

    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Processing failed';
      updateState({
        step: 'error',
        error: errorMessage,
      });
      throw error;
    }
  }, [updateState]);

  const downloadVideo = useCallback(async (filename: string) => {
    try {
      const blob = await apiService.downloadVideo(filename);
      
      // Create download link
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = filename;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Download failed';
      updateState({ error: errorMessage });
      throw error;
    }
  }, [updateState]);

  return {
    state,
    processVideo,
    downloadVideo,
    resetProcessing,
  };
};