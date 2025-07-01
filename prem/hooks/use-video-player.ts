"use client"

import type React from "react"

import { useState, useRef, useCallback, useEffect } from "react"
import { trackVideoSeek } from "@/lib/analytics"

interface UseVideoPlayerProps {
  currentContent: any
  currentLanguage: string
  currentSeries: string
  videoPlayOffset: number
  onContentChange: (content: any) => void
}

export function useVideoPlayer({
  currentContent,
  currentLanguage,
  currentSeries,
  videoPlayOffset,
  onContentChange,
}: UseVideoPlayerProps) {
  const videoRef = useRef<HTMLVideoElement>(null)
  const [isPlaying, setIsPlaying] = useState(true)
  const [currentTime, setCurrentTime] = useState(0)
  const [duration, setDuration] = useState(0)
  const [volume, setVolume] = useState(0.8)
  const [isMuted, setIsMuted] = useState(false)
  const [isBuffering, setIsBuffering] = useState(true)
  const [isVideoLoaded, setIsVideoLoaded] = useState(false)
  const [hasSetInitialTime, setHasSetInitialTime] = useState(false)
  const [videoError, setVideoError] = useState<string | null>(null)

  const togglePlay = useCallback(
    (e?: React.MouseEvent) => {
      if (e) {
        e.preventDefault()
        e.stopPropagation()
      }

      const video = videoRef.current
      if (!video) return

      try {
        if (isPlaying) {
          video.pause()
          setIsPlaying(false)
        } else {
          const playPromise = video.play()
          if (playPromise !== undefined) {
            playPromise
              .then(() => setIsPlaying(true))
              .catch((error) => {
                console.warn("Play failed:", error)
                setIsPlaying(false)
                setVideoError(`Play failed: ${error.message}`)
              })
          } else {
            setIsPlaying(true) // doubt
          }
        }
      } catch (error) {
        console.warn("Toggle play failed:", error)
        setVideoError(`Toggle play failed: ${error}`)
      }
    },
    [isPlaying],
  )

  const handleSeek = useCallback(
    (value: number[]) => {
      const video = videoRef.current
      if (!video) return

      const previousTime = currentTime
      const newTime = value[0]

      video.currentTime = newTime
      setCurrentTime(newTime)

      if (Math.abs(newTime - previousTime) > 5) {
        trackVideoSeek(currentContent.id, previousTime, newTime)
      }
    },
    [currentTime, currentContent.id],
  )

  const handleVolumeChange = useCallback((value: number[]) => {
    const video = videoRef.current
    if (!video) return

    const newVolume = value[0]
    video.volume = newVolume
    setVolume(newVolume)
    setIsMuted(newVolume === 0)
  }, [])

  const toggleMute = useCallback(() => {
    const video = videoRef.current
    if (!video) return

    if (isMuted) {
      video.volume = volume
      setIsMuted(false)
    } else {
      video.volume = 0
      setIsMuted(true)
    }
  }, [isMuted, volume])

  const skip = useCallback(
    (seconds: number) => {
      const video = videoRef.current
      if (!video) return

      video.currentTime = Math.max(0, Math.min(duration, video.currentTime + seconds))
    },
    [duration],
  )

  // Set initial play offset when video loads
  useEffect(() => {
    const video = videoRef.current
    if (video && videoPlayOffset > 0 && !hasSetInitialTime && isVideoLoaded && video.readyState >= 2) {
      video.currentTime = videoPlayOffset
      setCurrentTime(videoPlayOffset)
      setHasSetInitialTime(true)
    }
  }, [videoPlayOffset, isVideoLoaded, hasSetInitialTime])

  // Reset state when content changes
  useEffect(() => {
    setHasSetInitialTime(false)
    setIsVideoLoaded(false)
    setIsBuffering(true)
    setVideoError(null)
  }, [currentContent.id, currentLanguage])

  return {
    videoRef,
    isPlaying,
    setIsPlaying,
    currentTime,
    setCurrentTime,
    duration,
    setDuration,
    volume,
    isMuted,
    isBuffering,
    setIsBuffering,
    isVideoLoaded,
    setIsVideoLoaded,
    videoError,
    setVideoError,
    togglePlay,
    handleSeek,
    handleVolumeChange,
    toggleMute,
    skip,
  }
}
