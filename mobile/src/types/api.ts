export type LoginResponse = {
  access_token: string
  token_type: string
  user_id: string
  username: string
  name: string
  email: string
  role: string
}

export type User = {
  id: string
  username: string
  name: string
  email: string
  role: string
  pay_rate?: number
  department?: string
}

export type AttendanceRecord = {
  id: string
  user_id: string
  clock_in: string
  clock_out: string | null
  hours_worked: number | null
  date: string
}

export type AttendanceSummary = {
  total_hours_today: number
  total_hours_week: number
  records: AttendanceRecord[]
}

export type ShiftResponse = {
  id: string
  employee_id: string
  shift_date: string
  start_time: string
  end_time: string
  status: string
}

export type PayrollResponse = {
  id: string
  period_start: string
  period_end: string
  total_hours: number
  gross_pay: number
  net_pay?: number
  adjustments?: Array<{
    name: string
    direction: 'add' | 'deduct'
    amount_applied: number
  }>
  status: 'approved' | 'pending' | 'held'
  created_at: string
}

export type UserProfile = {
  id: string
  name: string
  email: string
  username: string
  role: string
  pay_rate?: number
  department?: string
}
