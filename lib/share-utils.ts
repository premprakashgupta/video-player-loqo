// Share utility functions with tiered approach

export interface ShareContent {
  id: string
  title: string
  description?: string
  url: string
  urlWithTimestamp?: string
  thumbnail?: string
  type: "video" | "series" | "episode"
  currentTime?: number
  formattedTime?: string
}

export interface ShareMethod {
  id: string
  name: string
  icon: string
  color: string
  url?: string
  action?: "copy" | "native" | "external"
}

/**
 * Detect if we're in an in-app browser
 */
export function isInAppBrowser(): boolean {
  if (typeof window === "undefined") return false

  const ua = navigator.userAgent || navigator.vendor || (window as any).opera || ""
  return /FBAN|FBAV|Instagram|Twitter|Pinterest|Line|WeChat|MicroMessenger|QQ|TikTok|Snapchat/i.test(ua)
}

/**
 * Detect platform type
 */
export function getPlatformType(): "mobile" | "desktop" | "tablet" {
  if (typeof window === "undefined") return "desktop"

  const ua = navigator.userAgent
  if (/tablet|ipad|playbook|silk/i.test(ua)) return "tablet"
  if (/mobile|iphone|ipod|android|blackberry|opera|mini|windows\sce|palm|smartphone|iemobile/i.test(ua)) return "mobile"
  return "desktop"
}

/**
 * Check if Web Share API is supported
 */
export function isWebShareSupported(): boolean {
  return typeof navigator !== "undefined" && "share" in navigator
}

/**
 * Generate share URL for different platforms
 */
export function generateShareUrl(platform: string, content: ShareContent, includeTimestamp = false): string {
  const shareUrl = includeTimestamp && content.urlWithTimestamp ? content.urlWithTimestamp : content.url
  const encodedUrl = encodeURIComponent(shareUrl)
  const encodedTitle = encodeURIComponent(content.title)
  const encodedDescription = encodeURIComponent(content.description || "")

  const shareUrls: Record<string, string> = {
    facebook: `https://www.facebook.com/sharer/sharer.php?u=${encodedUrl}`,
    twitter: `https://twitter.com/intent/tweet?url=${encodedUrl}&text=${encodedTitle}`,
    whatsapp: `https://api.whatsapp.com/send?text=${encodedTitle}%20${encodedUrl}`,
    telegram: `https://t.me/share/url?url=${encodedUrl}&text=${encodedTitle}`,
    linkedin: `https://www.linkedin.com/sharing/share-offsite/?url=${encodedUrl}`,
    reddit: `https://reddit.com/submit?url=${encodedUrl}&title=${encodedTitle}`,
    email: `mailto:?subject=${encodedTitle}&body=${encodedDescription}%0A%0A${encodedUrl}`,
    sms: `sms:?body=${encodedTitle}%20${encodedUrl}`,
  }

  return shareUrls[platform] || ""
}

/**
 * Get available share methods based on platform
 */
export function getShareMethods(platformType: string): ShareMethod[] {
  const baseMethods: ShareMethod[] = [
    {
      id: "copy",
      name: "Copy link",
      icon: "Link",
      color: "bg-gray-600 hover:bg-gray-700",
      action: "copy",
    },
  ]

  const socialMethods: ShareMethod[] = [
    {
      id: "whatsapp",
      name: "WhatsApp",
      icon: "MessageCircle",
      color: "bg-[#3a3a3a] hover:bg-[#4a4a4a]",
      action: "external",
    },
    {
      id: "facebook",
      name: "Facebook",
      icon: "Facebook",
      color: "bg-[#3a3a3a] hover:bg-[#4a4a4a]",
      action: "external",
    },
    {
      id: "twitter",
      name: "Twitter",
      icon: "Twitter",
      color: "bg-[#3a3a3a] hover:bg-[#4a4a4a]",
      action: "external",
    },
    {
      id: "telegram",
      name: "Telegram",
      icon: "Send",
      color: "bg-[#3a3a3a] hover:bg-[#4a4a4a]",
      action: "external",
    },
    {
      id: "email",
      name: "Email",
      icon: "Mail",
      color: "bg-[#3a3a3a] hover:bg-[#4a4a4a]",
      action: "external",
    },
  ]

  if (platformType === "mobile") {
    return [
      ...baseMethods,
      {
        id: "sms",
        name: "Messages",
        icon: "MessageSquare",
        color: "bg-[#3a3a3a] hover:bg-[#4a4a4a]",
        action: "external",
      },
      ...socialMethods,
    ]
  }

  return [...baseMethods, ...socialMethods]
}

/**
 * Copy text to clipboard
 */
export async function copyToClipboard(text: string): Promise<boolean> {
  try {
    if (navigator.clipboard && window.isSecureContext) {
      await navigator.clipboard.writeText(text)
      return true
    } else {
      // Fallback for older browsers
      const textArea = document.createElement("textarea")
      textArea.value = text
      textArea.style.position = "fixed"
      textArea.style.left = "-999999px"
      textArea.style.top = "-999999px"
      document.body.appendChild(textArea)
      textArea.focus()
      textArea.select()

      const success = document.execCommand("copy")
      document.body.removeChild(textArea)
      return success
    }
  } catch (error) {
    console.error("Failed to copy to clipboard:", error)
    return false
  }
}

/**
 * Share via Web Share API
 */
export async function shareViaWebShareAPI(content: ShareContent): Promise<boolean> {
  try {
    if (!isWebShareSupported()) return false

    await navigator.share({
      title: content.title,
      text: content.description || `Check out this ${content.type}!`,
      url: content.url,
    })

    return true
  } catch (error) {
    // User cancelled or error occurred
    console.log("Web Share API cancelled or failed:", error)
    return false
  }
}

/**
 * Open share URL with direct navigation to avoid about:blank issue
 */
export function openShareWindow(url: string, platform: string): void {
  // Use direct navigation to avoid about:blank intermediate page
  window.location.href = url
}

/**
 * Main share handler with tiered approach
 */
export async function handleShare(content: ShareContent): Promise<{ success: boolean; method: string }> {
  // First tier: Try Web Share API (mainly mobile)
  if (isWebShareSupported() && getPlatformType() === "mobile") {
    const success = await shareViaWebShareAPI(content)
    if (success) {
      return { success: true, method: "web_share_api" }
    }
  }

  // Second tier: Platform-specific handling
  if (isInAppBrowser()) {
    // For in-app browsers, prefer copy to clipboard
    const success = await copyToClipboard(content.url)
    return { success, method: "copy_clipboard_inapp" }
  }

  // Third tier: Show custom share dialog
  // This will be handled by the ShareDialog component
  return { success: true, method: "custom_dialog" }
}

/**
 * Format share content from video data
 */
export function formatShareContent(content: any, currentLanguage: string, currentTime = 0, baseUrl = ""): ShareContent {
  const baseURL = new URL(window.location.origin + window.location.pathname)

  // Base URL with essential parameters
  baseURL.searchParams.set("videoId", content.videoId || content.id)
  baseURL.searchParams.set("videoLanguage", currentLanguage)
  baseURL.searchParams.set("videoPlayOffset", "0") // Default to 0

  const url = baseURL.toString()

  // URL with timestamp if currentTime > 0
  let urlWithTimestamp = url
  if (currentTime > 0) {
    const timestampURL = new URL(url)
    timestampURL.searchParams.set("videoPlayOffset", Math.floor(currentTime).toString())
    urlWithTimestamp = timestampURL.toString()
  }

  // Format time for display (MM:SS)
  const formatTime = (time: number): string => {
    const minutes = Math.floor(time / 60)
    const seconds = Math.floor(time % 60)
    return `${minutes}:${seconds.toString().padStart(2, "0")}`
  }

  return {
    id: content.id,
    title: content.title?.english || content.title || "Amazing Video",
    description: content.description?.english || content.description || "Check out this amazing content!",
    url,
    urlWithTimestamp: currentTime > 0 ? urlWithTimestamp : url,
    thumbnail: content.thumbnail,
    type: content.episodeNumber ? "episode" : content.episodes ? "series" : "video",
    currentTime: currentTime > 0 ? currentTime : undefined,
    formattedTime: currentTime > 0 ? formatTime(currentTime) : undefined,
  }
}
