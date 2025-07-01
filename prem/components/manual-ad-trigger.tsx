"use client"

import type React from "react"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Play, Clock } from "lucide-react"

interface ManualAdTriggerProps {
    onTriggerAd: () => Promise<boolean>
    isAdPlaying: boolean
    adCountdown: number | null
    canSkipAd: boolean
    onSkipAd?: () => void
    children?: React.ReactNode
}

export default function ManualAdTrigger({
    onTriggerAd,
    isAdPlaying,
    adCountdown,
    canSkipAd,
    onSkipAd,
    children,
}: ManualAdTriggerProps) {
    const [isTriggering, setIsTriggering] = useState(false)

    const handleTrigger = async () => {
        setIsTriggering(true)
        try {
            await onTriggerAd()
        } catch (error) {
            console.error("Failed to trigger ad:", error)
        } finally {
            setIsTriggering(false)
        }
    }

    if (isAdPlaying) {
        return (
            <div className="absolute inset-0 bg-black/90 flex items-center justify-center z-50">
                <div className="text-center text-white">
                    <div className="mb-4">
                        <div className="w-16 h-16 border-4 border-white border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
                        <p className="text-lg">Advertisement</p>
                        {adCountdown !== null && (
                            <p className="text-sm text-gray-300 flex items-center justify-center gap-2">
                                <Clock className="w-4 h-4" />
                                {adCountdown > 0 ? `Skip in ${adCountdown}s` : "Ad can be skipped"}
                            </p>
                        )}
                    </div>

                    {canSkipAd && onSkipAd && (
                        <Button onClick={onSkipAd} className="bg-white/20 hover:bg-white/30 text-white border border-white/30">
                            Skip Ad
                        </Button>
                    )}
                </div>
            </div>
        )
    }

    return (
        <div className="relative">
            {children}

            {/* Overlay trigger for first interaction */}
            <div
                className="absolute inset-0 bg-black/60 flex items-center justify-center cursor-pointer group"
                onClick={handleTrigger}
            >
                <div className="text-center text-white">
                    <Button
                        variant="ghost"
                        size="icon"
                        disabled={isTriggering}
                        className="bg-black/50 hover:bg-black/70 text-white rounded-full w-16 h-16 mb-4 group-hover:scale-110 transition-transform"
                    >
                        {isTriggering ? (
                            <div className="w-8 h-8 border-2 border-white border-t-transparent rounded-full animate-spin" />
                        ) : (
                            <Play className="w-8 h-8 fill-white ml-1" />
                        )}
                    </Button>
                    <p className="text-sm">Click to play</p>
                    <p className="text-xs text-gray-300">Ad will play first</p>
                </div>
            </div>
        </div>
    )
}
