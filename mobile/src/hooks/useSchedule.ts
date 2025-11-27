import { useEffect, useMemo, useState } from 'react'
import { ShiftResponse } from '../types/api'
import { getMySchedule } from '../services/api'

export type GroupedShifts = Array<{
  date: string
  shifts: ShiftResponse[]
}>

export default function useSchedule() {
  const [shifts, setShifts] = useState<ShiftResponse[]>([])
  const [loading, setLoading] = useState(true)

  const upcomingShifts = useMemo(() => {
    const today = new Date()
    today.setHours(0, 0, 0, 0)

    return shifts
      .filter((shift) => {
        const shiftDate = new Date(`${shift.shift_date}T00:00:00`)
        return shiftDate >= today
      })
      .sort((a, b) => {
        if (a.shift_date === b.shift_date) {
          return a.start_time.localeCompare(b.start_time)
        }
        return a.shift_date.localeCompare(b.shift_date)
      })
  }, [shifts])

  const fetchShifts = async () => {
    setLoading(true)
    try {
      const data = await getMySchedule()
      setShifts(data)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchShifts()
  }, [])

  const grouped: GroupedShifts = useMemo(() => {
    const map: Record<string, ShiftResponse[]> = {}
    upcomingShifts.forEach((shift) => {
      map[shift.shift_date] = map[shift.shift_date] ? [...map[shift.shift_date], shift] : [shift]
    })
    return Object.entries(map)
      .sort(([a], [b]) => (a < b ? -1 : 1))
      .map(([date, group]) => ({
        date,
        shifts: group.sort((a, b) => a.start_time.localeCompare(b.start_time)),
      }))
  }, [upcomingShifts])

  const upcoming = useMemo(() => {
    return upcomingShifts.slice(0, 3)
  }, [upcomingShifts])

  return { shifts, grouped, upcoming, loading, refresh: fetchShifts }
}
