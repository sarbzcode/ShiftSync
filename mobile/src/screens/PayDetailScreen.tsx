import { useEffect, useState } from 'react'
import { ScrollView, StyleSheet, Text, View, Pressable, ActivityIndicator } from 'react-native'
import { Feather } from '@expo/vector-icons'
import { RouteProp, useNavigation, useRoute } from '@react-navigation/native'
import { NativeStackNavigationProp } from '@react-navigation/native-stack'
import { PayStackParamList } from '../navigation/types'
import DonutChart from '../components/DonutChart'
import { getMyPayDetail } from '../services/api'
import { PayrollResponse } from '../types/api'
import { colors } from '../theme/colors'

type PayDetailRoute = RouteProp<PayStackParamList, 'PayDetail'>

export default function PayDetailScreen() {
  const navigation = useNavigation<NativeStackNavigationProp<PayStackParamList>>()
  const { params } = useRoute<PayDetailRoute>()
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  type DisplayDetail = {
    periodLabel: string
    hours: number
    gross: number
    net: number
    adjustments: { name: string; direction: 'add' | 'deduct'; amount: number }[]
  }
  const [detail, setDetail] = useState<DisplayDetail | null>(null)

  useEffect(() => {
    const load = async () => {
      setLoading(true)
      setError('')
      const mode = params.mode ?? 'single'
      if (mode === 'ytd') {
        if (!params.summary) {
          setError('No YTD summary provided.')
          setLoading(false)
          return
        }
        const summary = params.summary
        setDetail({
          periodLabel: summary.periodLabel,
          hours: summary.hours,
          gross: summary.gross,
          net: summary.net,
          adjustments: summary.adjustments.map((a) => ({
            name: a.name,
            direction: a.direction,
            amount: a.amount,
          })),
        })
        setLoading(false)
        return
      }

      try {
        const payDetail = await getMyPayDetail(params.id || '')
        const periodLabel = `${new Date(payDetail.period_start).toLocaleDateString()} - ${new Date(
          payDetail.period_end
        ).toLocaleDateString()}`
        setDetail({
          periodLabel,
          hours: payDetail.total_hours,
          gross: payDetail.gross_pay,
          net: payDetail.net_pay ?? payDetail.gross_pay,
          adjustments: (payDetail.adjustments || []).map((adj) => ({
            name: adj.name,
            direction: adj.direction,
            amount: adj.amount_applied,
          })),
        })
      } catch (err: any) {
        setError(err.response?.data?.detail || 'Unable to load pay details.')
      } finally {
        setLoading(false)
      }
    }
    load()
  }, [params.id, params.mode, params.summary])

  if (loading) {
    return (
      <View style={[styles.screen, styles.center]}>
        <ActivityIndicator size="large" color={colors.accent} />
      </View>
    )
  }

  if (!detail || error) {
    return (
      <View style={[styles.screen, styles.center]}>
        <Text style={styles.errorText}>{error || 'Pay record not found.'}</Text>
      </View>
    )
  }

  const netPay = detail.net
  const deductions = detail.adjustments.filter((adj) => adj.direction === 'deduct')
  const adds = detail.adjustments.filter((adj) => adj.direction === 'add')
  const deductionsTotal = deductions.reduce((sum, d) => sum + d.amount, 0)
  const addsTotal = adds.reduce((sum, a) => sum + a.amount, 0)

  const palette = [
    colors.accent,
    colors.error,
    colors.success,
    colors.textSecondary,
    colors.textMuted,
    colors.accent,
  ]
  const slices: { value: number; color: string; label?: string }[] = []
  if (netPay > 0) {
    slices.push({ value: netPay, color: palette[0], label: 'Net pay' })
  }
  deductions.forEach((d, idx) => {
    slices.push({ value: d.amount, color: palette[(idx + 1) % palette.length], label: d.name })
  })

  return (
    <ScrollView style={styles.screen} contentContainerStyle={styles.content}>
      <View style={styles.headerRow}>
        <Pressable style={styles.backButton} onPress={() => navigation.goBack()}>
          <Feather name="arrow-left" size={20} color={colors.textPrimary} />
        </Pressable>
        <View style={styles.headerTitles}>
          <Text style={styles.pageTitle}>Pay</Text>
          <Text style={styles.subTitle}>{detail.periodLabel}</Text>
        </View>
      </View>

      <View style={styles.card}>
        <Text style={styles.sectionTitle}>Payment Breakdown</Text>
        <View style={styles.chartRow}>
          <View style={styles.chartWrapper}>
            <DonutChart slices={slices} variant="pie" size={150} />
          </View>
          <View style={styles.legend}>
            {slices.map((slice, idx) => (
              <View key={`${slice.label ?? idx}`} style={styles.legendItem}>
                <View style={[styles.legendDot, { backgroundColor: slice.color }]} />
                <Text style={styles.legendLabel}>{slice.label ?? 'Adjustment'}</Text>
              </View>
            ))}
          </View>
        </View>
        <View style={styles.grossRow}>
          <Text style={styles.grossLabel}>Net Pay</Text>
          <Text style={styles.grossValue}>${netPay.toFixed(2)}</Text>
        </View>
        <Text style={styles.hoursText}>{detail.hours.toFixed(2)} hours worked</Text>

        <View style={styles.detailList}>
          <DetailRow label="Pay period" value={detail.periodLabel} />
          <DetailRow label="Hours worked" value={`${detail.hours.toFixed(2)}h`} />
          <DetailRow label="Gross pay" value={`$${detail.gross.toFixed(2)}`} />
          {deductionsTotal > 0 && <DetailRow label="Deductions" value={`-$${deductionsTotal.toFixed(2)}`} />}
          {addsTotal > 0 && <DetailRow label="Adjustments" value={`+$${addsTotal.toFixed(2)}`} />}
          <DetailRow label="Net pay" value={`$${netPay.toFixed(2)}`} />
        </View>

        {deductions.length > 0 && (
          <View style={styles.deductionsBox}>
            <Text style={styles.deductionsTitle}>Deductions detail</Text>
            {deductions.map((d, idx) => (
              <View key={`${d.name}-${idx}`} style={styles.detailRow}>
                <Text style={styles.detailLabel}>{d.name}</Text>
                <Text style={[styles.detailValue, { color: colors.error }]}>-${d.amount.toFixed(2)}</Text>
              </View>
            ))}
          </View>
        )}
      </View>
    </ScrollView>
  )
}

function DetailRow({ label, value }: { label: string; value: string }) {
  return (
    <View style={styles.detailRow}>
      <Text style={styles.detailLabel}>{label}</Text>
      <Text style={styles.detailValue}>{value}</Text>
    </View>
  )
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: colors.background,
  },
  content: {
    padding: 20,
    gap: 16,
  },
  center: {
    justifyContent: 'center',
    alignItems: 'center',
  },
  errorText: {
    color: colors.error,
    fontSize: 14,
    fontWeight: '700',
  },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  backButton: {
    width: 40,
    height: 40,
    borderRadius: 12,
    backgroundColor: colors.surfaceLight,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: colors.border,
    shadowColor: 'rgba(0,0,0,0.5)',
    shadowOpacity: 0.28,
    shadowRadius: 12,
    shadowOffset: { width: 0, height: 6 },
    elevation: 8,
  },
  headerTitles: {
    gap: 2,
  },
  pageTitle: {
    fontSize: 24,
    fontWeight: '800',
    color: colors.textPrimary,
  },
  subTitle: {
    fontSize: 13,
    fontWeight: '600',
    color: colors.textSecondary,
  },
  card: {
    backgroundColor: colors.surface,
    borderRadius: 20,
    padding: 18,
    borderWidth: 1,
    borderColor: colors.border,
    shadowColor: 'rgba(0,0,0,0.5)',
    shadowOpacity: 0.26,
    shadowRadius: 14,
    shadowOffset: { width: 0, height: 8 },
    elevation: 10,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: colors.textPrimary,
    marginBottom: 12,
  },
  chartWrapper: {
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 16,
  },
  chartRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 16,
  },
  legend: {
    gap: 8,
    flex: 1,
  },
  legendItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  legendDot: {
    width: 12,
    height: 12,
    borderRadius: 6,
  },
  legendLabel: {
    fontSize: 13,
    fontWeight: '600',
    color: colors.textSecondary,
  },
  grossRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 6,
  },
  grossLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: colors.textSecondary,
  },
  grossValue: {
    fontSize: 24,
    fontWeight: '800',
    color: colors.accent,
  },
  hoursText: {
    fontSize: 13,
    fontWeight: '600',
    color: colors.textSecondary,
  },
  detailList: {
    marginTop: 12,
    borderTopWidth: 1,
    borderTopColor: colors.border,
    paddingTop: 12,
    gap: 10,
  },
  detailRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  detailLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: colors.textSecondary,
  },
  detailValue: {
    fontSize: 14,
    fontWeight: '700',
    color: colors.textPrimary,
  },
  deductionsBox: {
    marginTop: 12,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: colors.border,
    gap: 8,
  },
  deductionsTitle: {
    fontSize: 13,
    fontWeight: '700',
    color: colors.textPrimary,
  },
})
