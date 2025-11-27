import React, { useEffect, useMemo, useState } from 'react'
import { Plus, Pencil, RefreshCw, Percent, DollarSign, Calendar, AlertCircle } from 'lucide-react'
import api from '../lib/api'

type AdjustmentType = {
  id: string
  name: string
  direction: 'add' | 'deduct'
  mode: 'percent' | 'flat'
  rate_or_amount: number
  cap_per_period?: number | null
  apply_on: 'all' | 'overtime_only'
  overtime_rule?: 'none' | '8h_day' | '40h_week' | null
  applies_globally: boolean
  note?: string | null
  effective_start?: string | null
  effective_end?: string | null
  created_at: string
  updated_at: string
}

type Employee = { id: string; name: string; username: string }

type EmployeeAdjustment = {
  id: string
  adjustment_type_id: string
  employee_id: string
  override_rate_or_amount?: number | null
  override_cap?: number | null
  replace_global: boolean
  status: 'active' | 'paused'
  note?: string | null
  effective_start?: string | null
  effective_end?: string | null
  created_at: string
  updated_at: string
}

const defaultTypeForm: Partial<AdjustmentType> = {
  name: '',
  direction: 'deduct',
  mode: 'percent',
  rate_or_amount: 0,
  cap_per_period: null,
  apply_on: 'all',
  overtime_rule: 'none',
  applies_globally: false,
  note: '',
}

const defaultAssignmentForm: Partial<EmployeeAdjustment> = {
  adjustment_type_id: '',
  override_rate_or_amount: null,
  override_cap: null,
  replace_global: false,
  status: 'active',
  note: '',
}

export default function Adjustments() {
  const [tab, setTab] = useState<'types' | 'employee'>('types')
  const [types, setTypes] = useState<AdjustmentType[]>([])
  const [employees, setEmployees] = useState<Employee[]>([])
  const [selectedEmployeeId, setSelectedEmployeeId] = useState<string>('')
  const [assignments, setAssignments] = useState<EmployeeAdjustment[]>([])
  const [loadingTypes, setLoadingTypes] = useState(false)
  const [loadingAssignments, setLoadingAssignments] = useState(false)
  const [error, setError] = useState('')
  const [typeModalOpen, setTypeModalOpen] = useState(false)
  const [editingTypeId, setEditingTypeId] = useState<string | null>(null)
  const [typeForm, setTypeForm] = useState<Partial<AdjustmentType>>(defaultTypeForm)
  const [assignmentModalOpen, setAssignmentModalOpen] = useState(false)
  const [editingAssignmentId, setEditingAssignmentId] = useState<string | null>(null)
  const [assignmentForm, setAssignmentForm] = useState<Partial<EmployeeAdjustment>>(defaultAssignmentForm)
  const [saving, setSaving] = useState(false)

  useEffect(() => {
    loadTypes()
    loadEmployees()
  }, [])

  useEffect(() => {
    if (tab === 'employee' && selectedEmployeeId) {
      loadAssignments(selectedEmployeeId)
    }
  }, [tab, selectedEmployeeId])

  const loadTypes = async () => {
    setLoadingTypes(true)
    setError('')
    try {
      const { data } = await api.get<AdjustmentType[]>('/adjustments/types')
      setTypes(data)
    } catch (err: any) {
      setError(err.response?.data?.detail || 'Failed to load adjustment types')
    } finally {
      setLoadingTypes(false)
    }
  }

  const loadEmployees = async () => {
    try {
      const { data } = await api.get<Employee[]>('/users/management')
      setEmployees(data)
      if (data.length > 0 && !selectedEmployeeId) {
        setSelectedEmployeeId(data[0].id)
      }
    } catch (err: any) {
      setError(err.response?.data?.detail || 'Failed to load employees')
    }
  }

  const loadAssignments = async (employeeId: string) => {
    setLoadingAssignments(true)
    setError('')
    try {
      const { data } = await api.get<EmployeeAdjustment[]>(`/adjustments/employees/${employeeId}/adjustments`)
      setAssignments(data)
    } catch (err: any) {
      setError(err.response?.data?.detail || 'Failed to load employee adjustments')
    } finally {
      setLoadingAssignments(false)
    }
  }

  const openTypeModal = (type?: AdjustmentType) => {
    if (type) {
      setEditingTypeId(type.id)
      setTypeForm({ ...type })
    } else {
      setEditingTypeId(null)
      setTypeForm(defaultTypeForm)
    }
    setTypeModalOpen(true)
  }

  const openAssignmentModal = (assignment?: EmployeeAdjustment) => {
    if (assignment) {
      setEditingAssignmentId(assignment.id)
      setAssignmentForm({ ...assignment })
    } else {
      setEditingAssignmentId(null)
      setAssignmentForm(defaultAssignmentForm)
    }
    setAssignmentModalOpen(true)
  }

  const saveType = async () => {
    if (!typeForm.name || !typeForm.direction || !typeForm.mode || typeForm.rate_or_amount === undefined) return
    setSaving(true)
    setError('')
    try {
      if (editingTypeId) {
        await api.patch(`/adjustments/types/${editingTypeId}`, {
          name: typeForm.name,
          direction: typeForm.direction,
          mode: typeForm.mode,
          rate_or_amount: typeForm.rate_or_amount,
          cap_per_period: typeForm.cap_per_period,
          apply_on: typeForm.apply_on,
          overtime_rule: typeForm.overtime_rule,
          applies_globally: typeForm.applies_globally,
          note: typeForm.note,
          effective_start: typeForm.effective_start,
          effective_end: typeForm.effective_end,
        })
      } else {
        await api.post('/adjustments/types', {
          name: typeForm.name,
          direction: typeForm.direction,
          mode: typeForm.mode,
          rate_or_amount: typeForm.rate_or_amount,
          cap_per_period: typeForm.cap_per_period,
          apply_on: typeForm.apply_on,
          overtime_rule: typeForm.overtime_rule,
          applies_globally: typeForm.applies_globally,
          note: typeForm.note,
          effective_start: typeForm.effective_start,
          effective_end: typeForm.effective_end,
        })
      }
      await loadTypes()
      setTypeModalOpen(false)
    } catch (err: any) {
      setError(err.response?.data?.detail || 'Failed to save adjustment type')
    } finally {
      setSaving(false)
    }
  }

  const saveAssignment = async () => {
    if (!selectedEmployeeId || !assignmentForm.adjustment_type_id) return
    setSaving(true)
    setError('')
    try {
      const payload = {
        adjustment_type_id: assignmentForm.adjustment_type_id,
        override_rate_or_amount: assignmentForm.override_rate_or_amount,
        override_cap: assignmentForm.override_cap,
        replace_global: assignmentForm.replace_global,
        status: assignmentForm.status,
        note: assignmentForm.note,
        effective_start: assignmentForm.effective_start,
        effective_end: assignmentForm.effective_end,
      }
      if (editingAssignmentId) {
        await api.patch(
          `/adjustments/employees/${selectedEmployeeId}/adjustments/${editingAssignmentId}`,
          payload
        )
      } else {
        await api.post(`/adjustments/employees/${selectedEmployeeId}/adjustments`, payload)
      }
      await loadAssignments(selectedEmployeeId)
      setAssignmentModalOpen(false)
    } catch (err: any) {
      setError(err.response?.data?.detail || 'Failed to save assignment')
    } finally {
      setSaving(false)
    }
  }

  const selectedEmployeeName = useMemo(
    () => employees.find((e) => e.id === selectedEmployeeId)?.name || 'Employee',
    [employees, selectedEmployeeId]
  )

  return (
    <div className="p-8 space-y-6 bg-[var(--bg)] text-[var(--text-primary)]">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-[var(--text-primary)]">Adjustments</h1>
          <p className="text-sm text-[var(--text-secondary)]">
            Manage additions and deductions applied to payroll, and override them per employee.
          </p>
        </div>
        <div className="inline-flex rounded-full bg-[var(--accent-bg)] text-[var(--accent)] px-3 py-1 text-sm font-semibold items-center gap-2 border border-[var(--border)]">
          <Percent className="h-4 w-4" />
          Admin only
        </div>
      </div>

      {error && (
        <div className="flex items-start gap-2 rounded-lg border border-red-200 bg-red-50 p-3 text-sm text-red-700">
          <AlertCircle className="h-4 w-4 flex-shrink-0 mt-0.5" />
          <span>{error}</span>
        </div>
      )}

      <div className="flex gap-3">
        <button
          type="button"
          onClick={() => setTab('types')}
          className={`rounded-lg px-4 py-2 text-sm font-semibold ${
            tab === 'types' ? 'bg-blue-600 text-white' : 'bg-[var(--surface)] text-[var(--text-primary)] border border-[var(--border)] hover:bg-[var(--surface-light)]'
          }`}
        >
          Adjustment Types
        </button>
        <button
          type="button"
          onClick={() => setTab('employee')}
          className={`rounded-lg px-4 py-2 text-sm font-semibold ${
            tab === 'employee' ? 'bg-blue-600 text-white' : 'bg-[var(--surface)] text-[var(--text-primary)] border border-[var(--border)] hover:bg-[var(--surface-light)]'
          }`}
        >
          Employee Assignments
        </button>
      </div>

      {tab === 'types' && (
        <div className="bg-[var(--surface)] border border-[var(--border)] rounded-2xl shadow-[var(--shadow-card)] p-6">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={loadTypes}
                className="inline-flex items-center gap-2 rounded-lg border border-[var(--border)] px-3 py-2 text-sm font-semibold text-[var(--text-primary)] hover:bg-[var(--surface-light)]"
              >
                <RefreshCw className="h-4 w-4" />
                Refresh
              </button>
            </div>
            <button
              type="button"
              onClick={() => openTypeModal()}
              className="inline-flex items-center gap-2 rounded-lg bg-blue-600 px-4 py-2 text-sm font-semibold text-white shadow-[var(--shadow-card)] hover:bg-blue-700"
            >
              <Plus className="h-4 w-4" />
              Add Type
            </button>
          </div>

          {loadingTypes ? (
            <div className="py-10 text-center text-gray-500">Loading types...</div>
          ) : types.length === 0 ? (
            <div className="py-10 text-center text-gray-500">No adjustment types yet.</div>
          ) : (
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                      Name
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                      Mode
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                      Applies
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                      Cap
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                      Global
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                      Dates
                    </th>
                    <th className="px-4 py-3"></th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200 bg-white">
                  {types.map((type) => (
                    <tr key={type.id} className="hover:bg-[var(--surface-light)] transition-colors">
                      <td className="px-4 py-3">
                        <div className="font-semibold text-gray-900">{type.name}</div>
                        <div className="text-xs text-gray-500">
                          {type.direction === 'add' ? 'Adds' : 'Deducts'} · {type.apply_on === 'all' ? 'All earnings' : 'Overtime only'}
                        </div>
                        {type.note && <div className="text-xs text-gray-500 mt-1">{type.note}</div>}
                      </td>
                      <td className="px-4 py-3 text-sm text-[var(--text-primary)]">
                        {type.mode === 'percent'
                          ? `${type.rate_or_amount}%`
                          : `CA$${type.rate_or_amount}`}
                      </td>
                      <td className="px-4 py-3 text-sm text-[var(--text-primary)]">
                        {type.overtime_rule && type.overtime_rule !== 'none'
                          ? `Overtime rule: ${type.overtime_rule.replace('_', ' ')}`
                          : 'Standard'}
                      </td>
                      <td className="px-4 py-3 text-sm text-gray-700">
                        {type.cap_per_period ? `Cap: CA$${type.cap_per_period}` : '—'}
                      </td>
                      <td className="px-4 py-3 text-sm text-gray-700">
                        {type.applies_globally ? 'Yes' : 'No'}
                      </td>
                      <td className="px-4 py-3 text-sm text-gray-700">
                        {type.effective_start || 'Now'} {type.effective_end ? `→ ${type.effective_end}` : ''}
                      </td>
                      <td className="px-4 py-3 text-right">
                        <button
                          type="button"
                          onClick={() => openTypeModal(type)}
                          className="inline-flex items-center gap-1 rounded-lg border border-gray-200 px-3 py-1.5 text-xs font-semibold text-gray-700 hover:bg-gray-50"
                        >
                          <Pencil className="h-3.5 w-3.5" />
                          Edit
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      {tab === 'employee' && (
        <div className="bg-white border border-gray-200 rounded-2xl shadow-sm p-6">
          <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between mb-4">
            <div className="flex items-center gap-3">
              <label className="text-sm font-semibold text-gray-700">Employee</label>
              <select
                value={selectedEmployeeId}
                onChange={(e) => setSelectedEmployeeId(e.target.value)}
                className="rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm text-gray-900 focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-100"
              >
                {employees.map((emp) => (
                  <option key={emp.id} value={emp.id}>
                    {emp.name} (@{emp.username})
                  </option>
                ))}
              </select>
            </div>
            <div className="flex gap-2">
              <button
                type="button"
                onClick={() => selectedEmployeeId && loadAssignments(selectedEmployeeId)}
                className="inline-flex items-center gap-2 rounded-lg border border-gray-200 px-3 py-2 text-sm font-semibold text-gray-700 hover:bg-gray-50"
              >
                <RefreshCw className="h-4 w-4" />
                Refresh
              </button>
              <button
                type="button"
                onClick={() => openAssignmentModal()}
                className="inline-flex items-center gap-2 rounded-lg bg-blue-600 px-4 py-2 text-sm font-semibold text-white shadow-sm hover:bg-blue-700"
              >
                <Plus className="h-4 w-4" />
                Add Assignment
              </button>
            </div>
          </div>

          {loadingAssignments ? (
            <div className="py-10 text-center text-gray-500">Loading assignments...</div>
          ) : assignments.length === 0 ? (
            <div className="py-10 text-center text-gray-500">
              No assignments for {selectedEmployeeName}. Add one to override or replace global adjustments.
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                      Type
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                      Override
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                      Replace Global
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                      Status
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                      Dates
                    </th>
                    <th className="px-4 py-3"></th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200 bg-white">
                  {assignments.map((assignment) => {
                    const type = types.find((t) => t.id === assignment.adjustment_type_id)
                    return (
                      <tr key={assignment.id} className="hover:bg-[var(--surface-light)] transition-colors">
                        <td className="px-4 py-3">
                          <div className="font-semibold text-gray-900">{type?.name || 'Adjustment'}</div>
                          <div className="text-xs text-gray-500">
                            {type?.direction === 'add' ? 'Adds' : 'Deducts'} · {type?.mode === 'percent' ? `${type.rate_or_amount}%` : `CA$${type?.rate_or_amount ?? ''}`}
                          </div>
                          {assignment.note && <div className="text-xs text-gray-500 mt-1">{assignment.note}</div>}
                        </td>
                        <td className="px-4 py-3 text-sm text-gray-700">
                          {assignment.override_rate_or_amount !== null && assignment.override_rate_or_amount !== undefined
                            ? type?.mode === 'percent'
                              ? `${assignment.override_rate_or_amount}%`
                              : `CA$${assignment.override_rate_or_amount}`
                            : 'Inherit type'}
                          <div className="text-xs text-gray-500">
                            Cap: {assignment.override_cap ? `CA$${assignment.override_cap}` : 'Inherit'}
                          </div>
                        </td>
                        <td className="px-4 py-3 text-sm text-gray-700">{assignment.replace_global ? 'Yes' : 'No'}</td>
                        <td className="px-4 py-3 text-sm">
                          <span
                            className={`inline-flex rounded-full px-2.5 py-0.5 text-xs font-semibold ${
                              assignment.status === 'active'
                                ? 'bg-emerald-50 text-emerald-700'
                                : 'bg-gray-100 text-gray-600'
                            }`}
                          >
                            {assignment.status}
                          </span>
                        </td>
                        <td className="px-4 py-3 text-sm text-gray-700">
                          {assignment.effective_start || 'Now'} {assignment.effective_end ? `→ ${assignment.effective_end}` : ''}
                        </td>
                        <td className="px-4 py-3 text-right">
                          <button
                            type="button"
                            onClick={() => openAssignmentModal(assignment)}
                            className="inline-flex items-center gap-1 rounded-lg border border-gray-200 px-3 py-1.5 text-xs font-semibold text-gray-700 hover:bg-gray-50"
                          >
                            <Pencil className="h-3.5 w-3.5" />
                            Edit
                          </button>
                        </td>
                      </tr>
                    )
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      {typeModalOpen && (
        <Modal title={editingTypeId ? 'Edit Adjustment Type' : 'Add Adjustment Type'} onClose={() => setTypeModalOpen(false)}>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <TextField label="Name" value={typeForm.name || ''} onChange={(v) => setTypeForm({ ...typeForm, name: v })} />
            <SelectField
              label="Direction"
              value={typeForm.direction || 'deduct'}
              onChange={(v) => setTypeForm({ ...typeForm, direction: v as 'add' | 'deduct' })}
              options={[
                { value: 'deduct', label: 'Deduct' },
                { value: 'add', label: 'Add' },
              ]}
            />
            <SelectField
              label="Mode"
              value={typeForm.mode || 'percent'}
              onChange={(v) => setTypeForm({ ...typeForm, mode: v as 'percent' | 'flat' })}
              options={[
                { value: 'percent', label: 'Percent' },
                { value: 'flat', label: 'Flat amount' },
              ]}
            />
            <TextField
              label={typeForm.mode === 'percent' ? 'Rate (%)' : 'Amount'}
              type="number"
              value={typeForm.rate_or_amount?.toString() || ''}
              onChange={(v) => setTypeForm({ ...typeForm, rate_or_amount: parseFloat(v) || 0 })}
            />
            <TextField
              label="Cap per period (optional)"
              type="number"
              value={typeForm.cap_per_period ?? ''}
              onChange={(v) =>
                setTypeForm({ ...typeForm, cap_per_period: v === '' ? null : parseFloat(v) })
              }
            />
            <SelectField
              label="Apply on"
              value={typeForm.apply_on || 'all'}
              onChange={(v) => setTypeForm({ ...typeForm, apply_on: v as 'all' | 'overtime_only' })}
              options={[
                { value: 'all', label: 'All earnings' },
                { value: 'overtime_only', label: 'Overtime only' },
              ]}
            />
            <SelectField
              label="Overtime rule"
              value={typeForm.overtime_rule || 'none'}
              onChange={(v) => setTypeForm({ ...typeForm, overtime_rule: v as any })}
              options={[
                { value: 'none', label: 'None' },
                { value: '8h_day', label: '8+ hours/day' },
                { value: '40h_week', label: '40+ hours/week' },
              ]}
            />
            <SelectField
              label="Applies globally"
              value={typeForm.applies_globally ? 'yes' : 'no'}
              onChange={(v) => setTypeForm({ ...typeForm, applies_globally: v === 'yes' })}
              options={[
                { value: 'yes', label: 'Yes' },
                { value: 'no', label: 'No' },
              ]}
            />
            <TextField
              label="Effective start (optional)"
              type="date"
              value={typeForm.effective_start || ''}
              onChange={(v) => setTypeForm({ ...typeForm, effective_start: v || null })}
            />
            <TextField
              label="Effective end (optional)"
              type="date"
              value={typeForm.effective_end || ''}
              onChange={(v) => setTypeForm({ ...typeForm, effective_end: v || null })}
            />
            <div className="md:col-span-2">
              <label className="text-sm font-semibold text-gray-700">Note</label>
              <textarea
                className="mt-1 w-full rounded-lg border border-gray-300 px-3 py-2 text-sm text-gray-900 focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-100"
                value={typeForm.note || ''}
                onChange={(e) => setTypeForm({ ...typeForm, note: e.target.value })}
              />
            </div>
          </div>
          <div className="mt-6 flex justify-end gap-3">
            <button
              type="button"
              onClick={() => setTypeModalOpen(false)}
              className="rounded-lg border border-gray-300 px-4 py-2 text-sm font-semibold text-gray-700 hover:bg-gray-50"
            >
              Cancel
            </button>
            <button
              type="button"
              disabled={saving}
              onClick={saveType}
              className="inline-flex items-center gap-2 rounded-lg bg-blue-600 px-4 py-2 text-sm font-semibold text-white shadow-sm transition hover:bg-blue-700 disabled:opacity-60"
            >
              {saving && <Spinner />}
              Save
            </button>
          </div>
        </Modal>
      )}

      {assignmentModalOpen && (
        <Modal title={editingAssignmentId ? 'Edit Assignment' : 'Add Assignment'} onClose={() => setAssignmentModalOpen(false)}>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <SelectField
              label="Adjustment type"
              value={assignmentForm.adjustment_type_id || ''}
              onChange={(v) => setAssignmentForm({ ...assignmentForm, adjustment_type_id: v })}
              options={types.map((t) => ({ value: t.id, label: t.name }))}
            />
            <SelectField
              label="Status"
              value={assignmentForm.status || 'active'}
              onChange={(v) => setAssignmentForm({ ...assignmentForm, status: v as 'active' | 'paused' })}
              options={[
                { value: 'active', label: 'Active' },
                { value: 'paused', label: 'Paused' },
              ]}
            />
            <TextField
              label="Override rate/amount (optional)"
              type="number"
              value={assignmentForm.override_rate_or_amount ?? ''}
              onChange={(v) =>
                setAssignmentForm({
                  ...assignmentForm,
                  override_rate_or_amount: v === '' ? null : parseFloat(v),
                })
              }
            />
            <TextField
              label="Override cap per period (optional)"
              type="number"
              value={assignmentForm.override_cap ?? ''}
              onChange={(v) =>
                setAssignmentForm({
                  ...assignmentForm,
                  override_cap: v === '' ? null : parseFloat(v),
                })
              }
            />
            <SelectField
              label="Replace global default?"
              value={assignmentForm.replace_global ? 'yes' : 'no'}
              onChange={(v) => setAssignmentForm({ ...assignmentForm, replace_global: v === 'yes' })}
              options={[
                { value: 'no', label: 'No (stack with global)' },
                { value: 'yes', label: 'Yes (override global)' },
              ]}
            />
            <TextField
              label="Effective start (optional)"
              type="date"
              value={assignmentForm.effective_start || ''}
              onChange={(v) => setAssignmentForm({ ...assignmentForm, effective_start: v || null })}
            />
            <TextField
              label="Effective end (optional)"
              type="date"
              value={assignmentForm.effective_end || ''}
              onChange={(v) => setAssignmentForm({ ...assignmentForm, effective_end: v || null })}
            />
            <div className="md:col-span-2">
              <label className="text-sm font-semibold text-gray-700">Note</label>
              <textarea
                className="mt-1 w-full rounded-lg border border-gray-300 px-3 py-2 text-sm text-gray-900 focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-100"
                value={assignmentForm.note || ''}
                onChange={(e) => setAssignmentForm({ ...assignmentForm, note: e.target.value })}
              />
            </div>
          </div>
          <div className="mt-6 flex justify-end gap-3">
            <button
              type="button"
              onClick={() => setAssignmentModalOpen(false)}
              className="rounded-lg border border-gray-300 px-4 py-2 text-sm font-semibold text-gray-700 hover:bg-gray-50"
            >
              Cancel
            </button>
            <button
              type="button"
              disabled={saving}
              onClick={saveAssignment}
              className="inline-flex items-center gap-2 rounded-lg bg-blue-600 px-4 py-2 text-sm font-semibold text-white shadow-sm transition hover:bg-blue-700 disabled:opacity-60"
            >
              {saving && <Spinner />}
              Save
            </button>
          </div>
        </Modal>
      )}
    </div>
  )
}

function Modal({ title, children, onClose }: { title: string; children: React.ReactNode; onClose: () => void }) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 px-4">
      <div className="w-full max-w-3xl rounded-2xl bg-white shadow-2xl border border-gray-200 p-6">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-semibold text-gray-900">{title}</h3>
          <button
            type="button"
            onClick={onClose}
            className="rounded-full p-2 text-gray-400 hover:bg-gray-100 hover:text-gray-600"
            aria-label="Close dialog"
          >
            <DollarSign className="h-4 w-4" />
          </button>
        </div>
        <div className="space-y-4">{children}</div>
      </div>
    </div>
  )
}

function TextField({
  label,
  value,
  onChange,
  type = 'text',
}: {
  label: string
  value: string | number
  onChange: (value: string) => void
  type?: string
}) {
  return (
    <div>
      <label className="text-sm font-semibold text-gray-700">{label}</label>
      <input
        type={type}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="mt-1 w-full rounded-lg border border-gray-300 px-3 py-2 text-sm text-gray-900 focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-100"
      />
    </div>
  )
}

function SelectField({
  label,
  value,
  onChange,
  options,
}: {
  label: string
  value: string
  onChange: (value: string) => void
  options: { value: string; label: string }[]
}) {
  return (
    <div>
      <label className="text-sm font-semibold text-gray-700">{label}</label>
      <select
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="mt-1 w-full rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm text-gray-900 focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-100"
      >
        {options.map((opt) => (
          <option key={opt.value} value={opt.value}>
            {opt.label}
          </option>
        ))}
      </select>
    </div>
  )
}

function Spinner() {
  return <span className="h-4 w-4 rounded-full border-2 border-white border-t-transparent animate-spin" />
}
