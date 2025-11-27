import { Loader2 } from 'lucide-react'

interface LoadingOverlayProps {
  message?: string
}

export default function LoadingOverlay({ message = 'Loading...' }: LoadingOverlayProps) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-[rgba(13,15,18,0.7)] backdrop-blur-sm">
      <div className="flex items-center gap-3 rounded-xl border border-[var(--border)] bg-[var(--surface)] px-4 py-3 shadow-[var(--shadow-card)]">
        <Loader2 className="h-5 w-5 animate-spin text-blue-600" />
        <span className="text-sm font-medium text-[var(--text-primary)]">{message}</span>
      </div>
    </div>
  )
}
