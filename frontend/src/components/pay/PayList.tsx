
import { PayrollResponse } from '../../services/payroll';
import { Calendar, ChevronRight } from 'lucide-react';

interface PayListProps {
  payrolls: PayrollResponse[];
  onSelect: (payroll: PayrollResponse) => void;
  selectedId?: string;
}

export default function PayList({ payrolls, onSelect, selectedId }: PayListProps) {
  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    });
  };

  return (
    <div className="bg-[var(--surface)] rounded-xl shadow-[var(--shadow-card)] border border-[var(--border)] overflow-hidden">
      <div className="p-4 border-b border-[var(--border)] bg-[var(--surface-light)]">
        <h3 className="font-semibold text-[var(--text-primary)]">Pay History</h3>
      </div>
      <div className="divide-y divide-[var(--border)] max-h-[600px] overflow-y-auto">
        {payrolls.length === 0 ? (
          <div className="p-8 text-center text-[var(--text-secondary)]">
            No pay records found.
          </div>
        ) : (
          payrolls.map((payroll) => (
            <button
              key={payroll.id}
              onClick={() => onSelect(payroll)}
              className={`w-full flex items-center justify-between p-4 hover:bg-[#1f242c] transition-colors text-left ${
                selectedId === payroll.id ? 'bg-[var(--accent-bg)] hover:bg-[var(--accent-bg)]' : ''
              }`}
            >
              <div className="flex items-center gap-4">
                <div className={`p-2 rounded-lg ${selectedId === payroll.id ? 'bg-[rgba(59,130,246,0.18)] text-[var(--accent)]' : 'bg-[var(--surface-light)] text-[var(--text-secondary)]'}`}>
                  <Calendar className="w-5 h-5" />
                </div>
                <div>
                  <p className="font-medium text-[var(--text-primary)]">
                    {formatDate(payroll.period_end)}
                  </p>
                  <p className="text-sm text-[var(--text-secondary)]">
                    {formatDate(payroll.period_start)} - {formatDate(payroll.period_end)}
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-3">
                <div className="text-right">
                  <p className="font-semibold text-[var(--text-primary)]">
                    ${payroll.gross_pay.toFixed(2)}
                  </p>
                  <p className="text-xs text-[var(--text-secondary)] uppercase tracking-wider">
                    {payroll.status}
                  </p>
                </div>
                <ChevronRight className="w-5 h-5 text-[var(--text-secondary)]" />
              </div>
            </button>
          ))
        )}
      </div>
    </div>
  );
}
