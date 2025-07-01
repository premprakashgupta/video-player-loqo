"use client"

import type React from "react"

import { useState, useCallback, useEffect } from "react"

interface UseVideoControlsProps {
  isPlaying: boolean
  isMobile: boolean
}

export function useVideoControls({ isPlaying, isMobile }: UseVideoControlsProps) {
  const [showControls, setShowControls] = useState(false)
  const [controlsTimeout, setControlsTimeout] = useState<NodeJS.Timeout | null>(null)
  const [showVolumeSlider, setShowVolumeSlider] = useState(false)
  const [isProgressHovered, setIsProgressHovered] = useState(false)
  const [previewTime, setPreviewTime] = useState<number | null>(null)
  const [previewPosition, setPreviewPosition] = useState<{ x: number; y: number } | null>(null)
  const [isDragging, setIsDragging] = useState(false)

  const resetControlsTimeout = useCallback(
    (customDelay?: number) => {
      if (controlsTimeout) {
        clearTimeout(controlsTimeout)
      }

      setShowControls(true)
      const delay = customDelay || (isMobile ? 3000 : 4000)

      const timeout = setTimeout(() => {
        if (isPlaying) {
          setShowControls(false)
        }
      }, delay)

      setControlsTimeout(timeout)
    },
    [controlsTimeout, isPlaying, isMobile],
  )

  const handleProgressHover = useCallback(
    (e: React.MouseEvent, duration: number) => {
      if (!isProgressHovered) return

      const progressBar = e.currentTarget
      const rect = progressBar.getBoundingClientRect()
      const hoverX = e.clientX - rect.left
      const percentage = Math.max(0, Math.min(1, hoverX / rect.width))
      const hoverTime = percentage * duration

      setPreviewTime(hoverTime)
      setPreviewPosition({
        x: e.clientX,
        y: rect.top - 10,
      })
    },
    [isProgressHovered],
  )

  const handleProgressClick = useCallback(
    (e: React.MouseEvent, duration: number, onSeek: (time: number) => void) => {
      const progressBar = e.currentTarget
      const rect = progressBar.getBoundingClientRect()
      const clickX = e.clientX - rect.left
      const percentage = clickX / rect.width
      const newTime = percentage * duration

      if (newTime >= 0 && newTime <= duration) {
        onSeek(newTime)
        resetControlsTimeout()
      }
    },
    [resetControlsTimeout],
  )

  // Clear timeout on unmount
  useEffect(() => {
    return () => {
      if (controlsTimeout) {
        clearTimeout(controlsTimeout)
      }
    }
  }, [controlsTimeout])

  return {
    showControls,
    setShowControls,
    showVolumeSlider,
    setShowVolumeSlider,
    isProgressHovered,
    setIsProgressHovered,
    previewTime,
    setPreviewTime,
    previewPosition,
    setPreviewPosition,
    isDragging,
    setIsDragging,
    resetControlsTimeout,
    handleProgressHover,
    handleProgressClick,
  }
}
