// Feature flag management for safe rollout of new features
// Provides centralized control over experimental features

export interface FeatureFlags {
  enableAdaptiveHLS: boolean
  enableDeviceOptimization: boolean
  enablePerformanceHints: boolean
  enableSmartDefaults: boolean
  enablePerformanceMonitoring: boolean
  enableAutoQualityAdjustment: boolean
  enableQualityFiltering: boolean
}

/**
 * Get current feature flags based on environment and user settings
 */
export const getFeatureFlags = (): FeatureFlags => {
  try {
    const isDevelopment = process.env.NODE_ENV === "development"

    return {
      // Adaptive HLS - controlled by environment variable
      enableAdaptiveHLS: isDevelopment || process.env.NEXT_PUBLIC_ENABLE_ADAPTIVE_HLS === "true",

      // Device optimization - safe to enable gradually
      enableDeviceOptimization: isDevelopment || process.env.NEXT_PUBLIC_ENABLE_DEVICE_OPTIMIZATION === "true",

      // Performance hints - UI enhancement only
      enablePerformanceHints: isDevelopment || process.env.NEXT_PUBLIC_ENABLE_PERFORMANCE_HINTS === "true",

      // Smart defaults - changes initial quality selection
      enableSmartDefaults: isDevelopment || process.env.NEXT_PUBLIC_ENABLE_SMART_DEFAULTS === "true",

      // Performance monitoring - data collection only
      enablePerformanceMonitoring: isDevelopment || process.env.NEXT_PUBLIC_ENABLE_PERFORMANCE_MONITORING === "true",

      // Auto quality adjustment - most aggressive feature
      enableAutoQualityAdjustment: isDevelopment && process.env.NEXT_PUBLIC_ENABLE_AUTO_QUALITY === "true",

      // Quality filtering - removes quality options
      enableQualityFiltering: isDevelopment && process.env.NEXT_PUBLIC_ENABLE_QUALITY_FILTERING === "true",
    }
  } catch (error) {
    console.warn("Error reading feature flags:", error)
    return getDefaultFeatureFlags()
  }
}

/**
 * Get safe default feature flags (all disabled)
 */
export const getDefaultFeatureFlags = (): FeatureFlags => {
  return {
    enableAdaptiveHLS: false,
    enableDeviceOptimization: false,
    enablePerformanceHints: false,
    enableSmartDefaults: false,
    enablePerformanceMonitoring: false,
    enableAutoQualityAdjustment: false,
    enableQualityFiltering: false,
  }
}

/**
 * Check if a specific feature is enabled
 */
export const isFeatureEnabled = (feature: keyof FeatureFlags): boolean => {
  try {
    const flags = getFeatureFlags()
    return flags[feature]
  } catch (error) {
    console.warn(`Error checking feature flag ${feature}:`, error)
    return false
  }
}

/**
 * Get feature rollout percentage (for gradual rollouts)
 */
export const getFeatureRolloutPercentage = (feature: keyof FeatureFlags): number => {
  try {
    const envVar = `NEXT_PUBLIC_${feature.toUpperCase()}_ROLLOUT`
    const percentage = process.env[envVar]

    if (percentage) {
      const parsed = Number.parseInt(percentage, 10)
      return Math.max(0, Math.min(100, parsed))
    }

    return isFeatureEnabled(feature) ? 100 : 0
  } catch (error) {
    console.warn(`Error getting rollout percentage for ${feature}:`, error)
    return 0
  }
}

/**
 * Check if user should receive a feature based on rollout percentage
 */
export const shouldReceiveFeature = (feature: keyof FeatureFlags, userId?: string): boolean => {
  try {
    const rolloutPercentage = getFeatureRolloutPercentage(feature)

    if (rolloutPercentage === 0) return false
    if (rolloutPercentage === 100) return true

    // Use deterministic hash of userId for consistent experience
    if (userId) {
      const hash = simpleHash(userId)
      return hash % 100 < rolloutPercentage
    }

    // Fallback to random for anonymous users
    return Math.random() * 100 < rolloutPercentage
  } catch (error) {
    console.warn(`Error determining feature rollout for ${feature}:`, error)
    return false
  }
}

/**
 * Simple hash function for consistent user bucketing
 */
const simpleHash = (str: string): number => {
  let hash = 0
  for (let i = 0; i < str.length; i++) {
    const char = str.charCodeAt(i)
    hash = (hash << 5) - hash + char
    hash = hash & hash // Convert to 32-bit integer
  }
  return Math.abs(hash)
}

/**
 * Log feature flag usage for analytics
 */
export const logFeatureUsage = (feature: keyof FeatureFlags, enabled: boolean): void => {
  try {
    if (process.env.NODE_ENV === "development") {
      console.log(`🚩 Feature ${feature}: ${enabled ? "ENABLED" : "DISABLED"}`)
    }

    // Could send to analytics service here
    // analytics.track('feature_flag_usage', { feature, enabled })
  } catch (error) {
    console.warn(`Error logging feature usage for ${feature}:`, error)
  }
}
