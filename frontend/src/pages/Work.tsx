import { useState, useEffect } from 'react'
import { Clock, Calendar, DollarSign, PlayCircle, StopCircle, AlertCircle, X, Power } from 'lucide-react'
import Navbar from '../components/Navbar'
import api from '../lib/api'

interface AttendanceRecord {
  id: string
  clock_in: string
  clock_out: string | null
  hours_worked: number | null
  date: string
}

interface PayrollRecord {
  id: string
  period_start: string
  period_end: string
  total_hours: number
  gross_pay: number
  status: string
  created_at: string
}

export default function Work() {
  const [currentTime, setCurrentTime] = useState(new Date())
  const [isClockedIn, setIsClockedIn] = useState(false)
  const [loading, setLoading] = useState(false)
  const [todayHours, setTodayHours] = useState(0)
  const [error, setError] = useState('')
  const [shifts, setShifts] = useState<any[]>([])
  const [payrolls, setPayrolls] = useState<PayrollRecord[]>([])
  const [confirmAction, setConfirmAction] = useState<'clock_in' | 'clock_out' | null>(null)
  const [confirmTime, setConfirmTime] = useState<Date | null>(null)

  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentTime(new Date())
    }, 1000)

    checkClockStatus()
    loadShifts()
    loadPayrolls()

    return () => clearInterval(timer)
  }, [])

  const checkClockStatus = async () => {
    try {
      const response = await api.get('/attendance/summary')
      const { total_hours_today, records } = response.data
      
      setTodayHours(total_hours_today)
      
      // Check if currently clocked in (has record with no clock_out)
      const activeRecord = records.find((r: AttendanceRecord) => !r.clock_out)
      setIsClockedIn(!!activeRecord)
    } catch (error) {
      console.error('Failed to check clock status:', error)
    }
  }

  const loadShifts = async () => {
    try {
      const response = await api.get('/schedule/my')
      setShifts(response.data.slice(0, 5)) // Show only next 5 shifts
    } catch (error) {
      console.error('Failed to load shifts:', error)
    }
  }

  const loadPayrolls = async () => {
    try {
      const response = await api.get('/payroll/my')
      setPayrolls(response.data)
    } catch (error) {
      console.error('Failed to load payrolls:', error)
    }
  }

  const performClockIn = async () => {
    setLoading(true)
    setError('')
    try {
      await api.post('/attendance/start')
      setIsClockedIn(true)
      await checkClockStatus()
    } catch (err: any) {
      setError(err.response?.data?.detail || 'Failed to clock in')
    } finally {
      setLoading(false)
    }
  }

  const performClockOut = async () => {
    setLoading(true)
    setError('')
    try {
      await api.post('/attendance/end')
      setIsClockedIn(false)
      await checkClockStatus()
    } catch (err: any) {
      setError(err.response?.data?.detail || 'Failed to clock out')
    } finally {
      setLoading(false)
    }
  }

  const formatTime = (date: Date) => {
    return date.toLocaleTimeString('en-US', { 
      hour: '2-digit', 
      minute: '2-digit', 
      second: '2-digit',
      hour12: true 
    })
  }

  const formatDate = (date: Date) => {
    return date.toLocaleDateString('en-US', { 
      weekday: 'long', 
      year: 'numeric', 
      month: 'long', 
      day: 'numeric' 
    })
  }

  const openConfirm = (action: 'clock_in' | 'clock_out') => {
    setConfirmAction(action)
    setConfirmTime(new Date())
  }

  const closeConfirm = () => {
    setConfirmAction(null)
    setConfirmTime(null)
  }

  const handleConfirm = async () => {
    if (!confirmAction) return
    if (confirmAction === 'clock_in') {
      await performClockIn()
    } else {
      await performClockOut()
    }
    closeConfirm()
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar />
      
      <main className="max-w-7xl mx-auto p-8">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">My Workspace</h1>
          <p className="text-gray-600">Manage your time and view your schedule</p>
        </div>

        {/* Clock In/Out Card */}
        <div className="bg-gradient-to-br from-blue-600 to-blue-700 rounded-2xl shadow-xl p-8 text-white mb-8">
          <div className="text-center mb-8">
            <Clock className="w-16 h-16 mx-auto mb-4 opacity-90" />
            <div className="text-5xl font-bold mb-2">{formatTime(currentTime)}</div>
            <div className="text-blue-100 text-lg">{formatDate(currentTime)}</div>
          </div>

          {error && (
            <div className="mb-4 p-3 bg-red-100 border border-red-200 rounded-lg flex items-start gap-2" data-testid="clock-error">
              <AlertCircle className="w-5 h-5 text-red-600 flex-shrink-0 mt-0.5" />
              <p className="text-sm text-red-800">{error}</p>
            </div>
          )}

          <div className="flex justify-center">
            {!isClockedIn ? (
              <button
                onClick={() => openConfirm('clock_in')}
                disabled={loading}
                className="bg-white text-blue-600 px-8 py-4 rounded-xl font-semibold text-lg hover:bg-blue-50 transition-colors flex items-center gap-3 disabled:opacity-50 disabled:cursor-not-allowed shadow-lg"
                data-testid="clock-in-button"
              >
                <PlayCircle className="w-6 h-6" />
                Clock In
              </button>
            ) : (
              <button
                onClick={() => openConfirm('clock_out')}
                disabled={loading}
                className="bg-white text-red-600 px-8 py-4 rounded-xl font-semibold text-lg hover:bg-red-50 transition-colors flex items-center gap-3 disabled:opacity-50 disabled:cursor-not-allowed shadow-lg"
                data-testid="clock-out-button"
              >
                <StopCircle className="w-6 h-6" />
                Clock Out
              </button>
            )}
          </div>

          <div className="mt-6 text-center">
            <div className="inline-flex items-center gap-2 bg-[rgba(255,255,255,0.08)] backdrop-blur-sm px-4 py-2 rounded-lg">
              <span className="text-blue-100">Hours today:</span>
              <span className="font-bold text-xl">{todayHours.toFixed(2)}h</span>
            </div>
          </div>
        </div>

        {confirmAction && (
          <div className="fixed inset-0 z-40 flex items-center justify-center bg-black/40 px-4">
            <div className="w-full max-w-lg rounded-3xl bg-white shadow-2xl border border-gray-200 p-8">
              <div className="flex items-center justify-between">
                <div className="text-left">
                  <p className="text-xs font-semibold uppercase tracking-[0.12em] text-gray-500">Current time</p>
                  <p className="text-lg font-bold text-gray-900">{formatTime(confirmTime || new Date())}</p>
                </div>
                <button
                  type="button"
                  onClick={closeConfirm}
                  className="rounded-full p-2 text-gray-400 hover:bg-gray-100 hover:text-gray-600"
                  aria-label="Close confirmation"
                >
                  <X className="h-5 w-5" />
                </button>
              </div>

              <div className="mt-6 flex flex-col items-center text-center gap-2">
                <div className="h-14 w-14 rounded-full bg-blue-50 text-blue-600 flex items-center justify-center shadow-inner">
                  <Power className="h-7 w-7" />
                </div>
                <h3 className="text-xl font-bold text-gray-900">
                  {confirmAction === 'clock_in' ? 'Ready to clock in?' : 'Ready to clock out?'}
                </h3>
                <p className="text-sm text-gray-600 max-w-sm">
                  We’ll record this time for your attendance. You can cancel if you opened this by mistake.
                </p>
              </div>

              <div className="mt-7 flex flex-col gap-3 sm:flex-row sm:justify-center sm:gap-4">
                <button
                  type="button"
                  onClick={closeConfirm}
                  className="w-full sm:w-32 rounded-full border border-gray-300 px-4 py-2.5 text-sm font-semibold text-gray-700 hover:bg-gray-50"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  disabled={loading}
                  onClick={handleConfirm}
                  className="w-full sm:w-32 inline-flex items-center justify-center gap-2 rounded-full bg-blue-600 px-4 py-2.5 text-sm font-semibold text-white shadow-sm transition hover:bg-blue-700 disabled:opacity-60"
                >
                  {loading && <span className="h-4 w-4 rounded-full border-2 border-white border-t-transparent animate-spin" />}
                  Confirm
                </button>
              </div>
            </div>
          </div>
        )}

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* My Shifts */}
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
            <div className="flex items-center gap-2 mb-4">
              <Calendar className="w-5 h-5 text-blue-600" />
              <h2 className="text-lg font-semibold text-gray-900">My Shifts</h2>
            </div>
            
            {shifts.length > 0 ? (
              <div className="space-y-3">
                {shifts.map((shift) => (
                  <div key={shift.id} className="border border-gray-200 rounded-lg p-3">
                    <div className="flex justify-between items-start">
                      <div>
                        <div className="font-medium text-gray-900">
                          {new Date(shift.shift_date).toLocaleDateString()}
                        </div>
                        <div className="text-sm text-gray-600">
                          {shift.start_time} - {shift.end_time}
                        </div>
                      </div>
                      <span className="px-2 py-1 text-xs bg-blue-100 text-blue-700 rounded capitalize">
                        {shift.status}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-gray-500 text-center py-8">No upcoming shifts</p>
            )}
          </div>

          {/* My Payroll */}
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
            <div className="flex items-center gap-2 mb-4">
              <DollarSign className="w-5 h-5 text-green-600" />
              <h2 className="text-lg font-semibold text-gray-900">My Payroll</h2>
            </div>
            
            {payrolls.length > 0 ? (
              <div className="space-y-3">
                {payrolls.slice(0, 5).map((payroll) => (
                  <div key={payroll.id} className="border border-gray-200 rounded-lg p-3">
                    <div className="flex justify-between items-start">
                      <div>
                        <div className="font-medium text-gray-900">
                          {new Date(payroll.period_start).toLocaleDateString()} - {new Date(payroll.period_end).toLocaleDateString()}
                        </div>
                        <div className="text-sm text-gray-600">
                          {payroll.total_hours}h
                        </div>
                      </div>
                      <div className="text-right">
                        <div className="font-bold text-green-600">
                          ${payroll.gross_pay.toFixed(2)}
                        </div>
                        <span className="px-2 py-1 text-xs bg-green-100 text-green-700 rounded capitalize">
                          {payroll.status}
                        </span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-gray-500 text-center py-8">No approved payroll records</p>
            )}
          </div>
        </div>
      </main>
    </div>
  )
}
