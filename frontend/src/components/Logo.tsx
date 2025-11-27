import { Calendar } from 'lucide-react'

export default function Logo({ className = "" }: { className?: string }) {
  return (
    <div className={`flex items-center gap-2 ${className}`}>
      <div className="bg-gradient-to-br from-blue-500 to-blue-600 p-2 rounded-lg shadow-md">
        <Calendar className="w-6 h-6 text-white" />
      </div>
      <span className="text-2xl font-bold bg-gradient-to-r from-blue-600 to-blue-700 bg-clip-text text-transparent">
        ShiftSync
      </span>
    </div>
  )
}
