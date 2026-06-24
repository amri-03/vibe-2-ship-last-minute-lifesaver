import { useState, useEffect, useCallback } from 'react'
import api from '../services/api'
import type { TimelineEntry, EventKind } from '../types/dashboard'

export interface FocusBlock {
  id: string
  task_id: string | null
  google_event_id: string | null
  title: string
  start_time: string
  end_time: string
  status: 'scheduled' | 'active' | 'completed' | 'missed' | 'cancelled'
}

const formatTime = (isoString: string): string => {
  const date = new Date(isoString)
  return date.toLocaleTimeString('en-US', {
    hour: '2-digit',
    minute: '2-digit',
    hour12: true,
  })
}

export const useFocusBlocks = () => {
  const [focusBlocks, setFocusBlocks] = useState<FocusBlock[]>([])
  const [timeline, setTimeline] = useState<TimelineEntry[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const fetchFocusBlocks = useCallback(async (start?: string, end?: string) => {
    setLoading(true)
    setError(null)
    try {
      const now = new Date()
      // Default query range: start of today to end of today
      const startWindow = start || new Date(now.getFullYear(), now.getMonth(), now.getDate(), 0, 0, 0).toISOString()
      const endWindow = end || new Date(now.getFullYear(), now.getMonth(), now.getDate() + 1, 23, 59, 59).toISOString()

      const res = await api.get('/focus-blocks', {
        params: {
          start_time: startWindow,
          end_time: endWindow,
        },
      })

      const blocks: FocusBlock[] = res.data
      setFocusBlocks(blocks)

      // Map to TimelineEntry
      const entries: TimelineEntry[] = blocks
        .filter((b) => b.status !== 'cancelled')
        .map((b) => {
          const startTime = new Date(b.start_time)
          const endTime = new Date(b.end_time)
          const durationMinutes = Math.round((endTime.getTime() - startTime.getTime()) / (60 * 1000))

          return {
            id: b.id,
            time: formatTime(b.start_time),
            label: b.title,
            kind: 'focus' as EventKind,
            durationMinutes,
            isActive: b.status === 'active',
          }
        })

      setTimeline(entries)
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to fetch focus blocks')
    } finally {
      setLoading(false)
    }
  }, [])

  const createFocusBlock = useCallback(async (blockData: {
    task_id?: string | null
    title: string
    start_time: string
    end_time: string
  }) => {
    setError(null)
    try {
      await api.post('/focus-blocks', {
        task_id: blockData.task_id || undefined,
        title: blockData.title,
        start_time: blockData.start_time,
        end_time: blockData.end_time,
      })
      await fetchFocusBlocks()
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to create focus block')
      throw err
    }
  }, [fetchFocusBlocks])

  const syncCalendar = useCallback(async () => {
    setLoading(true)
    setError(null)
    try {
      await api.post('/focus-blocks/sync')
      await fetchFocusBlocks()
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to sync calendar')
      throw err
    } finally {
      setLoading(false)
    }
  }, [fetchFocusBlocks])

  useEffect(() => {
    fetchFocusBlocks()
  }, [fetchFocusBlocks])

  return {
    focusBlocks,
    timeline,
    loading,
    error,
    fetchFocusBlocks,
    createFocusBlock,
    syncCalendar,
  }
}
