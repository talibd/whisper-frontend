'use client'

import { useState, useEffect, useCallback } from 'react';
import axios from 'axios';

interface GoogleFont {
  family: string;
  variants: string[];
  subsets: string[];
}

interface FontCacheData {
  fonts: string[];
  timestamp: number;
}

// Constants
const CACHE_DURATION = 24 * 60 * 60 * 1000; // 24 hours
const CACHE_KEY = 'google-fonts-cache-v2';
const LOADED_FONTS_KEY = 'loaded-fonts';

// Fallback fonts
const FALLBACK_FONTS = [
  'Arial', 'Helvetica', 'Times New Roman', 'Georgia', 
  'Verdana', 'Courier New', 'Comic Sans MS', 'Impact',
  'Trebuchet MS', 'Arial Black', 'Palatino', 'Garamond'
].sort();

// Cache utilities
const getFontsFromCache = (): FontCacheData | null => {
  if (typeof window === 'undefined') return null;
  
  try {
    const cached = localStorage.getItem(CACHE_KEY);
    if (!cached) return null;
    
    const data: FontCacheData = JSON.parse(cached);
    const now = Date.now();
    
    if (now - data.timestamp > CACHE_DURATION) {
      localStorage.removeItem(CACHE_KEY);
      return null;
    }
    
    return data;
  } catch (error) {
    console.error('Error reading font cache:', error);
    localStorage.removeItem(CACHE_KEY);
    return null;
  }
};

const saveFontsToCache = (fonts: string[]): void => {
  if (typeof window === 'undefined') return;
  
  try {
    const cacheData: FontCacheData = {
      fonts,
      timestamp: Date.now()
    };
    localStorage.setItem(CACHE_KEY, JSON.stringify(cacheData));
  } catch (error) {
    console.error('Error saving font cache:', error);
  }
};

export const useFontManager = () => {
  const [fonts, setFonts] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchFonts = useCallback(async () => {
    setLoading(true);
    setError(null);

    try {
      // Check cache first
      const cachedData = getFontsFromCache();
      if (cachedData) {
        setFonts(cachedData.fonts);
        setLoading(false);
        return;
      }

      // Fetch from API
      const API_KEY = process.env.NEXT_PUBLIC_GOOGLE_FONTS_API_KEY;
      
      if (!API_KEY) {
        console.warn('Google Fonts API key not found, using fallback fonts');
        setFonts(FALLBACK_FONTS);
        setLoading(false);
        return;
      }

      const response = await axios.get<{ items: GoogleFont[] }>(
        `https://www.googleapis.com/webfonts/v1/webfonts?key=${API_KEY}&sort=popularity`,
        { timeout: 10000 }
      );

      const fontNames = response.data.items
        .map((font: GoogleFont) => font.family)
        .sort();

      setFonts(fontNames);
      saveFontsToCache(fontNames);
      
    } catch (error) {
      console.error('Error fetching fonts:', error);
      setError('Failed to load fonts. Using fallback fonts.');
      setFonts(FALLBACK_FONTS);
    } finally {
      setLoading(false);
    }
  }, []);

  // Load font dynamically
  const loadFont = useCallback(async (fontFamily: string) => {
    const formattedFont = fontFamily.replace(/\s/g, '+');
    const linkId = `font-${formattedFont}`;
    
    // Check if already loaded
    if (document.getElementById(linkId)) return;

    const link = document.createElement('link');
    link.id = linkId;
    link.href = `https://fonts.googleapis.com/css2?family=${formattedFont}:wght@300;400;500;600;700&display=swap`;
    link.rel = 'stylesheet';
    document.head.appendChild(link);
  }, []);

  useEffect(() => {
    fetchFonts();
  }, [fetchFonts]);

  return {
    fonts,
    loading,
    error,
    loadFont,
    retryFetch: fetchFonts,
  };
};