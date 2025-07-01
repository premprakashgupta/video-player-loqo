// Simplified HLS management - basic implementation without device detection
// Provides standard HLS configuration for all devices

import Hls from "hls.js"

export interface AdaptiveHLSCallbacks {
  onError: (hls: Hls, data: any) => void
  onQualityChange?: (level: number) => void
  onBufferUpdate?: (bufferInfo: any) => void
}

export interface AdaptiveHLSOptions {
  enablePerformanceMonitoring?: boolean
  enableAutoQualityAdjustment?: boolean
  enableDeviceOptimization?: boolean
}

// Simplified HLS manager without device detection
export class AdaptiveHLSManager {
  private hls: Hls | null = null
  private callbacks: AdaptiveHLSCallbacks
  private currentQuality = "480p"
  private isDestroyed = false

  constructor(callbacks: AdaptiveHLSCallbacks, options: AdaptiveHLSOptions = {}) {
    this.callbacks = callbacks
  }

  public loadSource(url: string, video: HTMLVideoElement): void {
    try {
      if (this.isDestroyed) {
        console.warn("Cannot load source on destroyed HLS manager")
        return
      }

      this.destroy()
      this.hls = this.createHLSInstance()

      if (!this.hls) {
        console.error("Failed to create HLS instance")
        return
      }

      this.setupEventListeners()
      this.hls.loadSource(url)
      this.hls.attachMedia(video)

      console.log("✅ HLS loaded:", { url })
    } catch (error) {
      console.error("Failed to load HLS source:", error)
      this.callbacks.onError?.(this.hls!, { type: "LOAD_ERROR", details: error })
    }
  }

  public changeQuality(quality: string): void {
    try {
      if (!this.hls || this.isDestroyed) {
        console.warn("Cannot change quality: HLS not initialized")
        return
      }

      this.currentQuality = quality
      console.log("Quality change requested:", quality)
    } catch (error) {
      console.error("Failed to change quality:", error)
    }
  }

  public getCurrentQuality(): string {
    return this.currentQuality
  }

  public getPerformanceMetrics() {
    return null
  }

  public getPerformanceRecommendation() {
    return null
  }

  public destroy(): void {
    try {
      this.isDestroyed = true

      if (this.hls) {
        this.hls.destroy()
        this.hls = null
      }

      console.log("HLS manager destroyed")
    } catch (error) {
      console.error("Error destroying HLS manager:", error)
    }
  }

  private createHLSInstance(): Hls | null {
    try {
      if (!Hls.isSupported()) {
        console.warn("HLS not supported")
        return null
      }

      const config = this.buildHLSConfig()
      console.log("Creating HLS with standard config")
      return new Hls(config)
    } catch (error) {
      console.error("Failed to create HLS instance:", error)
      return null
    }
  }

  private buildHLSConfig(): any {
    try {
      return {
        enableWorker: true,
        lowLatencyMode: false,
        progressive: true,
        maxBufferLength: 15,
        maxMaxBufferLength: 60,
        backBufferLength: 30,
        maxBufferSize: 30 * 1000 * 1000,
        maxBufferHole: 0.5,
        highBufferWatchdogPeriod: 3,
        nudgeMaxRetry: 3,
        nudgeOffset: 0.1,
        startFragPrefetch: true,
        testBandwidth: false,
        fragLoadingTimeOut: 20000,
        fragLoadingMaxRetry: 3,
        fragLoadingRetryDelay: 1000,
        manifestLoadingTimeOut: 10000,
        manifestLoadingMaxRetry: 3,
        manifestLoadingRetryDelay: 1000,
        startLevel: -1,
        capLevelToPlayerSize: true,
        xhrSetup: (xhr: XMLHttpRequest) => {
          xhr.withCredentials = false
          xhr.timeout = 30000
        },
      }
    } catch (error) {
      console.error("Failed to build HLS config:", error)
      return {
        enableWorker: true,
        lowLatencyMode: false,
        progressive: true,
        maxBufferLength: 15,
        maxMaxBufferLength: 60,
      }
    }
  }

  private setupEventListeners(): void {
    if (!this.hls) return

    try {
      this.hls.on(Hls.Events.MANIFEST_LOADED, () => {
        console.log("✅ HLS Manifest loaded")
      })

      this.hls.on(Hls.Events.MANIFEST_PARSED, () => {
        console.log("✅ HLS Manifest parsed")
      })

      this.hls.on(Hls.Events.LEVEL_SWITCHED, (event, data) => {
        console.log("🔄 HLS Level switched to:", data.level)
        this.callbacks.onQualityChange?.(data.level)
      })

      this.hls.on(Hls.Events.BUFFER_APPENDED, (event, data) => {
        this.callbacks.onBufferUpdate?.(data)
      })

      this.hls.on(Hls.Events.ERROR, (event, data) => {
        console.error("HLS Error:", data)

        if (data.details === "bufferStalledError") {
          console.log("🔄 Handling buffer stall error...")
          this.handleBufferStallError(data)
        } else if (data.fatal) {
          console.error("💥 Fatal HLS error:", data)
          this.callbacks.onError(this.hls!, data)
        } else {
          console.warn("⚠️ Non-fatal HLS error:", data)
        }
      })

      this.hls.on(Hls.Events.FRAG_LOADED, (event, data) => {
        console.log("✅ Fragment loaded:", data.frag.url.split("/").pop())
      })

      this.hls.on(Hls.Events.BUFFER_STALLED, (event, data) => {
        console.warn("⚠️ Buffer stalled, attempting recovery...")
        this.handleBufferStallError(data)
      })
    } catch (error) {
      console.error("Failed to setup HLS event listeners:", error)
    }
  }

  private handleBufferStallError(data: any): void {
    try {
      if (!this.hls) return

      console.log("🔧 Attempting buffer stall recovery...")

      const video = this.hls.media
      if (video && !video.paused) {
        const currentTime = video.currentTime
        const buffered = video.buffered

        for (let i = 0; i < buffered.length; i++) {
          if (buffered.start(i) > currentTime) {
            const seekTime = buffered.start(i) + 0.1
            console.log(`🎯 Seeking to buffered content at ${seekTime}s`)
            video.currentTime = seekTime
            return
          }
        }

        video.currentTime = currentTime + 0.1
        console.log(`🎯 Seeking forward to ${currentTime + 0.1}s`)
      }

      setTimeout(() => {
        if (this.hls && this.hls.media && this.hls.media.paused) {
          console.log("🔄 Forcing HLS recovery...")
          this.hls.recoverMediaError()
        }
      }, 1000)
    } catch (error) {
      console.error("Error handling buffer stall:", error)
    }
  }
}

// Factory function for creating HLS instances
export const createAdaptiveHLSInstance = (
  callbacks: AdaptiveHLSCallbacks,
  options?: AdaptiveHLSOptions,
): AdaptiveHLSManager => {
  try {
    return new AdaptiveHLSManager(callbacks, options)
  } catch (error) {
    console.error("Failed to create HLS instance:", error)
    throw error
  }
}

// Utility function to check if HLS should be used
export const shouldUseAdaptiveHLS = (): boolean => {
  try {
    const enableAdaptiveHLS =
      process.env.NODE_ENV === "development" || process.env.NEXT_PUBLIC_ENABLE_ADAPTIVE_HLS === "true"

    return enableAdaptiveHLS && Hls.isSupported()
  } catch (error) {
    console.warn("Error checking HLS availability:", error)
    return false
  }
}
