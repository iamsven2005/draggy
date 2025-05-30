/**
 * Utility for providing haptic feedback on mobile devices
 */

// Check if vibration API is available
const hasVibrationSupport = (): boolean => {
  return "vibrate" in navigator
}

// Different vibration patterns for different interactions
export const HapticPatterns = {
  // Light tap for UI interactions
  LIGHT_TAP: [10],

  // Medium tap for particle interactions
  MEDIUM_TAP: [30],

  // Strong tap for significant events
  STRONG_TAP: [60],

  // Double tap for confirmations
  DOUBLE_TAP: [20, 50, 20],

  // Triple pulse for warnings or errors
  TRIPLE_PULSE: [20, 40, 20, 40, 20],

  // Collision pattern (intensity can vary)
  COLLISION: [15],

  // Formation pattern for when particles form a pattern
  FORMATION: [10, 30, 10],

  // Success pattern
  SUCCESS: [30, 50, 80],

  // Error pattern
  ERROR: [60, 50, 60, 50, 60],

  // Custom pattern generator for collisions based on intensity
  collisionPattern: (intensity: number): number[] => {
    // Clamp intensity between 0 and 1
    const clampedIntensity = Math.max(0, Math.min(1, intensity))
    // Scale vibration duration based on intensity (5-40ms)
    const duration = Math.floor(5 + clampedIntensity * 35)
    return [duration]
  },
}

// Throttle vibrations to prevent excessive feedback
let lastVibrationTime = 0
const VIBRATION_COOLDOWN = 100 // ms between vibrations

/**
 * Trigger haptic feedback with the specified pattern
 * @param pattern Vibration pattern in milliseconds
 * @param force Force vibration even during cooldown
 */
export const triggerHapticFeedback = (pattern: number[], force = false): void => {
  if (!hasVibrationSupport()) return

  const now = Date.now()
  if (force || now - lastVibrationTime > VIBRATION_COOLDOWN) {
    try {
      navigator.vibrate(pattern)
      lastVibrationTime = now
    } catch (error) {
      console.warn("Vibration failed:", error)
    }
  }
}

/**
 * Trigger collision feedback with intensity
 * @param intensity Collision intensity (0-1)
 */
export const triggerCollisionFeedback = (intensity: number): void => {
  const pattern = HapticPatterns.collisionPattern(intensity)
  triggerHapticFeedback(pattern)
}

/**
 * Stop any ongoing vibration
 */
export const stopHapticFeedback = (): void => {
  if (hasVibrationSupport()) {
    navigator.vibrate(0)
  }
}

/**
 * Haptic feedback manager with user preference support
 */
class HapticFeedbackManager {
  private enabled = true
  private intensityLevel = 1.0 // 0.0 to 1.0

  constructor() {
    // Try to load user preferences from localStorage
    this.loadPreferences()
  }

  private loadPreferences(): void {
    try {
      const storedEnabled = localStorage.getItem("haptic_enabled")
      const storedIntensity = localStorage.getItem("haptic_intensity")

      if (storedEnabled !== null) {
        this.enabled = storedEnabled === "true"
      }

      if (storedIntensity !== null) {
        this.intensityLevel = Number.parseFloat(storedIntensity)
      }
    } catch (e) {
      // Ignore localStorage errors
    }
  }

  private savePreferences(): void {
    try {
      localStorage.setItem("haptic_enabled", String(this.enabled))
      localStorage.setItem("haptic_intensity", String(this.intensityLevel))
    } catch (e) {
      // Ignore localStorage errors
    }
  }

  public isEnabled(): boolean {
    return this.enabled && hasVibrationSupport()
  }

  public setEnabled(enabled: boolean): void {
    this.enabled = enabled
    this.savePreferences()
  }

  public getIntensity(): number {
    return this.intensityLevel
  }

  public setIntensity(level: number): void {
    this.intensityLevel = Math.max(0, Math.min(1, level))
    this.savePreferences()
  }

  public trigger(pattern: number[]): void {
    if (!this.isEnabled()) return

    // Scale pattern durations by intensity
    const scaledPattern = pattern.map((duration) => Math.round(duration * this.intensityLevel))

    triggerHapticFeedback(scaledPattern)
  }

  public triggerCollision(intensity: number): void {
    if (!this.isEnabled()) return

    // Scale intensity by user preference
    const scaledIntensity = intensity * this.intensityLevel
    triggerCollisionFeedback(scaledIntensity)
  }
}

export const hapticManager = new HapticFeedbackManager()
