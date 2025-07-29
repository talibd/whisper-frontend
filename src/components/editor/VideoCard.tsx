import React from 'react'

export default function VideoCard() {
  return (
    <div>
        <video className='w-full  aspect-[9/16] object-cover rounded-xl' src='/demo.mp4' controls />
    </div>
  )
}
