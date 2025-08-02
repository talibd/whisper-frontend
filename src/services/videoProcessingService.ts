// src/services/videoProcessingService.ts - Enhanced integration service
import { apiService } from '@/lib/api';

export interface ProcessingState {
  step: 'idle' | 'transcribing' | 'extracting-keywords' | 'fetching-broll' | 'generating-video' | 'complete' | 'error';
  progress: number;
  error: string | null;
  transcription: any | null;
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

export class VideoProcessingService {
  private onStateUpdate: (state: ProcessingState) => void;
  private state: ProcessingState;

  constructor(onStateUpdate: (state: ProcessingState) => void) {
    this.onStateUpdate = onStateUpdate;
    this.state = {
      step: 'idle',
      progress: 0,
      error: null,
      transcription: null,
      keywords: null,
      brollImages: null,
      videoFilename: null,
    };
  }

  private updateState(updates: Partial<ProcessingState>) {
    this.state = { ...this.state, ...updates };
    this.onStateUpdate(this.state);
  }

  async processVideo(file: File, options: ProcessingOptions): Promise<{
    transcription: any;
    keywords: string[];
    brollImages: Record<string, string | null>;
    videoFilename: string;
  }> {
    try {
      this.updateState({ step: 'transcribing', progress: 10, error: null });

      // Step 1: Transcribe video (only if subtitles are enabled)
      let transcription: any = null;
      if (options.enableSubtitles) {
        transcription = await apiService.transcribeVideo(file, options.language);
        this.updateState({ transcription, progress: 30 });
      }

      // Step 2: Extract keywords (only if B-roll is enabled and we have transcription)
      let keywords: string[] = [];
      let brollImages: Record<string, string | null> = {};

      if (options.enableBroll) {
        // If we have transcription, use it for keywords
        if (transcription?.text) {
          this.updateState({ step: 'extracting-keywords', progress: 40 });
          
          const keywordsResponse = await apiService.extractKeywords(transcription.text);
          keywords = keywordsResponse.keywords;
          this.updateState({ keywords, progress: 60 });
        } else {
          // Use fallback keywords if no transcription
          keywords = ['technology', 'innovation', 'business', 'development'];
          this.updateState({ keywords, progress: 60 });
        }

        // Step 3: Fetch B-roll images
        if (keywords.length > 0) {
          this.updateState({ step: 'fetching-broll', progress: 70 });
          
          const brollResponse = await apiService.fetchBrollImages(keywords);
          brollImages = brollResponse.images;
          this.updateState({ brollImages, progress: 80 });
        }
      }

      // Step 4: Generate final video
      this.updateState({ step: 'generating-video', progress: 85 });
      
      const videoResponse = await apiService.generateVideo(
        file,
        transcription?.text || '',
        transcription?.words || [],
        keywords,
        brollImages,
        options.wordsPerSubtitle
      );

      this.updateState({
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
      this.updateState({
        step: 'error',
        error: errorMessage,
      });
      throw error;
    }
  }

  async downloadVideo(filename: string): Promise<void> {
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
      this.updateState({ error: errorMessage });
      throw error;
    }
  }

  resetProcessing(): void {
    this.state = {
      step: 'idle',
      progress: 0,
      error: null,
      transcription: null,
      keywords: null,
      brollImages: null,
      videoFilename: null,
    };
    this.onStateUpdate(this.state);
  }

  getState(): ProcessingState {
    return { ...this.state };
  }
}