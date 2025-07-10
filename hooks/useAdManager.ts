"use client";

import { useEffect, useState, useCallback, useRef, RefObject } from "react";
import { GoogleAdManager, type AdBreak, type AdConfig, AdUtils } from "@/lib/ad-manager";


interface UseAdManagerProps {
    videoRef: RefObject<HTMLVideoElement | null>
    adContainerRef: RefObject<HTMLDivElement | null>
    currentContent: { id: string; thumbnail?: string };
    duration: number;
    isPlaying: boolean;
    currentTime: number;
}

export function useAdManager({
    videoRef,
    adContainerRef,
    currentContent,
    duration,
    isPlaying,
    currentTime,
}: UseAdManagerProps) {
    const [adManager, setAdManager] = useState<GoogleAdManager | null>(null);
    const [isAdPlaying, setIsAdPlaying] = useState(false);
    const [currentAdBreak, setCurrentAdBreak] = useState<AdBreak | null>(null);
    const [scheduledAdBreaks, setScheduledAdBreaks] = useState<AdBreak[]>([]);
    const [adCountdown, setAdCountdown] = useState<number | null>(null);
    const [canSkipAd, setCanSkipAd] = useState(false);
    const [adError, setAdError] = useState<string | null>(null);
    const countdownIntervalRef = useRef<NodeJS.Timeout | null>(null);
    const hasInitialized = useRef(false);

    const handleAdEvent = useCallback((event: string, data: any) => {
        console.log("📺 Ad Event:", event, data);
    }, []);

    const initializeAds = useCallback(() => {
        if (hasInitialized.current) return;
        hasInitialized.current = true;

        if (!videoRef.current || !adContainerRef.current || duration === 0) return;

        const targeting = AdUtils.buildTargeting({
            id: currentContent.id,
            thumbnail: currentContent.thumbnail,
            title: "Video Title",
            duration,
        });

        const adConfig: AdConfig = {
            adBreaks: [],
            adTagUrl: AdUtils.getSampleAdTagUrl(),
            enablePreroll: true,
            enableMidroll: false,
            enablePostroll: false,
            ppid: AdUtils.generatePPID(),
        };

        const manager = new GoogleAdManager(adConfig, {
            onAdLoaded: (ad) => handleAdEvent("ad_loaded", { ad }),

            onAdStarted: (ad) => {
                console.log("🎬 [AdHook] Ad Started:", ad.getTitle?.() || ad);
                setIsAdPlaying(true);
                setCurrentAdBreak(manager.getCurrentAdBreak());
                setAdError(null);

                const skipOffset = ad.getSkipTimeOffset?.() ?? 0;
                if (skipOffset > 0) {
                    setAdCountdown(skipOffset);
                    countdownIntervalRef.current = setInterval(() => {
                        setAdCountdown((prev) => {
                            if (!prev || prev <= 1) {
                                setCanSkipAd(true);
                                clearInterval(countdownIntervalRef.current as NodeJS.Timeout);
                                return null;
                            }
                            return prev - 1;
                        });
                    }, 1000);
                }

                // ✅ PAUSE the video properly (Fix here)
                if (videoRef.current && !videoRef.current.paused) {
                    console.log("come to pause video")
                    videoRef.current.pause();
                }

                handleAdEvent("ad_started", { ad });
            },

            onAdCompleted: (ad) => {
                console.log("✅ [AdHook] Ad Completed:", ad.getTitle?.() || ad);
                setAdCountdown(null);
                setCanSkipAd(false);
                setIsAdPlaying(false);
                setCurrentAdBreak(null);

                // ✅ Resume video
                videoRef.current?.play().catch(console.error);
                handleAdEvent("ad_completed", { ad });
            },

            onAdError: (error) => {
                const errorMessage = error?.getMessage?.() || "Ad error";
                const errorCode = error?.getErrorCode?.(); // Optional: get numeric code

                console.error("❌ Ad Error:", errorMessage, "Code:", errorCode);

                setAdError(errorMessage);
                setIsAdPlaying(false);
                setCurrentAdBreak(null);
                setAdCountdown(null);
                setCanSkipAd(false);

                if (countdownIntervalRef.current) {
                    clearInterval(countdownIntervalRef.current);
                    countdownIntervalRef.current = null;
                }

                // ✅ Resume main content playback
                if (videoRef.current?.pause) {
                    videoRef.current.play();
                }


                handleAdEvent("ad_error", { error, code: errorCode });
            },


            onAdBreakCompleted: (adBreak) => {
                console.log("🏁 [AdHook] Ad Break Completed:", adBreak.id);
                setIsAdPlaying(false);
                setCurrentAdBreak(null);
                setAdCountdown(null);
                setCanSkipAd(false);
                clearInterval(countdownIntervalRef.current as NodeJS.Timeout);

                // ✅ Resume video
                videoRef.current?.play().catch(console.error);
                handleAdEvent("ad_break_completed", { adBreak });
            },
        });

        manager.initialize(videoRef.current, adContainerRef.current).then(() => {
            setAdManager(manager);
        });
    }, [videoRef, adContainerRef, currentContent, duration, handleAdEvent]);

    // Schedule ad breaks
    useEffect(() => {
        if (adManager && duration > 0) {
            const breaks = adManager.scheduleAdBreaks(duration);
            setScheduledAdBreaks(breaks);
        }
    }, [adManager, duration]);

    // Auto-play ads at breakpoints
    useEffect(() => {
        if (!adManager || isAdPlaying) return;
        const adBreak = adManager.shouldPlayAd(currentTime);
        if (adBreak && (isPlaying || adBreak.type === "preroll")) {
            adManager.playAd(adBreak);
        }
    }, [adManager, currentTime, isAdPlaying, isPlaying]);

    return {
        isAdPlaying,
        scheduledAdBreaks,
        adError,
        adCountdown,
        canSkipAd,
        initializeAds,
    };
}
