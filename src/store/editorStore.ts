// src/store/editorStore.ts
'use client'

import { create } from 'zustand'

import { persist, createJSONStorage } from 'zustand/middleware'
import { immer } from 'zustand/middleware/immer'

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

export interface ProjectData {
  id: string;
  name: string;
  videoUrl?: string;
  thumbnail?: string;
  duration?: number;
  createdAt: Date;
  updatedAt: Date;
  segments: SegmentData[];
  globalStyle: StyleSettings;
  settings: EditorSettings;
}

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
    
    // Suggestions
    addSuggestion: (suggestion: string) => void;
    clearSuggestions: () => void;
    
    // Utilities
    clearAll: () => void;
    undo: () => void;
    redo: () => void;
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
              createdAt: new Date(),
              updatedAt: new Date(),
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
              state.currentProject.updatedAt = new Date();
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
              state.currentProject.updatedAt = new Date();
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
              state.currentProject.updatedAt = new Date();
            }
          });
        },

        updateSegment: (id: string, updates: Partial<SegmentData>) => {
          set((state) => {
            if (state.currentProject) {
              const segment = state.currentProject.segments.find((s: SegmentData) => s.id === id);
              if (segment) {
                Object.assign(segment, updates);
                state.currentProject.updatedAt = new Date();
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
                state.currentProject.updatedAt = new Date();
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
                state.currentProject.updatedAt = new Date();
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
              state.currentProject.updatedAt = new Date();
            }
          });
        },

        // Style actions
        updateStyle: (updates: Partial<StyleSettings>) => {
          set((state) => {
            Object.assign(state.currentStyle, updates);
            if (state.currentProject) {
              state.currentProject.updatedAt = new Date();
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
                state.currentProject.updatedAt = new Date();
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
              state.currentProject.updatedAt = new Date();
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
            setTimeout(() => {
              set((state) => {
                state.exportProgress = 0;
              });
            }, 2000);
          });
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
      // Custom serialization for dates
      serialize: (state: any) => {
        return JSON.stringify(state, (key, value) => {
          if (value instanceof Date) {
            return { __type: 'Date', value: value.toISOString() };
          }
          return value;
        });
      },
      deserialize: (str: any) => {
        return JSON.parse(str, (key, value) => {
          if (value && value.__type === 'Date') {
            return new Date(value.value);
          }
          return value;
        });
      },
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
export const useExportState = () => useEditorStore((state) => ({
  isExporting: state.isExporting,
  progress: state.exportProgress
}));

// Action hooks for cleaner component usage
export const useEditorActions = () => useEditorStore(state => state.actions);