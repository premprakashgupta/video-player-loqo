"use client"

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useSearchParams } from "next/navigation";
import Image from "next/image";

import { EpisodeContent } from "@/@type/player.type";
import ContentCarousel from "@/components/content-carousel";
import HLSPlayer from "@/components/HLSPlayer";
import { getLocalizedText } from "@/lib/content-data";
import { findContentByVideoId, getCarouselSeries, getDefaultContent } from "@/lib/content-manager";
import {
  getAvailableLanguages,
  getUILanguage,
  logContentAccess,
  logLanguageSwitch,
  validateContentForPlayback,
} from "@/lib/language-utils";
import { isMalformedVideoId } from "@/lib/utils";
import { trackContentSelection, trackMetaScrollDepth, trackPageView, trackScrollDepth } from "@/lib/analytics";

export default function Home() {
  const searchParams = useSearchParams()
  // Use ref to track if initial setup is complete
  const isInitializedRef = useRef(false)
  const [isHydrated, setIsHydrated] = useState(false)
  const [availableLanguageTabs, setAvailableLanguageTabs] = useState(["default", "hindi", "english"]);
  const [videoPlayOffset, setVideoPlayOffset] = useState(0)
  const [isIOS, setIsIOS] = useState(false)
  const [isMobile, setIsMobile] = useState(false)
  const [currentLanguage, setCurrentLanguage] = useState("hindi");
  const [carouselSeries, setCarouselSeries] = useState(() => getCarouselSeries("hindi"));
  const [currVideo, setCurrVideo] = useState<EpisodeContent | null>(
    null
  );
  const [currSeries, setCurrSeries] = useState("tulsi-ka-safar")

  const [isProgrammaticScroll, setIsProgrammaticScroll] = useState(false)

  useEffect(() => {
    if (typeof window === "undefined") return;

    setIsHydrated(true);

    if (isInitializedRef.current) return;
    isInitializedRef.current = true;

    const rawVideoId = searchParams.get("videoId");
    const videoId = rawVideoId?.trim() || null;
    const videoLanguage = searchParams.get("videoLanguage") || "hindi";
    const languageTabs = searchParams.get("languageTabs");
    const playOffset = searchParams.get("videoPlayOffset");

    const tabsArray = languageTabs
      ? languageTabs.split(",").slice(0, 3).filter(Boolean)
      : ["default", "hindi", "english"];

    if (!tabsArray.includes("default")) {
      tabsArray.unshift("default");
    }
    setAvailableLanguageTabs(tabsArray.slice(0, 3));

    if (playOffset) {
      const offset = parseFloat(playOffset);
      if (!isNaN(offset)) {
        setVideoPlayOffset(offset);
      }
    }

    // ✅ URL params are missing or malformed
    const skip = isMalformedVideoId(videoId);
    console.log("skip: --", skip)
    if (skip) {
      console.log("Skipping malformed or empty videoId");

      setCurrentLanguage("hindi");
      const fallback = getDefaultContent("hindi");
      if (fallback) {
        setCurrVideo(fallback.content);
        setCurrSeries(fallback.seriesId);
      } else {
        setCurrVideo(null);
        setCurrSeries("");
      }
      return;
    }

    // ✅ Set current language from URL
    setCurrentLanguage(videoLanguage);

    // ✅ Try to load valid video
    const result = findContentByVideoId(videoId!, videoLanguage);
    console.log(result)
    if (result) {
      setCurrVideo(result.content);
      setCurrSeries(result.series?.id || "standalone");
    } else {
      console.warn("Video not found, using fallback");

      const fallback = getDefaultContent(videoLanguage);
      if (fallback) {
        setCurrVideo(fallback.content);
        setCurrSeries(fallback.seriesId);
      } else {
        setCurrVideo(null);
        setCurrSeries("");
      }
    }
  }, []);

  const availableLanguages = useMemo(
    () => getAvailableLanguages(availableLanguageTabs),
    [availableLanguageTabs]
  );

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


  const trackedRef = useRef<{ [key: number]: boolean }>({
    25: false,
    50: false,
    75: false,
    100: false,
  });
  useEffect(() => {
    const milestones = [25, 50, 75, 100];

    const handleScroll = () => {
      const scrollTop = window.scrollY || document.documentElement.scrollTop;
      const docHeight = document.documentElement.scrollHeight - window.innerHeight;

      if (docHeight <= 0) return;

      const percent = Math.min(100, Math.round((scrollTop / docHeight) * 100));

      for (const milestone of milestones) {
        if (percent >= milestone && !trackedRef.current[milestone]) {
          trackedRef.current[milestone] = true;
          trackScrollDepth(milestone, "home");
          trackMetaScrollDepth(milestone, "home");
        }
      }
    };

    window.addEventListener("scroll", handleScroll, { passive: true });
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);


  const handleLanguageChange = useCallback(
    (newLanguage: string) => {
      if (newLanguage !== currentLanguage) {
        logLanguageSwitch(currentLanguage, newLanguage, "page.tsx");
        setCurrentLanguage(newLanguage);

        const updatedURL = new URL(window.location.href);
        updatedURL.searchParams.set("videoLanguage", newLanguage);
        window.history.replaceState({}, "", updatedURL.toString());

        const updatedSeries = getCarouselSeries(newLanguage);
        setCarouselSeries(updatedSeries);
      }
    },
    [currentLanguage]
  );

  const handlePlayContent = useCallback((episode: EpisodeContent) => {
    // Log user intent
    logContentAccess(episode, currentLanguage, "handlePlayContent");

    // Validation before playing
    const validation = validateContentForPlayback(episode);
    if (!validation.isValid || !validation.hasVideo) {
      console.warn("Invalid episode:", validation.issues);
      return;
    }

    // Track click
    trackContentSelection(episode.id, episode.title[currentLanguage], "carousel");

    // Smooth scroll + temporary programmatic scroll lock
    setIsProgrammaticScroll(true);
    window.scrollTo({ top: 0, behavior: "smooth" });
    setTimeout(() => setIsProgrammaticScroll(false), 1000);

    // Ensure the episode is fully resolved from the content store
    const found = findContentByVideoId(episode.videoId, currentLanguage) ||
      findContentByVideoId(episode.id, currentLanguage);

    if (found) {
      setCurrSeries(found.series?.id || "standalone");
      setCurrVideo(found.content);
    } else {
      console.log("Fallback: setting raw episode");
      setCurrSeries("standalone");
      setCurrVideo(episode); // direct fallback
    }
  }, [currentLanguage]);


  const handleNext = () => {
    const episodes = carouselSeries["ram-katha"].episodes;
    const index = episodes.findIndex((ep: EpisodeContent) => ep.id === currVideo?.id);
    if (index < episodes.length - 1) setCurrVideo(episodes[index + 1]);
    else console.log("Episode end");
  };

  const handlePrev = () => {
    const episodes = carouselSeries["ram-katha"].episodes;
    const index = episodes.findIndex((ep: EpisodeContent) => ep.id === currVideo?.id);
    if (index > 0) setCurrVideo(episodes[index - 1]);
    else console.log("Episode start");
  };

  return (
    <div className="min-h-screen bg-black p-6 text-white">
      {/* Header */}
      <header className="fixed top-0 left-0 right-0 z-30 bg-black/95 backdrop-blur-sm border-b border-gray-800">
        <div className="flex items-center justify-between px-3 md:px-4 py-2 h-12 md:h-14">
          {/* Logo */}
          <div
            className="cursor-pointer flex items-center space-x-2"
            onClick={() => window.scrollTo({ top: 0, behavior: "smooth" })}
          >
            <img
              src="https://hebbkx1anhila5yf.public.blob.vercel-storage.com/LOQO%20AI%20logo%20compressed-LP4gGUqgmkGJhadR4dimvdY7ycKTZD.png"
              alt="LOQO AI Logo"
              className="w-6 h-6 md:w-8 md:h-8"
            />
            <span className="text-lg md:text-xl font-bold">LOQO</span>
          </div>

          {/* Language Switcher */}
          <div className="flex items-center bg-gray-800/50 rounded-full p-1">
            {availableLanguages.map(({ code, flag, name }) => (
              <button
                key={code}
                onClick={() => handleLanguageChange(code)}
                className={`flex items-center space-x-1 px-2 md:px-3 py-1 md:py-1.5 rounded-full transition-all duration-200 text-xs md:text-sm ${currentLanguage === code
                  ? "bg-blue-600 text-white shadow-lg"
                  : "text-gray-300 hover:text-white hover:bg-gray-700/50"
                  }`}
              >
                <span className="text-sm md:text-base">{flag}</span>
                {code !== "default" && (
                  <span className="hidden sm:inline font-medium">{name}</span>
                )}
              </button>
            ))}
          </div>
        </div>
      </header>

      {/* Video Player */}
      <div className="pt-20">
        {currVideo !== null && currentLanguage !== "" ? (
          <HLSPlayer
            key={currVideo.id}
            content={currVideo}
            currentLanguage={currentLanguage}
            onNext={handleNext}
            onPrev={handlePrev}
            isIOS={false}
            isMobile={false}
          />
        ) : (
          <p className="text-center">Loading...</p>
        )}
      </div>

      {/* Carousels */}
      <div className="px-4 md:px-8 py-6">
        <div className="max-w-7xl mx-auto">
          {Object.entries(carouselSeries).map(([key, series]) => (
            <ContentCarousel
              key={key}
              title={
                typeof series.title === "object"
                  ? getLocalizedText(series.title, getUILanguage(currentLanguage))
                  : series.title
              }
              content={series.episodes}
              onPlay={handlePlayContent}
              showProgress={false}
              currentLanguage={getUILanguage(currentLanguage)}
            />
          ))}
        </div>
      </div>
    </div>
  );
}