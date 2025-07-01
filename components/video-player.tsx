"use client"

import type React from "react"
import { useState, useRef, useEffect, useCallback } from "react"
import Hls from "hls.js"

interface VideoPlayerProps {
  videoUrl: string
  width?: string
  height?: string
}

const VideoPlayer: React.FC<VideoPlayerProps> = ({ videoUrl, width = "100%", height = "auto" }) => {
  const videoRef = useRef<HTMLVideoElement>(null)
  const hlsRef = useRef<Hls | null>(null)
  const [error, setError] = useState<string | null>(null)

  const setupHLS = useCallback(() => {
    if (!videoRef.current || !videoUrl) return

    try {
      // Clean up existing HLS instance
      if (hlsRef.current) {
        hlsRef.current.destroy()
        hlsRef.current = null
      }

      if (Hls.isSupported()) {
        // Enhanced HLS configuration for stall prevention
        const hlsConfig = {
          enableWorker: true,
          lowLatencyMode: false,
          progressive: true,
          maxBufferLength: 30,
          maxMaxBufferLength: 120,
          backBufferLength: 60,
          maxBufferSize: 60 * 1000 * 1000,
          maxBufferHole: 0.3,
          highBufferWatchdogPeriod: 2,
          nudgeMaxRetry: 5,
          nudgeOffset: 0.1,
          startFragPrefetch: true,
          testBandwidth: true,
          fragLoadingTimeOut: 30000,
          fragLoadingMaxRetry: 6,
          fragLoadingRetryDelay: 500,
          manifestLoadingTimeOut: 15000,
          manifestLoadingMaxRetry: 5,
          manifestLoadingRetryDelay: 500,
          abrBandWidthFactor: 0.7,
          capLevelToPlayerSize: false,
          xhrSetup: (xhr: XMLHttpRequest) => {
            xhr.withCredentials = false
            xhr.timeout = 30000
          },
        }

        const hls = new Hls(hlsConfig)
        hlsRef.current = hls

        // Enhanced error handling
        hls.on(Hls.Events.ERROR, (event, data) => {
          console.error("HLS Error:", data)

          if (data.details === "bufferStalledError") {
            console.log("🔄 Handling buffer stall...")
            handleBufferStall(data)
          } else if (data.fatal) {
            console.error("💥 Fatal HLS error, attempting recovery...")
            handleFatalError(data)
          }
        })

        // Buffer stall detection
        hls.on(Hls.Events.BUFFER_STALLED, (event, data) => {
          console.warn("⚠️ Buffer stalled, attempting recovery...")
          handleBufferStall(data)
        })

        hls.loadSource(videoUrl)
        hls.attachMedia(videoRef.current)
      } else if (videoRef.current.canPlayType("application/vnd.apple.mpegurl")) {
        // Native HLS support (Safari)
        videoRef.current.src = videoUrl
      }
    } catch (error) {
      console.error("Error setting up HLS:", error)
      setError("Failed to load video")
    }
  }, [videoUrl])

  const handleBufferStall = useCallback((data: any) => {
    try {
      const video = videoRef.current
      if (!video) return

      console.log("🔧 Attempting buffer stall recovery...")

      // Try seeking to next buffered range
      const currentTime = video.currentTime
      const buffered = video.buffered

      for (let i = 0; i < buffered.length; i++) {
        if (buffered.start(i) > currentTime) {
          const seekTime = buffered.start(i) + 0.1
          console.log(`🎯 Seeking to buffered content at ${seekTime}s`)
          video.currentTime = seekTime
          return
        }
      }

      // Seek forward slightly if no buffered content ahead
      video.currentTime = currentTime + 0.1
      console.log(`🎯 Seeking forward to ${currentTime + 0.1}s`)
    } catch (error) {
      console.error("Error handling buffer stall:", error)
    }
  }, [])

  const handleFatalError = useCallback(
    (data: any) => {
      try {
        if (!hlsRef.current) return

        console.log("🔄 Attempting fatal error recovery...")

        if (data.type === Hls.ErrorTypes.MEDIA_ERROR) {
          hlsRef.current.recoverMediaError()
        } else {
          // Reload the source
          setTimeout(() => {
            setupHLS()
          }, 1000)
        }
      } catch (error) {
        console.error("Error handling fatal error:", error)
        setError("Video playback failed")
      }
    },
    [setupHLS],
  )

  useEffect(() => {
    setupHLS()

    return () => {
      if (hlsRef.current) {
        hlsRef.current.destroy()
      }
    }
  }, [setupHLS])

  return (
    <div>
      <video
        ref={videoRef}
        style={{ width: width, height: height }}
        controls
        onError={() => setError("Failed to load video")}
      />
      {error && <p style={{ color: "red" }}>{error}</p>}
    </div>
  )
}

export default VideoPlayer
