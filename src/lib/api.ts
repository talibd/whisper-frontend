// src/lib/api.ts - Main API service layer
const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8080';

export interface TranscriptionResponse {
  text: string;
  segments: Array<{
    text: string;
    start: number;
    end: number;
  }>;
  words: Array<{
    text: string;
    start: number;
    end: number;
  }>;
  language: string;
  file_info: {
    filename: string;
    size_mb: number;
  };
}

export interface KeywordsResponse {
  keywords: string[];
  total_count: number;
  transcript_length: number;
}

export interface BrollResponse {
  images: Record<string, string | null>;
  errors: string[];
  access_token_invalid?: boolean;
}

export interface VideoGenerationResponse {
  video_filename: string;
}

export interface ApiError {
  error: string;
  details?: string;
  retry_suggested?: boolean;
}

class ApiService {
  private baseUrl: string;

  constructor(baseUrl: string = API_BASE_URL) {
    this.baseUrl = baseUrl;
  }

  private async handleResponse<T>(response: Response): Promise<T> {
    if (!response.ok) {
      const errorData: ApiError = await response.json().catch(() => ({
        error: `HTTP ${response.status}: ${response.statusText}`,
      }));
      throw new Error(errorData.details || errorData.error);
    }
    return response.json();
  }

  async healthCheck(): Promise<{ status: string; service: string; version: string }> {
    const response = await fetch(`${this.baseUrl}/health`);
    return this.handleResponse(response);
  }

  async transcribeVideo(file: File, language?: string): Promise<TranscriptionResponse> {
    const formData = new FormData();
    formData.append('file', file);
    if (language) {
      formData.append('language', language);
    }

    const response = await fetch(`${this.baseUrl}/transcribe`, {
      method: 'POST',
      body: formData,
    });

    return this.handleResponse<TranscriptionResponse>(response);
  }

  async extractKeywords(transcript: string): Promise<KeywordsResponse> {
    const response = await fetch(`${this.baseUrl}/extract-keywords`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ transcript }),
    });

    return this.handleResponse<KeywordsResponse>(response);
  }

  async fetchBrollImages(keywords: string[]): Promise<BrollResponse> {
    const response = await fetch(`${this.baseUrl}/broll-images`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ keywords }),
    });

    return this.handleResponse<BrollResponse>(response);
  }

  async generateVideo(
    file: File,
    transcript: string,
    words: Array<{ text: string; start: number; end: number }>,
    keywords: string[],
    brollImages: Record<string, string | null>,
    wordsPerSubtitle: number = 5
  ): Promise<VideoGenerationResponse> {
    const formData = new FormData();
    formData.append('file', file);
    formData.append('transcript', transcript);
    formData.append('words', JSON.stringify(words));
    formData.append('keywords', JSON.stringify(keywords));
    formData.append('broll_images', JSON.stringify(brollImages));
    formData.append('words_per_subtitle', wordsPerSubtitle.toString());

    const response = await fetch(`${this.baseUrl}/generate-video`, {
      method: 'POST',
      body: formData,
    });

    return this.handleResponse<VideoGenerationResponse>(response);
  }

  getDownloadUrl(filename: string): string {
    return `${this.baseUrl}/download-video/${filename}`;
  }

  async downloadVideo(filename: string): Promise<Blob> {
    const response = await fetch(this.getDownloadUrl(filename));
    if (!response.ok) {
      throw new Error(`Failed to download video: ${response.statusText}`);
    }
    return response.blob();
  }
}

export const apiService = new ApiService();