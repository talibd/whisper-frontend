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
      // Reset state
      this.updateState({ 
        step: 'transcribing', 
        progress: 10, 
        error: null,
        transcription: null,
        keywords: null,
        brollImages: null,
        videoFilename: null
      });

      // Step 1: Transcribe video (only if subtitles are enabled)
      let transcription: any = null;
      if (options.enableSubtitles) {
        console.log('Starting transcription...');
        transcription = await apiService.transcribeVideo(file, options.language);
        console.log('Transcription completed:', transcription);
        this.updateState({ transcription, progress: 30 });
      } else {
        this.updateState({ progress: 30 });
      }

      // Step 2: Extract keywords (only if B-roll is enabled)
      let keywords: string[] = [];
      let brollImages: Record<string, string | null> = {};

      if (options.enableBroll) {
        // If we have transcription, use it for keywords
        if (transcription?.text) {
          this.updateState({ step: 'extracting-keywords', progress: 40 });
          console.log('Extracting keywords from transcription...');
          
          try {
            const keywordsResponse = await apiService.extractKeywords(transcription.text);
            keywords = keywordsResponse.keywords;
            console.log('Keywords extracted:', keywords);
            this.updateState({ keywords, progress: 60 });
          } catch (keywordError) {
            console.warn('Keyword extraction failed, using fallback keywords:', keywordError);
            // Use fallback keywords if extraction fails
            keywords = this.extractFallbackKeywords(transcription.text);
            this.updateState({ keywords, progress: 60 });
          }
        } else {
          // Use default keywords if no transcription
          keywords = ['technology', 'innovation', 'business', 'development', 'digital'];
          console.log('Using default keywords:', keywords);
          this.updateState({ keywords, progress: 60 });
        }

        // Step 3: Fetch B-roll images
        if (keywords.length > 0) {
          this.updateState({ step: 'fetching-broll', progress: 70 });
          console.log('Fetching B-roll images for keywords...');
          
          try {
            const brollResponse = await apiService.fetchBrollImages(keywords);
            brollImages = brollResponse.images;
            console.log('B-roll images fetched:', brollImages);
            this.updateState({ brollImages, progress: 80 });
          } catch (brollError) {
            console.warn('B-roll fetch failed:', brollError);
            // Continue without B-roll images
            brollImages = {};
            this.updateState({ brollImages, progress: 80 });
          }
        }
      } else {
        this.updateState({ progress: 70 });
      }

      // Step 4: Generate final video (if backend processing is enabled)
      this.updateState({ step: 'generating-video', progress: 85 });
      console.log('Starting video generation...');
      
      try {
        const videoResponse = await apiService.generateVideo(
          file,
          transcription?.text || '',
          transcription?.words || [],
          keywords,
          brollImages,
          options.wordsPerSubtitle
        );

        console.log('Video generation completed:', videoResponse);
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
      } catch (videoError) {
        console.warn('Video generation failed, completing with processed data:', videoError);
        
        // If video generation fails, still return the processed data
        this.updateState({
          step: 'complete',
          progress: 100,
          error: null, // Clear any previous errors since we have partial success
        });

        return {
          transcription,
          keywords,
          brollImages,
          videoFilename: '',
        };
      }

    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Processing failed';
      console.error('Video processing error:', error);
      
      this.updateState({
        step: 'error',
        error: errorMessage,
      });
      throw error;
    }
  }

  private extractFallbackKeywords(text: string): string[] {
    // Simple keyword extraction as fallback
    const words = text.toLowerCase()
      .replace(/[^\w\s]/g, '')
      .split(/\s+/)
      .filter(word => word.length > 4); // Only words longer than 4 characters

    // Get unique words and take first 10
    const uniqueWords = [...new Set(words)].slice(0, 10);
    
    // Add some default keywords if we don't have enough
    const defaultKeywords = ['business', 'technology', 'innovation', 'digital', 'solution'];
    const combinedKeywords = [...uniqueWords, ...defaultKeywords].slice(0, 10);
    
    return combinedKeywords;
  }

  async downloadVideo(filename: string): Promise<void> {
    try {
      console.log('Downloading video:', filename);
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
      
      console.log('Video download completed');
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Download failed';
      console.error('Download error:', error);
      this.updateState({ error: errorMessage });
      throw error;
    }
  }

  resetProcessing(): void {
    console.log('Resetting processing state');
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

  // Helper method to check if processing is currently active
  isProcessing(): boolean {
    return this.state.step !== 'idle' && 
           this.state.step !== 'complete' && 
           this.state.step !== 'error';
  }

  // Helper method to get human-readable status
  getStatusMessage(): string {
    switch (this.state.step) {
      case 'transcribing':
        return 'Transcribing audio with AI...';
      case 'extracting-keywords':
        return 'Extracting keywords for B-roll...';
      case 'fetching-broll':
        return 'Fetching B-roll images...';
      case 'generating-video':
        return 'Generating enhanced video...';
      case 'complete':
        return 'Processing complete!';
      case 'error':
        return `Error: ${this.state.error}`;
      case 'idle':
      default:
        return 'Ready to process';
    }
  }
}