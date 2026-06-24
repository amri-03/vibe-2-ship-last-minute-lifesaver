import { useState, useEffect, useCallback } from 'react'
import api from '../services/api'
import type { Task, Priority, TaskStatus } from '../types/dashboard'

// Helper to map DB priority to frontend Priority
const mapPriority = (severity: string): Priority => {
  if (severity === 'critical') return 'critical'
  if (severity === 'high') return 'high'
  if (severity === 'medium') return 'medium'
  return 'low'
}

// Helper to map DB status to frontend TaskStatus
const mapStatus = (dbStatus: string): TaskStatus => {
  if (dbStatus === 'backlog') return 'pending'
  if (dbStatus === 'in_progress') return 'in_progress'
  if (dbStatus === 'completed') return 'completed'
  if (dbStatus === 'archived') return 'completed'
  return 'pending'
}

// Helper to map frontend TaskStatus to DB status
const mapStatusToDb = (status: TaskStatus): string => {
  if (status === 'pending' || status === 'active') return 'backlog'
  if (status === 'in_progress') return 'in_progress'
  if (status === 'completed') return 'completed'
  return 'backlog'
}

// Helper to format due date
const formatDueLabel = (dueAtStr?: string): string | undefined => {
  if (!dueAtStr) return undefined
  const due = new Date(dueAtStr)
  const now = new Date()

  // Simple check for today/tomorrow
  const isToday = due.toDateString() === now.toDateString()
  const tomorrow = new Date(now)
  tomorrow.setDate(now.getDate() + 1)
  const isTomorrow = due.toDateString() === tomorrow.toDateString()

  const timeStr = due.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', hour12: true })

  if (isToday) return `Today ${timeStr}`
  if (isTomorrow) return `Tomorrow ${timeStr}`

  return due.toLocaleDateString('en-US', { month: 'short', day: 'numeric' }) + ` ${timeStr}`
}

export const useTasks = () => {
  const [tasks, setTasks] = useState<Task[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const fetchTasks = useCallback(async () => {
    setLoading(true)
    setError(null)
    try {
      const res = await api.get('/tasks')
      const mappedTasks = res.data.map((t: any) => ({
        id: t.id,
        title: t.title,
        description: t.description || '',
        estimatedMinutes: t.estimated_duration_minutes,
        priority: mapPriority(t.priority_severity),
        status: mapStatus(t.status),
        dueLabel: formatDueLabel(t.due_at),
      }))
      setTasks(mappedTasks)
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to fetch tasks')
    } finally {
      setLoading(false)
    }
  }, [])

  const createTask = useCallback(async (taskData: Omit<Task, 'id' | 'status'>) => {
    setError(null)
    try {
      const res = await api.post('/tasks', {
        title: taskData.title,
        description: taskData.description || '',
        estimated_duration_minutes: taskData.estimatedMinutes,
        priority_severity: taskData.priority,
      })
      const t = res.data
      const mappedTask: Task = {
        id: t.id,
        title: t.title,
        description: t.description || '',
        estimatedMinutes: t.estimated_duration_minutes,
        priority: mapPriority(t.priority_severity),
        status: mapStatus(t.status),
        dueLabel: formatDueLabel(t.due_at),
      }
      setTasks((prev) => [...prev, mappedTask])
      return mappedTask
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to create task')
      throw err
    }
  }, [])

  const updateTask = useCallback(async (id: string, updates: Partial<Task>) => {
    setError(null)
    try {
      const apiPayload: any = {}
      if (updates.title !== undefined) apiPayload.title = updates.title
      if (updates.description !== undefined) apiPayload.description = updates.description
      if (updates.estimatedMinutes !== undefined) apiPayload.estimated_duration_minutes = updates.estimatedMinutes
      if (updates.priority !== undefined) apiPayload.priority_severity = updates.priority
      if (updates.status !== undefined) apiPayload.status = mapStatusToDb(updates.status)

      const res = await api.patch(`/tasks/${id}`, apiPayload)
      const t = res.data
      const mappedTask: Task = {
        id: t.id,
        title: t.title,
        description: t.description || '',
        estimatedMinutes: t.estimated_duration_minutes,
        priority: mapPriority(t.priority_severity),
        status: mapStatus(t.status),
        dueLabel: formatDueLabel(t.due_at),
      }
      setTasks((prev) => prev.map((item) => (item.id === id ? mappedTask : item)))
      return mappedTask
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to update task')
      throw err
    }
  }, [])

  const updateTaskStatus = useCallback(async (id: string, status: TaskStatus) => {
    return updateTask(id, { status })
  }, [updateTask])

  useEffect(() => {
    fetchTasks()
  }, [fetchTasks])

  return {
    tasks,
    loading,
    error,
    fetchTasks,
    createTask,
    updateTask,
    updateTaskStatus,
  }
}
