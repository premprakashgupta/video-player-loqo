// Configuration for different particle effects
export const PARTICLE_CONFIGS = {
  sparkle: {
    count: 15,
    colors: ["#ffd700", "#ffed4e", "#fff59d", "#ffeb3b", "#ffc107"],
    speed: { min: 2, max: 5 },
    size: { min: 4, max: 8 },
    life: { min: 30, max: 50 },
    gravity: 0.1,
  },
  confetti: {
    count: 20,
    colors: ["#ff6b6b", "#4ecdc4", "#45b7d1", "#96ceb4", "#feca57", "#ff9ff3"],
    speed: { min: 3, max: 7 },
    size: { min: 5, max: 10 },
    life: { min: 40, max: 70 },
    gravity: 0.2,
  },
  thumbs: {
    count: 8,
    colors: ["#3b82f6", "#1d4ed8", "#2563eb", "#60a5fa"],
    speed: { min: 2, max: 4 },
    size: { min: 15, max: 25 },
    life: { min: 50, max: 80 },
    gravity: 0.05,
  },
} as const

export type ParticleConfig = (typeof PARTICLE_CONFIGS)[keyof typeof PARTICLE_CONFIGS]
