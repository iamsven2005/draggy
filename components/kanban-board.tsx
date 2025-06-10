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
  color?: string
}

interface KanbanBoardProps {
  isOpen: boolean
  onToggle: () => void
}

export function KanbanBoard({ isOpen, onToggle }: KanbanBoardProps) {
  const [columns, setColumns] = useState<Column[]>([
    { id: "todo", title: "To Do", tasks: [], color: "#3b82f6" },
    { id: "inprogress", title: "In Progress", tasks: [], color: "#f59e0b" },
    { id: "done", title: "Done", tasks: [], color: "#10b981" },
  ])
  const [draggedTask, setDraggedTask] = useState<{ task: Task; sourceColumnId: string } | null>(null)
  const [draggedColumn, setDraggedColumn] = useState<Column | null>(null)
  const [newTaskTitle, setNewTaskTitle] = useState("")
  const [newTaskDescription, setNewTaskDescription] = useState("")
  const [showAddTask, setShowAddTask] = useState(false)
  const [targetColumnId, setTargetColumnId] = useState<string>("todo")
  const [editingTask, setEditingTask] = useState<Task | null>(null)
  const [editingColumn, setEditingColumn] = useState<Column | null>(null)
  const [showAddColumn, setShowAddColumn] = useState(false)
  const [newColumnTitle, setNewColumnTitle] = useState("")
  const [newColumnColor, setNewColumnColor] = useState("#6366f1")
  const [searchQuery, setSearchQuery] = useState("")
  const [filteredTasks, setFilteredTasks] = useState<{ [columnId: string]: Task[] }>({})
  const dragOverColumnRef = useRef<string | null>(null)
  const dragOverTaskRef = useRef<string | null>(null)
  const scrollContainerRef = useRef<HTMLDivElement>(null)

  // Predefined colors for columns
  const columnColors = [
    "#3b82f6",
    "#f59e0b",
    "#10b981",
    "#ef4444",
    "#8b5cf6",
    "#ec4899",
    "#06b6d4",
    "#84cc16",
    "#f97316",
    "#6366f1",
  ]

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

  // Filter tasks based on search query
  useEffect(() => {
    if (!searchQuery.trim()) {
      setFilteredTasks({})
      return
    }

    const query = searchQuery.toLowerCase()
    const filtered: { [columnId: string]: Task[] } = {}

    columns.forEach((column) => {
      filtered[column.id] = column.tasks.filter(
        (task) => task.title.toLowerCase().includes(query) || task.description.toLowerCase().includes(query),
      )
    })

    setFilteredTasks(filtered)
  }, [searchQuery, columns])

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

  const addColumn = () => {
    if (!newColumnTitle.trim()) return

    const newColumn: Column = {
      id: generateId(),
      title: newColumnTitle.trim(),
      tasks: [],
      color: newColumnColor,
    }

    setColumns((prev) => [...prev, newColumn])
    setNewColumnTitle("")
    setShowAddColumn(false)
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

  const updateColumn = (updatedColumn: Column) => {
    setColumns((prev) => prev.map((col) => (col.id === updatedColumn.id ? updatedColumn : col)))
    setEditingColumn(null)
    hapticManager.trigger(HapticPatterns.MEDIUM_TAP)
  }

  const deleteTask = (taskId: string) => {
    if (confirm("Are you sure you want to delete this task?")) {
      setColumns((prev) => prev.map((col) => ({ ...col, tasks: col.tasks.filter((task) => task.id !== taskId) })))
      hapticManager.trigger(HapticPatterns.STRONG_TAP)
    }
  }

  const deleteColumn = (columnId: string) => {
    const column = columns.find((col) => col.id === columnId)
    if (!column) return

    const hasTasksMessage =
      column.tasks.length > 0 ? `This column contains ${column.tasks.length} task(s). All tasks will be deleted. ` : ""

    if (confirm(`${hasTasksMessage}Are you sure you want to delete the "${column.title}" column?`)) {
      setColumns((prev) => prev.filter((col) => col.id !== columnId))
      hapticManager.trigger(HapticPatterns.STRONG_TAP)
    }
  }

  const copyColumn = (columnId: string) => {
    const columnToCopy = columns.find((col) => col.id === columnId)
    if (!columnToCopy) return

    const copiedColumn: Column = {
      ...columnToCopy,
      id: generateId(),
      title: `${columnToCopy.title} (Copy)`,
      tasks: columnToCopy.tasks.map((task) => ({
        ...task,
        id: generateId(),
        createdAt: Date.now(),
        updatedAt: Date.now(),
      })),
    }

    const columnIndex = columns.findIndex((col) => col.id === columnId)
    setColumns((prev) => [...prev.slice(0, columnIndex + 1), copiedColumn, ...prev.slice(columnIndex + 1)])
    hapticManager.trigger(HapticPatterns.SUCCESS)
  }

  const moveColumn = (fromIndex: number, toIndex: number) => {
    if (fromIndex === toIndex) return

    setColumns((prev) => {
      const newColumns = [...prev]
      const [movedColumn] = newColumns.splice(fromIndex, 1)
      newColumns.splice(toIndex, 0, movedColumn)
      return newColumns
    })
    hapticManager.trigger(HapticPatterns.MEDIUM_TAP)
  }

  const handleTaskDragStart = (e: React.DragEvent, task: Task, sourceColumnId: string) => {
    setDraggedTask({ task, sourceColumnId })
    e.dataTransfer.effectAllowed = "move"
    hapticManager.trigger(HapticPatterns.LIGHT_TAP)
  }

  const handleColumnDragStart = (e: React.DragEvent, column: Column) => {
    setDraggedColumn(column)
    e.dataTransfer.effectAllowed = "move"
    hapticManager.trigger(HapticPatterns.LIGHT_TAP)
  }

  const handleTaskDragOver = (e: React.DragEvent, columnId: string) => {
    e.preventDefault()
    e.dataTransfer.dropEffect = "move"
    dragOverColumnRef.current = columnId
  }

  const handleColumnDragOver = (e: React.DragEvent, targetColumnId: string) => {
    e.preventDefault()
    e.dataTransfer.dropEffect = "move"
    dragOverTaskRef.current = targetColumnId
  }

  const handleTaskDragLeave = (e: React.DragEvent) => {
    if (!e.currentTarget.contains(e.relatedTarget as Node)) {
      dragOverColumnRef.current = null
    }
  }

  const handleColumnDragLeave = (e: React.DragEvent) => {
    if (!e.currentTarget.contains(e.relatedTarget as Node)) {
      dragOverTaskRef.current = null
    }
  }

  const handleTaskDrop = (e: React.DragEvent, targetColumnId: string) => {
    e.preventDefault()
    dragOverColumnRef.current = null

    if (!draggedTask) return

    const { task, sourceColumnId } = draggedTask

    if (sourceColumnId === targetColumnId) {
      setDraggedTask(null)
      return
    }

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

  const handleColumnDrop = (e: React.DragEvent, targetColumnId: string) => {
    e.preventDefault()
    dragOverTaskRef.current = null

    if (!draggedColumn) return

    const fromIndex = columns.findIndex((col) => col.id === draggedColumn.id)
    const toIndex = columns.findIndex((col) => col.id === targetColumnId)

    moveColumn(fromIndex, toIndex)
    setDraggedColumn(null)
  }

  const handleDragEnd = () => {
    setDraggedTask(null)
    setDraggedColumn(null)
    dragOverColumnRef.current = null
    dragOverTaskRef.current = null
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
    event.target.value = ""
  }

  const scrollLeft = () => {
    if (scrollContainerRef.current) {
      scrollContainerRef.current.scrollBy({ left: -300, behavior: "smooth" })
    }
  }

  const scrollRight = () => {
    if (scrollContainerRef.current) {
      scrollContainerRef.current.scrollBy({ left: 300, behavior: "smooth" })
    }
  }

  const getTasksToDisplay = (column: Column) => {
    if (searchQuery.trim()) {
      return filteredTasks[column.id] || []
    }
    return column.tasks
  }

  const getTotalFilteredTasks = () => {
    if (!searchQuery.trim()) return 0
    return Object.values(filteredTasks).reduce((total, tasks) => total + tasks.length, 0)
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
          <div className="flex items-center gap-4">
            <h2 className="text-2xl font-bold">📋 Kanban Board</h2>
            {searchQuery.trim() && (
              <span className="text-sm text-gray-400">Found {getTotalFilteredTasks()} task(s)</span>
            )}
          </div>
          <div className="flex gap-2">
            <button
              onClick={() => setShowAddTask(true)}
              className="bg-green-600 hover:bg-green-700 text-white px-3 py-1 rounded text-sm transition-colors"
            >
              + Task
            </button>
            <button
              onClick={() => setShowAddColumn(true)}
              className="bg-blue-600 hover:bg-blue-700 text-white px-3 py-1 rounded text-sm transition-colors"
            >
              + Column
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

        {/* Search Bar */}
        <div className="mb-4 flex-shrink-0">
          <div className="relative max-w-md">
            <input
              type="text"
              placeholder="Search tasks..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full bg-gray-800 border border-gray-600 rounded-lg px-4 py-2 pl-10 text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
            <svg
              className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
              />
            </svg>
            {searchQuery && (
              <button
                onClick={() => setSearchQuery("")}
                className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-white"
              >
                ✕
              </button>
            )}
          </div>
        </div>

        {/* Scroll Controls */}
        <div className="flex justify-between items-center mb-2 flex-shrink-0">
          <button
            onClick={scrollLeft}
            className="bg-gray-700 hover:bg-gray-600 text-white p-2 rounded-lg transition-colors"
            title="Scroll Left"
          >
            ←
          </button>
          <span className="text-sm text-gray-400">{columns.length} column(s) • Drag columns to reorder</span>
          <button
            onClick={scrollRight}
            className="bg-gray-700 hover:bg-gray-600 text-white p-2 rounded-lg transition-colors"
            title="Scroll Right"
          >
            →
          </button>
        </div>

        {/* Board */}
        <div
          ref={scrollContainerRef}
          className="flex-1 flex gap-4 overflow-x-auto overflow-y-hidden pb-4"
          style={{ scrollbarWidth: "thin" }}
        >
          {columns.map((column, columnIndex) => {
            const tasksToDisplay = getTasksToDisplay(column)
            const isHighlighted = searchQuery.trim() && tasksToDisplay.length > 0

            return (
              <div
                key={column.id}
                draggable
                onDragStart={(e) => handleColumnDragStart(e, column)}
                onDragOver={(e) => handleColumnDragOver(e, column.id)}
                onDragLeave={handleColumnDragLeave}
                onDrop={(e) => handleColumnDrop(e, column.id)}
                onDragEnd={handleDragEnd}
                className={`min-w-80 max-w-80 bg-gray-800 rounded-lg p-4 flex flex-col transition-all duration-200 cursor-move ${
                  dragOverTaskRef.current === column.id ? "bg-gray-700 ring-2 ring-purple-500" : ""
                } ${draggedColumn?.id === column.id ? "opacity-50" : ""} ${
                  isHighlighted ? "ring-2 ring-yellow-500" : ""
                }`}
              >
                {/* Column Header */}
                <div className="flex justify-between items-center mb-4 flex-shrink-0">
                  <div className="flex items-center gap-2 flex-1">
                    <div className="w-3 h-3 rounded-full flex-shrink-0" style={{ backgroundColor: column.color }} />
                    <h3 className="font-semibold text-lg truncate">{column.title}</h3>
                    <span className="bg-gray-600 text-xs px-2 py-1 rounded-full flex-shrink-0">
                      {searchQuery.trim() ? tasksToDisplay.length : column.tasks.length}
                    </span>
                  </div>
                  <div className="flex gap-1 opacity-0 group-hover:opacity-100 hover:opacity-100 transition-opacity">
                    <button
                      onClick={() => setEditingColumn(column)}
                      className="text-blue-400 hover:text-blue-300 text-xs p-1"
                      title="Edit Column"
                    >
                      ✏️
                    </button>
                    <button
                      onClick={() => copyColumn(column.id)}
                      className="text-green-400 hover:text-green-300 text-xs p-1"
                      title="Copy Column"
                    >
                      📋
                    </button>
                    <button
                      onClick={() => deleteColumn(column.id)}
                      className="text-red-400 hover:text-red-300 text-xs p-1"
                      title="Delete Column"
                    >
                      🗑️
                    </button>
                  </div>
                </div>

                {/* Tasks Drop Zone */}
                <div
                  className={`flex-1 overflow-y-auto space-y-3 min-h-20 transition-all duration-200 ${
                    dragOverColumnRef.current === column.id ? "bg-gray-700/50 rounded-lg p-2" : ""
                  }`}
                  onDragOver={(e) => handleTaskDragOver(e, column.id)}
                  onDragLeave={handleTaskDragLeave}
                  onDrop={(e) => handleTaskDrop(e, column.id)}
                >
                  {tasksToDisplay.map((task) => (
                    <div
                      key={task.id}
                      draggable
                      onDragStart={(e) => handleTaskDragStart(e, task, column.id)}
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
                      {task.description && (
                        <p className="text-gray-300 text-xs mb-2 line-clamp-3">{task.description}</p>
                      )}
                      <div className="text-xs text-gray-400">
                        <div>Created: {formatDate(task.createdAt)}</div>
                        {task.updatedAt !== task.createdAt && <div>Updated: {formatDate(task.updatedAt)}</div>}
                      </div>
                    </div>
                  ))}

                  {tasksToDisplay.length === 0 && searchQuery.trim() && (
                    <div className="text-center text-gray-500 py-8">No matching tasks</div>
                  )}

                  {tasksToDisplay.length === 0 && !searchQuery.trim() && (
                    <div className="text-center text-gray-500 py-8">Drop tasks here</div>
                  )}
                </div>
              </div>
            )
          })}
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

        {/* Add Column Modal */}
        {showAddColumn && (
          <div className="fixed inset-0 bg-black/80 flex items-center justify-center z-60 p-4">
            <div className="bg-gray-800 rounded-lg p-6 max-w-md w-full">
              <h3 className="text-xl font-bold mb-4">Add New Column</h3>

              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium mb-2">Title *</label>
                  <input
                    type="text"
                    value={newColumnTitle}
                    onChange={(e) => setNewColumnTitle(e.target.value)}
                    placeholder="Enter column title..."
                    className="w-full bg-gray-700 border border-gray-600 rounded px-3 py-2 text-white placeholder-gray-400"
                    autoFocus
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium mb-2">Color</label>
                  <div className="flex gap-2 flex-wrap">
                    {columnColors.map((color) => (
                      <button
                        key={color}
                        onClick={() => setNewColumnColor(color)}
                        className={`w-8 h-8 rounded-full border-2 transition-all ${
                          newColumnColor === color ? "border-white scale-110" : "border-gray-600"
                        }`}
                        style={{ backgroundColor: color }}
                        title={color}
                      />
                    ))}
                  </div>
                </div>
              </div>

              <div className="flex gap-3 mt-6">
                <button
                  onClick={addColumn}
                  disabled={!newColumnTitle.trim()}
                  className="flex-1 bg-blue-600 hover:bg-blue-700 disabled:bg-gray-600 disabled:cursor-not-allowed text-white py-2 rounded-md transition-colors"
                >
                  Add Column
                </button>
                <button
                  onClick={() => {
                    setShowAddColumn(false)
                    setNewColumnTitle("")
                    setNewColumnColor("#6366f1")
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

        {/* Edit Column Modal */}
        {editingColumn && (
          <div className="fixed inset-0 bg-black/80 flex items-center justify-center z-60 p-4">
            <div className="bg-gray-800 rounded-lg p-6 max-w-md w-full">
              <h3 className="text-xl font-bold mb-4">Edit Column</h3>

              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium mb-2">Title *</label>
                  <input
                    type="text"
                    value={editingColumn.title}
                    onChange={(e) => setEditingColumn({ ...editingColumn, title: e.target.value })}
                    className="w-full bg-gray-700 border border-gray-600 rounded px-3 py-2 text-white"
                    autoFocus
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium mb-2">Color</label>
                  <div className="flex gap-2 flex-wrap">
                    {columnColors.map((color) => (
                      <button
                        key={color}
                        onClick={() => setEditingColumn({ ...editingColumn, color })}
                        className={`w-8 h-8 rounded-full border-2 transition-all ${
                          editingColumn.color === color ? "border-white scale-110" : "border-gray-600"
                        }`}
                        style={{ backgroundColor: color }}
                        title={color}
                      />
                    ))}
                  </div>
                </div>
              </div>

              <div className="flex gap-3 mt-6">
                <button
                  onClick={() => updateColumn(editingColumn)}
                  disabled={!editingColumn.title.trim()}
                  className="flex-1 bg-blue-600 hover:bg-blue-700 disabled:bg-gray-600 disabled:cursor-not-allowed text-white py-2 rounded-md transition-colors"
                >
                  Update Column
                </button>
                <button
                  onClick={() => setEditingColumn(null)}
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
