"use client"

import type React from "react"

import { Slider } from "@/components/ui/slider"

interface VideoProgressBarProps {
  currentTime: number
  duration: number
  onSeek: (value: number[]) => void
  onSeekCommit: (value: number[]) => void
  onProgressClick: (e: React.MouseEvent) => void
  onProgressHover: (e: React.MouseEvent) => void
  onMouseEnter: () => void
  onMouseLeave: () => void
  isDragging: boolean
  setIsDragging: (dragging: boolean) => void
  isProgressHovered: boolean
  isMobile: boolean
  scheduledAdBreaks?: any[]
  formatTime: (time: number) => string
  previewTime: number | null
  previewPosition: { x: number; y: number } | null
}

export default function VideoProgressBar({
  currentTime,
  duration,
  onSeek,
  onSeekCommit,
  onProgressClick,
  onProgressHover,
  onMouseEnter,
  onMouseLeave,
  isDragging,
  setIsDragging,
  isProgressHovered,
  isMobile,
  scheduledAdBreaks = [],
  formatTime,
  previewTime,
  previewPosition,
}: VideoProgressBarProps) {
  return (
    <div
      className="relative mb-0 z-10"
      style={{
        position: "absolute",
        bottom: 0,
        left: 0,
        right: 0,
        zIndex: 10,
        padding: `${isMobile ? "4px" : "8px"} 16px 0`,
      }}
      onMouseEnter={onMouseEnter}
      onMouseLeave={onMouseLeave}
      onMouseMove={onProgressHover}
      onClick={onProgressClick}
    >
      <div className="relative w-full">
        <Slider
          value={[currentTime]}
          max={duration || 100}
          step={0.1}
          onValueChange={onSeek}
          onValueCommit={onSeekCommit}
          onPointerDown={() => setIsDragging(true)}
          onPointerUp={() => setIsDragging(false)}
          className={`w-full cursor-pointer transition-all duration-200 ${
            isMobile
              ? `[&>span:first-child]:h-1 [&>span:first-child]:hover:h-1.5 [&>span:first-child]:bg-white/30 
                 [&_[role=slider]]:w-3 [&_[role=slider]]:h-3 [&_[role=slider]]:bg-red-500 [&_[role=slider]]:border-0 
                 [&_[role=slider]]:cursor-grab [&_[role=slider]:active]:cursor-grabbing [&_[role=slider]]:transition-transform
                 [&_[role=slider]]:hover:scale-110 [&>span:first-child_span]:bg-red-500`
              : `[&>span:first-child]:h-1 ${isProgressHovered ? "[&>span:first-child]:h-1.5" : ""} [&>span:first-child]:bg-white/30 
                 [&_[role=slider]]:w-3 [&_[role=slider]]:h-3 [&_[role=slider]]:bg-red-500 [&_[role=slider]]:border-0 
                 [&_[role=slider]]:cursor-grab [&_[role=slider]:active]:cursor-grabbing [&_[role=slider]]:transition-transform
                 [&_[role=slider]]:hover:scale-110 [&>span:first-child_span]:bg-red-500 [&>span:first-child]:transition-all
                 [&>span:first-child]:duration-200`
          }`}
        />

        {/* Ad Break Markers */}
        {scheduledAdBreaks.length > 0 && duration > 0 && (
          <div className="absolute left-0 top-0 w-full h-full pointer-events-none">
            {scheduledAdBreaks.map((adBreak) => (
              <div
                key={adBreak.id}
                className="absolute w-[2px] h-[10px] bg-yellow-400 rounded-sm"
                style={{
                  left: `calc(${(adBreak.timeOffset / duration) * 100}%)`,
                  top: "50%",
                  transform: "translate(-50%, -50%)",
                }}
                title={`${adBreak.type} ad at ${formatTime(adBreak.timeOffset)}`}
              />
            ))}
          </div>
        )}
      </div>

      {/* Time Preview Tooltip */}
      {previewTime !== null && previewPosition && !isMobile && (
        <div
          className="fixed z-50 bg-black/90 text-white text-xs px-2 py-1 rounded pointer-events-none transform -translate-x-1/2 -translate-y-full"
          style={{
            left: previewPosition.x,
            top: previewPosition.y,
          }}
        >
          {formatTime(previewTime)}
        </div>
      )}
    </div>
  )
}
