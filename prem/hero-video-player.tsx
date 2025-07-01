"use client"

import type React from "react"
import { useState, useRef, useEffect, useCallback, useMemo } from "react"
import { Button } from "@/components/ui/button"
import { Play, Pause, Share } from "lucide-react"
import { getLocalizedText } from "@/lib/content-data"
import { getUILanguage, logVideoResolution, resolveVideoUrlWithQuality } from "@/lib/language-utils"
import { type Episode, getSeriesById } from "@/lib/content-manager"
import ShareDialog from "@/components/share-dialog"
import { formatShareContent } from "@/lib/share-utils"
import EnhancedLikeButton from "@/components/enhanced-like-button"

// Import custom hooks
import { useVideoPlayer } from "./hooks/use-video-player"
import { useVideoControls } from "./hooks/use-video-controls"
import { useFullscreen } from "./hooks/use-fullscreen"
import { useHLSPlayer } from "./hooks/use-hls-player"
import { useVideoEvents } from "./hooks/use-video-events"
import { useAdManager } from "./hooks/use-ad-manager"
import { useEpisodeNavigation } from "./hooks/use-episode-navigation"

// Import components
import VideoProgressBar from "./components/video-progress-bar"
import VideoControls from "./components/video-controls"
import EpisodeCarousel from "./components/episode-carousel"
import VideoOverlay from "./components/video-overlay"

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
  languageCollections: any
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
  languageCollections,
}: HeroVideoPlayerProps) {
  // State
  const [sessionStartTime, setSessionStartTime] = useState<number>(Date.now())
  const [userSelectedQuality, setUserSelectedQuality] = useState<string>("480p")
  const [episodeDurations, setEpisodeDurations] = useState<{ [key: string]: number }>({})
  const [videoAspectRatio, setVideoAspectRatio] = useState(16 / 9)
  const [showQualityMenu, setShowQualityMenu] = useState(false)
  const [showShareDialog, setShowShareDialog] = useState(false)
  const [isTheaterMode, setIsTheaterMode] = useState(false)

  // Refs
  const adContainerRef = useRef<HTMLDivElement>(null)
  const videoContainerRef = useRef<HTMLDivElement>(null)

  // Custom hooks
  const videoPlayer = useVideoPlayer({
    currentContent: currentPlayingContent,
    currentLanguage,
    currentSeries,
    videoPlayOffset,
    onContentChange,
  })

  const videoControls = useVideoControls({
    isPlaying: videoPlayer.isPlaying,
    isMobile,
  })

  const fullscreen = useFullscreen({
    containerRef: videoContainerRef,
    videoRef: videoPlayer.videoRef,
    contentId: currentPlayingContent.id,
    isIOS,
    isMobile,
    resetControlsTimeout: videoControls.resetControlsTimeout,
  })

  // Enhanced video resolution
  const currentVideoUrl = useMemo(() => {
    const resolution = resolveVideoUrlWithQuality(currentPlayingContent, currentLanguage, userSelectedQuality)
    logVideoResolution(currentPlayingContent, currentLanguage, resolution, "hero-video-player")
    return resolution.url
  }, [currentPlayingContent, currentLanguage, userSelectedQuality])

  const hlsPlayer = useHLSPlayer({
    videoUrl: currentVideoUrl,
    videoRef: videoPlayer.videoRef,
    currentContent: currentPlayingContent,
    currentLanguage,
    userSelectedQuality,
    onError: videoPlayer.setVideoError,
    onQualityChange: setUserSelectedQuality,
  })

  // Find current collection
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

  const episodeNavigation = useEpisodeNavigation({
    currentCollection,
    currentContent: currentPlayingContent,
    onContentChange,
  })

  const adManager = useAdManager({
    videoRef: videoPlayer.videoRef,
    adContainerRef,
    currentContent: currentPlayingContent,
    duration: videoPlayer.duration,
    isPlaying: videoPlayer.isPlaying,
    currentTime: videoPlayer.currentTime,
  })

  // Video events
  useVideoEvents({
    videoRef: videoPlayer.videoRef,
    currentContent: currentPlayingContent,
    currentLanguage,
    currentSeries,
    isPlaying: videoPlayer.isPlaying,
    setIsPlaying: videoPlayer.setIsPlaying,
    setCurrentTime: videoPlayer.setCurrentTime,
    setDuration: videoPlayer.setDuration,
    setIsVideoLoaded: videoPlayer.setIsVideoLoaded,
    setIsBuffering: videoPlayer.setIsBuffering,
    setVideoError: videoPlayer.setVideoError,
    setShowControls: videoControls.setShowControls,
    resetControlsTimeout: videoControls.resetControlsTimeout,
    sessionStartTime,
    onContentChange,
    getNextEpisode: episodeNavigation.getNextEpisode,
    volume: videoPlayer.volume,
    controlsTimeout: null,
    setControlsTimeout: () => { },
  })

  // Get current series data
  const currentSeriesData = getSeriesById(currentSeries)

  // Utility functions
  const formatTime = useCallback((time: number) => {
    if (!time || !isFinite(time)) return "0:00"
    const minutes = Math.floor(time / 60)
    const seconds = Math.floor(time % 60)
    return `${minutes}:${seconds.toString().padStart(2, "0")}`
  }, [])

  const createButtonHandler = useCallback((callback: (e?: React.MouseEvent) => void) => {
    return {
      onClick: (e?: React.MouseEvent) => {
        e?.preventDefault()
        e?.stopPropagation()
        callback(e)
      },
    }
  }, [])

  const handleShareClick = useCallback(() => {
    setShowShareDialog(true)
    videoControls.resetControlsTimeout()
  }, [videoControls.resetControlsTimeout])

  const handleVideoMetadata = useCallback(() => {
    if (!isMobile) {
      setVideoAspectRatio(16 / 9)
      return
    }

    const video = videoPlayer.videoRef.current
    if (video && video.videoWidth && video.videoHeight) {
      const aspectRatio = video.videoWidth / video.videoHeight
      setVideoAspectRatio(aspectRatio)
    }
  }, [isMobile, videoPlayer.videoRef])

  const togglePictureInPicture = useCallback(async () => {
    const video = videoPlayer.videoRef.current
    if (!video) return

    try {
      if (document.pictureInPictureElement) {
        await document.exitPictureInPicture()
      } else {
        await video.requestPictureInPicture()
      }
    } catch (error) {
      console.warn("Picture-in-Picture failed:", error)
    }
    videoControls.resetControlsTimeout()
  }, [videoPlayer.videoRef, videoControls.resetControlsTimeout])

  // Reset session tracking when content changes
  useEffect(() => {
    setSessionStartTime(Date.now())
  }, [currentPlayingContent.id])

  return (
    <>
      {/* Hero Video Player Section */}
      <div
        ref={videoContainerRef}
        className={`hero-video-container sticky top-12 z-20 w-full bg-black ${fullscreen.isFullscreen ? "h-screen" : isMobile ? "h-0" : "h-[70vh]"
          }`}
        style={{
          paddingBottom: fullscreen.isFullscreen ? "0" : isMobile ? `${(1 / videoAspectRatio) * 100}%` : "0",
        }}
      >
        <video
          ref={videoPlayer.videoRef}
          className="absolute inset-0 w-full h-full object-contain"
          muted={videoPlayer.isMuted}
          playsInline
          preload="auto"
          autoPlay
          style={{ outline: "none" }}
          controls={false}
          onLoadedMetadata={handleVideoMetadata}
        />

        <div
          ref={adContainerRef}
          className={`absolute inset-0 z-50 ${adManager.isAdPlaying ? "pointer-events-auto block" : "hidden"}`}
        />

        <VideoOverlay
          isPlaying={videoPlayer.isPlaying}
          currentContent={currentPlayingContent}
          videoError={videoPlayer.videoError}
          isBuffering={videoPlayer.isBuffering}
          onRetry={hlsPlayer.retryVideo}
        />

        {/* Video Controls Overlay */}
        {!adManager.isAdPlaying && (
          <div
            className={`absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent transition-opacity duration-300 ${videoControls.showControls ? "opacity-100" : "opacity-0"
              }`}
          >
            {/* Center Play Button */}
            <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
              <Button
                variant="ghost"
                size="icon"
                {...createButtonHandler(videoPlayer.togglePlay)}
                className={`pointer-events-auto bg-black/50 hover:bg-black/70 text-white rounded-full transition-all duration-300 w-16 md:w-20 h-16 md:h-20 ${videoPlayer.isPlaying && videoPlayer.isVideoLoaded && !videoPlayer.videoError
                  ? "opacity-0 scale-75"
                  : "opacity-100 scale-100"
                  }`}
              >
                {videoPlayer.isPlaying ? (
                  <Pause className={`fill-white ${isMobile ? "w-8 h-8" : "w-10 h-10"}`} />
                ) : (
                  <Play className={`fill-white ${isMobile ? "w-8 h-8" : "w-10 h-10"} ml-1`} />
                )}
              </Button>
            </div>

            {/* Bottom Controls */}
            <div
              className={`absolute bottom-0 left-0 right-0 ${fullscreen.isFullscreen ? "p-4 md:p-6" : "p-2 md:p-4"}`}
            >
              <VideoProgressBar
                currentTime={videoPlayer.currentTime}
                duration={videoPlayer.duration}
                onSeek={videoPlayer.handleSeek}
                onSeekCommit={(value) => {
                  const video = videoPlayer.videoRef.current
                  if (video) {
                    video.currentTime = value[0]
                    videoControls.setIsDragging(false)
                    videoControls.setPreviewTime(null)
                    videoControls.setPreviewPosition(null)
                  }
                }}
                onProgressClick={(e) =>
                  videoControls.handleProgressClick(e, videoPlayer.duration, (time) => {
                    const video = videoPlayer.videoRef.current
                    if (video) {
                      video.currentTime = time
                      videoPlayer.setCurrentTime(time)
                    }
                  })
                }
                onProgressHover={(e) => videoControls.handleProgressHover(e, videoPlayer.duration)}
                onMouseEnter={() => videoControls.setIsProgressHovered(true)}
                onMouseLeave={() => {
                  videoControls.setIsProgressHovered(false)
                  videoControls.setPreviewTime(null)
                  videoControls.setPreviewPosition(null)
                }}
                isDragging={videoControls.isDragging}
                setIsDragging={videoControls.setIsDragging}
                isProgressHovered={videoControls.isProgressHovered}
                isMobile={isMobile}
                scheduledAdBreaks={adManager.scheduledAdBreaks}
                formatTime={formatTime}
                previewTime={videoControls.previewTime}
                previewPosition={videoControls.previewPosition}
              />

              <VideoControls
                isPlaying={videoPlayer.isPlaying}
                isMobile={isMobile}
                isFullscreen={fullscreen.isFullscreen}
                volume={videoPlayer.volume}
                isMuted={videoPlayer.isMuted}
                showVolumeSlider={videoControls.showVolumeSlider}
                setShowVolumeSlider={videoControls.setShowVolumeSlider}
                currentTime={videoPlayer.currentTime}
                duration={videoPlayer.duration}
                availableQualities={hlsPlayer.availableQualities}
                currentQuality={hlsPlayer.availableQualities.find((q) => q.id === userSelectedQuality)}
                showQualityMenu={showQualityMenu}
                setShowQualityMenu={setShowQualityMenu}
                formatTime={formatTime}
                onTogglePlay={videoPlayer.togglePlay}
                onSkip={videoPlayer.skip}
                onVolumeChange={videoPlayer.handleVolumeChange}
                onToggleMute={videoPlayer.toggleMute}
                onToggleFullscreen={fullscreen.toggleFullscreen}
                onTogglePictureInPicture={togglePictureInPicture}
                onQualityChange={hlsPlayer.changeQuality}
                onPreviousEpisode={episodeNavigation.playPreviousEpisode}
                onNextEpisode={episodeNavigation.playNextEpisode}
                createButtonHandler={createButtonHandler}
                currentSeriesData={currentSeriesData}
                currentPlayingContent={currentPlayingContent}
                currentLanguage={currentLanguage}
                getLocalizedText={getLocalizedText}
                getUILanguage={getUILanguage}
              />
            </div>
          </div>
        )}
      </div>

      {/* Video Info Section */}
      <div className={`px-4 md:px-8 py-2 md:py-3 bg-black ${isTheaterMode ? "max-w-4xl mx-auto" : ""}`}>
        <div className="max-w-6xl mx-auto">
          <h1 className="text-lg md:text-2xl font-bold mb-0 text-white">
            {getLocalizedText(currentPlayingContent.title, getUILanguage(currentLanguage))}
          </h1>

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
                onLike={() => console.log("Video liked!")}
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
        <EpisodeCarousel
          currentCollection={currentCollection}
          currentPlayingContent={currentPlayingContent}
          currentLanguage={currentLanguage}
          isMobile={isMobile}
          episodeDurations={episodeDurations}
          formatTime={formatTime}
          onContentChange={onContentChange}
          createButtonHandler={createButtonHandler}
        />
      )}

      {/* Share Dialog */}
      <ShareDialog
        isOpen={showShareDialog}
        onClose={() => setShowShareDialog(false)}
        content={formatShareContent(currentPlayingContent, currentLanguage, videoPlayer.currentTime)}
      />
    </>
  )
}
