
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Cell,
} from 'recharts';
import { PayrollResponse } from '../../services/payroll';

interface PayChartsProps {
  payrolls: PayrollResponse[];
}

export default function PayCharts({ payrolls }: PayChartsProps) {
  // Sort payrolls by date ascending for the chart
  const sortedPayrolls = [...payrolls].sort(
    (a, b) => new Date(a.period_end).getTime() - new Date(b.period_end).getTime()
  );

  const data = sortedPayrolls.map((p) => ({
    name: new Date(p.period_end).toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
    amount: p.gross_pay,
    hours: p.total_hours,
  }));

  const totalYTD = payrolls.reduce((sum, p) => sum + p.gross_pay, 0);
  const averagePay = payrolls.length > 0 ? totalYTD / payrolls.length : 0;

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="bg-[var(--surface)] p-6 rounded-xl shadow-[var(--shadow-card)] border border-[var(--border)]">
          <p className="text-sm text-[var(--text-secondary)] mb-1">Year to Date (YTD)</p>
          <p className="text-3xl font-bold text-[var(--text-primary)]">${totalYTD.toFixed(2)}</p>
        </div>
        <div className="bg-[var(--surface)] p-6 rounded-xl shadow-[var(--shadow-card)] border border-[var(--border)]">
          <p className="text-sm text-[var(--text-secondary)] mb-1">Average Pay / Period</p>
          <p className="text-3xl font-bold text-[var(--text-primary)]">${averagePay.toFixed(2)}</p>
        </div>
      </div>

      <div className="bg-[var(--surface)] p-6 rounded-xl shadow-[var(--shadow-card)] border border-[var(--border)]">
        <h3 className="text-lg font-semibold text-[var(--text-primary)] mb-6">Pay History</h3>
        <div className="h-[300px] w-full">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={data} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="rgba(255,255,255,0.08)" />
              <XAxis 
                dataKey="name" 
                axisLine={false} 
                tickLine={false} 
                tick={{ fill: 'var(--text-secondary)', fontSize: 12 }} 
                dy={10}
              />
              <YAxis 
                axisLine={false} 
                tickLine={false} 
                tick={{ fill: 'var(--text-secondary)', fontSize: 12 }}
                tickFormatter={(value) => `$${value}`}
              />
              <Tooltip 
                cursor={{ fill: 'rgba(255,255,255,0.04)' }}
                contentStyle={{ borderRadius: '8px', border: `1px solid var(--border)`, background: 'var(--surface-light)', color: 'var(--text-primary)', boxShadow: 'var(--shadow-card)' }}
              />
              <Bar dataKey="amount" radius={[4, 4, 0, 0]}>
                {data.map((_, index) => (
                  <Cell key={`cell-${index}`} fill="var(--accent)" />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>
    </div>
  );
}
