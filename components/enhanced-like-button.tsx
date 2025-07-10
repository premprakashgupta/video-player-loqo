"use client"

import type React from "react"
import { useState, useRef, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { ThumbsUp } from "lucide-react"
// import { trackContentReaction, trackMetaContentReaction } from "@/lib/analytics"

interface EnhancedLikeButtonProps {
  likeCount: string | number
  isLiked?: boolean
  onLike?: () => void
  className?: string
  size?: "sm" | "md" | "lg"
  // Add these new props for Meta Pixel tracking
  contentId?: string
  contentName?: string
}

export default function EnhancedLikeButton({
  likeCount,
  isLiked = false,
  onLike,
  className = "",
  size = "md",
  contentId,
  contentName,
}: EnhancedLikeButtonProps) {
  const [liked, setLiked] = useState(isLiked)
  const buttonRef = useRef<HTMLButtonElement>(null)
  const [isAnimating, setIsAnimating] = useState(false)

  // Handle animation completion
  useEffect(() => {
    if (isAnimating) {
      const timer = setTimeout(() => {
        setIsAnimating(false)
      }, 300) // Match the CSS animation duration
      return () => clearTimeout(timer)
    }
  }, [isAnimating])

  const handleClick = (e: React.MouseEvent) => {
    e.preventDefault()
    e.stopPropagation()

    // Toggle like state
    const newLikedState = !liked
    setLiked(newLikedState)

    // Trigger animation only when liking (not unliking)
    if (newLikedState) {
      setIsAnimating(true)
    }

    // Add Google Analytics tracking for content reaction
    // if (contentId && contentName) {
    //   trackContentReaction(contentId, contentName, "like", newLikedState)
    // }

    // Add Meta Pixel tracking for content reaction
    // if (contentId && contentName) {
    //   trackMetaContentReaction(contentId, contentName, "like", newLikedState)
    // }

    // Call external handler
    onLike?.()
  }

  const sizeClasses = {
    sm: "px-2 py-1 text-xs space-x-1",
    md: "px-2 py-1 text-xs md:px-4 md:py-2 md:text-base space-x-1 md:space-x-2",
    lg: "px-4 py-2 text-base space-x-2",
  }

  const iconSizes = {
    sm: "w-3 h-3",
    md: "w-3 h-3 md:w-5 md:h-5",
    lg: "w-5 h-5",
  }

  return (
    <Button
      ref={buttonRef}
      variant="ghost"
      onClick={handleClick}
      className={`
        relative flex items-center rounded-full transition-all duration-200
        ${liked
          ? "text-blue-400 hover:text-blue-300 hover:bg-white/10"
          : "text-white hover:text-white hover:bg-white/10"
        }
        ${sizeClasses[size]}
        ${className}
      `}
    >
      <ThumbsUp
        className={`
          ${iconSizes[size]} 
          transition-all duration-300
          ${liked ? "fill-blue-400 text-blue-400" : "fill-transparent"}
          ${isAnimating ? "animate-like-button" : ""}
        `}
      />
      <span className="transition-colors duration-200 font-medium">{likeCount}</span>
    </Button>
  )
}
