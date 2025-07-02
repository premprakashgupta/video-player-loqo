// components/HLSPlayer.tsx
"use client"

import React, { useEffect, useRef, useState } from "react"
import Hls from "hls.js"
import { useAdManager } from "@/hooks/useAdManager"

const qualities = ["480p", "720p", "1080p", "4K"] as const

type VideoQuality = typeof qualities[number]

interface VideoPlayerProps {
    content: {
        id: string
        thumbnail?: string
        videoQualityUrls: {
            hindi: Record<VideoQuality, string>
        }
    }
}

const HLSPlayer: React.FC<VideoPlayerProps> = ({ content }) => {
    const videoRef = useRef<HTMLVideoElement | null>(null)
    const adContainerRef = useRef<HTMLDivElement | null>(null)
    const [isPlaying, setIsPlaying] = useState(false)
    const [currentQuality, setCurrentQuality] = useState<VideoQuality>("720p")
    const [volume, setVolume] = useState(1)
    const [progress, setProgress] = useState(0)
    const [duration, setDuration] = useState(0)
    const [currentTime, setCurrentTime] = useState(0)
    const hasInitializedAds = useRef(false)

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
    })

    // Setup HLS instance
    useEffect(() => {
        const video = videoRef.current
        if (!video) return

        if (hlsRef.current) {
            hlsRef.current.destroy()
        }

        const newHls = new Hls()
        hlsRef.current = newHls

        const url = content.videoQualityUrls.hindi[currentQuality]

        if (Hls.isSupported()) {
            newHls.loadSource(url)
            newHls.attachMedia(video)
        } else if (video.canPlayType("application/vnd.apple.mpegurl")) {
            video.src = url
        }

        return () => {
            newHls.destroy()
        }
    }, [content, currentQuality])

    const hlsRef = useRef<Hls | null>(null)

    // Time updates
    useEffect(() => {
        const video = videoRef.current
        if (!video) return

        const update = () => {
            setCurrentTime(video.currentTime)
            setProgress((video.currentTime / video.duration) * 100 || 0)
            setDuration(video.duration)
        }

        video.addEventListener("timeupdate", update)
        video.addEventListener("loadedmetadata", update)
        return () => {
            video.removeEventListener("timeupdate", update)
            video.removeEventListener("loadedmetadata", update)
        }
    }, [])

    const togglePlay = async () => {
        const video = videoRef.current
        if (!video || isAdPlaying) return

        if (!hasInitializedAds.current) {
            initializeAds()
            hasInitializedAds.current = true
        }

        if (video.paused) {
            await video.play()
            setIsPlaying(true)
        } else {
            video.pause()
            setIsPlaying(false)
        }
    }

    const handleSeek = (e: React.MouseEvent<HTMLDivElement>) => {
        const video = videoRef.current
        if (!video) return

        const rect = (e.target as HTMLDivElement).getBoundingClientRect()
        const x = e.clientX - rect.left
        const percentage = x / rect.width
        video.currentTime = percentage * video.duration
    }

    return (
        <div className="relative w-full max-w-4xl mx-auto aspect-video bg-black rounded-xl overflow-hidden">
            <video
                ref={videoRef}
                className="w-full h-full"
                playsInline
                preload="metadata"
                onClick={togglePlay}
                style={{ cursor: "pointer" }}
            />

            {/* Google Ads Container */}
            <div
                ref={adContainerRef}
                className="absolute inset-0 z-50  flex items-center justify-center"
                style={{ pointerEvents: isAdPlaying ? "auto" : "none" }}
            ></div>

            {/* Overlay Play Button */}
            {!isPlaying && !isAdPlaying && (
                <button
                    onClick={togglePlay}
                    className="absolute inset-0 flex items-center justify-center bg-black/50 text-white text-4xl"
                >
                    ▶
                </button>
            )}

            {/* Progress Bar */}
            <div
                className="absolute bottom-12 left-0 right-0 h-2 bg-gray-700 cursor-pointer"
                onClick={handleSeek}
            >
                <div
                    className="h-full bg-green-500"
                    style={{ width: `${progress}%` }}
                ></div>
            </div>

            {/* Controls */}
            <div className="absolute bottom-0 left-0 right-0 bg-black/60 text-white text-sm flex items-center justify-between px-4 py-2">
                {/* Play/Pause */}
                <button onClick={togglePlay}>{isPlaying ? "⏸ Pause" : "▶ Play"}</button>

                {/* Volume */}
                <div className="flex items-center space-x-2">
                    <label htmlFor="volume">🔊</label>
                    <input
                        id="volume"
                        type="range"
                        min="0"
                        max="1"
                        step="0.05"
                        value={volume}
                        onChange={(e) => {
                            const vol = parseFloat(e.target.value)
                            setVolume(vol)
                            if (videoRef.current) videoRef.current.volume = vol
                        }}
                    />
                </div>

                {/* Quality Switcher */}
                <div className="flex items-center space-x-1">
                    <span>Quality:</span>
                    {qualities.map((q) => (
                        <button
                            key={q}
                            onClick={() => {
                                const video = videoRef.current
                                if (!video) return
                                const currentTime = video.currentTime
                                setCurrentQuality(q)
                                setTimeout(() => {
                                    if (videoRef.current) videoRef.current.currentTime = currentTime
                                }, 500)
                            }}
                            className={`px-2 py-1 rounded ${currentQuality === q ? "bg-green-500 text-black" : "bg-gray-800 hover:bg-gray-700"}`}
                        >
                            {q}
                        </button>
                    ))}
                </div>
            </div>
        </div>
    )
}

export default HLSPlayer
