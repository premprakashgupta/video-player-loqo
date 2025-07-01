// Quality management utility for enhanced video quality selection
// Provides device-aware quality recommendations and validation

import { getRecommendedQuality } from "./language-utils"

export interface QualityOption {
  id: string
  label: string
  bitrate?: number
  resolution?: { width: number; height: number }
  isRecommended?: boolean
  isDefault?: boolean
  performanceHint?: string | null
  warning?: string
  deviceCompatibility?: "excellent" | "good" | "fair" | "poor"
}

export interface QualityRecommendation {
  recommendedQuality: string
  reason: string
  confidence: number
  alternatives: string[]
}

/**
 * Enhanced quality manager that provides device-aware quality selection
 */
export class QualityManager {
  private availableQualities: string[]
  private currentQuality: string
  private qualityOptions: QualityOption[]

  constructor(availableQualities: string[]) {
    this.availableQualities = availableQualities
    this.currentQuality = this.getInitialQuality()
    this.qualityOptions = this.buildQualityOptions()
  }

  /**
   * Get initial quality based on device capabilities
   */
  private getInitialQuality(): string {
    return getRecommendedQuality(this.availableQualities)
  }

  /**
   * Build enhanced quality options with device-aware metadata
   */
  private buildQualityOptions(): QualityOption[] {
    return this.availableQualities.map((quality) => {
      const option: QualityOption = {
        id: quality,
        label: quality,
      }

      // Add resolution metadata
      option.resolution = this.getQualityResolution(quality)
      option.bitrate = this.getQualityBitrate(quality)

      return option
    })
  }

  /**
   * Get resolution metadata for quality level
   */
  private getQualityResolution(quality: string): { width: number; height: number } | undefined {
    const resolutions: { [key: string]: { width: number; height: number } } = {
      "4K": { width: 3840, height: 2160 },
      "1080p": { width: 1920, height: 1080 },
      "720p": { width: 1280, height: 720 },
      "480p": { width: 854, height: 480 },
    }

    return resolutions[quality]
  }

  /**
   * Get estimated bitrate for quality level
   */
  private getQualityBitrate(quality: string): number | undefined {
    const bitrates: { [key: string]: number } = {
      "4K": 25000, // 25 Mbps
      "1080p": 8000, // 8 Mbps
      "720p": 5000, // 5 Mbps
      "480p": 2500, // 2.5 Mbps
    }

    return bitrates[quality]
  }

  /**
   * Get quality options with device-aware enhancements
   */
  public getQualityOptions(): QualityOption[] {
    return [...this.qualityOptions]
  }

  /**
   * Get current quality
   */
  public getCurrentQuality(): string {
    return this.currentQuality
  }

  /**
   * Set current quality with validation
   */
  public setCurrentQuality(quality: string): boolean {
    try {
      if (!this.availableQualities.includes(quality)) {
        console.warn(`Quality ${quality} not available`)
        return false
      }

      this.currentQuality = quality

      // Update default flag in options
      this.qualityOptions = this.qualityOptions.map((option) => ({
        ...option,
        isDefault: option.id === quality,
      }))

      return true
    } catch (error) {
      console.warn(`Error setting quality to ${quality}:`, error)
      return false
    }
  }

  /**
   * Get quality recommendation based on current conditions
   */
  public getRecommendation(): QualityRecommendation {
    try {
      const recommended = this.availableQualities[0]
      const alternatives: string[] = []

      // Build alternatives list
      if (recommended !== this.currentQuality) {
        alternatives.push(recommended)
      }

      // Add fallback options
      const fallbacks = ["720p", "480p"].filter(
        (q) => this.availableQualities.includes(q) && q !== this.currentQuality && !alternatives.includes(q),
      )
      alternatives.push(...fallbacks)

      const reason = `Recommended quality`
      const confidence = 0.8

      return {
        recommendedQuality: recommended,
        reason,
        confidence,
        alternatives: alternatives.slice(0, 3), // Limit to 3 alternatives
      }
    } catch (error) {
      console.warn("Error generating quality recommendation:", error)
      return {
        recommendedQuality: this.currentQuality,
        reason: "Unable to generate recommendation",
        confidence: 0.1,
        alternatives: [],
      }
    }
  }
}

/**
 * Factory function to create quality manager
 */
export const createQualityManager = (availableQualities: string[]): QualityManager => {
  try {
    return new QualityManager(availableQualities)
  } catch (error) {
    console.error("Error creating quality manager:", error)
    throw error
  }
}
