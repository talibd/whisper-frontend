// src/store/editorStore.ts
'use client'

import { create } from 'zustand'
import { persist, createJSONStorage } from 'zustand/middleware'
import { immer } from 'zustand/middleware/immer'

// Utility functions for word count processing (defined first to avoid hoisting issues)
export const timeToSeconds = (timeStr: string): number => {
  const [minutes, seconds] = timeStr.split(':').map(Number);
  return minutes * 60 + seconds;
};

export const formatTime = (seconds: number): string => {
  const mins = Math.floor(seconds / 60);
  const secs = Math.floor(seconds % 60);
  return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
};

export const splitTextByWordCount = (text: string, maxWords: number): string[] => {
  const words = text.split(' ').filter(word => word.trim().length > 0);
  const chunks: string[] = [];
  
  for (let i = 0; i < words.length; i += maxWords) {
    chunks.push(words.slice(i, i + maxWords).join(' '));
  }
  
  return chunks.length > 0 ? chunks : [text];
};

// Types for the editor state
export interface RGBAColor {
  r: number;
  g: number;
  b: number;
  a: number;
}

export interface SegmentData {
  id: string;
  type: 'subtitle' | 'broll';
  startTime: string;
  endTime: string;
  content: string;
  highlightedKeyword?: string;
  imageUrl?: string;
  isSelected: boolean;
}

export interface StyleSettings {
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

export interface EditorSettings {
  wordCount: 3 | 5 | 7;
  autoSave: boolean;
  previewMode: boolean;
  showTimestamps: boolean;
  snapToGrid: boolean;
}

// Backend data interfaces
export interface Word {
  text: string;
  start: number;
  end: number;
}

export interface Segment {
  text: string;
  start: number;
  end: number;
}

export interface BrollImages {
  [keyword: string]: string | null;
}

export interface ProjectMetadata {
  originalFile?: string;
  transcript?: string;
  words?: Word[];
  segments?: Segment[];
  keywords?: string[];
  brollImages?: BrollImages;
  subtitlesEnabled?: boolean;
  brollsEnabled?: boolean;
}

export interface ProjectData {
  id: string;
  name: string;
  videoUrl?: string;
  thumbnail?: string;
  duration?: number;
  createdAt: string;
  updatedAt: string;
  segments: SegmentData[];
  globalStyle: StyleSettings;
  settings: EditorSettings;
  metadata?: ProjectMetadata; // Store backend data for re-export
}

export const processSegmentsWithWordCount = (segments: SegmentData[], wordCount: number): SegmentData[] => {
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

export interface EditorState {
  // Current project data
  currentProject: ProjectData | null;
  
  // UI state
  selectedSegmentId: string | null;
  isExporting: boolean;
  exportProgress: number;
  
  // Editor settings
  editorSettings: EditorSettings;
  
  // Style settings
  currentStyle: StyleSettings;
  
  // Recent projects
  recentProjects: ProjectData[];
  
  // Suggestions and feedback
  suggestions: string[];
  
  // Actions
  actions: {
    // Project actions
    createProject: (name: string) => void;
    loadProject: (project: ProjectData) => void;
    saveProject: () => void;
    updateProject: (updates: Partial<ProjectData>) => void;
    
    // Segment actions
    addSegment: (segment: Omit<SegmentData, 'id'>) => void;
    updateSegment: (id: string, updates: Partial<SegmentData>) => void;
    deleteSegment: (id: string) => void;
    selectSegment: (id: string | null) => void;
    duplicateSegment: (id: string) => void;
    reorderSegments: (fromIndex: number, toIndex: number) => void;
    
    // Style actions
    updateStyle: (updates: Partial<StyleSettings>) => void;
    resetStyle: () => void;
    applyStyleToSegment: (segmentId: string, style: Partial<StyleSettings>) => void;
    
    // Settings actions
    updateSettings: (updates: Partial<EditorSettings>) => void;
    
    // Export actions
    startExport: () => void;
    updateExportProgress: (progress: number) => void;
    finishExport: () => void;
    exportVideoWithBackend: () => Promise<string | null>; // New backend export function
    
    // Suggestions
    addSuggestion: (suggestion: string) => void;
    clearSuggestions: () => void;
    
    // Utilities
    clearAll: () => void;
    undo: () => void;
    redo: () => void;
    
    // Word count utilities
    getProcessedSegments: () => SegmentData[];
    getEstimatedSegmentCount: () => number;
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

const generateId = () => `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;

// Create the store with persistence
export const useEditorStore = create<EditorState>()(
  persist(
    immer((set, get) => ({
      // Initial state
      currentProject: null,
      selectedSegmentId: null,
      isExporting: false,
      exportProgress: 0,
      editorSettings: defaultSettings,
      currentStyle: defaultStyle,
      recentProjects: [],
      suggestions: [],

      actions: {
        // Project actions
        createProject: (name: string) => {
          set((state) => {
            const newProject: ProjectData = {
              id: generateId(),
              name,
              createdAt: new Date().toISOString(),
              updatedAt: new Date().toISOString(),
              segments: [],
              globalStyle: { ...defaultStyle },
              settings: { ...defaultSettings },
            };
            
            state.currentProject = newProject;
            state.selectedSegmentId = null;
            
            // Add to recent projects
            const existingIndex = state.recentProjects.findIndex((p: ProjectData) => p.name === name);
            if (existingIndex > -1) {
              state.recentProjects.splice(existingIndex, 1);
            }
            state.recentProjects.unshift(newProject);
            
            // Keep only last 10 recent projects
            if (state.recentProjects.length > 10) {
              state.recentProjects = state.recentProjects.slice(0, 10);
            }
          });
        },

        loadProject: (project: ProjectData) => {
          set((state) => {
            state.currentProject = { ...project };
            state.currentStyle = { ...project.globalStyle };
            state.editorSettings = { ...project.settings };
            state.selectedSegmentId = null;
            
            // Update recent projects
            const existingIndex = state.recentProjects.findIndex((p:ProjectData) => p.id === project.id);
            if (existingIndex > -1) {
              state.recentProjects.splice(existingIndex, 1);
            }
            state.recentProjects.unshift(project);
          });
        },

        saveProject: () => {
          set((state) => {
            if (state.currentProject) {
              state.currentProject.updatedAt = new Date().toISOString();
              state.currentProject.globalStyle = { ...state.currentStyle };
              state.currentProject.settings = { ...state.editorSettings };
              
              // Update in recent projects
              const index = state.recentProjects.findIndex((p: ProjectData) => p.id === state.currentProject!.id);
              if (index > -1) {
                state.recentProjects[index] = { ...state.currentProject };
              }
            }
          });
        },

        updateProject: (updates: Partial<ProjectData>) => {
          set((state) => {
            if (state.currentProject) {
              Object.assign(state.currentProject, updates);
              state.currentProject.updatedAt = new Date().toISOString();
            }
          });
        },

        // Segment actions
        addSegment: (segment: Omit<SegmentData, 'id'>) => {
          set((state) => {
            if (state.currentProject) {
              const newSegment: SegmentData = {
                ...segment,
                id: generateId(),
              };
              state.currentProject.segments.push(newSegment);
              state.selectedSegmentId = newSegment.id;
              state.currentProject.updatedAt = new Date().toISOString();
            }
          });
        },

        updateSegment: (id: string, updates: Partial<SegmentData>) => {
          set((state) => {
            if (state.currentProject) {
              const segment = state.currentProject.segments.find((s: SegmentData) => s.id === id);
              if (segment) {
                Object.assign(segment, updates);
                state.currentProject.updatedAt = new Date().toISOString();
              }
            }
          });
        },

        deleteSegment: (id: string) => {
          set((state) => {
            if (state.currentProject) {
              const index = state.currentProject.segments.findIndex((s: SegmentData) => s.id === id);
              if (index > -1) {
                state.currentProject.segments.splice(index, 1);
                if (state.selectedSegmentId === id) {
                  state.selectedSegmentId = null;
                }
                state.currentProject.updatedAt = new Date().toISOString();
              }
            }
          });
        },

        selectSegment: (id: string | null) => {
          set((state) => {
            // Deselect all segments
            if (state.currentProject) {
              state.currentProject.segments.forEach((segment: SegmentData) => {
                segment.isSelected = false;
              });
              
              // Select the specified segment
              if (id) {
                const segment = state.currentProject.segments.find((s: SegmentData) => s.id === id);
                if (segment) {
                  segment.isSelected = true;
                }
              }
            }
            state.selectedSegmentId = id;
          });
        },

        duplicateSegment: (id: string) => {
          set((state) => {
            if (state.currentProject) {
              const segment = state.currentProject.segments.find((s: SegmentData) => s.id === id);
              if (segment) {
                const duplicated: SegmentData = {
                  ...segment,
                  id: generateId(),
                  isSelected: false,
                };
                const index = state.currentProject.segments.findIndex((s: SegmentData) => s.id === id);
                state.currentProject.segments.splice(index + 1, 0, duplicated);
                state.currentProject.updatedAt = new Date().toISOString();
              }
            }
          });
        },

        reorderSegments: (fromIndex: number, toIndex: number) => {
          set((state) => {
            if (state.currentProject) {
              const segments = state.currentProject.segments;
              const [movedSegment] = segments.splice(fromIndex, 1);
              segments.splice(toIndex, 0, movedSegment);
              state.currentProject.updatedAt = new Date().toISOString();
            }
          });
        },

        // Style actions
        updateStyle: (updates: Partial<StyleSettings>) => {
          set((state) => {
            Object.assign(state.currentStyle, updates);
            if (state.currentProject) {
              state.currentProject.updatedAt = new Date().toISOString();
            }
          });
        },

        resetStyle: () => {
          set((state) => {
            state.currentStyle = { ...defaultStyle };
          });
        },

        applyStyleToSegment: (segmentId: string, style: Partial<StyleSettings>) => {
          set((state) => {
            if (state.currentProject) {
              const segment = state.currentProject.segments.find((s: SegmentData) => s.id === segmentId);
              if (segment) {
                // Store style in segment data (you'd need to extend SegmentData interface)
                Object.assign(segment, { customStyle: style });
                state.currentProject.updatedAt = new Date().toISOString();
              }
            }
          });
        },

        // Settings actions
        updateSettings: (updates: Partial<EditorSettings>) => {
          set((state) => {
            Object.assign(state.editorSettings, updates);
            if (state.currentProject) {
              state.currentProject.settings = { ...state.editorSettings };
              state.currentProject.updatedAt = new Date().toISOString();
            }
          });
        },

        // Export actions
        startExport: () => {
          set((state) => {
            state.isExporting = true;
            state.exportProgress = 0;
          });
        },

        updateExportProgress: (progress: number) => {
          set((state) => {
            state.exportProgress = Math.max(0, Math.min(100, progress));
          });
        },

        finishExport: () => {
          set((state) => {
            state.isExporting = false;
            state.exportProgress = 100;
          });
          
          // Reset progress after delay without causing re-renders
          setTimeout(() => {
            const currentState = get();
            if (!currentState.isExporting && currentState.exportProgress === 100) {
              set((state) => {
                state.exportProgress = 0;
              });
            }
          }, 2000);
        },

        // New backend export function
        exportVideoWithBackend: async () => {
          const state = get();
          const project = state.currentProject;
          
          if (!project || !project.metadata) {
            console.error('No project or backend data available for export');
            return null;
          }

          try {
            const baseUrl = "https://aivideo-production-2603.up.railway.app";
            
            // Start export process
            state.actions.startExport();
            
            const formData = new FormData();
            
            // Add original file if available (would need to be stored differently in real app)
            if (project.metadata.originalFile) {
              // In a real app, you'd need to handle file storage differently
              // formData.append("file", originalFile);
            }
            
            formData.append("transcript", project.metadata.transcript || '');
            formData.append("words", JSON.stringify(project.metadata.words || []));
            formData.append("keywords", JSON.stringify(project.metadata.keywords || []));
            formData.append("broll_images", JSON.stringify(project.metadata.brollImages || {}));
            formData.append("words_per_subtitle", state.editorSettings.wordCount.toString());
            
            // Add style settings
            formData.append("font_family", state.currentStyle.fontFamily);
            formData.append("font_size", state.currentStyle.fontSize);
            formData.append("font_weight", state.currentStyle.fontWeight);
            formData.append("font_color", JSON.stringify(state.currentStyle.color));

            const response = await fetch(`${baseUrl}/generate-video`, {
              method: 'POST',
              body: formData,
            });

            if (!response.ok) {
              throw new Error('Export failed');
            }

            const result = await response.json();
            const videoUrl = `${baseUrl}/download-video/${result.video_filename}`;
            
            state.actions.finishExport();
            return videoUrl;
            
          } catch (error) {
            console.error('Export failed:', error);
            set((state) => {
              state.isExporting = false;
              state.exportProgress = 0;
            });
            return null;
          }
        },

        // Suggestions
        addSuggestion: (suggestion: string) => {
          set((state) => {
            if (suggestion.trim() && !state.suggestions.includes(suggestion.trim())) {
              state.suggestions.unshift(suggestion.trim());
              // Keep only last 50 suggestions
              if (state.suggestions.length > 50) {
                state.suggestions = state.suggestions.slice(0, 50);
              }
            }
          });
        },

        clearSuggestions: () => {
          set((state) => {
            state.suggestions = [];
          });
        },

        // Utilities
        clearAll: () => {
          set((state) => {
            state.currentProject = null;
            state.selectedSegmentId = null;
            state.isExporting = false;
            state.exportProgress = 0;
            state.currentStyle = { ...defaultStyle };
            state.editorSettings = { ...defaultSettings };
          });
        },

        undo: () => {
          // TODO: Implement undo functionality
          console.log('Undo not implemented yet');
        },

        redo: () => {
          // TODO: Implement redo functionality
          console.log('Redo not implemented yet');
        },

        // Word count utilities
        getProcessedSegments: () => {
          const state = get();
          if (!state.currentProject?.segments) return [];
          return processSegmentsWithWordCount(state.currentProject.segments, state.editorSettings.wordCount);
        },

        getEstimatedSegmentCount: () => {
          const state = get();
          if (!state.currentProject?.segments) return 0;
          
          return state.currentProject.segments.reduce((total, segment) => {
            if (segment.type === 'subtitle') {
              const words = segment.content.split(' ').filter(word => word.trim().length > 0).length;
              return total + Math.ceil(words / state.editorSettings.wordCount);
            }
            return total + 1; // B-roll segments remain the same
          }, 0);
        },
      },
    })),
    {
      name: 'video-editor-storage',
      storage: createJSONStorage(() => localStorage),
      // Only persist certain parts of the state
      partialize: (state) => ({
        recentProjects: state.recentProjects,
        editorSettings: state.editorSettings,
        currentProject: state.currentProject,
        suggestions: state.suggestions.slice(0, 10), // Only keep 10 most recent
      }),
    }
  )
);

// Selectors for commonly used state
export const useCurrentProject = () => useEditorStore(state => state.currentProject);
export const useSelectedSegment = () => useEditorStore(state => {
  const project = state.currentProject;
  const selectedId = state.selectedSegmentId;
  return project?.segments.find(s => s.id === selectedId) || null;
});
export const useCurrentStyle = () => useEditorStore(state => state.currentStyle);
export const useEditorSettings = () => useEditorStore(state => state.editorSettings);

// Fixed export state selectors to prevent object recreation
export const useIsExporting = () => useEditorStore(state => state.isExporting);
export const useExportProgress = () => useEditorStore(state => state.exportProgress);

// Stable action selectors to prevent infinite loops
export const useEditorActions = () => useEditorStore(state => state.actions);

// Individual action selectors for better performance
export const useStartExport = () => useEditorStore(state => state.actions.startExport);
export const useUpdateExportProgress = () => useEditorStore(state => state.actions.updateExportProgress);
export const useFinishExport = () => useEditorStore(state => state.actions.finishExport);
export const useExportVideo = () => useEditorStore(state => state.actions.exportVideoWithBackend);

// New selectors for word count functionality - using useCallback to prevent recreation
export const useProcessedSegments = () => {
  return useEditorStore((state) => {
    if (!state.currentProject?.segments) return [];
    return processSegmentsWithWordCount(state.currentProject.segments, state.editorSettings.wordCount);
  });
};

export const useEstimatedSegmentCount = () => {
  return useEditorStore((state) => {
    if (!state.currentProject?.segments) return 0;
    return state.currentProject.segments.reduce((total, segment) => {
      if (segment.type === 'subtitle') {
        const words = segment.content.split(' ').filter(word => word.trim().length > 0).length;
        return total + Math.ceil(words / state.editorSettings.wordCount);
      }
      return total + 1;
    }, 0);
  });
};