"use client"

import type React from "react"

import { useState, useEffect, useCallback } from "react"
import { GoogleAdManager, type AdBreak, type AdConfig, AdUtils } from "@/lib/ad-manager"

interface UseAdManagerProps {
  videoRef: React.RefObject<HTMLVideoElement>
  adContainerRef: React.RefObject<HTMLDivElement>
  currentContent: any
  duration: number
  isPlaying: boolean
  currentTime: number
}

export function useAdManager({
  videoRef,
  adContainerRef,
  currentContent,
  duration,
  isPlaying,
  currentTime,
}: UseAdManagerProps) {
  const [adManager, setAdManager] = useState<GoogleAdManager | null>(null)
  const [isAdPlaying, setIsAdPlaying] = useState(false)
  const [currentAdBreak, setCurrentAdBreak] = useState<AdBreak | null>(null)
  const [scheduledAdBreaks, setScheduledAdBreaks] = useState<AdBreak[]>([])
  const [adCountdown, setAdCountdown] = useState<number | null>(null)
  const [canSkipAd, setCanSkipAd] = useState(false)
  const [adError, setAdError] = useState<string | null>(null)

  const onAdEvent = useCallback((event: string, data: any) => {
    console.log("🎬 Ad Event:", event, data)
  }, [])

  // Initialize ad manager
  useEffect(() => {
    if (!isPlaying || !videoRef.current || !adContainerRef.current || duration === 0) return

    const initializeAdManager = async () => {
      if (!videoRef.current || !adContainerRef.current) return

      try {
        const targeting = AdUtils.buildTargeting({
          id: currentContent.id,
          thumbnail: currentContent.thumbnail,
          title: "Test Video",
          duration: duration || 0,
        })

        const enhancedAdConfig: AdConfig = {
          adBreaks: [],
          adTagUrl:
            "https://pubads.g.doubleclick.net/gampad/ads?iu=/21775744923/external/single_ad_samples&sz=640x480&cust_params=sample_ct%3Dlinear&ciu_szs=300x250%2C728x90&gdfp_req=1&output=vast&unviewed_position_start=1&env=vp&impl=s&correlator=1234567890",
          enablePreroll: false,
          enableMidroll: true,
          enablePostroll: false,
          targeting,
          ppid: AdUtils.generatePPID(),
        }

        const manager = new GoogleAdManager(enhancedAdConfig, {
          onAdLoaded: (ad) => {
            console.log("🎬 Ad loaded:", ad.getTitle())
            onAdEvent("ad_loaded", { ad, adBreak: currentAdBreak })
          },
          onAdStarted: (ad) => {
            setIsAdPlaying(true)
            setCurrentAdBreak(manager.getCurrentAdBreak())
            setAdError(null)

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
            onAdEvent("ad_started", { ad, adBreak: currentAdBreak })
          },
          onAdCompleted: (ad) => {
            setAdCountdown(null)
            setCanSkipAd(false)
            onAdEvent("ad_completed", { ad, adBreak: currentAdBreak })
          },
          onAdError: (error) => {
            setAdError(error.getMessage())
            setIsAdPlaying(false)
            setCurrentAdBreak(null)
            setAdCountdown(null)
            setCanSkipAd(false)
            onAdEvent("ad_error", { error })
          },
          onAdBreakCompleted: (adBreak) => {
            setIsAdPlaying(false)
            setCurrentAdBreak(null)
            setAdCountdown(null)
            setCanSkipAd(false)
            onAdEvent("ad_break_completed", { adBreak })
          },
        })

        await manager.initialize(videoRef.current, adContainerRef.current)
        setAdManager(manager)
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
  }, [duration, isPlaying, videoRef, adContainerRef, currentContent, onAdEvent, currentAdBreak])

  // Schedule ad breaks
  useEffect(() => {
    if (adManager && duration >= 0) {
      const breaks = adManager.scheduleAdBreaks(duration)
      setScheduledAdBreaks(breaks)
    }
  }, [adManager, duration])

  // Check for ad breaks during playback
  useEffect(() => {
    if (!adManager || isAdPlaying) return

    const adBreak = adManager.shouldPlayAd(currentTime)
    if (adBreak && (isPlaying || adBreak.type === "preroll")) {
      console.log("🎬 Playing ad break:", adBreak.id)
      adManager.playAd(adBreak)
    }
  }, [adManager, currentTime, isAdPlaying, isPlaying])

  return {
    isAdPlaying,
    scheduledAdBreaks,
    adError,
    adCountdown,
    canSkipAd,
  }
}
