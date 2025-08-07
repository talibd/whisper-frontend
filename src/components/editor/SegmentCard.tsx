'use client'
import React from 'react'
import Image from 'next/image'
import { 
  useEditorActions, 
  useCurrentProject, 
  useSelectedSegment, 
  useEditorSettings, 
  SegmentData,
  timeToSeconds,
  splitTextByWordCount,
  formatTime
} from '@/store/editorStore'
import { cn } from '@/lib/utils'
import { Trash2, Copy, Edit } from 'lucide-react'

interface SegmentCardProps {
  segment?: SegmentData;
}

function SegmentCard({ segment }: SegmentCardProps) {
  const project = useCurrentProject();
  const selectedSegment = useSelectedSegment();
  const settings = useEditorSettings();
  const { selectSegment, updateSegment, deleteSegment, duplicateSegment } = useEditorActions();

  // Helper function to create subtitle segments from text
  const createSubtitleSegments = (originalSegment: SegmentData): SegmentData[] => {
    if (originalSegment.type !== 'subtitle') return [originalSegment];
    
    // Safe check for content
    if (!originalSegment.content || typeof originalSegment.content !== 'string') {
      return [originalSegment];
    }
    
    // Ensure segment has an ID
    const baseId = originalSegment.id || `segment-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
    
    const chunks = splitTextByWordCount(originalSegment.content, settings.wordCount);
    const startTime = timeToSeconds(originalSegment.startTime || '00:00');
    const endTime = timeToSeconds(originalSegment.endTime || '00:00');
    const duration = endTime - startTime;
    const segmentDuration = duration / chunks.length;

    return chunks.map((chunk, index) => {
      const segmentStartTime = startTime + (index * segmentDuration);
      const segmentEndTime = segmentStartTime + segmentDuration;

      return {
        ...originalSegment,
        id: index === 0 ? baseId : `${baseId}-chunk-${index}`,
        content: chunk,
        startTime: formatTime(segmentStartTime),
        endTime: formatTime(segmentEndTime),
        isSelected: selectedSegment?.id === baseId && index === 0,
        // Safe check for highlighted keyword
        highlightedKeyword: (chunk && originalSegment.highlightedKeyword && 
          chunk.toLowerCase().includes(originalSegment.highlightedKeyword.toLowerCase())) 
          ? originalSegment.highlightedKeyword 
          : undefined
      };
    });
  };

  // Use provided segment or create demo segments if none provided
  const rawSegments = segment ? [segment] : project?.segments || [
    {
      id: 'demo-1',
      type: 'subtitle' as const,
      startTime: '00:00',
      endTime: '00:10',
      content: 'This is a brief description of the segment content. It provides an overview of what this segment is about and demonstrates the word count functionality.',
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
      content: 'Another subtitle segment that comes after the b-roll and shows how longer text gets split into multiple cards based on your word count setting.',
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

  // Process segments to split subtitles based on word count
  const processedSegments = rawSegments.flatMap((seg, index) => {
    // Ensure each segment has a unique ID
    const segmentWithId = {
      ...seg,
      id: seg.id || `fallback-${index}-${Date.now()}`
    };
    return createSubtitleSegments(segmentWithId);
  });

  // Sort segments by start time, then by type (subtitles first if same time)
  // Create a new array using spread operator to avoid mutating the original
  const sortedSegments = [...processedSegments].sort((a, b) => {
    const timeA = timeToSeconds(a.startTime || '00:00');
    const timeB = timeToSeconds(b.startTime || '00:00');
    
    if (timeA === timeB) {
      // If same start time, show subtitle before b-roll
      return a.type === 'subtitle' ? -1 : 1;
    }
    
    return timeA - timeB;
  });

  // Group segments by same start time
  const groupedSegments = sortedSegments.reduce((groups, segment) => {
    const startTime = segment.startTime || '00:00';
    if (!groups[startTime]) {
      groups[startTime] = [];
    }
    groups[startTime].push(segment);
    return groups;
  }, {} as Record<string, typeof processedSegments>);

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
      // Check if this is a chunked segment
      const isChunked = seg.id && seg.id.includes('-chunk-');
      const chunkNumber = isChunked ? parseInt(seg.id.split('-chunk-')[1]) + 1 : null;
      
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
            <div className="flex items-center gap-2">
              <span className='text-sm text-neutral-400'>
                {seg.startTime || '00:00'} - {seg.endTime || '00:00'}
              </span>
              {chunkNumber && (
                <span className='text-xs bg-neutral-600 text-neutral-300 px-2 py-1 rounded-full'>
                  {chunkNumber}
                </span>
              )}
            </div>
            <div className="flex items-center space-x-1 opacity-0 group-hover:opacity-100 transition-opacity">
              {/* Action buttons commented out as in original */}
            </div>
          </div>
          <p className='mt-2 text-neutral-300 text-sm leading-relaxed'>
            {seg.highlightedKeyword && seg.content ? (
              (() => {
                // Safe split with fallback
                const content = seg.content || '';
                const keyword = seg.highlightedKeyword || '';
                
                if (!content || !keyword) {
                  return content ;
                }
                
                const parts = content.split(keyword);
                return parts.map((part, index, array) => (
                  <React.Fragment key={`keyword-${seg.id}-${index}`}>
                    {part}
                    {index < array.length - 1 && (
                      <span className='bg-amber-100 text-neutral-900 px-1 pb-1 rounded highlighted-keyword'>
                        {keyword}
                      </span>
                    )}
                  </React.Fragment>
                ));
              })()
            ) : (
              seg.content || 'No content'
            )}
          </p>
          <div className='mt-2 text-xs text-neutral-500'>
            Words: {seg.content ? seg.content.split(' ').length : 0} / {settings.wordCount}
          </div>
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
              {seg.startTime || '00:00'} - {seg.endTime || '00:00'}
            </span>
            <div className="flex items-center space-x-1 opacity-0 group-hover:opacity-100 transition-opacity">
              {/* Action buttons commented out as in original */}
            </div>
          </div>
          <span className='text-sm w-fit ml-auto text-neutral-100 bg-neutral-800/90 p-2 leading-normal px-3 rounded-full relative z-10 backdrop-blur'>
            {seg.content || 'No content'}
          </span>
        </div>
      );
    }
  };

  return (
    <div className="space-y-4">
      {Object.entries(groupedSegments).map(([startTime, segments]) => (
        <div key={`group-${startTime}-${segments.length}`} className="space-y-2">
          {segments.map((seg, segIndex) => (
            <div key={`segment-${seg.id || `missing-${segIndex}-${startTime}`}`}>
              {renderSegment(seg)}
            </div>
          ))}
        </div>
      ))}
    </div>
  );
}

export default SegmentCard;