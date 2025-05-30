"use client"

import { useRef } from "react"
import type { Particle, ParticleSystemState } from "../types/particle"
import { PHYSICS_CONSTANTS } from "../constants/physics"

export function useParticleSystem() {
  const particlesRef = useRef<Particle[]>([])
  const systemStateRef = useRef<ParticleSystemState>({
    isCircleFormation: false,
    rotationAngle: 0,
    rotationSpeed: PHYSICS_CONSTANTS.initialRotationSpeed,
    lastMoveTime: Date.now(),
    circleFormationTime: 0,
  })
  const lastTimeRef = useRef(Date.now())

  const updateRotation = (deltaTime: number) => {
    if (systemStateRef.current.isCircleFormation) {
      systemStateRef.current.rotationSpeed = Math.min(
        systemStateRef.current.rotationSpeed + PHYSICS_CONSTANTS.accelerationRate * deltaTime,
        PHYSICS_CONSTANTS.maxRotationSpeed,
      )

      systemStateRef.current.rotationAngle += systemStateRef.current.rotationSpeed * deltaTime

      if (systemStateRef.current.rotationAngle > Math.PI * 2) {
        systemStateRef.current.rotationAngle -= Math.PI * 2
      }
    }
  }

  const toggleCircleFormation = () => {
    systemStateRef.current.isCircleFormation = !systemStateRef.current.isCircleFormation
    systemStateRef.current.circleFormationTime = Date.now()

    if (systemStateRef.current.isCircleFormation) {
      systemStateRef.current.rotationSpeed = PHYSICS_CONSTANTS.initialRotationSpeed
    }
  }

  const exitCircleFormation = () => {
    systemStateRef.current.isCircleFormation = false
    systemStateRef.current.rotationSpeed = PHYSICS_CONSTANTS.initialRotationSpeed
  }

  const updateLastMoveTime = () => {
    systemStateRef.current.lastMoveTime = Date.now()
  }

  return {
    particlesRef,
    systemStateRef,
    lastTimeRef,
    updateRotation,
    toggleCircleFormation,
    exitCircleFormation,
    updateLastMoveTime,
  }
}
