import { useEffect, useMemo, useState } from 'react'
import { Clock, Loader2, AlertCircle, CheckCircle2 } from 'lucide-react'
import api from '../lib/api'

type AttendanceLog = {
  id: string
  employee_id: string
  employee_name: string
  clock_in: string
  clock_out: string | null
  expected_clock_out: string
  status: 'active' | 'completed'
}

type StatsResponse = {
  total_employees: number
  active_shifts: number
  pending_payrolls: number
  currently_clocked_in: number
}

type LoadOptions = {
  silent?: boolean
}

type ActionState = {
  logId: string
}

type ActionNotice = {
  type: 'success' | 'error'
  message: string
}

export default function AttendanceLogs() {
  const [logs, setLogs] = useState<AttendanceLog[]>([])
  const [stats, setStats] = useState<StatsResponse | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [actionState, setActionState] = useState<ActionState | null>(null)
  const [actionNotice, setActionNotice] = useState<ActionNotice | null>(null)

  useEffect(() => {
    loadData()
  }, [])

  const loadData = async (options: LoadOptions = {}) => {
    const silent = options.silent ?? false
    if (!silent) {
      setLoading(true)
      setActionNotice(null)
    }
    setError('')
    try {
      const [logsRes, statsRes] = await Promise.all([
        api.get<AttendanceLog[]>('/attendance/logs', { params: { limit: 100 } }),
        api.get<StatsResponse>('/dashboard/stats'),
      ])
      setLogs(logsRes.data)
      setStats(statsRes.data)
    } catch (err: any) {
      const detail = err.response?.data?.detail
      setError(typeof detail === 'string' ? detail : 'Unable to load attendance logs.')
    } finally {
      if (!silent) {
        setLoading(false)
      }
    }
  }

  const activeLogs = useMemo(() => logs.filter((log) => log.status === 'active'), [logs])

  const formatTime = (iso: string | null) => {
    if (!iso) return '--'
    return new Date(iso).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
  }

  const formatDate = (iso: string) => {
    return new Date(iso).toLocaleDateString([], { month: 'short', day: 'numeric' })
  }

  const handleAdminClockOut = async (log: AttendanceLog) => {
    setActionNotice(null)
    setActionState({ logId: log.id })
    try {
      await api.post(`/attendance/admin/${log.employee_id}/end`)
      await loadData({ silent: true })
      setActionNotice({
        type: 'success',
        message: `Clocked out ${log.employee_name}.`,
      })
    } catch (err: any) {
      const detail = err.response?.data?.detail
      setActionNotice({
        type: 'error',
        message: typeof detail === 'string' ? detail : 'Unable to clock out employee.',
      })
    } finally {
      setActionState(null)
    }
  }

  return (
    <div className="p-8 space-y-6">
      <div className="flex flex-col gap-2 md:flex-row md:items-end md:justify-between">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">Attendance Logs</h2>
          <p className="text-sm text-gray-500">
            Monitor who is currently on shift and review the most recent clock-in activity.
          </p>
        </div>
        <button
          type="button"
          onClick={() => loadData()}
          className="self-start rounded-lg border border-gray-300 px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50"
        >
          Refresh
        </button>
      </div>

      <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-6">
        <div className="flex items-center gap-3">
          <Clock className="h-6 w-6 text-blue-600" />
          <div>
            <p className="text-sm text-gray-500">Active shifts right now</p>
            <p className="text-3xl font-bold text-gray-900">
              {stats ? stats.currently_clocked_in : '—'}
            </p>
          </div>
        </div>
        {stats?.currently_clocked_in === 0 && (
          <p className="mt-4 text-sm text-gray-500">Nobody is currently on shift.</p>
        )}
      </div>

      {error && (
        <div className="flex items-center gap-3 rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-700">
          <AlertCircle className="h-5 w-5" />
          <span>{error}</span>
        </div>
      )}

      {actionNotice && (
        <div
          className={`flex items-center gap-3 rounded-xl border p-4 text-sm ${
            actionNotice.type === 'success'
              ? 'border-emerald-200 bg-emerald-50 text-emerald-700'
              : 'border-red-200 bg-red-50 text-red-700'
          }`}
        >
          {actionNotice.type === 'success' ? (
            <CheckCircle2 className="h-5 w-5" />
          ) : (
            <AlertCircle className="h-5 w-5" />
          )}
          <span>{actionNotice.message}</span>
        </div>
      )}

      <div className="bg-white rounded-2xl shadow-sm border border-gray-200">
        <div className="flex items-center justify-between border-b border-gray-100 px-6 py-4">
          <p className="text-sm font-semibold text-gray-700">Recent Activity</p>
          <p className="text-xs text-gray-500">
            Showing {logs.length} entr{logs.length === 1 ? 'y' : 'ies'}
          </p>
        </div>

        {loading ? (
          <div className="flex items-center justify-center py-16">
            <Loader2 className="h-6 w-6 animate-spin text-blue-600" />
          </div>
        ) : logs.length === 0 ? (
          <p className="py-12 text-center text-sm text-gray-500">No attendance logs yet.</p>
        ) : (
          <div className="divide-y divide-gray-100">
            {logs.map((log) => {
              const isActive = log.status === 'active'
              const isClockingOut = actionState?.logId === log.id

              return (
                <div key={log.id} className="grid gap-4 px-6 py-4 md:grid-cols-4 md:items-center">
                  <div>
                    <p className="text-sm font-semibold text-gray-900">{log.employee_name}</p>
                    <p className="text-xs text-gray-500">{formatDate(log.clock_in)}</p>
                  </div>
                  <div>
                    <p className="text-xs uppercase text-gray-500">Clock In</p>
                    <p className="text-sm font-medium text-gray-900">{formatTime(log.clock_in)}</p>
                  </div>
                  <div>
                    <p className="text-xs uppercase text-gray-500">
                      {isActive ? 'Expected Clock Out' : 'Clock Out'}
                    </p>
                    <p className="text-sm font-medium text-gray-900">
                      {isActive ? formatTime(log.expected_clock_out) : formatTime(log.clock_out)}
                    </p>
                  </div>
                  <div className="flex flex-col gap-2 md:items-end">
                    <div className="flex items-center gap-2">
                      {isActive ? (
                        <>
                          <Loader2 className="h-4 w-4 animate-spin text-blue-600" />
                          <span className="text-sm font-semibold text-blue-700">On shift</span>
                        </>
                      ) : (
                        <>
                          <CheckCircle2 className="h-4 w-4 text-emerald-500" />
                          <span className="text-sm text-emerald-600">Completed</span>
                        </>
                      )}
                    </div>
                    {isActive ? (
                      <button
                        type="button"
                        onClick={() => handleAdminClockOut(log)}
                        disabled={isClockingOut}
                        className="inline-flex items-center justify-center gap-2 rounded-lg border border-rose-200 bg-rose-50 px-3 py-1.5 text-xs font-semibold text-rose-700 transition hover:bg-rose-100 disabled:cursor-not-allowed disabled:opacity-60"
                      >
                        {isClockingOut ? (
                          <>
                            <Loader2 className="h-4 w-4 animate-spin" />
                            <span>Clocking out...</span>
                          </>
                        ) : (
                          <span>Clock Out</span>
                        )}
                      </button>
                    ) : (
                      <span className="text-xs font-medium text-gray-500">Already clocked out</span>
                    )}
                  </div>
                </div>
              )
            })}
          </div>
        )}
      </div>

      {activeLogs.length > 0 && (
        <div className="bg-blue-50 rounded-2xl border border-blue-100 p-4">
          <p className="text-sm font-semibold text-blue-800">
            {activeLogs.length} active shift{activeLogs.length === 1 ? '' : 's'} in progress
          </p>
          <p className="text-sm text-blue-700 mt-1">
            {activeLogs.map((log) => log.employee_name).join(', ')}
          </p>
        </div>
      )}
    </div>
  )
}
