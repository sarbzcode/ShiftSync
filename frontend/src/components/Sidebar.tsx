import { 
  LayoutDashboard, 
  Users, 
  Calendar, 
  ClipboardList, 
  DollarSign, 
  CheckCircle,
  Settings,
  Percent
} from 'lucide-react'
import { NavLink } from 'react-router-dom'
import Logo from './Logo'

const primaryMenu = [
  { icon: LayoutDashboard, label: 'Dashboard', path: '/dashboard', end: true },
  { icon: Users, label: 'Employee Management', path: '/dashboard/employees', end: true },
  { icon: Calendar, label: 'Shift Scheduling', path: '/dashboard/shifts', end: true },
  { icon: ClipboardList, label: 'Attendance Logs', path: '/dashboard/attendance', end: true },
  { icon: Percent, label: 'Adjustments', path: '/dashboard/adjustments', end: true },
  { icon: DollarSign, label: 'Payroll Reports', path: '/dashboard/payroll', end: true },
  { icon: CheckCircle, label: 'Approved Payrolls', path: '/dashboard/payroll/approved', end: true },
]

const settingsItem = { icon: Settings, label: 'Settings', path: '/dashboard/settings' }

export default function Sidebar() {
  const linkClasses = (isActive: boolean) =>
    `flex items-center gap-3 px-4 py-3 rounded-lg transition-colors ${
      isActive
        ? 'bg-[var(--accent-bg)] text-[var(--accent)] font-medium'
        : 'text-[var(--text-secondary)] hover:bg-[#1A1F25]'
    }`

  return (
    <aside className="flex h-screen w-64 flex-col border-r border-[var(--border)] bg-[var(--bg-secondary)] shadow-[var(--shadow-card)]">
      <div className="p-6">
        <Logo />
      </div>

      <nav className="flex-1 px-3 space-y-1 overflow-y-auto">
        {primaryMenu.map((item) => (
          <NavLink
            key={item.path}
            to={item.path}
            end={item.end}
            className={({ isActive }) => linkClasses(isActive)}
            data-testid={`sidebar-${item.label.toLowerCase().replace(/\s+/g, '-')}`}
          >
            <item.icon className="h-5 w-5 text-[var(--text-secondary)]" />
            <span className="text-sm">{item.label}</span>
          </NavLink>
        ))}
      </nav>

      <div className="px-3 pb-6 pt-2 border-t border-[var(--border)]">
        <NavLink
          to={settingsItem.path}
          className={({ isActive }) => linkClasses(isActive)}
          data-testid="sidebar-settings"
        >
          <settingsItem.icon className="h-5 w-5 text-[var(--text-secondary)]" />
          <span className="text-sm">{settingsItem.label}</span>
        </NavLink>
      </div>
    </aside>
  )
}
