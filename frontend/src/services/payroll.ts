import api from '../lib/api';

export interface PayrollResponse {
  id: string;
  user_id: string;
  user_name: string;
  period_start: string;
  period_end: string;
  total_hours: number;
  gross_pay: number;
  status: 'pending' | 'approved' | 'held';
  approved_by?: string;
  created_at: string;
}

interface PayRecordApi {
  id: string;
  user_id: string;
  employee_name: string;
  week_start: string;
  week_end: string;
  hours_worked: number;
  amount: number;
  status: 'pending' | 'approved' | 'held';
  approved_by?: string;
  created_at: string;
}

export const getMyPayroll = async (): Promise<PayrollResponse[]> => {
  const response = await api.get<PayRecordApi[]>('/pay/my');
  return response.data
    .filter((record) => record.status === 'approved')
    .map((record) => ({
      id: record.id,
      user_id: record.user_id,
      user_name: record.employee_name,
      period_start: record.week_start,
      period_end: record.week_end,
      total_hours: record.hours_worked,
      gross_pay: record.amount,
      status: record.status,
      approved_by: record.approved_by,
      created_at: record.created_at,
    }));
};
