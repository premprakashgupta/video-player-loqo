import { getDefaultVideoUrl } from "./language-utils"

export const getBestVideoUrl = (
  videoUrls: { [key: string]: string } | { videoQualityUrls?: { [language: string]: { [quality: string]: string } } },
  language: string,
): string | null => {
  // If it's the new format with videoQualityUrls
  if (typeof videoUrls === "object" && "videoQualityUrls" in videoUrls) {
    return getDefaultVideoUrl(videoUrls, language)
  }

  // Legacy format - direct videoUrls object
  if (videoUrls && typeof videoUrls === "object") {
    return getDefaultVideoUrl({ videoUrls: videoUrls as { [key: string]: string } }, language)
  }

  return null
}
