import {
  useEffect,
  useMemo,
  useRef,
  useState,
  FormEvent,
  ChangeEvent,
  type ReactNode,
} from 'react'
import {
  Search,
  Plus,
  Loader2,
  AlertCircle,
  Pencil,
  Trash2,
  Clock,
  X,
  FileDown,
  ChevronDown,
  FileSpreadsheet,
  FileText,
} from 'lucide-react'
import api from '../lib/api'

type EmployeeRecord = {
  id: string
  username: string
  name: string
  email: string
  pay_rate: number
  status: 'active' | 'disabled' | 'deleted'
  created_at: string
  last_clock_out: string | null
}

type ApiUserResponse = Omit<EmployeeRecord, 'last_clock_out'> & {
  role: 'admin' | 'employee'
}

type AddEmployeeForm = {
  name: string
  username: string
  email: string
  pay_rate: string
  password: string
}

type EditEmployeeForm = {
  name: string
  email: string
  pay_rate: string
  status: 'active' | 'disabled'
}

type StatusFilter = 'active' | 'disabled' | 'deleted'

type ExportFormat = 'excel' | 'pdf'

const exportFileDetails: Record<
  ExportFormat,
  { label: string; extension: string; description: string; mime: string }
> = {
  excel: {
    label: 'Excel (.xlsx)',
    extension: 'xlsx',
    description:
      'Download an Excel spreadsheet listing every employee with Sr. No., Full Name, Username, Email, and Pay Rate.',
    mime: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
  },
  pdf: {
    label: 'PDF (.pdf)',
    extension: 'pdf',
    description:
      'Download a PDF table listing every employee with Sr. No., Full Name, Username, Email, and Pay Rate.',
    mime: 'application/pdf',
  },
}

const emptyAddForm: AddEmployeeForm = {
  name: '',
  username: '',
  email: '',
  pay_rate: '',
  password: '',
}

const defaultEditForm: EditEmployeeForm = {
  name: '',
  email: '',
  pay_rate: '',
  status: 'active',
}

export default function EmployeeManagement() {
  const [employees, setEmployees] = useState<EmployeeRecord[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [searchTerm, setSearchTerm] = useState('')
  const [statusFilter, setStatusFilter] = useState<StatusFilter>('active')
  const [addModalOpen, setAddModalOpen] = useState(false)
  const [editModalOpen, setEditModalOpen] = useState(false)
  const [deleteModalOpen, setDeleteModalOpen] = useState(false)
  const [selectedEmployee, setSelectedEmployee] = useState<EmployeeRecord | null>(null)
  const [exportMenuOpen, setExportMenuOpen] = useState(false)
  const [exportSelection, setExportSelection] = useState<ExportFormat | null>(null)
  const [exporting, setExporting] = useState(false)
  const [exportError, setExportError] = useState('')
  const exportMenuRef = useRef<HTMLDivElement | null>(null)

  useEffect(() => {
    loadEmployees()
  }, [])

  useEffect(() => {
    if (!exportMenuOpen) {
      return
    }
    const handleClick = (event: MouseEvent) => {
      if (exportMenuRef.current && !exportMenuRef.current.contains(event.target as Node)) {
        setExportMenuOpen(false)
      }
    }
    document.addEventListener('mousedown', handleClick)
    return () => document.removeEventListener('mousedown', handleClick)
  }, [exportMenuOpen])

  const loadEmployees = async () => {
    setLoading(true)
    setError('')
    try {
      const { data } = await api.get<EmployeeRecord[]>('/users/management')
      setEmployees(data)
    } catch (err: any) {
      const detail = err.response?.data?.detail
      setError(typeof detail === 'string' ? detail : 'Unable to load employees right now.')
    } finally {
      setLoading(false)
    }
  }

  const filteredEmployees = useMemo(() => {
    const query = searchTerm.trim().toLowerCase()

    return employees.filter((employee) => {
      const matchesSearch =
        !query ||
        [employee.name, employee.username, employee.email].some((value) =>
          value.toLowerCase().includes(query)
        )

      const matchesStatus = employee.status === statusFilter

      return matchesSearch && matchesStatus
    })
  }, [employees, searchTerm, statusFilter])

  const handleEmployeeAdded = (employee: EmployeeRecord) => {
    setEmployees((prev) => [employee, ...prev])
  }

  const handleEmployeeUpdated = (employee: EmployeeRecord) => {
    setEmployees((prev) =>
      prev.map((existing) => (existing.id === employee.id ? employee : existing))
    )
  }

  const handleEmployeeDeleted = (id: string) => {
    setEmployees((prev) => prev.filter((employee) => employee.id !== id))
  }

  const handleOpenEdit = (employee: EmployeeRecord) => {
    setSelectedEmployee(employee)
    setEditModalOpen(true)
  }

  const handleOpenDelete = (employee: EmployeeRecord) => {
    setSelectedEmployee(employee)
    setDeleteModalOpen(true)
  }

  const handleExportOptionSelect = (format: ExportFormat) => {
    setExportMenuOpen(false)
    setExportError('')
    setExportSelection(format)
  }

  const handleCancelExport = () => {
    setExportSelection(null)
    setExportError('')
  }

  const resolveFilename = (dispositionHeader?: string, fallback?: string) => {
    if (!dispositionHeader) {
      return fallback
    }
    const utfMatch = /filename\*=UTF-8''([^;]+)/i.exec(dispositionHeader)
    if (utfMatch?.[1]) {
      try {
        return decodeURIComponent(utfMatch[1])
      } catch {
        return utfMatch[1]
      }
    }
    const quotedMatch = /filename="([^"]+)"/i.exec(dispositionHeader)
    if (quotedMatch?.[1]) {
      return quotedMatch[1]
    }
    const simpleMatch = /filename=([^;]+)/i.exec(dispositionHeader)
    if (simpleMatch?.[1]) {
      return simpleMatch[1]
    }
    return fallback
  }

  const handleConfirmExport = async () => {
    if (!exportSelection) {
      return
    }
    setExporting(true)
    setExportError('')
    const details = exportFileDetails[exportSelection]
    try {
      const response = await api.get<Blob>(`/users/export`, {
        params: { format: exportSelection },
        responseType: 'blob',
      })
      const headers = response.headers as Record<string, string | undefined>
      const disposition = headers['content-disposition'] ?? headers['Content-Disposition']
      const fallbackFileName = `employees.${details.extension}`
      const filename = resolveFilename(disposition, fallbackFileName) ?? fallbackFileName

      const blob = new Blob([response.data], { type: details.mime })
      const downloadUrl = window.URL.createObjectURL(blob)
      const link = document.createElement('a')
      link.href = downloadUrl
      link.download = filename
      document.body.appendChild(link)
      link.click()
      document.body.removeChild(link)
      window.URL.revokeObjectURL(downloadUrl)
      setExportSelection(null)
    } catch (err: any) {
      const detail = err.response?.data?.detail
      setExportError(typeof detail === 'string' ? detail : 'Unable to export employees.')
    } finally {
      setExporting(false)
    }
  }

  return (
    <div className="p-8 bg-[var(--bg)] text-[var(--text-primary)]">
      <div className="mb-6 flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:gap-4 w-full md:max-w-xl">
          <div className="relative flex-1 min-w-[220px]">
            <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-[var(--text-secondary)]" />
            <input
              type="text"
              value={searchTerm}
              onChange={(event) => setSearchTerm(event.target.value)}
              placeholder="Search employees..."
              className="w-full rounded-lg border border-[var(--border)] bg-[var(--surface)] py-2 pl-9 pr-3 text-sm text-[var(--text-primary)] placeholder:text-[var(--text-muted)] focus:border-[var(--accent)] focus:outline-none focus:ring-2 focus:ring-[rgba(59,130,246,0.2)]"
            />
          </div>
          <div className="flex items-center gap-2">
            <label className="text-sm font-semibold text-[var(--text-primary)]" htmlFor="status-filter">
              Status
            </label>
            <select
              id="status-filter"
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value as StatusFilter)}
              className="rounded-lg border border-[var(--border)] bg-[var(--surface)] px-3 py-2 text-sm text-[var(--text-primary)] focus:border-[var(--accent)] focus:outline-none focus:ring-2 focus:ring-[rgba(59,130,246,0.2)]"
            >
              <option value="active">Active</option>
              <option value="disabled">Disabled</option>
              <option value="deleted">Deleted</option>
            </select>
          </div>
          <div className="flex items-center gap-2 rounded-lg border border-[var(--border)] bg-[var(--surface-light)] px-3 py-2 text-sm font-semibold text-[var(--text-primary)] sm:ml-auto">
            <span className="text-[var(--text-secondary)]">Total: </span>
            <span>{employees.length}</span>
          </div>
        </div>

        <div className="flex flex-col items-stretch gap-3 sm:flex-row sm:items-center">
          <div className="relative" ref={exportMenuRef}>
            <button
              type="button"
              onClick={() => setExportMenuOpen((prev) => !prev)}
              aria-expanded={exportMenuOpen}
              className="inline-flex items-center justify-center gap-2 rounded-lg border border-[var(--border)] bg-[var(--surface)] px-4 py-2 text-sm font-semibold text-[var(--text-primary)] transition hover:bg-[var(--surface-light)]"
            >
              <FileDown className="h-4 w-4" />
              Export
              <ChevronDown className="h-4 w-4 text-[var(--text-secondary)]" />
            </button>
            {exportMenuOpen && (
              <div className="absolute right-0 z-20 mt-2 w-56 rounded-xl border border-[var(--border)] bg-[var(--surface)] p-2 shadow-[var(--shadow-card)]">
                <button
                  type="button"
                  onClick={() => handleExportOptionSelect('excel')}
                  className="flex w-full items-center gap-2 rounded-lg px-3 py-2 text-sm font-semibold text-[var(--text-primary)] transition hover:bg-[var(--surface-light)]"
                >
                  <FileSpreadsheet className="h-4 w-4 text-emerald-400" />
                  Excel (.xlsx)
                </button>
                <button
                  type="button"
                  onClick={() => handleExportOptionSelect('pdf')}
                  className="mt-1 flex w-full items-center gap-2 rounded-lg px-3 py-2 text-sm font-semibold text-[var(--text-primary)] transition hover:bg-[var(--surface-light)]"
                >
                  <FileText className="h-4 w-4 text-rose-400" />
                  PDF (.pdf)
                </button>
              </div>
            )}
        </div>
        <button
          type="button"
          onClick={() => setAddModalOpen(true)}
          className="inline-flex items-center justify-center gap-2 rounded-lg bg-blue-600 px-4 py-2 text-sm font-semibold text-white shadow-[var(--shadow-card)] transition-colors hover:bg-blue-700"
        >
          <Plus className="h-4 w-4" />
          Add Employee
        </button>
        </div>
      </div>

      {error && (
        <div className="mb-4 flex items-start gap-2 rounded-lg border border-[rgba(248,113,113,0.4)] bg-[rgba(248,113,113,0.12)] p-3 text-sm text-red-200">
          <AlertCircle className="h-4 w-4 flex-shrink-0 text-red-300" />
          <span>{error}</span>
        </div>
      )}

      {loading ? (
        <div className="flex items-center justify-center rounded-2xl border border-[var(--border)] bg-[var(--surface)] py-20 shadow-[var(--shadow-card)]">
          <Loader2 className="h-6 w-6 animate-spin text-blue-600" />
        </div>
      ) : filteredEmployees.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-[var(--border)] bg-[var(--surface)] p-12 text-center shadow-[var(--shadow-card)]">
          <p className="text-[var(--text-secondary)]">
            {employees.length === 0
              ? 'No employees yet. Use the “Add Employee” button to get started.'
              : 'No employees match your search.'}
          </p>
        </div>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
          {filteredEmployees.map((employee) => (
            <div
              key={employee.id}
              className="group relative flex h-full flex-col rounded-2xl border border-[var(--border)] bg-[var(--surface)] p-4 shadow-[var(--shadow-card)] transition hover:border-[var(--accent)] hover:bg-[var(--surface-light)]"
            >
              <div className="flex items-start justify-between gap-3">
                <div className="flex flex-col gap-1">
                  <div className="text-lg font-semibold text-[var(--text-primary)]">{employee.name}</div>
                  <div className="text-sm text-[var(--text-secondary)]">@{employee.username}</div>
                </div>
                {employee.status === 'deleted' ? (
                  <div className="text-xs font-semibold text-amber-200 bg-[rgba(251,191,36,0.14)] px-3 py-1 rounded-full border border-[rgba(251,191,36,0.35)]">
                    Archived
                  </div>
                ) : (
                  <div className="flex items-center gap-2 opacity-0 transition group-hover:opacity-100">
                    <button
                      type="button"
                      onClick={() => handleOpenEdit(employee)}
                      className="rounded-full border border-[var(--border)] bg-[var(--surface-light)] p-2 text-[var(--text-secondary)] hover:border-[var(--accent)] hover:text-[var(--accent)]"
                      aria-label={`Edit ${employee.name}`}
                    >
                      <Pencil className="h-4 w-4" />
                    </button>
                    <button
                      type="button"
                      onClick={() => handleOpenDelete(employee)}
                      className="rounded-full border border-[var(--border)] bg-[var(--surface-light)] p-2 text-[var(--text-secondary)] hover:border-[rgba(248,113,113,0.4)] hover:text-red-400"
                      aria-label={`Delete ${employee.name}`}
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </div>
                )}
              </div>
              <div className="mt-3 flex flex-wrap items-center gap-3 text-sm text-[var(--text-secondary)]">
                <span>{employee.email}</span>
                <span className="font-medium text-[var(--text-primary)]">${employee.pay_rate.toFixed(2)}/hr</span>
                <span
                  className={`inline-flex rounded-full px-2.5 py-0.5 text-xs font-semibold ${
                    employee.status === 'active'
                      ? 'bg-[rgba(34,197,94,0.16)] text-emerald-200 border border-[rgba(34,197,94,0.4)]'
                      : employee.status === 'disabled'
                        ? 'bg-[var(--surface-light)] text-[var(--text-secondary)] border border-[var(--border)]'
                        : 'bg-[rgba(251,191,36,0.14)] text-amber-200 border border-[rgba(251,191,36,0.35)]'
                  }`}
                >
                  {employee.status === 'deleted' ? 'Deleted' : employee.status}
                </span>
                <span className="inline-flex items-center gap-1 rounded-full bg-[var(--surface-light)] px-3 py-0.5 text-xs font-semibold text-[var(--text-primary)] border border-[var(--border)]">
                  <Clock className="h-3.5 w-3.5" />
                  {employee.last_clock_out
                    ? new Date(employee.last_clock_out).toLocaleString()
                    : 'No clock-out yet'}
                </span>
              </div>
            </div>
          ))}
        </div>
      )}

      <AddEmployeeModal
        open={addModalOpen}
        onClose={() => setAddModalOpen(false)}
        onSuccess={handleEmployeeAdded}
      />

      <EditEmployeeModal
        open={editModalOpen}
        employee={selectedEmployee}
        onClose={() => setEditModalOpen(false)}
        onUpdated={handleEmployeeUpdated}
      />

      <DeleteEmployeeModal
        open={deleteModalOpen}
        employee={selectedEmployee}
        onClose={() => setDeleteModalOpen(false)}
        onDeleted={handleEmployeeDeleted}
      />

      <ExportConfirmModal
        format={exportSelection}
        onCancel={handleCancelExport}
        onConfirm={handleConfirmExport}
        loading={exporting}
        error={exportError}
      />
    </div>
  )
}

type AddEmployeeModalProps = {
  open: boolean
  onClose: () => void
  onSuccess: (employee: EmployeeRecord) => void
}

function AddEmployeeModal({ open, onClose, onSuccess }: AddEmployeeModalProps) {
  const [form, setForm] = useState<AddEmployeeForm>(emptyAddForm)
  const [error, setError] = useState('')
  const [submitting, setSubmitting] = useState(false)

  useEffect(() => {
    if (open) {
      setForm(emptyAddForm)
      setError('')
      setSubmitting(false)
    }
  }, [open])

  if (!open) {
    return null
  }

  const handleChange =
    (field: keyof AddEmployeeForm) =>
    (event: ChangeEvent<HTMLInputElement>) => {
      setForm((prev) => ({ ...prev, [field]: event.target.value }))
    }

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    setSubmitting(true)
    setError('')

    const payRateValue = Number(form.pay_rate)
    if (Number.isNaN(payRateValue) || payRateValue <= 0) {
      setSubmitting(false)
      setError('Pay rate must be greater than zero.')
      return
    }

    try {
      const { data } = await api.post<ApiUserResponse>('/users', {
        name: form.name.trim(),
        username: form.username.trim(),
        email: form.email.trim(),
        pay_rate: payRateValue,
        password: form.password,
      })

      onSuccess({
        ...data,
        last_clock_out: null,
      })
      onClose()
    } catch (err: any) {
      const detail = err.response?.data?.detail
      setError(typeof detail === 'string' ? detail : 'Failed to add employee.')
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <Modal onClose={onClose} title="Add Employee">
      {error && (
        <div className="mb-4 flex items-start gap-2 rounded-lg border border-[rgba(248,113,113,0.4)] bg-[rgba(248,113,113,0.12)] p-3 text-sm text-red-200">
          <AlertCircle className="h-4 w-4 flex-shrink-0 text-red-300" />
          <span>{error}</span>
        </div>
      )}

      <form className="space-y-4" onSubmit={handleSubmit}>
        <TextField
          label="Full Name"
          id="add-name"
          value={form.name}
          required
          onChange={handleChange('name')}
        />
        <TextField
          label="Username"
          id="add-username"
          value={form.username}
          required
          onChange={handleChange('username')}
        />
        <TextField
          label="Email"
          id="add-email"
          type="email"
          value={form.email}
          required
          onChange={handleChange('email')}
        />
        <TextField
          label="Hourly Pay Rate"
          id="add-pay-rate"
          type="number"
          min="0"
          step="0.01"
          value={form.pay_rate}
          required
          onChange={handleChange('pay_rate')}
        />
        <TextField
          label="Temporary Password"
          id="add-password"
          type="password"
          value={form.password}
          minLength={6}
          required
          onChange={handleChange('password')}
        />

        <ModalActions
          submitting={submitting}
          submitLabel="Add Employee"
          onCancel={onClose}
        />
      </form>
    </Modal>
  )
}

type EditEmployeeModalProps = {
  open: boolean
  employee: EmployeeRecord | null
  onClose: () => void
  onUpdated: (employee: EmployeeRecord) => void
}

function EditEmployeeModal({ open, employee, onClose, onUpdated }: EditEmployeeModalProps) {
  const [form, setForm] = useState<EditEmployeeForm>(defaultEditForm)
  const [error, setError] = useState('')
  const [submitting, setSubmitting] = useState(false)

  useEffect(() => {
    if (open && employee) {
      setForm({
        name: employee.name,
        email: employee.email,
        pay_rate: employee.pay_rate.toString(),
        status: employee.status === 'deleted' ? 'disabled' : employee.status,
      })
      setError('')
      setSubmitting(false)
    }
  }, [open, employee])

  if (!open || !employee) {
    return null
  }

  const handleChange =
    (field: keyof EditEmployeeForm) =>
    (event: ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
      setForm((prev) => ({ ...prev, [field]: event.target.value }))
    }

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    setSubmitting(true)
    setError('')

    const payRateValue = Number(form.pay_rate)
    if (Number.isNaN(payRateValue) || payRateValue <= 0) {
      setSubmitting(false)
      setError('Pay rate must be greater than zero.')
      return
    }

    try {
      const { data } = await api.put<ApiUserResponse>(`/users/${employee.id}`, {
        name: form.name.trim(),
        email: form.email.trim(),
        pay_rate: payRateValue,
        status: form.status,
      })

      onUpdated({
        ...data,
        last_clock_out: employee.last_clock_out,
      })
      onClose()
    } catch (err: any) {
      const detail = err.response?.data?.detail
      setError(typeof detail === 'string' ? detail : 'Failed to update employee.')
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <Modal onClose={onClose} title="Edit Employee">
      {error && (
        <div className="mb-4 flex items-start gap-2 rounded-lg border border-[rgba(248,113,113,0.4)] bg-[rgba(248,113,113,0.12)] p-3 text-sm text-red-200">
          <AlertCircle className="h-4 w-4 flex-shrink-0 text-red-300" />
          <span>{error}</span>
        </div>
      )}

      <form className="space-y-4" onSubmit={handleSubmit}>
        <TextField
          label="Full Name"
          id="edit-name"
          value={form.name}
          required
          onChange={handleChange('name')}
        />
        <TextField
          label="Email"
          id="edit-email"
          type="email"
          value={form.email}
          required
          onChange={handleChange('email')}
        />
        <TextField
          label="Hourly Pay Rate"
          id="edit-pay-rate"
          type="number"
          min="0"
          step="0.01"
          value={form.pay_rate}
          required
          onChange={handleChange('pay_rate')}
        />

        <div>
          <label htmlFor="edit-status" className="text-sm font-medium text-[var(--text-primary)]">
            Status
          </label>
          <select
            id="edit-status"
            value={form.status}
            onChange={handleChange('status')}
            className="mt-1 w-full rounded-lg border border-[var(--border)] bg-[var(--surface)] px-3 py-2 text-sm text-[var(--text-primary)] focus:border-[var(--accent)] focus:outline-none focus:ring-2 focus:ring-[rgba(59,130,246,0.2)]"
          >
            <option value="active">Active</option>
            <option value="disabled">Disabled</option>
          </select>
        </div>

        <ModalActions
          submitting={submitting}
          submitLabel="Save Changes"
          onCancel={onClose}
        />
      </form>
    </Modal>
  )
}

type DeleteEmployeeModalProps = {
  open: boolean
  employee: EmployeeRecord | null
  onClose: () => void
  onDeleted: (id: string) => void
}

function DeleteEmployeeModal({ open, employee, onClose, onDeleted }: DeleteEmployeeModalProps) {
  const [error, setError] = useState('')
  const [submitting, setSubmitting] = useState(false)

  useEffect(() => {
    if (open) {
      setError('')
      setSubmitting(false)
    }
  }, [open])

  if (!open || !employee) {
    return null
  }

  const handleDelete = async () => {
    setSubmitting(true)
    setError('')
    try {
      await api.delete(`/users/${employee.id}`)
      onDeleted(employee.id)
      onClose()
    } catch (err: any) {
      const detail = err.response?.data?.detail
      setError(typeof detail === 'string' ? detail : 'Failed to delete employee.')
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <Modal onClose={onClose} title="Delete Employee">
      <p className="text-sm text-[var(--text-secondary)]">
        Are you sure you want to delete <span className="font-semibold text-[var(--text-primary)]">{employee.name}</span>? Their
        details will be archived under deleted employees.
      </p>

      {error && (
        <div className="mt-4 flex items-start gap-2 rounded-lg border border-[rgba(248,113,113,0.4)] bg-[rgba(248,113,113,0.12)] p-3 text-sm text-red-200">
          <AlertCircle className="h-4 w-4 flex-shrink-0 text-red-300" />
          <span>{error}</span>
        </div>
      )}

      <div className="mt-6 flex justify-end gap-3">
        <button
          type="button"
          onClick={onClose}
          className="rounded-lg border border-[var(--border)] bg-[var(--surface)] px-4 py-2 text-sm font-medium text-[var(--text-primary)] hover:bg-[var(--surface-light)]"
        >
          Cancel
        </button>
        <button
          type="button"
          onClick={handleDelete}
          disabled={submitting}
          className="inline-flex items-center gap-2 rounded-lg bg-red-600 px-4 py-2 text-sm font-semibold text-white shadow-[var(--shadow-card)] hover:bg-red-700 disabled:opacity-60"
        >
          {submitting && <Loader2 className="h-4 w-4 animate-spin" />}
          Delete Employee
        </button>
      </div>
    </Modal>
  )
}

type ExportConfirmModalProps = {
  format: ExportFormat | null
  onCancel: () => void
  onConfirm: () => void
  loading: boolean
  error: string
}

function ExportConfirmModal({ format, onCancel, onConfirm, loading, error }: ExportConfirmModalProps) {
  if (!format) {
    return null
  }

  const details = exportFileDetails[format]

  return (
    <Modal title="Download employee list" onClose={onCancel}>
      <p className="text-sm text-[var(--text-secondary)]">{details.description}</p>
      <p className="mt-2 text-sm text-[var(--text-secondary)]">
        Do you want to download the latest employee roster as {details.label}?
      </p>

      {error && (
        <div className="mt-4 flex items-start gap-2 rounded-lg border border-[rgba(248,113,113,0.4)] bg-[rgba(248,113,113,0.12)] p-3 text-sm text-red-200">
          <AlertCircle className="h-4 w-4 flex-shrink-0 text-red-300" />
          <span>{error}</span>
        </div>
      )}

      <div className="mt-6 flex justify-end gap-3">
        <button
          type="button"
          onClick={onCancel}
          className="rounded-lg border border-[var(--border)] bg-[var(--surface)] px-4 py-2 text-sm font-medium text-[var(--text-primary)] hover:bg-[var(--surface-light)]"
        >
          Cancel
        </button>
        <button
          type="button"
          onClick={onConfirm}
          disabled={loading}
          className="inline-flex items-center gap-2 rounded-lg bg-[var(--surface-light)] px-4 py-2 text-sm font-semibold text-[var(--text-primary)] transition hover:bg-[#20252d] disabled:cursor-not-allowed disabled:opacity-60 border border-[var(--border)]"
        >
          {loading && <Loader2 className="h-4 w-4 animate-spin" />}
          Download {details.label}
        </button>
      </div>
    </Modal>
  )
}

type ModalProps = {
  title: string
  children: ReactNode
  onClose: () => void
}

function Modal({ title, children, onClose }: ModalProps) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-[rgba(13,15,18,0.75)] px-4 backdrop-blur-sm">
      <div className="relative w-full max-w-lg rounded-2xl bg-[var(--surface)] border border-[var(--border)] p-6 shadow-[var(--shadow-card)]">
        <button
          type="button"
          onClick={onClose}
          className="absolute right-4 top-4 rounded-full bg-[var(--surface-light)] p-1 text-[var(--text-secondary)] hover:text-[var(--text-primary)]"
          aria-label="Close dialog"
        >
          <X className="h-4 w-4" />
        </button>
        <h3 className="text-xl font-semibold text-[var(--text-primary)]">{title}</h3>
        <div className="mt-4">{children}</div>
      </div>
    </div>
  )
}

type TextFieldProps = {
  label: string
  id: string
  type?: string
  value: string
  onChange: (event: ChangeEvent<HTMLInputElement>) => void
  required?: boolean
  minLength?: number
  min?: string
  step?: string
}

function TextField({
  label,
  id,
  type = 'text',
  value,
  onChange,
  required,
  minLength,
  min,
  step,
}: TextFieldProps) {
  return (
    <div>
      <label htmlFor={id} className="text-sm font-medium text-[var(--text-primary)]">
        {label}
      </label>
      <input
        id={id}
        type={type}
        value={value}
        required={required}
        onChange={onChange}
        minLength={minLength}
        min={min}
        step={step}
        className="mt-1 w-full rounded-lg border border-[var(--border)] bg-[var(--surface)] px-3 py-2 text-sm text-[var(--text-primary)] placeholder:text-[var(--text-muted)] focus:border-[var(--accent)] focus:outline-none focus:ring-2 focus:ring-[rgba(59,130,246,0.2)]"
      />
    </div>
  )
}

type ModalActionsProps = {
  submitLabel: string
  submitting: boolean
  onCancel: () => void
}

function ModalActions({ submitLabel, submitting, onCancel }: ModalActionsProps) {
  return (
    <div className="flex justify-end gap-3 pt-2">
      <button
        type="button"
        onClick={onCancel}
        className="rounded-lg border border-[var(--border)] bg-[var(--surface)] px-4 py-2 text-sm font-medium text-[var(--text-primary)] hover:bg-[var(--surface-light)]"
      >
        Cancel
      </button>
      <button
        type="submit"
        disabled={submitting}
        className="inline-flex items-center gap-2 rounded-lg bg-blue-600 px-4 py-2 text-sm font-semibold text-white shadow-[var(--shadow-card)] transition-colors hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-60"
      >
        {submitting && <Loader2 className="h-4 w-4 animate-spin" />}
        {submitLabel}
      </button>
    </div>
  )
}
