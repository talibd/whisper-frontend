'use client'
import React, { useState, useRef, useEffect } from 'react'
import { 
  useCurrentProject, 
  useSelectedSegment, 
  useCurrentStyle, 
  useEditorSettings,
  timeToSeconds,
  splitTextByWordCount,
  formatTime
} from '@/store/editorStore'
import { Play, Pause } from 'lucide-react'
import Image from 'next/image'

// Extended SegmentData type to include keywordTimestamp
interface ExtendedSegmentData {
  id: string;
  type: 'subtitle' | 'broll';
  startTime: string;
  endTime: string;
  content: string;
  highlightedKeyword?: string;
  imageUrl?: string;
  isSelected: boolean;
  keywordTimestamp?: string; // When the keyword is actually spoken
}

export default function VideoCard() {
  const videoRef = useRef<HTMLVideoElement>(null)
  const [currentTime, setCurrentTime] = useState(0)
  const [isPlaying, setIsPlaying] = useState(false)
  
  const project = useCurrentProject()
  const currentStyle = useCurrentStyle()
  const settings = useEditorSettings()

  // Helper function to create subtitle segments from text
  const createSubtitleSegments = (originalSegment: ExtendedSegmentData): ExtendedSegmentData[] => {
    if (originalSegment.type !== 'subtitle') return [originalSegment];
    
    const chunks = splitTextByWordCount(originalSegment.content, settings.wordCount);
    const startTime = timeToSeconds(originalSegment.startTime);
    const endTime = timeToSeconds(originalSegment.endTime);
    const duration = endTime - startTime;
    const segmentDuration = duration / chunks.length;

    return chunks.map((chunk, index) => {
      const segmentStartTime = startTime + (index * segmentDuration);
      const segmentEndTime = segmentStartTime + segmentDuration;

      return {
        ...originalSegment,
        id: index === 0 ? originalSegment.id : `${originalSegment.id}-chunk-${index}`,
        content: chunk,
        startTime: formatTime(segmentStartTime),
        endTime: formatTime(segmentEndTime),
        // Keep highlighted keyword only in the chunk that contains it
        highlightedKeyword: chunk.toLowerCase().includes(originalSegment.highlightedKeyword?.toLowerCase() || '') 
          ? originalSegment.highlightedKeyword 
          : undefined
      };
    });
  };

  // Get video URL from project or use demo
  const videoUrl = project?.videoUrl || '/demo.mp4';

  // Demo segments if no project data
  const rawSegments = project?.segments || [
    {
      id: 'demo-1',
      type: 'subtitle' as const,
      startTime: '00:00',
      endTime: '00:10',
      content: 'This is a brief description of the segment content. It provides an overview of what this segment is about and demonstrates the word count functionality.',
      highlightedKeyword: 'provides',
      isSelected: false
    },
    {
      id: 'demo-2', 
      type: 'broll' as const,
      startTime: '00:10',
      endTime: '00:20',
      content: 'Keyword',
      imageUrl: '/demo.jpeg',
      isSelected: false,
      keywordTimestamp: '00:05' // When the keyword is spoken
    }
  ]

  // Process segments to split subtitles based on word count
  const segments = rawSegments.flatMap(seg => createSubtitleSegments(seg));

  // Get active subtitle segments for current time
  const getActiveSubtitles = (time: number) => {
    return segments.filter(segment => {
      if (segment.type !== 'subtitle') return false
      const startTime = timeToSeconds(segment.startTime)
      const endTime = timeToSeconds(segment.endTime)
      return time >= startTime && time <= endTime
    })
  }

  // Get active b-roll based on keyword timing within active subtitle
  const getActiveBroll = (time: number) => {
    // Get all active subtitles (there might be multiple chunks)
    const activeSubtitles = getActiveSubtitles(time);
    
    // Find the subtitle with highlighted keyword
    const subtitleWithKeyword = activeSubtitles.find(subtitle => subtitle.highlightedKeyword);
    if (!subtitleWithKeyword) return null;

    // Find b-roll that corresponds to the highlighted keyword
    const brollSegment = segments.find(segment => {
      if (segment.type !== 'broll') return false
      
      // Check if b-roll keyword matches subtitle's highlighted keyword
      const keywordMatches = segment.content.toLowerCase() === subtitleWithKeyword.highlightedKeyword?.toLowerCase()
      
      if (!keywordMatches) return false

      // If keywordTimestamp is provided, use that for timing
      if (segment.keywordTimestamp) {
        const keywordTime = timeToSeconds(segment.keywordTimestamp)
        const displayDuration = 3 // Show b-roll for 3 seconds
        return time >= keywordTime && time <= keywordTime + displayDuration
      }

      // Fallback: calculate when keyword appears in subtitle timeline
      const subtitleStartTime = timeToSeconds(subtitleWithKeyword.startTime)
      const subtitleDuration = timeToSeconds(subtitleWithKeyword.endTime) - subtitleStartTime
      const content = subtitleWithKeyword.content
      const keywordPosition = content.toLowerCase().indexOf(subtitleWithKeyword.highlightedKeyword!.toLowerCase())
      
      if (keywordPosition === -1) return false

      // Estimate when keyword is spoken based on position in text
      const wordsBeforeKeyword = content.substring(0, keywordPosition).split(' ').length - 1
      const totalWords = content.split(' ').length
      const estimatedKeywordTime = subtitleStartTime + (wordsBeforeKeyword / totalWords) * subtitleDuration
      const displayDuration = 3 // Show b-roll for 3 seconds

      return time >= estimatedKeywordTime && time <= estimatedKeywordTime + displayDuration
    })

    return brollSegment || null
  }

  const activeSubtitle = getActiveSubtitles(currentTime)[0]
  const activeBroll = getActiveBroll(currentTime)

  // Video event handlers
  const handleTimeUpdate = () => {
    if (videoRef.current) {
      setCurrentTime(videoRef.current.currentTime)
    }
  }

  const handlePlayPause = () => {
    if (videoRef.current) {
      if (isPlaying) {
        videoRef.current.pause()
      } else {
        videoRef.current.play()
      }
      setIsPlaying(!isPlaying)
    }
  }

  // Render subtitle with highlighted keywords
  const renderSubtitleContent = (segment: ExtendedSegmentData) => {
    if (!segment.highlightedKeyword) {
      return segment.content
    }

    const parts = segment.content.split(segment.highlightedKeyword)
    return parts.map((part, index, array) => (
      <React.Fragment key={index}>
        {part}
        {index < array.length - 1 && (
          <span className="bg-amber-100 text-neutral-900 px-1 pb-1 rounded highlighted-keyword">
            {segment.highlightedKeyword}
          </span>
        )}
      </React.Fragment>
    ))
  }

  // Apply current style to subtitle
  const getSubtitleStyle = () => {
    const rgbaColor = `rgba(${currentStyle.color.r}, ${currentStyle.color.g}, ${currentStyle.color.b}, ${currentStyle.color.a})`
   
    return {
      fontFamily: currentStyle.fontFamily,
      fontSize: `${currentStyle.fontSize}px`,
      fontWeight: currentStyle.fontWeight,
      color: rgbaColor,
      // backgroundColor: bgColor,
      // textAlign: currentStyle.textAlign,
      // borderRadius: `${currentStyle.borderRadius || 8}px`,
      // padding: `${currentStyle.padding || 12}px`,
      // margin: `${currentStyle.margin || 4}px`,
    }
  }

  useEffect(() => {
    const video = videoRef.current
    if (!video) return

    video.addEventListener('timeupdate', handleTimeUpdate)
    video.addEventListener('play', () => setIsPlaying(true))
    video.addEventListener('pause', () => setIsPlaying(false))

    // Disable right-click context menu
    const handleContextMenu = (e: Event) => {
      e.preventDefault()
    }
    video.addEventListener('contextmenu', handleContextMenu)

    return () => {
      video.removeEventListener('timeupdate', handleTimeUpdate)
      video.removeEventListener('play', () => setIsPlaying(true))
      video.removeEventListener('pause', () => setIsPlaying(false))
      video.removeEventListener('contextmenu', handleContextMenu)
    }
  }, [])

  // Reset video when project changes
  useEffect(() => {
    if (videoRef.current && project?.videoUrl) {
      videoRef.current.load(); // Reload the video with new source
      setCurrentTime(0);
      setIsPlaying(false);
    }
  }, [project?.videoUrl]);

  return (
    <div className="relative">
      <video 
        ref={videoRef}
        className="w-full max-w-[300px] aspect-[9/16] object-cover rounded-xl"
        src={videoUrl}
        playsInline
        disablePictureInPicture
        controlsList="nodownload nofullscreen noremoteplayback"
        onContextMenu={(e) => e.preventDefault()}
      />
      
      {/* B-roll Overlay */}
      {activeBroll && activeBroll.imageUrl && (
        <div className="absolute inset-0 flex items-center w-full h-full justify-center pointer-events-none  overflow-hidden">
          <div className="relative flex items-center justify-center rounded-lg w-full h-full overflow-hidden shadow-lg border-2 border-white/30">
            <Image 
              src={activeBroll.imageUrl}
              alt="B-roll content"
              width={1080}
              height={1080}
              className="h-[200px]"
            />
            {/* <div className="absolute bottom-2 right-2 bg-black/70 text-white text-xs px-2 py-1 rounded ">
              {activeBroll.content}
            </div> */}
          </div>
        </div>
      )}

      {/* Subtitle Overlay */}
      {activeSubtitle && (
        <div className="absolute bottom-16 left-4 right-4 flex justify-center pointer-events-none">
          <div 
            className="max-w-[90%] text-center leading-relaxed "
            style={getSubtitleStyle()}
          >
            {renderSubtitleContent(activeSubtitle)}
          </div>
        </div>
      )}

      {/* Play/Pause Button */}
      <div className="absolute -bottom-15 left-1/2 transform -translate-x-1/2">
        <button
          onClick={handlePlayPause}
          className="p-3 bg-white/90 hover:bg-white rounded-full transition-colors shadow-lg backdrop-blur"
          title={isPlaying ? "Pause" : "Play"}
        >
          {isPlaying ? (
            <Pause size={20} className="text-neutral-900" />
          ) : (
            <Play size={20} className="text-neutral-900 ml-0.5" />
          )}
        </button>
      </div>

      {/* Project Info Display */}
      {/* {project && (
        <div className="absolute top-2 left-2 bg-black/70 text-white text-xs px-2 py-1 rounded pointer-events-none">
          {project.name}
        </div>
      )} */}
    </div>
  )
}