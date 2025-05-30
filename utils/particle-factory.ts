import type { Particle } from "../types/particle"
import { VISUAL_CONSTANTS } from "../constants/physics"

export function createParticles(centerX: number, centerY: number): Particle[] {
  return Array.from({ length: VISUAL_CONSTANTS.particleCount }, (_, i) => ({
    x: centerX,
    y: centerY,
    vx: 0,
    vy: 0,
    targetX: centerX,
    targetY: centerY,
    size: Math.max(3, 12 - i * 1.2),
    opacity: Math.max(0.2, 1 - i * 0.1),
  }))
}
