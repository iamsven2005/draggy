"use client"

import { useState } from "react"
import { hapticManager, HapticPatterns } from "../utils/haptic-feedback"

interface MobileControlsProps {
  onToggleCircleFormation: () => void
  onToggleBehaviorPanel: () => void
  hapticEnabled: boolean
  onToggleHaptic: () => void
}

export function MobileControls({
  onToggleCircleFormation,
  onToggleBehaviorPanel,
  hapticEnabled,
  onToggleHaptic,
}: MobileControlsProps) {
  const [showInfo, setShowInfo] = useState(false)

  const handleButtonPress = (action: () => void) => {
    // Provide haptic feedback for button press
    if (hapticEnabled) {
      hapticManager.trigger(HapticPatterns.LIGHT_TAP)
    }
    action()
  }

  return (
    <div className="fixed bottom-4 left-0 right-0 flex justify-center gap-3 z-10">
      <button
        onClick={() => handleButtonPress(onToggleCircleFormation)}
        className="w-14 h-14 bg-purple-600 rounded-full flex items-center justify-center shadow-lg active:scale-95 transition-transform"
        aria-label="Toggle circle formation"
      >
        <svg
          xmlns="http://www.w3.org/2000/svg"
          width="24"
          height="24"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
          className="text-white"
        >
          <circle cx="12" cy="12" r="10" />
          <path d="M12 8v8" />
          <path d="M8 12h8" />
        </svg>
      </button>

      <button
        onClick={() => handleButtonPress(() => setShowInfo(!showInfo))}
        className="w-14 h-14 bg-blue-600 rounded-full flex items-center justify-center shadow-lg active:scale-95 transition-transform"
        aria-label="Show information"
      >
        <svg
          xmlns="http://www.w3.org/2000/svg"
          width="24"
          height="24"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
          className="text-white"
        >
          <circle cx="12" cy="12" r="10" />
          <path d="M12 16v-4" />
          <path d="M12 8h.01" />
        </svg>
      </button>

      <button
        onClick={() => handleButtonPress(onToggleBehaviorPanel)}
        className="w-14 h-14 bg-green-600 rounded-full flex items-center justify-center shadow-lg active:scale-95 transition-transform"
        aria-label="Toggle behavior panel"
      >
        <svg
          xmlns="http://www.w3.org/2000/svg"
          width="24"
          height="24"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
          className="text-white"
        >
          <path d="M12.22 2h-.44a2 2 0 0 0-2 2v.18a2 2 0 0 1-1 1.73l-.43.25a2 2 0 0 1-2 0l-.15-.08a2 2 0 0 0-2.73.73l-.22.38a2 2 0 0 0 .73 2.73l.15.1a2 2 0 0 1 1 1.72v.51a2 2 0 0 1-1 1.74l-.15.09a2 2 0 0 0-.73 2.73l.22.38a2 2 0 0 0 2.73.73l.15-.08a2 2 0 0 1 2 0l.43.25a2 2 0 0 1 1 1.73V20a2 2 0 0 0 2 2h.44a2 2 0 0 0 2-2v-.18a2 2 0 0 1 1-1.73l.43-.25a2 2 0 0 1 2 0l.15.08a2 2 0 0 0 2.73-.73l.22-.39a2 2 0 0 0-.73-2.73l-.15-.08a2 2 0 0 1-1-1.74v-.5a2 2 0 0 1 1-1.74l.15-.09a2 2 0 0 0 .73-2.73l-.22-.38a2 2 0 0 0-2.73-.73l-.15.08a2 2 0 0 1-2 0l-.43-.25a2 2 0 0 1-1-1.73V4a2 2 0 0 0-2-2z" />
          <circle cx="12" cy="12" r="3" />
        </svg>
      </button>

      <button
        onClick={() => handleButtonPress(onToggleHaptic)}
        className={`w-14 h-14 ${hapticEnabled ? "bg-yellow-500" : "bg-gray-600"} rounded-full flex items-center justify-center shadow-lg active:scale-95 transition-all`}
        aria-label={`${hapticEnabled ? "Disable" : "Enable"} haptic feedback`}
      >
        <svg
          xmlns="http://www.w3.org/2000/svg"
          width="24"
          height="24"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
          className="text-white"
        >
          <path d="M2 12h8" />
          <path d="M14 12h8" />
          <circle cx="12" cy="12" r="10" />
          <path d="M12 6v12" />
        </svg>
      </button>

      {showInfo && (
        <div className="fixed inset-0 bg-black/80 flex items-center justify-center z-20 p-4">
          <div className="bg-gray-800 rounded-lg p-6 max-w-md w-full">
            <h3 className="text-xl font-bold text-white mb-4">Mobile Particle Controls</h3>
            <ul className="text-gray-200 space-y-2 mb-6">
              <li>
                • <strong>Drag:</strong> Touch and drag to move particles around
              </li>
              <li>
                • <strong>Quick Tap:</strong> Tap anywhere to form a rotating circle
              </li>
              <li>
                • <strong>Circle Button:</strong> Toggle circle formation manually
              </li>
              <li>
                • <strong>Gear Button:</strong> Open behavior customization panel
              </li>
              <li>
                • <strong>Vibration Button:</strong> Toggle haptic feedback on/off
              </li>
              <li>
                • <strong>Feel:</strong> Vibrations when particles collide or form patterns
              </li>
            </ul>
            <button
              onClick={() => handleButtonPress(() => setShowInfo(false))}
              className="w-full bg-blue-600 text-white py-2 rounded-md"
            >
              Close
            </button>
          </div>
        </div>
      )}
    </div>
  )
}
