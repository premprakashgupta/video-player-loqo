"use client"

import { useState, useEffect, useCallback, useRef } from "react"
import { useSearchParams } from "next/navigation"

// Type definitions
interface Episode {
  id: string
  videoId: string
  title: string
  episodeNumber: number
  thumbnail: string
  videoUrls: {
    [key: string]: string
  }
  description: string
  duration: string
  watchProgress?: number
  availableLanguages?: string[]
}

interface SeriesInfo {
  id: string
  title: string
  episodes: Episode[]
}

import ContentCarousel from "@/components/content-carousel"
import {
  getUILanguage,
  getAvailableLanguages,
  logLanguageSwitch,
  logContentAccess,
  validateContentForPlayback,
} from "@/lib/language-utils"
import { findContentByVideoId, getCarouselSeries, getDefaultContent } from "@/lib/content-manager"

// Import the test component
import BehaviorTest from "@/components/behavior-test"
import { Button } from "@/components/ui/button"

// Import analytics functions
import {
  trackLanguageChange,
  trackContentSelection,
  trackPageView,
  trackScrollDepth,
  trackMetaScrollDepth,
} from "@/lib/analytics"
import HeroVideoPlayer from "@/components/hero-video-player"

export default function HomePage() {
  const searchParams = useSearchParams()

  const [isHydrated, setIsHydrated] = useState(false)
  const [favorites, setFavorites] = useState<string[]>([])
  const [currentLanguage, setCurrentLanguage] = useState<string>("hindi")
  const [availableLanguageTabs, setAvailableLanguageTabs] = useState<string[]>(["default", "hindi", "english"])
  const [videoPlayOffset, setVideoPlayOffset] = useState<number>(0)
  const [currentPlayingContent, setCurrentPlayingContent] = useState<any | null>(null)
  const [currentSeries, setCurrentSeries] = useState<string>("tulsi-ka-safar")
  const [isMobile, setIsMobile] = useState(false)
  const [isIOS, setIsIOS] = useState(false)
  const [showBehaviorTest, setShowBehaviorTest] = useState(false)
  const [isProgrammaticScroll, setIsProgrammaticScroll] = useState(false)

  // Use ref to track if initial setup is complete
  const isInitializedRef = useRef(false)

  // Helper function to normalize URL parameters by decoding HTML entities
  const normalizeParam = (param: string | null): string | null => {
    if (!param) return param
    return param
      .replace(/&amp;/g, "&")
      .replace(/&lt;/g, "<")
      .replace(/&gt;/g, ">")
      .replace(/&quot;/g, '"')
  }

  // Update the handlePlayContent function to use centralized content manager
  const handlePlayContent = useCallback(
    (content: any) => {
      logContentAccess(content, currentLanguage, "handlePlayContent")

      // Validate content using centralized validation
      const validation = validateContentForPlayback(content)
      if (!validation.isValid || !validation.hasVideo) {
        console.warn("Invalid content provided:", validation.issues)
        return
      }

      // Track content selection
      trackContentSelection(content.id, content.title, "carousel")

      // Rest of the function remains the same...
      setIsProgrammaticScroll(true)

      window.scrollTo({
        top: 0,
        behavior: "smooth",
      })

      setTimeout(() => {
        setIsProgrammaticScroll(false)
      }, 1000)

      const searchResult = findContentByVideoId(content.videoId, currentLanguage)

      if (searchResult) {
        console.log("✅ Found content via centralized search:", searchResult)
        setCurrentSeries(searchResult.series?.id || "standalone")
        setCurrentPlayingContent(searchResult.content)
      } else {
        const fallbackResult = findContentByVideoId(content.id, currentLanguage)
        if (fallbackResult) {
          setCurrentSeries(fallbackResult.series?.id || "standalone")
          setCurrentPlayingContent(fallbackResult.content)
        } else {
          console.log("✅ Playing standalone content:", content.title)
          setCurrentPlayingContent(content)
        }
      }
    },
    [currentLanguage],
  )

  // UPDATED: Single effect to handle all URL parameter processing and initialization
  // No special handling for "default" language
  useEffect(() => {
    if (typeof window === "undefined") return

    setIsHydrated(true)

    // Only run initialization once
    if (isInitializedRef.current) return
    isInitializedRef.current = true

    // Get and normalize parameters to handle HTML entities
    const videoId = normalizeParam(searchParams.get("videoId"))
    const videoLanguage = normalizeParam(searchParams.get("videoLanguage")) || "default"
    const languageTabs = normalizeParam(searchParams.get("languageTabs"))
    const playOffset = normalizeParam(searchParams.get("videoPlayOffset"))

    console.log("Query params:", { videoId, videoLanguage, languageTabs, playOffset })

    // Enhanced validation for malformed parameters
    const shouldSkipParams =
      !videoId ||
      videoId.includes("&amp;") || // HTML encoded ampersands
      videoId.includes("%20") || // URL encoded spaces
      videoId.includes(" ") || // Unencoded spaces (like "[object Object]")
      videoId === "[object Object]" || // Exact match for stringified object
      videoId === "undefined" || // Exact match for undefined
      videoId === "null" || // Exact match for null
      videoId.includes("[object") || // Any stringified object pattern
      videoId.includes("Object]") || // Any stringified object pattern
      videoId.includes("%5B") || // URL encoded [ bracket
      videoId.includes("%5D") || // URL encoded ] bracket
      !videoId.match(/^[a-zA-Z0-9_-]+$/) || // Only allow alphanumeric, underscore, hyphen
      videoId.length > 100 || // Prevent extremely long IDs
      videoId.length < 1 // Prevent empty strings

    if (shouldSkipParams) {
      console.log("Skipping URL parameters, loading default content")
      // Set default content without URL parameters
      const defaultContent = getDefaultContent("hindi")
      if (defaultContent) {
        setCurrentPlayingContent(defaultContent.content)
        setCurrentSeries(defaultContent.seriesId)
      }
      setCurrentLanguage("hindi")
      setAvailableLanguageTabs(["default", "hindi", "english"])
      return
    }

    // UPDATED: Set language directly without special handling
    setCurrentLanguage(videoLanguage)

    // Set language tabs
    if (languageTabs) {
      try {
        const tabsArray = languageTabs.split(",").slice(0, 3)
        // Ensure "default" is always included if not present
        if (!tabsArray.includes("default")) {
          tabsArray.unshift("default")
        }
        setAvailableLanguageTabs(tabsArray.slice(0, 3)) // Keep max 3 tabs
      } catch (error) {
        console.warn("Error parsing languageTabs:", error)
        setAvailableLanguageTabs(["default", "hindi", "english"])
      }
    } else {
      setAvailableLanguageTabs(["default", "hindi", "english"])
    }

    // Set play offset
    if (playOffset) {
      const offset = Number.parseFloat(playOffset)
      if (!isNaN(offset)) {
        setVideoPlayOffset(offset)
      }
    }

    // UPDATED: Find and set content using centralized content manager
    // Pass language parameter to findContentByVideoId
    if (videoId) {
      const foundContent = findContentByVideoId(videoId, videoLanguage)
      if (foundContent) {
        setCurrentSeries(foundContent.series?.id || "standalone")
        setCurrentPlayingContent(foundContent.content)
      } else {
        console.warn("Video not found, trying language-specific default")
        // Try to get default content for the specific language
        const defaultContent = getDefaultContent(videoLanguage)
        if (defaultContent) {
          setCurrentPlayingContent(defaultContent.content)
          setCurrentSeries(defaultContent.seriesId)
        } else {
          console.warn("No content available for language:", videoLanguage)
          // Set content to null to show blank page
          setCurrentPlayingContent(null)
          setCurrentSeries("")
        }
      }
    } else {
      // UPDATED: Set default content when no videoId - treat all languages equally
      const defaultContent = getDefaultContent(videoLanguage)
      if (defaultContent) {
        setCurrentPlayingContent(defaultContent.content)
        setCurrentSeries(defaultContent.seriesId)
      } else {
        console.warn("No default content available for language:", videoLanguage)
        // Set content to null to show blank page
        setCurrentPlayingContent(null)
        setCurrentSeries("")
      }
    }
  }, []) // Empty dependency array to run only once

  // Get available languages for tabs using centralized utility
  const availableLanguages = getAvailableLanguages(availableLanguageTabs)

  // Device detection
  useEffect(() => {
    const checkDevice = () => {
      const width = window.innerWidth
      setIsMobile(width < 768)
      setIsIOS(/iPad|iPhone|iPod/.test(navigator.userAgent))
    }

    checkDevice()
    window.addEventListener("resize", checkDevice)

    return () => window.removeEventListener("resize", checkDevice)
  }, [])

  // Add this useEffect for page view tracking
  useEffect(() => {
    if (isHydrated) {
      trackPageView(window.location.pathname, "LOQO Home", currentLanguage)
    }
  }, [currentLanguage, isHydrated])

  // Add scroll depth tracking
  useEffect(() => {
    const scrollDepthTracked = {
      25: false,
      50: false,
      75: false,
      100: false,
    }

    const handleScroll = () => {
      const scrollTop = window.pageYOffset || document.documentElement.scrollTop
      const documentHeight = document.documentElement.scrollHeight - window.innerHeight
      const scrollPercentage = Math.round((scrollTop / documentHeight) * 100)

      // Track scroll depth milestones
      if (scrollPercentage >= 25 && !scrollDepthTracked[25]) {
        scrollDepthTracked[25] = true
        trackScrollDepth(25, "home")
        trackMetaScrollDepth(25, "home")
      }
      if (scrollPercentage >= 50 && !scrollDepthTracked[50]) {
        scrollDepthTracked[50] = true
        trackScrollDepth(50, "home")
        trackMetaScrollDepth(50, "home")
      }
      if (scrollPercentage >= 75 && !scrollDepthTracked[75]) {
        scrollDepthTracked[75] = true
        trackScrollDepth(75, "home")
        trackMetaScrollDepth(75, "home")
      }
      if (scrollPercentage >= 100 && !scrollDepthTracked[100]) {
        scrollDepthTracked[100] = true
        trackScrollDepth(100, "home")
        trackMetaScrollDepth(100, "home")
      }
    }

    window.addEventListener("scroll", handleScroll, { passive: true })

    return () => {
      window.removeEventListener("scroll", handleScroll)
    }
  }, [])

  // Language switching using centralized utilities
  const handleLanguageChange = useCallback(
    (newLanguage: string) => {
      if (newLanguage !== currentLanguage) {
        logLanguageSwitch(currentLanguage, newLanguage, "page.tsx")

        // Track language change
        trackLanguageChange(currentLanguage, newLanguage)

        setCurrentLanguage(newLanguage)

        // Update URL with new language
        const url = new URL(window.location.href)
        url.searchParams.set("videoLanguage", newLanguage)
        window.history.replaceState({}, "", url.toString())
      }
    },
    [currentLanguage],
  )

  const handleAddToFavorites = useCallback((contentId: string) => {
    setFavorites((prev) => (prev.includes(contentId) ? prev.filter((id) => id !== contentId) : [...prev, contentId]))
  }, [])

  // Show loading until hydrated
  if (!isHydrated) {
    return (
      <div className="min-h-screen bg-black text-white flex items-center justify-center">
        <div className="text-center">
          <div className="w-8 h-8 border-2 border-white border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p>Loading content...</p>
        </div>
      </div>
    )
  }

  // Show blank page if no content available for the language
  if (!currentPlayingContent) {
    return (
      <div className="min-h-screen bg-black text-white">
        {/* Header Navigation Bar */}
        <header className="fixed top-0 left-0 right-0 z-30 bg-black/95 backdrop-blur-sm border-b border-gray-800">
          <div className="flex items-center justify-between px-3 md:px-4 py-2 h-12 md:h-14">
            {/* Left Section - Logo */}
            <div className="flex items-center space-x-2 md:space-x-4">
              <div
                className="cursor-pointer flex items-center space-x-2"
                onClick={() => window.scrollTo({ top: 0, behavior: "smooth" })}
              >
                <img
                  src="https://hebbkx1anhila5yf.public.blob.vercel-storage.com/LOQO%20AI%20logo%20compressed-LP4gGUqgmkGJhadR4dimvdY7ycKTZD.png"
                  alt="LOQO AI Logo"
                  className="w-6 h-6 md:w-8 md:h-8"
                />
                <span className="text-lg md:text-xl font-bold text-white">LOQO</span>
              </div>
            </div>

            {/* Right Section - Language Tabs */}
            <div className="flex items-center space-x-2 md:space-x-4">
              {/* Language Tabs */}
              <div className="flex items-center bg-gray-800/50 rounded-full p-1">
                {availableLanguages.map((language) => (
                  <button
                    key={language.code}
                    onClick={() => handleLanguageChange(language.code)}
                    className={`flex items-center space-x-1 px-2 md:px-3 py-1 md:py-1.5 rounded-full transition-all duration-200 text-xs md:text-sm ${currentLanguage === language.code
                      ? "bg-blue-600 text-white shadow-lg"
                      : "text-gray-300 hover:text-white hover:bg-gray-700/50"
                      }`}
                  >
                    <span className="text-sm md:text-base">{language.flag}</span>
                    {language.code !== "default" && (
                      <>
                        <span className="hidden sm:inline font-medium">{language.name}</span>
                        <span className="sm:hidden font-medium">
                          {language.code.charAt(0).toUpperCase() + language.code.slice(1, 3)}
                        </span>
                      </>
                    )}
                  </button>
                ))}
              </div>
            </div>
          </div>
        </header>

        {/* Main Content - Empty state */}
        <div className="pt-16 min-h-screen flex items-center justify-center">
          <div className="text-center text-gray-400">
            <h2 className="text-xl md:text-2xl font-semibold mb-2">No Content Available</h2>
            <p className="text-sm md:text-base">
              No videos are available in{" "}
              {availableLanguages.find((lang) => lang.code === currentLanguage)?.name || currentLanguage} language.
            </p>
            <p className="text-xs md:text-sm mt-2 opacity-75">
              Try selecting a different language from the options above.
            </p>
          </div>
        </div>
      </div>
    )
  }

  // Get carousel series using centralized content manager with current playing content
  const carouselSeries = getCarouselSeries(currentLanguage)

  const getLocalizedText = (textObject: { [key: string]: string }, language: string): string => {
    return textObject[language] || textObject["default"] || ""
  }

  return (
    <div className="min-h-screen bg-black text-white">
      {/* Header Navigation Bar */}
      <header className="fixed top-0 left-0 right-0 z-30 bg-black/95 backdrop-blur-sm border-b border-gray-800">
        <div className="flex items-center justify-between px-3 md:px-4 py-2 h-12 md:h-14">
          {/* Left Section - Logo */}
          <div className="flex items-center space-x-2 md:space-x-4">
            <div
              className="cursor-pointer flex items-center space-x-2"
              onClick={() => window.scrollTo({ top: 0, behavior: "smooth" })}
            >
              <img
                src="https://hebbkx1anhila5yf.public.blob.vercel-storage.com/LOQO%20AI%20logo%20compressed-LP4gGUqgmkGJhadR4dimvdY7ycKTZD.png"
                alt="LOQO AI Logo"
                className="w-6 h-6 md:w-8 md:h-8"
              />
              <span className="text-lg md:text-xl font-bold text-white">LOQO</span>
            </div>
          </div>

          {/* Right Section - Language Tabs */}
          <div className="flex items-center space-x-2 md:space-x-4">
            {/* Language Tabs */}
            <div className="flex items-center bg-gray-800/50 rounded-full p-1">
              {availableLanguages.map((language) => (
                <button
                  key={language.code}
                  onClick={() => handleLanguageChange(language.code)}
                  className={`flex items-center space-x-1 px-2 md:px-3 py-1 md:py-1.5 rounded-full transition-all duration-200 text-xs md:text-sm ${currentLanguage === language.code
                    ? "bg-blue-600 text-white shadow-lg"
                    : "text-gray-300 hover:text-white hover:bg-gray-700/50"
                    }`}
                >
                  <span className="text-sm md:text-base">{language.flag}</span>
                  {language.code !== "default" && (
                    <>
                      <span className="hidden sm:inline font-medium">{language.name}</span>
                      <span className="sm:hidden font-medium">
                        {language.code.charAt(0).toUpperCase() + language.code.slice(1, 3)}
                      </span>
                    </>
                  )}
                </button>
              ))}
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <div className="pt-16">
        <div className="-mt-4">

          <HeroVideoPlayer
            currentPlayingContent={currentPlayingContent}
            currentSeries={currentSeries}
            onContentChange={setCurrentPlayingContent}
            onSeriesChange={setCurrentSeries}
            isMobile={isMobile}
            isIOS={isIOS}
            currentLanguage={currentLanguage}
            videoPlayOffset={videoPlayOffset}
            isProgrammaticScroll={isProgrammaticScroll}
            languageCollections={carouselSeries}
          />
        </div>

        {/* Content Carousels Section */}
        <div className="px-4 md:px-8 py-4 md:py-6 bg-black">
          <div className="max-w-7xl mx-auto">
            <>
              {Object.entries(carouselSeries).map(
                ([key, series]) =>
                  series && (
                    <ContentCarousel
                      key={key}
                      title={
                        typeof series.title === "object"
                          ? getLocalizedText(series.title, getUILanguage(currentLanguage))
                          : series.title
                      }
                      content={series.episodes}
                      onPlay={handlePlayContent}
                      showProgress={false} // Remove progress functionality
                      currentLanguage={getUILanguage(currentLanguage)}
                    />
                  ),
              )}
            </>
          </div>
        </div>
      </div>
      {process.env.NODE_ENV === "development" && (
        <>
          <Button
            onClick={() => setShowBehaviorTest(!showBehaviorTest)}
            className="fixed bottom-4 left-4 z-50"
            size="sm"
          >
            {showBehaviorTest ? "Hide" : "Show"} Test
          </Button>

          {showBehaviorTest && (
            <BehaviorTest
              currentLanguage={currentLanguage}
              onLanguageChange={handleLanguageChange}
              onPlayContent={handlePlayContent}
              currentPlayingContent={currentPlayingContent}
              currentSeries={currentSeries}
            />
          )}
        </>
      )}
    </div>
  )
}
