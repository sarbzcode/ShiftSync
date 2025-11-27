import { Routes, Route } from 'react-router-dom'
import Navbar from '../components/Navbar'
import Sidebar from '../components/Sidebar'
import DashboardHome from './DashboardHome'
import PayrollPending from './PayrollPending'
import PayrollApproved from './PayrollApproved'
import EmployeeManagement from './EmployeeManagement'
import ShiftScheduling from './ShiftScheduling'
import AttendanceLogs from './AttendanceLogs'
import SettingsPage from './Settings'
import Adjustments from './Adjustments'

export default function Dashboard() {
  return (
    <div className="flex h-screen bg-[var(--bg)] text-[var(--text-primary)] overflow-hidden">
      <Sidebar />
      
      <div className="flex flex-1 flex-col overflow-hidden">
        <Navbar />
        
        <main className="flex-1 overflow-y-auto">
          <Routes>
            <Route index element={<DashboardHome />} />
            <Route path="employees" element={<EmployeeManagement />} />
            <Route path="shifts" element={<ShiftScheduling />} />
            <Route path="attendance" element={<AttendanceLogs />} />
            <Route path="adjustments" element={<Adjustments />} />
            <Route path="payroll" element={<PayrollPending />} />
            <Route path="payroll/approved" element={<PayrollApproved />} />
            <Route path="settings" element={<SettingsPage />} />
          </Routes>
        </main>
      </div>
    </div>
  )
}
