import type { ParticleBehavior, BehaviorConfig } from "../../types/behavior-plugin"

interface MouseRepulsionConfig extends BehaviorConfig {
  repelDistance: number
  repelForce: number
  onlyWhenNotInFormation: boolean
}

export const mouseRepulsionBehavior: ParticleBehavior = {
  id: "mouse-repulsion",
  name: "Mouse Repulsion",
  description: "Repels particles when mouse cursor gets close to them",
  version: "1.0.0",
  priority: 90,

  defaultConfig: {
    enabled: true,
    priority: 90,
    repelDistance: 50,
    repelForce: 0.8,
    onlyWhenNotInFormation: true,
  },

  config: {} as MouseRepulsionConfig,

  update(particle, index, context) {
    const { mouse, systemState } = context
    const config = this.config as MouseRepulsionConfig

    if (config.onlyWhenNotInFormation && systemState.isCircleFormation) return

    const mouseDistance = Math.sqrt(Math.pow(mouse.x - particle.x, 2) + Math.pow(mouse.y - particle.y, 2))

    if (mouseDistance < config.repelDistance && mouse.x > 0 && mouse.y > 0) {
      const dx = particle.x - mouse.x
      const dy = particle.y - mouse.y
      const distance = Math.sqrt(dx * dx + dy * dy)

      if (distance > 0) {
        const repelStrength = (config.repelDistance - distance) / config.repelDistance
        particle.vx += (dx / distance) * config.repelForce * repelStrength
        particle.vy += (dy / distance) * config.repelForce * repelStrength
      }
    }
  },

  validateConfig(config) {
    const c = config as Partial<MouseRepulsionConfig>
    return !!(c.repelDistance && c.repelDistance > 0 && c.repelForce && c.repelForce > 0)
  },
}
