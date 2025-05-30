import { behaviorRegistry } from "../core/behavior-registry"
import { circleFormationBehavior } from "./core/circle-formation-behavior"
import { mouseRepulsionBehavior } from "./core/mouse-repulsion-behavior"
import { gravityBehavior } from "./custom/gravity-behavior"
import { windBehavior } from "./custom/wind-behavior"
import { magneticBehavior } from "./custom/magnetic-behavior"
import { trailFollowingBehavior } from "./core/trail-following-behavior"
import { lineFormationBehavior } from "./core/line-formation-behavior"

export function loadCoreBehaviors(): void {
  // Core behaviors (always loaded)
  behaviorRegistry.register(trailFollowingBehavior)
  behaviorRegistry.register(lineFormationBehavior)
  behaviorRegistry.register(circleFormationBehavior)
  behaviorRegistry.register(mouseRepulsionBehavior)
}

export function loadCustomBehaviors(): void {
  // Custom behaviors (optional)
  behaviorRegistry.register(gravityBehavior)
  behaviorRegistry.register(windBehavior)
  behaviorRegistry.register(magneticBehavior)
}

export function loadAllBehaviors(): void {
  loadCoreBehaviors()
  loadCustomBehaviors()
}

// Behavior presets
export const behaviorPresets = {
  default: {
    "trail-following": { enabled: true },
    "line-formation": { enabled: true },
    "circle-formation": { enabled: true },
    "mouse-repulsion": { enabled: true },
    gravity: { enabled: false },
    wind: { enabled: false },
    magnetic: { enabled: false },
  },

  chaotic: {
    "trail-following": { enabled: true },
    "line-formation": { enabled: true },
    "circle-formation": { enabled: true },
    "mouse-repulsion": { enabled: true },
    gravity: { enabled: true, gravityStrength: 0.0005 },
    wind: { enabled: true, windStrength: 0.001, turbulence: 1.0 },
    magnetic: { enabled: true, magneticStrength: 0.005 },
  },

  peaceful: {
    "trail-following": { enabled: true },
    "line-formation": { enabled: true },
    "circle-formation": { enabled: true },
    "mouse-repulsion": { enabled: false },
    gravity: { enabled: true, gravityStrength: 0.0001, direction: "center" },
    wind: { enabled: false },
    magnetic: { enabled: true, magneticStrength: 0.002 },
  },

  windy: {
    "trail-following": { enabled: true },
    "line-formation": { enabled: true },
    "circle-formation": { enabled: true },
    "mouse-repulsion": { enabled: true },
    gravity: { enabled: false },
    wind: { enabled: true, windStrength: 0.003, turbulence: 0.8, gustFrequency: 0.002 },
    magnetic: { enabled: false },
  },
}

export function applyPreset(presetName: keyof typeof behaviorPresets): void {
  const preset = behaviorPresets[presetName]
  if (!preset) return

  Object.entries(preset).forEach(([behaviorId, config]) => {
    behaviorRegistry.updateConfig(behaviorId, config)
  })
}
