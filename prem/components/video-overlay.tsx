"use client"

import { Button } from "@/components/ui/button"
import Image from "next/image"

interface VideoOverlayProps {
  isPlaying: boolean
  currentContent: any
  videoError: string | null
  isBuffering: boolean
  onRetry: () => void
}

export default function VideoOverlay({
  isPlaying,
  currentContent,
  videoError,
  isBuffering,
  onRetry,
}: VideoOverlayProps) {
  return (
    <>
      {/* Thumbnail overlay when paused */}
      {!isPlaying && currentContent.thumbnail && (
        <div className="absolute inset-0 bg-black">
          <Image
            src={currentContent.thumbnail || "/placeholder.svg"}
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
            <Button onClick={onRetry} className="bg-red-600 hover:bg-red-700 text-white px-6 py-2">
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
    </>
  )
}
