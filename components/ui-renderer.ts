import type { MouseState, ParticleSystemState } from "../types/particle"
import { PHYSICS_CONSTANTS, VISUAL_CONSTANTS } from "../constants/physics"
import { calculateCentrifugalExpansion } from "../utils/physics"

export function renderUI(
  ctx: CanvasRenderingContext2D,
  mouse: MouseState,
  systemState: ParticleSystemState,
  isMouseStopped: boolean,
): void {
  if (systemState.isCircleFormation && mouse.x > 0 && mouse.y > 0) {
    renderCircleGuides(ctx, mouse, systemState)
    renderRotationIndicator(ctx, mouse, systemState)
    renderSpeedIndicator(ctx, mouse, systemState)
  }

  if (mouse.x > 0 && mouse.y > 0) {
    renderCursor(ctx, mouse, systemState, isMouseStopped)
  }

  if (isMouseStopped && mouse.x > 0 && mouse.y > 0) {
    renderLineGuide(ctx, mouse)
  }
}

function renderCircleGuides(ctx: CanvasRenderingContext2D, mouse: MouseState, systemState: ParticleSystemState): void {
  const baseCircleRadius = VISUAL_CONSTANTS.baseCircleRadius
  const centrifugalExpansion = calculateCentrifugalExpansion(systemState.rotationSpeed)
  const expandedRadius = baseCircleRadius + centrifugalExpansion

  // Original circle guide
  ctx.strokeStyle = "rgba(147, 51, 234, 0.2)"
  ctx.lineWidth = 1
  ctx.setLineDash([3, 3])
  ctx.beginPath()
  ctx.arc(mouse.x, mouse.y, baseCircleRadius, 0, Math.PI * 2)
  ctx.stroke()

  // Expanded circle guide
  if (systemState.rotationSpeed > PHYSICS_CONSTANTS.centrifugalThreshold) {
    ctx.strokeStyle = "rgba(255, 100, 100, 0.4)"
    ctx.lineWidth = 2
    ctx.setLineDash([5, 5])
    ctx.beginPath()
    ctx.arc(mouse.x, mouse.y, expandedRadius, 0, Math.PI * 2)
    ctx.stroke()
  }

  ctx.setLineDash([])
}

function renderRotationIndicator(
  ctx: CanvasRenderingContext2D,
  mouse: MouseState,
  systemState: ParticleSystemState,
): void {
  const centrifugalExpansion = calculateCentrifugalExpansion(systemState.rotationSpeed)
  const expandedRadius = VISUAL_CONSTANTS.baseCircleRadius + centrifugalExpansion

  ctx.strokeStyle = "rgba(147, 51, 234, 0.8)"
  ctx.lineWidth = 2
  ctx.beginPath()
  ctx.moveTo(mouse.x, mouse.y)

  const indicatorX = mouse.x + Math.cos(systemState.rotationAngle) * (expandedRadius + 10)
  const indicatorY = mouse.y + Math.sin(systemState.rotationAngle) * (expandedRadius + 10)
  ctx.lineTo(indicatorX, indicatorY)
  ctx.stroke()

  // Arrow
  ctx.beginPath()
  const arrowAngle = systemState.rotationAngle + Math.PI / 2
  ctx.moveTo(indicatorX, indicatorY)
  ctx.lineTo(
    indicatorX + Math.cos(arrowAngle) * VISUAL_CONSTANTS.arrowSize,
    indicatorY + Math.sin(arrowAngle) * VISUAL_CONSTANTS.arrowSize,
  )
  ctx.lineTo(
    indicatorX + Math.cos(arrowAngle + Math.PI) * VISUAL_CONSTANTS.arrowSize,
    indicatorY + Math.sin(arrowAngle + Math.PI) * VISUAL_CONSTANTS.arrowSize,
  )
  ctx.closePath()
  ctx.fillStyle = "rgba(147, 51, 234, 0.8)"
  ctx.fill()
}

function renderSpeedIndicator(
  ctx: CanvasRenderingContext2D,
  mouse: MouseState,
  systemState: ParticleSystemState,
): void {
  const speedPercentage =
    ((systemState.rotationSpeed - PHYSICS_CONSTANTS.initialRotationSpeed) /
      (PHYSICS_CONSTANTS.maxRotationSpeed - PHYSICS_CONSTANTS.initialRotationSpeed)) *
    100

  const centrifugalExpansion = calculateCentrifugalExpansion(systemState.rotationSpeed)
  const expandedRadius = VISUAL_CONSTANTS.baseCircleRadius + centrifugalExpansion

  const speedBarX = mouse.x - VISUAL_CONSTANTS.speedBarWidth / 2
  const speedBarY = mouse.y + expandedRadius + 20

  // Background
  ctx.fillStyle = "rgba(255, 255, 255, 0.2)"
  ctx.fillRect(speedBarX, speedBarY, VISUAL_CONSTANTS.speedBarWidth, VISUAL_CONSTANTS.speedBarHeight)

  // Fill
  const isHighSpeed = systemState.rotationSpeed > PHYSICS_CONSTANTS.centrifugalThreshold
  ctx.fillStyle = isHighSpeed
    ? `hsl(${0 + speedPercentage * 0.5}, 70%, 60%)`
    : `hsl(${280 + speedPercentage * 1.2}, 70%, 60%)`
  ctx.fillRect(
    speedBarX,
    speedBarY,
    VISUAL_CONSTANTS.speedBarWidth * (speedPercentage / 100),
    VISUAL_CONSTANTS.speedBarHeight,
  )

  // Text
  ctx.font = "12px Arial"
  ctx.fillStyle = isHighSpeed ? "rgba(255, 100, 100, 0.9)" : "rgba(255, 255, 255, 0.8)"
  ctx.textAlign = "center"
  const speedText = isHighSpeed
    ? `CENTRIFUGAL: ${Math.round(speedPercentage)}%`
    : `Speed: ${Math.round(speedPercentage)}%`
  ctx.fillText(speedText, mouse.x, speedBarY + VISUAL_CONSTANTS.speedBarHeight + 15)
}

function renderCursor(
  ctx: CanvasRenderingContext2D,
  mouse: MouseState,
  systemState: ParticleSystemState,
  isMouseStopped: boolean,
): void {
  ctx.beginPath()
  ctx.arc(mouse.x, mouse.y, 3, 0, Math.PI * 2)

  let cursorColor = "rgba(239, 68, 68, 0.8)"
  if (systemState.isCircleFormation) {
    const isHighSpeed = systemState.rotationSpeed > PHYSICS_CONSTANTS.centrifugalThreshold
    cursorColor = isHighSpeed ? "rgba(255, 100, 100, 0.8)" : "rgba(147, 51, 234, 0.8)"
  } else if (isMouseStopped) {
    cursorColor = "rgba(34, 197, 94, 0.8)"
  }

  ctx.fillStyle = cursorColor
  ctx.fill()
}

function renderLineGuide(ctx: CanvasRenderingContext2D, mouse: MouseState): void {
  ctx.strokeStyle = "rgba(34, 197, 94, 0.3)"
  ctx.lineWidth = 1
  ctx.setLineDash([5, 5])
  ctx.beginPath()
  ctx.moveTo(mouse.x, mouse.y)

  const endX =
    mouse.x + Math.cos(VISUAL_CONSTANTS.lineAngle) * (VISUAL_CONSTANTS.lineSpacing * VISUAL_CONSTANTS.particleCount)
  const endY =
    mouse.y + Math.sin(VISUAL_CONSTANTS.lineAngle) * (VISUAL_CONSTANTS.lineSpacing * VISUAL_CONSTANTS.particleCount)
  ctx.lineTo(endX, endY)
  ctx.stroke()
  ctx.setLineDash([])
}
