import { Text, View } from 'react-native'
import { PayrollResponse } from '../types/api'
import { formatPayrollRange } from '../utils/dateFormatters'
import { colors } from '../theme/colors'

export default function PayrollCard({ payroll }: { payroll: PayrollResponse }) {
  return (
    <View
      style={{
        borderRadius: 16,
        borderWidth: 1,
        borderColor: colors.border,
        padding: 16,
        marginBottom: 12,
        backgroundColor: colors.surface,
        shadowColor: 'rgba(0,0,0,0.5)',
        shadowOpacity: 0.22,
        shadowRadius: 12,
        shadowOffset: { width: 0, height: 8 },
        elevation: 8,
      }}
    >
      <Text style={{ fontWeight: '700', fontSize: 16, marginBottom: 4, color: colors.textPrimary }}>
        {formatPayrollRange(payroll.period_start, payroll.period_end)}
      </Text>
      <Text style={{ color: colors.textSecondary, marginBottom: 8 }}>
        {payroll.total_hours} hours
      </Text>
      <Text style={{ fontSize: 18, fontWeight: '800', color: colors.accent }}>
        ${payroll.gross_pay.toFixed(2)}
      </Text>
    </View>
  )
}
