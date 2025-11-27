import { useEffect, useState } from 'react'
import { DollarSign, CheckCircle, AlertCircle, Pause, RefreshCcw } from 'lucide-react'
import api from '../lib/api'
import LoadingOverlay from '../components/LoadingOverlay'

interface PayRecord {
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
  }>
  status: string
  created_at: string
}

export default function PayrollPending() {
  const [records, setRecords] = useState<PayRecord[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')
  const [generating, setGenerating] = useState(false)
  const [approvingAll, setApprovingAll] = useState(false)

  useEffect(() => {
    loadRecords()
  }, [])

  const loadRecords = async () => {
    setLoading(true)
    try {
      const response = await api.get('/pay/pending')
      setRecords(response.data)
    } catch (err: any) {
      setError(err.response?.data?.detail || 'Failed to load pay records')
    } finally {
      setLoading(false)
    }
  }

  const handleGeneratePayrolls = async () => {
    try {
      setError('')
      setSuccess('')
      setGenerating(true)
      const response = await api.post('/pay/generate')
      const { generated, weeks_processed } = response.data as { generated: number; weeks_processed: number }
      const generatedLabel = generated === 1 ? 'payroll' : 'payrolls'
      const weeksLabel = weeks_processed === 1 ? 'week' : 'weeks'
      const message =
        generated > 0
          ? `Generated ${generated} ${generatedLabel} from ${weeks_processed} ${weeksLabel} of completed shifts.`
          : 'No completed shifts found to generate payrolls.'
      setSuccess(message)
      await loadRecords()
    } catch (err: any) {
      setError(err.response?.data?.detail || 'Failed to generate payrolls')
    } finally {
      setGenerating(false)
    }
  }

  const handleApproveAll = async () => {
    try {
      setError('')
      setSuccess('')
      setApprovingAll(true)
      await api.post('/pay/approve-all')
      setSuccess('All pending pay records approved.')
      await loadRecords()
    } catch (err: any) {
      setError(err.response?.data?.detail || 'Failed to approve all records')
    } finally {
      setApprovingAll(false)
    }
  }

  const handleApprove = async (recordId: string) => {
    try {
      setError('')
      setSuccess('')
      await api.put(`/pay/${recordId}/approve`)
      setSuccess('Pay record approved.')
      await loadRecords()
    } catch (err: any) {
      setError(err.response?.data?.detail || 'Failed to approve record')
    }
  }

  const handleHold = async (recordId: string) => {
    try {
      setError('')
      setSuccess('')
      await api.put(`/pay/${recordId}/hold`)
      await loadRecords()
    } catch (err: any) {
      setError(err.response?.data?.detail || 'Failed to update hold status')
    }
  }

  if (loading) {
    return (
      <div className="p-8 flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    )
  }

  return (
    <div className="p-8">
      {(generating || approvingAll) && (
        <LoadingOverlay message={generating ? 'Generating payrolls...' : 'Approving payrolls...'} />
      )}

      <div className="flex items-center justify-between mb-6">
        <div>
          <h2 className="text-3xl font-bold text-gray-900 mb-2">Pay</h2>
        </div>
        <div className="flex items-center gap-3">
          <button
            onClick={handleGeneratePayrolls}
            disabled={loading || generating}
            className="px-5 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-medium flex items-center gap-2 disabled:opacity-60 disabled:cursor-not-allowed"
          >
            <RefreshCcw className="w-5 h-5" />
            {generating ? 'Generating...' : 'Generate payrolls'}
          </button>
          <button
            onClick={handleApproveAll}
            disabled={loading || approvingAll || generating}
            className="px-6 py-3 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors font-medium flex items-center gap-2 disabled:opacity-60 disabled:cursor-not-allowed"
          >
            <CheckCircle className="w-5 h-5" />
            {approvingAll ? 'Approving...' : 'Approve All'}
          </button>
        </div>
      </div>

      {error && (
        <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg flex items-start gap-2">
          <AlertCircle className="w-5 h-5 text-red-600 flex-shrink-0 mt-0.5" />
          <p className="text-sm text-red-800">{error}</p>
        </div>
      )}

      {success && (
        <div className="mb-4 p-3 bg-green-50 border border-green-200 rounded-lg flex items-start gap-2">
          <CheckCircle className="w-5 h-5 text-green-600 flex-shrink-0 mt-0.5" />
          <p className="text-sm text-green-800">{success}</p>
        </div>
      )}

      {records.length === 0 ? (
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-12 text-center">
          <DollarSign className="w-16 h-16 text-gray-300 mx-auto mb-4" />
          <h3 className="text-lg font-semibold text-gray-900 mb-2">No Pay Records</h3>
          <p className="text-gray-500">No employees logged hours for the selected week.</p>
        </div>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
          {records
            .slice()
            .sort((a, b) => {
              if (a.status === b.status) {
                return new Date(b.week_end).getTime() - new Date(a.week_end).getTime()
              }
              if (a.status === 'pending') return -1
              if (b.status === 'pending') return 1
              return 0
            })
            .map((record) => {
              const isHeld = record.status === 'held'
              return (
                <div
                  key={record.id}
                    className={`bg-white rounded-2xl border shadow-sm p-5 flex flex-col gap-4 ${
                      isHeld ? 'border-[var(--border)] bg-[var(--surface-light)] opacity-80' : 'border-[var(--border)]'
                    }`}
                >
                  <div className="flex items-start justify-between gap-2">
                    <div>
                      <p className="text-xs uppercase text-gray-500 tracking-wide">Employee</p>
                      <p className="text-lg font-semibold text-gray-900">{record.employee_name}</p>
                      <p className="text-sm text-gray-500">
                        {new Date(record.week_start).toLocaleDateString()} - {new Date(record.week_end).toLocaleDateString()}
                      </p>
                    </div>
                    <span
                      className={`px-3 py-1 text-xs font-medium rounded-full capitalize ${
                        isHeld
                          ? 'bg-[var(--surface-light)] text-[var(--text-primary)] border border-[var(--border)]'
                          : 'bg-amber-100 text-amber-700'
                      }`}
                    >
                      {record.status}
                    </span>
                  </div>
                  <div className="flex flex-wrap items-center gap-6 text-sm text-gray-700">
                    <div>
                      <p className="text-[11px] uppercase text-gray-500 tracking-wide">Hours</p>
                      <p className="text-lg font-semibold text-gray-900">{record.hours_worked.toFixed(2)}h</p>
                    </div>
                    <div>
                      <p className="text-[11px] uppercase text-gray-500 tracking-wide">Gross</p>
                      <p className="text-lg font-semibold text-gray-900">
                        ${record.gross_amount?.toFixed(2) ?? record.amount.toFixed(2)}
                      </p>
                    </div>
                    <div>
                      <p className="text-[11px] uppercase text-gray-500 tracking-wide">Adjustments</p>
                      {record.adjustments && record.adjustments.length > 0 ? (
                        <div className="text-xs text-gray-600 space-y-1">
                          {record.adjustments.map((adj, idx) => (
                            <div key={`${record.id}-adj-${idx}`}>
                              {adj.name}: {adj.direction === 'add' ? '+' : '-'}${adj.amount_applied.toFixed(2)}
                            </div>
                          ))}
                        </div>
                      ) : (
                        <p className="text-xs text-gray-500">—</p>
                      )}
                    </div>
                    <div>
                      <p className="text-[11px] uppercase text-gray-500 tracking-wide">Net</p>
                      <p className="text-lg font-semibold text-green-600">${record.amount.toFixed(2)}</p>
                    </div>
                  </div>
                  <div className="flex flex-wrap items-center gap-2">
                    <button
                      onClick={() => handleApprove(record.id)}
                      disabled={isHeld}
                      className="flex-1 justify-center px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors text-sm font-medium flex items-center gap-2 disabled:opacity-60 disabled:cursor-not-allowed"
                    >
                      <CheckCircle className="w-4 h-4" />
                      Approve
                    </button>
                    <button
                      onClick={() => handleHold(record.id)}
                    className="flex-1 justify-center px-4 py-2 border border-[var(--border)] text-[var(--text-primary)] bg-[var(--surface)] rounded-lg hover:bg-[var(--surface-light)] transition-colors text-sm font-medium flex items-center gap-2"
                    >
                      <Pause className="w-4 h-4" />
                      {isHeld ? 'Unhold' : 'Hold'}
                    </button>
                  </div>
                </div>
              )
            })}
        </div>
      )}
    </div>
  )
}

