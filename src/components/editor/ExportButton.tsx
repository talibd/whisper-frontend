'use client'
import React from 'react'
import { Button } from '../ui/button'
import { LoaderCircle, Download, CheckCircle } from 'lucide-react'
import { useExportState, useEditorActions, useCurrentProject } from '@/store/editorStore'

export default function ExportButton() {
  const { isExporting, progress } = useExportState();
  const { startExport, updateExportProgress, finishExport } = useEditorActions();
  const project = useCurrentProject();

  const handleExport = async () => {
    if (isExporting || !project) return;

    startExport();
    
    // Simulate export process with progress updates
    const totalSteps = 10;
    for (let i = 0; i <= totalSteps; i++) {
      await new Promise(resolve => setTimeout(resolve, 200));
      updateExportProgress((i / totalSteps) * 100);
    }
    
    finishExport();
  };

  const getButtonContent = () => {
    if (isExporting) {
      return (
        <div className='flex items-center justify-center space-x-2'>
          <LoaderCircle className="animate-spin h-4 w-4" />
          <span>{Math.round(progress)}%</span>
        </div>
      );
    }
    
    if (progress === 100) {
      return (
        <div className='flex items-center justify-center space-x-2'>
          <CheckCircle className="h-4 w-4 text-green-500" />
          <span>Exported</span>
        </div>
      );
    }
    
    return (
      <div className='flex items-center justify-center space-x-2'>
        <Download className="h-4 w-4" />
        <span>Export</span>
      </div>
    );
  };

  return (
    <div className='p-3 rounded-2xl flex flex-row items-center justify-between bg-neutral-800'>
      <div className="flex flex-col">
        <span className='text-sm text-neutral-400'>
          {project ? `Export "${project.name}"` : 'Export the video'}
        </span>
        {project && (
          <p className='text-[12px] text-neutral-300'>
            {project.segments.length} segments
          </p>
        )}
      </div>
      <Button 
        onClick={handleExport} 
        size={'lg'} 
        className="bg-white/90 hover:bg-white/80 text-neutral-800 min-w-[100px]"
        disabled={isExporting || !project}
      >
        {getButtonContent()}
      </Button>
      
      {/* Progress bar */}
      {isExporting && (
        <div className="absolute bottom-0 left-0 right-0 h-1 bg-neutral-700 rounded-b-2xl overflow-hidden">
          <div 
            className="h-full bg-gradient-to-r from-blue-500 to-green-500 transition-all duration-300 ease-out"
            style={{ width: `${progress}%` }}
          />
        </div>
      )}
    </div>
  );
}