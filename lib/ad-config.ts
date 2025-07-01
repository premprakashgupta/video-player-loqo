// Ad configuration and management for Google Ad Manager

import type { AdConfig } from "@/lib/ad-manager"

/**
 * Default ad configuration
 */
export const DEFAULT_AD_CONFIG: AdConfig = {
  adBreaks: [],
  adTagUrl:
    process.env.NEXT_PUBLIC_GAM_AD_TAG_URL ||
    "https://pubads.g.doubleclick.net/gampad/ads?iu=/21775744923/external/single_preroll_skippable&sz=640x480&ciu_szs=300x250%2C728x90&gdfp_req=1&output=vast&unviewed_position_start=1&env=vp&correlator=",
  enablePreroll: true,
  enableMidroll: true,
  enablePostroll: false,
  maxAdDuration: 30,
  skipOffset: 5,
  locale: "en",
  targeting: {},
}

/**
 * Ad configuration for different content types
 */
export const AD_CONFIGS = {
  // Short content (< 5 minutes)
  short: {
    ...DEFAULT_AD_CONFIG,
    enablePreroll: true,
    enableMidroll: false,
    enablePostroll: false,
    maxAdDuration: 15,
  },

  // Medium content (5-20 minutes)
  medium: {
    ...DEFAULT_AD_CONFIG,
    enablePreroll: true,
    enableMidroll: true,
    enablePostroll: false,
    maxAdDuration: 30,
    adBreaks: [
      {
        id: "midroll-1",
        timeOffset: 300, // 5 minutes
        adTagUrl: DEFAULT_AD_CONFIG.adTagUrl!,
        type: "midroll" as const,
        mandatory: false,
      },
    ],
  },

  // Long content (> 20 minutes)
  long: {
    ...DEFAULT_AD_CONFIG,
    enablePreroll: true,
    enableMidroll: true,
    enablePostroll: true,
    maxAdDuration: 30,
    adBreaks: [
      {
        id: "midroll-1",
        timeOffset: 600, // 10 minutes
        adTagUrl: DEFAULT_AD_CONFIG.adTagUrl!,
        type: "midroll" as const,
        mandatory: false,
      },
      {
        id: "midroll-2",
        timeOffset: 1200, // 20 minutes
        adTagUrl: DEFAULT_AD_CONFIG.adTagUrl!,
        type: "midroll" as const,
        mandatory: false,
      },
    ],
  },

  // Premium content (reduced ads)
  premium: {
    ...DEFAULT_AD_CONFIG,
    enablePreroll: false,
    enableMidroll: true,
    enablePostroll: false,
    maxAdDuration: 15,
    adBreaks: [
      {
        id: "midroll-premium",
        timeOffset: 900, // 15 minutes
        adTagUrl: DEFAULT_AD_CONFIG.adTagUrl!,
        type: "midroll" as const,
        mandatory: false,
      },
    ],
  },
}

/**
 * Get ad configuration based on content metadata
 */
export function getAdConfigForContent(
  duration: number,
  contentType?: "free" | "premium",
  customConfig?: Partial<AdConfig>,
): AdConfig {
  let baseConfig: AdConfig

  // Select base configuration
  if (contentType === "premium") {
    baseConfig = AD_CONFIGS.premium
  } else if (duration < 300) {
    // < 5 minutes
    baseConfig = AD_CONFIGS.short
  } else if (duration < 1200) {
    // < 20 minutes
    baseConfig = AD_CONFIGS.medium
  } else {
    baseConfig = AD_CONFIGS.long
  }

  // Merge with custom configuration
  return {
    ...baseConfig,
    ...customConfig,
    targeting: {
      ...baseConfig.targeting,
      ...customConfig?.targeting,
    },
    adBreaks: customConfig?.adBreaks || baseConfig.adBreaks,
  }
}

/**
 * Build targeting parameters for ads
 */
export function buildAdTargeting(
  contentMetadata: {
    id: string
    title: string
    genre?: string
    language?: string
    series?: string
    episodeNumber?: number
  },
  userMetadata?: {
    id?: string
    age?: number
    gender?: string
    location?: string
    interests?: string[]
  },
): Record<string, string> {
  const targeting: Record<string, string> = {}

  // Content targeting
  if (contentMetadata.genre) targeting.content_genre = contentMetadata.genre
  if (contentMetadata.language) targeting.content_language = contentMetadata.language
  if (contentMetadata.series) targeting.content_series = contentMetadata.series
  if (contentMetadata.episodeNumber) targeting.episode_number = contentMetadata.episodeNumber.toString()

  // User targeting (if available and consented)
  if (userMetadata?.age) targeting.user_age = userMetadata.age.toString()
  if (userMetadata?.gender) targeting.user_gender = userMetadata.gender
  if (userMetadata?.location) targeting.user_location = userMetadata.location
  if (userMetadata?.interests) targeting.user_interests = userMetadata.interests.join(",")

  // Device and context targeting
  targeting.device_type = typeof window !== "undefined" && window.innerWidth < 768 ? "mobile" : "desktop"
  targeting.platform = typeof navigator !== "undefined" ? navigator.platform : "unknown"
  targeting.timestamp = Date.now().toString()

  // Time-based targeting
  const now = new Date()
  targeting.hour_of_day = now.getHours().toString()
  targeting.day_of_week = now.getDay().toString()

  return targeting
}

/**
 * Validate ad configuration
 */
export function validateAdConfig(config: AdConfig): {
  isValid: boolean
  errors: string[]
} {
  const errors: string[] = []

  // Check required fields
  if (!config.adTagUrl && config.adBreaks.length === 0) {
    errors.push("Either adTagUrl or adBreaks must be provided")
  }

  // Validate ad breaks
  config.adBreaks.forEach((adBreak, index) => {
    if (!adBreak.id) {
      errors.push(`Ad break at index ${index} missing id`)
    }
    if (adBreak.timeOffset < 0) {
      errors.push(`Ad break ${adBreak.id} has negative timeOffset`)
    }
    if (!adBreak.adTagUrl && !config.adTagUrl) {
      errors.push(`Ad break ${adBreak.id} missing adTagUrl`)
    }
    if (!["preroll", "midroll", "postroll"].includes(adBreak.type)) {
      errors.push(`Ad break ${adBreak.id} has invalid type: ${adBreak.type}`)
    }
  })

  // Validate skip offset
  if (config.skipOffset && config.skipOffset < 0) {
    errors.push("skipOffset cannot be negative")
  }

  // Validate max ad duration
  if (config.maxAdDuration && config.maxAdDuration < 5) {
    errors.push("maxAdDuration should be at least 5 seconds")
  }

  return {
    isValid: errors.length === 0,
    errors,
  }
}

/**
 * Environment-specific ad configurations
 */
export const ENVIRONMENT_AD_CONFIGS = {
  development: {
    ...DEFAULT_AD_CONFIG,
    adTagUrl:
      "https://pubads.g.doubleclick.net/gampad/ads?iu=/21775744923/external/single_ad_samples&sz=640x480&cust_params=sample_ct%3Dlinear&ciu_szs=300x250%2C728x90&gdfp_req=1&output=vast&unviewed_position_start=1&env=vp&impl=s&correlator=",
    targeting: {
      environment: "dev",
    },
  },

  staging: {
    ...DEFAULT_AD_CONFIG,
    adTagUrl: process.env.NEXT_PUBLIC_GAM_STAGING_AD_TAG_URL || DEFAULT_AD_CONFIG.adTagUrl,
    targeting: {
      environment: "staging",
    },
  },

  production: {
    ...DEFAULT_AD_CONFIG,
    adTagUrl: process.env.NEXT_PUBLIC_GAM_PRODUCTION_AD_TAG_URL || DEFAULT_AD_CONFIG.adTagUrl,
    targeting: {
      environment: "prod",
    },
  },
}

/**
 * Get environment-specific ad configuration
 */
export function getEnvironmentAdConfig(): AdConfig {
  const env = process.env.NODE_ENV || "development"
  return ENVIRONMENT_AD_CONFIGS[env as keyof typeof ENVIRONMENT_AD_CONFIGS] || ENVIRONMENT_AD_CONFIGS.development
}
