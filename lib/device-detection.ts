// Simplified device detection - minimal implementation
// Provides basic fallbacks without complex browser API detection

export interface DeviceCapabilities {
  tier: "medium" // Always medium tier for simplicity
  maxRecommendedQuality: "480p" // Always start with 480p
  isLowMemory: false // Conservative default
  platform: "desktop" | "mobile" | "tablet"
}

export interface HLSConfigProfile {
  maxBufferLength: number
  maxMaxBufferLength: number
  backBufferLength: number
  maxBufferSize: number
  fragLoadingMaxRetry: number
  fragLoadingRetryDelay: number
  fragLoadingMaxRetryTimeout: number
  enableWorker: boolean
  testBandwidth: boolean
  startFragPrefetch: boolean
  startLevel: number
  capLevelToPlayerSize: boolean
  abrBandWidthFactor: number
  highBufferWatchdogPeriod: number
  maxBufferHole: number
  nudgeMaxRetry: number
  lowLatencyMode: boolean
  progressive: boolean
}

// Simple platform detection that works server-side
const getSimplePlatform = (): "desktop" | "mobile" | "tablet" => {
  if (typeof navigator === "undefined") return "desktop" // Server-side default

  const userAgent = navigator.userAgent.toLowerCase()

  if (/ipad|android(?!.*mobile)|tablet/.test(userAgent)) {
    return "tablet"
  }

  if (/mobile|iphone|ipod|android.*mobile/.test(userAgent)) {
    return "mobile"
  }

  return "desktop"
}

// Simplified device capabilities - no complex detection
export const getDefaultCapabilities = (): DeviceCapabilities => {
  return {
    tier: "medium",
    maxRecommendedQuality: "480p",
    isLowMemory: false,
    platform: typeof window !== "undefined" ? getSimplePlatform() : "desktop",
  }
}

// Single HLS configuration that works for all devices
export const getHLSConfigProfile = (): HLSConfigProfile => {
  return {
    enableWorker: true,
    lowLatencyMode: false,
    progressive: true,
    maxBufferLength: 15,
    maxMaxBufferLength: 60,
    backBufferLength: 30,
    maxBufferSize: 30 * 1000 * 1000, // 30MB
    fragLoadingMaxRetry: 3,
    fragLoadingRetryDelay: 1000,
    fragLoadingMaxRetryTimeout: 20000,
    testBandwidth: false,
    startFragPrefetch: true,
    startLevel: -1,
    capLevelToPlayerSize: true,
    abrBandWidthFactor: 0.95,
    highBufferWatchdogPeriod: 3,
    maxBufferHole: 0.5,
    nudgeMaxRetry: 3,
  }
}

// Simplified performance hint - always return null
export const getPerformanceHint = (quality: string, capabilities?: DeviceCapabilities): string | null => {
  return null
}

// Simplified quality validation - always allow playback
export const validateQualityForDevice = (
  quality: string,
  capabilities?: DeviceCapabilities,
): { canPlay: boolean; hasWarning: boolean; warning?: string } => {
  return { canPlay: true, hasWarning: false }
}
