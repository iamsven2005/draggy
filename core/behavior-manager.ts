import type { BehaviorContext } from "../types/behavior-plugin"
import { behaviorRegistry } from "./behavior-registry"

export class BehaviorManager {
  private initialized = false
  private lastContext: BehaviorContext | null = null

  initialize(context: BehaviorContext): void {
    if (this.initialized) return

    const behaviors = behaviorRegistry.getEnabled()
    behaviors.forEach((behavior) => {
      try {
        behavior.initialize?.(context)
      } catch (error) {
        console.error(`Error initializing behavior ${behavior.id}:`, error)
      }
    })

    this.initialized = true
    this.lastContext = context
  }

  updateParticle(particle: any, index: number, context: BehaviorContext): void {
    const behaviors = behaviorRegistry.getEnabled()

    behaviors.forEach((behavior) => {
      try {
        behavior.update(particle, index, context)
      } catch (error) {
        console.error(`Error in behavior ${behavior.id}:`, error)
      }
    })
  }

  onMouseMove(context: BehaviorContext): void {
    const behaviors = behaviorRegistry.getEnabled()

    behaviors.forEach((behavior) => {
      try {
        behavior.onMouseMove?.(context)
      } catch (error) {
        console.error(`Error in behavior ${behavior.id} onMouseMove:`, error)
      }
    })
  }

  onMouseClick(context: BehaviorContext): void {
    const behaviors = behaviorRegistry.getEnabled()

    behaviors.forEach((behavior) => {
      try {
        behavior.onMouseClick?.(context)
      } catch (error) {
        console.error(`Error in behavior ${behavior.id} onMouseClick:`, error)
      }
    })
  }

  cleanup(): void {
    const behaviors = behaviorRegistry.getAll()
    behaviors.forEach((behavior) => {
      try {
        behavior.cleanup?.()
      } catch (error) {
        console.error(`Error cleaning up behavior ${behavior.id}:`, error)
      }
    })
    this.initialized = false
  }

  // Hot reload support
  reloadBehavior(behaviorId: string): void {
    const behavior = behaviorRegistry.get(behaviorId)
    if (behavior && this.lastContext) {
      behavior.cleanup?.()
      behavior.initialize?.(this.lastContext)
    }
  }
}

export const behaviorManager = new BehaviorManager()
