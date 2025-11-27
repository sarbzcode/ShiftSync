import React, { useEffect, useMemo, useState } from 'react'
import { AlertCircle, CalendarRange, CheckCircle, ChevronDown, Loader2, Search } from 'lucide-react'
import api from '../lib/api'

interface ApprovedPayRecord {
  id: string
  user_id: string
  employee_name: string
  week_start: string
  week_end: string
  hours_worked: number
  gross_amount: number
  amount: number
  adjustments: Array<{
    name: string
    direction: 'add' | 'deduct'
    amount_applied: number
    mode?: string
  }>
  status: string
  created_at: string
}

export default function PayrollApproved() {
  const [records, setRecords] = useState<ApprovedPayRecord[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [search, setSearch] = useState('')
  const [fromDate, setFromDate] = useState('')
  const [toDate, setToDate] = useState('')
  const [expandedEmployees, setExpandedEmployees] = useState<Record<string, boolean>>({})
  const [expandedAdjustments, setExpandedAdjustments] = useState<Record<string, boolean>>({})

  useEffect(() => {
    loadRecords()
  }, [])

  const loadRecords = async () => {
    setLoading(true)
    setError('')
    try {
      const response = await api.get<ApprovedPayRecord[]>('/pay/approved')
      setRecords(response.data)
    } catch (err: any) {
      setError(err.response?.data?.detail || 'Failed to load approved payrolls')
    } finally {
      setLoading(false)
    }
  }

  const filteredRecords = useMemo(() => {
    const enriched = records.map((record) => {
      const adjTotal =
        record.adjustments?.reduce((sum, adj) => {
          const effect = adj.direction === 'add' ? adj.amount_applied : -adj.amount_applied
          return sum + effect
        }, 0) ?? 0
      return { ...record, adjustments_total: adjTotal }
    })

    return enriched
      .filter((record) => {
        const matchesSearch =
          !search ||
          record.employee_name.toLowerCase().includes(search.toLowerCase()) ||
          record.user_id.toLowerCase().includes(search.toLowerCase())

        const endDate = new Date(record.week_end).getTime()
        const withinFrom = fromDate ? endDate >= new Date(fromDate).getTime() : true
        const withinTo = toDate ? endDate <= new Date(toDate).getTime() : true

        return matchesSearch && withinFrom && withinTo
      })
      .sort((a, b) => new Date(b.week_end).getTime() - new Date(a.week_end).getTime())
  }, [records, search, fromDate, toDate])

  const groupedRecords = useMemo(() => {
    const groups = new Map<
      string,
      { userId: string; employeeName: string; records: ApprovedPayRecord[] }
    >()

    filteredRecords.forEach((record) => {
      const existing = groups.get(record.user_id)
      if (existing) {
        existing.records.push(record)
      } else {
        groups.set(record.user_id, {
          userId: record.user_id,
          employeeName: record.employee_name,
          records: [record],
        })
      }
    })

    return Array.from(groups.values())
      .map((group) => {
        const sortedRecords = [...group.records].sort(
          (a, b) => new Date(b.week_end).getTime() - new Date(a.week_end).getTime()
        )
        const totalHours = sortedRecords.reduce((sum, r) => sum + r.hours_worked, 0)
        const totalNet = sortedRecords.reduce((sum, r) => sum + r.amount, 0)
        const totalAdjustments = sortedRecords.reduce((sum, r) => sum + ((r as any).adjustments_total ?? 0), 0)
        const totalGross = totalNet - totalAdjustments
        const periodStart = sortedRecords.reduce((earliest, record) => {
          return new Date(record.week_start).getTime() < new Date(earliest).getTime()
            ? record.week_start
            : earliest
        }, sortedRecords[0].week_start)
        const periodEnd = sortedRecords.reduce((latest, record) => {
          return new Date(record.week_end).getTime() > new Date(latest).getTime()
            ? record.week_end
            : latest
        }, sortedRecords[0].week_end)

        return {
          ...group,
          records: sortedRecords,
          totalHours,
          totalGross,
          totalAdjustments,
          totalNet,
          periodStart,
          periodEnd,
        }
      })
      .sort(
        (a, b) =>
          new Date(b.periodEnd).getTime() - new Date(a.periodEnd).getTime() ||
          a.employeeName.localeCompare(b.employeeName)
      )
  }, [filteredRecords])

  const totalAmount = useMemo(() => filteredRecords.reduce((sum, r) => sum + r.amount, 0), [filteredRecords])

  const toggleEmployee = (userId: string) => {
    setExpandedEmployees((prev) => ({ ...prev, [userId]: !prev[userId] }))
  }

  const toggleAdjustments = (payId: string) => {
    setExpandedAdjustments((prev) => ({ ...prev, [payId]: !prev[payId] }))
  }

  const formatDate = (value: string) => new Date(value).toLocaleDateString()

  return (
    <div className="p-8">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h2 className="text-2xl font-bold text-gray-900 mb-2">Approved Payrolls</h2>
          <p className="text-gray-600">Review payroll records that have been approved and paid.</p>
        </div>
        <div className="text-right">
          <p className="text-sm text-gray-500">Total approved</p>
          <p className="text-2xl font-semibold text-green-700">${totalAmount.toFixed(2)}</p>
        </div>
      </div>

      <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-4 mb-6">
        <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
          <div className="col-span-2">
            <label className="block text-xs text-gray-500 mb-1">Search</label>
            <div className="relative">
              <Search className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
              <input
                type="text"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Search by employee or ID"
                className="w-full pl-9 pr-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-sm"
              />
            </div>
          </div>
          <div>
            <label className="block text-xs text-gray-500 mb-1">From</label>
            <div className="relative">
              <CalendarRange className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
              <input
                type="date"
                value={fromDate}
                onChange={(e) => setFromDate(e.target.value)}
                className="w-full pl-9 pr-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-sm"
              />
            </div>
          </div>
          <div>
            <label className="block text-xs text-gray-500 mb-1">To</label>
            <div className="relative">
              <CalendarRange className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
              <input
                type="date"
                value={toDate}
                onChange={(e) => setToDate(e.target.value)}
                className="w-full pl-9 pr-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-sm"
              />
            </div>
          </div>
        </div>
      </div>

      {error && (
        <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg flex items-start gap-2">
          <AlertCircle className="w-5 h-5 text-red-600 flex-shrink-0 mt-0.5" />
          <p className="text-sm text-red-800">{error}</p>
        </div>
      )}

      <div className="bg-white rounded-xl border border-gray-200 shadow-sm">
        {loading ? (
          <div className="p-8 flex items-center justify-center">
            <Loader2 className="w-6 h-6 text-blue-600 animate-spin" />
          </div>
        ) : groupedRecords.length === 0 ? (
          <div className="p-12 text-center">
            <CheckCircle className="w-12 h-12 text-gray-300 mx-auto mb-3" />
            <h3 className="text-lg font-semibold text-gray-900 mb-1">No approved payrolls</h3>
            <p className="text-gray-500">Approved payrolls will appear here once available.</p>
          </div>
        ) : (
          <div className="divide-y divide-gray-200">
            {groupedRecords.map((group) => {
              const isExpanded = expandedEmployees[group.userId]

              return (
                <div key={group.userId}>
                  <button
                    type="button"
                    onClick={() => toggleEmployee(group.userId)}
                    className="flex w-full flex-col gap-3 px-6 py-4 text-left transition hover:bg-[var(--surface-light)] sm:flex-row sm:items-center sm:gap-6"
                  >
                    <div className="min-w-[180px]">
                      <p className="text-sm font-semibold text-gray-900">{group.employeeName}</p>
                      <p className="text-xs text-gray-500">{group.userId}</p>
                    </div>
                    <div className="grid flex-1 grid-cols-1 gap-3 text-sm text-gray-700 sm:grid-cols-4">
                      <div>
                        <p className="text-xs uppercase tracking-wide text-gray-500">Period</p>
                        <p>
                          {formatDate(group.periodStart)} - {formatDate(group.periodEnd)}
                        </p>
                      </div>
                      <div>
                        <p className="text-xs uppercase tracking-wide text-gray-500">Hours</p>
                        <p className="font-semibold">{group.totalHours.toFixed(2)}h</p>
                      </div>
                      <div>
                        <p className="text-xs uppercase tracking-wide text-gray-500">Gross</p>
                        <p className="font-semibold text-gray-900">${group.totalGross.toFixed(2)}</p>
                      </div>
                      <div>
                        <p className="text-xs uppercase tracking-wide text-gray-500">Net (after adjustments)</p>
                        <p className="font-semibold text-green-700">${group.totalNet.toFixed(2)}</p>
                        <p className="text-xs text-gray-500">
                          Adj: {group.totalAdjustments >= 0 ? '+' : '-'}${Math.abs(group.totalAdjustments).toFixed(2)}
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="text-xs text-gray-500">{group.records.length} records</span>
                      <ChevronDown
                        className={`h-4 w-4 text-gray-500 transition-transform ${isExpanded ? 'rotate-180' : ''}`}
                      />
                    </div>
                  </button>

                  {isExpanded && (
                    <div className="bg-[var(--surface-light)] px-6 pb-5">
                      <div className="overflow-x-auto">
                        <table className="min-w-full divide-y divide-gray-200">
                          <thead className="bg-gray-100">
                            <tr>
                              <th className="px-4 py-2 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                                Period
                              </th>
                              <th className="px-4 py-2 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                                Hours
                              </th>
                              <th className="px-4 py-2 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                                Gross
                              </th>
                              <th className="px-4 py-2 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                                Deductions
                              </th>
                              <th className="px-4 py-2 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                                Net
                              </th>
                              <th className="px-4 py-2 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                                Approved On
                              </th>
                              <th className="px-4 py-2 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                                Details
                              </th>
                            </tr>
                          </thead>
                          <tbody className="bg-white divide-y divide-gray-200">
                            {group.records.map((record) => {
                              const adjTotal =
                                record.adjustments?.reduce((sum, adj) => {
                                  const effect = adj.direction === 'add' ? adj.amount_applied : -adj.amount_applied
                                  return sum + effect
                                }, 0) ?? 0
                              return (
                                <React.Fragment key={record.id}>
                                  <tr className="hover:bg-[var(--surface-light)]">
                                    <td className="px-4 py-3 text-sm text-gray-700">
                                      {formatDate(record.week_start)} - {formatDate(record.week_end)}
                                    </td>
                                    <td className="px-4 py-3 text-sm text-gray-700">
                                      {record.hours_worked.toFixed(2)}h
                                    </td>
                                    <td className="px-4 py-3 text-sm text-gray-700">
                                      ${record.gross_amount?.toFixed(2) ?? record.amount.toFixed(2)}
                                    </td>
                                    <td className="px-4 py-3 text-sm text-gray-700">
                                      <span className="text-sm font-semibold text-gray-900">
                                        {adjTotal === 0 ? '$0.00' : `${adjTotal >= 0 ? '+' : '-'}$${Math.abs(adjTotal).toFixed(2)}`}
                                      </span>
                                    </td>
                                    <td className="px-4 py-3 text-sm font-semibold text-green-700">
                                      ${record.amount.toFixed(2)}
                                    </td>
                                    <td className="px-4 py-3 text-sm text-gray-600">
                                      {formatDate(record.created_at)}
                                    </td>
                                    <td className="px-2 py-3 text-right">
                                      <button
                                        type="button"
                                        onClick={() => toggleAdjustments(record.id)}
                                        className="inline-flex items-center gap-2 rounded-full border border-[var(--border)] px-2.5 py-1 text-xs font-semibold text-[var(--text-primary)] hover:bg-[var(--surface-light)]"
                                      >
                                        Details
                                        <ChevronDown
                                          className={`h-3.5 w-3.5 text-gray-500 transition-transform ${
                                            expandedAdjustments[record.id] ? 'rotate-180' : ''
                                          }`}
                                        />
                                      </button>
                                    </td>
                                  </tr>
                                  {expandedAdjustments[record.id] && record.adjustments && record.adjustments.length > 0 && (
                                    <tr className="bg-[var(--surface-light)]" key={`${record.id}-details`}>
                                      <td colSpan={7} className="px-6 py-4">
                                        <div className="flex justify-center">
                                          <div className="w-full sm:w-1/2 grid gap-2 text-sm text-gray-800">
                                            <div className="flex items-center justify-between">
                                              <span className="text-gray-600">Pay period</span>
                                              <span className="font-semibold">
                                                {formatDate(record.week_start)} - {formatDate(record.week_end)}
                                              </span>
                                            </div>
                                            <div className="flex items-center justify-between">
                                              <span className="text-gray-600">Hours worked</span>
                                              <span className="font-semibold">{record.hours_worked.toFixed(2)}h</span>
                                            </div>
                                            <div className="flex items-center justify-between">
                                              <span className="text-gray-600">Gross pay</span>
                                              <span className="font-semibold">
                                                ${record.gross_amount?.toFixed(2) ?? record.amount.toFixed(2)}
                                              </span>
                                            </div>
                                            <div className="flex items-center justify-between">
                                              <span className="text-gray-600">Net pay</span>
                                              <span className="font-semibold text-green-700">${record.amount.toFixed(2)}</span>
                                            </div>
                                            <div className="border-t border-gray-200 pt-2">
                                              <p className="text-xs uppercase tracking-wide text-gray-500 mb-1">Deductions</p>
                                              <div className="space-y-1">
                                                {record.adjustments.map((adj, idx) => (
                                                  <div key={`${record.id}-detail-${idx}`} className="flex items-center justify-between text-sm">
                                                    <span>{adj.name}</span>
                                                    <span className="min-w-[90px] text-right font-semibold">
                                                      {adj.direction === 'add' ? '+' : '-'}${adj.amount_applied.toFixed(2)}
                                                    </span>
                                                  </div>
                                                ))}
                                              </div>
                                            </div>
                                          </div>
                                        </div>
                                      </td>
                                    </tr>
                                  )}
                                </React.Fragment>
                              )
                            })}
                          </tbody>
                        </table>
                      </div>
                    </div>
                  )}
                </div>
              )
            })}
          </div>
        )}
      </div>
    </div>
  )
}

