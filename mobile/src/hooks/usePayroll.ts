import { useEffect, useState } from 'react'
import { PayrollResponse } from '../types/api'
import { getMyPayroll } from '../services/api'

export default function usePayroll() {
  const [payrolls, setPayrolls] = useState<PayrollResponse[]>([])
  const [loading, setLoading] = useState(true)

  const fetchPayrolls = async () => {
    setLoading(true)
    try {
      const data = await getMyPayroll()
      setPayrolls(
        data.sort(
          (a, b) => new Date(b.period_end).getTime() - new Date(a.period_end).getTime()
        )
      )
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchPayrolls()
  }, [])

  return { payrolls, loading, refresh: fetchPayrolls }
}
