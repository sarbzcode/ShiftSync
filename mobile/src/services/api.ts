import axios from 'axios'
import AsyncStorage from '@react-native-async-storage/async-storage'
import { LoginResponse, AttendanceSummary, ShiftResponse, PayrollResponse, UserProfile } from '../types/api'

const API_URL = process.env.EXPO_PUBLIC_API_URL || 'http://localhost:8000'

const api = axios.create({
  baseURL: API_URL,
  headers: { 'Content-Type': 'application/json' },
})

api.interceptors.request.use(async (config) => {
  const token = await AsyncStorage.getItem('access_token')
  if (token) {
    config.headers = config.headers ?? {}
    config.headers.Authorization = `Bearer ${token}`
  }
  return config
})

const unauthorizedListeners: Array<() => void> = []

export const onUnauthorized = (listener: () => void) => {
  unauthorizedListeners.push(listener)
}

api.interceptors.response.use(
  (response) => response,
  async (error) => {
    if (error.response?.status === 401) {
      await AsyncStorage.multiRemove(['access_token', 'user'])
      unauthorizedListeners.forEach((listener) => listener())
    }
    return Promise.reject(error)
  }
)

export const login = (username: string, password: string) =>
  api.post<LoginResponse>('/auth/login', { username, password }).then((res) => res.data)

export const getAttendanceSummary = () =>
  api.get<AttendanceSummary>('/attendance/summary').then((res) => res.data)

export const clockIn = () => api.post('/attendance/start')
export const clockOut = () => api.post('/attendance/end')

export const getMySchedule = () =>
  api.get<ShiftResponse[]>('/schedule/my').then((res) => res.data)

type PayRecordApi = {
  id: string
  user_id: string
  employee_name: string
  week_start: string
  week_end: string
  hours_worked: number
  amount: number
  gross_amount?: number
  adjustments?: Array<{
    name: string
    direction: 'add' | 'deduct'
    amount_applied: number
  }>
  status: 'approved' | 'pending' | 'held'
  approved_by?: string
  created_at: string
}

export const getMyPayroll = () =>
  api.get<PayRecordApi[]>('/pay/my').then((res) =>
    res.data
      .filter((record) => record.status === 'approved')
      .map(
        (record) =>
          ({
            id: record.id,
            period_start: record.week_start,
            period_end: record.week_end,
            total_hours: record.hours_worked,
            gross_pay: record.gross_amount ?? record.amount,
            net_pay: record.amount,
            adjustments: record.adjustments ?? [],
            status: record.status,
            created_at: record.created_at,
          }) satisfies PayrollResponse
      )
  )

export const getMyPayDetail = (id: string) =>
  api.get<PayRecordApi>(`/pay/my/${id}`).then((res) => ({
    id: res.data.id,
    period_start: res.data.week_start,
    period_end: res.data.week_end,
    total_hours: res.data.hours_worked,
    gross_pay: res.data.gross_amount ?? res.data.amount,
    net_pay: res.data.amount,
    adjustments: res.data.adjustments ?? [],
    status: res.data.status as 'approved',
    created_at: res.data.created_at,
  }))

export const getMyProfile = () =>
  api.get<UserProfile>('/users/me').then((res) => res.data)

export default api
