import { LogOut, User } from 'lucide-react'
import { useAuth } from '../context/AuthContext'

export default function Navbar() {
  const { user, logout } = useAuth()

  return (
    <nav className="bg-[var(--bg-secondary)] border-b border-[var(--border)] px-6 py-4 shadow-[var(--shadow-card)]">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <h1 className="text-xl font-semibold text-[var(--text-primary)]">
            {user?.role === 'admin' ? 'Admin Dashboard' : 'My Workspace'}
          </h1>
        </div>
        
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-2 text-[var(--text-primary)]">
            <User className="w-5 h-5 text-[var(--text-secondary)]" />
            <div className="text-sm">
              <div className="font-medium">{user?.name}</div>
              <div className="text-[var(--text-secondary)] text-xs capitalize">{user?.role}</div>
            </div>
          </div>
          
          <button
            onClick={logout}
            className="flex items-center gap-2 px-4 py-2 text-sm text-white bg-blue-600 hover:bg-blue-700 rounded-lg transition-all hover:shadow-[0_0_0_2px_rgba(59,130,246,0.35)]"
            data-testid="logout-button"
          >
            <LogOut className="w-4 h-4" />
            Logout
          </button>
        </div>
      </div>
    </nav>
  )
}
