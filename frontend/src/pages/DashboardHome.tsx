import { useEffect, useMemo, useState } from 'react'
import { TrendingUp } from 'lucide-react'
import {
  BarChart,
  Bar,
  PieChart,
  Pie,
  Cell,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  AreaChart,
  Area,
  Legend,
} from 'recharts'
import api from '../lib/api'

interface FinancialSnapshot {
  labor_cost: number
  payroll_processed: number
  overtime_spend: number
  trend: number
}

interface BudgetProgress {
  used: number
  budget: number
  remaining: number
  percent: number
}

interface LaborVsPayrollPoint {
  label: string
  scheduled_cost: number
  payroll_cost: number
  taxes?: number
  payroll_with_taxes?: number
  payroll_taxes?: number
}

interface ProductivityPoint {
  date: string
  scheduled_hours: number
  worked_hours: number
  overtime_hours: number
}

interface CoverageCell {
  date: string
  open_shifts: number
  overtime_hours: number
}

interface Utilization {
  percentage: number
  trend: number
}

interface PaymentStatus {
  status: string
  amount: number
}

interface Exceptions {
  missed_clock_ins: number
  overtime_pending: number
  shift_followups: number
}

interface Analytics {
  hours_trend: Array<{ date: string; hours: number }>
  employees_by_department: Array<{ department: string; count: number }>
  attendance_overview: Array<{ date: string; count: number }>
  financial_snapshot: FinancialSnapshot
  labor_vs_payroll: LaborVsPayrollPoint[]
  budget_progress: BudgetProgress
  productivity_trend: ProductivityPoint[]
  coverage_heatmap: CoverageCell[]
  utilization: Utilization
  payments_status: PaymentStatus[]
  exceptions: Exceptions
}

interface Activity {
  type: string
  message: string
  timestamp: string
  user_name: string
}

const currencyFormatter = new Intl.NumberFormat('en-US', {
  style: 'currency',
  currency: 'USD',
  maximumFractionDigits: 0,
})
const numberFormatter = new Intl.NumberFormat('en-US', {
  maximumFractionDigits: 1,
})

const emptyAnalytics: Analytics = {
  hours_trend: [],
  employees_by_department: [],
  attendance_overview: [],
  financial_snapshot: {
    labor_cost: 0,
    payroll_processed: 0,
    overtime_spend: 0,
    trend: 0,
  },
  labor_vs_payroll: [],
  budget_progress: {
    used: 0,
    budget: 0,
    remaining: 0,
    percent: 0,
  },
  productivity_trend: [],
  coverage_heatmap: [],
  utilization: {
    percentage: 0,
    trend: 0,
  },
  payments_status: [],
  exceptions: {
    missed_clock_ins: 0,
    overtime_pending: 0,
    shift_followups: 0,
  },
}

const formatCurrency = (value: number | undefined) => currencyFormatter.format(value ?? 0)

const formatDateLabel = (dateStr: string) => {
  const date = new Date(dateStr)
  return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
}

const formatTimestamp = (timestamp: string) => {
  const date = new Date(timestamp)
  const now = new Date()
  const diff = now.getTime() - date.getTime()
  const minutes = Math.floor(diff / 60000)
  const hours = Math.floor(minutes / 60)
  const days = Math.floor(hours / 24)

  if (minutes < 60) return `${minutes}m ago`
  if (hours < 24) return `${hours}h ago`
  return `${days}d ago`
}

export default function DashboardHome() {
  const [analytics, setAnalytics] = useState<Analytics>(emptyAnalytics)
  const [activities, setActivities] = useState<Activity[]>([])
  const [loading, setLoading] = useState(true)

  const laborChartData = useMemo(() => {
    const data = analytics.labor_vs_payroll || []
    // Show roughly one month (last 4 entries) if more data is present.
    if (data.length > 4) {
      return data.slice(-4)
    }
    return data
  }, [analytics.labor_vs_payroll])

  useEffect(() => {
    loadDashboardData()
  }, [])

  const loadDashboardData = async () => {
    try {
      const [analyticsRes, activityRes, budgetRes] = await Promise.all([
        api.get('/dashboard/analytics'),
        api.get('/dashboard/recent-activity'),
        api
          .get<{ budget?: number }>('/settings/budget')
          .catch(() => ({ data: { budget: undefined } as { budget?: number } })),
      ])

      const analyticsWithBudget = { ...analyticsRes.data }

      // Include payroll taxes in payroll line when present
      if (Array.isArray(analyticsWithBudget.labor_vs_payroll)) {
        analyticsWithBudget.labor_vs_payroll = analyticsWithBudget.labor_vs_payroll.map((item: LaborVsPayrollPoint) => {
          const taxes = item.taxes ?? Math.max(item.scheduled_cost - item.payroll_cost, 0)
          return {
            ...item,
            payroll_taxes: Math.round(taxes * 100) / 100,
            payroll_with_taxes: Math.round((item.payroll_cost + taxes) * 100) / 100,
          }
        })
      }
      const budgetOverride = budgetRes?.data?.budget
      if (budgetOverride && analyticsWithBudget.budget_progress) {
        const used = analyticsWithBudget.budget_progress.used
        const remaining = Math.max(budgetOverride - used, 0)
        const percent = budgetOverride ? Math.round((used / budgetOverride) * 100) : analyticsWithBudget.budget_progress.percent
        analyticsWithBudget.budget_progress = {
          ...analyticsWithBudget.budget_progress,
          budget: budgetOverride,
          remaining,
          percent,
        }
      }
      setAnalytics(analyticsWithBudget)
      setActivities(activityRes.data.activities || [])
    } catch (error) {
      console.error('Failed to load dashboard data:', error)
    } finally {
      setLoading(false)
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-full bg-[var(--bg)] text-[var(--text-primary)]">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600" />
      </div>
    )
  }

  return (
    <div className="p-8 space-y-6 bg-[var(--bg)] text-[var(--text-primary)]" data-testid="dashboard-home">
      <div>
        <h2 className="text-2xl font-bold text-[var(--text-primary)]">Dashboard Overview</h2>
        <p className="text-sm text-[var(--text-secondary)] mt-1">
          Track labor cost, utilization, and payroll health at a glance.
        </p>
      </div>

      <div className="grid gap-6 xl:grid-cols-3">
        <div className="bg-[var(--surface)] rounded-2xl shadow-[var(--shadow-card)] border border-[var(--border)] p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-[var(--text-secondary)]">Monthly labor cost</p>
              <p className="text-3xl font-bold text-[var(--text-primary)]">
                {formatCurrency(analytics.financial_snapshot.labor_cost)}
              </p>
            </div>
            <div
              className={`flex items-center gap-1 text-sm font-semibold ${
                analytics.financial_snapshot.trend >= 0 ? 'text-emerald-600' : 'text-rose-600'
              }`}
            >
              <TrendingUp className="h-4 w-4" />
              {analytics.financial_snapshot.trend >= 0 ? '+' : ''}
              {analytics.financial_snapshot.trend.toFixed(1)}%
            </div>
          </div>
          <div className="mt-6 grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="rounded-xl border border-[rgba(59,130,246,0.35)] bg-[rgba(59,130,246,0.15)] p-4">
              <p className="text-xs uppercase tracking-wide text-blue-200">Payroll processed</p>
              <p className="text-xl font-semibold text-white">
                {formatCurrency(analytics.financial_snapshot.payroll_processed)}
              </p>
            </div>
            <div className="rounded-xl border border-[rgba(251,191,36,0.4)] bg-[rgba(251,191,36,0.12)] p-4">
              <p className="text-xs uppercase tracking-wide text-amber-200">Overtime spend</p>
              <p className="text-xl font-semibold text-amber-100">
                {formatCurrency(analytics.financial_snapshot.overtime_spend)}
              </p>
            </div>
          </div>
        </div>

        <div className="bg-[var(--surface)] rounded-2xl shadow-[var(--shadow-card)] border border-[var(--border)] p-6">
          <h3 className="text-lg font-semibold text-[var(--text-primary)] mb-4">Labor vs Payroll</h3>
          {laborChartData.length > 0 ? (
            <ResponsiveContainer width="100%" height={240}>
              <BarChart data={laborChartData}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="rgba(255,255,255,0.08)" />
                <XAxis dataKey="label" tick={{ fontSize: 11, fill: 'var(--text-secondary)' }} />
                <YAxis
                  tickFormatter={(value: number) => `$${(value / 1000).toFixed(0)}k`}
                  tick={{ fontSize: 11, fill: 'var(--text-secondary)' }}
                />
                <Tooltip
                  formatter={(value: number) => [formatCurrency(value), '']}
                  contentStyle={{ background: 'var(--surface-light)', border: `1px solid var(--border)`, color: 'var(--text-primary)', borderRadius: 12 }}
                  cursor={{ fill: 'rgba(255,255,255,0.04)' }}
                />
                <Legend verticalAlign="top" height={36} wrapperStyle={{ color: 'var(--text-secondary)' }} />
                <Bar dataKey="scheduled_cost" name="Shift cost" fill="rgba(59,130,246,0.35)" radius={[6, 6, 0, 0]} />
                <Bar dataKey="payroll_cost" name="Payroll paid" fill="var(--accent)" stackId="payroll" radius={[6, 6, 0, 0]} />
                <Bar dataKey="payroll_taxes" name="Taxes paid" fill="#6b7280" stackId="payroll" radius={[6, 6, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          ) : (
            <EmptyState message="No labor cost data available" />
          )}
        </div>

        <div className="bg-[var(--surface)] rounded-2xl shadow-[var(--shadow-card)] border border-[var(--border)] p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-[var(--text-secondary)]">Budget Used</p>
              <p className="text-3xl font-bold text-[var(--text-primary)]">{analytics.budget_progress.percent}%</p>
            </div>
            <p className="text-sm font-semibold text-[var(--text-secondary)]">
              Budget {formatCurrency(analytics.budget_progress.budget)}
            </p>
          </div>
          <div className="mt-6 flex items-center justify-center">
            <ResponsiveContainer width="100%" height={160}>
              <PieChart>
                <Pie
                  data={[
                    { name: 'Used', value: analytics.budget_progress.used },
                    { name: 'Remaining', value: Math.max(analytics.budget_progress.remaining, 0) },
                  ]}
                  innerRadius={50}
                  outerRadius={70}
                  paddingAngle={3}
                  dataKey="value"
                >
                  <Cell fill="var(--accent)" />
                  <Cell fill="#2f333a" />
                </Pie>
                <Tooltip
                  formatter={(value: number) => [formatCurrency(value), '']}
                  contentStyle={{ background: 'var(--surface-light)', border: `1px solid var(--border)`, color: 'var(--text-primary)' }}
                />
              </PieChart>
            </ResponsiveContainer>
          </div>
          <div className="mt-4 text-sm text-[var(--text-secondary)] flex justify-between">
            <span>Used: {formatCurrency(analytics.budget_progress.used)}</span>
            <span>Left: {formatCurrency(analytics.budget_progress.remaining)}</span>
          </div>
        </div>
      </div>

      <div className="grid gap-6 xl:grid-cols-3">
        <div className="xl:col-span-2 bg-[var(--surface)] rounded-2xl shadow-[var(--shadow-card)] border border-[var(--border)] p-6">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className="text-lg font-semibold text-[var(--text-primary)]">Scheduled vs Worked Hours</h3>
              <p className="text-sm text-[var(--text-secondary)]">Past 14 days</p>
            </div>
          </div>
          {analytics.productivity_trend.length > 0 ? (
            <ResponsiveContainer width="100%" height={260}>
              <AreaChart data={analytics.productivity_trend}>
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.08)" />
                <XAxis dataKey="date" tickFormatter={formatDateLabel} tick={{ fontSize: 11, fill: 'var(--text-secondary)' }} />
                <YAxis tick={{ fontSize: 11, fill: 'var(--text-secondary)' }} />
                <Tooltip
                  formatter={(value: number) => [`${value.toFixed(1)} hrs`, '']}
                  labelFormatter={formatDateLabel}
                  contentStyle={{ background: 'var(--surface-light)', border: `1px solid var(--border)`, color: 'var(--text-primary)' }}
                  cursor={{ fill: 'rgba(255,255,255,0.04)' }}
                />
                <Legend wrapperStyle={{ color: 'var(--text-secondary)' }} />
                <Area
                  type="monotone"
                  dataKey="scheduled_hours"
                  stackId="1"
                  stroke="rgba(59,130,246,0.35)"
                  fill="rgba(59,130,246,0.15)"
                  name="Scheduled"
                />
                <Area
                  type="monotone"
                  dataKey="worked_hours"
                  stackId="1"
                  stroke="var(--accent)"
                  fill="rgba(59,130,246,0.3)"
                  name="Worked"
                />
                <Area
                  type="monotone"
                  dataKey="overtime_hours"
                  stackId="1"
                  stroke="#fbbf24"
                  fill="rgba(251,191,36,0.3)"
                  name="Overtime"
                />
              </AreaChart>
            </ResponsiveContainer>
          ) : (
            <EmptyState message="No productivity data available" />
          )}
        </div>

        <div className="bg-[var(--surface)] rounded-2xl shadow-[var(--shadow-card)] border border-[var(--border)] p-6 flex flex-col items-center justify-center">
          <h3 className="text-lg font-semibold text-[var(--text-primary)] mb-6">Utilization</h3>
          <UtilizationGauge value={analytics.utilization.percentage} trend={analytics.utilization.trend} />
        </div>
      </div>

      <div className="grid gap-6 xl:grid-cols-2">
        <PaymentsStatusChart data={analytics.payments_status} />
        <div className="bg-[var(--surface)] rounded-2xl shadow-[var(--shadow-card)] border border-[var(--border)] p-6">
          <h3 className="text-lg font-semibold text-[var(--text-primary)] mb-4">Recent Activity</h3>
          <div className="space-y-3 max-h-[280px] overflow-y-auto pr-1">
            {activities.length > 0 ? (
              activities.map((activity, index) => (
                <div
                  key={`${activity.timestamp}-${index}`}
                  className="flex items-start gap-3 pb-3 border-b border-[var(--border)] last:border-0"
                >
                  <div
                    className={`w-2 h-2 rounded-full mt-2 flex-shrink-0 ${
                      activity.type === 'clock_in'
                        ? 'bg-emerald-500'
                        : activity.type === 'clock_out'
                        ? 'bg-blue-500'
                        : 'bg-amber-500'
                    }`}
                  />
                  <div className="flex-1 min-w-0">
                    <p className="text-sm text-[var(--text-primary)]">{activity.message}</p>
                    <p className="text-xs text-[var(--text-secondary)] mt-1">{formatTimestamp(activity.timestamp)}</p>
                  </div>
                </div>
              ))
            ) : (
              <EmptyState message="No recent activity" />
            )}
          </div>
        </div>
      </div>

      <div className="grid gap-6 xl:grid-cols-1">
        <div className="bg-[var(--surface)] rounded-2xl shadow-[var(--shadow-card)] border border-[var(--border)] p-6">
          <h3 className="text-lg font-semibold text-[var(--text-primary)] mb-4">Attendance Overview (This Month)</h3>
          {analytics.attendance_overview.length > 0 ? (
            <ResponsiveContainer width="100%" height={260}>
              <BarChart data={analytics.attendance_overview}>
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.08)" />
                <XAxis dataKey="date" tickFormatter={formatDateLabel} tick={{ fontSize: 11, fill: 'var(--text-secondary)' }} />
                <YAxis tick={{ fontSize: 11, fill: 'var(--text-secondary)' }} />
                <Tooltip
                  labelFormatter={formatDateLabel}
                  formatter={(value: number) => [`${value} check-ins`, 'Attendance']}
                  contentStyle={{ background: 'var(--surface-light)', border: `1px solid var(--border)`, color: 'var(--text-primary)' }}
                  cursor={{ fill: 'rgba(255,255,255,0.04)' }}
                />
                <Bar dataKey="count" fill="#10b981" radius={[6, 6, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          ) : (
            <EmptyState message="No attendance records yet" />
          )}
        </div>
      </div>
    </div>
  )
}

function EmptyState({ message }: { message: string }) {
  return <p className="text-sm text-[var(--text-secondary)] text-center py-12">{message}</p>
}

function UtilizationGauge({ value, trend }: { value: number; trend: number }) {
  const clampedValue = Math.min(Math.max(value, 0), 150)
  const rotation = Math.min(clampedValue, 100) * 3.6

  return (
    <div className="flex flex-col items-center gap-3">
      <div className="relative h-32 w-32">
        <div className="absolute inset-0 rounded-full bg-[var(--surface-light)]" />
        <div
          className="absolute inset-0 rounded-full"
          style={{
            background: `conic-gradient(var(--accent) ${rotation}deg, #2f333a 0deg)`,
          }}
        />
        <div className="absolute inset-4 rounded-full bg-[var(--surface)] flex flex-col items-center justify-center border border-[var(--border)]">
          <span className="text-2xl font-bold text-[var(--text-primary)]">{Math.round(value)}%</span>
          <span className="text-xs text-[var(--text-secondary)]">Last 7 days</span>
        </div>
      </div>
      <p className={`text-sm font-semibold ${trend >= 0 ? 'text-emerald-600' : 'text-rose-600'}`}>
        {trend >= 0 ? '+' : ''}
        {numberFormatter.format(trend)}% vs last week
      </p>
    </div>
  )
}

function PaymentsStatusChart({ data }: { data: PaymentStatus[] }) {
  return (
    <div className="bg-[var(--surface)] rounded-2xl shadow-[var(--shadow-card)] border border-[var(--border)] p-6">
      <h3 className="text-lg font-semibold text-[var(--text-primary)] mb-4">Payments by Status</h3>
      {data.length > 0 ? (
        <ResponsiveContainer width="100%" height={240}>
          <BarChart data={data}>
            <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.08)" />
            <XAxis dataKey="status" tick={{ fontSize: 12, fill: 'var(--text-secondary)' }} />
            <YAxis tickFormatter={(value: number) => `$${(value / 1000).toFixed(0)}k`} tick={{ fontSize: 11, fill: 'var(--text-secondary)' }} />
            <Tooltip
              formatter={(value: number) => [formatCurrency(value), '']}
              contentStyle={{ background: 'var(--surface-light)', border: `1px solid var(--border)`, color: 'var(--text-primary)' }}
              cursor={{ fill: 'rgba(255,255,255,0.04)' }}
            />
            <Bar dataKey="amount" fill="var(--accent)" radius={[6, 6, 0, 0]} />
          </BarChart>
        </ResponsiveContainer>
      ) : (
        <EmptyState message="No payroll data yet" />
      )}
    </div>
  )
}

