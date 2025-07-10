"use client"

import React, { useCallback, useEffect, useMemo, useRef, useState } from "react"
import Hls from "hls.js"
import { useAdManager } from "@/hooks/useAdManager"
import { Check, ChevronLeft, ChevronRight, Maximize, Minimize, Pause, PictureInPicture, Play, Settings, Share, SkipBack, SkipForward, Speaker, Volume2, VolumeX } from "lucide-react"
import Image from "next/image"
import { EpisodeContent } from "@/@type/player.type"
import { Button } from "./ui/button"
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuLabel, DropdownMenuSeparator, DropdownMenuTrigger } from "./ui/dropdown-menu"
import { Slider } from "./ui/slider"
import { getLocalizedText } from "@/lib/content-data"
import { getUILanguage } from "@/lib/language-utils"
import EnhancedLikeButton from "./enhanced-like-button"
import { trackFullscreenToggle, trackMetaFullscreenToggle, trackMetaShareClick, trackMetaVideoSeek, trackShareClick, trackVideoSeek } from "@/lib/analytics"
import ShareDialog from "./share-dialog"
import { formatShareContent } from "@/lib/share-utils"


const qualities = [{ id: 1, label: "480p" }, { id: 2, label: "720p" }, { id: 3, label: "1080p" }, { id: 4, label: "4K" }] as const
type VideoQuality = typeof qualities[number]

interface VideoPlayerProps {
    content: EpisodeContent;
    onNext: () => void;
    onPrev: () => void;
    currentLanguage: string;
    isIOS: boolean,
    isMobile: boolean
}


const HLSPlayer: React.FC<VideoPlayerProps> = ({ content, onNext, onPrev, currentLanguage, isIOS, isMobile }) => {
    // Refs
    const videoRef = useRef<HTMLVideoElement | null>(null);
    const videoContainerRef = useRef<HTMLDivElement | null>(null);
    const adContainerRef = useRef<HTMLDivElement | null>(null);
    const hlsRef = useRef<Hls | null>(null);
    const hasInitializedAds = useRef(false);

    // States
    const [isPlaying, setIsPlaying] = useState(false);
    const [currentQuality, setCurrentQuality] = useState<VideoQuality>({ id: 1, label: "480p" });
    const [volume, setVolume] = useState(1);
    const [progress, setProgress] = useState(0);
    const [duration, setDuration] = useState(0);
    const [currentTime, setCurrentTime] = useState(0);

    // UI state
    const [heroIsMuted, setHeroIsMuted] = useState(false);
    const [showHeroControls, setShowHeroControls] = useState(true);
    const [controlsTimeout, setControlsTimeout] = useState<NodeJS.Timeout | null>(null);
    const [isFullscreen, setIsFullscreen] = useState(false);
    const [isVideoLoaded, setIsVideoLoaded] = useState(false);
    const [showVolumeSlider, setShowVolumeSlider] = useState(false);
    const [isPictureInPicture, setIsPictureInPicture] = useState(false);
    const [isTheaterMode, setIsTheaterMode] = useState(false);
    const [isProgressHovered, setIsProgressHovered] = useState(false);
    const [previewTime, setPreviewTime] = useState<number | null>(null);
    const [previewPosition, setPreviewPosition] = useState<{ x: number; y: number } | null>(null);
    const [isDragging, setIsDragging] = useState(false);
    const [showQualityMenu, setShowQualityMenu] = useState(false);
    const [videoError, setVideoError] = useState<string | null>(null);
    const [showShareDialog, setShowShareDialog] = useState(false);

    // Ad Manager hook
    const {
        isAdPlaying,
        adCountdown,
        canSkipAd,
        initializeAds,
    } = useAdManager({
        videoRef,
        adContainerRef,
        currentContent: content,
        duration,
        isPlaying,
        currentTime,
    });

    // 🎯 HLS setup with quality change
    useEffect(() => {
        const video = videoRef.current;
        if (!video) return;

        if (hlsRef.current) hlsRef.current.destroy(); // Clean up previous instance
        const hls = new Hls();
        hlsRef.current = hls;
        console.log(currentLanguage)
        console.log("content.videoUrls: --- ", content)
        const url = content.videoUrls[currentLanguage] ? content.videoUrls[currentLanguage][currentQuality.label] : content.videoUrls['hindi'][currentQuality.label];
        console.log("url: --- ", url)
        if (Hls.isSupported()) {
            hls.loadSource(url);
            hls.attachMedia(video);
        } else if (video.canPlayType("application/vnd.apple.mpegurl")) {
            video.src = url;
        }


        return () => hls.destroy(); // Cleanup to avoid memory leak
    }, [content, currentQuality, currentLanguage]);

    // 🎯 Sync progress & duration
    useEffect(() => {
        const video = videoRef.current;
        if (!video) return;

        const update = () => {
            setCurrentTime(video.currentTime);
            setProgress((video.currentTime / video.duration) * 100 || 0);
            setDuration(video.duration);
        };

        video.addEventListener("timeupdate", update);
        video.addEventListener("loadedmetadata", update);

        return () => {
            video.removeEventListener("timeupdate", update);
            video.removeEventListener("loadedmetadata", update);
        };
    }, []);

    // Format time like 2:03
    const formatTime = useCallback((time: number) => {
        if (!time || !isFinite(time)) return "0:00";
        const minutes = Math.floor(time / 60);
        const seconds = Math.floor(time % 60);
        return `${minutes}:${seconds.toString().padStart(2, "0")}`;
    }, []);

    // Toggle play/pause
    const togglePlay = async () => {
        const video = videoRef.current;
        if (!video || isAdPlaying) return;

        if (!hasInitializedAds.current) {
            initializeAds();
            hasInitializedAds.current = true;
        }

        if (video.paused) {
            await video.play();
            setIsPlaying(true);
        } else {
            video.pause();
            setIsPlaying(false);
        }
    };

    // Auto-hide controls
    const resetControlsTimeout = useCallback((delay = 3000) => {
        if (controlsTimeout) clearTimeout(controlsTimeout);
        const timeout = setTimeout(() => setShowHeroControls(false), delay);
        setControlsTimeout(timeout);
    }, [controlsTimeout]);

    // Touch detection (optimized for controls)
    const handleTouchStart = useCallback((e: React.TouchEvent) => {
        const isOnControl = (e.target as HTMLElement).closest("button,[role='button'],[role='slider'],[data-button],[data-radix-dropdown-menu]");
        if (isOnControl) return;

        e.preventDefault();
        e.stopPropagation();
        setShowHeroControls(true);
        resetControlsTimeout();
    }, [resetControlsTimeout]);

    const handleTouchEnd = useCallback((e: React.TouchEvent) => {
        const isOnControl = (e.target as HTMLElement).closest("button,[role='button'],[role='slider'],[data-button],[data-radix-dropdown-menu]");
        if (isOnControl) return;

        e.preventDefault();
        e.stopPropagation();
        resetControlsTimeout();
    }, [resetControlsTimeout]);

    // Wrapper to safely attach click handlers
    const createButtonHandler = useCallback((callback: (e?: React.MouseEvent) => void) => ({
        onClick: (e?: React.MouseEvent) => {
            e?.preventDefault();
            e?.stopPropagation();
            callback(e);
        },
    }), []);

    // Progress bar click to seek
    const handleProgressClick = useCallback((e: React.MouseEvent) => {
        const rect = e.currentTarget.getBoundingClientRect();
        const percentage = (e.clientX - rect.left) / rect.width;
        const newTime = percentage * duration;

        const video = videoRef.current;
        if (video && newTime >= 0 && newTime <= duration) {
            video.currentTime = newTime;
            setCurrentTime(newTime);
            resetControlsTimeout();
            trackVideoSeek(content.id, currentTime, newTime);
        }
    }, [duration, resetControlsTimeout, content.id]);

    // Hover time preview
    const handleProgressHover = useCallback((e: React.MouseEvent) => {
        if (!isProgressHovered) return;

        const rect = e.currentTarget.getBoundingClientRect();
        const hoverX = e.clientX - rect.left;
        const hoverTime = Math.max(0, Math.min(hoverX / rect.width, 1)) * duration;

        setPreviewTime(hoverTime);
        setPreviewPosition({ x: e.clientX, y: rect.top - 10 });
    }, [isProgressHovered, duration]);

    // Mute toggle
    const toggleHeroMute = useCallback(() => {
        const video = videoRef.current;
        if (!video) return;

        const newMuted = !heroIsMuted;
        video.volume = newMuted ? 0 : volume;
        setHeroIsMuted(newMuted);
        resetControlsTimeout();
    }, [heroIsMuted, volume, resetControlsTimeout]);

    // Seek via slider
    const handleHeroSeek = useCallback((value: number[]) => {
        const video = videoRef.current;
        if (!video) return;

        const newTime = value[0];
        if (!isDragging) video.currentTime = newTime;

        setCurrentTime(newTime);
        resetControlsTimeout();

        if (Math.abs(newTime - currentTime) > 5) {
            trackVideoSeek(content.id, currentTime, newTime);
            trackMetaVideoSeek(content.id, currentTime, newTime);
        }
    }, [currentTime, isDragging, resetControlsTimeout]);

    const handleSeekCommit = useCallback((value: number[]) => {
        const video = videoRef.current;
        if (!video) return;

        const newTime = value[0];
        video.currentTime = newTime;
        setIsDragging(false);
        setPreviewTime(null);
        setPreviewPosition(null);
    }, []);

    const skipHero = useCallback(
        (seconds: number) => {
            const video = videoRef.current;
            if (!video || !isFinite(duration)) return;

            const newTime = Math.max(0, Math.min(duration, video.currentTime + seconds));
            video.currentTime = newTime;

            resetControlsTimeout();

            // Optional: add analytics
            trackVideoSeek(content.id, video.currentTime, newTime);
            trackMetaVideoSeek(content.id, video.currentTime, newTime);
        },
        [duration, resetControlsTimeout, content.id]
    );


    // Volume change
    const handlevolumeChange = useCallback((value: number[]) => {
        const video = videoRef.current;
        if (!video) return;

        const newVolume = value[0];
        video.volume = newVolume;
        setVolume(newVolume);
        setHeroIsMuted(newVolume === 0);
    }, []);

    // Picture-in-Picture toggle
    const togglePictureInPicture = useCallback(async () => {
        const video = videoRef.current;
        if (!video) return;

        try {
            if (document.pictureInPictureElement) {
                await document.exitPictureInPicture();
                setIsPictureInPicture(false);
            } else {
                await video.requestPictureInPicture();
                setIsPictureInPicture(true);
            }
        } catch (error) {
            console.warn("PiP error:", error);
        }
        resetControlsTimeout();
    }, [resetControlsTimeout]);

    // Fullscreen toggle
    const toggleFullscreen = useCallback(() => {
        const container = videoContainerRef.current;
        if (!container) return;

        try {
            if (!isFullscreen) {
                container.requestFullscreen?.() ||
                    (container as any).webkitRequestFullscreen?.() ||
                    (container as any).mozRequestFullScreen?.() ||
                    (container as any).msRequestFullscreen?.();
                trackFullscreenToggle(content.id, true);
                trackMetaFullscreenToggle(content.id, true);
            } else {
                document.exitFullscreen?.() ||
                    (document as any).webkitExitFullscreen?.() ||
                    (document as any).mozCancelFullScreen?.() ||
                    (document as any).msExitFullscreen?.();
                trackFullscreenToggle(content.id, false);
                trackMetaFullscreenToggle(content.id, false);
            }
        } catch (error) {
            console.warn("Fullscreen failed:", error);
        }

        resetControlsTimeout();
    }, [isFullscreen, resetControlsTimeout, content.id]);

    // Share dialog tracking
    const handleShareClick = useCallback(() => {
        setShowShareDialog(true);
        resetControlsTimeout();

        const localizedTitle = getLocalizedText(content.title, getUILanguage(currentLanguage));
        trackShareClick(content.id, localizedTitle, "share_dialog");
        trackMetaShareClick(content.id, localizedTitle, "share_dialog");
    }, [resetControlsTimeout, content.id, currentLanguage]);

    return (
        <div className="w-full max-w-4xl mx-auto mt-2">
            <div ref={videoContainerRef} className="relative aspect-video bg-black rounded-xl">

                {/* Video Element */}
                <video
                    ref={videoRef}
                    className="w-full h-full"
                    muted={heroIsMuted}
                    playsInline
                    preload="metadata"
                    style={{ cursor: "pointer" }}
                    controls={false}
                    onTouchStart={() => {
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
                        togglePlay()
                    }}
                />

                {/* Ad Container */}
                <div
                    ref={adContainerRef}
                    className="absolute inset-0 z-20 flex items-center justify-center"
                    style={{ pointerEvents: isAdPlaying ? "auto" : "none" }}
                />

                {/* Thumbnail before play */}
                {!isPlaying && !isAdPlaying && content.thumbnail && (
                    <div className="absolute inset-0 bg-black z-10">
                        <Image
                            src={content.thumbnail}
                            alt="Video thumbnail"
                            fill
                            className="object-cover"
                            priority
                        />
                        <div className="absolute bottom-2 right-2 bg-black/70 text-white text-xs px-2 py-1 rounded">
                            {content.duration}
                        </div>
                    </div>
                )}

                {/* Overlay Play Button */}
                {!isAdPlaying && (<div
                    className={`z-20  absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent transition-opacity duration-300 ${showHeroControls ? "opacity-100" : "opacity-0"
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
                            {...createButtonHandler(togglePlay)}
                            data-button="play"
                            role="button"
                            aria-label="Play video"
                            className={`pointer-events-auto cursor-pointer bg-black/50 hover:bg-black/70 text-white rounded-full transition-all duration-300 w-16 md:w-20 h-16 md:h-20 ${isPlaying && isVideoLoaded && !videoError ? "opacity-0 scale-75" : "opacity-100 scale-100"}`}
                        >
                            {isPlaying ? (
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
                                    value={[currentTime]}
                                    max={duration || 100}
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
                                        {/* skipHeoro -10  here button */}
                                        <Button
                                            variant="ghost"
                                            size="icon"
                                            {...createButtonHandler(() => skipHero(-10))}
                                            className="text-white hover:bg-white-transparent w-8 h-8"
                                        >
                                            <SkipForward className="w-4 h-4" />
                                        </Button>

                                        <Button
                                            variant="ghost"
                                            size="icon"
                                            {...createButtonHandler(togglePlay)}
                                            className="text-white hover:bg-white-transparent w-10 h-10"
                                            data-button="play-control"
                                        >
                                            {isPlaying ? (
                                                <Pause className="w-5 h-5 fill-white" />
                                            ) : (
                                                <Play className="w-5 h-5 fill-white" />
                                            )}
                                        </Button>

                                        {/* skip hero +10 here button  */}

                                        <Button
                                            variant="ghost"
                                            size="icon"
                                            {...createButtonHandler(() => skipHero(10))}
                                            className="text-white hover:bg-white-transparent w-8 h-8"
                                        >
                                            <SkipForward className="w-4 h-4" />
                                        </Button>


                                        <div className="text-white text-xs font-medium">
                                            {formatTime(currentTime)} / {formatTime(duration)}
                                        </div>
                                    </>
                                ) : (
                                    <>
                                        {/* play prev episode  */}
                                        <Button
                                            variant="ghost"
                                            size="icon"
                                            {...createButtonHandler(onPrev)}
                                            className="text-white hover:bg-white-transparent"
                                        >
                                            <ChevronLeft className="w-5 h-5" />
                                        </Button>

                                        <Button
                                            variant="ghost"
                                            size="icon"
                                            {...createButtonHandler(togglePlay)}
                                            className="text-white hover:bg-white-transparent"
                                            data-button="play-control"
                                        >
                                            {isPlaying ? (
                                                <Pause className="w-5 h-5 fill-white" />
                                            ) : (
                                                <Play className="w-5 h-5 fill-white" />
                                            )}
                                        </Button>

                                        {/* play next episode  */}

                                        <Button
                                            variant="ghost"
                                            size="icon"
                                            {...createButtonHandler(onNext)}
                                            className="text-white hover:bg-white-transparent"
                                        >
                                            <ChevronRight className="w-5 h-5" />
                                        </Button>


                                        {/* skip hero 10  */}
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

                                            {/* volum slider  */}
                                            <div
                                                className={`w-20 transition-all duration-300 ${showVolumeSlider ? "opacity-100" : "opacity-0"}`}
                                            >
                                                <Slider
                                                    value={[heroIsMuted ? 0 : volume]}
                                                    max={1}
                                                    step={0.1}
                                                    onValueChange={handlevolumeChange}
                                                    className="[&>span:first-child]:h-1 [&>span:first-child]:bg-white/30 [&_[role=slider]]:bg-white [&_[role=slider]]:w-3 [&_[role=slider]]:h-3 [&_[role=slider]]:border-0 [&>span:first-child_span]:bg-white"
                                                />
                                            </div>

                                        </div>

                                        <div className="text-white text-sm font-medium">
                                            {formatTime(currentTime)} / {formatTime(duration)}
                                        </div>
                                    </>
                                )}
                            </div>

                            <div className={`flex items-center ${isMobile ? "space-x-1" : "space-x-2"}`}>
                                {qualities.length > 1 && (
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

                                            {qualities.map((quality) => (
                                                <DropdownMenuItem
                                                    key={quality.id}
                                                    className="text-white hover:bg-white/10 cursor-pointer"
                                                    onClick={() => setCurrentQuality(quality)}
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

                                {/* picture in picture  */}
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

                                {/* full screen  */}

                                {isFullscreen && !isMobile && (
                                    <div className="text-white text-sm mr-4">
                                        <div className="font-semibold">
                                            {content?.title
                                                ? getLocalizedText(content.title, getUILanguage(currentLanguage))
                                                : getLocalizedText(content.title, getUILanguage(currentLanguage))}
                                        </div>
                                        <div className="text-gray-300 text-xs">
                                            {content.episodeNumber
                                                ? `Episode ${content.episodeNumber}`
                                                : getLocalizedText(content.description, getUILanguage(currentLanguage))}
                                        </div>
                                    </div>
                                )}

                                {/* toogle fullscreen  */}
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
                        {getLocalizedText(content.title, getUILanguage(currentLanguage))}
                    </h1>

                    {/* In the Video Info Section, replace the engagement metrics div: */}
                    <div className="flex items-center space-x-4 mb-0 md:mb-1 text-gray-300 text-xs md:text-base">
                        <span>{content.engagement?.viewsFormatted || "0"} views</span>
                        <span>•</span>
                        <span>{content.engagement?.timeAgo || "recently"}</span>

                        <div className="flex items-center space-x-2 ml-4 md:ml-8">
                            <EnhancedLikeButton
                                likeCount={content.engagement?.likesFormatted || "0"}
                                size="md"
                                contentId={content.id}
                                contentName={getLocalizedText(content.title, getUILanguage(currentLanguage))}
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
            <ShareDialog
                isOpen={showShareDialog}
                onClose={() => setShowShareDialog(false)}
                content={formatShareContent(content, currentLanguage, currentTime)}
            />
        </div>
    )
}

export default HLSPlayer
