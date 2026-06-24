import { useState, useCallback } from 'react'
import api from '../services/api'
import type { Intervention, InterventionStatus, InterventionType } from '../types/dashboard'

// Helper to format slot timestamps into friendly text
const formatSlot = (slot: { startTime: string; endTime: string }) => {
  const start = new Date(slot.startTime)
  const end = new Date(slot.endTime)
  const dateStr = start.toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' })
  const startStr = start.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', hour12: true })
  const endStr = end.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', hour12: true })
  return `${dateStr}, ${startStr} - ${endStr}`
}

// Mapper to align DB interventions to frontend specifications
const mapIntervention = (item: any): Intervention => {
  const payload: any = {}
  if (item.type === 'draft_proposal') {
    payload.draftText = item.content_payload.body || item.content_payload.title
  } else if (item.type === 'scheduling_proposal') {
    const slots = item.content_payload.proposedSlots || []
    payload.slots = slots.map(formatSlot)
  }

  return {
    id: item.id,
    type: item.type as InterventionType,
    status: item.status === 'pending' ? 'active' : (item.status as InterventionStatus),
    title: item.content_payload.title || 'AI Suggestion',
    message: item.content_payload.message || item.trigger_reason || 'AI suggestion ready.',
    payload,
  }
}

export const useInterventions = () => {
  const [interventions, setInterventions] = useState<Intervention[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const fetchInterventions = useCallback(async () => {
    setLoading(true)
    setError(null)
    try {
      // Trigger a generation/fetch from backend
      const res = await api.post('/interventions/generate')
      const generated = res.data.interventionsGenerated || []
      const mapped = generated.map(mapIntervention)
      setInterventions(mapped)
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to fetch interventions')
    } finally {
      setLoading(false)
    }
  }, [])

  const updateInterventionStatus = useCallback(async (id: string, status: InterventionStatus, snoozedUntil?: string) => {
    setError(null)
    try {
      const payload: any = { status }
      if (status === 'snoozed') {
        payload.snoozed_until = snoozedUntil || new Date(Date.now() + 30 * 60000).toISOString()
      }
      await api.patch(`/interventions/${id}/status`, payload)
      // Wiping out the local intervention since it's no longer active/pending
      setInterventions((prev) => prev.filter((item) => item.id !== id))
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to update intervention')
      throw err
    }
  }, [])

  return {
    interventions,
    loading,
    error,
    fetchInterventions,
    updateInterventionStatus,
  }
}
