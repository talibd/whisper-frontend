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

  // Helper function to convert time string to seconds for sorting
  const timeToSeconds = (timeStr: string): number => {
    const [minutes, seconds] = timeStr.split(':').map(Number);
    return minutes * 60 + seconds;
  };

  // Use provided segment or create demo segments if none provided
  const allSegments = segment ? [segment] : project?.segments || [
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
      startTime: '00:05',
      endTime: '00:15',
      content: 'Keyword',
      imageUrl: '/demo.jpeg',
      isSelected: selectedSegment?.id === 'demo-2'
    },
    {
      id: 'demo-3',
      type: 'subtitle' as const,
      startTime: '00:10',
      endTime: '00:20',
      content: 'Another subtitle segment that comes after the b-roll.',
      highlightedKeyword: 'after',
      isSelected: selectedSegment?.id === 'demo-3'
    },
    {
      id: 'demo-4', 
      type: 'broll' as const,
      startTime: '00:10',
      endTime: '00:25',
      content: 'Same Time B-roll',
      imageUrl: '/demo.jpeg',
      isSelected: selectedSegment?.id === 'demo-4'
    }
  ];

  // Sort segments by start time, then by type (subtitles first if same time)
  const sortedSegments = allSegments.sort((a, b) => {
    const timeA = timeToSeconds(a.startTime);
    const timeB = timeToSeconds(b.startTime);
    
    if (timeA === timeB) {
      // If same start time, show subtitle before b-roll
      return a.type === 'subtitle' ? -1 : 1;
    }
    
    return timeA - timeB;
  });

  // Group segments by same start time
  const groupedSegments = sortedSegments.reduce((groups, segment) => {
    const startTime = segment.startTime;
    if (!groups[startTime]) {
      groups[startTime] = [];
    }
    groups[startTime].push(segment);
    return groups;
  }, {} as Record<string, typeof allSegments>);

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

  const renderSegment = (seg: any) => {
    if (seg.type === 'subtitle') {
      return (
        <div 
          className={cn(
            'group p-3 border rounded-xl cursor-pointer transition-all duration-200',
            seg.isSelected 
              ? 'border-neutral-300 bg-white/10 shadow-blue-900/20' 
              : 'border-neutral-600 bg-neutral-700/80 hover:border-neutral-500'
          )}
          onClick={() => handleSegmentClick(seg.id)}
        >
          <div className='flex items-center justify-between'>
            <span className='text-sm text-neutral-400'>
              {seg.startTime} - {seg.endTime}
            </span>
            <div className="flex items-center space-x-1 opacity-0 group-hover:opacity-100 transition-opacity">
              {/* Action buttons commented out as in original */}
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
      );
    } else {
      // B-roll segment
      return (
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
              {/* Action buttons commented out as in original */}
            </div>
          </div>
          <span className='text-sm w-fit ml-auto text-neutral-100 bg-neutral-800/90 p-2 leading-normal px-3 rounded-full relative z-10 backdrop-blur'>
            {seg.content}
          </span>
        </div>
      );
    }
  };

  return (
    <div className="space-y-4">
      {Object.entries(groupedSegments).map(([startTime, segments]) => (
        <div key={startTime} className="space-y-2">
          {/* {segments.length > 1 && (
            <div className="text-xs text-neutral-500 px-2">
              Timeline: {startTime}
            </div>
          )} */}
          {segments.map((seg) => (
            <div key={seg.id}>
              {renderSegment(seg)}
            </div>
          ))}
        </div>
      ))}
    </div>
  );
}

export default SegmentCard;