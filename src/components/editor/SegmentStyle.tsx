"use client"
import React, { useState } from 'react'
import MyColorPicker from './sub/MyColorPicker'
import { AlignCenter, CaseSensitive, SpellCheck2 } from 'lucide-react'
import FontStyle from './sub/FontStyle';
import { FontSelect } from './sub/FontSelect';
import { MySelect } from './sub/MySelect';
import { CgFontHeight } from "react-icons/cg";
import { Input } from '../ui/input';


export default function SegmentStyle() {
  const [color, setColor] = useState({ r: 0, g: 0, b: 0, a: 1 });
  const [fontSize, setFontSize] = useState('12');
  const fontSizes = Array.from({ length: 33 }, (_, i) => {
    const size = 8 + i * 2; // from 8 to 72
    return { label: size.toString(), value: size.toString() };
  });
  const [fontWeight, setFontWeight] = useState('500');
  const fontWeights = [
    { value: '300', label: 'Light' },
    { value: '400', label: 'Regular' },
    { value: '500', label: 'Medium' },
    { value: '600', label: 'Semi-Bold' },
    { value: '700', label: 'Bold' },
  ];


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
            <FontSelect />
          </div>
          <div className="col-start-4">
            <MySelect side="bottom" align="end" selectItems={fontSizes} selectedValue={fontSize} onSelect={setFontSize} />
          </div>
          <div className="row-start-2 col-span-2 relative">
            {/* <CgFontHeight size={20} className=' absolute top-2 left-2' />
            <Input type="number" min="0" max="999" className='pl-2 text-right' value={fontSize}
              onChange={(e) => {
                const input = e.target.value.slice(0, 3);
                setFontSize(input);
              }} /> */}
            <MySelect selectItems={fontWeights} selectedValue={fontWeight} onSelect={setFontWeight} />

          </div>
          <div className="row-start-2 col-span-2">
            <MyColorPicker color={color} onChange={setColor} />
          </div>
          {/* <div className="col-span-2 row-start-2">5</div> */}
        </div>

      </div>
    </>
  )
}
