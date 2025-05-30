import type { ParticleBehavior, BehaviorConfig } from "../../types/behavior-plugin"

interface GravityConfig extends BehaviorConfig {
  gravityStrength: number
  direction: "down" | "up" | "left" | "right" | "center"
  centerX?: number
  centerY?: number
}

export const gravityBehavior: ParticleBehavior = {
  id: "gravity",
  name: "Gravity",
  description: "Applies gravitational force to particles",
  version: "1.0.0",
  priority: 10,

  defaultConfig: {
    enabled: false,
    priority: 10,
    gravityStrength: 0.001,
    direction: "down" as const,
  },

  config: {} as GravityConfig,

  update(particle, index, context) {
    const config = this.config as GravityConfig
    const { canvasWidth, canvasHeight, mouse } = context

    switch (config.direction) {
      case "down":
        particle.vy += config.gravityStrength
        break
      case "up":
        particle.vy -= config.gravityStrength
        break
      case "left":
        particle.vx -= config.gravityStrength
        break
      case "right":
        particle.vx += config.gravityStrength
        break
      case "center":
        const centerX = config.centerX ?? mouse.x ?? canvasWidth / 2
        const centerY = config.centerY ?? mouse.y ?? canvasHeight / 2
        const dx = centerX - particle.x
        const dy = centerY - particle.y
        const distance = Math.sqrt(dx * dx + dy * dy)

        if (distance > 0) {
          particle.vx += (dx / distance) * config.gravityStrength
          particle.vy += (dy / distance) * config.gravityStrength
        }
        break
    }
  },

  validateConfig(config) {
    const c = config as Partial<GravityConfig>
    return !!(c.gravityStrength !== undefined && c.direction)
  },
}
