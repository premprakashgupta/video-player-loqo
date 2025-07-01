"use client"

import type React from "react"
import { getBestVideoUrl } from "@/lib/video-utils" // Import getBestVideoUrl
import Hls from "hls.js"
import {
  trackVideoPlay,
  trackVideoPause,
  trackVideoComplete,
  trackQualityChange,
  trackFullscreenToggle,
  trackEpisodeNavigation,
  trackVideoSeek,
  // Add new Google Analytics imports
  trackShareClick,
  trackTimeSpent,
  trackViewingHabit,
  trackCarouselScroll,
  // Add new Meta Pixel imports
  trackMetaShareClick,
  trackMetaFullscreenToggle,
  trackMetaVideoPause,
  trackMetaVideoSeek,
  trackMetaTimeSpent,
  trackMetaViewingHabit,
  trackMetaCarouselScroll,
} from "@/lib/analytics"

import { useState, useRef, useEffect, useCallback, useMemo } from "react"
import { Button } from "@/components/ui/button"
import { Slider } from "@/components/ui/slider"
import {
  Play,
  Pause,
  VolumeX,
  Volume2,
  Maximize,
  SkipForward,
  Minimize,
  ChevronLeft,
  ChevronRight,
  SkipBack,
  Share,
  Settings,
  PictureInPicture,
  Check,
} from "lucide-react"
import { getLocalizedText } from "@/lib/content-data"
import {
  getUILanguage,
  logVideoResolution,
  resolveVideoUrlWithQuality,
  getAvailableQualities,
} from "@/lib/language-utils"
import { type Episode, getSeriesById } from "@/lib/content-manager"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuLabel,
  DropdownMenuSeparator,
} from "@/components/ui/dropdown-menu"

// NEW: Import device detection and adaptive HLS
import { getDefaultCapabilities } from "@/lib/device-detection"
import { createAdaptiveHLSInstance, shouldUseAdaptiveHLS, type AdaptiveHLSManager } from "@/lib/adaptive-hls"
import ShareDialog from "@/components/share-dialog"
import { formatShareContent } from "@/lib/share-utils"
import EnhancedLikeButton from "@/components/enhanced-like-button"
import Image from "next/image"
import type { AdAnalytics } from "@/lib/ad-analytics"
import VideoPlayerWithAds from "@/components/video-player-with-ads"
import { GoogleAdManager, type AdBreak, type AdConfig, AdUtils } from "@/lib/ad-manager"

interface HeroVideoPlayerProps {
  currentPlayingContent: Episode
  currentSeries: string
  onContentChange: (content: Episode) => void
  onSeriesChange: (series: string) => void
  isMobile: boolean
  isIOS: boolean
  currentLanguage: string
  videoPlayOffset: number
  isProgrammaticScroll: boolean
  languageCollections: any // Add this new prop
}

interface QualityLevel {
  id: string
  label: string
}

export default function HeroVideoPlayer({
  currentPlayingContent,
  currentSeries,
  onContentChange,
  onSeriesChange,
  isMobile,
  isIOS,
  currentLanguage,
  videoPlayOffset,
  isProgrammaticScroll,
  languageCollections, // Add this new prop
}: HeroVideoPlayerProps) {
  // Add state for tracking time spent:
  const [sessionStartTime, setSessionStartTime] = useState<number>(Date.now())
  const [lastActiveTime, setLastActiveTime] = useState<number>(Date.now())

  // Hero video player states
  const adContainerRef = useRef<HTMLDivElement>(null)
  const heroVideoRef = useRef<HTMLVideoElement>(null)
  const videoContainerRef = useRef<HTMLDivElement>(null)
  const episodesScrollRef = useRef<HTMLDivElement>(null)
  const hlsRef = useRef<Hls | null>(null)
  const retryCountRef = useRef<number>(0)
  const maxRetries = 3

  // NEW: Adaptive HLS manager
  const adaptiveHLSRef = useRef<AdaptiveHLSManager | null>(null)

  const [heroIsPlaying, setHeroIsPlaying] = useState(true)
  const [heroCurrentTime, setHeroCurrentTime] = useState(0)
  const [heroDuration, setHeroDuration] = useState(0)
  const [heroVolume, setHeroVolume] = useState(0.8)
  const [heroIsMuted, setHeroIsMuted] = useState(false)
  const [showHeroControls, setShowHeroControls] = useState(false)
  const [isFullscreen, setIsFullscreen] = useState(false)
  const [controlsTimeout, setControlsTimeout] = useState<NodeJS.Timeout | null>(null)
  const [isVideoLoaded, setIsVideoLoaded] = useState(false)
  const [isBuffering, setIsBuffering] = useState(true)
  const [hasSetInitialTime, setHasSetInitialTime] = useState(false)
  const [episodeDurations, setEpisodeDurations] = useState<{ [key: string]: number }>({})
  const [videoAspectRatio, setVideoAspectRatio] = useState(16 / 9) // Default aspect ratio
  const [showVolumeSlider, setShowVolumeSlider] = useState(false)
  const [playbackSpeed, setPlaybackSpeed] = useState(1)
  const [isPictureInPicture, setIsPictureInPicture] = useState(false)
  const [isTheaterMode, setIsTheaterMode] = useState(false)
  const [isProgressHovered, setIsProgressHovered] = useState(false)
  const [previewTime, setPreviewTime] = useState<number | null>(null)
  const [previewPosition, setPreviewPosition] = useState<{ x: number; y: number } | null>(null)
  const [isDragging, setIsDragging] = useState(false)
  const [showQualityMenu, setShowQualityMenu] = useState(false)
  const [videoError, setVideoError] = useState<string | null>(null)
  const [showShareDialog, setShowShareDialog] = useState(false)
  const [showParticleEffects, setShowParticleEffects] = useState(false)
  const [particlePosition, setParticlePosition] = useState<{ x: number; y: number } | null>(null)
  const [particleType, setParticleType] = useState<"sparkle" | "confetti" | "thumbs">("sparkle")

  // Add ad-related state variables after the existing state declarations:
  const [adAnalytics, setAdAnalytics] = useState<AdAnalytics | null>(null)
  // Temporarily disable ads for testing
  const [showAds, setShowAds] = useState(false) // Changed from true to false

  // Ad-specific state
  const [adManager, setAdManager] = useState<GoogleAdManager | null>(null)
  const [isAdPlaying, setIsAdPlaying] = useState(false)
  const [currentAdBreak, setCurrentAdBreak] = useState<AdBreak | null>(null)
  const [scheduledAdBreaks, setScheduledAdBreaks] = useState<AdBreak[]>([])
  const [adCountdown, setAdCountdown] = useState<number | null>(null)
  const [canSkipAd, setCanSkipAd] = useState(false)
  const [adError, setAdError] = useState<string | null>(null)
  const [hasUserStarted, setHasUserStarted] = useState(false)

  // Control timeout for auto-hide
  const controlsTimeoutRef = useRef<NodeJS.Timeout | null>(null)

  // NEW: Device capabilities and enhanced quality management
  const deviceCapabilities = getDefaultCapabilities()

  const [userSelectedQuality, setUserSelectedQuality] = useState<string>("480p")

  // NEW: Feature flags for safe rollout
  const enableAdaptiveHLS = shouldUseAdaptiveHLS();

  const onAdEvent = (event, data) => {
    console.log("🎬 Ad Event:", event, data)
  }

  // Enhanced quality management with device awareness
  const availableQualities = useMemo(() => {
    const contentQualities = getAvailableQualities(currentPlayingContent, currentLanguage)

    return contentQualities.map((quality) => ({
      id: quality,
      label: quality,
    }))
  }, [currentPlayingContent, currentLanguage])

  const currentQuality = useMemo(() => {
    return availableQualities.find((q) => q.id === userSelectedQuality) || availableQualities[0]
  }, [availableQualities, userSelectedQuality])

  // Find which language collection contains the current content
  const currentCollection = useMemo(() => {
    if (!languageCollections || !currentPlayingContent) return null

    for (const [collectionId, collection] of Object.entries(languageCollections)) {
      if (
        collection &&
        collection.episodes &&
        collection.episodes.some((ep: any) => ep.id === currentPlayingContent.id)
      ) {
        return collection
      }
    }
    return null
  }, [languageCollections, currentPlayingContent])

  // Get current series data using centralized content manager (for metadata only)
  const currentSeriesData = getSeriesById(currentSeries)

  // History state management to reset share dialog on navigation
  useEffect(() => {
    const handlePopState = () => {
      // Reset share dialog state when user navigates back
      setShowShareDialog(false)
    }

    window.addEventListener("popstate", handlePopState)

    return () => {
      window.removeEventListener("popstate", handlePopState)
    }
  }, [])

  /**
   * Initialize ad manager when component mounts
   */
  useEffect(() => {
    if (!heroIsPlaying) return; // <-- Only after user starts
    if (!heroVideoRef.current || !adContainerRef.current || heroDuration === 0) return;
    const initializeAdManager = async () => {
      if (!heroVideoRef.current || !adContainerRef.current) return

      try {
        // Build targeting parameters
        const targeting = AdUtils.buildTargeting({
          id: currentPlayingContent.id,
          thumbnail: currentPlayingContent.thumbnail,
          title: "Test Video",
          duration: heroDuration || 0,
        })

        // Create ad configuration with targeting
        const enhancedAdConfig: AdConfig = {
          "adBreaks": [],
          "adTagUrl": "https://pubads.g.doubleclick.net/gampad/ads?iu=/21775744923/external/single_ad_samples&sz=640x480&cust_params=sample_ct%3Dlinear&ciu_szs=300x250%2C728x90&gdfp_req=1&output=vast&unviewed_position_start=1&env=vp&impl=s&correlator=1234567890",
          "enablePreroll": true,
          "enableMidroll": false,
          "enablePostroll": false,
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
        await manager.initialize(heroVideoRef.current, adContainerRef.current)
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
  }, [heroDuration, heroIsPlaying])


  /**
   * Schedule ad breaks when video metadata is loaded
   */
  useEffect(() => {

    if (adManager && heroDuration >= 0) {
      const breaks = adManager.scheduleAdBreaks(heroDuration)

      setScheduledAdBreaks(breaks)
    }
  }, [adManager, heroDuration])


  /**
   * Check for ad breaks during video playback
   */
  useEffect(() => {


    if (!adManager || isAdPlaying) return

    const adBreak = adManager.shouldPlayAd(heroCurrentTime)

    // Allow preroll ad even if heroIsPlaying is false
    if (adBreak && (heroIsPlaying || adBreak.type === "preroll")) {
      setHeroIsPlaying(false)
      console.log("🎬 Playing ad break:", adBreak.id)
      adManager.playAd(adBreak)
    }
  }, [adManager, heroCurrentTime, isAdPlaying, heroIsPlaying])



  // Add this function to load video duration
  const loadVideoDuration = useCallback((videoUrl: string, episodeId: string) => {
    return new Promise<number>((resolve) => {
      const video = document.createElement("video")
      video.preload = "metadata"

      const handleLoadedMetadata = () => {
        if (video.duration && isFinite(video.duration)) {
          setEpisodeDurations((prev) => ({
            ...prev,
            [episodeId]: video.duration,
          }))
          resolve(video.duration)
        } else {
          resolve(0)
        }
        video.removeEventListener("loadedmetadata", handleLoadedMetadata)
        video.removeEventListener("error", handleError)
      }

      const handleError = () => {
        resolve(0)
        video.removeEventListener("loadedmetadata", handleLoadedMetadata)
        video.removeEventListener("error", handleError)
      }

      video.addEventListener("loadedmetadata", handleLoadedMetadata)
      video.addEventListener("error", handleError)
      const selectedQuality = userSelectedQuality || "480p" // fallback to 480p if not set
      video.src = videoUrl[selectedQuality]
    })
  }, [])

  // Add this effect to load durations for all episodes
  useEffect(() => {
    if (currentSeriesData?.episodes) {
      currentSeriesData.episodes.forEach((episode) => {
        const videoUrl = getBestVideoUrl(episode.videoUrls, currentLanguage)
        if (videoUrl && !episodeDurations[episode.id]) {
          loadVideoDuration(videoUrl, episode.id)
        }
      })
    }
  }, [currentSeriesData, currentLanguage, loadVideoDuration, episodeDurations])

  // Enhanced video resolution with device-aware quality selection
  const currentVideoUrl = useMemo(() => {
    const resolution = resolveVideoUrlWithQuality(currentPlayingContent, currentLanguage, userSelectedQuality)


    logVideoResolution(currentPlayingContent, currentLanguage, resolution, "hero-video-player")
    return resolution.url
  }, [currentPlayingContent, currentLanguage, userSelectedQuality])

  // Auto-hide controls with proper cleanup
  const resetControlsTimeout = useCallback(
    (customDelay?: number) => {
      if (controlsTimeout) {
        clearTimeout(controlsTimeout)
      }

      setShowHeroControls(true)

      const delay = customDelay || (isMobile ? 3000 : 4000)

      const timeout = setTimeout(() => {
        if (heroIsPlaying) {
          setShowHeroControls(false)
        }
      }, delay)

      setControlsTimeout(timeout)
    },
    [controlsTimeout, heroIsPlaying, isMobile],
  )

  // Clear timeout on unmount
  useEffect(() => {
    return () => {
      if (controlsTimeout) {
        clearTimeout(controlsTimeout)
      }
    }
  }, [controlsTimeout])

  // Set initial play offset when video loads - fix infinite loop
  useEffect(() => {
    const video = heroVideoRef.current
    if (video && videoPlayOffset > 0 && !hasSetInitialTime && isVideoLoaded && video.readyState >= 2) {
      console.log("Setting initial play offset:", videoPlayOffset)
      video.currentTime = videoPlayOffset
      setHeroCurrentTime(videoPlayOffset)
      setHasSetInitialTime(true)
    }
  }, [videoPlayOffset, isVideoLoaded, hasSetInitialTime])

  // Reset hasSetInitialTime when content or language changes
  useEffect(() => {
    setHasSetInitialTime(false)
    setIsVideoLoaded(false)
    setIsBuffering(true)
    setVideoError(null)
    retryCountRef.current = 0
  }, [currentPlayingContent.id, currentLanguage])

  // Collection-based navigation functions
  const getNextEpisodeInCollection = useCallback(() => {
    if (!currentCollection?.episodes) return null

    const currentIndex = currentCollection.episodes.findIndex((ep) => ep.id === currentPlayingContent.id)
    if (currentIndex === -1) return null

    const isLastEpisode = currentIndex === currentCollection.episodes.length - 1
    const nextIndex = isLastEpisode ? 0 : currentIndex + 1

    return currentCollection.episodes[nextIndex] || null
  }, [currentCollection, currentPlayingContent.id])

  const getPreviousEpisodeInCollection = useCallback(() => {
    if (!currentCollection?.episodes) return null

    const currentIndex = currentCollection.episodes.findIndex((ep) => ep.id === currentPlayingContent.id)
    if (currentIndex === -1) return null

    const prevIndex = currentIndex === 0 ? currentCollection.episodes.length - 1 : currentIndex - 1

    return currentCollection.episodes[prevIndex] || null
  }, [currentCollection, currentPlayingContent.id])

  const playNextEpisode = useCallback(() => {
    const nextEpisode = getNextEpisodeInCollection()
    if (nextEpisode) {
      trackEpisodeNavigation(currentPlayingContent.id, nextEpisode.id, "next")
      onContentChange(nextEpisode)
    } else {
      console.log("No next episode available in collection")
    }
  }, [getNextEpisodeInCollection, currentPlayingContent.id, onContentChange])

  const playPreviousEpisode = useCallback(() => {
    const prevEpisode = getPreviousEpisodeInCollection()
    if (prevEpisode) {
      trackEpisodeNavigation(currentPlayingContent.id, prevEpisode.id, "previous")
      onContentChange(prevEpisode)
    } else {
      console.log("No previous episode available in collection")
    }
  }, [getPreviousEpisodeInCollection, currentPlayingContent.id, onContentChange])

  // Enhanced HLS error recovery function
  const handleHlsError = useCallback(
    (hls: Hls, data: any) => {
      console.error("HLS Error:", data)
      setVideoError(`HLS Error: ${data.details}`)

      if (data.fatal) {
        switch (data.type) {
          case Hls.ErrorTypes.NETWORK_ERROR:
            console.error("Fatal network error encountered, trying to recover...")

            // NEW: Try fallback quality first
            if (data.details === "manifestLoadError" && availableQualities.length > 1) {
              const currentQualityIndex = availableQualities.findIndex((q) => q.id === userSelectedQuality)
              const nextQualityIndex = currentQualityIndex + 1

              if (nextQualityIndex < availableQualities.length) {
                const fallbackQuality = availableQualities[nextQualityIndex]
                console.log(`🔄 Trying fallback quality: ${fallbackQuality.id}`)
                setUserSelectedQuality(fallbackQuality.id)
                setVideoError(`Network error: Trying ${fallbackQuality.label} quality...`)
                retryCountRef.current = 0 // Reset retry count for new quality
                return
              }
            }

            // Original retry logic
            if (retryCountRef.current < maxRetries) {
              retryCountRef.current++
              console.log(`Retry attempt ${retryCountRef.current}/${maxRetries}`)
              setTimeout(() => {
                hls.startLoad()
              }, 1000 * retryCountRef.current)
            } else {
              // NEW: Try next episode if all retries failed
              console.error("Max retries reached, trying next episode...")
              const nextEpisode = getNextEpisodeInCollection()
              if (nextEpisode) {
                setVideoError("Network error: Loading next episode...")
                setTimeout(() => {
                  onContentChange(nextEpisode)
                  setVideoError(null)
                }, 2000)
              } else {
                setVideoError("Network error: Unable to load video. Please check your connection and try again.")
              }
            }
            break
          case Hls.ErrorTypes.MEDIA_ERROR:
            console.error("Fatal media error encountered, trying to recover...")
            if (retryCountRef.current < maxRetries) {
              retryCountRef.current++
              console.log(`Media error retry attempt ${retryCountRef.current}/${maxRetries}`)
              hls.recoverMediaError()
            } else {
              console.error("Max retries reached for media error")
              setVideoError("Media error: Unable to play video after multiple attempts")
            }
            break
          default:
            console.error("Fatal error, cannot recover:", data)
            setVideoError(`Fatal error: ${data.details}`)
            hls.destroy()
            break
        }
      } else {
        // Handle non-fatal errors (keep existing logic)
        switch (data.details) {
          case "bufferStalledError":
            console.warn("Buffer stalled, attempting recovery...")
            setIsBuffering(true)

            if (retryCountRef.current < maxRetries) {
              retryCountRef.current++
              console.log(`Buffer stall recovery attempt ${retryCountRef.current}/${maxRetries}`)

              setTimeout(() => {
                try {
                  hls.startLoad()
                  setIsBuffering(false)
                } catch (error) {
                  console.error("Error during buffer stall recovery:", error)
                }
              }, 2000)
            } else {
              console.error("Max retries reached for buffer stall")
              setVideoError("Buffering error: Video playback stalled")
            }
            break
          case "fragLoadError":
          case "fragLoadTimeOut":
            console.warn(`Fragment load issue: ${data.details}`)
            if (retryCountRef.current < maxRetries) {
              retryCountRef.current++
              setTimeout(() => {
                hls.startLoad()
              }, 1000)
            }
            break
          default:
            console.warn("Non-fatal HLS error:", data.details)
            break
        }
      }
    },
    [
      maxRetries,
      availableQualities,
      userSelectedQuality,
      currentPlayingContent.id,
      currentSeries,
      onContentChange,
      getNextEpisodeInCollection,
    ],
  )

  // Hero video effects with enhanced HLS initialization
  useEffect(() => {
    const video = heroVideoRef.current
    if (!video) return

    // Log video loading attempt
    console.log(`🎬 Loading video:`, {
      contentId: currentPlayingContent.id,
      language: currentLanguage,
      quality: userSelectedQuality,
      url: currentVideoUrl,
      hasUrl: !!currentVideoUrl,
      deviceTier: deviceCapabilities.tier,
      adaptiveHLSEnabled: enableAdaptiveHLS,
    })

    const updateTime = () => setHeroCurrentTime(video.currentTime)

    const updateDuration = () => {
      console.log("Duration change event:", video.duration)
      if (video.duration && isFinite(video.duration) && video.duration > 0) {
        setHeroDuration(video.duration)
        console.log("Duration set to:", video.duration)
      }
    }

    const handleLoadedMetadata = () => {
      console.log("Loaded metadata, duration:", video.duration)
      if (video.duration && isFinite(video.duration) && video.duration > 0) {
        setHeroDuration(video.duration)
      }
    }

    const handleLoadedData = () => {
      setIsVideoLoaded(true)
      setIsBuffering(false)
      setVideoError(null)
      retryCountRef.current = 0 // Reset retry count on successful load

      console.log("Video loaded, duration:", video.duration)
      // Ensure duration is set
      if (video.duration && isFinite(video.duration) && video.duration > 0) {
        setHeroDuration(video.duration)
      }

      console.log("Video loaded")
      setShowHeroControls(true)
    }

    const handleCanPlayThrough = () => {
      console.log("Can play through, duration:", video.duration)
      if (video.duration && isFinite(video.duration) && video.duration > 0) {
        setHeroDuration(video.duration)
      }
      setIsBuffering(false)
    }

    const handleWaiting = () => {
      console.log("Video waiting for data...")
      setIsBuffering(true)
    }

    const handleCanPlay = () => {
      console.log("Video can play")
      setIsBuffering(false)
    }

    const playAdManually = async (type: 'preroll' | 'midroll' | 'postroll') => {
      if (!adManager) {
        console.warn("Ad manager not initialized");
        return;
      }

      if (!scheduledAdBreaks || scheduledAdBreaks.length === 0) {
        console.warn("No scheduled ad breaks found");
        return;
      }

      const adBreak = scheduledAdBreaks.find((b) => b.type === type);
      if (!adBreak) {
        console.warn(`No ${type} ad break found`);
        return;
      }

      try {
        console.log(`🎬 Manually playing ${type} ad...`);
        await adManager.playAd(adBreak); // Make sure this returns a Promise
        console.log(`✅ ${type} ad completed`);
      } catch (err) {
        console.error(`❌ Failed to play ${type} ad:`, err);
      }
    };



    const handlePlay = () => {
      console.log("🎬 Video play event fired")
      setIsBuffering(false)
      setVideoError(null)

      if (!heroIsPlaying) {
        setHeroIsPlaying(true)
        resetControlsTimeout()

        // 🔁 Trigger preroll ad manually if not already playing
        if (adManager && !adManager.isPlayingAd()) {
          const prerollAdBreak: AdBreak = {
            id: "manual-preroll",
            timeOffset: 0,
            adTagUrl: adManager.getDefaultAdTag(), // or use your custom adTagUrl
            type: "preroll",
            mandatory: true,
          }

          console.log("📺 Manually invoking preroll ad...")
          adManager.playAd(prerollAdBreak)
          return // ⛔ Prevent content play until ad finishes
        }

        // ▶️ Track content play only if no ad is playing
        trackVideoPlay(
          currentPlayingContent.id,
          getLocalizedText(currentPlayingContent.title, getUILanguage(currentLanguage)),
          currentLanguage,
          currentSeries,
        )
      }
    }


    const handlePause = () => {
      console.log("Video pause event fired")
      setShowHeroControls(true)
      if (controlsTimeout) {
        clearTimeout(controlsTimeout)
        setControlsTimeout(null)
      }
      if (heroIsPlaying) {
        setHeroIsPlaying(false)

        // Track video pause (existing)
        trackVideoPause(currentPlayingContent.id, heroCurrentTime, heroDuration)

        // Add Meta Pixel tracking for video pause
        trackMetaVideoPause(currentPlayingContent.id, heroCurrentTime, heroDuration)
      }
    }

    const handleVideoEnd = () => {
      setHeroIsPlaying(false)
      setShowHeroControls(true)

      // Track video completion (existing)
      trackVideoComplete(
        currentPlayingContent.id,
        getLocalizedText(currentPlayingContent.title, getUILanguage(currentLanguage)),
        heroDuration,
      )

      // Add Google Analytics tracking for time spent and viewing habits
      const sessionDuration = (Date.now() - sessionStartTime) / 1000
      trackTimeSpent(currentPlayingContent.id, sessionDuration)
      trackViewingHabit(currentPlayingContent.id, sessionDuration)

      // Add Meta Pixel tracking for time spent and viewing habits
      trackMetaTimeSpent(currentPlayingContent.id, sessionDuration)
      trackMetaViewingHabit(currentPlayingContent.id, sessionDuration)

      // Auto play next episode with delay using collection-based logic
      setTimeout(() => {
        const nextEpisode = getNextEpisodeInCollection()
        if (nextEpisode) {
          trackEpisodeNavigation(currentPlayingContent.id, nextEpisode.id, "next")
          onContentChange(nextEpisode)

          setTimeout(() => {
            if (heroVideoRef.current) {
              const playPromise = heroVideoRef.current.play()
              if (playPromise !== undefined) {
                playPromise
                  .then(() => {
                    setHeroIsPlaying(true)
                  })
                  .catch(() => {
                    setHeroIsPlaying(false)
                  })
              }
            }
          }, 500)
        }
      }, 1000)
    }

    const handleVideoError = (e: Event) => {
      console.error("Video element error:", e)
      const videoElement = e.target as HTMLVideoElement
      if (videoElement.error) {
        const errorMessage = `Video error: ${videoElement.error.message} (Code: ${videoElement.error.code})`
        console.error(errorMessage)
        setVideoError(errorMessage)
      }
    }

    // Fullscreen change event listener
    const handleFullscreenChange = () => {
      const isCurrentlyFullscreen = !!(
        document.fullscreenElement ||
        (document as any).webkitFullscreenElement ||
        (document as any).mozFullscreenElement ||
        (document as any).msFullscreenElement ||
        // ADD: Android video fullscreen detection
        (!isIOS && heroVideoRef.current && (heroVideoRef.current as any).webkitDisplayingFullscreen)
      )
      setIsFullscreen(isCurrentlyFullscreen)
    }

    // Add event listeners
    video.addEventListener("timeupdate", updateTime)
    video.addEventListener("loadedmetadata", handleLoadedMetadata)
    video.addEventListener("loadeddata", handleLoadedData)
    video.addEventListener("canplaythrough", handleCanPlayThrough)
    video.addEventListener("waiting", handleWaiting)
    video.addEventListener("canplay", handleCanPlay)
    video.addEventListener("play", handlePlay)
    video.addEventListener("pause", handlePause)
    video.addEventListener("ended", handleVideoEnd)
    video.addEventListener("durationchange", updateDuration)
    video.addEventListener("error", handleVideoError)

    document.addEventListener("fullscreenchange", handleFullscreenChange)
    document.addEventListener("webkitfullscreenchange", handleFullscreenChange)
    document.addEventListener("mozfullscreenchange", handleFullscreenChange)
    document.addEventListener("MSFullscreenChange", handleFullscreenChange)

    // Set initial volume
    video.volume = heroVolume

    // Try to get duration immediately if video is already loaded
    if (video.readyState >= 1 && video.duration && isFinite(video.duration) && video.duration > 0) {
      setHeroDuration(video.duration)
      console.log("Initial duration set:", video.duration)
    }

    // Fallback: check duration periodically until we get it
    const durationCheckInterval = setInterval(() => {
      if (video.duration && isFinite(video.duration) && video.duration > 0) {
        setHeroDuration(video.duration)
        console.log("Duration found via interval:", video.duration)
        clearInterval(durationCheckInterval)
      }
    }, 100)

    // Clear interval after 5 seconds
    setTimeout(() => {
      clearInterval(durationCheckInterval)
    }, 5000)

    return () => {
      video.removeEventListener("timeupdate", updateTime)
      video.removeEventListener("loadedmetadata", handleLoadedMetadata)
      video.removeEventListener("loadeddata", handleLoadedData)
      video.removeEventListener("canplaythrough", handleLoadedData)
      video.removeEventListener("waiting", handleWaiting)
      video.removeEventListener("canplay", handleCanPlay)
      video.removeEventListener("pause", handlePause)
      video.removeEventListener("ended", handleVideoEnd)
      video.removeEventListener("durationchange", updateDuration)
      video.removeEventListener("error", handleVideoError)

      document.removeEventListener("fullscreenchange", handleFullscreenChange)
      document.removeEventListener("webkitfullscreenchange", handleFullscreenChange)
      document.removeEventListener("mozfullscreenchange", handleFullscreenChange)
      document.removeEventListener("MSFullscreenChange", handleFullscreenChange)
    }
  }, [
    currentPlayingContent.id,
    currentLanguage,
    heroVolume,
    currentVideoUrl,
    enableAdaptiveHLS,
    sessionStartTime,
    getNextEpisodeInCollection,
  ])

  // Handle autoplay promise to sync state with actual playback
  useEffect(() => {
    const video = heroVideoRef.current
    if (!video || !isVideoLoaded) return

    // Only attempt autoplay promise handling once when video is loaded
    const handleAutoplay = async () => {
      try {
        const playPromise = video.play()
        if (playPromise !== undefined) {
          await playPromise
          setHeroIsPlaying(true)
        }
      } catch (error) {
        console.log("Autoplay prevented by browser:", error)
        setHeroIsPlaying(false) // Sync state with reality
        setShowHeroControls(true)
      }
    }

    // Small delay to ensure video is ready
    const timeoutId = setTimeout(handleAutoplay, 100)

    return () => clearTimeout(timeoutId)
  }, [isVideoLoaded, currentVideoUrl])

  // Scroll detection to pause video when user scrolls down

  const toggleHeroPlay = useCallback(
    (e?: React.MouseEvent) => {
      if (e) {
        e.preventDefault()
        e.stopPropagation()
      }

      const video = heroVideoRef.current
      if (!video) return

      // Clear any existing timeout first
      if (controlsTimeout) {
        clearTimeout(controlsTimeout)
        setControlsTimeout(null)
      }

      try {
        console.log("Toggle play - current state:", heroIsPlaying, "video paused:", video.paused)

        if (heroIsPlaying) {
          console.log("Pausing video...")
          video.pause()
          setHeroIsPlaying(false)
          setShowHeroControls(true)
        } else {
          console.log("Playing video...")
          const playPromise = video.play()
          if (playPromise !== undefined) {
            playPromise
              .then(() => {
                console.log("Video play promise resolved")
                setHeroIsPlaying(true)
                resetControlsTimeout()
              })
              .catch((error) => {
                console.warn("Play failed:", error)
                setHeroIsPlaying(false)
                setShowHeroControls(true)
                setVideoError(`Play failed: ${error.message}`)
              })
          } else {
            console.log("Video play returned undefined")
            setHeroIsPlaying(true)
            resetControlsTimeout()
          }
        }
      } catch (error) {
        console.warn("Toggle play failed:", error)
        setShowHeroControls(true)
        setVideoError(`Toggle play failed: ${error}`)
      }
    },
    [heroIsPlaying, controlsTimeout, resetControlsTimeout],
  )

  const handleHeroSeek = useCallback(
    (value: number[]) => {
      const video = heroVideoRef.current
      if (!video) return

      const previousTime = heroCurrentTime
      const newTime = value[0]

      // Smooth seeking: only update video time when not dragging or on final commit
      if (!isDragging) {
        video.currentTime = newTime
      }
      setHeroCurrentTime(newTime)
      resetControlsTimeout()

      // Track seek if significant change (more than 5 seconds) (existing)
      if (Math.abs(newTime - previousTime) > 5) {
        trackVideoSeek(currentPlayingContent.id, previousTime, newTime)
        // Add Meta Pixel tracking for video seek
        trackMetaVideoSeek(currentPlayingContent.id, previousTime, newTime)
      }
    },
    [resetControlsTimeout, heroCurrentTime, currentPlayingContent.id, isDragging],
  )

  const handleSeekCommit = useCallback((value: number[]) => {
    const video = heroVideoRef.current
    if (!video) return

    const newTime = value[0]
    video.currentTime = newTime
    setIsDragging(false)
    setPreviewTime(null)
    setPreviewPosition(null)
  }, [])

  const handleProgressClick = useCallback(
    (e: React.MouseEvent) => {
      const progressBar = e.currentTarget
      const rect = progressBar.getBoundingClientRect()
      const clickX = e.clientX - rect.left
      const percentage = clickX / rect.width
      const newTime = percentage * heroDuration

      if (newTime >= 0 && newTime <= heroDuration) {
        const video = heroVideoRef.current
        if (video) {
          video.currentTime = newTime
          setHeroCurrentTime(newTime)
          resetControlsTimeout()
          trackVideoSeek(currentPlayingContent.id, heroCurrentTime, newTime)
        }
      }
    },
    [heroDuration, heroCurrentTime, resetControlsTimeout, currentPlayingContent.id],
  )

  const handleProgressHover = useCallback(
    (e: React.MouseEvent) => {
      if (!isProgressHovered) return

      const progressBar = e.currentTarget
      const rect = progressBar.getBoundingClientRect()
      const hoverX = e.clientX - rect.left
      const percentage = Math.max(0, Math.min(1, hoverX / rect.width))
      const hoverTime = percentage * heroDuration

      setPreviewTime(hoverTime)
      setPreviewPosition({
        x: e.clientX,
        y: rect.top - 10,
      })
    },
    [isProgressHovered, heroDuration],
  )

  const handleHeroVolumeChange = useCallback((value: number[]) => {
    const video = heroVideoRef.current
    if (!video) return

    const newVolume = value[0]
    video.volume = newVolume
    setHeroVolume(newVolume)
    setHeroIsMuted(newVolume === 0)
  }, [])

  const toggleHeroMute = useCallback(() => {
    const video = heroVideoRef.current
    if (!video) return

    if (heroIsMuted) {
      video.volume = heroVolume
      setHeroIsMuted(false)
    } else {
      video.volume = 0
      setHeroIsMuted(true)
    }

    resetControlsTimeout()
  }, [heroIsMuted, heroVolume, resetControlsTimeout])

  const skipHero = useCallback(
    (seconds: number) => {
      const video = heroVideoRef.current
      if (!video) return

      video.currentTime = Math.max(0, Math.min(heroDuration, video.currentTime + seconds))
      resetControlsTimeout()
    },
    [heroDuration, resetControlsTimeout],
  )

  // Enhanced fullscreen with mobile support
  const toggleFullscreen = useCallback(() => {
    const container = videoContainerRef.current
    if (!container) return

    try {
      if (!isFullscreen) {
        // Enter fullscreen (existing code...)
        if (container.requestFullscreen) {
          container.requestFullscreen()
        } else if ((container as any).webkitRequestFullscreen) {
          ; (container as any).webkitRequestFullscreen()
        } else if ((container as any).mozRequestFullScreen) {
          ; (container as any).mozRequestFullScreen()
        } else if ((container as any).msRequestFullscreen) {
          ; (container as any).msRequestFullscreen()
        } else if (isIOS && heroVideoRef.current) {
          // iOS Safari fallback
          ; (heroVideoRef.current as any).webkitEnterFullscreen?.()
        } else if (!isIOS && isMobile && heroVideoRef.current) {
          // Android fallback - try video element fullscreen
          const video = heroVideoRef.current as any
          if (video.webkitEnterFullscreen) {
            video.webkitEnterFullscreen()
          } else if (video.requestFullscreen) {
            video.requestFullscreen()
          }
        }
        trackFullscreenToggle(currentPlayingContent.id, true)
        // Add Meta Pixel tracking
        trackMetaFullscreenToggle(currentPlayingContent.id, true)
      } else {
        // Exit fullscreen (existing code...)
        if (document.exitFullscreen) {
          document.exitFullscreen()
        } else if ((document as any).webkitExitFullscreen) {
          ; (document as any).webkitExitFullscreen()
        } else if ((document as any).mozCancelFullScreen) {
          ; (document as any).mozCancelFullScreen()
        } else if ((document as any).msExitFullscreen) {
          ; (container as any).msExitFullscreen()
        }
        trackFullscreenToggle(currentPlayingContent.id, false)
        // Add Meta Pixel tracking
        trackMetaFullscreenToggle(currentPlayingContent.id, false)
      }
    } catch (error) {
      console.warn("Fullscreen not supported:", error)
    }

    resetControlsTimeout()
  }, [isFullscreen, isIOS, resetControlsTimeout, currentPlayingContent.id, isMobile])

  const formatTime = useCallback((time: number) => {
    if (!time || !isFinite(time)) return "0:00"
    const minutes = Math.floor(time / 60)
    const seconds = Math.floor(time % 60)
    return `${minutes}:${seconds.toString().padStart(2, "0")}`
  }, [])

  const scrollEpisodes = useCallback((direction: "left" | "right") => {
    const container = episodesScrollRef.current
    if (!container) {
      console.error("Episodes scroll container not found")
      return
    }

    // Get container dimensions
    const containerWidth = container.clientWidth
    const scrollWidth = container.scrollWidth
    const currentScrollLeft = container.scrollLeft
    const maxScrollLeft = scrollWidth - containerWidth

    // If content doesn't overflow, no need to scroll
    if (scrollWidth <= containerWidth) {
      console.log("Content doesn't overflow, no scroll needed")
      return
    }

    // Calculate scroll amount (scroll by container width for smoother experience)
    const scrollAmount = containerWidth * 0.8

    let targetScrollLeft: number

    if (direction === "left") {
      targetScrollLeft = Math.max(0, currentScrollLeft - scrollAmount)
    } else {
      targetScrollLeft = Math.min(maxScrollLeft, currentScrollLeft + scrollAmount)
    }

    container.scrollTo({
      left: targetScrollLeft,
      behavior: "smooth",
    })

    // Add Google Analytics tracking for carousel scroll
    trackCarouselScroll("episodes", direction)

    // Add Meta Pixel tracking for carousel scroll
    trackMetaCarouselScroll("episodes", direction)
  }, [])

  // Enhanced touch handling for iOS
  const handleTouchStart = useCallback(
    (e: React.TouchEvent) => {
      // Check if the touch is within the dropdown menu or control elements
      const target = e.target as HTMLElement

      // Enhanced button detection for iOS Chrome
      const isButton =
        target.closest("button") ||
        target.closest('[role="button"]') ||
        target.tagName === "BUTTON" ||
        target.closest(".lucide") || // Icon inside button
        target.closest("[data-button]")

      const isControlElement =
        target.closest('[role="menuitem"]') ||
        target.closest("[data-radix-dropdown-menu]") ||
        target.closest('[role="slider"]')

      // NEW: Detect Android fullscreen horizontal mode
      const isAndroidFullscreenHorizontal =
        (!isIOS && isMobile && isFullscreen && window.screen.orientation?.angle === 90) ||
        window.screen.orientation?.angle === 270

      if (isButton || isControlElement) {
        // For iOS, don't prevent default on button touches to allow proper click handling
        if (isIOS) {
          return // Let the button handle its own touch events
        }
        // For Android fullscreen horizontal, let button events pass through
        if (isAndroidFullscreenHorizontal) {
          return // Don't intercept button touches in Android fullscreen horizontal
        }
        // NEW: For Android, let fullscreen button work properly
        if (!isIOS && target.closest('[aria-label*="fullscreen"], [aria-label*="Fullscreen"]')) {
          return // Don't prevent fullscreen button on Android
        }
        // For Android, prevent default and stop propagation to avoid double-tap issues
        e.preventDefault()
        e.stopPropagation()
        return
      }

      // Only prevent default for non-button touches
      e.preventDefault()
      e.stopPropagation()
      setShowHeroControls(true)
      resetControlsTimeout()
    },
    [resetControlsTimeout, isIOS, isMobile, isFullscreen],
  )

  const handleTouchEnd = useCallback(
    (e: React.TouchEvent) => {
      // Check if the touch is within the dropdown menu or control elements
      const target = e.target as HTMLElement

      // Enhanced button detection for iOS Chrome
      const isButton =
        target.closest("button") ||
        target.closest('[role="button"]') ||
        target.tagName === "BUTTON" ||
        target.closest(".lucide") || // Icon inside button
        target.closest("[data-button]")

      const isControlElement =
        target.closest('[role="menuitem"]') ||
        target.closest("[data-radix-dropdown-menu]") ||
        target.closest('[role="slider"]')

      // NEW: Detect Android fullscreen horizontal mode
      const isAndroidFullscreenHorizontal =
        (!isIOS && isMobile && isFullscreen && window.screen.orientation?.angle === 90) ||
        window.screen.orientation?.angle === 270

      if (isButton || isControlElement) {
        // For iOS, don't prevent default on button touches
        if (isIOS) {
          return
        }
        // For Android fullscreen horizontal, let button events pass through
        if (isAndroidFullscreenHorizontal) {
          return // Don't intercept button touches in Android fullscreen horizontal
        }
        return
      }

      e.preventDefault()
      e.stopPropagation()
      resetControlsTimeout()
    },
    [resetControlsTimeout, isIOS, isMobile, isFullscreen],
  )

  const handleShareClick = useCallback(() => {
    setShowShareDialog(true)
    resetControlsTimeout()

    // Add Google Analytics tracking for share click
    trackShareClick(
      currentPlayingContent.id,
      getLocalizedText(currentPlayingContent.title, getUILanguage(currentLanguage)),
      "share_dialog",
    )

    // Add Meta Pixel tracking for share click
    trackMetaShareClick(
      currentPlayingContent.id,
      getLocalizedText(currentPlayingContent.title, getUILanguage(currentLanguage)),
      "share_dialog",
    )
  }, [resetControlsTimeout, currentPlayingContent.id, currentLanguage])

  // Enhanced HLS initialization with adaptive configuration
  useEffect(() => {
    if (!currentVideoUrl) return;

    const video = heroVideoRef.current;
    if (!video) return;

    // 🔧 Step 1: Reset the <video> element before attaching a new source
    video.pause();
    video.removeAttribute("src");
    video.load(); // <-- critical to avoid MEDIA_ELEMENT_ERROR (Code: 4)

    // 🔁 Step 2: Clean up any existing HLS instances
    if (adaptiveHLSRef.current) {
      adaptiveHLSRef.current.destroy();
      adaptiveHLSRef.current = null;
    }

    if (hlsRef.current) {
      hlsRef.current.destroy();
      hlsRef.current = null;
    }

    // Step 3: Reset error and retry state
    setVideoError(null);
    retryCountRef.current = 0;

    // ✅ Step 4: Try Adaptive HLS first if enabled
    if (enableAdaptiveHLS) {
      try {
        console.log("🚀 Initializing Adaptive HLS");

        const adaptiveHLS = createAdaptiveHLSInstance(
          {
            onError: handleHlsError,
            onQualityChange: (level) => {
              console.log("📊 Quality change:", level);
            },
            onBufferUpdate: (bufferInfo) => {
              // Optional: buffer insights
            },
          },
          {
            enablePerformanceMonitoring: false,
            enableAutoQualityAdjustment: false,
            enableDeviceOptimization: false,
          }
        );

        adaptiveHLS.loadSource(currentVideoUrl, video);
        adaptiveHLSRef.current = adaptiveHLS;

        console.log("✅ Adaptive HLS initialized successfully");
        return;
      } catch (error) {
        console.warn("⚠️ Adaptive HLS failed, falling back to standard HLS:", error);
      }
    }

    // 📦 Step 5: Fallback to standard hls.js
    if (Hls.isSupported()) {
      const config = {
        enableWorker: true,
        lowLatencyMode: false,
        backBufferLength: 30,
        progressive: true,
        maxBufferLength: 15,
        maxMaxBufferLength: 60,
        maxBufferSize: 30 * 1000 * 1000,
        maxBufferHole: 0.1,
        highBufferWatchdogPeriod: 3,
        nudgeMaxRetry: 3,
        nudgeOffset: 0.1,
        startFragPrefetch: true,
        testBandwidth: false,
        fragLoadingTimeOut: 20000,
        fragLoadingMaxRetry: 3,
        fragLoadingRetryDelay: 1000,
        manifestLoadingTimeOut: 10000,
        manifestLoadingMaxRetry: 3,
        manifestLoadingRetryDelay: 1000,
        xhrSetup: (xhr: XMLHttpRequest) => {
          xhr.withCredentials = false;
        },
      };

      const hls = new Hls(config);
      hlsRef.current = hls;

      hls.on(Hls.Events.MANIFEST_LOADED, () => {
        console.log("✅ HLS Manifest loaded");
      });

      hls.on(Hls.Events.MANIFEST_PARSED, () => {
        console.log("✅ HLS Manifest parsed");
      });

      hls.on(Hls.Events.LEVEL_LOADED, () => {
        console.log("✅ HLS Level loaded");
      });

      hls.on(Hls.Events.FRAG_LOADING, (_, data) => {
        console.log("🔄 Loading fragment:", data.frag.url);
      });

      hls.on(Hls.Events.FRAG_LOADED, (_, data) => {
        console.log("✅ Fragment loaded:", data.frag.url);
      });

      hls.on(Hls.Events.ERROR, (event, data) => {
        handleHlsError(hls, data);
      });

      hls.loadSource(currentVideoUrl);
      hls.attachMedia(video);

      console.log("🎬 Standard HLS initialized for:", currentVideoUrl);
    } else if (video.canPlayType("application/vnd.apple.mpegurl")) {
      // 🍎 Native HLS fallback (Safari)
      console.log("🎬 Using native HLS support");
      video.src = currentVideoUrl;
      video.addEventListener("loadedmetadata", () => {
        video.play().catch((e) => {
          console.warn("🔴 Native video play failed:", e);
        });
      });
    } else {
      console.error("❌ HLS not supported in this browser");
      setVideoError("HLS is not supported in this browser");
    }

    // 🧹 Cleanup on unmount or URL change
    return () => {
      if (adaptiveHLSRef.current) {
        adaptiveHLSRef.current.destroy();
        adaptiveHLSRef.current = null;
      }
      if (hlsRef.current) {
        hlsRef.current.destroy();
        hlsRef.current = null;
      }

      video.pause();
      video.removeAttribute("src");
      video.load();
    };
  }, [currentVideoUrl, handleHlsError, enableAdaptiveHLS]);


  // Add video metadata handler
  const handleVideoMetadata = useCallback(() => {
    // Only calculate aspect ratio for mobile devices
    if (!isMobile) {
      setVideoAspectRatio(16 / 9) // Use default 16:9 for non-mobile
      return
    }

    const video = heroVideoRef.current
    if (video && video.videoWidth && video.videoHeight) {
      const aspectRatio = video.videoWidth / video.videoHeight
      setVideoAspectRatio(aspectRatio)
      console.log("Mobile video aspect ratio:", aspectRatio)
    }
  }, [isMobile])

  const handlePlaybackSpeedChange = useCallback(
    (speed: number) => {
      const video = heroVideoRef.current
      if (!video) return
      video.playbackRate = speed
      setPlaybackSpeed(speed)
      resetControlsTimeout()
    },
    [resetControlsTimeout],
  )

  const togglePictureInPicture = useCallback(async () => {
    const video = heroVideoRef.current
    if (!video) return

    try {
      if (document.pictureInPictureElement) {
        await document.exitPictureInPicture()
        setIsPictureInPicture(false)
      } else {
        await video.requestPictureInPicture()
        setIsPictureInPicture(true)
      }
    } catch (error) {
      console.warn("Picture-in-Picture failed:", error)
    }
    resetControlsTimeout()
  }, [resetControlsTimeout])

  const toggleTheaterMode = useCallback(() => {
    setIsTheaterMode(!isTheaterMode)
    resetControlsTimeout()
  }, [isTheaterMode, resetControlsTimeout])

  // Enhanced quality change handler with device validation
  const handleQualityChange = useCallback(
    (quality: QualityLevel) => {
      console.log("Changing quality to:", quality.label)

      setUserSelectedQuality(quality.id)
      setShowQualityMenu(false)
      setVideoError(null)
      retryCountRef.current = 0

      trackQualityChange(currentPlayingContent.id, quality.label)

      if (adaptiveHLSRef.current) {
        adaptiveHLSRef.current.changeQuality(quality.id)
      }
    },
    [currentPlayingContent.id],
  )

  // Retry function for manual retry
  const retryVideo = useCallback(() => {
    console.log("Manual retry triggered")
    setVideoError(null)
    setIsBuffering(true)
    retryCountRef.current = 0

    const hls = hlsRef.current
    const adaptiveHLS = adaptiveHLSRef.current

    if (adaptiveHLS) {
      // Retry with adaptive HLS
      const video = heroVideoRef.current
      if (video && currentVideoUrl) {
        adaptiveHLS.loadSource(currentVideoUrl, video)
      }
    } else if (hls) {
      hls.startLoad()
    } else {
      // Force re-initialization
      const video = heroVideoRef.current
      if (video && currentVideoUrl) {
        video.src = currentVideoUrl
        video.load()
      }
    }
  }, [currentVideoUrl])

  const createButtonHandler = useCallback((callback: (e?: React.MouseEvent) => void) => {
    return {
      onClick: (e?: React.MouseEvent) => {
        e?.preventDefault()
        e?.stopPropagation()
        callback(e)
      },
    }
  }, [])

  // Add this useEffect to reset session tracking when content changes
  useEffect(() => {
    setSessionStartTime(Date.now())
    setLastActiveTime(Date.now())
  }, [currentPlayingContent.id])

  // Add debug logging
  useEffect(() => {
    console.log("🎬 Hero Video Player Debug:", {
      showAds,
      currentVideoUrl,
      heroDuration,
      isVideoLoaded,
      isBuffering,
      videoError,
    })
  }, [showAds, currentVideoUrl, heroDuration, isVideoLoaded, isBuffering, videoError])

  // Simplified ad config for testing
  const testAdConfig = {
    adBreaks: [],
    adTagUrl:
      "https://pubads.g.doubleclick.net/gampad/ads?iu=/21775744923/external/single_ad_samples&sz=640x480&cust_params=sample_ct%3Dlinear&ciu_szs=300x250%2C728x90&gdfp_req=1&output=vast&unviewed_position_start=1&env=vp&impl=s&correlator=",
    enablePreroll: true, // Disable for now
    enableMidroll: true,
    enablePostroll: true,
  }

  return (
    <>
      {console.log(heroIsPlaying)}
      {/* Hero Video Player Section */}
      <div
        ref={videoContainerRef}
        className={`hero-video-container sticky top-12 z-20 w-full bg-black ${isFullscreen ? "h-screen" : isMobile ? "h-0" : "h-[70vh]"
          }`}
        style={{
          paddingBottom: isFullscreen ? "0" : isMobile ? `${(1 / videoAspectRatio) * 100}%` : "0",
        }}
        onTouchStart={handleTouchStart}
        onTouchEnd={handleTouchEnd}
        onMouseLeave={() => {
          if (!isMobile) {
            resetControlsTimeout(1500) // Slightly longer than current 1s
          }
        }}
      >
        <video
          ref={heroVideoRef}
          className="absolute inset-0 w-full h-full object-contain"
          muted={heroIsMuted}
          playsInline
          preload="auto"
          autoPlay
          style={{ outline: "none" }}
          controls={false}
          onLoadedMetadata={handleVideoMetadata}
          onTouchStart={(e) => {
            if (isMobile) {
              setShowHeroControls(true)
              resetControlsTimeout()
            }
          }}
          onMouseEnter={() => {
            if (!isMobile && controlsTimeout) {
              clearTimeout(controlsTimeout)
              setShowHeroControls(true)
            }
          }}
          onMouseMove={() => {
            if (!isMobile) {
              setShowHeroControls(true)
              resetControlsTimeout()
            }
          }}
          onClick={(e) => {
            e.preventDefault()
            e.stopPropagation()
            setShowHeroControls(true)
            resetControlsTimeout()
          }}
        />

        <div
          ref={adContainerRef}
          className={`absolute inset-0 z-50 ${isAdPlaying ? "pointer-events-auto block" : "hidden"}`}
        />


        {/* Thumbnail overlay when paused */}
        {!heroIsPlaying && currentPlayingContent.thumbnail && (
          <div className="absolute inset-0 bg-black">
            <Image
              src={currentPlayingContent.thumbnail || "/placeholder.svg"}
              alt="Video thumbnail"
              fill
              className="object-contain"
              priority
            />
          </div>
        )}

        {/* Error Display */}
        {videoError && (
          <div className="absolute inset-0 flex items-center justify-center bg-black/80">
            <div className="text-center text-white p-6 max-w-md">
              <div className="text-red-400 text-xl mb-4">⚠️</div>
              <h3 className="text-lg font-semibold mb-2">Video Error</h3>
              <p className="text-sm text-gray-300 mb-4">{videoError}</p>
              <Button onClick={retryVideo} className="bg-red-600 hover:bg-red-700 text-white px-6 py-2">
                Retry
              </Button>
            </div>
          </div>
        )}

        {/* Buffering Indicator */}
        {isBuffering && !videoError && (
          <div className="absolute inset-0 flex items-center justify-center bg-black/20">
            <div className="text-center">
              <div className="w-8 h-8 border-2 border-white border-t-transparent rounded-full animate-spin mb-2"></div>
            </div>
          </div>
        )}

        {/* Video Controls Overlay */}
        {!isAdPlaying && (<div
          className={`absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent transition-opacity duration-300 ${showHeroControls ? "opacity-100" : "opacity-0"
            }`}
          onTouchStart={handleTouchStart}
          onTouchEnd={handleTouchEnd}
          onMouseEnter={() => {
            if (!isMobile && controlsTimeout) {
              clearTimeout(controlsTimeout)
              setShowHeroControls(true) // Ensure controls stay visible
            }
          }}
          onMouseLeave={() => {
            if (!isMobile) {
              resetControlsTimeout() // Standard 3s/4s timing
            }
          }}
        >
          {/* Center Play Button */}
          <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
            <Button
              variant="ghost"
              size="icon"
              {...createButtonHandler(toggleHeroPlay)}
              data-button="play"
              role="button"
              aria-label="Play video"
              className={`pointer-events-auto bg-black/50 hover:bg-black/70 text-white rounded-full transition-all duration-300 w-16 md:w-20 h-16 md:h-20 ${heroIsPlaying && isVideoLoaded && !videoError ? "opacity-0 scale-75" : "opacity-100 scale-100"}`}
            >
              {heroIsPlaying ? (
                <Pause className={`fill-white ${isMobile ? "w-8 h-8" : "w-10 h-10"}`} />
              ) : (
                <Play className={`fill-white ${isMobile ? "w-8 h-8" : "w-10 h-10"} ml-1`} />
              )}
            </Button>
          </div>

          {/* Bottom Controls */}
          <div className={`absolute bottom-0 left-0 right-0 ${isFullscreen ? "p-4 md:p-6" : "p-2 md:p-4"}`}>
            <div
              className="relative mb-0 z-10"
              style={{
                position: "absolute",
                bottom: 0,
                left: 0,
                right: 0,
                zIndex: 10,
                padding: `${isMobile ? "4px" : "8px"} ${isFullscreen ? "16px" : "8px"} 0`,
              }}
              onMouseEnter={() => setIsProgressHovered(true)}
              onMouseLeave={() => {
                setIsProgressHovered(false)
                setPreviewTime(null)
                setPreviewPosition(null)
              }}
              onMouseMove={handleProgressHover}
              onClick={handleProgressClick}
            >
              {/* Wrapper to align markers directly on top of the slider track */}
              <div className="relative w-full">
                <Slider
                  value={[heroCurrentTime]}
                  max={heroDuration || 100}
                  step={0.1}
                  onValueChange={handleHeroSeek}
                  onValueCommit={handleSeekCommit}
                  onPointerDown={() => setIsDragging(true)}
                  onPointerUp={() => setIsDragging(false)}
                  className={`w-full cursor-pointer transition-all duration-200 ${isMobile
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

                {/* 🎯 Ad Break Markers aligned with the track */}
                {scheduledAdBreaks?.length > 0 && heroDuration > 0 && (
                  <div className="absolute left-0 top-0 w-full h-full pointer-events-none">
                    {scheduledAdBreaks.map((adBreak) => (
                      <div
                        key={adBreak.id}
                        className="absolute w-[2px] h-[10px] bg-yellow-400 rounded-sm"
                        style={{
                          left: `calc(${(adBreak.timeOffset / heroDuration) * 100}%)`,
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


            {/* Control Buttons - positioned above progress bar */}
            <div
              className="flex items-center justify-between"
              style={{
                position: "relative",
                zIndex: 5,
                marginBottom: `${isMobile ? "16px" : "20px"}`,
              }}
            >
              <div className={`flex items-center ${isMobile ? "space-x-2" : "space-x-3"}`}>
                {isMobile ? (
                  <>
                    <Button
                      variant="ghost"
                      size="icon"
                      {...createButtonHandler(() => skipHero(-10))}
                      className="text-white hover:bg-white-transparent w-8 h-8"
                    >
                      <SkipBack className="w-4 h-4" />
                    </Button>

                    <Button
                      variant="ghost"
                      size="icon"
                      {...createButtonHandler(toggleHeroPlay)}
                      className="text-white hover:bg-white-transparent w-10 h-10"
                      data-button="play-control"
                    >
                      {heroIsPlaying ? (
                        <Pause className="w-5 h-5 fill-white" />
                      ) : (
                        <Play className="w-5 h-5 fill-white" />
                      )}
                    </Button>

                    <Button
                      variant="ghost"
                      size="icon"
                      {...createButtonHandler(() => skipHero(10))}
                      className="text-white hover:bg-white-transparent w-8 h-8"
                    >
                      <SkipForward className="w-4 h-4" />
                    </Button>

                    <div className="text-white text-xs font-medium">
                      {formatTime(heroCurrentTime)} / {formatTime(heroDuration)}
                    </div>
                  </>
                ) : (
                  <>
                    <Button
                      variant="ghost"
                      size="icon"
                      {...createButtonHandler(playPreviousEpisode)}
                      className="text-white hover:bg-white-transparent"
                    >
                      <ChevronLeft className="w-5 h-5" />
                    </Button>

                    <Button
                      variant="ghost"
                      size="icon"
                      {...createButtonHandler(toggleHeroPlay)}
                      className="text-white hover:bg-white-transparent"
                      data-button="play-control"
                    >
                      {heroIsPlaying ? (
                        <Pause className="w-5 h-5 fill-white" />
                      ) : (
                        <Play className="w-5 h-5 fill-white" />
                      )}
                    </Button>

                    <Button
                      variant="ghost"
                      size="icon"
                      {...createButtonHandler(playNextEpisode)}
                      className="text-white hover:bg-white-transparent"
                    >
                      <ChevronRight className="w-5 h-5" />
                    </Button>

                    <Button
                      variant="ghost"
                      size="icon"
                      {...createButtonHandler(() => skipHero(10))}
                      className="text-white hover:bg-white-transparent"
                    >
                      <SkipForward className="w-4 h-4" />
                    </Button>

                    <div
                      className="flex items-center space-x-2 relative"
                      onMouseEnter={() => setShowVolumeSlider(true)}
                      onMouseLeave={() => setShowVolumeSlider(false)}
                    >
                      <Button
                        variant="ghost"
                        size="icon"
                        {...createButtonHandler(toggleHeroMute)}
                        className="text-white hover:bg-white/20"
                      >
                        {heroIsMuted ? <VolumeX className="w-4 h-4" /> : <Volume2 className="w-4 h-4" />}
                      </Button>
                      <div
                        className={`w-20 transition-all duration-300 ${showVolumeSlider ? "opacity-100" : "opacity-0"}`}
                      >
                        <Slider
                          value={[heroIsMuted ? 0 : heroVolume]}
                          max={1}
                          step={0.1}
                          onValueChange={handleHeroVolumeChange}
                          className="[&>span:first-child]:h-1 [&>span:first-child]:bg-white/30 [&_[role=slider]]:bg-white [&_[role=slider]]:w-3 [&_[role=slider]]:h-3 [&_[role=slider]]:border-0 [&>span:first-child_span]:bg-white"
                        />
                      </div>
                    </div>

                    <div className="text-white text-sm font-medium">
                      {formatTime(heroCurrentTime)} / {formatTime(heroDuration)}
                    </div>
                  </>
                )}
              </div>

              <div className={`flex items-center ${isMobile ? "space-x-1" : "space-x-2"}`}>
                {availableQualities.length > 1 && (
                  <DropdownMenu open={showQualityMenu} onOpenChange={setShowQualityMenu}>
                    <DropdownMenuTrigger asChild>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-8 w-8 text-white hover:bg-white/10"
                        onClick={(e) => {
                          e.stopPropagation()
                          setShowQualityMenu(!showQualityMenu)
                        }}
                      >
                        <Settings className="h-4 w-4" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent className="w-40 bg-black/90 border-white/10">
                      <DropdownMenuLabel className="text-white/70">Quality</DropdownMenuLabel>
                      <DropdownMenuSeparator className="bg-white/10" />

                      {availableQualities.map((quality) => (
                        <DropdownMenuItem
                          key={quality.id}
                          className="text-white hover:bg-white/10 cursor-pointer"
                          onClick={() => handleQualityChange(quality)}
                        >
                          <span className="flex items-center justify-between w-full">
                            <span>{quality.label}</span>
                            {currentQuality?.id === quality.id && <Check className="h-4 w-4" />}
                          </span>
                        </DropdownMenuItem>
                      ))}
                    </DropdownMenuContent>
                  </DropdownMenu>
                )}

                {!isMobile && (
                  <Button
                    variant="ghost"
                    size="icon"
                    {...createButtonHandler(togglePictureInPicture)}
                    className="text-white hover:bg-white/20"
                  >
                    <PictureInPicture className="w-4 h-4" />
                  </Button>
                )}

                {isFullscreen && !isMobile && (
                  <div className="text-white text-sm mr-4">
                    <div className="font-semibold">
                      {currentSeriesData?.title
                        ? getLocalizedText(currentSeriesData.title, getUILanguage(currentLanguage))
                        : getLocalizedText(currentPlayingContent.title, getUILanguage(currentLanguage))}
                    </div>
                    <div className="text-gray-300 text-xs">
                      {currentPlayingContent.episodeNumber
                        ? `Episode ${currentPlayingContent.episodeNumber}`
                        : getLocalizedText(currentPlayingContent.description, getUILanguage(currentLanguage))}
                    </div>
                  </div>
                )}

                {isMobile ? (
                  <Button
                    variant="ghost"
                    size="icon"
                    {...createButtonHandler(toggleFullscreen)}
                    className="text-white hover:bg-white/20 w-8 h-8"
                  >
                    {isFullscreen ? <Minimize className="w-4 h-4" /> : <Maximize className="w-4 h-4" />}
                  </Button>
                ) : (
                  <Button
                    variant="ghost"
                    size="icon"
                    {...createButtonHandler(toggleFullscreen)}
                    className="text-white hover:bg-white/20"
                  >
                    {isFullscreen ? <Minimize className="w-4 h-4" /> : <Maximize className="w-4 h-4" />}
                  </Button>
                )}
              </div>
            </div>
          </div>
        </div>)}
      </div>

      {/* Video Info Section */}
      <div className={`px-4 md:px-8 py-2 md:py-3 bg-black ${isTheaterMode ? "max-w-4xl mx-auto" : ""}`}>
        <div className="max-w-6xl mx-auto">
          <h1 className="text-lg md:text-2xl font-bold mb-0 text-white">
            {getLocalizedText(currentPlayingContent.title, getUILanguage(currentLanguage))}
          </h1>

          {/* In the Video Info Section, replace the engagement metrics div: */}
          <div className="flex items-center space-x-4 mb-0 md:mb-1 text-gray-300 text-xs md:text-base">
            <span>{currentPlayingContent.engagement?.viewsFormatted || "0"} views</span>
            <span>•</span>
            <span>{currentPlayingContent.engagement?.timeAgo || "recently"}</span>

            <div className="flex items-center space-x-2 ml-4 md:ml-8">
              <EnhancedLikeButton
                likeCount={currentPlayingContent.engagement?.likesFormatted || "0"}
                size="md"
                contentId={currentPlayingContent.id}
                contentName={getLocalizedText(currentPlayingContent.title, getUILanguage(currentLanguage))}
                onLike={() => {
                  // Add any like tracking logic here
                  console.log("Video liked!")
                }}
              />
              <Button
                variant="ghost"
                onClick={handleShareClick}
                className="flex items-center space-x-1 md:space-x-2 text-white hover:text-white hover:bg-white/10 rounded-full px-2 py-1 text-xs md:px-4 md:py-2 md:text-base transition-all duration-200 font-medium"
              >
                <Share className="w-3 h-3 md:w-5 md:h-5" />
                <span>Share</span>
              </Button>
            </div>
          </div>
        </div>
      </div>

      {/* Episodes Row */}
      {!isTheaterMode && currentCollection && (
        <div className="px-4 md:px-8 py-1 md:py-2 bg-black border-b border-gray-800">
          <div className="max-w-6xl mx-auto">
            <div className="flex items-center justify-between mb-3 md:mb-4">
              <h2 className="text-lg md:text-xl font-bold text-white">
                {getUILanguage(currentLanguage) === "hindi" ? "देखना जारी रखें" : "Continue Watching"}
              </h2>
              <div className="hidden lg:flex space-x-1 md:space-x-2">
                <Button
                  variant="ghost"
                  size="icon"
                  {...createButtonHandler(() => scrollEpisodes("left"))}
                  className={`text-white hover:bg-gray-800 rounded-full ${isMobile ? "w-8 h-8" : "w-10 h-10"}`}
                >
                  <ChevronLeft className={`${isMobile ? "w-4 h-4" : "w-5 h-5"}`} />
                </Button>
                <Button
                  variant="ghost"
                  size="icon"
                  {...createButtonHandler(() => scrollEpisodes("right"))}
                  className={`text-white hover:bg-gray-800 rounded-full ${isMobile ? "w-8 h-8" : "w-10 h-10"}`}
                >
                  <ChevronRight className={`${isMobile ? "w-4 h-4" : "w-5 h-5"}`} />
                </Button>
              </div>
            </div>

            {/* Show entire collection content */}
            <div
              ref={episodesScrollRef}
              className={`flex overflow-x-auto scrollbar-hide pb-3 md:pb-4 ${isMobile ? "space-x-3" : "space-x-4"}`}
              style={{
                scrollbarWidth: "none",
                msOverflowStyle: "none",
                overflowX: "auto",
                overflowY: "hidden",
                scrollBehavior: "auto",
              }}
              onMouseEnter={() => setShowHeroControls(true)}
              onTouchStart={(e) => {
                e.stopPropagation()
                setShowHeroControls(true)
              }}
            >
              {currentCollection.episodes.map((episode: Episode) => {
                const isCurrentlyPlaying = episode.id === currentPlayingContent.id

                return (
                  <div
                    key={episode.id}
                    className={`flex-shrink-0 cursor-pointer group ${isMobile ? "w-40" : "w-48"} transition-all duration-300 hover:scale-105 ${isCurrentlyPlaying ? "ring-2 ring-red-500 rounded-lg scale-105 shadow-lg shadow-red-500/25" : ""
                      }`}
                    onClick={() => onContentChange(episode)}
                  >
                    <div className="relative">
                      <Image
                        src={episode.thumbnail || "/placeholder.svg"}
                        alt={episode.title}
                        width={isMobile ? 160 : 192}
                        height={isMobile ? 90 : 108}
                        className={`w-full object-cover rounded-lg group-hover:scale-105 transition-transform duration-200 ${isMobile ? "h-24" : "h-28"
                          } ${isCurrentlyPlaying ? "brightness-110" : ""}`}
                        loading="lazy"
                      />

                      {/* Current episode indicator */}
                      {isCurrentlyPlaying && (
                        <div className="absolute inset-0 bg-gradient-to-t from-red-600/30 via-transparent to-red-600/20 rounded-lg">
                          <div className="absolute top-2 right-2 bg-red-600 text-white font-bold rounded-full flex items-center justify-center animate-pulse shadow-lg">
                            <div
                              className={`${isMobile ? "w-6 h-6 text-xs" : "w-8 h-8 text-sm"} flex items-center justify-center`}
                            >
                              ▶
                            </div>
                          </div>
                        </div>
                      )}

                      {/* Hover play overlay for non-playing episodes */}
                      {!isCurrentlyPlaying && (
                        <div className="absolute inset-0 bg-black/0 group-hover:bg-black/60 transition-colors duration-300 rounded-lg flex items-center justify-center">
                          <div className="opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                            <Play className={`text-white fill-white ${isMobile ? "w-6 h-6" : "w-8 h-8"}`} />
                          </div>
                        </div>
                      )}

                      {/* Episode number badge */}
                      <div
                        className={`absolute top-1.5 left-1.5 rounded font-bold ${isMobile ? "text-xs px-1.5 py-0.5" : "text-xs px-2 py-1"
                          } ${isCurrentlyPlaying ? "bg-red-600 text-white shadow-lg animate-pulse" : "bg-black/80 text-white"}`}
                      >
                        {episode.episodeNumber ? `EP ${episode.episodeNumber}` : `#${episode.episodeNumber || 1}`}
                      </div>

                      {/* Duration badge */}
                      <div
                        className={`absolute bottom-1.5 right-1.5 bg-black/80 text-white rounded ${isMobile ? "text-xs px-1.5 py-0.5" : "text-xs px-2 py-1"
                          }`}
                      >
                        {episodeDurations[episode.id] ? formatTime(episodeDurations[episode.id]) : episode.duration}
                      </div>
                    </div>

                    {/* Content info */}
                    <div className={`${isMobile ? "p-1.5" : "p-2"}`}>
                      <h3
                        className={`font-medium group-hover:text-blue-400 transition-colors line-clamp-2 ${isMobile ? "text-xs" : "text-sm"
                          } ${isCurrentlyPlaying ? "text-red-400 font-semibold" : "text-white"}`}
                      >
                        {getLocalizedText(episode.title, getUILanguage(currentLanguage))}
                      </h3>
                      <p className={`text-gray-400 line-clamp-2 mt-1 ${isMobile ? "text-xs" : "text-xs"} hidden`}>
                        {getLocalizedText(episode.description, getUILanguage(currentLanguage))}
                      </p>

                      {/* Status indicator for currently playing */}
                      {isCurrentlyPlaying && (
                        <div className="flex items-center mt-1 space-x-2">
                          <p className="text-white text-sm font-medium">Playing</p>
                        </div>
                      )}
                    </div>
                  </div>
                )
              })}
            </div>
          </div>
        </div>
      )}

      {/* Share Dialog */}
      <ShareDialog
        isOpen={showShareDialog}
        onClose={() => setShowShareDialog(false)}
        content={formatShareContent(currentPlayingContent, currentLanguage, heroCurrentTime)}
      />
    </>
  )
}
