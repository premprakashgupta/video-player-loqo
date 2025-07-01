"use client"

import type React from "react"

import { useRef, useCallback } from "react"
import { Button } from "@/components/ui/button"
import { ChevronLeft, ChevronRight, Play } from "lucide-react"
import Image from "next/image"
import { trackCarouselScroll, trackMetaCarouselScroll } from "@/lib/analytics"
import { getUILanguage } from "@/lib/language-utils"
import { getLocalizedText } from "@/lib/content-data"

interface EpisodeCarouselProps {
  currentCollection: any
  currentPlayingContent: any
  currentLanguage: string
  isMobile: boolean
  episodeDurations: { [key: string]: number }
  formatTime: (time: number) => string
  onContentChange: (content: any) => void
  createButtonHandler: (callback: (e?: React.MouseEvent) => void) => any
}

export default function EpisodeCarousel({
  currentCollection,
  currentPlayingContent,
  currentLanguage,
  isMobile,
  episodeDurations,
  formatTime,
  onContentChange,
  createButtonHandler,
}: EpisodeCarouselProps) {
  const episodesScrollRef = useRef<HTMLDivElement>(null)

  const scrollEpisodes = useCallback((direction: "left" | "right") => {
    const container = episodesScrollRef.current
    if (!container) return

    const containerWidth = container.clientWidth
    const scrollWidth = container.scrollWidth
    const currentScrollLeft = container.scrollLeft
    const maxScrollLeft = scrollWidth - containerWidth

    if (scrollWidth <= containerWidth) return

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

    trackCarouselScroll("episodes", direction)
    trackMetaCarouselScroll("episodes", direction)
  }, [])

  if (!currentCollection) return null

  return (
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
        >
          {currentCollection.episodes.map((episode: any) => {
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

                  {!isCurrentlyPlaying && (
                    <div className="absolute inset-0 bg-black/0 group-hover:bg-black/60 transition-colors duration-300 rounded-lg flex items-center justify-center">
                      <div className="opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                        <Play className={`text-white fill-white ${isMobile ? "w-6 h-6" : "w-8 h-8"}`} />
                      </div>
                    </div>
                  )}

                  <div
                    className={`absolute top-1.5 left-1.5 rounded font-bold ${isMobile ? "text-xs px-1.5 py-0.5" : "text-xs px-2 py-1"
                      } ${isCurrentlyPlaying ? "bg-red-600 text-white shadow-lg animate-pulse" : "bg-black/80 text-white"}`}
                  >
                    {episode.episodeNumber ? `EP ${episode.episodeNumber}` : `#${episode.episodeNumber || 1}`}
                  </div>

                  <div
                    className={`absolute bottom-1.5 right-1.5 bg-black/80 text-white rounded ${isMobile ? "text-xs px-1.5 py-0.5" : "text-xs px-2 py-1"
                      }`}
                  >
                    {episodeDurations[episode.id] ? formatTime(episodeDurations[episode.id]) : episode.duration}
                  </div>
                </div>

                <div className={`${isMobile ? "p-1.5" : "p-2"}`}>
                  <h3
                    className={`font-medium group-hover:text-blue-400 transition-colors line-clamp-2 ${isMobile ? "text-xs" : "text-sm"
                      } ${isCurrentlyPlaying ? "text-red-400 font-semibold" : "text-white"}`}
                  >
                    {getLocalizedText(episode.title, getUILanguage(currentLanguage))}
                  </h3>

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
  )
}
