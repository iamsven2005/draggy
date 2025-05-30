import type { Particle } from "../types/particle"
import { PHYSICS_CONSTANTS } from "../constants/physics"

export function calculateDistance(x1: number, y1: number, x2: number, y2: number): number {
  return Math.sqrt(Math.pow(x2 - x1, 2) + Math.pow(y2 - y1, 2))
}

export function normalizeVector(dx: number, dy: number): { x: number; y: number; length: number } {
  const length = Math.sqrt(dx * dx + dy * dy)
  return {
    x: length > 0 ? dx / length : 0,
    y: length > 0 ? dy / length : 0,
    length,
  }
}

export function applyCentrifugalForce(
  particle: Particle,
  centerX: number,
  centerY: number,
  rotationSpeed: number,
): void {
  if (rotationSpeed <= PHYSICS_CONSTANTS.centrifugalThreshold) return

  const centerDx = particle.x - centerX
  const centerDy = particle.y - centerY
  const centerDistance = Math.sqrt(centerDx * centerDx + centerDy * centerDy)

  if (centerDistance > 0) {
    const speedExcess = rotationSpeed - PHYSICS_CONSTANTS.centrifugalThreshold
    const centrifugalForce = speedExcess * PHYSICS_CONSTANTS.centrifugalForceMultiplier
    const randomFactor = 0.8 + Math.random() * 0.4

    particle.vx += (centerDx / centerDistance) * centrifugalForce * randomFactor
    particle.vy += (centerDy / centerDistance) * centrifugalForce * randomFactor
  }
}

export function calculateCentrifugalExpansion(rotationSpeed: number): number {
  if (rotationSpeed <= PHYSICS_CONSTANTS.centrifugalThreshold) return 0

  const speedExcess = rotationSpeed - PHYSICS_CONSTANTS.centrifugalThreshold
  const maxSpeedExcess = PHYSICS_CONSTANTS.maxRotationSpeed - PHYSICS_CONSTANTS.centrifugalThreshold
  const expansionFactor = speedExcess / maxSpeedExcess
  return expansionFactor * PHYSICS_CONSTANTS.maxCentrifugalExpansion
}

export function handleWallCollisions(particle: Particle, canvasWidth: number, canvasHeight: number): void {
  const radius = particle.size

  if (particle.x - radius <= 0) {
    particle.x = radius
    particle.vx = Math.abs(particle.vx) * PHYSICS_CONSTANTS.bounceForce
  }
  if (particle.x + radius >= canvasWidth) {
    particle.x = canvasWidth - radius
    particle.vx = -Math.abs(particle.vx) * PHYSICS_CONSTANTS.bounceForce
  }
  if (particle.y - radius <= 0) {
    particle.y = radius
    particle.vy = Math.abs(particle.vy) * PHYSICS_CONSTANTS.bounceForce
  }
  if (particle.y + radius >= canvasHeight) {
    particle.y = canvasHeight - radius
    particle.vy = -Math.abs(particle.vy) * PHYSICS_CONSTANTS.bounceForce
  }
}
