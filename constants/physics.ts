export const PHYSICS_CONSTANTS = {
  followForce: 0.025,
  friction: 0.92,
  bounceForce: 0.8,
  stopThreshold: 2,
  trailDistance: 40,
  repelForce: 0.8,
  repelDistance: 50,
  lineFormationForce: 0.03,
  circleFormationForce: 0.04,

  // Rotation constants
  initialRotationSpeed: 0.0002,
  accelerationRate: 0.00000005,
  maxRotationSpeed: 0.008,

  // Centrifugal constants
  centrifugalThreshold: 0.004,
  centrifugalForceMultiplier: 50,
  maxCentrifugalExpansion: 100,

  // Timing constants
  mouseStopDelay: 500,
  mouseMovingDelay: 100,
} as const

export const VISUAL_CONSTANTS = {
  particleCount: 8,
  baseCircleRadius: 80,
  speedBarWidth: 100,
  speedBarHeight: 6,
  arrowSize: 6,
  lineSpacing: 25,
  lineAngle: Math.PI / 4,
} as const

export const COLORS = {
  defaultHue: 220,
  repelHue: 0,
  collisionHue: 30,
  lineFormationHue: 120,
  circleFormationHue: 280,
  centrifugalHueRange: 60,
} as const
