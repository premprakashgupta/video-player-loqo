"use client"
import ContentCarousel from "@/components/content-carousel";
import HLSPlayer from "@/components/HLSPlayer";
import { getLocalizedText } from "@/lib/content-data";
import { getCarouselSeries } from "@/lib/content-manager";
import { getAvailableLanguages, getUILanguage, logLanguageSwitch } from "@/lib/language-utils";
import Image from "next/image";
import { useSearchParams } from "next/navigation";
import { useCallback, useState } from "react";

export default function Home() {
  const [availableLanguageTabs, setAvailableLanguageTabs] = useState<string[]>(["default", "hindi", "english"])
  const availableLanguages = getAvailableLanguages(availableLanguageTabs)
  const [currentLanguage, setCurrentLanguage] = useState<string>("hindi")
  const carouselSeries = getCarouselSeries(currentLanguage)
  const [currVideo, setCurrVideo] = useState(null)

  const handleLanguageChange = useCallback(
    (newLanguage: string) => {
      if (newLanguage !== currentLanguage) {
        logLanguageSwitch(currentLanguage, newLanguage, "page.tsx")

        // Track language change
        // trackLanguageChange(currentLanguage, newLanguage)

        setCurrentLanguage(newLanguage)

        // Update URL with new language
        const url = new URL(window.location.href)
        url.searchParams.set("videoLanguage", newLanguage)
        window.history.replaceState({}, "", url.toString())
      }
    },
    [currentLanguage],
  )

  const handlePlayContent = (episodContent) => {
    setCurrVideo()
  }

  return (
    <div className="min-h-screen bg-black p-6 text-white">
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
      <HLSPlayer
        content={{
          videoQualityUrls: {
            hindi: {
              "480p": "https://g-mob.glance-cdn.com/public/videos/abr/hls/iYi4EgjUZFA.m3u8",
              "720p": "https://g-mob.glance-cdn.com/public/videos/abr/hls/glJoaEcOK1x.m3u8",
              "1080p": "https://g-mob.glance-cdn.com/public/videos/abr/hls/5KeHSr6Y5bF.m3u8",
              "4K": "https://d2asf24s4fljij.cloudfront.net/HLS-Streamings/Ram_janm_4K/Ram_janm_4K.m3u8",
            },
          },
        }}
      />

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
  );
}
