import type { ParticleBehavior, BehaviorConfig } from "../../types/behavior-plugin"

interface LineFormationConfig extends BehaviorConfig {
  lineFormationForce: number
  lineSpacing: number
  lineAngle: number
}

export const lineFormationBehavior: ParticleBehavior = {
  id: "line-formation",
  name: "Line Formation",
  description: "Forms particles in a straight line when mouse stops moving",
  version: "1.0.0",
  priority: 70,

  defaultConfig: {
    enabled: true,
    priority: 70,
    lineFormationForce: 0.03,
    lineSpacing: 25,
    lineAngle: Math.PI / 4, // 45 degrees
  },

  config: {} as LineFormationConfig,

  update(particle, index, context) {
    const { particles, mouse, isMouseStopped } = context
    const config = this.config as LineFormationConfig

    if (!isMouseStopped || mouse.x <= 0 || mouse.y <= 0) return

    // Sort particles by size to determine line position
    const sortedParticles = [...particles].sort((a, b) => b.size - a.size)
    const biggestParticle = sortedParticles[0]
    const secondBiggestParticle = sortedParticles[1]

    let linePosition = 0
    if (particle === biggestParticle) {
      linePosition = 0
    } else if (particle === secondBiggestParticle) {
      linePosition = 1
    } else {
      linePosition = sortedParticles.findIndex((p) => p === particle)
    }

    // Calculate line position
    const lineX = mouse.x + Math.cos(config.lineAngle) * (config.lineSpacing * (linePosition + 1))
    const lineY = mouse.y + Math.sin(config.lineAngle) * (config.lineSpacing * (linePosition + 1))

    // Apply formation force
    const dx = lineX - particle.x
    const dy = lineY - particle.y

    particle.vx += dx * config.lineFormationForce
    particle.vy += dy * config.lineFormationForce
  },

  validateConfig(config) {
    const c = config as Partial<LineFormationConfig>
    return !!(c.lineFormationForce && c.lineFormationForce > 0 && c.lineSpacing && c.lineSpacing > 0)
  },
}
