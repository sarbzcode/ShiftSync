import { useEffect, useMemo, useState, type FormEvent, type ReactNode } from 'react'
import {
  CalendarDays,
  ChevronLeft,
  ChevronRight,
  Clock,
  Edit3,
  Loader2,
  Plus,
  Trash2,
  Search,
  UserCircle2,
  X,
} from 'lucide-react'
import api from '../lib/api'

type ShiftRecord = {
  id: string
  employee_id: string
  employee_name: string
  employee_email: string
  employee_username?: string | null
  shift_date: string
  start_time: string
  end_time: string
  status: 'assigned' | 'completed'
}

type EmployeeOption = {
  id: string
  name: string
  email: string
  username: string
  status: 'active' | 'disabled'
}

type CalendarCell = {
  date: Date
  inCurrentMonth: boolean
}

const dayLabels = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat']

export default function ShiftScheduling() {
  const today = new Date()
  const [currentMonth, setCurrentMonth] = useState(
    () => new Date(today.getFullYear(), today.getMonth(), 1)
  )
  const [selectedDate, setSelectedDate] = useState(formatDateKey(today))
  const [shifts, setShifts] = useState<ShiftRecord[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [isAddModalOpen, setIsAddModalOpen] = useState(false)
  const [editingShift, setEditingShift] = useState<ShiftRecord | null>(null)

  const monthStart = useMemo(
    () => new Date(currentMonth.getFullYear(), currentMonth.getMonth(), 1),
    [currentMonth]
  )
  const monthEnd = useMemo(
    () => new Date(currentMonth.getFullYear(), currentMonth.getMonth() + 1, 0),
    [currentMonth]
  )

  const monthStartKey = formatDateKey(monthStart)
  const monthEndKey = formatDateKey(monthEnd)

  useEffect(() => {
    if (selectedDate < monthStartKey || selectedDate > monthEndKey) {
      setSelectedDate(monthStartKey)
    }
  }, [monthStartKey, monthEndKey, selectedDate])

  useEffect(() => {
    loadShifts()
  }, [monthStartKey, monthEndKey])

  const loadShifts = async () => {
    setLoading(true)
    setError('')
    try {
      const { data } = await api.get<ShiftRecord[]>('/schedule/shifts', {
        params: {
          start_date: monthStartKey,
          end_date: monthEndKey,
        },
      })
      setShifts(sortShifts(data))
    } catch (err: any) {
      const detail = err.response?.data?.detail
      setError(
        typeof detail === 'string'
          ? detail
          : 'Unable to load shifts right now. Please try again later.'
      )
    } finally {
      setLoading(false)
    }
  }

  const calendarDays = useMemo(
    () => buildCalendarDays(currentMonth),
    [currentMonth]
  )

  const shiftsByDate = useMemo(() => {
    return shifts.reduce<Record<string, ShiftRecord[]>>((acc, shift) => {
      if (!acc[shift.shift_date]) {
        acc[shift.shift_date] = []
      }
      acc[shift.shift_date].push(shift)
      return acc
    }, {})
  }, [shifts])

  const selectedDayShifts = shiftsByDate[selectedDate] ?? []

  const handleShiftAdded = (shift: ShiftRecord) => {
    if (isWithinRange(shift.shift_date, monthStartKey, monthEndKey)) {
      setShifts((prev) => sortShifts([...prev, shift]))
    }
    setSelectedDate(shift.shift_date)
  }

  const handleShiftUpdated = (shift: ShiftRecord) => {
    setShifts((prev) => {
      const withoutShift = prev.filter((item) => item.id !== shift.id)
      if (isWithinRange(shift.shift_date, monthStartKey, monthEndKey)) {
        return sortShifts([...withoutShift, shift])
      }
      return sortShifts(withoutShift)
    })
    setSelectedDate(shift.shift_date)
    setEditingShift(null)
  }

  const handleShiftDeleted = async (shift: ShiftRecord) => {
    const confirmDelete = window.confirm(
      `Delete shift for ${shift.employee_name} on ${formatHumanDate(shift.shift_date)}?`
    )
    if (!confirmDelete) return
    try {
      await api.delete(`/schedule/shifts/${shift.id}`)
      setShifts((prev) => prev.filter((item) => item.id !== shift.id))
    } catch (err: any) {
      const detail = err.response?.data?.detail
      setError(
        typeof detail === 'string'
          ? detail
          : 'Unable to delete this shift right now. Please try again.'
      )
    }
  }

  const handlePrevMonth = () => {
    setCurrentMonth(
      (prev) => new Date(prev.getFullYear(), prev.getMonth() - 1, 1)
    )
  }

  const handleNextMonth = () => {
    setCurrentMonth(
      (prev) => new Date(prev.getFullYear(), prev.getMonth() + 1, 1)
    )
  }

  const handleToday = () => {
    const next = new Date()
    setCurrentMonth(new Date(next.getFullYear(), next.getMonth(), 1))
    setSelectedDate(formatDateKey(next))
  }

  const selectedDateDisplay = formatHumanDate(selectedDate)
  const monthLabel = monthStart.toLocaleDateString('en-US', {
    month: 'long',
    year: 'numeric',
  })

  return (
    <div className="p-8 space-y-6 bg-[var(--bg)] text-[var(--text-primary)]">
      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div>
          <h2 className="text-2xl font-bold text-[var(--text-primary)]">Shift Scheduling</h2>
          <p className="text-sm text-[var(--text-secondary)]">
            Assign employees and manage daily coverage
          </p>
        </div>
        <button
          type="button"
          onClick={() => setIsAddModalOpen(true)}
          className="inline-flex items-center justify-center gap-2 rounded-lg bg-blue-600 px-4 py-2 text-sm font-semibold text-white shadow-[var(--shadow-card)] hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-[rgba(59,130,246,0.25)]"
        >
          <Plus className="h-4 w-4" />
          Add Shift
        </button>
      </div>

      {error && (
        <div className="flex items-start gap-3 rounded-xl border border-[rgba(248,113,113,0.4)] bg-[rgba(248,113,113,0.12)] p-4 text-sm text-red-200">
          <Clock className="h-5 w-5 flex-shrink-0 text-red-300" />
          <div>
            <p className="font-semibold">Unable to load schedule</p>
            <p>{error}</p>
            <button
              type="button"
              onClick={loadShifts}
              className="mt-2 text-xs font-semibold text-red-300 underline-offset-2 hover:underline"
            >
              Try again
            </button>
          </div>
        </div>
      )}

      <div className="bg-[var(--surface)] rounded-2xl shadow-[var(--shadow-card)] border border-[var(--border)] p-6 relative overflow-hidden">
        {loading && (
          <div className="absolute inset-0 z-10 flex items-center justify-center bg-[rgba(13,15,18,0.7)] backdrop-blur-sm">
            <Loader2 className="h-6 w-6 animate-spin text-blue-600" />
          </div>
        )}
        <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
          <div>
            <p className="text-sm font-medium text-[var(--text-secondary)]">Selected range</p>
            <h3 className="text-lg font-semibold text-[var(--text-primary)]">{monthLabel}</h3>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <button
              onClick={handlePrevMonth}
              className="rounded-lg border border-[var(--border)] bg-[var(--surface-light)] p-2 text-[var(--text-primary)] hover:bg-[#1f242c]"
              type="button"
              aria-label="Previous month"
            >
              <ChevronLeft className="h-5 w-5" />
            </button>
            <button
              onClick={handleNextMonth}
              className="rounded-lg border border-[var(--border)] bg-[var(--surface-light)] p-2 text-[var(--text-primary)] hover:bg-[#1f242c]"
              type="button"
              aria-label="Next month"
            >
              <ChevronRight className="h-5 w-5" />
            </button>
            <button
              onClick={handleToday}
              type="button"
              className="rounded-lg border border-[rgba(59,130,246,0.35)] bg-[var(--accent-bg)] px-3 py-2 text-sm font-semibold text-[var(--accent)] hover:bg-[rgba(59,130,246,0.2)]"
            >
              Today
            </button>
            <div className="flex items-center rounded-lg border border-[var(--border)] bg-[var(--surface-light)] px-3 py-2 text-sm text-[var(--text-secondary)]">
              <CalendarDays className="mr-2 h-4 w-4 text-[var(--accent)]" />
              {formatHumanDate(monthStartKey)} – {formatHumanDate(monthEndKey)}
            </div>
          </div>
        </div>

        <div className="mt-6 grid grid-cols-7 gap-2 text-center text-xs font-semibold uppercase tracking-wide text-[var(--text-secondary)]">
          {dayLabels.map((label) => (
            <div key={label}>{label}</div>
          ))}
        </div>

        <div className="mt-2 grid grid-cols-7 gap-2">
          {calendarDays.map(({ date, inCurrentMonth }) => {
            const dateKey = formatDateKey(date)
            const dayShifts = shiftsByDate[dateKey] ?? []
            const isSelected = selectedDate === dateKey
            const isToday = formatDateKey(today) === dateKey

            return (
              <button
                key={`${dateKey}-${inCurrentMonth ? 'current' : 'adjacent'}`}
                type="button"
                onClick={() => setSelectedDate(dateKey)}
                className={`min-h-[110px] rounded-xl border bg-[var(--surface-light)] p-2 text-left transition-all ${
                  isSelected
                    ? 'border-[var(--accent)] shadow-[0_4px_12px_rgba(59,130,246,0.25)]'
                    : 'border-[var(--border)] hover:border-[var(--accent)] hover:shadow-[var(--shadow-card)]'
                } ${inCurrentMonth ? 'text-[var(--text-primary)]' : 'text-[var(--text-muted)]'}`}
              >
                <div className="flex items-center justify-between text-sm">
                  <span
                    className={`font-semibold ${
                      isSelected ? 'text-[var(--accent)]' : 'text-[var(--text-secondary)]'
                    }`}
                  >
                    {date.getDate()}
                  </span>
                  {isToday && (
                    <span className="text-[10px] font-bold uppercase text-[var(--accent)]">
                      Today
                    </span>
                  )}
                </div>
                <div className="mt-2 space-y-1">
                  {dayShifts.slice(0, 2).map((shift) => (
                    <button
                      key={shift.id}
                      type="button"
                      onClick={(event) => {
                        event.stopPropagation()
                        setEditingShift(shift)
                      }}
                      className="w-full rounded-lg bg-[var(--accent-bg)] px-2 py-1 text-left text-[11px] text-[var(--accent)] transition hover:bg-[rgba(59,130,246,0.2)]"
                    >
                      <span className="block font-semibold">
                        {getInitials(shift.employee_name)}
                      </span>
                      <span className="block text-[10px] text-[var(--text-secondary)]">
                        {shift.start_time} - {shift.end_time}
                      </span>
                    </button>
                  ))}
                  {dayShifts.length > 2 && (
                    <p className="text-[10px] font-medium text-gray-500">
                      +{dayShifts.length - 2} more
                    </p>
                  )}
                </div>
              </button>
            )
          })}
        </div>

        <div className="mt-8">
          <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <p className="text-xs font-medium uppercase tracking-wide text-gray-500">
                Selected day
              </p>
              <h3 className="text-lg font-semibold text-gray-900">
                {selectedDateDisplay}
              </h3>
            </div>
            <div className="text-sm text-gray-500">
              {selectedDayShifts.length} shift
              {selectedDayShifts.length === 1 ? '' : 's'}
            </div>
          </div>

          {selectedDayShifts.length === 0 ? (
            <div className="mt-4 rounded-xl border border-dashed border-gray-300 p-6 text-center text-gray-500">
              No shifts scheduled for this day.
            </div>
          ) : (
            <div className="mt-4 space-y-3">
              {selectedDayShifts.map((shift) => (
                <div
                  key={shift.id}
                  className="flex flex-col gap-4 rounded-xl border border-gray-200 p-4 sm:flex-row sm:items-center sm:justify-between"
                >
                  <div className="flex items-center gap-4">
                    <div className="flex h-12 w-12 items-center justify-center rounded-full bg-blue-50 text-sm font-bold text-blue-700">
                      {getInitials(shift.employee_name)}
                    </div>
                    <div>
                      <p className="text-base font-semibold text-gray-900">
                        {shift.employee_name}
                      </p>
                      <p className="text-sm text-gray-600">
                        {shift.start_time} – {shift.end_time}
                      </p>
                      <p className="text-sm text-gray-500">{shift.employee_email}</p>
                    </div>
                  </div>
                  <div className="flex items-center justify-between gap-3 sm:justify-end">
                    <span
                      className={`rounded-full px-3 py-1 text-xs font-semibold capitalize ${
                        shift.status === 'completed'
                          ? 'bg-green-50 text-green-700'
                          : 'bg-blue-50 text-blue-700'
                      }`}
                    >
                      {shift.status}
                    </span>
                    <button
                      type="button"
                      onClick={() => setEditingShift(shift)}
                      className="inline-flex items-center gap-2 rounded-lg border border-gray-300 px-3 py-2 text-sm font-semibold text-gray-700 transition hover:border-blue-300 hover:text-blue-700"
                    >
                      <Edit3 className="h-4 w-4" />
                      Edit
                    </button>
                    <button
                      type="button"
                      onClick={() => handleShiftDeleted(shift)}
                      className="inline-flex items-center gap-2 rounded-lg border border-red-200 px-3 py-2 text-sm font-semibold text-red-600 transition hover:border-red-300 hover:text-red-700"
                    >
                      <Trash2 className="h-4 w-4" />
                      Delete
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {isAddModalOpen && (
        <ShiftModal
          mode="create"
          defaultDate={selectedDate}
          onClose={() => setIsAddModalOpen(false)}
          onSaved={handleShiftAdded}
        />
      )}

      {editingShift && (
        <ShiftModal
          mode="edit"
          shift={editingShift}
          onClose={() => setEditingShift(null)}
          onSaved={handleShiftUpdated}
        />
      )}
    </div>
  )
}

type ShiftModalProps =
  | {
      mode: 'create'
      defaultDate: string
      onClose: () => void
      onSaved: (shift: ShiftRecord) => void
    }
  | {
      mode: 'edit'
      shift: ShiftRecord
      onClose: () => void
      onSaved: (shift: ShiftRecord) => void
    }

function ShiftModal(props: ShiftModalProps) {
  const isCreate = props.mode === 'create'
  const initialShift = props.mode === 'edit' ? props.shift : null
  const defaultDateValue = props.mode === 'create' ? props.defaultDate : null

  const [employeeQuery, setEmployeeQuery] = useState(
    initialShift ? initialShift.employee_name : ''
  )
  const [selectedEmployee, setSelectedEmployee] = useState<EmployeeOption | null>(
    initialShift
      ? {
          id: initialShift.employee_id,
          name: initialShift.employee_name,
          email: initialShift.employee_email,
          username: initialShift.employee_username ?? '',
          status: 'active',
        }
      : null
  )
  const [shiftDate, setShiftDate] = useState(
    isCreate ? props.defaultDate : initialShift?.shift_date ?? formatDateKey(new Date())
  )
  const [startTime, setStartTime] = useState(initialShift?.start_time ?? '09:00')
  const [endTime, setEndTime] = useState(initialShift?.end_time ?? '17:00')
  const [status, setStatus] = useState<'assigned' | 'completed'>(
    initialShift?.status ?? 'assigned'
  )
  const [error, setError] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const [dropdownOpen, setDropdownOpen] = useState(false)

  const { results, searching } = useEmployeeSearch(
    employeeQuery,
    isCreate || Boolean(initialShift)
  )

  useEffect(() => {
    if (defaultDateValue) {
      setShiftDate(defaultDateValue)
    }
  }, [defaultDateValue])

  useEffect(() => {
    if (initialShift) {
      setEmployeeQuery(initialShift.employee_name)
      setSelectedEmployee({
        id: initialShift.employee_id,
        name: initialShift.employee_name,
        email: initialShift.employee_email,
        username: initialShift.employee_username ?? '',
        status: 'active',
      })
      setShiftDate(initialShift.shift_date)
      setStartTime(initialShift.start_time)
      setEndTime(initialShift.end_time)
      setStatus(initialShift.status)
      setDropdownOpen(false)
      setError('')
    }
  }, [initialShift])

  const handleEmployeeInput = (value: string) => {
    setEmployeeQuery(value)
    setSelectedEmployee(null)
    setDropdownOpen(Boolean(value.trim()))
  }

  const handleSelectEmployee = (employee: EmployeeOption) => {
    setSelectedEmployee(employee)
    setEmployeeQuery(employee.name)
    setDropdownOpen(false)
  }

  const handleSubmit = async (event: FormEvent) => {
    event.preventDefault()
    if (!selectedEmployee) {
      setError('Please select an employee for this shift.')
      return
    }
    if (!shiftDate) {
      setError('Please choose a date for the shift.')
      return
    }
    if (!isTimeWindowValid(startTime, endTime)) {
      setError('End time must be later than start time.')
      return
    }

    setSubmitting(true)
    setError('')
    try {
      let response
      if (isCreate) {
        response = await api.post<ShiftRecord>('/schedule/shifts', {
          employee_id: selectedEmployee.id,
          shift_date: shiftDate,
          start_time: startTime,
          end_time: endTime,
          status,
        })
      } else if (initialShift) {
        response = await api.put<ShiftRecord>(`/schedule/shifts/${initialShift.id}`, {
          employee_id: selectedEmployee.id,
          shift_date: shiftDate,
          start_time: startTime,
          end_time: endTime,
          status,
        })
      }

      if (response) {
        props.onSaved(response.data)
        props.onClose()
      }
    } catch (err: any) {
      const detail = err.response?.data?.detail
      setError(
        typeof detail === 'string'
          ? detail
          : `Unable to ${isCreate ? 'create' : 'update'} the shift right now.`
      )
    } finally {
      setSubmitting(false)
    }
  }

  const title = isCreate ? 'Add Shift' : 'Edit Shift'

  return (
    <ModalShell title={title} onClose={props.onClose}>
      <form className="space-y-4" onSubmit={handleSubmit}>
        <div>
          <label className="text-sm font-medium text-gray-700">Employee</label>
          <div className="relative mt-1">
            <div className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2">
              <Search className="h-4 w-4 text-gray-400" />
            </div>
            <input
              type="text"
              value={employeeQuery}
              onChange={(event) => handleEmployeeInput(event.target.value)}
              onFocus={() => setDropdownOpen(Boolean(employeeQuery.trim()))}
              placeholder="Type to search employee..."
              className="w-full rounded-lg border border-gray-300 py-2 pl-9 pr-3 text-sm text-gray-900 placeholder:text-gray-400 focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-100"
            />
            {dropdownOpen && (results.length > 0 || searching) && (
              <div className="absolute z-10 mt-1 w-full rounded-lg border border-[var(--border)] bg-[var(--surface-light)] shadow-[var(--shadow-card)] backdrop-blur">
                {searching && (
                  <div className="flex items-center gap-2 px-3 py-2 text-sm text-[var(--text-secondary)]">
                    <Loader2 className="h-4 w-4 animate-spin text-[var(--accent)]" />
                    Searching...
                  </div>
                )}
                {results.map((employee) => (
                  <button
                    key={employee.id}
                    type="button"
                    onClick={() => handleSelectEmployee(employee)}
                    onMouseDown={(event) => event.preventDefault()}
                    className="flex w-full items-center gap-3 px-3 py-2 text-left text-sm text-[var(--text-primary)] hover:bg-[rgba(59,130,246,0.18)] focus:bg-[rgba(59,130,246,0.18)]"
                  >
                    <UserCircle2 className="h-4 w-4 text-[var(--accent)]" />
                    <div>
                      <p className="font-medium text-[var(--text-primary)]">{employee.name}</p>
                      <p className="text-xs text-[var(--text-secondary)]">{employee.email}</p>
                    </div>
                  </button>
                ))}
              </div>
            )}
          </div>
        </div>

        <div className="grid gap-4 sm:grid-cols-2">
          <div>
            <label className="text-sm font-medium text-gray-700">Date</label>
            <input
              type="date"
              value={shiftDate}
              onChange={(event) => setShiftDate(event.target.value)}
              className="mt-1 w-full rounded-lg border border-gray-300 px-3 py-2 text-sm text-gray-900 focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-100"
              required
            />
          </div>
          <div>
            <label className="text-sm font-medium text-gray-700">
              Status
            </label>
            <select
              value={status}
              onChange={(event) =>
                setStatus(event.target.value as 'assigned' | 'completed')
              }
              className="mt-1 w-full rounded-lg border border-gray-300 px-3 py-2 text-sm text-gray-900 focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-100"
            >
              <option value="assigned">Assigned</option>
              <option value="completed">Completed</option>
            </select>
          </div>
        </div>

        <div className="grid gap-4 sm:grid-cols-2">
          <div>
            <label className="text-sm font-medium text-gray-700">
              Start Time
            </label>
            <input
              type="time"
              value={startTime}
              onChange={(event) => setStartTime(event.target.value)}
              required
              className="mt-1 w-full rounded-lg border border-gray-300 px-3 py-2 text-sm text-gray-900 focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-100"
            />
          </div>
          <div>
            <label className="text-sm font-medium text-gray-700">
              End Time
            </label>
            <input
              type="time"
              value={endTime}
              onChange={(event) => setEndTime(event.target.value)}
              required
              className="mt-1 w-full rounded-lg border border-gray-300 px-3 py-2 text-sm text-gray-900 focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-100"
            />
          </div>
        </div>

        {error && (
          <div className="flex items-start gap-2 rounded-lg border border-red-200 bg-red-50 p-3 text-sm text-red-700">
            <X className="h-4 w-4 flex-shrink-0" />
            <span>{error}</span>
          </div>
        )}

        <div className="flex justify-end gap-3 pt-2">
          <button
            type="button"
            onClick={props.onClose}
            className="rounded-lg border border-gray-300 px-4 py-2 text-sm font-semibold text-gray-700 hover:bg-gray-50"
          >
            Cancel
          </button>
          <button
            type="submit"
            disabled={submitting}
            className="inline-flex items-center gap-2 rounded-lg bg-blue-600 px-4 py-2 text-sm font-semibold text-white hover:bg-blue-700 disabled:opacity-60"
          >
            {submitting && <Loader2 className="h-4 w-4 animate-spin" />}
            {isCreate ? 'Add Shift' : 'Save Changes'}
          </button>
        </div>
      </form>
    </ModalShell>
  )
}

function ModalShell({
  children,
  title,
  onClose,
}: {
  children: ReactNode
  title: string
  onClose: () => void
}) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-[rgba(13,15,18,0.75)] px-4 backdrop-blur-sm">
      <div className="relative w-full max-w-lg rounded-2xl bg-white p-6 shadow-2xl">
        <button
          type="button"
          onClick={onClose}
          className="absolute right-4 top-4 rounded-full bg-[var(--surface-light)] p-1 text-[var(--text-secondary)] hover:bg-[#1f242c]"
        >
          <X className="h-4 w-4" />
        </button>
        <h3 className="text-xl font-semibold text-gray-900">{title}</h3>
        <div className="mt-4">{children}</div>
      </div>
    </div>
  )
}

function useEmployeeSearch(query: string, enabled: boolean) {
  const [results, setResults] = useState<EmployeeOption[]>([])
  const [searching, setSearching] = useState(false)

  useEffect(() => {
    if (!enabled || !query.trim()) {
      setResults([])
      setSearching(false)
      return
    }

    const controller = new AbortController()
    setSearching(true)
    const timeout = setTimeout(async () => {
      try {
        const response = await api.get<EmployeeOption[]>('/users/search', {
          params: { q: query.trim(), limit: 8 },
          signal: controller.signal,
        })
        if (!controller.signal.aborted) {
          setResults(response.data)
        }
      } catch (err) {
        if (!controller.signal.aborted) {
          console.error('Failed to search employees:', err)
        }
      } finally {
        if (!controller.signal.aborted) {
          setSearching(false)
        }
      }
    }, 200)

    return () => {
      clearTimeout(timeout)
      controller.abort()
    }
  }, [query, enabled])

  return { results, searching }
}

function buildCalendarDays(reference: Date): CalendarCell[] {
  const firstOfMonth = new Date(reference.getFullYear(), reference.getMonth(), 1)
  const lastOfMonth = new Date(reference.getFullYear(), reference.getMonth() + 1, 0)
  const cells: CalendarCell[] = []
  const leadingDays = firstOfMonth.getDay()

  for (let i = leadingDays; i > 0; i--) {
    const date = new Date(firstOfMonth)
    date.setDate(firstOfMonth.getDate() - i)
    cells.push({ date, inCurrentMonth: false })
  }

  for (let day = 1; day <= lastOfMonth.getDate(); day++) {
    cells.push({
      date: new Date(reference.getFullYear(), reference.getMonth(), day),
      inCurrentMonth: true,
    })
  }

  const remainder = cells.length % 7
  const trailingDays = remainder === 0 ? 0 : 7 - remainder
  let cursor = new Date(lastOfMonth)

  for (let i = 0; i < trailingDays; i++) {
    cursor = new Date(cursor)
    cursor.setDate(cursor.getDate() + 1)
    cells.push({ date: new Date(cursor), inCurrentMonth: false })
  }

  return cells
}

function formatDateKey(date: Date): string {
  const year = date.getFullYear()
  const month = `${date.getMonth() + 1}`.padStart(2, '0')
  const day = `${date.getDate()}`.padStart(2, '0')
  return `${year}-${month}-${day}`
}

function formatHumanDate(value: string) {
  const [year, month, day] = value.split('-').map(Number)
  const date = new Date(year, month - 1, day)
  return date.toLocaleDateString('en-US', {
    weekday: 'long',
    month: 'long',
    day: 'numeric',
  })
}

function sortShifts(data: ShiftRecord[]) {
  return [...data].sort((a, b) => {
    if (a.shift_date === b.shift_date) {
      return a.start_time.localeCompare(b.start_time)
    }
    return a.shift_date.localeCompare(b.shift_date)
  })
}

function getInitials(name: string) {
  const words = name.trim().split(/\s+/)
  if (words.length === 1) {
    return words[0].slice(0, 2).toUpperCase()
  }
  return (words[0][0] + words[words.length - 1][0]).toUpperCase()
}

function isTimeWindowValid(start: string, end: string) {
  return start < end
}

function isWithinRange(dateKey: string, start: string, end: string) {
  return dateKey >= start && dateKey <= end
}
