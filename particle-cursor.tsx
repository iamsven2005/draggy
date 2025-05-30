"use client"

import { useEffect, useRef, useState } from "react"
import { useMobile } from "./hooks/use-mobile"
import { useMouse } from "./hooks/use-mouse"
import { useParticleSystem } from "./hooks/use-particle-system"
import { createParticles } from "./utils/particle-factory"
import { handleWallCollisions } from "./utils/physics"
import { PHYSICS_CONSTANTS } from "./constants/physics"
import { handleParticleCollisions, checkParticleCollision } from "./components/particle-collisions"
import { renderParticles } from "./components/particle-renderer"
import { renderUI } from "./components/ui-renderer"
import { behaviorManager } from "./core/behavior-manager"
import { loadAllBehaviors } from "./behaviors/behavior-loader"
import { BehaviorControlPanel } from "./components/behavior-control-panel"
import { MobileControls } from "./components/mobile-controls"
import { hapticManager, HapticPatterns } from "./utils/haptic-feedback"
import type { BehaviorContext } from "./types/behavior-plugin"

export default function Component() {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const animationRef = useRef<number>()
  const [showBehaviorPanel, setShowBehaviorPanel] = useState(false)
  const [hapticEnabled, setHapticEnabled] = useState(true)
  const isDraggingRef = useRef(false)
  const touchStartTimeRef = useRef(0)
  const lastFormationChangeRef = useRef(0)
  const mouseOutOfBoundsRef = useRef(false)
  const ballModeActiveRef = useRef(false)
  const ballModeStartTimeRef = useRef(0)
  const ballRotationAngleRef = useRef(0)
  const ballRotationSpeedRef = useRef(PHYSICS_CONSTANTS.initialRotationSpeed)
  const lastBallClickTimeRef = useRef(0)

  const { isMobile, isTouchDevice } = useMobile()
  const { mouseRef, handleMouseMove, handleClick } = useMouse()
  const {
    particlesRef,
    systemStateRef,
    lastTimeRef,
    updateRotation,
    toggleCircleFormation,
    exitCircleFormation,
    updateLastMoveTime,
  } = useParticleSystem()

  // Check if mouse is out of bounds
  const checkMouseBounds = (x: number, y: number, canvas: HTMLCanvasElement): boolean => {
    return x < 0 || y < 0 || x > canvas.width || y > canvas.height
  }

  // Calculate ball formation position for particles
  const calculateBallPosition = (particle: any, index: number, centerX: number, centerY: number, time: number) => {
    const totalParticles = particlesRef.current.length

    // Base radius with pulsing effect
    const baseRadius = 60 + Math.sin(time * 0.001) * 10

    // Add centrifugal expansion based on rotation speed
    let centrifugalExpansion = 0
    if (ballRotationSpeedRef.current > PHYSICS_CONSTANTS.centrifugalThreshold) {
      const speedExcess = ballRotationSpeedRef.current - PHYSICS_CONSTANTS.centrifugalThreshold
      const maxSpeedExcess = PHYSICS_CONSTANTS.maxRotationSpeed - PHYSICS_CONSTANTS.centrifugalThreshold
      const expansionFactor = speedExcess / maxSpeedExcess
      centrifugalExpansion = expansionFactor * PHYSICS_CONSTANTS.maxCentrifugalExpansion
    }

    const radius = baseRadius + centrifugalExpansion

    // Arrange particles in a sphere-like pattern with rotation
    const phi = Math.acos(-1 + (2 * index) / totalParticles)
    const theta = Math.sqrt(totalParticles * Math.PI) * phi + ballRotationAngleRef.current

    const x = centerX + radius * Math.cos(theta) * Math.sin(phi)
    const y = centerY + radius * Math.sin(theta) * Math.sin(phi)

    return { x, y }
  }

  // Update ball rotation
  const updateBallRotation = (deltaTime: number) => {
    if (!ballModeActiveRef.current) return

    // Accelerate rotation over time, similar to circle formation
    ballRotationSpeedRef.current = Math.min(
      ballRotationSpeedRef.current + PHYSICS_CONSTANTS.accelerationRate * deltaTime,
      PHYSICS_CONSTANTS.maxRotationSpeed,
    )

    // Update rotation angle
    ballRotationAngleRef.current += ballRotationSpeedRef.current * deltaTime

    // Keep angle within 0-2π
    if (ballRotationAngleRef.current > Math.PI * 2) {
      ballRotationAngleRef.current -= Math.PI * 2
    }
  }

  // Apply ball mode behavior
  const applyBallMode = (currentTime: number, deltaTime: number) => {
    if (!ballModeActiveRef.current) return

    const canvas = canvasRef.current
    if (!canvas) return

    const centerX = canvas.width / 2
    const centerY = canvas.height / 2
    const timeSinceBallMode = currentTime - ballModeStartTimeRef.current

    // Update ball rotation
    updateBallRotation(deltaTime)

    particlesRef.current.forEach((particle, index) => {
      const targetPos = calculateBallPosition(particle, index, centerX, centerY, currentTime)

      // Smooth transition into ball formation
      const transitionFactor = Math.min(1, timeSinceBallMode / 1000) // 1 second transition
      const ballForce = 0.02 * transitionFactor

      const dx = targetPos.x - particle.x
      const dy = targetPos.y - particle.y

      particle.vx += dx * ballForce
      particle.vy += dy * ballForce

      // Apply centrifugal force at high speeds
      if (ballRotationSpeedRef.current > PHYSICS_CONSTANTS.centrifugalThreshold) {
        const centerDx = particle.x - centerX
        const centerDy = particle.y - centerY
        const centerDistance = Math.sqrt(centerDx * centerDx + centerDy * centerDy)

        if (centerDistance > 0) {
          const speedExcess = ballRotationSpeedRef.current - PHYSICS_CONSTANTS.centrifugalThreshold
          const centrifugalForce = speedExcess * PHYSICS_CONSTANTS.centrifugalForceMultiplier
          const randomFactor = 0.8 + Math.random() * 0.4

          particle.vx += (centerDx / centerDistance) * centrifugalForce * randomFactor
          particle.vy += (centerDy / centerDistance) * centrifugalForce * randomFactor

          // Trigger haptic feedback for high centrifugal force
          if (centrifugalForce > 1.5 && Math.random() < 0.05) {
            const intensity = Math.min(1, centrifugalForce / 5)
            hapticManager.triggerCollision(intensity)
          }
        }
      }

      // Add some gentle floating motion
      const floatForce = 0.001
      particle.vx += Math.sin(currentTime * 0.002 + index) * floatForce
      particle.vy += Math.cos(currentTime * 0.003 + index) * floatForce
    })
  }

  // Toggle ball rotation speed on click
  const accelerateBallRotation = () => {
    const now = Date.now()
    // Prevent rapid clicking
    if (now - lastBallClickTimeRef.current < 300) return

    lastBallClickTimeRef.current = now

    // Boost rotation speed
    ballRotationSpeedRef.current = Math.min(ballRotationSpeedRef.current * 1.5, PHYSICS_CONSTANTS.maxRotationSpeed)

    // Provide haptic feedback
    hapticManager.trigger(HapticPatterns.MEDIUM_TAP)
  }

  // Reset ball rotation to initial speed
  const resetBallRotation = () => {
    ballRotationSpeedRef.current = PHYSICS_CONSTANTS.initialRotationSpeed
  }

  // Toggle haptic feedback
  const toggleHaptic = () => {
    const newState = !hapticEnabled
    setHapticEnabled(newState)
    hapticManager.setEnabled(newState)

    // Provide feedback for the toggle itself
    if (newState) {
      hapticManager.trigger(HapticPatterns.SUCCESS)
    }
  }

  const updateParticleTarget = (x: number, y: number) => {
    if (particlesRef.current.length > 0) {
      particlesRef.current[0].targetX = x
      particlesRef.current[0].targetY = y
    }
  }

  const notifyBehaviorManager = (x: number, y: number, isMouseStopped = false) => {
    const canvas = canvasRef.current
    if (!canvas) return

    const context: BehaviorContext = {
      particles: particlesRef.current,
      mouse: { ...mouseRef.current, x, y },
      systemState: systemStateRef.current,
      canvasWidth: canvas.width,
      canvasHeight: canvas.height,
      deltaTime: 0,
      currentTime: Date.now(),
      isMouseStopped,
    }
    behaviorManager.onMouseMove(context)
  }

  // Handle circle formation toggle with haptic feedback
  const handleToggleCircleFormation = () => {
    const now = Date.now()
    // Prevent rapid toggling
    if (now - lastFormationChangeRef.current < 300) return

    lastFormationChangeRef.current = now
    toggleCircleFormation()

    // Exit ball mode when manually toggling circle formation
    if (ballModeActiveRef.current) {
      ballModeActiveRef.current = false
      resetBallRotation()
      hapticManager.trigger(HapticPatterns.MEDIUM_TAP)
    }

    // Provide haptic feedback based on the new state
    if (systemStateRef.current.isCircleFormation) {
      hapticManager.trigger(HapticPatterns.FORMATION)
    } else {
      hapticManager.trigger(HapticPatterns.MEDIUM_TAP)
    }
  }

  useEffect(() => {
    // Load all available behaviors
    loadAllBehaviors()

    const canvas = canvasRef.current
    if (!canvas) return

    const ctx = canvas.getContext("2d")
    if (!ctx) return

    // Set canvas size
    const resizeCanvas = () => {
      canvas.width = window.innerWidth
      canvas.height = window.innerHeight
    }
    resizeCanvas()
    window.addEventListener("resize", resizeCanvas)

    // Initialize particles
    particlesRef.current = createParticles(canvas.width / 2, canvas.height / 2)

    // Mouse leave handler
    const onMouseLeave = () => {
      mouseOutOfBoundsRef.current = true
      mouseRef.current.x = -1
      mouseRef.current.y = -1
    }

    // Mouse enter handler
    const onMouseEnter = () => {
      mouseOutOfBoundsRef.current = false
      if (ballModeActiveRef.current) {
        ballModeActiveRef.current = false
        resetBallRotation()
        hapticManager.trigger(HapticPatterns.LIGHT_TAP)
      }
    }

    // Mouse event handlers
    const onMouseMove = (e: MouseEvent) => {
      handleMouseMove(e, canvas)
      updateLastMoveTime()

      // Check if mouse is out of bounds
      const isOutOfBounds = checkMouseBounds(mouseRef.current.x, mouseRef.current.y, canvas)
      mouseOutOfBoundsRef.current = isOutOfBounds

      if (!isOutOfBounds) {
        // Mouse is back in bounds, exit ball mode
        if (ballModeActiveRef.current) {
          ballModeActiveRef.current = false
          resetBallRotation()
          hapticManager.trigger(HapticPatterns.LIGHT_TAP)
        }

        if (systemStateRef.current.isCircleFormation) {
          exitCircleFormation()
        }

        updateParticleTarget(mouseRef.current.x, mouseRef.current.y)
        notifyBehaviorManager(mouseRef.current.x, mouseRef.current.y)
      }
    }

    const onClick = (e: MouseEvent) => {
      handleClick(e, canvas)

      // If in ball mode, accelerate rotation instead of toggling circle formation
      if (ballModeActiveRef.current) {
        accelerateBallRotation()
        return
      }

      handleToggleCircleFormation()

      const context: BehaviorContext = {
        particles: particlesRef.current,
        mouse: mouseRef.current,
        systemState: systemStateRef.current,
        canvasWidth: canvas.width,
        canvasHeight: canvas.height,
        deltaTime: 0,
        currentTime: Date.now(),
        isMouseStopped: false,
      }
      behaviorManager.onMouseClick(context)
    }

    // Touch event handlers
    const onTouchStart = (e: TouchEvent) => {
      e.preventDefault()
      if (e.touches.length > 0) {
        const touch = e.touches[0]
        const rect = canvas.getBoundingClientRect()
        const x = touch.clientX - rect.left
        const y = touch.clientY - rect.top

        mouseRef.current.x = x
        mouseRef.current.y = y
        touchStartTimeRef.current = Date.now()
        isDraggingRef.current = false
        mouseOutOfBoundsRef.current = false

        // Exit ball mode on touch
        if (ballModeActiveRef.current) {
          ballModeActiveRef.current = false
          resetBallRotation()
          hapticManager.trigger(HapticPatterns.LIGHT_TAP)
        }

        // Light haptic feedback on touch start
        hapticManager.trigger(HapticPatterns.LIGHT_TAP)

        updateLastMoveTime()
        updateParticleTarget(x, y)
        notifyBehaviorManager(x, y)
      }
    }

    const onTouchMove = (e: TouchEvent) => {
      e.preventDefault()
      if (e.touches.length > 0) {
        const touch = e.touches[0]
        const rect = canvas.getBoundingClientRect()
        const x = touch.clientX - rect.left
        const y = touch.clientY - rect.top

        // Calculate distance moved since last position
        const dx = x - mouseRef.current.x
        const dy = y - mouseRef.current.y
        const distanceMoved = Math.sqrt(dx * dx + dy * dy)

        mouseRef.current.x = x
        mouseRef.current.y = y
        mouseOutOfBoundsRef.current = false

        // Only set dragging if moved a significant distance
        if (distanceMoved > 10) {
          isDraggingRef.current = true
        }

        updateLastMoveTime()

        if (systemStateRef.current.isCircleFormation) {
          exitCircleFormation()
          // Haptic feedback when exiting circle formation
          hapticManager.trigger(HapticPatterns.MEDIUM_TAP)
        }

        updateParticleTarget(x, y)
        notifyBehaviorManager(x, y)
      }
    }

    const onTouchEnd = (e: TouchEvent) => {
      e.preventDefault()
      const touchDuration = Date.now() - touchStartTimeRef.current
      const wasDragging = isDraggingRef.current

      // If it was a quick tap (not a drag)
      if (!wasDragging && touchDuration < 300) {
        // If in ball mode, accelerate rotation instead of toggling circle formation
        if (ballModeActiveRef.current) {
          accelerateBallRotation()
          return
        }

        handleToggleCircleFormation()

        const context: BehaviorContext = {
          particles: particlesRef.current,
          mouse: mouseRef.current,
          systemState: systemStateRef.current,
          canvasWidth: canvas.width,
          canvasHeight: canvas.height,
          deltaTime: 0,
          currentTime: Date.now(),
          isMouseStopped: false,
        }
        behaviorManager.onMouseClick(context)
      }

      isDraggingRef.current = false
    }

    // Add event listeners
    if (isTouchDevice) {
      canvas.addEventListener("touchstart", onTouchStart, { passive: false })
      canvas.addEventListener("touchmove", onTouchMove, { passive: false })
      canvas.addEventListener("touchend", onTouchEnd, { passive: false })
    } else {
      canvas.addEventListener("mousemove", onMouseMove)
      canvas.addEventListener("click", onClick)
      canvas.addEventListener("mouseleave", onMouseLeave)
      canvas.addEventListener("mouseenter", onMouseEnter)
    }

    // Animation loop
    const animate = () => {
      const currentTime = Date.now()
      const deltaTime = currentTime - lastTimeRef.current
      lastTimeRef.current = currentTime

      ctx.clearRect(0, 0, canvas.width, canvas.height)

      // Check if mouse stopped moving
      const timeSinceLastMove = currentTime - systemStateRef.current.lastMoveTime
      const isMouseStopped =
        timeSinceLastMove > PHYSICS_CONSTANTS.mouseStopDelay && !systemStateRef.current.isCircleFormation

      if (timeSinceLastMove > PHYSICS_CONSTANTS.mouseMovingDelay) {
        mouseRef.current.isMoving = false
      }

      // Check for ball mode activation
      const shouldActivateBallMode =
        mouseOutOfBoundsRef.current &&
        !systemStateRef.current.isCircleFormation &&
        !ballModeActiveRef.current &&
        timeSinceLastMove > 1000 // Wait 1 second after mouse stops moving

      if (shouldActivateBallMode) {
        ballModeActiveRef.current = true
        ballModeStartTimeRef.current = currentTime
        resetBallRotation() // Start with initial rotation speed
        hapticManager.trigger(HapticPatterns.FORMATION)
      }

      // If we just entered mouse stopped state, trigger haptic feedback
      if (isMouseStopped && !systemStateRef.current.isMouseStopped) {
        hapticManager.trigger(HapticPatterns.LIGHT_TAP)
      }

      // Update system state
      systemStateRef.current.isMouseStopped = isMouseStopped

      // Update rotation for circle formation
      if (!ballModeActiveRef.current) {
        updateRotation(deltaTime)
      }

      const particles = particlesRef.current
      const mouse = mouseRef.current
      const systemState = systemStateRef.current

      // Apply ball mode if active
      if (ballModeActiveRef.current) {
        applyBallMode(currentTime, deltaTime)
      }

      // Create behavior context
      const context: BehaviorContext = {
        particles,
        mouse,
        systemState,
        canvasWidth: canvas.width,
        canvasHeight: canvas.height,
        deltaTime,
        currentTime,
        isMouseStopped,
      }

      // Initialize behavior manager if needed
      behaviorManager.initialize(context)

      // Track particle states for rendering
      const isMouseHovering: boolean[] = []
      const isColliding: boolean[] = []

      // Update particles using behavior system (only if not in ball mode)
      particles.forEach((particle, index) => {
        // Apply behaviors only if not in ball mode
        if (!ballModeActiveRef.current) {
          behaviorManager.updateParticle(particle, index, context)
        }

        // Check collisions for rendering
        isColliding[index] = checkParticleCollision(particle, particles)

        // Check mouse hovering for rendering (only if mouse is in bounds)
        if (!mouseOutOfBoundsRef.current) {
          const mouseDistance = Math.sqrt(Math.pow(mouse.x - particle.x, 2) + Math.pow(mouse.y - particle.y, 2))
          isMouseHovering[index] = mouseDistance < PHYSICS_CONSTANTS.repelDistance && !systemState.isCircleFormation
        }

        // Apply physics
        const adjustedFriction =
          (systemState.isCircleFormation && systemState.rotationSpeed > PHYSICS_CONSTANTS.centrifugalThreshold) ||
          (ballModeActiveRef.current && ballRotationSpeedRef.current > PHYSICS_CONSTANTS.centrifugalThreshold)
            ? 0.96
            : ballModeActiveRef.current
              ? 0.98 // Higher friction in ball mode for stability
              : PHYSICS_CONSTANTS.friction

        particle.vx *= adjustedFriction
        particle.vy *= adjustedFriction

        // Update position
        particle.x += particle.vx
        particle.y += particle.vy

        // Handle wall collisions
        handleWallCollisions(particle, canvas.width, canvas.height)
      })

      // Handle particle-to-particle collisions
      handleParticleCollisions(particles, systemState)

      // Draw trail connections (only if not in ball mode)
      if (!isMouseStopped && !systemState.isCircleFormation && !ballModeActiveRef.current) {
        ctx.strokeStyle = "rgba(59, 130, 246, 0.3)"
        ctx.lineWidth = 1
        for (let i = 0; i < particles.length - 1; i++) {
          const current = particles[i]
          const next = particles[i + 1]
          ctx.beginPath()
          ctx.moveTo(current.x, current.y)
          ctx.lineTo(next.x, next.y)
          ctx.stroke()
        }
      }

      // Draw ball mode connections and effects
      if (ballModeActiveRef.current) {
        const centerX = canvas.width / 2
        const centerY = canvas.height / 2

        // Draw particle trails in ball mode when rotating fast
        if (ballRotationSpeedRef.current > PHYSICS_CONSTANTS.centrifugalThreshold) {
          particles.forEach((particle, index) => {
            const hue = (0 + (index * 60) / particles.length + (ballRotationAngleRef.current * 180) / Math.PI) % 60

            ctx.globalAlpha = 0.2
            ctx.beginPath()

            const speedFactor =
              (ballRotationSpeedRef.current - PHYSICS_CONSTANTS.initialRotationSpeed) /
              (PHYSICS_CONSTANTS.maxRotationSpeed - PHYSICS_CONSTANTS.initialRotationSpeed)
            const trailLength = 0.2 + speedFactor * 1.2

            // Calculate trail start position
            const phi = Math.acos(-1 + (2 * index) / particles.length)
            const startTheta = Math.sqrt(particles.length * Math.PI) * phi + ballRotationAngleRef.current - trailLength
            const endTheta = Math.sqrt(particles.length * Math.PI) * phi + ballRotationAngleRef.current

            // Draw arc trail
            ctx.arc(centerX, centerY, 60 + Math.sin(currentTime * 0.001) * 10, startTheta, endTheta)
            ctx.strokeStyle = `hsl(${hue}, 70%, 60%)`
            ctx.lineWidth = particle.size * (0.8 + speedFactor * 0.6)
            ctx.stroke()
            ctx.globalAlpha = 1
          })
        }

        // Draw connections between particles in ball mode
        ctx.strokeStyle = "rgba(147, 51, 234, 0.2)"
        ctx.lineWidth = 1
        particles.forEach((particle, i) => {
          particles.forEach((otherParticle, j) => {
            if (i < j) {
              const distance = Math.sqrt(
                Math.pow(particle.x - otherParticle.x, 2) + Math.pow(particle.y - otherParticle.y, 2),
              )
              if (distance < 100) {
                ctx.beginPath()
                ctx.moveTo(particle.x, particle.y)
                ctx.lineTo(otherParticle.x, otherParticle.y)
                ctx.stroke()
              }
            }
          })
        })

        // Draw center indicator
        ctx.beginPath()
        ctx.arc(centerX, centerY, 3, 0, Math.PI * 2)
        ctx.fillStyle = "rgba(147, 51, 234, 0.5)"
        ctx.fill()

        // Draw rotation indicator
        ctx.strokeStyle = "rgba(147, 51, 234, 0.8)"
        ctx.lineWidth = 2
        ctx.beginPath()
        ctx.moveTo(centerX, centerY)

        // Calculate expanded radius for indicator
        let centrifugalExpansion = 0
        if (ballRotationSpeedRef.current > PHYSICS_CONSTANTS.centrifugalThreshold) {
          const speedExcess = ballRotationSpeedRef.current - PHYSICS_CONSTANTS.centrifugalThreshold
          const maxSpeedExcess = PHYSICS_CONSTANTS.maxRotationSpeed - PHYSICS_CONSTANTS.centrifugalThreshold
          const expansionFactor = speedExcess / maxSpeedExcess
          centrifugalExpansion = expansionFactor * PHYSICS_CONSTANTS.maxCentrifugalExpansion
        }

        const indicatorRadius = 60 + Math.sin(currentTime * 0.001) * 10 + centrifugalExpansion + 10

        const indicatorX = centerX + Math.cos(ballRotationAngleRef.current) * indicatorRadius
        const indicatorY = centerY + Math.sin(ballRotationAngleRef.current) * indicatorRadius
        ctx.lineTo(indicatorX, indicatorY)
        ctx.stroke()

        // Draw arrow
        ctx.beginPath()
        const arrowAngle = ballRotationAngleRef.current + Math.PI / 2
        ctx.moveTo(indicatorX, indicatorY)
        ctx.lineTo(indicatorX + Math.cos(arrowAngle) * 6, indicatorY + Math.sin(arrowAngle) * 6)
        ctx.lineTo(indicatorX + Math.cos(arrowAngle + Math.PI) * 6, indicatorY + Math.sin(arrowAngle + Math.PI) * 6)
        ctx.closePath()
        ctx.fillStyle = "rgba(147, 51, 234, 0.8)"
        ctx.fill()

        // Draw speed indicator
        const speedPercentage =
          ((ballRotationSpeedRef.current - PHYSICS_CONSTANTS.initialRotationSpeed) /
            (PHYSICS_CONSTANTS.maxRotationSpeed - PHYSICS_CONSTANTS.initialRotationSpeed)) *
          100

        const speedBarX = centerX - 50
        const speedBarY = centerY + indicatorRadius + 20

        // Background
        ctx.fillStyle = "rgba(255, 255, 255, 0.2)"
        ctx.fillRect(speedBarX, speedBarY, 100, 6)

        // Fill
        const isHighSpeed = ballRotationSpeedRef.current > PHYSICS_CONSTANTS.centrifugalThreshold
        ctx.fillStyle = isHighSpeed
          ? `hsl(${0 + speedPercentage * 0.5}, 70%, 60%)`
          : `hsl(${280 + speedPercentage * 1.2}, 70%, 60%)`
        ctx.fillRect(speedBarX, speedBarY, 100 * (speedPercentage / 100), 6)

        // Text
        ctx.font = "12px Arial"
        ctx.fillStyle = isHighSpeed ? "rgba(255, 100, 100, 0.9)" : "rgba(255, 255, 255, 0.8)"
        ctx.textAlign = "center"
        const speedText = isHighSpeed
          ? `CENTRIFUGAL: ${Math.round(speedPercentage)}%`
          : `Speed: ${Math.round(speedPercentage)}%`
        ctx.fillText(speedText, centerX, speedBarY + 20)
      }

      // Render particles
      renderParticles(ctx, particles, mouse, systemState, isMouseHovering, isColliding)

      // Render UI (only if not in ball mode)
      if (!ballModeActiveRef.current) {
        renderUI(ctx, mouse, systemState, isMouseStopped)
      }

      // Draw connection line from cursor/touch to first particle (only if not in ball mode)
      if (
        mouse.x > 0 &&
        mouse.y > 0 &&
        particles.length > 0 &&
        !isMouseStopped &&
        !systemState.isCircleFormation &&
        !ballModeActiveRef.current
      ) {
        ctx.beginPath()
        ctx.moveTo(particles[0].x, particles[0].y)
        ctx.lineTo(mouse.x, mouse.y)
        ctx.strokeStyle = "rgba(156, 163, 175, 0.2)"
        ctx.lineWidth = 1
        ctx.stroke()
      }

      // Show touch indicator on mobile when dragging
      if (isTouchDevice && isDraggingRef.current && mouse.x > 0 && mouse.y > 0) {
        ctx.beginPath()
        ctx.arc(mouse.x, mouse.y, 15, 0, Math.PI * 2)
        ctx.strokeStyle = "rgba(147, 51, 234, 0.6)"
        ctx.lineWidth = 3
        ctx.stroke()

        ctx.beginPath()
        ctx.arc(mouse.x, mouse.y, 5, 0, Math.PI * 2)
        ctx.fillStyle = "rgba(147, 51, 234, 0.8)"
        ctx.fill()
      }

      // Show ball mode indicator with speed info
      if (ballModeActiveRef.current) {
        const isHighSpeed = ballRotationSpeedRef.current > PHYSICS_CONSTANTS.centrifugalThreshold
        const speedPercentage = Math.round(
          ((ballRotationSpeedRef.current - PHYSICS_CONSTANTS.initialRotationSpeed) /
            (PHYSICS_CONSTANTS.maxRotationSpeed - PHYSICS_CONSTANTS.initialRotationSpeed)) *
            100,
        )

        ctx.font = "16px Arial"
        ctx.fillStyle = isHighSpeed ? "rgba(255, 100, 100, 0.9)" : "rgba(147, 51, 234, 0.8)"
        ctx.textAlign = "center"
        ctx.fillText(`Ball Mode ${isHighSpeed ? "🔥" : ""} (${speedPercentage}%)`, canvas.width / 2, 30)

        // Add click instruction
        ctx.font = "12px Arial"
        ctx.fillStyle = "rgba(255, 255, 255, 0.6)"
        ctx.fillText(`${isTouchDevice ? "Tap" : "Click"} to accelerate rotation`, canvas.width / 2, 50)
      }

      animationRef.current = requestAnimationFrame(animate)
    }

    animate()

    return () => {
      window.removeEventListener("resize", resizeCanvas)

      if (isTouchDevice) {
        canvas.removeEventListener("touchstart", onTouchStart)
        canvas.removeEventListener("touchmove", onTouchMove)
        canvas.removeEventListener("touchend", onTouchEnd)
      } else {
        canvas.removeEventListener("mousemove", onMouseMove)
        canvas.removeEventListener("click", onClick)
        canvas.removeEventListener("mouseleave", onMouseLeave)
        canvas.removeEventListener("mouseenter", onMouseEnter)
      }

      behaviorManager.cleanup()
      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current)
      }
    }
  }, [isTouchDevice])

  return (
    <div className="w-full h-screen bg-gray-900 overflow-hidden">
      <canvas ref={canvasRef} className={`w-full h-full ${isTouchDevice ? "" : "cursor-none"}`} />

      <BehaviorControlPanel isOpen={showBehaviorPanel} onToggle={() => setShowBehaviorPanel(!showBehaviorPanel)} />

      {isTouchDevice && (
        <MobileControls
          onToggleCircleFormation={handleToggleCircleFormation}
          onToggleBehaviorPanel={() => setShowBehaviorPanel(!showBehaviorPanel)}
          hapticEnabled={hapticEnabled}
          onToggleHaptic={toggleHaptic}
        />
      )}

      <div
        className={`absolute top-4 left-4 text-white text-sm bg-black/50 p-3 rounded max-w-xs ${isMobile ? "hidden" : "block"}`}
      >
        <p>{isTouchDevice ? "Touch and drag to move particles" : "Move your cursor around the screen"}</p>
        <p>• Trail of particles follows {isTouchDevice ? "your touch" : "cursor"}</p>
        <p>• {isTouchDevice ? "Touch" : "Hover over"} particles to repel them (red)</p>
        <p>• Particles repel each other when colliding (orange)</p>
        <p>• Stop moving to form a straight line (green)</p>
        <p>
          •{" "}
          <strong>{isTouchDevice ? "Quick tap" : "Click"} to form a rotating circle that accelerates (rainbow)</strong>
        </p>
        <p>
          • <strong>At high speeds, particles fly outward! (red)</strong>
        </p>
        <p>• Particles bounce off walls</p>
        <p>
          • <strong>Move cursor off screen to activate ball mode!</strong>
        </p>
        <p>
          • <strong>{isTouchDevice ? "Tap" : "Click"} during ball mode to accelerate rotation!</strong>
        </p>
        <p>
          •{" "}
          <strong>{isTouchDevice ? "Tap the gear button" : 'Click "Behaviors"'} to customize particle effects!</strong>
        </p>
        {isTouchDevice && (
          <p>
            • <strong>Feel vibrations when particles interact!</strong>
          </p>
        )}
      </div>
    </div>
  )
}
