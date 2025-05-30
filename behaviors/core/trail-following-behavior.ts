import type { ParticleBehavior, BehaviorConfig } from "../../types/behavior-plugin"

interface TrailFollowingConfig extends BehaviorConfig {
  followForce: number
  trailDistance: number
  stopThreshold: number
}

export const trailFollowingBehavior: ParticleBehavior = {
  id: "trail-following",
  name: "Trail Following",
  description: "Makes particles follow the cursor in a trail formation",
  version: "1.0.0",
  priority: 80,

  defaultConfig: {
    enabled: true,
    priority: 80,
    followForce: 0.025,
    trailDistance: 40,
    stopThreshold: 2,
  },

  config: {} as TrailFollowingConfig,

  update(particle, index, context) {
    const { particles, mouse, systemState, isMouseStopped } = context
    const config = this.config as TrailFollowingConfig

    if (systemState.isCircleFormation || isMouseStopped) return

    let targetX, targetY

    if (index === 0) {
      // First particle follows the cursor
      targetX = particle.targetX
      targetY = particle.targetY
    } else {
      // Other particles follow the particle in front of them
      const leader = particles[index - 1]
      const dx = leader.x - particle.x
      const dy = leader.y - particle.y
      const distance = Math.sqrt(dx * dx + dy * dy)

      if (distance > config.trailDistance) {
        const angle = Math.atan2(dy, dx)
        targetX = leader.x - Math.cos(angle) * config.trailDistance
        targetY = leader.y - Math.sin(angle) * config.trailDistance
      } else {
        targetX = particle.x
        targetY = particle.y
      }
    }

    // Apply following force
    if (index === 0 && !mouse.isMoving && !isMouseStopped) {
      // First particle moves to cursor when mouse stops
      const dx = targetX - particle.x
      const dy = targetY - particle.y
      const distance = Math.sqrt(dx * dx + dy * dy)

      if (distance > config.stopThreshold) {
        particle.vx += dx * config.followForce * 2
        particle.vy += dy * config.followForce * 2
      } else {
        particle.x = targetX
        particle.y = targetY
        particle.vx = 0
        particle.vy = 0
      }
    } else if (!isMouseStopped) {
      // Normal following behavior
      const dx = targetX - particle.x
      const dy = targetY - particle.y
      const distance = Math.sqrt(dx * dx + dy * dy)

      if (distance > config.stopThreshold) {
        particle.vx += dx * config.followForce
        particle.vy += dy * config.followForce
      }
    }
  },

  validateConfig(config) {
    const c = config as Partial<TrailFollowingConfig>
    return !!(
      c.followForce &&
      c.followForce > 0 &&
      c.trailDistance &&
      c.trailDistance > 0 &&
      c.stopThreshold !== undefined
    )
  },
}
