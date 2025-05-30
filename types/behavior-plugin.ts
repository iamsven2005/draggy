import type { Particle, MouseState, ParticleSystemState } from "./particle"

export interface BehaviorContext {
  particles: Particle[]
  mouse: MouseState
  systemState: ParticleSystemState
  canvasWidth: number
  canvasHeight: number
  deltaTime: number
  currentTime: number
  isMouseStopped: boolean
}

export interface BehaviorConfig {
  enabled: boolean
  priority: number
  [key: string]: any
}

export interface ParticleBehavior {
  readonly id: string
  readonly name: string
  readonly description: string
  readonly version: string
  readonly priority: number

  // Configuration
  defaultConfig: BehaviorConfig
  config: BehaviorConfig

  // Lifecycle methods
  initialize?(context: BehaviorContext): void
  update(particle: Particle, index: number, context: BehaviorContext): void
  cleanup?(): void

  // Optional methods
  onMouseMove?(context: BehaviorContext): void
  onMouseClick?(context: BehaviorContext): void
  onConfigChange?(newConfig: BehaviorConfig): void

  // Validation
  validateConfig?(config: Partial<BehaviorConfig>): boolean
}

export interface BehaviorRegistry {
  register(behavior: ParticleBehavior): void
  unregister(behaviorId: string): void
  get(behaviorId: string): ParticleBehavior | undefined
  getAll(): ParticleBehavior[]
  getEnabled(): ParticleBehavior[]
  enable(behaviorId: string): void
  disable(behaviorId: string): void
  updateConfig(behaviorId: string, config: Partial<BehaviorConfig>): void
}

export type BehaviorFactory = () => ParticleBehavior
