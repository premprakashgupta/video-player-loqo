// Centralized language management utilities
// Enhanced with quality validation and device-aware recommendations
// UPDATED: Treat "default" as its own independent language

export const languageMap = {
  hindi: { code: "hindi", name: "हिंदी", flag: "🇮🇳" },
  english: { code: "english", name: "English", flag: "🇺🇸" },
  tamil: { code: "tamil", name: "தமிழ்", flag: "🇮🇳" },
  telugu: { code: "telugu", name: "తెలుగు", flag: "🇮🇳" },
  malayalam: { code: "malayalam", name: "മലയാളം", flag: "🇮🇳" },
  bengali: { code: "bengali", name: "বাংলা", flag: "🇮🇳" },
  indonesia: { code: "indonesia", name: "Indonesia", flag: "🇮🇩" },
  default: { code: "default", name: "Default", flag: "🌐" },
}

/**
 * UPDATED: Get UI language - treat "default" as its own language
 * No more special mapping to "english"
 */
export const getUILanguage = (language: string): string => {
  // Validate that the language exists in our language map
  if (language in languageMap) {
    return language
  }
  // Fallback to english if language not found
  console.warn(`Language ${language} not found in languageMap, falling back to english`)
  return "english"
}

/**
 * UPDATED: Get video language - treat "default" as its own language
 * No more special mapping to "hindi"
 */
export const getVideoLanguage = (language: string): string => {
  // Validate that the language exists in our language map
  if (language in languageMap) {
    return language
  }
  // Fallback to hindi if language not found
  console.warn(`Language ${language} not found in languageMap, falling back to hindi`)
  return "hindi"
}

/**
 * Get available languages for tabs from language codes
 */
export const getAvailableLanguages = (languageCodes: string[]) => {
  return languageCodes
    .slice(0, 3)
    .map((langCode) => languageMap[langCode as keyof typeof languageMap])
    .filter(Boolean)
}

/**
 * Validate if a language code is supported
 */
export const isValidLanguage = (language: string): boolean => {
  return language in languageMap
}

/**
 * UPDATED: Get fallback language chain - treat "default" as its own language
 * Create a more comprehensive fallback system
 */
export const getVideoFallbackChain = (primaryLanguage: string): string[] => {
  // Validate primary language
  const validatedLanguage = isValidLanguage(primaryLanguage) ? primaryLanguage : "hindi"

  // Create fallback chain based on language
  const fallbackChain = [validatedLanguage]

  // Add logical fallbacks based on the primary language
  if (validatedLanguage === "default") {
    // For default language, fallback to hindi then english
    if (!fallbackChain.includes("hindi")) fallbackChain.push("hindi")
    if (!fallbackChain.includes("english")) fallbackChain.push("english")
  } else if (validatedLanguage === "english") {
    // For english, fallback to hindi then default
    if (!fallbackChain.includes("hindi")) fallbackChain.push("hindi")
    if (!fallbackChain.includes("default")) fallbackChain.push("default")
  } else if (validatedLanguage === "hindi") {
    // For hindi, fallback to default then english
    if (!fallbackChain.includes("default")) fallbackChain.push("default")
    if (!fallbackChain.includes("english")) fallbackChain.push("english")
  } else {
    // For other languages, fallback to hindi, default, then english
    if (!fallbackChain.includes("hindi")) fallbackChain.push("hindi")
    if (!fallbackChain.includes("default")) fallbackChain.push("default")
    if (!fallbackChain.includes("english")) fallbackChain.push("english")
  }

  return fallbackChain
}

/**
 * Get the best available video URL for a given language
 */
export const getBestVideoUrl = (videoUrls: { [key: string]: string }, language: string): string | null => {
  if (!videoUrls || Object.keys(videoUrls).length === 0) {
    return null
  }

  const fallbackChain = getVideoFallbackChain(language)

  // Try each language in the fallback chain
  for (const fallbackLang of fallbackChain) {
    if (videoUrls[fallbackLang]) {
      return videoUrls[fallbackLang]
    }
  }

  // Last resort: return first available video
  return Object.values(videoUrls)[0] || null
}

/**
 * UPDATED: Get default video URL - no special handling for "default"
 */
export const getDefaultVideoUrl = (
  content: {
    videoQualityUrls?: { [language: string]: { [quality: string]: string } }
    videoUrls?: { [key: string]: string }
    videoUrl?: string
  },
  language: string,
): string | null => {
  // Handle legacy single videoUrl
  if (!content.videoQualityUrls && !content.videoUrls && content.videoUrl) {
    return content.videoUrl
  }

  // Handle legacy videoUrls
  if (content.videoUrls && !content.videoQualityUrls) {
    return getBestVideoUrl(content.videoUrls, language)
  }

  // Get from quality URLs - return lowest quality
  if (content.videoQualityUrls) {
    const fallbackChain = getVideoFallbackChain(language)

    for (const fallbackLang of fallbackChain) {
      const qualityUrls = content.videoQualityUrls[fallbackLang]
      if (qualityUrls) {
        // Return lowest quality available
        const qualities = ["480p", "720p", "1080p", "4K"]
        for (const quality of qualities) {
          if (qualityUrls[quality]) {
            return qualityUrls[quality]
          }
        }
      }
    }
  }

  return null
}

/**
 * Log language switching for debugging
 */
export const logLanguageSwitch = (from: string, to: string, context: string) => {
  console.log(`🔄 Language change [${context}]: ${from} → ${to}`)
}

/**
 * Log content access for debugging
 */
export const logContentAccess = (content: any, language: string, source: string) => {
  console.log(`[${source}] Playing content:`, {
    id: content.id,
    title: content.title,
    language: language,
    hasVideoUrls: !!content.videoUrls,
    availableLanguages: content.videoUrls ? Object.keys(content.videoUrls) : [],
    videoUrl: getBestVideoUrl(content.videoUrls, language) || "no video available",
  })
}

/**
 * UPDATED: Enhanced video URL resolution - no special handling for "default"
 */
export const resolveVideoUrlWithQuality = (
  content: {
    videoUrls?: { [key: string]: string }
    videoQualityUrls?: { [language: string]: { [quality: string]: string } }
    videoUrl?: string
  },
  language: string,
  preferredQuality?: string,
): { url: string | null; resolvedLanguage: string; fallbackUsed: boolean; quality: string } => {
  // Handle legacy content with single videoUrl
  if (!content.videoQualityUrls && !content.videoUrls && content.videoUrl) {
    return {
      url: content.videoUrl,
      resolvedLanguage: language,
      fallbackUsed: false,
      quality: "unknown",
    }
  }

  const fallbackChain = getVideoFallbackChain(language)

  // Try to get quality-specific URLs first (PRIMARY PATH)
  if (content.videoQualityUrls && preferredQuality) {
    for (const fallbackLang of fallbackChain) {
      const qualityUrls = content.videoQualityUrls[fallbackLang]
      if (qualityUrls && qualityUrls[preferredQuality]) {
        const fallbackUsed = fallbackLang !== language
        return {
          url: qualityUrls[preferredQuality],
          resolvedLanguage: fallbackLang,
          fallbackUsed,
          quality: preferredQuality,
        }
      }
    }
  }

  // Try to get lowest quality from videoQualityUrls (FALLBACK PATH)
  if (content.videoQualityUrls) {
    for (const fallbackLang of fallbackChain) {
      const qualityUrls = content.videoQualityUrls[fallbackLang]
      if (qualityUrls) {
        const qualities = ["480p", "720p", "1080p", "4K"]
        for (const quality of qualities) {
          if (qualityUrls[quality]) {
            const fallbackUsed = fallbackLang !== language
            return {
              url: qualityUrls[quality],
              resolvedLanguage: fallbackLang,
              fallbackUsed,
              quality,
            }
          }
        }
      }
    }
  }

  // Legacy support for videoUrls (LEGACY PATH)
  if (content.videoUrls && Object.keys(content.videoUrls).length > 0) {
    for (const fallbackLang of fallbackChain) {
      if (content.videoUrls[fallbackLang]) {
        const fallbackUsed = fallbackLang !== language
        return {
          url: content.videoUrls[fallbackLang],
          resolvedLanguage: fallbackLang,
          fallbackUsed,
          quality: "480p", // Default quality
        }
      }
    }

    // Last resort: return first available video from videoUrls
    const firstAvailableUrl = Object.values(content.videoUrls)[0] || null
    const firstAvailableLanguage = Object.keys(content.videoUrls)[0] || language

    if (firstAvailableUrl) {
      console.warn(`⚠️ Using first available video (${firstAvailableLanguage}) for language ${language}`)
    }

    return {
      url: firstAvailableUrl,
      resolvedLanguage: firstAvailableLanguage,
      fallbackUsed: true,
      quality: "480p",
    }
  }

  // No video URLs found
  console.warn("No video URLs available for content:", content)
  return {
    url: null,
    resolvedLanguage: language,
    fallbackUsed: false,
    quality: "unknown",
  }
}

/**
 * Get available qualities for content and language
 */
export const getAvailableQualities = (
  content: {
    videoQualityUrls?: { [language: string]: { [quality: string]: string } }
  },
  language: string,
): string[] => {
  // No special handling for "default" - treat it as any other language
  if (content.videoQualityUrls && content.videoQualityUrls[language]) {
    return Object.keys(content.videoQualityUrls[language])
  }

  return ["480p"] // Default fallback
}

/**
 * UPDATED: Enhanced video URL resolution - no special handling for "default"
 */
export const resolveVideoUrl = (
  content: {
    videoUrls?: { [key: string]: string }
    videoUrl?: string
    videoQualityUrls?: { [language: string]: { [quality: string]: string } }
  },
  language: string,
): { url: string | null; resolvedLanguage: string; fallbackUsed: boolean } => {
  // Handle legacy content with single videoUrl
  if (!content.videoUrls && !content.videoQualityUrls && content.videoUrl) {
    return {
      url: content.videoUrl,
      resolvedLanguage: language,
      fallbackUsed: false,
    }
  }

  // Handle videoQualityUrls format (NEW)
  if (content.videoQualityUrls && !content.videoUrls) {
    const fallbackChain = getVideoFallbackChain(language)

    for (const fallbackLang of fallbackChain) {
      const qualityUrls = content.videoQualityUrls[fallbackLang]
      if (qualityUrls) {
        // Get lowest quality available
        const qualities = ["480p", "720p", "1080p", "4K"]
        for (const quality of qualities) {
          if (qualityUrls[quality]) {
            const fallbackUsed = fallbackLang !== language

            if (fallbackUsed) {
              console.log(`🔄 Video fallback: ${language} → ${fallbackLang}`)
            }

            return {
              url: qualityUrls[quality],
              resolvedLanguage: fallbackLang,
              fallbackUsed,
            }
          }
        }
      }
    }
  }

  // Handle legacy videoUrls format (EXISTING)
  if (!content.videoUrls || Object.keys(content.videoUrls).length === 0) {
    console.warn("No video URLs available for content:", content)
    return {
      url: null,
      resolvedLanguage: language,
      fallbackUsed: false,
    }
  }

  const fallbackChain = getVideoFallbackChain(language)

  // Try each language in the fallback chain
  for (const fallbackLang of fallbackChain) {
    if (content.videoUrls[fallbackLang]) {
      const fallbackUsed = fallbackLang !== language

      if (fallbackUsed) {
        console.log(`🔄 Video fallback: ${language} → ${fallbackLang}`)
      }

      return {
        url: content.videoUrls[fallbackLang],
        resolvedLanguage: fallbackLang,
        fallbackUsed,
      }
    }
  }

  // Last resort: return first available video
  const firstAvailableUrl = Object.values(content.videoUrls)[0] || null
  const firstAvailableLanguage = Object.keys(content.videoUrls)[0] || language

  if (firstAvailableUrl) {
    console.warn(`⚠️ Using first available video (${firstAvailableLanguage}) for language ${language}`)
  }

  return {
    url: firstAvailableUrl,
    resolvedLanguage: firstAvailableLanguage,
    fallbackUsed: true,
  }
}

/**
 * Validate if content has playable video URLs
 */
export const hasPlayableVideo = (content: {
  videoUrls?: { [key: string]: string }
  videoUrl?: string
  videoQualityUrls?: { [language: string]: { [quality: string]: string } }
}): boolean => {
  // Check legacy videoUrl
  if (content.videoUrl && typeof content.videoUrl === "string" && content.videoUrl.trim() !== "") {
    return true
  }

  // Check videoUrls object
  if (content.videoUrls && typeof content.videoUrls === "object") {
    const validUrls = Object.values(content.videoUrls).filter((url) => typeof url === "string" && url.trim() !== "")
    if (validUrls.length > 0) {
      return true
    }
  }

  // Check videoQualityUrls object
  if (content.videoQualityUrls && typeof content.videoQualityUrls === "object") {
    for (const language in content.videoQualityUrls) {
      const qualityUrls = content.videoQualityUrls[language]
      if (qualityUrls && typeof qualityUrls === "object") {
        const validQualityUrls = Object.values(qualityUrls).filter(
          (url) => typeof url === "string" && url.trim() !== "",
        )
        if (validQualityUrls.length > 0) {
          return true
        }
      }
    }
  }

  return false
}

/**
 * Get available languages for content
 */
export const getContentLanguages = (content: {
  videoUrls?: { [key: string]: string }
  videoQualityUrls?: { [language: string]: { [quality: string]: string } }
  availableLanguages?: string[]
}): string[] => {
  // Use explicit availableLanguages if provided
  if (content.availableLanguages && Array.isArray(content.availableLanguages)) {
    return content.availableLanguages
  }

  // Extract from videoQualityUrls first (primary source)
  if (content.videoQualityUrls && typeof content.videoQualityUrls === "object") {
    const qualityLanguages = Object.keys(content.videoQualityUrls).filter((lang) => {
      const qualityUrls = content.videoQualityUrls![lang]
      return qualityUrls && typeof qualityUrls === "object" && Object.keys(qualityUrls).length > 0
    })
    if (qualityLanguages.length > 0) {
      return qualityLanguages
    }
  }

  // Fallback to videoUrls keys (legacy support)
  if (content.videoUrls && typeof content.videoUrls === "object") {
    return Object.keys(content.videoUrls)
  }

  return []
}

/**
 * UPDATED: Check if content has video available in specific language
 * No special handling for "default" - treat it as any other language
 */
export const hasVideoInLanguage = (
  content: {
    videoUrls?: { [key: string]: string }
    videoQualityUrls?: { [language: string]: { [quality: string]: string } }
    videoUrl?: string
    availableLanguages?: string[]
  },
  language: string,
): boolean => {
  // Check videoQualityUrls first (new format)
  if (content.videoQualityUrls && typeof content.videoQualityUrls === "object") {
    const languageUrls = content.videoQualityUrls[language]
    if (languageUrls && typeof languageUrls === "object") {
      const validUrls = Object.values(languageUrls).filter((url) => typeof url === "string" && url.trim() !== "")
      if (validUrls.length > 0) {
        return true
      }
    }
  }

  // Check legacy videoUrls format
  if (content.videoUrls && typeof content.videoUrls === "object") {
    const videoUrl = content.videoUrls[language]
    if (typeof videoUrl === "string" && videoUrl.trim() !== "") {
      return true
    }
  }

  // Check availableLanguages array
  if (content.availableLanguages && Array.isArray(content.availableLanguages)) {
    return content.availableLanguages.includes(language)
  }

  // Fallback: if it's a single videoUrl and no language restrictions
  if (content.videoUrl && typeof content.videoUrl === "string" && content.videoUrl.trim() !== "") {
    return true
  }

  return false
}

/**
 * Enhanced content validation with language-specific checking
 */
export const validateContentForPlayback = (
  content: any,
  language?: string,
): {
  isValid: boolean
  hasVideo: boolean
  availableLanguages: string[]
  issues: string[]
  hasVideoInLanguage?: boolean
} => {
  const issues: string[] = []

  if (!content) {
    issues.push("Content is null or undefined")
    return { isValid: false, hasVideo: false, availableLanguages: [], issues }
  }

  if (!content.id || typeof content.id !== "string") {
    issues.push("Missing or invalid content ID")
  }

  if (!content.title) {
    issues.push("Missing content title")
  }

  const hasVideo = hasPlayableVideo(content)
  if (!hasVideo) {
    issues.push("No playable video URLs found")
  }

  const availableLanguages = getContentLanguages(content)
  if (availableLanguages.length === 0) {
    issues.push("No available languages detected")
  }

  // Check language-specific video availability
  let hasVideoInRequestedLanguage = false
  if (language && hasVideo) {
    hasVideoInRequestedLanguage = hasVideoInLanguage(content, language)
    if (!hasVideoInRequestedLanguage) {
      issues.push(`No video available in ${language} language`)
    }
  }

  return {
    isValid: issues.length === 0,
    hasVideo,
    availableLanguages,
    issues,
    hasVideoInLanguage: language ? hasVideoInRequestedLanguage : undefined,
  }
}

/**
 * Log video resolution for debugging
 */
export const logVideoResolution = (
  content: any,
  language: string,
  resolution: { url: string | null; resolvedLanguage: string; fallbackUsed: boolean },
  context: string,
) => {
  console.log(`🎬 Video resolution [${context}]:`, {
    contentId: content.id,
    requestedLanguage: language,
    resolvedLanguage: resolution.resolvedLanguage,
    fallbackUsed: resolution.fallbackUsed,
    hasUrl: !!resolution.url,
    availableLanguages: getContentLanguages(content),
  })
}

// NEW: Enhanced quality validation functions for device-aware recommendations

/**
 * Get lowest available quality
 */
export const getLowestQuality = (availableQualities: string[]): string => {
  const qualityPriority = ["480p", "720p", "1080p", "4K"]
  for (const quality of qualityPriority) {
    if (availableQualities.includes(quality)) {
      return quality
    }
  }
  return availableQualities[0] || "480p"
}

/**
 * Get recommended quality - always return 480p
 */
export const getRecommendedQuality = (availableQualities: string[]): string => {
  return availableQualities.includes("480p") ? "480p" : availableQualities[0] || "480p"
}

/**
 * Get performance hint for quality selection - simplified
 */
export const getPerformanceHint = (quality: string): string | null => {
  return null
}

/**
 * Validate if a quality is suitable - simplified
 */
export const validateQualityForDevice = (
  quality: string,
): { canPlay: boolean; hasWarning: boolean; warning?: string } => {
  return { canPlay: true, hasWarning: false }
}

/**
 * Filter qualities - simplified (no filtering)
 */
export const filterQualitiesForDevice = (qualities: string[]): string[] => {
  return qualities
}

/**
 * Get localized text with fallback
 */
export const getLocalizedText = (
  textObj: { [key: string]: string },
  language: string,
  fallbackLanguage: string = "default"
): string => {
  if (textObj[language]) {
    return textObj[language];
  }
  if (textObj[fallbackLanguage]) {
    return textObj[fallbackLanguage];
  }
  // Return the first available language if no specific match is found
  const availableLanguages = Object.keys(textObj);
  if (availableLanguages.length > 0) {
    return textObj[availableLanguages[0]];
  }
  return ""; // Return empty string if no text is available
};

