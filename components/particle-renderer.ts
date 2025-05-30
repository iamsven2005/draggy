import type { Particle, MouseState, ParticleSystemState } from "../types/particle"
import { PHYSICS_CONSTANTS, VISUAL_CONSTANTS, COLORS } from "../constants/physics"
import { calculateCentrifugalExpansion } from "../utils/physics"

export function renderParticles(
  ctx: CanvasRenderingContext2D,
  particles: Particle[],
  mouse: MouseState,
  systemState: ParticleSystemState,
  isMouseHovering: boolean[],
  isColliding: boolean[],
): void {
  particles.forEach((particle, index) => {
    ctx.globalAlpha = particle.opacity

    ctx.beginPath()
    ctx.arc(particle.x, particle.y, particle.size, 0, Math.PI * 2)

    const hue = calculateParticleHue(particle, index, systemState, isMouseHovering[index], isColliding[index])

    if (systemState.isCircleFormation) {
      const speedFactor =
        ((systemState.rotationSpeed - PHYSICS_CONSTANTS.initialRotationSpeed) /
          (PHYSICS_CONSTANTS.maxRotationSpeed - PHYSICS_CONSTANTS.initialRotationSpeed)) *
        100
      const saturation = 70 + Math.min(speedFactor / 2, 30)
      const lightness = 60 - Math.min(speedFactor / 4, 15)
      ctx.fillStyle = `hsl(${hue}, ${saturation}%, ${lightness}%)`
      ctx.strokeStyle = `hsl(${hue}, ${saturation}%, ${lightness - 20}%)`
    } else {
      ctx.fillStyle = `hsl(${hue}, 70%, 60%)`
      ctx.strokeStyle = `hsl(${hue}, 70%, 40%)`
    }

    ctx.fill()
    ctx.lineWidth = isMouseHovering[index] || isColliding[index] || systemState.isCircleFormation ? 2 : 1
    ctx.stroke()

    if (isMouseHovering[index]) {
      ctx.globalAlpha = 0.1
      ctx.beginPath()
      ctx.arc(particle.x, particle.y, PHYSICS_CONSTANTS.repelDistance, 0, Math.PI * 2)
      ctx.fillStyle = "rgba(255, 0, 0, 0.1)"
      ctx.fill()
    }

    if (systemState.isCircleFormation) {
      renderParticleTrail(ctx, particle, index, mouse, systemState, hue)
    }
  })

  ctx.globalAlpha = 1
}

function calculateParticleHue(
  particle: Particle,
  index: number,
  systemState: ParticleSystemState,
  isMouseHovering: boolean,
  isColliding: boolean,
): number {
  if (isMouseHovering) return COLORS.repelHue
  if (isColliding) return COLORS.collisionHue

  if (systemState.isCircleFormation) {
    const isHighSpeed = systemState.rotationSpeed > PHYSICS_CONSTANTS.centrifugalThreshold

    if (isHighSpeed) {
      return (
        (0 +
          (index * COLORS.centrifugalHueRange) / VISUAL_CONSTANTS.particleCount +
          (systemState.rotationAngle * 180) / Math.PI) %
        COLORS.centrifugalHueRange
      )
    } else {
      return (
        (COLORS.circleFormationHue +
          (index * 360) / VISUAL_CONSTANTS.particleCount +
          (systemState.rotationAngle * 180) / Math.PI) %
        360
      )
    }
  }

  return COLORS.defaultHue + index * 10
}

function renderParticleTrail(
  ctx: CanvasRenderingContext2D,
  particle: Particle,
  index: number,
  mouse: MouseState,
  systemState: ParticleSystemState,
  hue: number,
): void {
  ctx.globalAlpha = 0.2
  ctx.beginPath()

  const speedFactor =
    (systemState.rotationSpeed - PHYSICS_CONSTANTS.initialRotationSpeed) /
    (PHYSICS_CONSTANTS.maxRotationSpeed - PHYSICS_CONSTANTS.initialRotationSpeed)
  const trailLength = 0.2 + speedFactor * 1.2

  const baseCircleRadius = VISUAL_CONSTANTS.baseCircleRadius + particle.size * 2
  const centrifugalExpansion = calculateCentrifugalExpansion(systemState.rotationSpeed)
  const circleRadius = baseCircleRadius + centrifugalExpansion

  const angleStep = (Math.PI * 2) / VISUAL_CONSTANTS.particleCount
  const baseAngle = angleStep * index
  const startAngle = baseAngle + systemState.rotationAngle - trailLength
  const endAngle = baseAngle + systemState.rotationAngle

  ctx.arc(mouse.x, mouse.y, circleRadius, startAngle, endAngle)
  ctx.strokeStyle = `hsl(${hue}, 70%, 60%)`
  ctx.lineWidth = particle.size * (0.8 + speedFactor * 0.6)
  ctx.stroke()
}
