export interface Particle {
  x: number
  y: number
  vx: number
  vy: number
  targetX: number
  targetY: number
  size: number
  opacity: number
}

export interface MouseState {
  x: number
  y: number
  prevX: number
  prevY: number
  isMoving: boolean
}

export interface ParticleSystemState {
  isCircleFormation: boolean
  rotationAngle: number
  rotationSpeed: number
  lastMoveTime: number
  circleFormationTime: number
}
