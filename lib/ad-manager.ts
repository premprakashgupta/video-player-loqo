// Google Ad Manager integration with IMA SDK
declare global {
  interface Window {
    google: {
      ima: {
        AdDisplayContainer: any
        AdsLoader: any
        AdsManagerLoadedEvent: any
        AdsManager: any
        AdEvent: any
        AdErrorEvent: any
        ViewMode: any
        VideoAdUiElements: any
        UiElements: any
        settings: {
          setVpaidMode: (mode: any) => void
          setDisableCustomPlaybackForIOS10Plus: (disable: boolean) => void
        }
        VERSION: string
      }
    }
  }
}

export interface AdBreak {
  id: string
  timeOffset: number // in seconds
  adTagUrl: string
  type: "preroll" | "midroll" | "postroll"
  duration?: number
  skipOffset?: number
  mandatory?: boolean
}

export interface AdConfig {
  adBreaks: AdBreak[]
  adTagUrl?: string // Default ad tag
  enablePreroll?: boolean
  enableMidroll?: boolean
  enablePostroll?: boolean
  maxAdDuration?: number
  skipOffset?: number
  offset?: number
  locale?: string
  ppid?: string // Publisher Provided Identifier
  targeting?: Record<string, string>
}

export interface AdEventCallbacks {
  onAdLoaded?: (ad: any) => void
  onAdStarted?: (ad: any) => void
  onAdPaused?: (ad: any) => void
  onAdResumed?: (ad: any) => void
  onAdCompleted?: (ad: any) => void
  onAdSkipped?: (ad: any) => void
  onAdError?: (error: any) => void
  onAdBreakReady?: (adBreak: AdBreak) => void
  onAdBreakStarted?: (adBreak: AdBreak) => void
  onAdBreakCompleted?: (adBreak: AdBreak) => void
  onAllAdsCompleted?: () => void
}

export class GoogleAdManager {
  private adsLoader: any = null
  private adsManager: any = null
  private adDisplayContainer: any = null
  private videoElement: HTMLVideoElement | null = null
  private adContainer: HTMLElement | null = null
  private isAdPlaying = false
  private currentAdBreak: AdBreak | null = null
  private adConfig: AdConfig
  private callbacks: AdEventCallbacks
  private isInitialized = false
  private adBreakQueue: AdBreak[] = []
  private watchedAdBreaks = new Set<string>()
  private contentResumeRequested = false

  constructor(config: AdConfig, callbacks: AdEventCallbacks = {}) {
    this.adConfig = config
    this.callbacks = callbacks
  }

  /**
  * Initialize Google IMA SDK
  */
  public async initialize(videoElement: HTMLVideoElement, adContainer: HTMLElement): Promise<void> {
    try {
      console.log("🔁 Initializing Google Ad Manager...")

      this.videoElement = videoElement
      this.adContainer = adContainer

      if (!this.videoElement) {
        console.warn("⚠️ videoElement is null or undefined!")
      }

      if (!this.adContainer) {
        console.warn("⚠️ adContainer is null or undefined!")
      }

      // Load IMA SDK if not already loaded
      if (!window.google?.ima) {
        console.log("🔁 IMA SDK not found, loading...")
        await this.loadIMASDK()
      } else {
        console.log("✅ IMA SDK already loaded")
      }

      // Initialize IMA
      this.setupIMA()

      this.isInitialized = true
      console.log("✅ Google Ad Manager initialized successfully")
    } catch (error) {
      console.error("❌ Failed to initialize Google Ad Manager:", error)
      throw error
    }
  }

  /**
   * Load Google IMA SDK dynamically
   */
  private loadIMASDK(): Promise<void> {
    return new Promise((resolve, reject) => {
      if (window.google?.ima) {
        console.log("⚠️ IMA SDK already present, skipping load")
        resolve()
        return
      }

      const script = document.createElement("script")
      script.src = "https://imasdk.googleapis.com/js/sdkloader/ima3.js"
      script.async = true

      script.onload = () => {
        console.log("✅ IMA SDK loaded successfully")
        resolve()
      }

      script.onerror = () => {
        console.error("❌ Failed to load IMA SDK")
        reject(new Error("Failed to load IMA SDK"))
      }

      document.head.appendChild(script)
      console.log("📦 IMA SDK script appended to document head")
    })
  }

  /**
   * Setup IMA components
   */
  private setupIMA(): void {
    console.log("🔁 Setting up IMA components...")

    if (!window.google?.ima || !this.videoElement || !this.adContainer) {
      console.error("❌ IMA SDK or required elements not available", {
        google: !!window.google,
        ima: !!window.google?.ima,
        videoElement: !!this.videoElement,
        adContainer: !!this.adContainer,
      })
      throw new Error("IMA SDK or required elements not available")
    }

    // Configure IMA settings
    console.log("⚙️ Configuring IMA settings...")
    window.google.ima.settings.setVpaidMode(window.google.ima.ImaSdkSettings.VpaidMode.ENABLED)
    window.google.ima.settings.setDisableCustomPlaybackForIOS10Plus(true)

    // Create ad display container
    console.log("📺 Creating AdDisplayContainer...")
    this.adDisplayContainer = new window.google.ima.AdDisplayContainer(this.adContainer, this.videoElement)

    // Create ads loader
    console.log("📦 Creating AdsLoader...")
    this.adsLoader = new window.google.ima.AdsLoader(this.adDisplayContainer)

    // Add event listeners
    console.log("🧷 Adding IMA event listeners...")
    this.adsLoader.addEventListener(
      window.google.ima.AdsManagerLoadedEvent.Type.ADS_MANAGER_LOADED,
      (event) => {
        console.log("📥 [IMA] ADS_MANAGER_LOADED event received", event)
        this.onAdsManagerLoaded(event)
      },
      false,
    )

    this.adsLoader.addEventListener(
      window.google.ima.AdErrorEvent.Type.AD_ERROR,
      (event) => {
        console.error("❌ [IMA] AD_ERROR event received", event)
        this.onAdError(event)
      },
      false,
    )

    console.log("✅ IMA components setup complete")
  }


  /**
   * Schedule ad breaks based on video duration and configuration
   */
  public scheduleAdBreaks(videoDuration: number): AdBreak[] {
    console.log("Schedule Ad Breaks Called");

    const scheduledBreaks: AdBreak[] = []

    // Add configured ad breaks
    this.adConfig.adBreaks.forEach((adBreak) => {
      // Validate time offset
      if (adBreak.timeOffset <= videoDuration) {
        scheduledBreaks.push(adBreak)
      }
    })

    if (this.adConfig.enableMidroll && videoDuration > 120) { // Lowered from 300 to 120 (2 minutes)
      const midrollInterval = Math.max(120, videoDuration / 4) // Every 2 minutes or quarter of video
      const midrollCount = Math.floor(videoDuration / midrollInterval)

      for (let i = 1; i <= midrollCount; i++) {
        const timeOffset = midrollInterval * i
        if (timeOffset < videoDuration - 30) { // Don't place too close to end
          scheduledBreaks.push({
            id: `auto-midroll-${i}`,
            timeOffset,
            adTagUrl: this.adConfig.adTagUrl || this.getDefaultAdTag(),
            type: "midroll",
            mandatory: false,
          })
        }
      }
    }
    // Add preroll if enabled
    if (this.adConfig.enablePreroll) {
      scheduledBreaks.unshift({
        id: "preroll",
        timeOffset: 0,
        adTagUrl: this.adConfig.adTagUrl || this.getDefaultAdTag(),
        type: "preroll",
        mandatory: true,
      })
    }

    // Add postroll if enabled
    if (this.adConfig.enablePostroll) {
      scheduledBreaks.push({
        id: "postroll",
        timeOffset: videoDuration,
        adTagUrl: this.adConfig.adTagUrl || this.getDefaultAdTag(),
        type: "postroll",
        mandatory: false,
      })
    }

    // Sort by time offset
    scheduledBreaks.sort((a, b) => a.timeOffset - b.timeOffset)

    this.adBreakQueue = scheduledBreaks
    console.log("📅 Scheduled ad breaks:", scheduledBreaks)

    return scheduledBreaks
  }

  /**
   * Check if an ad should play at current time
   */
  public shouldPlayAd(currentTime: number, tolerance = 1): AdBreak | null {
    console.log("Should Play Ad Called");
    console.log("adBreakQueue:", this.adBreakQueue)
    console.log("watchedAdBreaks:", this.watchedAdBreaks)

    const adBreak = this.adBreakQueue.find(
      (ab) => !this.watchedAdBreaks.has(ab.id) && Math.abs(ab.timeOffset - currentTime) <= tolerance,
    )

    return adBreak || null
  }

  /**
   * Request and play ad
   */
  public async playAd(adBreak: AdBreak): Promise<void> {
    console.log("Play Ad Called");

    if (!this.isInitialized || this.isAdPlaying) {
      console.warn("⚠️ Ad manager not initialized or ad already playing")
      return
    }

    try {
      this.currentAdBreak = adBreak
      this.callbacks.onAdBreakReady?.(adBreak)

      // Initialize ad display container
      this.adDisplayContainer.initialize()

      // Build ad request
      const adsRequest = new window.google.ima.AdsRequest()
      adsRequest.adTagUrl = "https://pubads.g.doubleclick.net/gampad/ads?iu=/21775744923/external/single_ad_samples&sz=640x480&cust_params=sample_ct%3Dlinear&ciu_szs=300x250%2C728x90&gdfp_req=1&output=vast&unviewed_position_start=1&env=vp&correlator="
      adsRequest.linearAdSlotWidth = this.videoElement?.clientWidth || 640
      adsRequest.linearAdSlotHeight = this.videoElement?.clientHeight || 360
      adsRequest.nonLinearAdSlotWidth = this.videoElement?.clientWidth || 640
      adsRequest.nonLinearAdSlotHeight = 150

      // Add targeting parameters
      if (this.adConfig.targeting) {
        const customParams = new URLSearchParams(this.adConfig.targeting).toString()
        adsRequest.setAdWillAutoPlay(true)
        adsRequest.setAdWillPlayMuted(false)
      }

      // Request ads
      this.adsLoader.requestAds(adsRequest)

      console.log("🎬 Requesting ad for break:", adBreak.id)
    } catch (error) {
      console.error("❌ Failed to play ad:", error)
      this.callbacks.onAdError?.(error)
      this.resumeContent()
    }
  }

  /**
   * Build ad tag URL with targeting parameters
   */
  private buildAdTagUrl(adBreak: AdBreak): string {
    const baseUrl = "https://pubads.g.doubleclick.net/gampad/ads?iu=/21775744923/external/single_preroll_skippable&sz=640x480&ciu_szs=300x250%2C728x90&gdfp_req=1&output=vast&unviewed_position_start=1&env=vp&correlator="
    const params = new URLSearchParams()

    // Add basic parameters
    params.set("sz", `${this.videoElement?.clientWidth || 640}x${this.videoElement?.clientHeight || 360}`)
    params.set("iu", "/your-network-code/your-ad-unit") // Replace with your ad unit
    params.set("impl", "s")
    params.set("gdfp_req", "1")
    params.set("env", "vp")
    params.set("output", "vast")
    params.set("unviewed_position_start", "1")

    // Add custom targeting
    if (this.adConfig.targeting) {
      Object.entries(this.adConfig.targeting).forEach(([key, value]) => {
        params.set(`cust_params`, `${key}%3D${encodeURIComponent(value)}`)
      })
    }

    // Add ad break specific targeting
    params.set("ad_type", adBreak.type)
    params.set("ad_break_id", adBreak.id)

    // Add PPID if available
    if (this.adConfig.ppid) {
      params.set("ppid", this.adConfig.ppid)
    }

    // Add timestamp for cache busting
    params.set("correlator", Date.now().toString())

    return baseUrl.includes("?") ? `${baseUrl}&${params.toString()}` : `${baseUrl}?${params.toString()}`
  }

  /**
   * Handle ads manager loaded event
   */
  private onAdsManagerLoaded(adsManagerLoadedEvent: any): void {
    try {
      const adsRenderingSettings = new window.google.ima.AdsRenderingSettings()
      adsRenderingSettings.restoreCustomPlaybackStateOnAdBreakComplete = true
      adsRenderingSettings.enablePreloading = true

      // Get the ads manager
      this.adsManager = adsManagerLoadedEvent.getAdsManager(this.videoElement, adsRenderingSettings)

      // Add ads manager event listeners
      this.setupAdsManagerEventListeners()

      // Initialize ads manager
      this.adsManager.init(
        this.videoElement?.clientWidth || 640,
        this.videoElement?.clientHeight || 360,
        window.google.ima.ViewMode.NORMAL,
      )

      console.log("✅ Ads manager loaded and initialized")
    } catch (error) {
      console.error("❌ Error in onAdsManagerLoaded:", error)
      this.callbacks.onAdError?.(error)
      this.resumeContent()
    }
  }

  /**
   * Setup ads manager event listeners
   */
  private setupAdsManagerEventListeners(): void {
    if (!this.adsManager) return

    // Ad events
    this.adsManager.addEventListener(window.google.ima.AdEvent.Type.LOADED, this.onAdLoaded.bind(this))

    this.adsManager.addEventListener(window.google.ima.AdEvent.Type.STARTED, this.onAdStarted.bind(this))

    this.adsManager.addEventListener(window.google.ima.AdEvent.Type.PAUSED, this.onAdPaused.bind(this))

    this.adsManager.addEventListener(window.google.ima.AdEvent.Type.RESUMED, this.onAdResumed.bind(this))

    this.adsManager.addEventListener(window.google.ima.AdEvent.Type.COMPLETE, this.onAdCompleted.bind(this))

    this.adsManager.addEventListener(window.google.ima.AdEvent.Type.SKIPPED, this.onAdSkipped.bind(this))

    this.adsManager.addEventListener(
      window.google.ima.AdEvent.Type.ALL_ADS_COMPLETED,
      this.onAllAdsCompleted.bind(this),
    )

    // Error events
    this.adsManager.addEventListener(window.google.ima.AdErrorEvent.Type.AD_ERROR, this.onAdError.bind(this))
  }

  /**
   * Ad event handlers
   */
  private onAdLoaded(adEvent: any): void {
    const ad = adEvent.getAd()
    console.log("📺 Ad loaded:", ad.getTitle())
    this.callbacks.onAdLoaded?.(ad)

    // Start the ad
    try {
      this.adsManager.start()
    } catch (error) {
      console.error("❌ Error starting ad:", error)
      this.resumeContent()
    }
  }

  private onAdStarted(adEvent: any): void {
    const ad = adEvent.getAd()
    this.isAdPlaying = true

    console.log("▶️ Ad started:", ad.getTitle())
    this.callbacks.onAdStarted?.(ad)
    this.callbacks.onAdBreakStarted?.(this.currentAdBreak!)

    // Pause main video
    if (this.videoElement && !this.videoElement.paused) {
      this.videoElement.pause()
    }
  }

  private onAdPaused(adEvent: any): void {
    const ad = adEvent.getAd()
    console.log("⏸️ Ad paused:", ad.getTitle())
    this.callbacks.onAdPaused?.(ad)
  }

  private onAdResumed(adEvent: any): void {
    const ad = adEvent.getAd()
    console.log("▶️ Ad resumed:", ad.getTitle())
    this.callbacks.onAdResumed?.(ad)
  }

  private onAdCompleted(adEvent: any): void {
    const ad = adEvent.getAd()
    console.log("✅ Ad completed:", ad.getTitle())
    this.callbacks.onAdCompleted?.(ad)
  }

  private onAdSkipped(adEvent: any): void {
    const ad = adEvent.getAd()
    console.log("⏭️ Ad skipped:", ad.getTitle())
    this.callbacks.onAdSkipped?.(ad)
  }

  private onAllAdsCompleted(): void {
    console.log("✅ All ads in break completed")
    this.isAdPlaying = false

    if (this.currentAdBreak) {
      this.watchedAdBreaks.add(this.currentAdBreak.id)
      this.callbacks.onAdBreakCompleted?.(this.currentAdBreak)
      this.currentAdBreak = null
    }

    this.callbacks.onAllAdsCompleted?.()
    this.resumeContent()
  }

  private onAdError(adErrorEvent: any): void {
    const error = adErrorEvent.getError()
    console.error("❌ Ad error:", error.getMessage())
    this.callbacks.onAdError?.(error)

    this.isAdPlaying = false
    this.resumeContent()
  }

  /**
   * Resume main video content
   */
  private resumeContent(): void {
    if (this.contentResumeRequested) return

    this.contentResumeRequested = true

    setTimeout(() => {
      if (this.videoElement && this.videoElement.paused) {
        this.videoElement.play().catch(console.error)
      }
      this.contentResumeRequested = false
    }, 100)
  }

  /**
   * Pause ad playback
   */
  public pauseAd(): void {
    if (this.adsManager && this.isAdPlaying) {
      this.adsManager.pause()
    }
  }

  /**
   * Resume ad playback
   */
  public resumeAd(): void {
    if (this.adsManager && this.isAdPlaying) {
      this.adsManager.resume()
    }
  }

  /**
   * Skip current ad (if skippable)
   */
  public skipAd(): void {
    if (this.adsManager && this.isAdPlaying) {
      this.adsManager.skip()
    }
  }

  /**
   * Get default ad tag URL
   */
  private getDefaultAdTag(): string {
    return "https://pubads.g.doubleclick.net/gampad/ads?iu=/21775744923/external/single_ad_samples&sz=640x480&cust_params=sample_ct%3Dlinear&ciu_szs=300x250%2C728x90&gdfp_req=1&output=vast&unviewed_position_start=1&env=vp&impl=s&correlator="
  }

  /**
   * Update ad targeting
   */
  public updateTargeting(targeting: Record<string, string>): void {
    this.adConfig.targeting = { ...this.adConfig.targeting, ...targeting }
  }

  /**
   * Check if ad is currently playing
   */
  public isPlayingAd(): boolean {
    return this.isAdPlaying
  }

  /**
   * Get current ad break
   */
  public getCurrentAdBreak(): AdBreak | null {
    return this.currentAdBreak
  }

  /**
   * Destroy ad manager and clean up resources
   */
  public destroy(): void {
    try {
      if (this.adsManager) {
        this.adsManager.destroy()
        this.adsManager = null
      }

      if (this.adsLoader) {
        this.adsLoader.destroy()
        this.adsLoader = null
      }

      this.adDisplayContainer = null
      this.videoElement = null
      this.adContainer = null
      this.isAdPlaying = false
      this.currentAdBreak = null
      this.adBreakQueue = []
      this.watchedAdBreaks.clear()
      this.isInitialized = false

      console.log("🧹 Ad manager destroyed")
    } catch (error) {
      console.error("❌ Error destroying ad manager:", error)
    }
  }
}

/**
 * Utility functions for ad management
 */
export const AdUtils = {
  /**
   * Generate PPID from user data
   */
  generatePPID(userId?: string): string {
    if (userId) {
      return btoa(userId).substring(0, 32)
    }
    return Math.random().toString(36).substring(2, 15)
  },

  /**
   * Build targeting parameters from content metadata
   */
  buildTargeting(content: any, user?: any): Record<string, string> {
    const targeting: Record<string, string> = {}

    // Content targeting
    if (content.genre) targeting.genre = content.genre
    if (content.language) targeting.language = content.language
    if (content.series) targeting.series = content.series
    if (content.episodeNumber) targeting.episode = content.episodeNumber.toString()

    // User targeting (if available)
    if (user?.age) targeting.age = user.age.toString()
    if (user?.gender) targeting.gender = user.gender
    if (user?.location) targeting.location = user.location

    // Device targeting
    targeting.device_type = window.innerWidth < 768 ? "mobile" : "desktop"
    targeting.platform = navigator.platform

    return targeting
  },

  /**
   * Calculate optimal ad break positions
   */
  calculateAdBreakPositions(
    videoDuration: number,
    options: {
      minInterval?: number
      maxAds?: number
      avoidLastMinutes?: number
    } = {},
  ): number[] {
    const {
      minInterval = 300, // 5 minutes
      maxAds = 4,
      avoidLastMinutes = 2,
    } = options

    const positions: number[] = []
    const availableDuration = videoDuration - avoidLastMinutes * 60

    if (availableDuration <= minInterval) {
      return positions // Video too short for mid-roll ads
    }

    const adCount = Math.min(Math.floor(availableDuration / minInterval), maxAds)

    const interval = availableDuration / (adCount + 1)

    for (let i = 1; i <= adCount; i++) {
      positions.push(Math.round(interval * i))
    }

    return positions
  },
}
