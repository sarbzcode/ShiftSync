import { LucideIcon } from 'lucide-react'

interface StatCardProps {
  title: string
  value: string | number
  icon: LucideIcon
  iconColor?: string
}

export default function StatCard({ 
  title, 
  value, 
  icon: Icon, 
  iconColor = 'text-blue-600' 
}: StatCardProps) {
  return (
    <div className="bg-[var(--surface)] rounded-xl shadow-[var(--shadow-card)] border border-[var(--border)] p-6 transition-shadow hover:shadow-[0_4px_12px_rgba(0,0,0,0.45)]">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-sm text-[var(--text-secondary)] mb-1">{title}</p>
          <p className="text-3xl font-bold text-[var(--text-primary)]">{value}</p>
        </div>
        <div className="p-3 rounded-lg bg-[var(--accent-bg)]">
          <Icon className={`w-8 h-8 ${iconColor}`} />
        </div>
      </div>
    </div>
  )
}
