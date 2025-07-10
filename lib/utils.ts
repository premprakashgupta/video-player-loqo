import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export const isMalformedVideoId = (videoId: string | null): boolean => {
  const shouldSkipParams =
    !videoId ||
    videoId.includes("&amp;") || // HTML encoded ampersands
    videoId.includes("%20") || // URL encoded spaces
    videoId.includes(" ") || // Unencoded spaces (like "[object Object]")
    videoId === "[object Object]" || // Exact match for stringified object
    videoId === "undefined" || // Exact match for undefined
    videoId === "null" || // Exact match for null
    videoId.includes("[object") || // Any stringified object pattern
    videoId.includes("Object]") || // Any stringified object pattern
    videoId.includes("%5B") || // URL encoded [ bracket
    videoId.includes("%5D") || // URL encoded ] bracket
    !videoId.match(/^[a-zA-Z0-9_-]+$/) || // Only allow alphanumeric, underscore, hyphen
    videoId.length > 100 || // Prevent extremely long IDs
    videoId.length < 1 // Prevent empty strings

  return shouldSkipParams;
};


