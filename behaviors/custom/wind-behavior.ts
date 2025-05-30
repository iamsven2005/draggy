import type { ParticleBehavior, BehaviorConfig } from "../../types/behavior-plugin"

interface WindConfig extends BehaviorConfig {
  windStrength: number
  windDirection: number // in radians
  turbulence: number
  gustFrequency: number
}

export const windBehavior: ParticleBehavior = {
  id: "wind",
  name: "Wind",
  description: "Applies wind forces with turbulence and gusts",
  version: "1.0.0",
  priority: 20,

  defaultConfig: {
    enabled: false,
    priority: 20,
    windStrength: 0.002,
    windDirection: 0, // right
    turbulence: 0.5,
    gustFrequency: 0.001,
  },

  config: {} as WindConfig,

  update(particle, index, context) {
    const config = this.config as WindConfig
    const { currentTime } = context

    // Base wind force
    const windX = Math.cos(config.windDirection) * config.windStrength
    const windY = Math.sin(config.windDirection) * config.windStrength

    // Add turbulence
    const turbulenceX = (Math.random() - 0.5) * config.turbulence * config.windStrength
    const turbulenceY = (Math.random() - 0.5) * config.turbulence * config.windStrength

    // Add gusts (time-based)
    const gustFactor = 1 + Math.sin(currentTime * config.gustFrequency + index) * 0.5

    particle.vx += (windX + turbulenceX) * gustFactor
    particle.vy += (windY + turbulenceY) * gustFactor
  },

  validateConfig(config) {
    const c = config as Partial<WindConfig>
    return !!(
      c.windStrength !== undefined &&
      c.windDirection !== undefined &&
      c.turbulence !== undefined &&
      c.gustFrequency !== undefined
    )
  },
}
