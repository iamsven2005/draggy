import type { ParticleBehavior, BehaviorConfig } from "../../types/behavior-plugin"
import { PHYSICS_CONSTANTS } from "../../constants/physics"

interface CircleFormationConfig extends BehaviorConfig {
  baseRadius: number
  radiusMultiplier: number
  formationForce: number
  centrifugalThreshold: number
  centrifugalForceMultiplier: number
  maxExpansion: number
}

export const circleFormationBehavior: ParticleBehavior = {
  id: "circle-formation",
  name: "Circle Formation",
  description: "Makes particles form a rotating circle around the cursor when clicked",
  version: "1.0.0",
  priority: 100,

  defaultConfig: {
    enabled: true,
    priority: 100,
    baseRadius: 80,
    radiusMultiplier: 2,
    formationForce: 0.04,
    centrifugalThreshold: 0.004,
    centrifugalForceMultiplier: 50,
    maxExpansion: 100,
  },

  config: {} as CircleFormationConfig,

  update(particle, index, context) {
    const { mouse, systemState, particles } = context
    const config = this.config as CircleFormationConfig

    if (!systemState.isCircleFormation || mouse.x <= 0 || mouse.y <= 0) return

    // Calculate circle position
    const baseCircleRadius = config.baseRadius + particle.size * config.radiusMultiplier

    // Add centrifugal expansion
    let centrifugalExpansion = 0
    if (systemState.rotationSpeed > config.centrifugalThreshold) {
      const speedExcess = systemState.rotationSpeed - config.centrifugalThreshold
      const maxSpeedExcess = PHYSICS_CONSTANTS.maxRotationSpeed - config.centrifugalThreshold
      const expansionFactor = speedExcess / maxSpeedExcess
      centrifugalExpansion = expansionFactor * config.maxExpansion
    }

    const circleRadius = baseCircleRadius + centrifugalExpansion
    const angleStep = (Math.PI * 2) / particles.length
    const baseAngle = angleStep * index
    const rotatedAngle = baseAngle + systemState.rotationAngle

    const circleX = mouse.x + Math.cos(rotatedAngle) * circleRadius
    const circleY = mouse.y + Math.sin(rotatedAngle) * circleRadius

    // Apply formation force
    const dx = circleX - particle.x
    const dy = circleY - particle.y
    const adjustedForce = config.formationForce * (1 + systemState.rotationSpeed * 1000)

    particle.vx += dx * adjustedForce
    particle.vy += dy * adjustedForce

    // Apply centrifugal force
    if (systemState.rotationSpeed > config.centrifugalThreshold) {
      const centerDx = particle.x - mouse.x
      const centerDy = particle.y - mouse.y
      const centerDistance = Math.sqrt(centerDx * centerDx + centerDy * centerDy)

      if (centerDistance > 0) {
        const speedExcess = systemState.rotationSpeed - config.centrifugalThreshold
        const centrifugalForce = speedExcess * config.centrifugalForceMultiplier
        const randomFactor = 0.8 + Math.random() * 0.4

        particle.vx += (centerDx / centerDistance) * centrifugalForce * randomFactor
        particle.vy += (centerDy / centerDistance) * centrifugalForce * randomFactor
      }
    }
  },

  validateConfig(config) {
    const c = config as Partial<CircleFormationConfig>
    return !!(
      c.baseRadius &&
      c.baseRadius > 0 &&
      c.formationForce &&
      c.formationForce > 0 &&
      c.centrifugalThreshold &&
      c.centrifugalThreshold > 0
    )
  },
}
