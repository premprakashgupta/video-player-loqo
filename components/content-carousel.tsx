"use client"

import Image from "next/image"
import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import { Play, ChevronLeft, ChevronRight } from "lucide-react"
import { useRef, useState, useEffect } from "react"
import { getLocalizedText } from "@/lib/content-data"
import { getUILanguage, validateContentForPlayback, resolveVideoUrl } from "@/lib/language-utils"
// import { trackContentSelection, trackMetaCarouselScroll, trackCarouselScroll } from "@/lib/analytics"

interface Episode {
  id: string
  title: string
  episodeNumber?: number
  thumbnail: string
  duration: string
  watchProgress?: number
  description: string
  videoUrls?: { [key: string]: string } // Added videoUrls property
  engagement?: {
    viewsFormatted: string
    timeAgo: string
  }
}

interface ContentCarouselProps {
  title: string
  content: Episode[]
  onPlay: (content: Episode) => void
  showProgress?: boolean
  currentLanguage?: string
  compact?: boolean // Add this new prop
}

export default function ContentCarousel({
  title,
  content,
  onPlay,
  showProgress = false, // Keep this prop but it won't be used for progress bars
  currentLanguage = "english",
  compact = false,
}: ContentCarouselProps) {
  const scrollRef = useRef<HTMLDivElement>(null)
  const [isMobile, setIsMobile] = useState(false)

  useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.innerWidth < 768)
    }

    checkMobile()
    window.addEventListener("resize", checkMobile)

    return () => window.removeEventListener("resize", checkMobile)
  }, [])

  // Don't render carousel if no content
  if (!content || content.length === 0) {
    return null
  }

  const scroll = (direction: "left" | "right") => {
    if (scrollRef.current) {
      const scrollAmount = isMobile ? 200 : 320
      scrollRef.current.scrollBy({
        left: direction === "left" ? -scrollAmount * 2 : scrollAmount * 2,
        behavior: "smooth",
      })

      // Add Google Analytics tracking for carousel scroll
      // trackCarouselScroll(title.toLowerCase().replace(/\s+/g, "_"), direction)

      // Add Meta Pixel tracking for carousel scroll
      // trackMetaCarouselScroll(title.toLowerCase().replace(/\s+/g, "_"), direction)
    }
  }

  return (
    <div className="mb-6 md:mb-8">
      {/* Rest of the component remains the same */}
      <div className="flex items-center justify-between mb-3 md:mb-4">
        <div className="flex items-center gap-3">
          <h2 className="text-lg md:text-2xl font-bold text-white">{title}</h2>
          {title === "संपूर्ण राम कथा" || title === "Sampoorn Ram Katha" ? (
            <span
              className="relative px-2 py-0.5 text-[10px] font-bold text-black bg-gradient-to-r from-yellow-400 via-amber-400 to-yellow-500 whitespace-nowrap"
              style={{
                clipPath: "polygon(8px 0%, 100% 0%, calc(100% - 8px) 100%, 0% 100%)",
                textShadow: "0 1px 2px rgba(0,0,0,0.3)",
              }}
            >
              NEW EPISODES DAILY
            </span>
          ) : null}
        </div>
        <div className="hidden lg:flex space-x-1 md:space-x-2">
          <Button
            variant="ghost"
            size="icon"
            onClick={() => scroll("left")}
            className={`text-white hover:bg-gray-800 rounded-full ${isMobile ? "w-8 h-8" : "w-10 h-10"}`}
          >
            <ChevronLeft className={`${isMobile ? "w-4 h-4" : "w-5 h-5"}`} />
          </Button>
          <Button
            variant="ghost"
            size="icon"
            onClick={() => scroll("right")}
            className={`text-white hover:bg-gray-800 rounded-full ${isMobile ? "w-8 h-8" : "w-10 h-10"}`}
          >
            <ChevronRight className={`${isMobile ? "w-4 h-4" : "w-5 h-5"}`} />
          </Button>
        </div>
      </div>

      {/* Content grid - rest remains the same */}
      <div
        ref={scrollRef}
        className={`flex overflow-x-auto scrollbar-hide pb-3 md:pb-4 ${isMobile ? "space-x-3" : "space-x-4"}`}
        style={{ scrollbarWidth: "none", msOverflowStyle: "none" }}
      >
        {content.map((item) => {
          console.log(item.thumbnail)
          // Use centralized video validation and resolution
          const validation = validateContentForPlayback(item, currentLanguage)
          const resolution = resolveVideoUrl(item, currentLanguage)

          // Skip items that don't have video in current language
          if (!validation.hasVideo || !validation.hasVideoInLanguage) {
            return null
          }

          return (
            <Card
              key={item.id}
              className={`bg-transparent border-none overflow-hidden group cursor-pointer flex-shrink-0 ${compact ? (isMobile ? "w-48" : "w-60") : isMobile ? "w-64" : "w-80"
                }`}
              onClick={() => {
                console.log(`🎯 Carousel click:`, {
                  id: item.id,
                  title: item.title,
                  hasVideo: validation.hasVideo,
                  resolvedUrl: resolution.url,
                  availableLanguages: validation.availableLanguages,
                })

                // Track content selection with carousel source
                // trackContentSelection(
                //   item.id,
                //   getLocalizedText(item.title, getUILanguage(currentLanguage || "english")),
                //   `carousel_${title.toLowerCase().replace(/\s+/g, "_")}`,
                //   content.indexOf(item),
                // )

                onPlay(item)
              }}
            >
              <div className="relative">
                <Image
                  src={item.thumbnail || "/placeholder.svg"}
                  alt={item.title}
                  width={compact ? (isMobile ? 192 : 240) : isMobile ? 256 : 320}
                  height={compact ? (isMobile ? 108 : 135) : isMobile ? 144 : 180}
                  className={`w-full object-cover rounded-lg group-hover:scale-105 transition-transform duration-300 ${compact
                    ? isMobile
                      ? "h-27"
                      : "h-34" // Smaller heights for compact mode
                    : isMobile
                      ? "h-36"
                      : "h-44" // Original heights
                    }`}
                />

                {/* Play Button Overlay */}
                <div className="absolute inset-0 bg-black/0 group-hover:bg-black/60 transition-colors duration-300 rounded-lg flex items-center justify-center">
                  <div className="opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                    <Button
                      size="icon"
                      className={`bg-white/20 hover:bg-white/30 text-white border-none rounded-full ${isMobile ? "w-10 h-10" : "w-12 h-12"
                        }`}
                    >
                      <Play className={`fill-white ${isMobile ? "w-5 h-5" : "w-6 h-6"}`} />
                    </Button>
                  </div>
                </div>

                {/* Duration Badge */}
                <div
                  className={`absolute bottom-2 right-2 bg-black/80 text-white rounded ${isMobile ? "text-xs px-1.5 py-0.5" : "text-xs px-2 py-1"
                    }`}
                >
                  {item.duration}
                </div>

                {/* Episode Number Badge */}
                {item.episodeNumber && (
                  <div
                    className={`absolute top-2 left-2 bg-red-600 text-white font-bold rounded ${isMobile ? "text-xs px-1.5 py-0.5" : "text-xs px-2 py-1"
                      }`}
                  >
                    EP {item.episodeNumber}
                  </div>
                )}
              </div>

              {/* Content Info */}
              <div className={`${compact ? (isMobile ? "p-1.5" : "p-2") : isMobile ? "p-2" : "p-3"}`}>
                <h3
                  className={`text-white font-semibold group-hover:text-blue-400 transition-colors line-clamp-2 mb-1 md:mb-2 ${compact
                    ? isMobile
                      ? "text-xs"
                      : "text-sm" // Smaller text for compact mode
                    : isMobile
                      ? "text-sm"
                      : "text-base" // Original text sizes
                    }`}
                >
                  {getLocalizedText(item.title, getUILanguage(currentLanguage || "english"))}
                </h3>
                <p
                  className={`text-gray-400 line-clamp-2 ${compact
                    ? isMobile
                      ? "text-xs"
                      : "text-xs" // Smaller description text
                    : isMobile
                      ? "text-xs"
                      : "text-sm" // Original description text
                    }`}
                >
                  {getLocalizedText(item.description, getUILanguage(currentLanguage || "english"))}
                </p>

                {/* Add engagement metrics */}
                {item.engagement && (
                  <div className={`flex items-center space-x-2 mt-1 text-gray-400 ${isMobile ? "text-xs" : "text-xs"}`}>
                    <span>{item.engagement.viewsFormatted} views</span>
                    <span>•</span>
                    <span>{item.engagement.timeAgo}</span>
                  </div>
                )}
              </div>
            </Card>
          )
        })}
      </div>
    </div>
  )
}
