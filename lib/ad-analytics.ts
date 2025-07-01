export interface AdAnalyticsEvent {
  eventType: "ad_request" | "ad_loaded" | "ad_started" | "ad_completed" | "ad_skipped" | "ad_error" | "ad_clicked"
  adBreakId: string
  adBreakType: "preroll" | "midroll" | "postroll"
  adId?: string
  adTitle?: string
  adDuration?: number
  adPosition?: number
  contentId: string
  contentTitle: string
  userId?: string
  sessionId: string
  timestamp: number
  errorMessage?: string
  skipTime?: number
}

export class AdAnalytics {
  private sessionId: string
  private contentId: string
  private contentTitle: string
  private userId?: string
  private events: AdAnalyticsEvent[] = []

  constructor(contentId: string, contentTitle: string, userId?: string) {
    this.contentId = contentId
    this.contentTitle = contentTitle
    this.userId = userId
    this.sessionId = this.generateSessionId()
  }

  /**
   * Track ad request
   */
  public trackAdRequest(adBreakId: string, adBreakType: "preroll" | "midroll" | "postroll"): void {
    const event: AdAnalyticsEvent = {
      eventType: "ad_request",
      adBreakId,
      adBreakType,
      contentId: this.contentId,
      contentTitle: this.contentTitle,
      userId: this.userId,
      sessionId: this.sessionId,
      timestamp: Date.now(),
    }

    this.logEvent(event)
    this.sendToAnalytics(event)
  }

  /**
   * Track ad loaded
   */
  public trackAdLoaded(
    adBreakId: string,
    adBreakType: "preroll" | "midroll" | "postroll",
    adId: string,
    adTitle: string,
    adDuration: number,
  ): void {
    const event: AdAnalyticsEvent = {
      eventType: "ad_loaded",
      adBreakId,
      adBreakType,
      adId,
      adTitle,
      adDuration,
      contentId: this.contentId,
      contentTitle: this.contentTitle,
      userId: this.userId,
      sessionId: this.sessionId,
      timestamp: Date.now(),
    }

    this.logEvent(event)
    this.sendToAnalytics(event)
  }

  /**
   * Track ad started
   */
  public trackAdStarted(
    adBreakId: string,
    adBreakType: "preroll" | "midroll" | "postroll",
    adId: string,
    adTitle: string,
    adDuration: number,
    adPosition: number,
  ): void {
    const event: AdAnalyticsEvent = {
      eventType: "ad_started",
      adBreakId,
      adBreakType,
      adId,
      adTitle,
      adDuration,
      adPosition,
      contentId: this.contentId,
      contentTitle: this.contentTitle,
      userId: this.userId,
      sessionId: this.sessionId,
      timestamp: Date.now(),
    }

    this.logEvent(event)
    this.sendToAnalytics(event)

    // Send to Google Analytics
    if (typeof window !== "undefined" && window.gtag) {
      window.gtag("event", "ad_started", {
        ad_break_type: adBreakType,
        ad_id: adId,
        ad_title: adTitle,
        ad_duration: adDuration,
        content_id: this.contentId,
        content_title: this.contentTitle,
        event_category: "advertising",
        event_label: `${adBreakType}: ${adTitle}`,
      })
    }

    // Send to Meta Pixel
    if (typeof window !== "undefined" && window.fbq) {
      window.fbq("trackCustom", "AdStarted", {
        ad_break_type: adBreakType,
        ad_id: adId,
        ad_title: adTitle,
        content_id: this.contentId,
        content_title: this.contentTitle,
      })
    }
  }

  /**
   * Track ad completed
   */
  public trackAdCompleted(
    adBreakId: string,
    adBreakType: "preroll" | "midroll" | "postroll",
    adId: string,
    adTitle: string,
    adDuration: number,
  ): void {
    const event: AdAnalyticsEvent = {
      eventType: "ad_completed",
      adBreakId,
      adBreakType,
      adId,
      adTitle,
      adDuration,
      contentId: this.contentId,
      contentTitle: this.contentTitle,
      userId: this.userId,
      sessionId: this.sessionId,
      timestamp: Date.now(),
    }

    this.logEvent(event)
    this.sendToAnalytics(event)

    // Send to Google Analytics
    if (typeof window !== "undefined" && window.gtag) {
      window.gtag("event", "ad_completed", {
        ad_break_type: adBreakType,
        ad_id: adId,
        ad_title: adTitle,
        ad_duration: adDuration,
        content_id: this.contentId,
        content_title: this.contentTitle,
        event_category: "advertising",
        event_label: `${adBreakType}: ${adTitle} - Completed`,
      })
    }

    // Send to Meta Pixel
    if (typeof window !== "undefined" && window.fbq) {
      window.fbq("trackCustom", "AdCompleted", {
        ad_break_type: adBreakType,
        ad_id: adId,
        ad_title: adTitle,
        content_id: this.contentId,
        content_title: this.contentTitle,
      })
    }
  }

  /**
   * Track ad skipped
   */
  public trackAdSkipped(
    adBreakId: string,
    adBreakType: "preroll" | "midroll" | "postroll",
    adId: string,
    adTitle: string,
    skipTime: number,
  ): void {
    const event: AdAnalyticsEvent = {
      eventType: "ad_skipped",
      adBreakId,
      adBreakType,
      adId,
      adTitle,
      skipTime,
      contentId: this.contentId,
      contentTitle: this.contentTitle,
      userId: this.userId,
      sessionId: this.sessionId,
      timestamp: Date.now(),
    }

    this.logEvent(event)
    this.sendToAnalytics(event)

    // Send to Google Analytics
    if (typeof window !== "undefined" && window.gtag) {
      window.gtag("event", "ad_skipped", {
        ad_break_type: adBreakType,
        ad_id: adId,
        ad_title: adTitle,
        skip_time: skipTime,
        content_id: this.contentId,
        content_title: this.contentTitle,
        event_category: "advertising",
        event_label: `${adBreakType}: ${adTitle} - Skipped at ${skipTime}s`,
      })
    }

    // Send to Meta Pixel
    if (typeof window !== "undefined" && window.fbq) {
      window.fbq("trackCustom", "AdSkipped", {
        ad_break_type: adBreakType,
        ad_id: adId,
        ad_title: adTitle,
        skip_time: skipTime,
        content_id: this.contentId,
        content_title: this.contentTitle,
      })
    }
  }

  /**
   * Track ad error
   */
  public trackAdError(
    adBreakId: string,
    adBreakType: "preroll" | "midroll" | "postroll",
    errorMessage: string,
    adId?: string,
  ): void {
    const event: AdAnalyticsEvent = {
      eventType: "ad_error",
      adBreakId,
      adBreakType,
      adId,
      errorMessage,
      contentId: this.contentId,
      contentTitle: this.contentTitle,
      userId: this.userId,
      sessionId: this.sessionId,
      timestamp: Date.now(),
    }

    this.logEvent(event)
    this.sendToAnalytics(event)

    // Send to Google Analytics
    if (typeof window !== "undefined" && window.gtag) {
      window.gtag("event", "ad_error", {
        ad_break_type: adBreakType,
        ad_id: adId || "unknown",
        error_message: errorMessage,
        content_id: this.contentId,
        content_title: this.contentTitle,
        event_category: "advertising",
        event_label: `${adBreakType}: ${errorMessage}`,
      })
    }

    // Send to Meta Pixel
    if (typeof window !== "undefined" && window.fbq) {
      window.fbq("trackCustom", "AdError", {
        ad_break_type: adBreakType,
        ad_id: adId || "unknown",
        error_message: errorMessage,
        content_id: this.contentId,
        content_title: this.contentTitle,
      })
    }
  }

  /**
   * Track ad click
   */
  public trackAdClick(
    adBreakId: string,
    adBreakType: "preroll" | "midroll" | "postroll",
    adId: string,
    adTitle: string,
    clickTime: number,
  ): void {
    const event: AdAnalyticsEvent = {
      eventType: "ad_clicked",
      adBreakId,
      adBreakType,
      adId,
      adTitle,
      adPosition: clickTime,
      contentId: this.contentId,
      contentTitle: this.contentTitle,
      userId: this.userId,
      sessionId: this.sessionId,
      timestamp: Date.now(),
    }

    this.logEvent(event)
    this.sendToAnalytics(event)

    // Send to Google Analytics
    if (typeof window !== "undefined" && window.gtag) {
      window.gtag("event", "ad_click", {
        ad_break_type: adBreakType,
        ad_id: adId,
        ad_title: adTitle,
        click_time: clickTime,
        content_id: this.contentId,
        content_title: this.contentTitle,
        event_category: "advertising",
        event_label: `${adBreakType}: ${adTitle} - Clicked`,
      })
    }

    // Send to Meta Pixel
    if (typeof window !== "undefined" && window.fbq) {
      window.fbq("trackCustom", "AdClick", {
        ad_break_type: adBreakType,
        ad_id: adId,
        ad_title: adTitle,
        click_time: clickTime,
        content_id: this.contentId,
        content_title: this.contentTitle,
      })
    }
  }

  /**
   * Get analytics summary
   */
  public getAnalyticsSummary(): {
    totalAdRequests: number
    totalAdsLoaded: number
    totalAdsStarted: number
    totalAdsCompleted: number
    totalAdsSkipped: number
    totalAdErrors: number
    totalAdClicks: number
    completionRate: number
    skipRate: number
    errorRate: number
  } {
    const requests = this.events.filter((e) => e.eventType === "ad_request").length
    const loaded = this.events.filter((e) => e.eventType === "ad_loaded").length
    const started = this.events.filter((e) => e.eventType === "ad_started").length
    const completed = this.events.filter((e) => e.eventType === "ad_completed").length
    const skipped = this.events.filter((e) => e.eventType === "ad_skipped").length
    const errors = this.events.filter((e) => e.eventType === "ad_error").length
    const clicks = this.events.filter((e) => e.eventType === "ad_clicked").length

    return {
      totalAdRequests: requests,
      totalAdsLoaded: loaded,
      totalAdsStarted: started,
      totalAdsCompleted: completed,
      totalAdsSkipped: skipped,
      totalAdErrors: errors,
      totalAdClicks: clicks,
      completionRate: started > 0 ? (completed / started) * 100 : 0,
      skipRate: started > 0 ? (skipped / started) * 100 : 0,
      errorRate: requests > 0 ? (errors / requests) * 100 : 0,
    }
  }

  /**
   * Export events for external analytics
   */
  public exportEvents(): AdAnalyticsEvent[] {
    return [...this.events]
  }

  /**
   * Clear events (useful for memory management)
   */
  public clearEvents(): void {
    this.events = []
  }

  /**
   * Private methods
   */
  private generateSessionId(): string {
    return `${Date.now()}-${Math.random().toString(36).substring(2, 15)}`
  }

  private logEvent(event: AdAnalyticsEvent): void {
    this.events.push(event)
    console.log("📊 Ad Analytics Event:", event)
  }

  private sendToAnalytics(event: AdAnalyticsEvent): void {
    // Send to your analytics backend
    if (typeof window !== "undefined") {
      // Example: Send to your analytics API
      fetch("/api/analytics/ads", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(event),
      }).catch((error) => {
        console.warn("Failed to send ad analytics:", error)
      })
    }
  }
}

/**
 * Utility functions for ad analytics
 */
export const AdAnalyticsUtils = {
  /**
   * Calculate ad performance metrics
   */
  calculateAdPerformance(events: AdAnalyticsEvent[]): {
    viewabilityRate: number
    completionRate: number
    clickThroughRate: number
    averageViewTime: number
  } {
    const started = events.filter((e) => e.eventType === "ad_started")
    const completed = events.filter((e) => e.eventType === "ad_completed")
    const clicked = events.filter((e) => e.eventType === "ad_clicked")
    const skipped = events.filter((e) => e.eventType === "ad_skipped")

    const totalViews = started.length
    const totalCompletions = completed.length
    const totalClicks = clicked.length

    // Calculate average view time from skipped ads
    const averageSkipTime = skipped.reduce((sum, event) => sum + (event.skipTime || 0), 0) / skipped.length || 0
    const averageCompletionTime =
      completed.reduce((sum, event) => sum + (event.adDuration || 0), 0) / completed.length || 0
    const averageViewTime =
      (averageSkipTime * skipped.length + averageCompletionTime * completed.length) / totalViews || 0

    return {
      viewabilityRate: totalViews > 0 ? 100 : 0, // Simplified - in real implementation, track actual viewability
      completionRate: totalViews > 0 ? (totalCompletions / totalViews) * 100 : 0,
      clickThroughRate: totalViews > 0 ? (totalClicks / totalViews) * 100 : 0,
      averageViewTime,
    }
  },

  /**
   * Generate ad performance report
   */
  generateAdReport(events: AdAnalyticsEvent[]): string {
    const performance = this.calculateAdPerformance(events)
    const summary = events.reduce(
      (acc, event) => {
        acc[event.eventType] = (acc[event.eventType] || 0) + 1
        return acc
      },
      {} as Record<string, number>,
    )

    return `
Ad Performance Report
====================
Total Events: ${events.length}
Ad Requests: ${summary.ad_request || 0}
Ads Loaded: ${summary.ad_loaded || 0}
Ads Started: ${summary.ad_started || 0}
Ads Completed: ${summary.ad_completed || 0}
Ads Skipped: ${summary.ad_skipped || 0}
Ad Errors: ${summary.ad_error || 0}
Ad Clicks: ${summary.ad_clicked || 0}

Performance Metrics:
Completion Rate: ${performance.completionRate.toFixed(2)}%
Click-Through Rate: ${performance.clickThroughRate.toFixed(2)}%
Average View Time: ${performance.averageViewTime.toFixed(2)}s
Viewability Rate: ${performance.viewabilityRate.toFixed(2)}%
    `.trim()
  },
}
