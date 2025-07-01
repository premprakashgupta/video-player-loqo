"use client"

import type React from "react"

import { useState, useCallback, useEffect } from "react"
import { trackFullscreenToggle, trackMetaFullscreenToggle } from "@/lib/analytics"

interface UseFullscreenProps {
  containerRef: React.RefObject<HTMLDivElement>
  videoRef: React.RefObject<HTMLVideoElement>
  contentId: string
  isIOS: boolean
  isMobile: boolean
  resetControlsTimeout: () => void
}

export function useFullscreen({
  containerRef,
  videoRef,
  contentId,
  isIOS,
  isMobile,
  resetControlsTimeout,
}: UseFullscreenProps) {
  const [isFullscreen, setIsFullscreen] = useState(false)

  const toggleFullscreen = useCallback(() => {
    const container = containerRef.current
    if (!container) return

    try {
      if (!isFullscreen) {
        // Enter fullscreen
        if (container.requestFullscreen) {
          container.requestFullscreen()
        } else if ((container as any).webkitRequestFullscreen) {
          ; (container as any).webkitRequestFullscreen()
        } else if ((container as any).mozRequestFullScreen) {
          ; (container as any).mozRequestFullScreen()
        } else if ((container as any).msRequestFullscreen) {
          ; (container as any).msRequestFullscreen()
        } else if (isIOS && videoRef.current) {
          ; (videoRef.current as any).webkitEnterFullscreen?.()
        } else if (!isIOS && isMobile && videoRef.current) {
          const video = videoRef.current as any
          if (video.webkitEnterFullscreen) {
            video.webkitEnterFullscreen()
          } else if (video.requestFullscreen) {
            video.requestFullscreen()
          }
        }
        trackFullscreenToggle(contentId, true)
        trackMetaFullscreenToggle(contentId, true)
      } else {
        // Exit fullscreen
        if (document.exitFullscreen) {
          document.exitFullscreen()
        } else if ((document as any).webkitExitFullscreen) {
          ; (document as any).webkitExitFullscreen()
        } else if ((document as any).mozCancelFullScreen) {
          ; (document as any).mozCancelFullScreen()
        } else if ((document as any).msExitFullscreen) {
          ; (container as any).msExitFullscreen()
        }
        trackFullscreenToggle(contentId, false)
        trackMetaFullscreenToggle(contentId, false)
      }
    } catch (error) {
      console.warn("Fullscreen not supported:", error)
    }

    resetControlsTimeout()
  }, [isFullscreen, isIOS, isMobile, contentId, containerRef, videoRef, resetControlsTimeout])

  // Fullscreen change event listener
  useEffect(() => {
    const handleFullscreenChange = () => {
      const isCurrentlyFullscreen = !!(
        document.fullscreenElement ||
        (document as any).webkitFullscreenElement ||
        (document as any).mozFullscreenElement ||
        (document as any).msFullscreenElement ||
        (!isIOS && videoRef.current && (videoRef.current as any).webkitDisplayingFullscreen)
      )
      setIsFullscreen(isCurrentlyFullscreen)
    }

    document.addEventListener("fullscreenchange", handleFullscreenChange)
    document.addEventListener("webkitfullscreenchange", handleFullscreenChange)
    document.addEventListener("mozfullscreenchange", handleFullscreenChange)
    document.addEventListener("MSFullscreenChange", handleFullscreenChange)

    return () => {
      document.removeEventListener("fullscreenchange", handleFullscreenChange)
      document.removeEventListener("webkitfullscreenchange", handleFullscreenChange)
      document.removeEventListener("mozfullscreenchange", handleFullscreenChange)
      document.removeEventListener("MSFullscreenChange", handleFullscreenChange)
    }
  }, [isIOS, videoRef])

  return {
    isFullscreen,
    toggleFullscreen,
  }
}
