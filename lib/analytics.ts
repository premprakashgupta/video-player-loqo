// Analytics utility functions for tracking user interactions

declare global {
  interface Window {
    gtag: (command: string, targetId: string, config?: any) => void
    fbq: (command: string, event: string, parameters?: any) => void
  }
}

/**
 * Track video play events
 */
export const trackVideoPlay = (contentId: string, title: string, language: string, series?: string) => {
  if (typeof window !== "undefined" && window.gtag) {
    window.gtag("event", "video_play", {
      content_id: contentId,
      content_title: title,
      language: language,
      series: series || "standalone",
      event_category: "video",
      event_label: `${title} (${language})`,
    })
    trackMetaVideoPlay(contentId, title, series || "standalone", language)
    trackMetaViewContent(contentId, title, series || "standalone")
  }
}

/**
 * Track video pause events
 */
export const trackVideoPause = (contentId: string, currentTime: number, duration: number) => {
  if (typeof window !== "undefined" && window.gtag) {
    const watchPercentage = duration > 0 ? Math.round((currentTime / duration) * 100) : 0

    window.gtag("event", "video_pause", {
      content_id: contentId,
      current_time: Math.round(currentTime),
      duration: Math.round(duration),
      watch_percentage: watchPercentage,
      event_category: "video",
      event_label: `Paused at ${watchPercentage}%`,
    })
  }
}

/**
 * Track video completion events
 */
export const trackVideoComplete = (contentId: string, title: string, duration: number) => {
  if (typeof window !== "undefined" && window.gtag) {
    window.gtag("event", "video_complete", {
      content_id: contentId,
      content_title: title,
      duration: Math.round(duration),
      event_category: "video",
      event_label: `Completed: ${title}`,
    })
    trackMetaVideoComplete(contentId, title, duration)
  }
}

/**
 * Track language changes
 */
export const trackLanguageChange = (fromLanguage: string, toLanguage: string) => {
  if (typeof window !== "undefined" && window.gtag) {
    window.gtag("event", "language_change", {
      from_language: fromLanguage,
      to_language: toLanguage,
      event_category: "user_interaction",
      event_label: `${fromLanguage} → ${toLanguage}`,
    })
    trackMetaLanguageChange(fromLanguage, toLanguage)
  }
}

/**
 * Track content selection from carousels
 */
export const trackContentSelection = (contentId: string, title: string, source: string, position?: number) => {
  if (typeof window !== "undefined" && window.gtag) {
    window.gtag("event", "content_selection", {
      content_id: contentId,
      content_title: title,
      source: source,
      position: position,
      event_category: "content_discovery",
      event_label: `${source}: ${title}`,
    })
    trackMetaViewContent(contentId, title, source)
  }
}

/**
 * Track video quality changes
 */
export const trackQualityChange = (contentId: string, quality: string) => {
  if (typeof window !== "undefined" && window.gtag) {
    window.gtag("event", "quality_change", {
      content_id: contentId,
      quality: quality,
      event_category: "video_settings",
      event_label: `Quality: ${quality}`,
    })
    trackMetaQualityChange(contentId, quality)
  }
}

/**
 * Track fullscreen toggles
 */
export const trackFullscreenToggle = (contentId: string, isFullscreen: boolean) => {
  if (typeof window !== "undefined" && window.gtag) {
    window.gtag("event", "fullscreen_toggle", {
      content_id: contentId,
      fullscreen_state: isFullscreen ? "enter" : "exit",
      event_category: "video_settings",
      event_label: isFullscreen ? "Enter Fullscreen" : "Exit Fullscreen",
    })
  }
}

/**
 * Track episode navigation
 */
export const trackEpisodeNavigation = (
  fromEpisode: string,
  toEpisode: string,
  method: "next" | "previous" | "manual",
) => {
  if (typeof window !== "undefined" && window.gtag) {
    window.gtag("event", "episode_navigation", {
      from_episode: fromEpisode,
      to_episode: toEpisode,
      navigation_method: method,
      event_category: "content_navigation",
      event_label: `${method}: ${fromEpisode} → ${toEpisode}`,
    })
    trackMetaEpisodeNavigation(fromEpisode, toEpisode, method)
  }
}

/**
 * Track video seek events
 */
export const trackVideoSeek = (contentId: string, fromTime: number, toTime: number) => {
  if (typeof window !== "undefined" && window.gtag) {
    const seekDirection = toTime > fromTime ? "forward" : "backward"
    const seekAmount = Math.abs(toTime - fromTime)

    window.gtag("event", "video_seek", {
      content_id: contentId,
      from_time: Math.round(fromTime),
      to_time: Math.round(toTime),
      seek_direction: seekDirection,
      seek_amount: Math.round(seekAmount),
      event_category: "video_interaction",
      event_label: `Seek ${seekDirection}: ${Math.round(seekAmount)}s`,
    })
  }
}

/**
 * Track page views with custom parameters
 */
export const trackPageView = (pagePath: string, pageTitle: string, language?: string) => {
  if (typeof window !== "undefined" && window.gtag) {
    window.gtag("config", "G-9HSJES1HRQ", {
      page_path: pagePath,
      page_title: pageTitle,
      custom_map: {
        custom_parameter_1: language || "default",
      },
    })
  }
}

/**
 * Track user engagement milestones
 */
export const trackEngagementMilestone = (milestone: string, value?: number) => {
  if (typeof window !== "undefined" && window.gtag) {
    window.gtag("event", "engagement_milestone", {
      milestone_type: milestone,
      milestone_value: value,
      event_category: "user_engagement",
      event_label: milestone,
    })
  }
}

/**
 * Track share click (when share dialog opens)
 */
export const trackShareClick = (contentId: string, contentName: string, shareMethod: string) => {
  if (typeof window !== "undefined" && window.gtag) {
    window.gtag("event", "share_click", {
      content_id: contentId,
      content_name: contentName,
      share_method: shareMethod,
      event_category: "content_sharing",
      event_label: `Share Click: ${shareMethod}`,
    })
  }
}

/**
 * Track share completion (when user actually shares)
 */
export const trackShareCompletion = (contentId: string, contentName: string, shareMethod: string) => {
  if (typeof window !== "undefined" && window.gtag) {
    window.gtag("event", "share_completion", {
      content_id: contentId,
      content_name: contentName,
      share_method: shareMethod,
      event_category: "content_sharing",
      event_label: `Share Completed: ${shareMethod}`,
    })
  }
}

/**
 * Track scroll depth
 */
export const trackScrollDepth = (depthPercentage: number, pageType = "content") => {
  if (typeof window !== "undefined" && window.gtag) {
    window.gtag("event", "scroll_depth", {
      depth_percentage: depthPercentage,
      page_type: pageType,
      event_category: "user_engagement",
      event_label: `Scroll Depth: ${depthPercentage}%`,
    })
  }
}

/**
 * Track carousel scroll
 */
export const trackCarouselScroll = (carouselName: string, scrollDirection: string) => {
  if (typeof window !== "undefined" && window.gtag) {
    window.gtag("event", "carousel_scroll", {
      carousel_name: carouselName,
      scroll_direction: scrollDirection,
      event_category: "content_navigation",
      event_label: `Carousel: ${carouselName} - ${scrollDirection}`,
    })
  }
}

/**
 * Track time spent on content
 */
export const trackTimeSpent = (contentId: string, timeSpentSeconds: number, contentType = "video") => {
  if (typeof window !== "undefined" && window.gtag) {
    window.gtag("event", "time_spent", {
      content_id: contentId,
      duration_seconds: Math.round(timeSpentSeconds),
      content_type: contentType,
      event_category: "user_engagement",
      event_label: `Time Spent: ${Math.round(timeSpentSeconds)}s`,
    })
  }
}

/**
 * Track content reaction (like/unlike)
 */
export const trackContentReaction = (
  contentId: string,
  contentName: string,
  reactionType: string,
  isAdding: boolean,
) => {
  if (typeof window !== "undefined" && window.gtag) {
    window.gtag("event", "content_reaction", {
      content_id: contentId,
      content_name: contentName,
      reaction_type: reactionType,
      action: isAdding ? "add" : "remove",
      event_category: "user_interaction",
      event_label: `${reactionType}: ${isAdding ? "Added" : "Removed"}`,
    })
  }
}

/**
 * Track viewing habits
 */
export const trackViewingHabit = (contentId: string, sessionDuration: number) => {
  if (typeof window !== "undefined" && window.gtag) {
    const now = new Date()
    const hour = now.getHours()
    const dayOfWeek = now.toLocaleDateString("en-US", { weekday: "long" }).toLowerCase()

    let timeOfDay = "night"
    if (hour >= 6 && hour < 12) timeOfDay = "morning"
    else if (hour >= 12 && hour < 17) timeOfDay = "afternoon"
    else if (hour >= 17 && hour < 22) timeOfDay = "evening"

    window.gtag("event", "viewing_habit", {
      content_id: contentId,
      time_of_day: timeOfDay,
      day_of_week: dayOfWeek,
      session_duration: Math.round(sessionDuration),
      event_category: "user_behavior",
      event_label: `${timeOfDay} - ${dayOfWeek}`,
    })
  }
}

/**
 * Meta Pixel - Track page view (already handled by base code)
 */
export const trackMetaPageView = () => {
  if (typeof window !== "undefined" && window.fbq) {
    window.fbq("track", "PageView")
  }
}

/**
 * Meta Pixel - Track content view
 */
export const trackMetaViewContent = (
  contentId: string,
  contentName: string,
  contentCategory: string,
  value?: number,
) => {
  if (typeof window !== "undefined" && window.fbq) {
    window.fbq("track", "ViewContent", {
      content_ids: [contentId],
      content_name: contentName,
      content_category: contentCategory,
      content_type: "video",
      value: value,
      currency: "USD",
    })
  }
}

/**
 * Meta Pixel - Track search
 */
export const trackMetaSearch = (searchString: string) => {
  if (typeof window !== "undefined" && window.fbq) {
    window.fbq("track", "Search", {
      search_string: searchString,
    })
  }
}

/**
 * Meta Pixel - Track add to wishlist
 */
export const trackMetaAddToWishlist = (contentId: string, contentName: string, contentCategory: string) => {
  if (typeof window !== "undefined" && window.fbq) {
    window.fbq("track", "AddToWishlist", {
      content_ids: [contentId],
      content_name: contentName,
      content_category: contentCategory,
      content_type: "video",
    })
  }
}

/**
 * Meta Pixel - Track lead (sign-up)
 */
export const trackMetaLead = (value?: number) => {
  if (typeof window !== "undefined" && window.fbq) {
    window.fbq("track", "Lead", {
      value: value,
      currency: "USD",
    })
  }
}

/**
 * Meta Pixel - Track complete registration
 */
export const trackMetaCompleteRegistration = (registrationMethod: string) => {
  if (typeof window !== "undefined" && window.fbq) {
    window.fbq("track", "CompleteRegistration", {
      registration_method: registrationMethod,
    })
  }
}

/**
 * Meta Pixel - Track initiate checkout (subscription flow)
 */
export const trackMetaInitiateCheckout = (value: number, currency = "USD") => {
  if (typeof window !== "undefined" && window.fbq) {
    window.fbq("track", "InitiateCheckout", {
      value: value,
      currency: currency,
      content_category: "subscription",
    })
  }
}

/**
 * Meta Pixel - Track purchase (completed subscription)
 */
export const trackMetaPurchase = (value: number, currency = "USD", contentIds: string[] = []) => {
  if (typeof window !== "undefined" && window.fbq) {
    window.fbq("track", "Purchase", {
      value: value,
      currency: currency,
      content_ids: contentIds,
      content_type: "subscription",
    })
  }
}

/**
 * Meta Pixel - Track custom video events
 */
export const trackMetaVideoPlay = (
  contentId: string,
  contentName: string,
  contentCategory: string,
  language: string,
) => {
  if (typeof window !== "undefined" && window.fbq) {
    window.fbq("trackCustom", "VideoPlay", {
      content_ids: [contentId],
      content_name: contentName,
      content_category: contentCategory,
      language: language,
      device_type: window.innerWidth < 768 ? "mobile" : "desktop",
    })
  }
}

export const trackMetaVideoComplete = (contentId: string, contentName: string, duration: number) => {
  if (typeof window !== "undefined" && window.fbq) {
    window.fbq("trackCustom", "VideoComplete", {
      content_ids: [contentId],
      content_name: contentName,
      duration: Math.round(duration),
      device_type: window.innerWidth < 768 ? "mobile" : "desktop",
    })
  }
}

export const trackMetaLanguageChange = (fromLanguage: string, toLanguage: string) => {
  if (typeof window !== "undefined" && window.fbq) {
    window.fbq("trackCustom", "LanguageChange", {
      from_language: fromLanguage,
      to_language: toLanguage,
    })
  }
}

export const trackMetaEpisodeNavigation = (fromEpisode: string, toEpisode: string, method: string) => {
  if (typeof window !== "undefined" && window.fbq) {
    window.fbq("trackCustom", "EpisodeNavigation", {
      from_episode: fromEpisode,
      to_episode: toEpisode,
      navigation_method: method,
    })
  }
}

export const trackMetaQualityChange = (contentId: string, quality: string) => {
  if (typeof window !== "undefined" && window.fbq) {
    window.fbq("trackCustom", "QualityChange", {
      content_ids: [contentId],
      quality: quality,
    })
  }
}

/**
 * Meta Pixel - Track share click (when share dialog opens)
 */
export const trackMetaShareClick = (contentId: string, contentName: string, shareMethod: string) => {
  if (typeof window !== "undefined" && window.fbq) {
    window.fbq("trackCustom", "ShareClick", {
      content_ids: [contentId],
      content_name: contentName,
      share_method: shareMethod,
      content_type: "video",
    })
  }
}

/**
 * Meta Pixel - Track share completion (when user actually shares)
 */
export const trackMetaShareCompletion = (contentId: string, contentName: string, shareMethod: string) => {
  if (typeof window !== "undefined" && window.fbq) {
    window.fbq("trackCustom", "ShareCompletion", {
      content_ids: [contentId],
      content_name: contentName,
      share_method: shareMethod,
      content_type: "video",
    })
  }
}

/**
 * Meta Pixel - Track fullscreen toggle
 */
export const trackMetaFullscreenToggle = (contentId: string, isFullscreen: boolean) => {
  if (typeof window !== "undefined" && window.fbq) {
    window.fbq("trackCustom", "FullscreenToggle", {
      content_ids: [contentId],
      fullscreen_state: isFullscreen ? "enter" : "exit",
      device_type: window.innerWidth < 768 ? "mobile" : "desktop",
    })
  }
}

/**
 * Meta Pixel - Track video pause
 */
export const trackMetaVideoPause = (contentId: string, currentTime: number, duration: number) => {
  if (typeof window !== "undefined" && window.fbq) {
    const watchPercentage = duration > 0 ? Math.round((currentTime / duration) * 100) : 0
    window.fbq("trackCustom", "VideoPause", {
      content_ids: [contentId],
      current_time: Math.round(currentTime),
      duration: Math.round(duration),
      watch_percentage: watchPercentage,
      device_type: window.innerWidth < 768 ? "mobile" : "desktop",
    })
  }
}

/**
 * Meta Pixel - Track video seek (fast forward/rewind)
 */
export const trackMetaVideoSeek = (contentId: string, fromTime: number, toTime: number) => {
  if (typeof window !== "undefined" && window.fbq) {
    const seekDirection = toTime > fromTime ? "forward" : "backward"
    const seekAmount = Math.abs(toTime - fromTime)
    window.fbq("trackCustom", "VideoSeek", {
      content_ids: [contentId],
      from_time: Math.round(fromTime),
      to_time: Math.round(toTime),
      seek_direction: seekDirection,
      seek_amount: Math.round(seekAmount),
      device_type: window.innerWidth < 768 ? "mobile" : "desktop",
    })
  }
}

/**
 * Meta Pixel - Track scroll depth
 */
export const trackMetaScrollDepth = (depthPercentage: number, pageType = "content") => {
  if (typeof window !== "undefined" && window.fbq) {
    window.fbq("trackCustom", "ScrollDepth", {
      depth_percentage: depthPercentage,
      page_type: pageType,
      device_type: window.innerWidth < 768 ? "mobile" : "desktop",
    })
  }
}

/**
 * Meta Pixel - Track carousel scroll
 */
export const trackMetaCarouselScroll = (carouselName: string, scrollDirection: string) => {
  if (typeof window !== "undefined" && window.fbq) {
    window.fbq("trackCustom", "CarouselScroll", {
      carousel_name: carouselName,
      scroll_direction: scrollDirection,
      device_type: window.innerWidth < 768 ? "mobile" : "desktop",
    })
  }
}

/**
 * Meta Pixel - Track time spent on content
 */
export const trackMetaTimeSpent = (contentId: string, timeSpentSeconds: number, contentType = "video") => {
  if (typeof window !== "undefined" && window.fbq) {
    window.fbq("trackCustom", "TimeSpent", {
      content_ids: [contentId],
      duration_seconds: Math.round(timeSpentSeconds),
      content_type: contentType,
      device_type: window.innerWidth < 768 ? "mobile" : "desktop",
    })
  }
}

/**
 * Meta Pixel - Track content reaction (like/unlike)
 */
export const trackMetaContentReaction = (
  contentId: string,
  contentName: string,
  reactionType: string,
  isAdding: boolean,
) => {
  if (typeof window !== "undefined" && window.fbq) {
    window.fbq("trackCustom", "ContentReaction", {
      content_ids: [contentId],
      content_name: contentName,
      reaction_type: reactionType,
      action: isAdding ? "add" : "remove",
      content_type: "video",
    })
  }
}

/**
 * Meta Pixel - Track viewing habits
 */
export const trackMetaViewingHabit = (contentId: string, sessionDuration: number) => {
  if (typeof window !== "undefined" && window.fbq) {
    const now = new Date()
    const hour = now.getHours()
    const dayOfWeek = now.toLocaleDateString("en-US", { weekday: "long" }).toLowerCase()

    let timeOfDay = "night"
    if (hour >= 6 && hour < 12) timeOfDay = "morning"
    else if (hour >= 12 && hour < 17) timeOfDay = "afternoon"
    else if (hour >= 17 && hour < 22) timeOfDay = "evening"

    window.fbq("trackCustom", "ViewingHabit", {
      content_ids: [contentId],
      time_of_day: timeOfDay,
      day_of_week: dayOfWeek,
      session_duration: Math.round(sessionDuration),
      device_type: window.innerWidth < 768 ? "mobile" : "desktop",
    })
  }
}
