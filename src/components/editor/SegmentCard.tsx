'use client'
import React, { useState } from 'react'
import { Pen, RefreshCcw } from 'lucide-react';
import Image from 'next/image';

interface SegmentCardProps {
    startTime?: string;
    endTime?: string;
    subtitle?: string;
    highlightedKeyword?: string;
}

interface brollProps {
    startTime: string;
    endTime: string;
    highlightedKeyword?: string;
    imageUrl?: string;
} 

function SegmentCard({ startTime, endTime, subtitle, highlightedKeyword }: SegmentCardProps) {
    const [selected, setSelected] = useState(true);
  return (
    <>
    {/* subtitle segment card  */}
    <div className={` ${selected ? 'border-white': ''} p-3 border border-neutral-600 rounded-xl bg-neutral-700/80`}>
        <div className='flex items-center justify-between'>
            <span className='text-sm text-neutral-400'>00:00 - 00:10</span>
        </div>
        <p className='mt-2 text-neutral-300 text-sm'>
            This is a brief description of the segment content. It <span className='bg-amber-100 text-neutral-900 px-1 pb-1 highlighted-keyword'>provides</span> an overview of what this segment is about.
        </p>
    </div>
    {/* broll segment card  */}
    <div className='p-2 border border-neutral-600 rounded-xl flex gap-10 flex-col relative bg-neutral-700/80  mt-4 overflow-hidden'>
        <Image src={'/demo.jpeg'} alt='demo' className=' absolute w-full h-full object-cover top-0 left-0 z-1 pointer-events-none' height={200} width={200}  />
        <div className='flex items-center justify-between relative z-10'>
            <span className='text-[12px] text-neutral-400 bg-neutral-800 p-2 px-3 rounded-2xl'>00:10 - 00:20</span>
            {/* <span className='text-sm text-neutral-400 bg-neutral-800 p-2 rounded-2xl'><Pen size={20}/></span> */}
        </div>
        <span className='text-sm w-fit ml-auto text-neutral-100 bg-neutral-800 p-2 leading-normal px-3 rounded-full  relative z-10'>Keyword</span>
    </div>
    </>
  )
}

export default SegmentCard