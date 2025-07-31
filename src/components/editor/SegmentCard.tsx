'use client'
import React from 'react'
import Image from 'next/image'
import { useEditorActions, useCurrentProject, useSelectedSegment, SegmentData } from '@/store/editorStore'
import { cn } from '@/lib/utils'
import { Trash2, Copy, Edit } from 'lucide-react'

interface SegmentCardProps {
  segment?: SegmentData;
}

function SegmentCard({ segment }: SegmentCardProps) {
  const project = useCurrentProject();
  const selectedSegment = useSelectedSegment();
  const { selectSegment, updateSegment, deleteSegment, duplicateSegment } = useEditorActions();

  // Use provided segment or create demo segments if none provided
  const segments = segment ? [segment] : project?.segments || [
    {
      id: 'demo-1',
      type: 'subtitle' as const,
      startTime: '00:00',
      endTime: '00:10',
      content: 'This is a brief description of the segment content. It provides an overview of what this segment is about.',
      highlightedKeyword: 'provides',
      isSelected: selectedSegment?.id === 'demo-1'
    },
    {
      id: 'demo-2', 
      type: 'broll' as const,
      startTime: '00:10',
      endTime: '00:20',
      content: 'Keyword',
      imageUrl: '/demo.jpeg',
      isSelected: selectedSegment?.id === 'demo-2'
    }
  ];

  const handleSegmentClick = (segmentId: string) => {
    selectSegment(segmentId);
  };

  const handleDelete = (e: React.MouseEvent, segmentId: string) => {
    e.stopPropagation();
    deleteSegment(segmentId);
  };

  const handleDuplicate = (e: React.MouseEvent, segmentId: string) => {
    e.stopPropagation();
    duplicateSegment(segmentId);
  };

  const handleEdit = (e: React.MouseEvent, segmentId: string, field: string, value: string) => {
    e.stopPropagation();
    updateSegment(segmentId, { [field]: value });
  };

  return (
    <div className="space-y-4">
      {segments.map((seg) => (
        <div key={seg.id}>
          {seg.type === 'subtitle' ? (
            // Subtitle segment card
            <div 
              className={cn(
                'group p-3 border rounded-xl cursor-pointer transition-all duration-200'
                ,
                seg.isSelected 
                  ? 'border-blue-400 bg-blue-900/20 shadow-blue-900/20' 
                  : 'border-neutral-600 bg-neutral-700/80 hover:border-neutral-500'
              )}
              onClick={() => handleSegmentClick(seg.id)}
            >
              <div className='flex items-center justify-between'>
                <span className='text-sm text-neutral-400'>
                  {seg.startTime} - {seg.endTime}
                </span>
                <div className="flex items-center space-x-1 opacity-0 group-hover:opacity-100 transition-opacity">
                  {/* <button
                    onClick={(e) => handleDuplicate(e, seg.id)}
                    className="p-1 hover:bg-neutral-600 rounded"
                    title="Duplicate"
                  >
                    <Copy size={14} />
                  </button>
                  <button
                    onClick={(e) => handleDelete(e, seg.id)}
                    className="p-1 hover:bg-red-600 rounded text-red-400"
                    title="Delete"
                  >
                    <Trash2 size={14} />
                  </button> */}
                </div>
              </div>
              <p className='mt-2 text-neutral-300 text-sm leading-relaxed'>
                {seg.content.split(seg.highlightedKeyword || '').map((part, index, array) => (
                  <React.Fragment key={index}>
                    {part}
                    {index < array.length - 1 && seg.highlightedKeyword && (
                      <span className='bg-amber-100 text-neutral-900 px-1 pb-1 rounded highlighted-keyword'>
                        {seg.highlightedKeyword}
                      </span>
                    )}
                  </React.Fragment>
                ))}
              </p>
            </div>
          ) : (
            // B-roll segment card
            <div 
              className={cn(
                'group p-2 border rounded-xl flex gap-10 flex-col relative overflow-hidden cursor-pointer transition-all duration-200',
                
                seg.isSelected 
                  ? 'border-blue-400 bg-blue-900/20 shadow-blue-900/20' 
                  : 'border-neutral-600 bg-neutral-700/80 hover:border-neutral-500'
              )}
              onClick={() => handleSegmentClick(seg.id)}
            >
              {seg.imageUrl && (
                <Image 
                  src={seg.imageUrl} 
                  alt='segment thumbnail' 
                  className='absolute w-full h-full object-cover top-0 left-0 z-1 pointer-events-none opacity-60' 
                  height={200} 
                  width={200}  
                />
              )}
              <div className='flex items-center justify-between relative z-10'>
                <span className='text-[12px] text-neutral-100 bg-neutral-800/90 p-2 px-3 rounded-2xl backdrop-blur'>
                  {seg.startTime} - {seg.endTime}
                </span>
                <div className="flex items-center space-x-1 opacity-0 group-hover:opacity-100 transition-opacity">
                  {/* <button
                    onClick={(e) => handleDuplicate(e, seg.id)}
                    className="p-1 bg-neutral-800/90 hover:bg-neutral-700 rounded backdrop-blur"
                    title="Duplicate"
                  >
                    <Copy size={14} />
                  </button>
                  <button
                    onClick={(e) => handleDelete(e, seg.id)}
                    className="p-1 bg-neutral-800/90 hover:bg-red-600 rounded text-red-400 backdrop-blur"
                    title="Delete"
                  >
                    <Trash2 size={14} />
                  </button> */}
                </div>
              </div>
              <span className='text-sm w-fit ml-auto text-neutral-100 bg-neutral-800/90 p-2 leading-normal px-3 rounded-full relative z-10 backdrop-blur'>
                {seg.content}
              </span>
            </div>
          )}
        </div>
      ))}
    </div>
  );
}

export default SegmentCard;