import { useCallback, useEffect, useState } from 'react'
import { AttendanceSummary } from '../types/api'
import { getAttendanceSummary, clockIn as clockInRequest, clockOut as clockOutRequest } from '../services/api'

const getErrorMessage = (error: unknown) => {
  if (error && typeof error === 'object') {
    const err = error as { response?: { data?: { detail?: string; message?: string } } }
    return err.response?.data?.detail ?? err.response?.data?.message ?? 'Unable to update attendance'
  }
  if (typeof error === 'string') {
    return error
  }
  return 'Unable to update attendance'
}

export default function useAttendance() {
  const [data, setData] = useState<AttendanceSummary | null>(null)
  const [loading, setLoading] = useState(true)
  const [mutating, setMutating] = useState(false)
  const [statusOverride, setStatusOverride] = useState<boolean | null>(null)
  const [error, setError] = useState('')

  const fetchSummary = useCallback(async () => {
    setLoading(true)
    try {
      const response = await getAttendanceSummary()
      setData(response)
      setStatusOverride(null)
      setError('')
    } catch (err) {
      setError(getErrorMessage(err))
      throw err
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    fetchSummary().catch(() => null)
  }, [fetchSummary])

  const handleClockIn = async () => {
    setMutating(true)
    setError('')
    try {
      await clockInRequest()
      setStatusOverride(true)
      try {
        await fetchSummary()
      } catch {
        // Keep optimistic status and surface error via state
      }
    } catch (err) {
      setError(getErrorMessage(err))
    } finally {
      setMutating(false)
    }
  }

  const handleClockOut = async () => {
    setMutating(true)
    setError('')
    try {
      await clockOutRequest()
      setStatusOverride(false)
      try {
        await fetchSummary()
      } catch {
        // Keep optimistic status and surface error via state
      }
    } catch (err) {
      setError(getErrorMessage(err))
    } finally {
      setMutating(false)
    }
  }

  const active = data?.records.find((record) => !record.clock_out)

  return {
    summary: data,
    loading,
    error,
    clockIn: handleClockIn,
    clockOut: handleClockOut,
    isClockedIn: statusOverride ?? Boolean(active),
    mutating,
    refresh: fetchSummary,
  }
}
