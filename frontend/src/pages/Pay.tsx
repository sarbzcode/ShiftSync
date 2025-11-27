import { useEffect, useState } from 'react';
import { getMyPayroll, PayrollResponse } from '../services/payroll';
import PayList from '../components/pay/PayList';
import PayDetails from '../components/pay/PayDetails';
import PayCharts from '../components/pay/PayCharts';

export default function Pay() {
  const [payrolls, setPayrolls] = useState<PayrollResponse[]>([]);
  const [selectedPayroll, setSelectedPayroll] = useState<PayrollResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchPayroll = async () => {
      try {
        const data = await getMyPayroll();
        setPayrolls(data);
        if (data.length > 0) {
          // Select the most recent one by default
          const sorted = [...data].sort((a, b) => 
            new Date(b.period_end).getTime() - new Date(a.period_end).getTime()
          );
          setSelectedPayroll(sorted[0]);
        }
      } catch (err) {
        console.error('Failed to fetch payroll:', err);
        setError('Failed to load payroll data. Please try again later.');
      } finally {
        setLoading(false);
      }
    };

    fetchPayroll();
  }, []);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-8 text-center">
        <p className="text-red-600 mb-4">{error}</p>
        <button 
          onClick={() => window.location.reload()}
          className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
        >
          Retry
        </button>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-slate-900">My Pay</h1>
        <p className="text-slate-500 mt-1">View your pay stubs and earnings history</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        {/* Left Column: List and Charts */}
        <div className="lg:col-span-5 space-y-8">
          <PayCharts payrolls={payrolls} />
          <PayList 
            payrolls={payrolls} 
            onSelect={setSelectedPayroll} 
            selectedId={selectedPayroll?.id}
          />
        </div>

        {/* Right Column: Details */}
        <div className="lg:col-span-7">
          {selectedPayroll ? (
            <PayDetails payroll={selectedPayroll} />
          ) : (
            <div className="bg-slate-50 rounded-xl border border-slate-200 p-12 text-center text-slate-500">
              Select a pay period to view details
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
