'use client'
import React, { useState, useRef, useEffect } from 'react'
import { useCurrentProject, useSelectedSegment, useCurrentStyle } from '@/store/editorStore'
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

  // Demo segments if no project data
  const segments = project?.segments || [
    {
      id: 'demo-1',
      type: 'subtitle' as const,
      startTime: '00:00',
      endTime: '00:10',
      content: 'This is a brief description of the segment content. It provides an overview of what this segment is about.',
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

  // Convert time string to seconds
  const timeToSeconds = (timeStr: string): number => {
    const [minutes, seconds] = timeStr.split(':').map(Number)
    return minutes * 60 + seconds
  }

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
    const activeSubtitle = getActiveSubtitles(time)[0]
    if (!activeSubtitle || !activeSubtitle.highlightedKeyword) return null

    // Find b-roll that corresponds to the highlighted keyword
    const brollSegment = segments.find(segment => {
      if (segment.type !== 'broll') return false
      
      // Check if b-roll keyword matches subtitle's highlighted keyword
      const keywordMatches = segment.content.toLowerCase() === activeSubtitle.highlightedKeyword?.toLowerCase()
      
      if (!keywordMatches) return false

      // If keywordTimestamp is provided, use that for timing
      if (segment.keywordTimestamp) {
        const keywordTime = timeToSeconds(segment.keywordTimestamp)
        const displayDuration = 3 // Show b-roll for 3 seconds
        return time >= keywordTime && time <= keywordTime + displayDuration
      }

      // Fallback: calculate when keyword appears in subtitle timeline
      const subtitleStartTime = timeToSeconds(activeSubtitle.startTime)
      const subtitleDuration = timeToSeconds(activeSubtitle.endTime) - subtitleStartTime
      const content = activeSubtitle.content
      const keywordPosition = content.toLowerCase().indexOf(activeSubtitle.highlightedKeyword.toLowerCase())
      
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

  return (
    <div className="relative">
      <video 
        ref={videoRef}
        className="w-full max-w-[300px] aspect-[9/16] object-cover rounded-xl"
        src="/demo.mp4"
        playsInline
        disablePictureInPicture
        controlsList="nodownload nofullscreen noremoteplayback"
        onContextMenu={(e) => e.preventDefault()}
      />
      
      {/* B-roll Overlay */}
      {activeBroll && activeBroll.imageUrl && (
        <div className="absolute inset-0 flex items-center justify-center pointer-events-none rounded-xl overflow-hidden">
          <div className="relative w-3/4 h-1/3 rounded-lg overflow-hidden shadow-lg border-2 border-white/30">
            <Image 
              src={activeBroll.imageUrl}
              alt="B-roll content"
              fill
              className="object-cover"
            />
            <div className="absolute bottom-2 right-2 bg-black/70 text-white text-xs px-2 py-1 rounded ">
              {activeBroll.content}
            </div>
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
    </div>
  )
}