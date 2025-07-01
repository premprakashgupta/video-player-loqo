// HLS configuration utility for backward compatibility
// Provides safe configuration options that work across all devices

export interface HLSConfig {
  enableWorker: boolean
  lowLatencyMode: boolean
  progressive: boolean
  maxBufferLength: number
  maxMaxBufferLength: number
  backBufferLength: number
  maxBufferSize: number
  maxBufferHole: number
  highBufferWatchdogPeriod: number
  nudgeMaxRetry: number
  nudgeOffset: number
  startFragPrefetch: boolean
  testBandwidth: boolean
  fragLoadingTimeOut: number
  fragLoadingMaxRetry: number
  fragLoadingRetryDelay: number
  manifestLoadingTimeOut: number
  manifestLoadingMaxRetry: number
  manifestLoadingRetryDelay: number
  xhrSetup: (xhr: XMLHttpRequest) => void
}

/**
 * Get the base HLS configuration that maintains existing behavior
 * This is the proven configuration that works reliably
 */
export const getBaseHLSConfig = (): HLSConfig => {
  return {
    // Core settings that have been proven to work
    enableWorker: true,
    lowLatencyMode: false,
    progressive: true,

    // Enhanced buffer management to prevent stalls
    maxBufferLength: 30, // Increased from 15
    maxMaxBufferLength: 120, // Increased from 60
    backBufferLength: 60, // Increased from 30
    maxBufferSize: 60 * 1000 * 1000, // Increased to 60MB
    maxBufferHole: 0.3, // Reduced from 0.5
    highBufferWatchdogPeriod: 2, // Reduced from 3

    // Enhanced retry settings
    nudgeMaxRetry: 5, // Increased from 3
    nudgeOffset: 0.1,

    // Fragment settings with better reliability
    startFragPrefetch: true,
    testBandwidth: true, // Changed to true
    fragLoadingTimeOut: 30000, // Increased to 30 seconds
    fragLoadingMaxRetry: 6, // Increased from 3
    fragLoadingRetryDelay: 500, // Reduced from 1000

    // Manifest settings
    manifestLoadingTimeOut: 15000, // Increased to 15 seconds
    manifestLoadingMaxRetry: 5, // Increased from 3
    manifestLoadingRetryDelay: 500, // Reduced from 1000

    // CORS settings with timeout
    xhrSetup: (xhr: XMLHttpRequest) => {
      xhr.withCredentials = false
      xhr.timeout = 30000 // 30 second timeout
    },
  }
}

/**
 * Get enhanced HLS configuration for premium devices
 * Only used when adaptive HLS is enabled and device is capable
 */
export const getPremiumHLSConfig = (): HLSConfig => {
  const baseConfig = getBaseHLSConfig()

  return {
    ...baseConfig,
    // Enhanced settings for premium devices
    maxBufferLength: 30,
    maxMaxBufferLength: 120,
    backBufferLength: 60,
    maxBufferSize: 100 * 1000 * 1000, // 100MB
    testBandwidth: true,
    fragLoadingMaxRetry: 5,
    highBufferWatchdogPeriod: 2,
  }
}

/**
 * Get optimized HLS configuration for low-end devices
 * Reduces memory usage and processing overhead
 */
export const getLowEndHLSConfig = (): HLSConfig => {
  const baseConfig = getBaseHLSConfig()

  return {
    ...baseConfig,
    // Optimized settings for low-end devices
    enableWorker: false, // Disable workers to reduce overhead
    maxBufferLength: 8,
    maxMaxBufferLength: 30,
    backBufferLength: 15,
    maxBufferSize: 15 * 1000 * 1000, // 15MB
    startFragPrefetch: false,
    fragLoadingMaxRetry: 2,
    highBufferWatchdogPeriod: 5,
  }
}

/**
 * Validate HLS configuration for safety
 * Ensures all values are within safe ranges
 */
export const validateHLSConfig = (config: Partial<HLSConfig>): HLSConfig => {
  const baseConfig = getBaseHLSConfig()

  return {
    enableWorker: config.enableWorker ?? baseConfig.enableWorker,
    lowLatencyMode: config.lowLatencyMode ?? baseConfig.lowLatencyMode,
    progressive: config.progressive ?? baseConfig.progressive,

    // Ensure buffer values are within safe ranges
    maxBufferLength: Math.max(5, Math.min(60, config.maxBufferLength ?? baseConfig.maxBufferLength)),
    maxMaxBufferLength: Math.max(30, Math.min(300, config.maxMaxBufferLength ?? baseConfig.maxMaxBufferLength)),
    backBufferLength: Math.max(10, Math.min(120, config.backBufferLength ?? baseConfig.backBufferLength)),
    maxBufferSize: Math.max(
      10 * 1000 * 1000,
      Math.min(200 * 1000 * 1000, config.maxBufferSize ?? baseConfig.maxBufferSize),
    ),

    // Ensure other values are safe
    maxBufferHole: Math.max(0.1, Math.min(2, config.maxBufferHole ?? baseConfig.maxBufferHole)),
    highBufferWatchdogPeriod: Math.max(
      1,
      Math.min(10, config.highBufferWatchdogPeriod ?? baseConfig.highBufferWatchdogPeriod),
    ),
    nudgeMaxRetry: Math.max(1, Math.min(10, config.nudgeMaxRetry ?? baseConfig.nudgeMaxRetry)),
    nudgeOffset: Math.max(0.05, Math.min(1, config.nudgeOffset ?? baseConfig.nudgeOffset)),

    startFragPrefetch: config.startFragPrefetch ?? baseConfig.startFragPrefetch,
    testBandwidth: config.testBandwidth ?? baseConfig.testBandwidth,

    // Ensure timeout values are reasonable
    fragLoadingTimeOut: Math.max(5000, Math.min(60000, config.fragLoadingTimeOut ?? baseConfig.fragLoadingTimeOut)),
    fragLoadingMaxRetry: Math.max(1, Math.min(10, config.fragLoadingMaxRetry ?? baseConfig.fragLoadingMaxRetry)),
    fragLoadingRetryDelay: Math.max(
      500,
      Math.min(5000, config.fragLoadingRetryDelay ?? baseConfig.fragLoadingRetryDelay),
    ),
    manifestLoadingTimeOut: Math.max(
      5000,
      Math.min(30000, config.manifestLoadingTimeOut ?? baseConfig.manifestLoadingTimeOut),
    ),
    manifestLoadingMaxRetry: Math.max(
      1,
      Math.min(10, config.manifestLoadingMaxRetry ?? baseConfig.manifestLoadingMaxRetry),
    ),
    manifestLoadingRetryDelay: Math.max(
      500,
      Math.min(5000, config.manifestLoadingRetryDelay ?? baseConfig.manifestLoadingRetryDelay),
    ),

    xhrSetup: config.xhrSetup ?? baseConfig.xhrSetup,
  }
}
