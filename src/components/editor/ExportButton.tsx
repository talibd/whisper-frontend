'use client'
import React, { useState } from 'react'
import { Button } from '../ui/button'
import { LoaderCircle } from 'lucide-react';


export default function ExportButton() {
    const [loading, setLoading] = useState(false);
  return (
    <div className='p-3 rounded-2xl flex flex-row items-center justify-between bg-neutral-800'>
        {/* <div className='flex flex-col'>
        <span className='text-sm text-neutral-400'>title</span>
        <p className='text-[12px] text-neutral-300'>paragraph text</p>
        </div> */}
        <span className='text-sm text-neutral-400'>Export the video</span>
        <Button size={'lg'} className="bg-white/90 hover:bg-white/80 text-neutral-800" >
        {loading ? 
        <div className='flex relative items-center justify-center'>
            <LoaderCircle className="animate-spin absolute scale-[1.2]"   />
            <span className="text-transparent">
                Export
                </span>
        </div> : 'Export'}
        </Button>
    </div>
  )
}
