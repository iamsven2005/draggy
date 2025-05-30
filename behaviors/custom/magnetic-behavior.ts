import type { ParticleBehavior, BehaviorConfig } from "../../types/behavior-plugin"

interface MagneticConfig extends BehaviorConfig {
  magneticStrength: number
  attractionRadius: number
  particleInteraction: boolean
}

export const magneticBehavior: ParticleBehavior = {
  id: "magnetic",
  name: "Magnetic Field",
  description: "Creates magnetic attraction/repulsion between particles",
  version: "1.0.0",
  priority: 30,

  defaultConfig: {
    enabled: false,
    priority: 30,
    magneticStrength: 0.01,
    attractionRadius: 100,
    particleInteraction: true,
  },

  config: {} as MagneticConfig,

  update(particle, index, context) {
    const config = this.config as MagneticConfig
    const { particles } = context

    if (!config.particleInteraction) return

    particles.forEach((otherParticle, otherIndex) => {
      if (index === otherIndex) return

      const dx = otherParticle.x - particle.x
      const dy = otherParticle.y - particle.y
      const distance = Math.sqrt(dx * dx + dy * dy)

      if (distance < config.attractionRadius && distance > 0) {
        const force = config.magneticStrength / (distance * distance)
        const forceX = (dx / distance) * force
        const forceY = (dy / distance) * force

        // Larger particles attract smaller ones
        const sizeDiff = otherParticle.size - particle.size
        const attractionFactor = sizeDiff > 0 ? 1 : -0.5 // Repel if same size or smaller

        particle.vx += forceX * attractionFactor
        particle.vy += forceY * attractionFactor
      }
    })
  },

  validateConfig(config) {
    const c = config as Partial<MagneticConfig>
    return !!(c.magneticStrength !== undefined && c.attractionRadius && c.attractionRadius > 0)
  },
}
