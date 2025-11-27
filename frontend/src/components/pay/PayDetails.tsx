
import { PayrollResponse } from '../../services/payroll';
import { Clock, DollarSign, Calendar, Download } from 'lucide-react';

interface PayDetailsProps {
  payroll: PayrollResponse;
}

export default function PayDetails({ payroll }: PayDetailsProps) {
  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    });
  };

  return (
    <div className="bg-[var(--surface)] rounded-xl shadow-[var(--shadow-card)] border border-[var(--border)] p-6">
      <div className="flex items-center justify-between mb-8">
        <div>
          <h2 className="text-2xl font-bold text-[var(--text-primary)]">Pay Details</h2>
          <p className="text-[var(--text-secondary)]">
            {formatDate(payroll.period_end)}
          </p>
        </div>
        <button className="flex items-center gap-2 px-4 py-2 bg-[var(--surface-light)] text-[var(--text-primary)] rounded-lg hover:bg-[#1f242c] border border-[var(--border)] transition-colors">
          <Download className="w-4 h-4 text-[var(--text-secondary)]" />
          <span>Download Slip</span>
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
        <div className="p-4 bg-[rgba(16,185,129,0.12)] rounded-xl border border-[rgba(16,185,129,0.35)]">
          <div className="flex items-center gap-3 mb-2">
            <div className="p-2 bg-[rgba(16,185,129,0.25)] text-emerald-300 rounded-lg">
              <DollarSign className="w-5 h-5" />
            </div>
            <span className="text-sm font-medium text-emerald-200">Gross Pay</span>
          </div>
          <p className="text-2xl font-bold text-emerald-100">
            ${payroll.gross_pay.toFixed(2)}
          </p>
        </div>

        <div className="p-4 bg-[var(--accent-bg)] rounded-xl border border-[rgba(59,130,246,0.35)]">
          <div className="flex items-center gap-3 mb-2">
            <div className="p-2 bg-[rgba(59,130,246,0.25)] text-blue-300 rounded-lg">
              <Clock className="w-5 h-5" />
            </div>
            <span className="text-sm font-medium text-blue-100">Total Hours</span>
          </div>
          <p className="text-2xl font-bold text-blue-100">
            {payroll.total_hours.toFixed(1)}h
          </p>
        </div>

        <div className="p-4 bg-[rgba(109,40,217,0.15)] rounded-xl border border-[rgba(109,40,217,0.35)]">
          <div className="flex items-center gap-3 mb-2">
            <div className="p-2 bg-[rgba(109,40,217,0.25)] text-purple-200 rounded-lg">
              <Calendar className="w-5 h-5" />
            </div>
            <span className="text-sm font-medium text-purple-100">Pay Period</span>
          </div>
          <p className="text-sm font-semibold text-purple-100">
            {new Date(payroll.period_start).toLocaleDateString()} - {new Date(payroll.period_end).toLocaleDateString()}
          </p>
        </div>
      </div>

      <div className="space-y-6">
        <div>
          <h3 className="text-lg font-semibold text-[var(--text-primary)] mb-4">Earnings</h3>
          <div className="bg-[var(--surface-light)] rounded-lg border border-[var(--border)] overflow-hidden">
            <div className="flex justify-between p-4 border-b border-[var(--border)]">
              <span className="text-[var(--text-secondary)]">Regular Pay</span>
              <span className="font-medium text-[var(--text-primary)]">${payroll.gross_pay.toFixed(2)}</span>
            </div>
            <div className="flex justify-between p-4 bg-[rgba(255,255,255,0.02)]">
              <span className="font-semibold text-[var(--text-primary)]">Total Gross Pay</span>
              <span className="font-bold text-[var(--text-primary)]">${payroll.gross_pay.toFixed(2)}</span>
            </div>
          </div>
        </div>

        <div>
          <h3 className="text-lg font-semibold text-[var(--text-primary)] mb-4">Deductions</h3>
          <div className="bg-[var(--surface-light)] rounded-lg border border-[var(--border)] overflow-hidden">
            <div className="p-4 text-center text-[var(--text-secondary)] italic">
              No deductions recorded for this period.
            </div>
          </div>
        </div>

        <div className="flex justify-between items-center p-6 bg-[#111418] text-white rounded-xl border border-[var(--border)]">
          <div>
            <p className="text-[var(--text-secondary)] text-sm mb-1">Net Pay</p>
            <p className="text-3xl font-bold">${payroll.gross_pay.toFixed(2)}</p>
          </div>
          <div className="text-right">
            <p className="text-[var(--text-secondary)] text-sm">Status</p>
            <p className="font-medium uppercase tracking-wider text-green-400">{payroll.status}</p>
          </div>
        </div>
      </div>
    </div>
  );
}
