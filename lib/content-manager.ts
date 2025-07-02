// Centralized content management system
// UPDATED: Treat "default" as a separate independent language

import {
  seriesData,
  latestReleases,
  contentData,
  englishExclusiveContent,
  defaultExclusiveContent,
  defaultPopularStories,
  defaultLatestReleases,
} from "@/lib/content-data"
import { validateContentForPlayback, hasVideoInLanguage } from "@/lib/language-utils"

// Type definitions
export interface Episode {
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

export interface SeriesInfo {
  id: string
  title: string
  episodes: Episode[]
  type: "series" | "collection"
}

export interface ContentSearchResult {
  content: Episode
  series: SeriesInfo | null
  type: "series" | "standalone"
}

// REMOVED: Old CONTENT_COLLECTIONS system - migrated to LANGUAGE_SPECIFIC_COLLECTIONS

// UPDATED: Language-specific content collections - "default" is now its own language
const LANGUAGE_SPECIFIC_COLLECTIONS = {
  english: [
    {
      id: "evolution-humans-fire",
      title: "The Evolution of Humans and Fire",
      getContent: () =>
        englishExclusiveContent.map((item, index) => ({
          ...item,
          episodeNumber: index + 1,
          videoUrls: item.videoQualityUrls || {},
          availableLanguages: item.availableLanguages || ["english"],
        })) as Episode[],
    },
    {
      id: "popular-stories",
      title: "Popular Stories",
      getContent: () =>
        contentData
          .filter((item) => item.availableLanguages?.includes("english"))
          .map((item, index) => ({
            ...item,
            episodeNumber: index + 1,
            videoUrls: item.videoQualityUrls || {},
            availableLanguages: item.availableLanguages || ["english"],
          })) as Episode[],
    },
  ],
  hindi: [
    {
      id: "ram-katha",
      title: "संपूर्ण राम कथा",
      getContent: () =>
        seriesData["ram-katha"].episodes.map((item, index) => ({
          ...item,
          episodeNumber: index + 1,
          videoUrls: item.videoQualityUrls || {},
          availableLanguages: item.availableLanguages || ["hindi"],
        })) as Episode[],
    },
    {
      id: "popular-stories",
      title: "प्रसिद्ध कथाएँ",
      getContent: () =>
        contentData.map((item, index) => ({
          ...item,
          episodeNumber: index + 1,
          videoUrls: item.videoQualityUrls || {},
          availableLanguages: item.availableLanguages || ["hindi"],
        })) as Episode[],
    },
    {
      id: "latest-releases",
      title: "नवीनतम रिलीज़",
      getContent: () =>
        latestReleases.map((item, index) => ({
          ...item,
          episodeNumber: index + 1,
          videoUrls: item.videoQualityUrls || {},
          availableLanguages: item.availableLanguages || ["hindi"],
        })) as Episode[],
    },
  ],
  default: [
    {
      id: "default-ram-katha",
      title: "Complete Ram Katha",
      getContent: () =>
        defaultExclusiveContent.map((item, index) => ({
          ...item,
          episodeNumber: index + 1,
          videoUrls: item.videoQualityUrls || {},
          availableLanguages: item.availableLanguages || ["default"],
        })) as Episode[],
    },
    {
      id: "default-popular-stories",
      title: "Popular Mythological Stories",
      getContent: () =>
        defaultPopularStories.map((item, index) => ({
          ...item,
          episodeNumber: index + 1,
          videoUrls: item.videoQualityUrls || {},
          availableLanguages: item.availableLanguages || ["default"],
        })) as Episode[],
    },
    {
      id: "default-latest-releases",
      title: "Latest Releases",
      getContent: () =>
        defaultLatestReleases.map((item, index) => ({
          ...item,
          episodeNumber: index + 1,
          videoUrls: item.videoQualityUrls || {},
          availableLanguages: item.availableLanguages || ["default"],
        })) as Episode[],
    },
  ],
} as const

/**
 * Get series/collection data by ID
 */
export const getSeriesById = (seriesId: string, language = "hindi"): SeriesInfo | null => {
  const languageCollections =
    LANGUAGE_SPECIFIC_COLLECTIONS[language as keyof typeof LANGUAGE_SPECIFIC_COLLECTIONS] || []

  const collection = languageCollections.find((c) => c.id === seriesId)
  if (!collection) {
    // Try fallback languages
    const fallbackLanguages = ["hindi", "english", "default"].filter((l) => l !== language)
    for (const fallbackLang of fallbackLanguages) {
      const fallbackCollections =
        LANGUAGE_SPECIFIC_COLLECTIONS[fallbackLang as keyof typeof LANGUAGE_SPECIFIC_COLLECTIONS] || []
      const fallbackCollection = fallbackCollections.find((c) => c.id === seriesId)
      if (fallbackCollection) {
        try {
          const episodes = fallbackCollection.getContent()
          return {
            id: fallbackCollection.id,
            title: fallbackCollection.title,
            episodes: episodes,
            type: "collection",
          }
        } catch (error) {
          console.error(`Error loading series ${seriesId}:`, error)
          continue
        }
      }
    }

    console.warn(`Series/collection not found: ${seriesId}`)
    return null
  }

  try {
    const episodes = collection.getContent()
    return {
      id: collection.id,
      title: collection.title,
      episodes: episodes,
      type: "collection",
    }
  } catch (error) {
    console.error(`Error loading series ${seriesId}:`, error)
    return null
  }
}

/**
 * Parse video ID in format {collection_id}_{content_id}
 */
export const parseVideoId = (videoId: string): { collectionId: string; contentId: string } | null => {
  if (!videoId || typeof videoId !== "string") {
    return null
  }

  // Handle new format: collection_content
  if (videoId.includes("_")) {
    const [collectionId, contentId] = videoId.split("_", 2)
    if (collectionId && contentId) {
      return { collectionId, contentId }
    }
  }

  // Fallback: treat as legacy videoId for backward compatibility
  return null
}

/**
 * Find content by video ID across all language collections (supports both new and legacy formats)
 */
export const findContentByVideoId = (videoId: string, language = "hindi"): ContentSearchResult | null => {
  // Try new format first
  const parsed = parseVideoId(videoId)
  if (parsed) {
    const { collectionId, contentId } = parsed

    // Get language-specific collections
    const languageCollections =
      LANGUAGE_SPECIFIC_COLLECTIONS[language as keyof typeof LANGUAGE_SPECIFIC_COLLECTIONS] || []

    // Find the collection with matching ID
    for (const collection of languageCollections) {
      if (collection.id === collectionId) {
        const episodes = collection.getContent()
        const episode = episodes.find((ep) => ep.id === contentId)

        if (episode) {
          return {
            content: episode,
            series: {
              id: collection.id,
              title: collection.title,
              episodes: episodes,
              type: "collection",
            },
            type: "standalone",
          }
        }
      }
    }

    // Try fallback languages if not found in specified language
    const fallbackLanguages = ["hindi", "english", "default"].filter((l) => l !== language)
    for (const fallbackLang of fallbackLanguages) {
      const fallbackCollections =
        LANGUAGE_SPECIFIC_COLLECTIONS[fallbackLang as keyof typeof LANGUAGE_SPECIFIC_COLLECTIONS] || []

      for (const collection of fallbackCollections) {
        if (collection.id === collectionId) {
          const episodes = collection.getContent()
          const episode = episodes.find((ep) => ep.id === contentId)

          if (episode) {
            return {
              content: episode,
              series: {
                id: collection.id,
                title: collection.title,
                episodes: episodes,
                type: "collection",
              },
              type: "standalone",
            }
          }
        }
      }
    }
  }

  // Fallback to legacy search for backward compatibility
  for (const [langKey, collections] of Object.entries(LANGUAGE_SPECIFIC_COLLECTIONS)) {
    for (const collection of collections) {
      try {
        const episodes = collection.getContent()
        const episode = episodes.find((ep) => ep.videoId === videoId)
        if (episode) {
          return {
            content: episode,
            series: {
              id: collection.id,
              title: collection.title,
              episodes: episodes,
              type: "collection",
            },
            type: "standalone",
          }
        }
      } catch (error) {
        console.warn(`Error searching in collection ${collection.id}:`, error)
        continue
      }
    }
  }

  console.warn(`Content not found for videoId: ${videoId}`)
  return null
}

/**
 * Find content by content ID across all collections
 */
export const findContentById = (contentId: string): ContentSearchResult | null => {
  // Search in all registered collections
  for (const [collectionId, collection] of Object.entries(LANGUAGE_SPECIFIC_COLLECTIONS)) {
    try {
      const seriesInfo = getSeriesById(collectionId)
      if (!seriesInfo) continue

      const episode = seriesInfo.episodes.find((ep) => ep.id === contentId)
      if (episode) {
        return {
          content: episode,
          series: seriesInfo,
          type: collection.type === "series" ? "series" : "standalone",
        }
      }
    } catch (error) {
      console.warn(`Error searching in collection ${collectionId}:`, error)
      continue
    }
  }

  console.warn(`Content not found for contentId: ${contentId}`)
  return null
}

/**
 * Get next episode in a series/collection
 */
export const getNextEpisode = (currentEpisodeId: string, seriesId: string, language = "hindi"): Episode | null => {
  const seriesInfo = getSeriesById(seriesId, language)
  if (!seriesInfo) return null

  const currentIndex = seriesInfo.episodes.findIndex((ep) => ep.id === currentEpisodeId)
  if (currentIndex === -1) return null

  const isLastEpisode = currentIndex === seriesInfo.episodes.length - 1
  const nextIndex = isLastEpisode ? 0 : currentIndex + 1

  return seriesInfo.episodes[nextIndex] || null
}

/**
 * Get previous episode in a series/collection
 */
export const getPreviousEpisode = (currentEpisodeId: string, seriesId: string, language = "hindi"): Episode | null => {
  const seriesInfo = getSeriesById(seriesId, language)
  if (!seriesInfo) return null

  const currentIndex = seriesInfo.episodes.findIndex((ep) => ep.id === currentEpisodeId)
  if (currentIndex === -1) return null

  const prevIndex = currentIndex === 0 ? seriesInfo.episodes.length - 1 : currentIndex - 1

  return seriesInfo.episodes[prevIndex] || null
}

/**
 * Get all available series/collections for a specific language
 */
export const getAllSeries = (language = "hindi"): SeriesInfo[] => {
  const languageCollections =
    LANGUAGE_SPECIFIC_COLLECTIONS[language as keyof typeof LANGUAGE_SPECIFIC_COLLECTIONS] || []

  return languageCollections
    .map((collection) => {
      try {
        const episodes = collection.getContent()
        return {
          id: collection.id,
          title: collection.title,
          episodes: episodes,
          type: "collection" as const,
        }
      } catch (error) {
        console.error(`Error loading collection ${collection.id}:`, error)
        return null
      }
    })
    .filter((series): series is SeriesInfo => series !== null)
}

/**
 * UPDATED: Check if content has video in specific language
 * No special handling for "default" - treat it as any other language
 */
const checkContentLanguageAvailability = (content: any, language: string): boolean => {
  // Use the centralized function from language-utils
  return hasVideoInLanguage(content, language)
}

/**
 * UPDATED: Get series for content carousels - treat "default" as its own language
 */
export const getCarouselSeries = (language: string) => {
  // Get language-specific collections
  const languageCollections =
    LANGUAGE_SPECIFIC_COLLECTIONS[language as keyof typeof LANGUAGE_SPECIFIC_COLLECTIONS] || []

  const result = {} as any

  // Add language-specific collections
  languageCollections.forEach((collection) => {
    result[collection.id] = {
      id: collection.id,
      title: collection.title,
      episodes: collection.getContent(),
      type: "collection",
    }
  })

  return result
}

/**
 * UPDATED: Get default content for initial load - treat "default" as its own language
 */
export const getDefaultContent = (language?: string): { content: Episode; seriesId: string } | null => {
  // If no language specified, default to "hindi"
  const targetLanguage = language || "hindi"

  console.log(`🎯 Getting default content for language: ${targetLanguage}`)

  // For "default" language, prioritize default-specific content
  if (targetLanguage === "default") {
    // Check default-specific collections first
    const defaultCollections = LANGUAGE_SPECIFIC_COLLECTIONS.default || []
    for (const collection of defaultCollections) {
      const episodes = collection.getContent()
      if (episodes.length > 0) {
        console.log(`✅ Found default content in collection: ${collection.id}`)
        return {
          content: episodes[0],
          seriesId: collection.id,
        }
      }
    }
  }

  // For other languages, check language-specific collections first
  const languageCollections =
    LANGUAGE_SPECIFIC_COLLECTIONS[targetLanguage as keyof typeof LANGUAGE_SPECIFIC_COLLECTIONS] || []
  for (const collection of languageCollections) {
    const episodes = collection.getContent()
    if (episodes.length > 0) {
      console.log(`✅ Found ${targetLanguage} content in collection: ${collection.id}`)
      return {
        content: episodes[0],
        seriesId: collection.id,
      }
    }
  }

  // Check Ram Katha series
  const ramKathaData = getSeriesById("ram-katha")
  if (ramKathaData?.episodes?.[0]) {
    const firstEpisode = ramKathaData.episodes[0]
    if (checkContentLanguageAvailability(firstEpisode, targetLanguage)) {
      console.log(`✅ Found ${targetLanguage} content in Ram Katha`)
      return {
        content: firstEpisode,
        seriesId: "ram-katha",
      }
    }
  }

  // Check latest releases
  const latestReleasesData = getSeriesById("latest-releases")
  if (latestReleasesData?.episodes) {
    const availableEpisode = latestReleasesData.episodes.find((episode) =>
      checkContentLanguageAvailability(episode, targetLanguage),
    )
    if (availableEpisode) {
      console.log(`✅ Found ${targetLanguage} content in Latest Releases`)
      return {
        content: availableEpisode,
        seriesId: "latest-releases",
      }
    }
  }

  // Check popular stories
  const popularStoriesData = getSeriesById("popular-stories")
  if (popularStoriesData?.episodes) {
    const availableEpisode = popularStoriesData.episodes.find((episode) =>
      checkContentLanguageAvailability(episode, targetLanguage),
    )
    if (availableEpisode) {
      console.log(`✅ Found ${targetLanguage} content in Popular Stories`)
      return {
        content: availableEpisode,
        seriesId: "popular-stories",
      }
    }
  }

  console.warn(`❌ No content available for language: ${targetLanguage}`)
  return null
}

/**
 * Validate content has required properties
 */
export const validateContent = (content: any): content is Episode => {
  const validation = validateContentForPlayback(content)
  return validation.isValid && validation.hasVideo
}

/**
 * Register a new content collection (for extensibility)
 */
export const registerContentCollection = (
  id: string,
  type: "series" | "collection",
  dataProvider: () => { title: string; episodes: Episode[] },
) => {
  // This would be used for dynamic content registration in the future
  console.log(`Registering content collection: ${id}`)
}

/**
 * Get content statistics
 */
export const getContentStats = () => {
  const allSeries = getAllSeries()
  const totalEpisodes = allSeries.reduce((sum, series) => sum + series.episodes.length, 0)

  return {
    totalSeries: allSeries.filter((s) => s.type === "series").length,
    totalCollections: allSeries.filter((s) => s.type === "collection").length,
    totalEpisodes,
    availableLanguages: new Set(
      allSeries.flatMap((series) => series.episodes.flatMap((ep) => ep.availableLanguages || [])),
    ).size,
  }
}
