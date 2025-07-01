"use client"

import { useCallback } from "react"
import { trackEpisodeNavigation } from "@/lib/analytics"

interface UseEpisodeNavigationProps {
  currentCollection: any
  currentContent: any
  onContentChange: (content: any) => void
}

export function useEpisodeNavigation({
  currentCollection,
  currentContent,
  onContentChange,
}: UseEpisodeNavigationProps) {
  const getNextEpisode = useCallback(() => {
    if (!currentCollection?.episodes) return null

    const currentIndex = currentCollection.episodes.findIndex((ep: any) => ep.id === currentContent.id)
    if (currentIndex === -1) return null

    const isLastEpisode = currentIndex === currentCollection.episodes.length - 1
    const nextIndex = isLastEpisode ? 0 : currentIndex + 1

    return currentCollection.episodes[nextIndex] || null
  }, [currentCollection, currentContent.id])

  const getPreviousEpisode = useCallback(() => {
    if (!currentCollection?.episodes) return null

    const currentIndex = currentCollection.episodes.findIndex((ep: any) => ep.id === currentContent.id)
    if (currentIndex === -1) return null

    const prevIndex = currentIndex === 0 ? currentCollection.episodes.length - 1 : currentIndex - 1

    return currentCollection.episodes[prevIndex] || null
  }, [currentCollection, currentContent.id])

  const playNextEpisode = useCallback(() => {
    const nextEpisode = getNextEpisode()
    if (nextEpisode) {
      trackEpisodeNavigation(currentContent.id, nextEpisode.id, "next")
      onContentChange(nextEpisode)
    }
  }, [getNextEpisode, currentContent.id, onContentChange])

  const playPreviousEpisode = useCallback(() => {
    const prevEpisode = getPreviousEpisode()
    if (prevEpisode) {
      trackEpisodeNavigation(currentContent.id, prevEpisode.id, "previous")
      onContentChange(prevEpisode)
    }
  }, [getPreviousEpisode, currentContent.id, onContentChange])

  return {
    getNextEpisode,
    getPreviousEpisode,
    playNextEpisode,
    playPreviousEpisode,
  }
}
