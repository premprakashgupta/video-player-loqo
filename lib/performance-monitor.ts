// Simplified performance monitoring - minimal implementation
// Provides basic interface without complex monitoring

export interface PerformanceMetrics {
  bufferHealth: number
  memoryPressure: number
  networkStability: number
  qualitySwitchFrequency: number
  averageBufferLength: number
  droppedFrames: number
  lastUpdateTime: number
}

export interface PerformanceRecommendation {
  recommendedQuality: string
  shouldDowngrade: boolean
  reason: string
  confidence: number
}

// Simplified performance monitor - no actual monitoring
export class PerformanceMonitor {
  constructor() {}

  public startMonitoring(video: HTMLVideoElement): void {
    // No-op - simplified implementation
  }

  public stopMonitoring(): void {
    // No-op - simplified implementation
  }

  public recordQualitySwitch(): void {
    // No-op - simplified implementation
  }

  public getMetrics(): PerformanceMetrics {
    return {
      bufferHealth: 1.0,
      memoryPressure: 0.0,
      networkStability: 1.0,
      qualitySwitchFrequency: 0,
      averageBufferLength: 0,
      droppedFrames: 0,
      lastUpdateTime: Date.now(),
    }
  }

  public getRecommendation(currentQuality: string): PerformanceRecommendation {
    return {
      recommendedQuality: currentQuality,
      shouldDowngrade: false,
      reason: "Performance is stable",
      confidence: 0.8,
    }
  }

  public shouldDowngradeDevice(): boolean {
    return false
  }

  public destroy(): void {
    // No-op - simplified implementation
  }
}
