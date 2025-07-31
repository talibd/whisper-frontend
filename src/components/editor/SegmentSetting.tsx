'use client'
import React, { useState } from 'react'
import { useEditorSettings, useEditorActions } from '@/store/editorStore'


export default function SegmentSetting() {
  const settings = useEditorSettings();
  const { updateSettings } = useEditorActions();

  const handleWordCountChange = (wordCount: 3 | 5 | 7) => {
    updateSettings({ wordCount });
  };

  return (
    <>
    {/* <div className='p-3 bg-neutral-800 rounded-2xl'>
      <span className="text-neutral-400">settings</span>
      <div className="grid grid-cols-3 grid-rows-2 gap-1 mt-2 rounded-xl overflow-hidden">
        <div className='min-h-[70px] bg-neutral-700/70 flex items-center justify-center flex-col'>1</div>
        <div className='min-h-[70px] bg-neutral-700/70 flex items-center justify-center flex-col'>2</div>
        <div className='min-h-[70px] bg-neutral-700/70 flex items-center justify-center flex-col'>3</div>
        <div className="col-span-3 min-h-[70px] bg-neutral-700/70 flex items-center justify-center flex-col">4</div>
      </div>
    </div> */}

   <div className='p-3 bg-neutral-800 rounded-2xl mb-4'>
      <span className="text-neutral-400 text-sm">Word count</span>
      <div className="grid grid-cols-3 grid-rows-1 gap-1 mt-2">
        <div 
          onClick={() => handleWordCountChange(3)} 
          className={`
            ${settings.wordCount === 3 ? 'border border-white bg-neutral-700':'bg-neutral-700/70'} 
            hover:bg-neutral-600 min-h-[70px] flex items-center justify-center flex-col rounded-l-xl cursor-pointer transition-colors
          `}
        >
          <span className='loading-1'>S</span>
          <label className='text-[12px] text-neutral-400'>1-3</label>
        </div>
        <div 
          onClick={() => handleWordCountChange(5)} 
          className={`
            ${settings.wordCount === 5 ? 'border border-white bg-neutral-700':'bg-neutral-700/70'} 
            hover:bg-neutral-600 min-h-[70px] flex items-center justify-center flex-col cursor-pointer transition-colors
          `}
        >
          <span className='loading-1'>M</span>
          <label className='text-[12px] text-neutral-400'>3-5</label>
        </div>
        <div 
          onClick={() => handleWordCountChange(7)} 
          className={`
            ${settings.wordCount === 7 ? 'border border-white bg-neutral-700':'bg-neutral-700/70'} 
            hover:bg-neutral-600 min-h-[70px] flex items-center justify-center flex-col rounded-r-xl cursor-pointer transition-colors
          `}
        >
          <span className='loading-1'>L</span>
          <label className='text-[12px] text-neutral-400'>5-7</label>
        </div>
      </div>
    </div>
    </>
  )
}
