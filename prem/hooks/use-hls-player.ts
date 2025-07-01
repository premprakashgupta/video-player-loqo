"use client"

import type React from "react"

import { useRef, useEffect, useCallback } from "react"
import Hls from "hls.js"
import { createAdaptiveHLSInstance, shouldUseAdaptiveHLS, type AdaptiveHLSManager } from "@/lib/adaptive-hls"
import { getAvailableQualities } from "@/lib/language-utils"

interface UseHLSPlayerProps {
  videoUrl: string
  videoRef: React.RefObject<HTMLVideoElement>
  currentContent: any
  currentLanguage: string
  userSelectedQuality: string
  onError: (error: string) => void
  onQualityChange: (quality: string) => void
}

export function useHLSPlayer({
  videoUrl,
  videoRef,
  currentContent,
  currentLanguage,
  userSelectedQuality,
  onError,
  onQualityChange,
}: UseHLSPlayerProps) {
  const hlsRef = useRef<Hls | null>(null)
  const adaptiveHLSRef = useRef<AdaptiveHLSManager | null>(null)
  const retryCountRef = useRef<number>(0)
  const maxRetries = 3
  const enableAdaptiveHLS = shouldUseAdaptiveHLS()

  const availableQualities = getAvailableQualities(currentContent, currentLanguage).map((quality) => ({
    id: quality,
    label: quality,
  }))

  const handleHlsError = useCallback(
    (hls: Hls, data: any) => {
      console.error("HLS Error:", data)
      onError(`HLS Error: ${data.details}`)

      if (data.fatal) {
        switch (data.type) {
          case Hls.ErrorTypes.NETWORK_ERROR:
            if (retryCountRef.current < maxRetries) {
              retryCountRef.current++
              setTimeout(() => {
                hls.startLoad()
              }, 1000 * retryCountRef.current)
            } else {
              onError("Network error: Unable to load video. Please check your connection and try again.")
            }
            break
          case Hls.ErrorTypes.MEDIA_ERROR:
            if (retryCountRef.current < maxRetries) {
              retryCountRef.current++
              hls.recoverMediaError()
            } else {
              onError("Media error: Unable to play video after multiple attempts")
            }
            break
          default:
            onError(`Fatal error: ${data.details}`)
            hls.destroy()
            break
        }
      }
    },
    [maxRetries, onError],
  )

  const changeQuality = useCallback(
    (quality: string) => {
      onQualityChange(quality)
      retryCountRef.current = 0

      if (adaptiveHLSRef.current) {
        adaptiveHLSRef.current.changeQuality(quality)
      }
    },
    [onQualityChange],
  )

  const retryVideo = useCallback(() => {
    onError("")
    retryCountRef.current = 0

    const hls = hlsRef.current
    const adaptiveHLS = adaptiveHLSRef.current

    if (adaptiveHLS) {
      const video = videoRef.current
      if (video && videoUrl) {
        adaptiveHLS.loadSource(videoUrl, video)
      }
    } else if (hls) {
      hls.startLoad()
    } else {
      const video = videoRef.current
      if (video && videoUrl) {
        video.src = videoUrl
        video.load()
      }
    }
  }, [videoUrl, videoRef, onError])

  // Initialize HLS
  useEffect(() => {
    if (!videoUrl) return

    const video = videoRef.current
    if (!video) return

    // Reset video element
    video.pause()
    video.removeAttribute("src")
    video.load()

    // Clean up existing instances
    if (adaptiveHLSRef.current) {
      adaptiveHLSRef.current.destroy()
      adaptiveHLSRef.current = null
    }

    if (hlsRef.current) {
      hlsRef.current.destroy()
      hlsRef.current = null
    }

    retryCountRef.current = 0

    // Try Adaptive HLS first if enabled
    if (enableAdaptiveHLS) {
      try {
        const adaptiveHLS = createAdaptiveHLSInstance(
          {
            onError: handleHlsError,
            onQualityChange: (level) => {
              console.log("Quality change:", level)
            },
          },
          {
            enablePerformanceMonitoring: false,
            enableAutoQualityAdjustment: false,
            enableDeviceOptimization: false,
          },
        )

        adaptiveHLS.loadSource(videoUrl, video)
        adaptiveHLSRef.current = adaptiveHLS
        return
      } catch (error) {
        console.warn("Adaptive HLS failed, falling back to standard HLS:", error)
      }
    }

    // Fallback to standard hls.js
    if (Hls.isSupported()) {
      const config = {
        enableWorker: true,
        lowLatencyMode: false,
        backBufferLength: 30,
        progressive: true,
        maxBufferLength: 15,
        maxMaxBufferLength: 60,
        fragLoadingTimeOut: 20000,
        fragLoadingMaxRetry: 3,
        manifestLoadingTimeOut: 10000,
        manifestLoadingMaxRetry: 3,
      }

      const hls = new Hls(config)
      hlsRef.current = hls

      hls.on(Hls.Events.ERROR, (event, data) => {
        handleHlsError(hls, data)
      })

      hls.loadSource(videoUrl)
      hls.attachMedia(video)
    } else if (video.canPlayType("application/vnd.apple.mpegurl")) {
      // Native HLS fallback (Safari)
      video.src = videoUrl
    } else {
      onError("HLS is not supported in this browser")
    }

    return () => {
      if (adaptiveHLSRef.current) {
        adaptiveHLSRef.current.destroy()
        adaptiveHLSRef.current = null
      }
      if (hlsRef.current) {
        hlsRef.current.destroy()
        hlsRef.current = null
      }
    }
  }, [videoUrl, videoRef, handleHlsError, enableAdaptiveHLS, onError])

  return {
    availableQualities,
    changeQuality,
    retryVideo,
  }
}
