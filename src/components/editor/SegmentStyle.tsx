import React from 'react'
import MyColorPicker from './MyColorPicker'
import { AlignCenter, CaseSensitive } from 'lucide-react'

export default function SegmentStyle() {
  return (
    <>
      <div className='p-3 bg-neutral-800 rounded-2xl'>
      <span className="text-neutral-400">style</span>
      <div className="grid grid-cols-3 grid-rows-2 gap-1 mt-2 rounded-xl overflow-hidden">
        <div className='min-h-[70px] bg-neutral-700/70 flex items-center justify-center flex-col'>
        <CaseSensitive size={30} />
        </div>
        <div className='min-h-[70px] bg-neutral-700/70 flex items-center justify-center flex-col'>
        <div className='w-6 h-6 bg-white rounded-full'></div>
        </div>
        <div className='min-h-[70px] bg-neutral-700/70 flex items-center justify-center flex-col'>
        <AlignCenter size={25} />
        </div>
        <div className="col-span-3 min-h-[70px] bg-neutral-700/70 flex items-center justify-center flex-col">4</div>
      </div>
    </div>
    </>
  )
}
