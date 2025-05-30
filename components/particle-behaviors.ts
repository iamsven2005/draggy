import type { Particle, MouseState, ParticleSystemState } from "../types/particle"
import { PHYSICS_CONSTANTS, VISUAL_CONSTANTS } from "../constants/physics"
import { calculateDistance, applyCentrifugalForce } from "../utils/physics"

export function applyCircleFormation(
  particle: Particle,
  index: number,
  mouse: MouseState,
  systemState: ParticleSystemState,
  totalParticles: number,
): void {
  if (!systemState.isCircleFormation || mouse.x <= 0 || mouse.y <= 0) return

  const baseCircleRadius = VISUAL_CONSTANTS.baseCircleRadius + particle.size * 2
  const centrifugalExpansion = calculateCentrifugalExpansion(systemState.rotationSpeed)
  const circleRadius = baseCircleRadius + centrifugalExpansion

  const angleStep = (Math.PI * 2) / totalParticles
  const baseAngle = angleStep * index
  const rotatedAngle = baseAngle + systemState.rotationAngle

  const circleX = mouse.x + Math.cos(rotatedAngle) * circleRadius
  const circleY = mouse.y + Math.sin(rotatedAngle) * circleRadius

  const dx = circleX - particle.x
  const dy = circleY - particle.y

  const adjustedForce = PHYSICS_CONSTANTS.circleFormationForce * (1 + systemState.rotationSpeed * 1000)
  particle.vx += dx * adjustedForce
  particle.vy += dy * adjustedForce

  applyCentrifugalForce(particle, mouse.x, mouse.y, systemState.rotationSpeed)
}

export function applyMouseRepulsion(particle: Particle, mouse: MouseState): boolean {
  const mouseDistance = calculateDistance(mouse.x, mouse.y, particle.x, particle.y)
  const isMouseHovering = mouseDistance < PHYSICS_CONSTANTS.repelDistance

  if (isMouseHovering && mouse.x > 0 && mouse.y > 0) {
    const dx = particle.x - mouse.x
    const dy = particle.y - mouse.y
    const distance = Math.sqrt(dx * dx + dy * dy)

    if (distance > 0) {
      const repelStrength = (PHYSICS_CONSTANTS.repelDistance - distance) / PHYSICS_CONSTANTS.repelDistance
      particle.vx += (dx / distance) * PHYSICS_CONSTANTS.repelForce * repelStrength
      particle.vy += (dy / distance) * PHYSICS_CONSTANTS.repelForce * repelStrength
    }
  }

  return isMouseHovering
}

export function applyLineFormation(
  particle: Particle,
  particles: Particle[],
  mouse: MouseState,
  isMouseStopped: boolean,
): void {
  if (!isMouseStopped || mouse.x <= 0 || mouse.y <= 0) return

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

  const lineX = mouse.x + Math.cos(VISUAL_CONSTANTS.lineAngle) * (VISUAL_CONSTANTS.lineSpacing * (linePosition + 1))
  const lineY = mouse.y + Math.sin(VISUAL_CONSTANTS.lineAngle) * (VISUAL_CONSTANTS.lineSpacing * (linePosition + 1))

  const dx = lineX - particle.x
  const dy = lineY - particle.y

  particle.vx += dx * PHYSICS_CONSTANTS.lineFormationForce
  particle.vy += dy * PHYSICS_CONSTANTS.lineFormationForce
}

export function applyTrailFollowing(
  particle: Particle,
  index: number,
  particles: Particle[],
  mouse: MouseState,
  systemState: ParticleSystemState,
  isMouseStopped: boolean,
): void {
  if (systemState.isCircleFormation || isMouseStopped) return

  let targetX, targetY

  if (index === 0) {
    targetX = particle.targetX
    targetY = particle.targetY
  } else {
    const leader = particles[index - 1]
    const dx = leader.x - particle.x
    const dy = leader.y - particle.y
    const distance = Math.sqrt(dx * dx + dy * dy)

    if (distance > PHYSICS_CONSTANTS.trailDistance) {
      const angle = Math.atan2(dy, dx)
      targetX = leader.x - Math.cos(angle) * PHYSICS_CONSTANTS.trailDistance
      targetY = leader.y - Math.sin(angle) * PHYSICS_CONSTANTS.trailDistance
    } else {
      targetX = particle.x
      targetY = particle.y
    }
  }

  if (index === 0 && !mouse.isMoving && !isMouseStopped) {
    const dx = targetX - particle.x
    const dy = targetY - particle.y
    const distance = Math.sqrt(dx * dx + dy * dy)

    if (distance > PHYSICS_CONSTANTS.stopThreshold) {
      particle.vx += dx * PHYSICS_CONSTANTS.followForce * 2
      particle.vy += dy * PHYSICS_CONSTANTS.followForce * 2
    } else {
      particle.x = targetX
      particle.y = targetY
      particle.vx = 0
      particle.vy = 0
    }
  } else if (!isMouseStopped) {
    const dx = targetX - particle.x
    const dy = targetY - particle.y
    const distance = Math.sqrt(dx * dx + dy * dy)

    if (distance > PHYSICS_CONSTANTS.stopThreshold) {
      particle.vx += dx * PHYSICS_CONSTANTS.followForce
      particle.vy += dy * PHYSICS_CONSTANTS.followForce
    }
  }
}

function calculateCentrifugalExpansion(rotationSpeed: number): number {
  if (rotationSpeed <= PHYSICS_CONSTANTS.centrifugalThreshold) return 0

  const speedExcess = rotationSpeed - PHYSICS_CONSTANTS.centrifugalThreshold
  const maxSpeedExcess = PHYSICS_CONSTANTS.maxRotationSpeed - PHYSICS_CONSTANTS.centrifugalThreshold
  const expansionFactor = speedExcess / maxSpeedExcess
  return expansionFactor * PHYSICS_CONSTANTS.maxCentrifugalExpansion
}
