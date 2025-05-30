"use client"

import { useRef, useCallback } from "react"
import type { MouseState } from "../types/particle"

export function useMouse() {
  const mouseRef = useRef<MouseState>({
    x: 0,
    y: 0,
    prevX: 0,
    prevY: 0,
    isMoving: false,
  })

  const handleMouseMove = useCallback((e: MouseEvent, canvas: HTMLCanvasElement) => {
    const rect = canvas.getBoundingClientRect()
    mouseRef.current.prevX = mouseRef.current.x
    mouseRef.current.prevY = mouseRef.current.y
    mouseRef.current.x = e.clientX - rect.left
    mouseRef.current.y = e.clientY - rect.top
    mouseRef.current.isMoving = true
  }, [])

  const handleClick = useCallback((e: MouseEvent, canvas: HTMLCanvasElement) => {
    const rect = canvas.getBoundingClientRect()
    mouseRef.current.x = e.clientX - rect.left
    mouseRef.current.y = e.clientY - rect.top
  }, [])

  return {
    mouseRef,
    handleMouseMove,
    handleClick,
  }
}
