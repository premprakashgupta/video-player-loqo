"use client"

import { useState, useEffect, useRef } from "react"
import { Button } from "@/components/ui/button"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Link, MessageCircle, Facebook, Twitter, Send, Mail, MessageSquare, Copy, X } from "lucide-react"
import {
  type ShareContent,
  type ShareMethod,
  getShareMethods,
  getPlatformType,
  generateShareUrl,
  copyToClipboard,
  openShareWindow,
  handleShare as handleShareUtil,
} from "@/lib/share-utils"
import { trackContentSelection, trackShareCompletion, trackMetaShareCompletion } from "@/lib/analytics"

interface ShareDialogProps {
  isOpen: boolean
  onClose: () => void
  content: ShareContent
}

const iconMap = {
  Link,
  MessageCircle, // WhatsApp
  Facebook,
  Twitter,
  Send, // Telegram
  Mail,
  MessageSquare, // SMS
  Copy,
}

export default function ShareDialog({ isOpen, onClose, content }: ShareDialogProps) {
  const [copied, setCopied] = useState(false)
  const [platformType] = useState(() => getPlatformType())
  const [shareMethods] = useState(() => getShareMethods(platformType))
  const [includeTimestamp, setIncludeTimestamp] = useState(false)
  const [isMobile, setIsMobile] = useState(false)
  const urlRef = useRef<HTMLDivElement>(null)

  // Check if mobile on mount and on resize
  useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.innerWidth < 640)
    }

    checkMobile()
    window.addEventListener("resize", checkMobile)

    return () => {
      window.removeEventListener("resize", checkMobile)
    }
  }, [])

  // Reset copied state when dialog opens
  useEffect(() => {
    if (isOpen) {
      setCopied(false)
    }
  }, [isOpen])

  const handleCopyLink = async () => {
    const urlToShare = includeTimestamp && content.currentTime ? content.urlWithTimestamp : content.url
    const success = await copyToClipboard(urlToShare!)
    if (success) {
      setCopied(true)
      trackContentSelection(
        content.id,
        content.title,
        includeTimestamp ? "share_copy_link_with_timestamp" : "share_copy_link",
      )

      // Reset copied state after 2 seconds
      setTimeout(() => setCopied(false), 2000)
    }
  }

  const handleMethodClick = async (method: ShareMethod) => {
    if (method.action === "copy") {
      await handleCopyLink()
      return
    }

    if (method.action === "external") {
      const shareUrl = generateShareUrl(method.id, content, includeTimestamp)
      if (shareUrl) {
        openShareWindow(shareUrl, method.id)
        trackContentSelection(
          content.id,
          content.title,
          `share_${method.id}${includeTimestamp ? "_with_timestamp" : ""}`,
        )

        // Add Google Analytics tracking for share completion
        trackShareCompletion(content.id, content.title, method.id)

        // Add Meta Pixel tracking for share completion
        trackMetaShareCompletion(content.id, content.title, method.id)
      }
    }
  }

  const handleNativeShare = async () => {
    const result = await handleShareUtil(content)
    if (result.success) {
      trackContentSelection(content.id, content.title, `share_${result.method}`)

      // Add Google Analytics tracking for share completion
      trackShareCompletion(content.id, content.title, result.method || "native")

      // Add Meta Pixel tracking for share completion
      trackMetaShareCompletion(content.id, content.title, result.method || "native")

      if (result.method === "web_share_api") {
        onClose()
      }
    }
  }

  const getIcon = (iconName: string) => {
    const IconComponent = iconMap[iconName as keyof typeof iconMap]
    return IconComponent ? <IconComponent className="w-5 h-5" /> : <Link className="w-5 h-5" />
  }

  // Truncate URL for display
  const displayUrl = () => {
    const url = includeTimestamp && content.currentTime ? content.urlWithTimestamp : content.url
    if (isMobile && url && url.length > 30) {
      return url.substring(0, 30) + "..."
    }
    return url
  }

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent
        className="w-[95vw] max-w-[420px] bg-[#1a1a1a] border-gray-700 text-white p-0 gap-0 overflow-hidden"
        style={{ maxHeight: "85vh" }}
      >
        <DialogHeader className="p-4 sm:p-6 pb-2 sm:pb-4">
          <div className="flex items-center justify-between">
            <DialogTitle className="text-2xl font-medium text-white">Share</DialogTitle>
            <Button
              variant="ghost"
              size="icon"
              onClick={onClose}
              className="h-8 w-8 text-gray-400 hover:text-white hover:bg-gray-700 rounded-full"
            >
              <X className="h-5 w-5" />
            </Button>
          </div>
        </DialogHeader>

        <div className="px-4 sm:px-6 pb-4 sm:pb-6 space-y-4 overflow-y-auto" style={{ maxHeight: "calc(85vh - 60px)" }}>
          {/* Copy Link Section */}
          <div className="flex items-center space-x-2 p-3 bg-[#2a2a2a] rounded-lg">
            <div
              ref={urlRef}
              className="flex-1 min-w-0 text-sm text-gray-300 truncate font-mono"
              title={includeTimestamp && content.currentTime ? content.urlWithTimestamp : content.url}
            >
              {displayUrl()}
            </div>
            <Button
              onClick={handleCopyLink}
              size="sm"
              className={`px-3 sm:px-4 py-1 sm:py-2 rounded-md text-sm font-medium transition-all flex-shrink-0 ${copied ? "bg-green-600 hover:bg-green-700 text-white" : "bg-white hover:bg-gray-100 text-black"
                }`}
            >
              {copied ? "Copied" : "Copy"}
            </Button>
          </div>

          {/* Timestamp Option */}
          {content.currentTime && content.currentTime > 0 && (
            <div className="flex items-center space-x-3 p-3 bg-[#2a2a2a] rounded-lg">
              <input
                type="checkbox"
                id="include-timestamp"
                checked={includeTimestamp}
                onChange={(e) => setIncludeTimestamp(e.target.checked)}
                className="w-5 h-5 text-blue-600 bg-gray-700 border-gray-600 rounded focus:ring-blue-500 focus:ring-2"
              />
              <label htmlFor="include-timestamp" className="text-base text-white cursor-pointer">
                Start at {content.formattedTime}
              </label>
            </div>
          )}

          {/* Native Share Button for Mobile */}
          {platformType === "mobile" && (
            <Button
              onClick={handleNativeShare}
              className="w-full bg-[#2a2a2a] hover:bg-[#404040] text-white hover:text-white rounded-lg py-3"
            >
              <Send className="w-4 h-4 mr-2" />
              More options
            </Button>
          )}

          {/* Share to Section */}
          <div className="space-y-3">
            <h3 className="text-xl font-medium text-white">Share to</h3>
            <div className="grid grid-cols-2 gap-2">
              {shareMethods
                .filter((method) => method.action === "external")
                .map((method) => (
                  <Button
                    key={method.id}
                    onClick={() => handleMethodClick(method)}
                    variant="ghost"
                    className="flex items-center justify-start space-x-3 p-3 h-10 bg-[#2a2a2a] hover:bg-[#404040] text-white hover:text-white rounded-lg transition-colors"
                  >
                    {getIcon(method.icon)}
                    <span className="text-sm font-normal truncate">{method.name}</span>
                  </Button>
                ))}
            </div>
          </div>

          {/* Video Info */}
          <div className="pt-4 border-t border-gray-700">
            <div className="flex items-start space-x-3">
              {content.thumbnail && (
                <img
                  src={content.thumbnail || "/placeholder.svg"}
                  alt={content.title}
                  className="w-16 h-12 sm:w-20 sm:h-14 object-cover rounded-lg flex-shrink-0"
                />
              )}
              <div className="flex-1 min-w-0">
                <h4 className="text-sm sm:text-base font-medium text-white line-clamp-2 leading-tight mb-1 sm:mb-2">
                  {content.title}
                </h4>
                {content.description && (
                  <p className="text-xs sm:text-sm text-gray-400 line-clamp-2 leading-tight">{content.description}</p>
                )}
              </div>
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}
