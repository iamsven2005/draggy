"use client"

import { useState, useEffect } from "react"
import { behaviorRegistry } from "../core/behavior-registry"
import { applyPreset, behaviorPresets } from "../behaviors/behavior-loader"
import type { ParticleBehavior } from "../types/behavior-plugin"

interface BehaviorControlPanelProps {
  isOpen: boolean
  onToggle: () => void
}

export function BehaviorControlPanel({ isOpen, onToggle }: BehaviorControlPanelProps) {
  const [behaviors, setBehaviors] = useState<ParticleBehavior[]>([])
  const [selectedPreset, setSelectedPreset] = useState<string>("default")

  useEffect(() => {
    const updateBehaviors = () => setBehaviors(behaviorRegistry.getAll())
    updateBehaviors()

    // Update every second to reflect any changes
    const interval = setInterval(updateBehaviors, 1000)
    return () => clearInterval(interval)
  }, [])

  const handlePresetChange = (presetName: string) => {
    setSelectedPreset(presetName)
    applyPreset(presetName as keyof typeof behaviorPresets)
    setBehaviors(behaviorRegistry.getAll()) // Refresh
  }

  const toggleBehavior = (behaviorId: string) => {
    const behavior = behaviorRegistry.get(behaviorId)
    if (behavior) {
      if (behavior.config.enabled) {
        behaviorRegistry.disable(behaviorId)
      } else {
        behaviorRegistry.enable(behaviorId)
      }
      setBehaviors(behaviorRegistry.getAll()) // Refresh
    }
  }

  if (!isOpen) {
    return (
      <button
        onClick={onToggle}
        className="fixed top-4 right-4 bg-purple-600 hover:bg-purple-700 text-white px-4 py-2 rounded-lg shadow-lg transition-colors"
      >
        Behaviors
      </button>
    )
  }

  return (
    <div className="fixed inset-0 md:top-4 md:right-4 md:inset-auto bg-black/90 text-white p-4 rounded-lg shadow-xl md:w-80 md:max-h-96 overflow-y-auto z-50">
      <div className="flex justify-between items-center mb-4">
        <h3 className="text-lg font-bold">Behavior Control</h3>
        <button onClick={onToggle} className="text-gray-400 hover:text-white transition-colors">
          ✕
        </button>
      </div>

      {/* Presets */}
      <div className="mb-4">
        <label className="block text-sm font-medium mb-2">Presets:</label>
        <select
          value={selectedPreset}
          onChange={(e) => handlePresetChange(e.target.value)}
          className="w-full bg-gray-800 border border-gray-600 rounded px-3 py-1 text-sm"
        >
          {Object.keys(behaviorPresets).map((preset) => (
            <option key={preset} value={preset}>
              {preset.charAt(0).toUpperCase() + preset.slice(1)}
            </option>
          ))}
        </select>
      </div>

      {/* Individual Behaviors */}
      <div className="space-y-3">
        <h4 className="text-sm font-medium text-gray-300">Individual Controls:</h4>
        {behaviors.map((behavior) => (
          <div key={behavior.id} className="border border-gray-700 rounded p-3">
            <div className="flex items-center justify-between mb-2">
              <div>
                <h5 className="font-medium text-sm">{behavior.name}</h5>
                <p className="text-xs text-gray-400">{behavior.description}</p>
              </div>
              <label className="relative inline-flex items-center cursor-pointer">
                <input
                  type="checkbox"
                  checked={behavior.config.enabled}
                  onChange={() => toggleBehavior(behavior.id)}
                  className="sr-only peer"
                />
                <div className="w-9 h-5 bg-gray-600 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-purple-600"></div>
              </label>
            </div>

            <div className="text-xs text-gray-500">
              Priority: {behavior.priority} | Version: {behavior.version}
            </div>

            {/* Basic config controls for some behaviors */}
            {behavior.id === "gravity" && behavior.config.enabled && (
              <div className="mt-2 space-y-1">
                <label className="block text-xs">
                  Strength:
                  <input
                    type="range"
                    min="0"
                    max="0.01"
                    step="0.0001"
                    value={(behavior.config as any).gravityStrength || 0.001}
                    onChange={(e) => {
                      behaviorRegistry.updateConfig(behavior.id, {
                        gravityStrength: Number.parseFloat(e.target.value),
                      })
                      setBehaviors(behaviorRegistry.getAll())
                    }}
                    className="w-full h-1 bg-gray-600 rounded-lg appearance-none cursor-pointer"
                  />
                </label>
              </div>
            )}

            {behavior.id === "wind" && behavior.config.enabled && (
              <div className="mt-2 space-y-1">
                <label className="block text-xs">
                  Wind Strength:
                  <input
                    type="range"
                    min="0"
                    max="0.01"
                    step="0.0001"
                    value={(behavior.config as any).windStrength || 0.002}
                    onChange={(e) => {
                      behaviorRegistry.updateConfig(behavior.id, {
                        windStrength: Number.parseFloat(e.target.value),
                      })
                      setBehaviors(behaviorRegistry.getAll())
                    }}
                    className="w-full h-1 bg-gray-600 rounded-lg appearance-none cursor-pointer"
                  />
                </label>
              </div>
            )}
          </div>
        ))}
      </div>

      <div className="mt-4 text-xs text-gray-500">
        Total behaviors: {behaviors.length} | Enabled: {behaviors.filter((b) => b.config.enabled).length}
      </div>

      {/* Mobile close button */}
      <div className="mt-6 md:hidden">
        <button onClick={onToggle} className="w-full bg-purple-600 text-white py-3 rounded-lg font-medium">
          Close Panel
        </button>
      </div>
    </div>
  )
}
