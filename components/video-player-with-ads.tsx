"use client"

import { useState, useRef, useEffect, useCallback } from "react";
import Hls from "hls.js";
import { GoogleAdManager, type AdBreak, type AdConfig, AdUtils } from "@/lib/ad-manager"
import { Button } from "@/components/ui/button"
import { Play, Pause, VolumeX, Volume2, Maximize, Minimize } from "lucide-react"
import { Slider } from "@/components/ui/slider"

interface VideoPlayerWithAdsProps {
  videoUrl: string
  contentMetadata: {
    id: string
    title: string
    duration: number
    genre?: string
    language?: string
    series?: string
    episodeNumber?: number
  }
  adConfig: AdConfig
  onAdEvent?: (event: string, data?: any) => void
  className?: string,
  thumbnailUrl?: string

}

export default function VideoPlayerWithAds({
  videoUrl,
  contentMetadata,
  adConfig,
  onAdEvent,
  className = "",
}: VideoPlayerWithAdsProps) {
  // Add comprehensive debug logging
  console.log("🎬 VideoPlayerWithAds Props:", {
    videoUrl,
    contentMetadata,
    adConfig,
    hasOnAdEvent: !!onAdEvent,
    className,
  })

  // Video player state
  const videoRef = useRef<HTMLVideoElement>(null)
  const adContainerRef = useRef<HTMLDivElement>(null)
  const playerContainerRef = useRef<HTMLDivElement>(null)

  const [isPlaying, setIsPlaying] = useState(false)
  const [currentTime, setCurrentTime] = useState(0)
  const [duration, setDuration] = useState(0)
  const [volume, setVolume] = useState(0.8)

  const [isFullscreen, setIsFullscreen] = useState(false)
  const [showControls, setShowControls] = useState(true)
  const [isLoading, setIsLoading] = useState(true)
  const [isMuted, setIsMuted] = useState(true)
  const [isVideoLoaded, setIsVideoLoaded] = useState(false);
  // Add state
  const [hasUserStarted, setHasUserStarted] = useState(false)
  const [videoError, setVideoError] = useState<string | null>(null)



  // Ad-specific state
  const [adManager, setAdManager] = useState<GoogleAdManager | null>(null)
  const [isAdPlaying, setIsAdPlaying] = useState(false)
  const [currentAdBreak, setCurrentAdBreak] = useState<AdBreak | null>(null)
  const [scheduledAdBreaks, setScheduledAdBreaks] = useState<AdBreak[]>([])
  const [adCountdown, setAdCountdown] = useState<number | null>(null)
  const [canSkipAd, setCanSkipAd] = useState(false)
  const [adError, setAdError] = useState<string | null>(null)

  // Control timeout for auto-hide
  const controlsTimeoutRef = useRef<NodeJS.Timeout | null>(null)

  // Center play button handler
  const handleCenterPlay = async () => {
    setHasUserStarted(true)
    setVideoError(null)
    try {
      await videoRef.current?.play()
    } catch (e) {
      setVideoError("Playback failed. Tap to retry.")
      setHasUserStarted(false)
    }
  }

  // Error retry handler
  const handleRetry = () => {
    setVideoError(null)
    setHasUserStarted(false)
    setIsLoading(true)
  }


  useEffect(() => {
    if (videoRef.current && videoUrl.endsWith(".m3u8")) {
      if (Hls.isSupported()) {
        const hls = new Hls()
        hls.loadSource(videoUrl)
        hls.attachMedia(videoRef.current)
        hls.on(Hls.Events.MANIFEST_PARSED, () => {
          // Optionally auto-play or handle loadedmetadata
        })
        return () => {
          hls.destroy()
        }
      } else if (videoRef.current.canPlayType("application/vnd.apple.mpegurl")) {
        // Safari will handle it natively
        videoRef.current.src = videoUrl
      }
    }
  }, [videoUrl])

  // Add debug logging for state changes
  useEffect(() => {
    console.log("🎬 VideoPlayerWithAds State:", {
      isLoading,
      isPlaying,
      duration,
      currentTime,
      isAdPlaying,
      adError,
      videoUrl,
    })
  }, [isLoading, isPlaying, duration, currentTime, isAdPlaying, adError, videoUrl])

  /**
   * Initialize ad manager when component mounts
   */
  useEffect(() => {
    if (!hasUserStarted) return; // <-- Only after user starts
    if (!videoRef.current || !adContainerRef.current || duration === 0) return;
    const initializeAdManager = async () => {
      if (!videoRef.current || !adContainerRef.current) return

      try {
        // Build targeting parameters
        const targeting = AdUtils.buildTargeting(contentMetadata)

        // Create ad configuration with targeting
        const enhancedAdConfig: AdConfig = {
          "adBreaks": [],
          "adTagUrl": "https://pubads.g.doubleclick.net/gampad/ads?iu=/21775744923/external/single_ad_samples&sz=640x480&cust_params=sample_ct%3Dlinear&ciu_szs=300x250%2C728x90&gdfp_req=1&output=vast&unviewed_position_start=1&env=vp&impl=s&correlator=1234567890",
          "enablePreroll": true,
          "enableMidroll": true,
          "enablePostroll": true,
          targeting,
          ppid: AdUtils.generatePPID(),
        }

        console.log(enhancedAdConfig);


        // Create ad manager instance
        const manager = new GoogleAdManager(enhancedAdConfig, {
          onAdLoaded: (ad) => {
            console.log("🎬 Ad loaded:", ad.getTitle())
            onAdEvent?.("ad_loaded", { ad, adBreak: currentAdBreak })
          },
          onAdStarted: (ad) => {
            setIsAdPlaying(true)
            setCurrentAdBreak(manager.getCurrentAdBreak())
            setAdError(null)

            // Start countdown for skippable ads
            if (ad.getSkipTimeOffset() > 0) {
              setAdCountdown(ad.getSkipTimeOffset())
              const countdownInterval = setInterval(() => {
                setAdCountdown((prev) => {
                  if (prev === null || prev <= 1) {
                    setCanSkipAd(true)
                    clearInterval(countdownInterval)
                    return null
                  }
                  return prev - 1
                })
              }, 1000)
            }

            onAdEvent?.("ad_started", { ad, adBreak: currentAdBreak })
          },
          onAdCompleted: (ad) => {
            setAdCountdown(null)
            setCanSkipAd(false)
            onAdEvent?.("ad_completed", { ad, adBreak: currentAdBreak })
          },
          onAdSkipped: (ad) => {
            setAdCountdown(null)
            setCanSkipAd(false)
            onAdEvent?.("ad_skipped", { ad, adBreak: currentAdBreak })
          },
          onAdError: (error) => {
            setAdError(error.getMessage())
            setIsAdPlaying(false)
            setCurrentAdBreak(null)
            setAdCountdown(null)
            setCanSkipAd(false)
            onAdEvent?.("ad_error", { error })
          },
          onAdBreakStarted: (adBreak) => {
            setCurrentAdBreak(adBreak)
            onAdEvent?.("ad_break_started", { adBreak })
          },
          onAdBreakCompleted: (adBreak) => {
            setIsAdPlaying(false)
            setCurrentAdBreak(null)
            setAdCountdown(null)
            setCanSkipAd(false)
            onAdEvent?.("ad_break_completed", { adBreak })
          },
          onAllAdsCompleted: () => {
            setIsAdPlaying(false)
            setCurrentAdBreak(null)
            onAdEvent?.("all_ads_completed")
          },
        })

        // Initialize ad manager
        await manager.initialize(videoRef.current, adContainerRef.current)
        setAdManager(manager)

        console.log("✅ Ad manager initialized successfully")
      } catch (error) {
        console.error("❌ Failed to initialize ad manager:", error)
        setAdError("Failed to initialize ads")
      }
    }

    initializeAdManager()

    return () => {
      if (adManager) {
        adManager.destroy()
      }
    }
  }, [duration, hasUserStarted])

  /**
   * Schedule ad breaks when video metadata is loaded
   */
  useEffect(() => {
    console.log("adManager:", adManager, "duration:", duration)
    if (adManager && duration > 0) {
      const breaks = adManager.scheduleAdBreaks(duration)
      console.log("Scheduled ad breaks:", breaks)
      setScheduledAdBreaks(breaks)
    }
  }, [adManager, duration])

  useEffect(() => {
    if (videoRef.current) {
      videoRef.current.muted = isMuted
    }
  }, [isMuted])

  useEffect(() => {
    if (videoRef.current) {
      videoRef.current.volume = volume
      videoRef.current.muted = isMuted
    }
  }, [])

  /**
   * Check for ad breaks during video playback
   */
  useEffect(() => {
    console.log({ "addmanager": adManager, "isAdPlaying": isAdPlaying, "isPlaying": isPlaying });
    console.log("Current time:", currentTime)
    if (!adManager || isAdPlaying) return

    const adBreak = adManager.shouldPlayAd(currentTime)
    console.log(adBreak);

    // Allow preroll ad even if isPlaying is false
    if (adBreak && (isPlaying || adBreak.type === "preroll")) {
      console.log("🎬 Playing ad break:", adBreak.id)
      adManager.playAd(adBreak)
    }
  }, [adManager, currentTime, isAdPlaying, isPlaying])

  /**
   * Video event handlers
   */
  const handleVideoTimeUpdate = useCallback(() => {
    if (videoRef.current && !isAdPlaying) {
      setCurrentTime(videoRef.current.currentTime)
    }
  }, [isAdPlaying])

  const handleLoadedMetadata = useCallback(() => {
    setIsVideoLoaded(true);
    setDuration(videoRef.current?.duration || 0);
  }, []);

  const handleVideoLoadedMetadata = useCallback(() => {
    console.log("Hanle Video Loaded metadata");

    if (videoRef.current) {
      setDuration(videoRef.current.duration)
      setIsLoading(false)
    }
  }, [])

  const handleVideoPlay = useCallback(() => {
    setIsPlaying(true)
    resetControlsTimeout()
  }, [])

  const handleVideoPause = useCallback(() => {
    setIsPlaying(false)
    setShowControls(true)
    if (controlsTimeoutRef.current) {
      clearTimeout(controlsTimeoutRef.current)
    }
  }, [])

  const handleVideoEnded = useCallback(() => {
    setIsPlaying(false)
    setShowControls(true)

    // Play post-roll ad if configured
    if (adManager) {
      const postrollBreak = scheduledAdBreaks.find((ab) => ab.type === "postroll")
      if (postrollBreak) {
        adManager.playAd(postrollBreak)
      }
    }
  }, [adManager, scheduledAdBreaks])

  /**
   * Control functions
   */
  const togglePlay = useCallback(() => {
    if (!videoRef.current) return

    if (isAdPlaying) {
      // Handle ad playback
      if (isPlaying) {
        adManager?.pauseAd()
      } else {
        adManager?.resumeAd()
      }
      return
    }

    // Handle video playback
    if (isPlaying) {
      videoRef.current.pause()
    } else {
      videoRef.current.play()
    }
  }, [isPlaying, isAdPlaying, adManager])

  const handleSeek = useCallback(
    (value: number[]) => {
      if (videoRef.current && !isAdPlaying) {
        videoRef.current.currentTime = value[0]
        setCurrentTime(value[0])
      }
    },
    [isAdPlaying],
  )

  const handleVolumeChange = useCallback((value: number[]) => {
    if (videoRef.current) {
      const newVolume = value[0]
      videoRef.current.volume = newVolume
      setVolume(newVolume)
      setIsMuted(newVolume === 0)
    }
  }, [])

  const toggleMute = useCallback(() => {
    if (videoRef.current) {
      if (isMuted) {
        videoRef.current.muted = false
        videoRef.current.volume = volume
        setIsMuted(false)
      } else {
        videoRef.current.muted = true
        setIsMuted(true)
      }
    }
  }, [isMuted, volume])

  const toggleFullscreen = useCallback(() => {
    if (!playerContainerRef.current) return

    if (!isFullscreen) {
      if (playerContainerRef.current.requestFullscreen) {
        playerContainerRef.current.requestFullscreen()
      }
    } else {
      if (document.exitFullscreen) {
        document.exitFullscreen()
      }
    }
  }, [isFullscreen])

  const skipAd = useCallback(() => {
    if (canSkipAd && adManager) {
      adManager.skipAd()
    }
  }, [canSkipAd, adManager])

  /**
   * Auto-hide controls
   */
  const resetControlsTimeout = useCallback(() => {
    if (controlsTimeoutRef.current) {
      clearTimeout(controlsTimeoutRef.current)
    }

    setShowControls(true)

    if (isPlaying && !isAdPlaying) {
      controlsTimeoutRef.current = setTimeout(() => {
        setShowControls(false)
      }, 3000)
    }
  }, [isPlaying, isAdPlaying])

  /**
   * Fullscreen change handler
   */
  useEffect(() => {
    const handleFullscreenChange = () => {
      setIsFullscreen(!!document.fullscreenElement)
    }

    document.addEventListener("fullscreenchange", handleFullscreenChange)
    return () => document.removeEventListener("fullscreenchange", handleFullscreenChange)
  }, [])

  /**
   * Format time helper
   */
  const formatTime = (time: number): string => {
    const minutes = Math.floor(time / 60)
    const seconds = Math.floor(time % 60)
    return `${minutes}:${seconds.toString().padStart(2, "0")}`
  }

  return (
    <div
      ref={playerContainerRef}
      className={`relative bg-black ${isFullscreen ? "w-screen h-screen" : "w-full aspect-video"} ${className}`}
      onMouseMove={resetControlsTimeout}
      onMouseLeave={() => setShowControls(false)}
    >
      {/* Video element: only show when started */}
      <video
        ref={videoRef}
        src={videoUrl}
        onTimeUpdate={handleVideoTimeUpdate}
        className="w-full h-full object-contain"
        style={{ display: hasUserStarted ? "block" : "none" }}
        onLoadedMetadata={handleLoadedMetadata}
        onPlay={handleVideoPlay}
        onPause={handleVideoPause}
        onEnded={handleVideoEnded}
        onError={() => setVideoError("Video failed to load.")}
        playsInline
        preload="auto"
        controls={false}
      />
      {/* Thumbnail + Center Play Button */}
      {!hasUserStarted && (
        <div className="absolute inset-0 flex items-center justify-center bg-black">
          {contentMetadata.thumbnail && (
            <img
              src={contentMetadata.thumbnail}
              alt="Video thumbnail"
              className="absolute inset-0 w-full h-full object-cover"
              onLoad={() => setIsLoading(false)}
            />
          )}
          <Button
            onClick={handleCenterPlay}
            variant="ghost"
            size="icon"
            className="z-10 bg-black/60 hover:bg-black/80 text-white rounded-full w-20 h-20"
          >
            <Play className="w-10 h-10 fill-white ml-1" />
          </Button>
        </div>
      )}

      {/* Ad Container */}
      <div ref={adContainerRef} className={`absolute inset-0 bg-black ${isAdPlaying ? "block" : "hidden"}`} />

      {/* Loading Indicator */}
      {isLoading && (
        <div className="absolute inset-0 flex items-center justify-center bg-black/50">
          <div className="w-8 h-8 border-2 border-white border-t-transparent rounded-full animate-spin" />
        </div>
      )}


      {/* Error Overlay */}
      {/* {videoError && (
        <div className="absolute inset-0 flex items-center justify-center bg-black/80 z-50">
          <div className="text-center text-white p-6 max-w-md">
            <div className="text-red-400 text-xl mb-4">⚠️</div>
            <h3 className="text-lg font-semibold mb-2">Video Error</h3>
            <p className="text-sm text-gray-300 mb-4">{videoError}</p>
            <Button onClick={handleRetry} className="bg-red-600 hover:bg-red-700 text-white px-6 py-2">
              Retry
            </Button>
          </div>
        </div>
      )} */}

      {/* Ad Overlay */}
      {/* {isAdPlaying && (
        <div className="absolute top-4 left-4 right-4 z-50">
          <div className="flex items-center justify-between">
          
            {canSkipAd ? (
              <Button onClick={skipAd} className="bg-black/70 hover:bg-black/90 text-white text-sm px-3 py-1">
                Skip Ad
              </Button>
            ) : adCountdown !== null ? (
              <div className="bg-black/70 text-white px-3 py-1 rounded text-sm">Skip in {adCountdown}s</div>
            ) : null}
          </div>
        </div>
      )} */}

      {/* Error Display */}
      {/* {adError && (
        <div className="absolute top-4 left-4 right-4 z-50">
          <div className="bg-red-600/90 text-white px-4 py-2 rounded">Ad Error: {adError}</div>
        </div>
      )} */}

      {/* Video Controls */}
      <div
        className={`absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent transition-opacity duration-300 ${showControls ? "opacity-100" : "opacity-0"
          }`}
      >


        {/* Bottom Controls */}
        <div className="absolute bottom-0 left-0 right-0 p-4">
          {/* Progress Bar */}
          {!isAdPlaying && (
            <>
              <div className="mb-4 relative">
                <Slider
                  value={[currentTime]}
                  max={duration || 100}
                  step={0.1}
                  onValueChange={handleSeek}
                  className="w-full [&>span:first-child]:h-1 [&>span:first-child]:bg-white/30 [&_[role=slider]]:bg-red-500 [&_[role=slider]]:w-3 [&_[role=slider]]:h-3 [&_[role=slider]]:border-0 [&>span:first-child_span]:bg-red-500"
                />
                {/* Ad Break Markers */}
                <div className="absolute left-0 top-0 w-full h-full pointer-events-none">
                  {scheduledAdBreaks.map((adBreak) => (
                    <div
                      key={adBreak.id}
                      className="absolute w-2 h-2 bg-yellow-400 rounded-full"
                      style={{
                        left: `calc(${(adBreak.timeOffset / duration) * 100}% - 4px)`,
                        top: "50%",
                        transform: "translateY(-50%)",
                      }}
                      title={`${adBreak.type} ad at ${formatTime(adBreak.timeOffset)}`}
                    />
                  ))}
                </div>
              </div>
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-3">
                  <Button
                    onClick={togglePlay}
                    variant="ghost"
                    size="icon"
                    className="text-white hover:bg-white/20"
                    disabled={isAdPlaying}
                  >
                    {isPlaying ? <Pause className="w-5 h-5 fill-white" /> : <Play className="w-5 h-5 fill-white" />}
                  </Button>

                  <div className="flex items-center space-x-2">
                    <Button onClick={toggleMute} variant="ghost" size="icon" className="text-white hover:bg-white/20">
                      {isMuted ? <VolumeX className="w-4 h-4" /> : <Volume2 className="w-4 h-4" />}
                    </Button>

                    <div className="w-20">
                      <Slider
                        value={[isMuted ? 0 : volume]}
                        max={1}
                        step={0.1}
                        onValueChange={handleVolumeChange}
                        className="[&>span:first-child]:h-1 [&>span:first-child]:bg-white/30 [&_[role=slider]]:bg-white [&_[role=slider]]:w-3 [&_[role=slider]]:h-3 [&_[role=slider]]:border-0 [&>span:first-child_span]:bg-white"
                      />
                    </div>
                  </div>

                  {!isAdPlaying && (
                    <div className="text-white text-sm font-medium">
                      {formatTime(currentTime)} / {formatTime(duration)}
                    </div>
                  )}
                </div>

                <div className="flex items-center space-x-2">
                  <Button onClick={toggleFullscreen} variant="ghost" size="icon" className="text-white hover:bg-white/20">
                    {isFullscreen ? <Minimize className="w-4 h-4" /> : <Maximize className="w-4 h-4" />}
                  </Button>
                </div>
              </div>
            </>
          )}

          {/* Control Buttons */}

        </div>
      </div>
    </div>
  )
}
