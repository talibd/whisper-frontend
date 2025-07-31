"use client"
import React, { useState } from 'react'
import MyColorPicker from './sub/MyColorPicker'
import { AlignCenter, CaseSensitive, SpellCheck2 } from 'lucide-react'
import FontStyle from './sub/FontStyle';
import { FontSelect } from './sub/FontSelect';
import { MySelect } from './sub/MySelect';
import { CgFontHeight } from "react-icons/cg";
import { Input } from '../ui/input';
import { useCurrentStyle, useEditorActions } from '@/store/editorStore'



export default function SegmentStyle() {
  const currentStyle = useCurrentStyle();
  const { updateStyle } = useEditorActions();

  const fontSizes = Array.from({ length: 33 }, (_, i) => {
    const size = 8 + i * 2; // from 8 to 72
    return { label: size.toString(), value: size.toString() };
  });

  const fontWeights = [
    { value: '300', label: 'Light' },
    { value: '400', label: 'Regular' },
    { value: '500', label: 'Medium' },
    { value: '600', label: 'Semi-Bold' },
    { value: '700', label: 'Bold' },
  ];

  const handleStyleChange = (updates: Partial<typeof currentStyle>) => {
    updateStyle(updates);
  };

  return (
    <>
      <div className='p-3 bg-neutral-800 rounded-2xl'>
        {/* <span className="text-neutral-400">style</span>
      <div className="grid grid-cols-3 grid-rows-2 gap-1 mt-2 rounded-xl overflow-hidden">
        <div className='min-h-[70px] bg-neutral-700/70 hover:bg-neutral-600 cursor-pointer flex items-center justify-center flex-col'>
       <FontStyle/>
        </div>
        <div className='min-h-[70px] bg-neutral-700/70 hover:bg-neutral-600 flex items-center justify-center flex-col'>
         <MyColorPicker color={color} onChange={setColor} />
        </div>
        <div className='min-h-[70px] bg-neutral-700/70 hover:bg-neutral-600 cursor-pointer flex items-center justify-center flex-col'>
        <AlignCenter size={25} />
        </div>
        <div className="col-span-3 min-h-[70px] bg-neutral-700/70 hover:bg-neutral-600  flex items-center justify-center flex-col">4</div>
      </div> */}

        <div className="grid grid-cols-4 grid-rows-2 gap-2">
        <div className="col-span-3">
          <FontSelect 
            value={currentStyle.fontFamily}
            onSelect={(fontFamily) => handleStyleChange({ fontFamily })}
          />
        </div>
        <div className="col-start-4">
          <MySelect 
            side="bottom" 
            align="end" 
            selectItems={fontSizes} 
            selectedValue={currentStyle.fontSize} 
            onSelect={(fontSize) => handleStyleChange({ fontSize })} 
          />
        </div>
        <div className="row-start-2 col-span-2 relative">
          <MySelect 
            selectItems={fontWeights} 
            selectedValue={currentStyle.fontWeight} 
            onSelect={(fontWeight) => handleStyleChange({ fontWeight })} 
          />
        </div>
        <div className="row-start-2 col-span-2">
          <MyColorPicker 
            color={currentStyle.color} 
            onChange={(color) => handleStyleChange({ color })} 
          />
        </div>
      </div>

      </div>
    </>
  )
}
