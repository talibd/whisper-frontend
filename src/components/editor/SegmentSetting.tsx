'use client'
import React, { useState, useEffect } from 'react'
import { useEditorSettings, useEditorActions, useCurrentProject } from '@/store/editorStore'
import {LoaderCircle } from 'lucide-react'

export default function SegmentSetting() {
  const settings = useEditorSettings();
  const project = useCurrentProject();
  const { updateSettings } = useEditorActions();
  const [isChanging, setIsChanging] = useState(false);


  const handleWordCountChange = (wordCount: 3 | 5 | 7) => {
    setIsChanging(true);
    updateSettings({ wordCount });
    
    // Reset the changing state after a brief delay to show visual feedback
    setTimeout(() => {
      setIsChanging(false);
    }, 300);
  };

  // Calculate estimated number of subtitle segments based on current project
  const getEstimatedSegments = (wordCount: number) => {
    if (!project?.segments) return 0;
    
    return project.segments.reduce((total, segment) => {
      if (segment.type === 'subtitle') {
        const words = segment.content.split(' ').length;
        return total + Math.ceil(words / wordCount);
      }
      return total + 1; // B-roll segments remain the same
    }, 0);
  };

  const estimatedSegments = getEstimatedSegments(settings.wordCount);

  return (
    <>
      <div className='p-3 bg-neutral-800 rounded-2xl mb-4'>
        <div className="flex items-center justify-between mb-2">
          <span className="text-neutral-400 text-sm">Word count</span>
          {isChanging && (
            <span className="text-xs text-white animate-pulse"><LoaderCircle className=' animate-spin' size={20} /></span>
          )}
        </div>
        
        {/* {project?.segments && (
          <div className="mb-3 text-xs text-neutral-500">
            Estimated segments: {estimatedSegments}
          </div>
        )} */}
        
        <div className="grid grid-cols-3 grid-rows-1 gap-1">
          <div 
            onClick={() => handleWordCountChange(3)} 
            className={`
              ${settings.wordCount === 3 ? 'border border-white bg-neutral-700':'bg-neutral-700/70'} 
              hover:bg-neutral-600 min-h-[70px] flex items-center justify-center flex-col rounded-l-xl cursor-pointer transition-all duration-200
              ${isChanging ? 'animate-pulse' : ''}
            `}
          >
            <span className='text-lg font-semibold'>S</span>
            <label className='text-[12px] text-neutral-400'>1-3</label>
            {/* <div className='text-[10px] text-neutral-500 mt-1'>
              Fast paced
            </div> */}
          </div>
          <div 
            onClick={() => handleWordCountChange(5)} 
            className={`
              ${settings.wordCount === 5 ? 'border border-white bg-neutral-700':'bg-neutral-700/70'} 
              hover:bg-neutral-600 min-h-[70px] flex items-center justify-center flex-col cursor-pointer transition-all duration-200
              ${isChanging ? 'animate-pulse' : ''}
            `}
          >
            <span className='text-lg font-semibold'>M</span>
            <label className='text-[12px] text-neutral-400'>3-5</label>
        
          </div>
          <div 
            onClick={() => handleWordCountChange(7)} 
            className={`
              ${settings.wordCount === 7 ? 'border border-white bg-neutral-700':'bg-neutral-700/70'} 
              hover:bg-neutral-600 min-h-[70px] flex items-center justify-center flex-col rounded-r-xl cursor-pointer transition-all duration-200
              ${isChanging ? 'animate-pulse' : ''}
            `}
          >
            <span className='text-lg font-semibold'>L</span>
            <label className='text-[12px] text-neutral-400'>5-7 </label>
            {/* <div className='text-[10px] text-neutral-500 mt-1'>
              Readable
            </div> */}
          </div>
        </div>
        
        {/* <div className="mt-3 text-xs text-neutral-500 text-center">
          Current setting: {settings.wordCount} words per subtitle
        </div> */}
      </div>
    </>
  )
}