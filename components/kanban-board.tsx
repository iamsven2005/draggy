"use client"

import type React from "react"

import { useState, useEffect, useRef } from "react"
import { hapticManager, HapticPatterns } from "../utils/haptic-feedback"

interface Task {
  id: string
  title: string
  description: string
  createdAt: number
  updatedAt: number
}

interface Column {
  id: string
  title: string
  tasks: Task[]
}

interface KanbanBoardProps {
  isOpen: boolean
  onToggle: () => void
}

export function KanbanBoard({ isOpen, onToggle }: KanbanBoardProps) {
  const [columns, setColumns] = useState<Column[]>([
    { id: "todo", title: "To Do", tasks: [] },
    { id: "inprogress", title: "In Progress", tasks: [] },
    { id: "done", title: "Done", tasks: [] },
  ])
  const [draggedTask, setDraggedTask] = useState<{ task: Task; sourceColumnId: string } | null>(null)
  const [newTaskTitle, setNewTaskTitle] = useState("")
  const [newTaskDescription, setNewTaskDescription] = useState("")
  const [showAddTask, setShowAddTask] = useState(false)
  const [targetColumnId, setTargetColumnId] = useState<string>("todo")
  const [editingTask, setEditingTask] = useState<Task | null>(null)
  const dragOverColumnRef = useRef<string | null>(null)

  // Load data from localStorage on mount
  useEffect(() => {
    const savedColumns = localStorage.getItem("kanban-columns")
    if (savedColumns) {
      try {
        const parsedColumns = JSON.parse(savedColumns)
        setColumns(parsedColumns)
      } catch (error) {
        console.error("Failed to load kanban data:", error)
      }
    }
  }, [])

  // Save to localStorage whenever columns change
  useEffect(() => {
    localStorage.setItem("kanban-columns", JSON.stringify(columns))
  }, [columns])

  const generateId = () => {
    return Date.now().toString(36) + Math.random().toString(36).substr(2)
  }

  const addTask = () => {
    if (!newTaskTitle.trim()) return

    const newTask: Task = {
      id: generateId(),
      title: newTaskTitle.trim(),
      description: newTaskDescription.trim(),
      createdAt: Date.now(),
      updatedAt: Date.now(),
    }

    setColumns((prev) =>
      prev.map((col) => (col.id === targetColumnId ? { ...col, tasks: [...col.tasks, newTask] } : col)),
    )

    setNewTaskTitle("")
    setNewTaskDescription("")
    setShowAddTask(false)
    hapticManager.trigger(HapticPatterns.SUCCESS)
  }

  const updateTask = (updatedTask: Task) => {
    setColumns((prev) =>
      prev.map((col) => ({
        ...col,
        tasks: col.tasks.map((task) => (task.id === updatedTask.id ? { ...updatedTask, updatedAt: Date.now() } : task)),
      })),
    )
    setEditingTask(null)
    hapticManager.trigger(HapticPatterns.MEDIUM_TAP)
  }

  const deleteTask = (taskId: string) => {
    setColumns((prev) => prev.map((col) => ({ ...col, tasks: col.tasks.filter((task) => task.id !== taskId) })))
    hapticManager.trigger(HapticPatterns.STRONG_TAP)
  }

  const handleDragStart = (e: React.DragEvent, task: Task, sourceColumnId: string) => {
    setDraggedTask({ task, sourceColumnId })
    e.dataTransfer.effectAllowed = "move"
    hapticManager.trigger(HapticPatterns.LIGHT_TAP)
  }

  const handleDragOver = (e: React.DragEvent, columnId: string) => {
    e.preventDefault()
    e.dataTransfer.dropEffect = "move"
    dragOverColumnRef.current = columnId
  }

  const handleDragLeave = (e: React.DragEvent) => {
    // Only clear if we're leaving the column entirely
    if (!e.currentTarget.contains(e.relatedTarget as Node)) {
      dragOverColumnRef.current = null
    }
  }

  const handleDrop = (e: React.DragEvent, targetColumnId: string) => {
    e.preventDefault()
    dragOverColumnRef.current = null

    if (!draggedTask) return

    const { task, sourceColumnId } = draggedTask

    if (sourceColumnId === targetColumnId) {
      setDraggedTask(null)
      return
    }

    // Remove task from source column and add to target column
    setColumns((prev) =>
      prev.map((col) => {
        if (col.id === sourceColumnId) {
          return { ...col, tasks: col.tasks.filter((t) => t.id !== task.id) }
        }
        if (col.id === targetColumnId) {
          return { ...col, tasks: [...col.tasks, { ...task, updatedAt: Date.now() }] }
        }
        return col
      }),
    )

    setDraggedTask(null)
    hapticManager.trigger(HapticPatterns.SUCCESS)
  }

  const handleDragEnd = () => {
    setDraggedTask(null)
    dragOverColumnRef.current = null
  }

  const formatDate = (timestamp: number) => {
    return new Date(timestamp).toLocaleDateString(undefined, {
      month: "short",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    })
  }

  const clearAllTasks = () => {
    if (confirm("Are you sure you want to clear all tasks? This cannot be undone.")) {
      setColumns((prev) => prev.map((col) => ({ ...col, tasks: [] })))
      hapticManager.trigger(HapticPatterns.ERROR)
    }
  }

  const exportData = () => {
    const dataStr = JSON.stringify(columns, null, 2)
    const dataBlob = new Blob([dataStr], { type: "application/json" })
    const url = URL.createObjectURL(dataBlob)
    const link = document.createElement("a")
    link.href = url
    link.download = `kanban-board-${new Date().toISOString().split("T")[0]}.json`
    link.click()
    URL.revokeObjectURL(url)
    hapticManager.trigger(HapticPatterns.SUCCESS)
  }

  const importData = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    if (!file) return

    const reader = new FileReader()
    reader.onload = (e) => {
      try {
        const importedData = JSON.parse(e.target?.result as string)
        if (
          Array.isArray(importedData) &&
          importedData.every((col) => col.id && col.title && Array.isArray(col.tasks))
        ) {
          setColumns(importedData)
          hapticManager.trigger(HapticPatterns.SUCCESS)
        } else {
          alert("Invalid file format")
          hapticManager.trigger(HapticPatterns.ERROR)
        }
      } catch (error) {
        alert("Failed to import file")
        hapticManager.trigger(HapticPatterns.ERROR)
      }
    }
    reader.readAsText(file)
    event.target.value = "" // Reset input
  }

  if (!isOpen) {
    return (
      <button
        onClick={onToggle}
        className="fixed top-4 right-32 bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg shadow-lg transition-colors"
      >
        📋 Kanban
      </button>
    )
  }

  return (
    <div className="fixed inset-0 bg-black/90 text-white p-4 z-50 overflow-hidden">
      <div className="h-full flex flex-col">
        {/* Header */}
        <div className="flex justify-between items-center mb-4 flex-shrink-0">
          <h2 className="text-2xl font-bold">📋 Kanban Board</h2>
          <div className="flex gap-2">
            <button
              onClick={() => setShowAddTask(true)}
              className="bg-green-600 hover:bg-green-700 text-white px-3 py-1 rounded text-sm transition-colors"
            >
              + Add Task
            </button>
            <button
              onClick={exportData}
              className="bg-purple-600 hover:bg-purple-700 text-white px-3 py-1 rounded text-sm transition-colors"
            >
              Export
            </button>
            <label className="bg-orange-600 hover:bg-orange-700 text-white px-3 py-1 rounded text-sm transition-colors cursor-pointer">
              Import
              <input type="file" accept=".json" onChange={importData} className="hidden" />
            </label>
            <button
              onClick={clearAllTasks}
              className="bg-red-600 hover:bg-red-700 text-white px-3 py-1 rounded text-sm transition-colors"
            >
              Clear All
            </button>
            <button
              onClick={onToggle}
              className="text-gray-400 hover:text-white transition-colors text-xl"
              aria-label="Close"
            >
              ✕
            </button>
          </div>
        </div>

        {/* Board */}
        <div className="flex-1 flex gap-4 overflow-hidden">
          {columns.map((column) => (
            <div
              key={column.id}
              className={`flex-1 bg-gray-800 rounded-lg p-4 flex flex-col transition-all duration-200 ${
                dragOverColumnRef.current === column.id ? "bg-gray-700 ring-2 ring-blue-500" : ""
              }`}
              onDragOver={(e) => handleDragOver(e, column.id)}
              onDragLeave={handleDragLeave}
              onDrop={(e) => handleDrop(e, column.id)}
            >
              {/* Column Header */}
              <div className="flex justify-between items-center mb-4 flex-shrink-0">
                <h3 className="font-semibold text-lg">{column.title}</h3>
                <span className="bg-gray-600 text-xs px-2 py-1 rounded-full">{column.tasks.length}</span>
              </div>

              {/* Tasks */}
              <div className="flex-1 overflow-y-auto space-y-3">
                {column.tasks.map((task) => (
                  <div
                    key={task.id}
                    draggable
                    onDragStart={(e) => handleDragStart(e, task, column.id)}
                    onDragEnd={handleDragEnd}
                    className={`bg-gray-700 p-3 rounded-lg cursor-move hover:bg-gray-600 transition-colors group ${
                      draggedTask?.task.id === task.id ? "opacity-50" : ""
                    }`}
                  >
                    <div className="flex justify-between items-start mb-2">
                      <h4 className="font-medium text-sm line-clamp-2">{task.title}</h4>
                      <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                        <button
                          onClick={() => setEditingTask(task)}
                          className="text-blue-400 hover:text-blue-300 text-xs"
                          title="Edit"
                        >
                          ✏️
                        </button>
                        <button
                          onClick={() => deleteTask(task.id)}
                          className="text-red-400 hover:text-red-300 text-xs"
                          title="Delete"
                        >
                          🗑️
                        </button>
                      </div>
                    </div>
                    {task.description && <p className="text-gray-300 text-xs mb-2 line-clamp-3">{task.description}</p>}
                    <div className="text-xs text-gray-400">
                      <div>Created: {formatDate(task.createdAt)}</div>
                      {task.updatedAt !== task.createdAt && <div>Updated: {formatDate(task.updatedAt)}</div>}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>

        {/* Add Task Modal */}
        {showAddTask && (
          <div className="fixed inset-0 bg-black/80 flex items-center justify-center z-60 p-4">
            <div className="bg-gray-800 rounded-lg p-6 max-w-md w-full">
              <h3 className="text-xl font-bold mb-4">Add New Task</h3>

              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium mb-2">Title *</label>
                  <input
                    type="text"
                    value={newTaskTitle}
                    onChange={(e) => setNewTaskTitle(e.target.value)}
                    placeholder="Enter task title..."
                    className="w-full bg-gray-700 border border-gray-600 rounded px-3 py-2 text-white placeholder-gray-400"
                    autoFocus
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium mb-2">Description</label>
                  <textarea
                    value={newTaskDescription}
                    onChange={(e) => setNewTaskDescription(e.target.value)}
                    placeholder="Enter task description..."
                    rows={3}
                    className="w-full bg-gray-700 border border-gray-600 rounded px-3 py-2 text-white placeholder-gray-400 resize-none"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium mb-2">Column</label>
                  <select
                    value={targetColumnId}
                    onChange={(e) => setTargetColumnId(e.target.value)}
                    className="w-full bg-gray-700 border border-gray-600 rounded px-3 py-2 text-white"
                  >
                    {columns.map((col) => (
                      <option key={col.id} value={col.id}>
                        {col.title}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="flex gap-3 mt-6">
                <button
                  onClick={addTask}
                  disabled={!newTaskTitle.trim()}
                  className="flex-1 bg-green-600 hover:bg-green-700 disabled:bg-gray-600 disabled:cursor-not-allowed text-white py-2 rounded-md transition-colors"
                >
                  Add Task
                </button>
                <button
                  onClick={() => {
                    setShowAddTask(false)
                    setNewTaskTitle("")
                    setNewTaskDescription("")
                  }}
                  className="flex-1 bg-gray-600 hover:bg-gray-700 text-white py-2 rounded-md transition-colors"
                >
                  Cancel
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Edit Task Modal */}
        {editingTask && (
          <div className="fixed inset-0 bg-black/80 flex items-center justify-center z-60 p-4">
            <div className="bg-gray-800 rounded-lg p-6 max-w-md w-full">
              <h3 className="text-xl font-bold mb-4">Edit Task</h3>

              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium mb-2">Title *</label>
                  <input
                    type="text"
                    value={editingTask.title}
                    onChange={(e) => setEditingTask({ ...editingTask, title: e.target.value })}
                    className="w-full bg-gray-700 border border-gray-600 rounded px-3 py-2 text-white"
                    autoFocus
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium mb-2">Description</label>
                  <textarea
                    value={editingTask.description}
                    onChange={(e) => setEditingTask({ ...editingTask, description: e.target.value })}
                    rows={3}
                    className="w-full bg-gray-700 border border-gray-600 rounded px-3 py-2 text-white resize-none"
                  />
                </div>
              </div>

              <div className="flex gap-3 mt-6">
                <button
                  onClick={() => updateTask(editingTask)}
                  disabled={!editingTask.title.trim()}
                  className="flex-1 bg-blue-600 hover:bg-blue-700 disabled:bg-gray-600 disabled:cursor-not-allowed text-white py-2 rounded-md transition-colors"
                >
                  Update Task
                </button>
                <button
                  onClick={() => setEditingTask(null)}
                  className="flex-1 bg-gray-600 hover:bg-gray-700 text-white py-2 rounded-md transition-colors"
                >
                  Cancel
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
