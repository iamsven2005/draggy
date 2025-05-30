import type { ParticleBehavior, BehaviorRegistry, BehaviorConfig } from "../types/behavior-plugin"

class BehaviorRegistryImpl implements BehaviorRegistry {
  private behaviors = new Map<string, ParticleBehavior>()

  register(behavior: ParticleBehavior): void {
    if (this.behaviors.has(behavior.id)) {
      console.warn(`Behavior with id "${behavior.id}" is already registered. Overwriting.`)
    }

    // Validate behavior
    if (!this.validateBehavior(behavior)) {
      throw new Error(`Invalid behavior: ${behavior.id}`)
    }

    // Clone default config to avoid mutations
    behavior.config = { ...behavior.defaultConfig }

    this.behaviors.set(behavior.id, behavior)
    console.log(`Registered behavior: ${behavior.name} (${behavior.id})`)
  }

  unregister(behaviorId: string): void {
    const behavior = this.behaviors.get(behaviorId)
    if (behavior) {
      behavior.cleanup?.()
      this.behaviors.delete(behaviorId)
      console.log(`Unregistered behavior: ${behaviorId}`)
    }
  }

  get(behaviorId: string): ParticleBehavior | undefined {
    return this.behaviors.get(behaviorId)
  }

  getAll(): ParticleBehavior[] {
    return Array.from(this.behaviors.values()).sort((a, b) => b.priority - a.priority)
  }

  getEnabled(): ParticleBehavior[] {
    return this.getAll().filter((behavior) => behavior.config.enabled)
  }

  enable(behaviorId: string): void {
    const behavior = this.behaviors.get(behaviorId)
    if (behavior) {
      behavior.config.enabled = true
    }
  }

  disable(behaviorId: string): void {
    const behavior = this.behaviors.get(behaviorId)
    if (behavior) {
      behavior.config.enabled = false
    }
  }

  updateConfig(behaviorId: string, config: Partial<BehaviorConfig>): void {
    const behavior = this.behaviors.get(behaviorId)
    if (behavior) {
      const newConfig = { ...behavior.config, ...config }

      if (behavior.validateConfig?.(newConfig) !== false) {
        behavior.config = newConfig
        behavior.onConfigChange?.(newConfig)
      } else {
        console.warn(`Invalid config for behavior ${behaviorId}`)
      }
    }
  }

  private validateBehavior(behavior: ParticleBehavior): boolean {
    return !!(
      behavior.id &&
      behavior.name &&
      behavior.update &&
      behavior.defaultConfig &&
      typeof behavior.priority === "number"
    )
  }
}

export const behaviorRegistry = new BehaviorRegistryImpl()
