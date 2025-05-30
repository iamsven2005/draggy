"use client"

import { useEffect, useRef, useState } from "react"
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
import type { BehaviorContext } from "./types/behavior-plugin"

export default function Component() {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const animationRef = useRef<number>()
  const [showBehaviorPanel, setShowBehaviorPanel] = useState(false)

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

    // Mouse event handlers
    const onMouseMove = (e: MouseEvent) => {
      handleMouseMove(e, canvas)
      updateLastMoveTime()

      if (systemStateRef.current.isCircleFormation) {
        exitCircleFormation()
      }

      if (particlesRef.current.length > 0) {
        particlesRef.current[0].targetX = mouseRef.current.x
        particlesRef.current[0].targetY = mouseRef.current.y
      }

      // Notify behavior manager
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
      behaviorManager.onMouseMove(context)
    }

    const onClick = (e: MouseEvent) => {
      handleClick(e, canvas)
      toggleCircleFormation()

      // Notify behavior manager
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

    canvas.addEventListener("mousemove", onMouseMove)
    canvas.addEventListener("click", onClick)

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

      updateRotation(deltaTime)

      const particles = particlesRef.current
      const mouse = mouseRef.current
      const systemState = systemStateRef.current

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

      // Update particles using behavior system
      particles.forEach((particle, index) => {
        // Apply all registered behaviors
        behaviorManager.updateParticle(particle, index, context)

        // Check collisions for rendering
        isColliding[index] = checkParticleCollision(particle, particles)

        // Check mouse hovering for rendering
        const mouseDistance = Math.sqrt(Math.pow(mouse.x - particle.x, 2) + Math.pow(mouse.y - particle.y, 2))
        isMouseHovering[index] = mouseDistance < PHYSICS_CONSTANTS.repelDistance && !systemState.isCircleFormation

        // Apply physics
        const adjustedFriction =
          systemState.isCircleFormation && systemState.rotationSpeed > PHYSICS_CONSTANTS.centrifugalThreshold
            ? 0.96
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

      // Draw trail connections
      if (!isMouseStopped && !systemState.isCircleFormation) {
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

      // Render particles
      renderParticles(ctx, particles, mouse, systemState, isMouseHovering, isColliding)

      // Render UI
      renderUI(ctx, mouse, systemState, isMouseStopped)

      // Draw connection line from cursor to first particle
      if (mouse.x > 0 && mouse.y > 0 && particles.length > 0 && !isMouseStopped && !systemState.isCircleFormation) {
        ctx.beginPath()
        ctx.moveTo(particles[0].x, particles[0].y)
        ctx.lineTo(mouse.x, mouse.y)
        ctx.strokeStyle = "rgba(156, 163, 175, 0.2)"
        ctx.lineWidth = 1
        ctx.stroke()
      }

      animationRef.current = requestAnimationFrame(animate)
    }

    animate()

    return () => {
      window.removeEventListener("resize", resizeCanvas)
      canvas.removeEventListener("mousemove", onMouseMove)
      canvas.removeEventListener("click", onClick)
      behaviorManager.cleanup()
      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current)
      }
    }
  }, [])

  return (
    <div className="w-full h-screen bg-gray-900 overflow-hidden">
      <canvas ref={canvasRef} className="w-full h-full cursor-none" />

      <BehaviorControlPanel isOpen={showBehaviorPanel} onToggle={() => setShowBehaviorPanel(!showBehaviorPanel)} />

      <div className="absolute top-4 left-4 text-white text-sm bg-black/50 p-3 rounded">
        <p>Move your cursor around the screen</p>
        <p>• Trail of particles follows cursor</p>
        <p>• Hover over particles to repel them (red)</p>
        <p>• Particles repel each other when colliding (orange)</p>
        <p>• Stop moving to form a straight line (green)</p>
        <p>
          • <strong>Click to form a rotating circle that accelerates (rainbow)</strong>
        </p>
        <p>
          • <strong>At high speeds, particles fly outward! (red)</strong>
        </p>
        <p>• Particles bounce off walls</p>
        <p>
          • <strong>Click "Behaviors" to customize particle effects!</strong>
        </p>
      </div>
    </div>
  )
}
