"use client"

import type React from "react"

import { useEffect, useCallback } from "react"
import {
  trackVideoPlay,
  trackVideoPause,
  trackVideoComplete,
  trackMetaVideoPause,
  trackMetaTimeSpent,
  trackMetaViewingHabit,
  trackTimeSpent,
  trackViewingHabit,
  trackEpisodeNavigation,
} from "@/lib/analytics"
import { getUILanguage } from "@/lib/language-utils"
import { getLocalizedText } from "@/lib/content-data"

interface UseVideoEventsProps {
  videoRef: React.RefObject<HTMLVideoElement>
  currentContent: any
  currentLanguage: string
  currentSeries: string
  isPlaying: boolean
  setIsPlaying: (playing: boolean) => void
  setCurrentTime: (time: number) => void
  setDuration: (duration: number) => void
  setIsVideoLoaded: (loaded: boolean) => void
  setIsBuffering: (buffering: boolean) => void
  setVideoError: (error: string | null) => void
  setShowControls: (show: boolean) => void
  resetControlsTimeout: () => void
  sessionStartTime: number
  onContentChange: (content: any) => void
  getNextEpisode: () => any
  volume: number
  controlsTimeout: NodeJS.Timeout | null
  setControlsTimeout: (timeout: NodeJS.Timeout | null) => void
  invokePrerollAd?: () => Promise<boolean>
  hasUserInteracted: boolean
  setHasUserInteracted: (interacted: boolean) => void
}

export function useVideoEvents({
  videoRef,
  currentContent,
  currentLanguage,
  currentSeries,
  isPlaying,
  setIsPlaying,
  setCurrentTime,
  setDuration,
  setIsVideoLoaded,
  setIsBuffering,
  setVideoError,
  setShowControls,
  resetControlsTimeout,
  sessionStartTime,
  onContentChange,
  getNextEpisode,
  volume,
  controlsTimeout,
  setControlsTimeout,
  invokePrerollAd,
  hasUserInteracted,
  setHasUserInteracted,
}: UseVideoEventsProps) {
  const handlePlay = useCallback(async () => {
    console.log("🎬 Video play event fired")

    // Mark user interaction
    if (!hasUserInteracted) {
      setHasUserInteracted(true)

      // Invoke preroll ad on first interaction
      if (invokePrerollAd) {
        console.log("🎬 First user interaction - invoking preroll ad")
        const adPlayed = await invokePrerollAd()
        if (adPlayed) {
          // Ad is playing, pause the video until ad completes
          if (videoRef.current) {
            videoRef.current.pause()
          }
          return // Don't continue with video play
        }
      }
    }

    setIsBuffering(false)
    setVideoError(null)

    if (!isPlaying) {
      setIsPlaying(true)
      resetControlsTimeout()

      trackVideoPlay(
        currentContent.id,
        getLocalizedText(currentContent.title, getUILanguage(currentLanguage)),
        currentLanguage,
        currentSeries,
      )
    }
  }, [
    isPlaying,
    hasUserInteracted,
    setHasUserInteracted,
    invokePrerollAd,
    videoRef,
    setIsPlaying,
    setIsBuffering,
    setVideoError,
    resetControlsTimeout,
    currentContent,
    currentLanguage,
    currentSeries,
  ])

  const handlePause = useCallback(() => {
    console.log("Video pause event fired")
    setShowControls(true)
    if (controlsTimeout) {
      clearTimeout(controlsTimeout)
      setControlsTimeout(null)
    }
    if (isPlaying) {
      setIsPlaying(false)
      trackVideoPause(currentContent.id, videoRef.current?.currentTime || 0, videoRef.current?.duration || 0)
      trackMetaVideoPause(currentContent.id, videoRef.current?.currentTime || 0, videoRef.current?.duration || 0)
    }
  }, [isPlaying, setIsPlaying, setShowControls, controlsTimeout, setControlsTimeout, currentContent.id, videoRef])

  const handleVideoEnd = useCallback(() => {
    setIsPlaying(false)
    setShowControls(true)

    const duration = videoRef.current?.duration || 0
    trackVideoComplete(
      currentContent.id,
      getLocalizedText(currentContent.title, getUILanguage(currentLanguage)),
      duration,
    )

    const sessionDuration = (Date.now() - sessionStartTime) / 1000
    trackTimeSpent(currentContent.id, sessionDuration)
    trackViewingHabit(currentContent.id, sessionDuration)
    trackMetaTimeSpent(currentContent.id, sessionDuration)
    trackMetaViewingHabit(currentContent.id, sessionDuration)

    // Auto play next episode
    setTimeout(() => {
      const nextEpisode = getNextEpisode()
      if (nextEpisode) {
        trackEpisodeNavigation(currentContent.id, nextEpisode.id, "next")
        onContentChange(nextEpisode)

        setTimeout(() => {
          if (videoRef.current) {
            const playPromise = videoRef.current.play()
            if (playPromise !== undefined) {
              playPromise.then(() => setIsPlaying(true)).catch(() => setIsPlaying(false))
            }
          }
        }, 500)
      }
    }, 1000)
  }, [
    setIsPlaying,
    setShowControls,
    videoRef,
    currentContent,
    currentLanguage,
    sessionStartTime,
    getNextEpisode,
    onContentChange,
  ])

  useEffect(() => {
    const video = videoRef.current
    if (!video) return

    const updateTime = () => setCurrentTime(video.currentTime)
    const updateDuration = () => {
      if (video.duration && isFinite(video.duration) && video.duration > 0) {
        setDuration(video.duration)
      }
    }

    const handleLoadedData = () => {
      setIsVideoLoaded(true)
      setIsBuffering(false)
      setVideoError(null)
      setShowControls(true)
      if (video.duration && isFinite(video.duration) && video.duration > 0) {
        setDuration(video.duration)
      }
    }

    const handleWaiting = () => setIsBuffering(true)
    const handleCanPlay = () => setIsBuffering(false)

    const handleVideoError = (e: Event) => {
      const videoElement = e.target as HTMLVideoElement
      if (videoElement.error) {
        const errorMessage = `Video error: ${videoElement.error.message} (Code: ${videoElement.error.code})`
        setVideoError(errorMessage)
      }
    }

    // Set initial volume
    video.volume = volume

    // Add event listeners
    video.addEventListener("timeupdate", updateTime)
    video.addEventListener("loadeddata", handleLoadedData)
    video.addEventListener("waiting", handleWaiting)
    video.addEventListener("canplay", handleCanPlay)
    video.addEventListener("play", handlePlay)
    video.addEventListener("pause", handlePause)
    video.addEventListener("ended", handleVideoEnd)
    video.addEventListener("durationchange", updateDuration)
    video.addEventListener("error", handleVideoError)

    return () => {
      video.removeEventListener("timeupdate", updateTime)
      video.removeEventListener("loadeddata", handleLoadedData)
      video.removeEventListener("waiting", handleWaiting)
      video.removeEventListener("canplay", handleCanPlay)
      video.removeEventListener("play", handlePlay)
      video.removeEventListener("pause", handlePause)
      video.removeEventListener("ended", handleVideoEnd)
      video.removeEventListener("durationchange", updateDuration)
      video.removeEventListener("error", handleVideoError)
    }
  }, [
    videoRef,
    volume,
    handlePlay,
    handlePause,
    handleVideoEnd,
    setCurrentTime,
    setDuration,
    setIsVideoLoaded,
    setIsBuffering,
    setVideoError,
    setShowControls,
  ])
}
