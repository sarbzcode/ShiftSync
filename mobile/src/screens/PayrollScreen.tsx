import { useState, useMemo } from 'react'
import { ScrollView, StyleSheet, Text, View, RefreshControl, ActivityIndicator, Modal, Pressable, TextInput } from 'react-native'
import { LinearGradient } from 'expo-linear-gradient'
import { useNavigation } from '@react-navigation/native'
import { NativeStackNavigationProp } from '@react-navigation/native-stack'
import PayTabs from '../components/PayTabs'
import DonutChartCard from '../components/DonutChartCard'
import StatementList from '../components/StatementList'
import PayByPeriodChart from '../components/PayByPeriodChart'
import usePayroll from '../hooks/usePayroll'
import { PayStackParamList } from '../navigation/types'
import { PayrollResponse } from '../types/api'
import { colors } from '../theme/colors'

export default function PayrollScreen() {
  const [activeTab, setActiveTab] = useState<'details' | 'ytd'>('details')
  const { payrolls, loading, refresh } = usePayroll()
  const navigation = useNavigation<NativeStackNavigationProp<PayStackParamList>>()
  const today = new Date()
  const defaultFrom = new Date(today.getFullYear(), today.getMonth(), 1).toISOString().slice(0, 10)
  const defaultTo = new Date(today.getFullYear(), today.getMonth() + 1, 0).toISOString().slice(0, 10)
  const [fromDate, setFromDate] = useState(defaultFrom)
  const [toDate, setToDate] = useState(defaultTo)
  const [rangeModalVisible, setRangeModalVisible] = useState(false)
  const [yearPickerVisible, setYearPickerVisible] = useState(false)
  const currentYear = new Date().getFullYear()
  const [selectedYear, setSelectedYear] = useState(currentYear.toString())

  const formatDateSafe = (value: string, fallback = 'N/A') => {
    const d = new Date(value)
    if (Number.isNaN(d.getTime())) {
      return fallback
    }
    return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })
  }

  // Calculate stats from real data
  const stats = useMemo(() => {
    if (!payrolls.length) return null

    // Most recent pay period (for Details tab)
    const latest = payrolls[0]
    
    // YTD totals
    const yearNumber = Number(selectedYear) || currentYear
    const ytdPayrolls = payrolls.filter(p => new Date(p.period_end).getFullYear() === yearNumber)
    const ytdGross = ytdPayrolls.reduce((sum, p) => sum + p.gross_pay, 0)
    const ytdNet = ytdPayrolls.reduce((sum, p) => sum + (p.net_pay ?? p.gross_pay), 0)
    const ytdHours = ytdPayrolls.reduce((sum, p) => sum + p.total_hours, 0)
    const ytdPeriodStart = ytdPayrolls.length
      ? ytdPayrolls.reduce(
          (min, p) => (new Date(p.period_start) < new Date(min) ? p.period_start : min),
          ytdPayrolls[0].period_start
        )
      : undefined
    const ytdPeriodEnd = ytdPayrolls.length
      ? ytdPayrolls.reduce(
          (max, p) => (new Date(p.period_end) > new Date(max) ? p.period_end : max),
          ytdPayrolls[0].period_end
        )
      : undefined

    return {
      latest,
      ytdGross,
      ytdNet,
      ytdHours,
      ytdPeriodStart,
      ytdPeriodEnd,
    }
  }, [payrolls, selectedYear])

  const latestNet = stats?.latest ? `CA$${(stats.latest.net_pay ?? stats.latest.gross_pay).toFixed(2)}` : 'CA$0.00'
  const ytdNetStr = stats ? `CA$${stats.ytdNet.toFixed(2)}` : 'CA$0.00'
  const ytdGrossStr = stats ? `CA$${stats.ytdGross.toFixed(2)}` : 'CA$0.00'
  const ytdHoursStr = stats ? `${stats.ytdHours.toFixed(2)}h` : '0h'
  const ytdDeductionsValue = stats ? Math.max(stats.ytdGross - stats.ytdNet, 0) : 0
  const ytdPeriodLabel =
    stats?.ytdPeriodStart && stats?.ytdPeriodEnd
      ? `${formatDateSafe(stats.ytdPeriodStart)} - ${formatDateSafe(stats.ytdPeriodEnd)}`
      : `Jan 1 - Dec 31, ${selectedYear}`

  const ytdAdjustmentBreakdown = useMemo(() => {
    const yearNumber = Number(selectedYear) || currentYear
    const ytdPayrolls = payrolls.filter((p) => new Date(p.period_end).getFullYear() === yearNumber)
    const aggregate: Record<string, { name: string; amount: number }> = {}
    ytdPayrolls.forEach((p) => {
      (p.adjustments || []).forEach((adj) => {
        const sign = adj.direction === 'add' ? 1 : -1
        if (!aggregate[adj.name]) aggregate[adj.name] = { name: adj.name, amount: 0 }
        aggregate[adj.name].amount += sign * adj.amount_applied
      })
    })
    return Object.values(aggregate)
  }, [payrolls, selectedYear, currentYear])
  const latestPeriod = stats?.latest
    ? `${formatDateSafe(stats.latest.period_start)} - ${formatDateSafe(stats.latest.period_end)}`
    : 'No pay period yet'

  const tabData = {
    details: {
      net: latestNet,
    },
    ytd: {
      net: ytdNetStr,
    },
  }

  const parseDate = (value: string) => {
    const d = new Date(value)
    return Number.isNaN(d.getTime()) ? null : d
  }

  const filteredPayrolls = useMemo(() => {
    const start = parseDate(fromDate)
    const end = parseDate(toDate)
    return payrolls.filter((p) => {
      const endDate = new Date(p.period_end)
      if (Number.isNaN(endDate.getTime())) {
        return false
      }
      if (start && end && end < start) return false
      if (start && endDate < start) return false
      if (end && endDate > end) return false
      return true
    })
  }, [payrolls, fromDate, toDate])

  const filteredStatements = useMemo(
    () =>
      filteredPayrolls.map((p) => ({
        id: p.id,
        date: formatDateSafe(p.period_end),
        gross: `CA$${p.gross_pay.toFixed(2)}`,
        net: `CA$${(p.net_pay ?? p.gross_pay).toFixed(2)}`,
        hours: p.total_hours,
      })),
    [filteredPayrolls]
  )

  const filteredChart = useMemo(
    () =>
      filteredPayrolls
        .map((p) => ({
          label: formatDateSafe(p.period_end, 'N/A').split(' ')[0] ?? 'N/A',
          net: p.net_pay ?? p.gross_pay,
          deductions: Math.max((p.gross_pay ?? 0) - (p.net_pay ?? p.gross_pay), 0),
        }))
        .reverse(),
    [filteredPayrolls]
  )

  const isInitialLoading = loading && !payrolls.length

  const handleOpenDetails = (payroll?: PayrollResponse) => {
    if (activeTab === 'ytd' && stats) {
      const adjustmentsForYear = ytdAdjustmentBreakdown.map((adj) => ({
        name: adj.name,
        amount: Math.abs(adj.amount),
        direction: adj.amount >= 0 ? 'add' : 'deduct' as const,
      }))
      navigation.navigate('PayDetail', {
        mode: 'ytd',
        year: selectedYear,
        summary: {
          periodLabel: ytdPeriodLabel,
          hours: stats.ytdHours,
          gross: stats.ytdGross,
          net: stats.ytdNet,
          adjustments: adjustmentsForYear,
        },
      })
      return
    }
    let target: PayrollResponse | null = payroll ?? null

    if (!target && stats) {
      target = stats.latest ?? null
    }

    if (!target) return
    navigation.navigate('PayDetail', {
      id: target.id,
    })
  }

  if (isInitialLoading) {
    return (
      <View style={[styles.screen, styles.center]}>
        <ActivityIndicator size="large" color={colors.accent} />
      </View>
    )
  }

  return (
    <ScrollView 
      style={styles.screen} 
      contentContainerStyle={styles.content}
      refreshControl={
        <RefreshControl refreshing={loading} onRefresh={refresh} tintColor={colors.accent} colors={[colors.accent]} />
      }
    >
      <View style={styles.headerRow}>
        <Text style={styles.pageTitle}>Pay</Text>
      </View>

      {stats?.latest && (
        <LinearGradient
          colors={[colors.accent, colors.backgroundSecondary]}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={styles.heroCard}
        >
          <View style={styles.heroLeft}>
            <Text style={styles.heroLabel}>Latest net pay</Text>
            <Text style={styles.heroValue}>{latestNet}</Text>
            <Text style={styles.heroMeta}>{latestPeriod} - {stats.latest.total_hours}h</Text>
          </View>
        </LinearGradient>
      )}

      <PayTabs
        tabs={[
          { key: 'details', label: 'Details' },
          { key: 'ytd', label: 'YTD' },
        ]}
        selected={activeTab}
        onSelect={(key) => setActiveTab(key as 'details' | 'ytd')}
      />

      {activeTab === 'ytd' && (
        <View style={styles.sectionHeader}>
          <Text style={styles.sectionLabel}>Year to date</Text>
          <Pressable style={styles.dropdownGroove} onPress={() => setYearPickerVisible(true)}>
            <Text style={styles.dropdownValue}>{selectedYear}</Text>
          </Pressable>
        </View>
      )}

      <DonutChartCard
        netLabel={activeTab === 'details' ? 'Net Pay' : 'YTD Net Pay'}
        netAmount={tabData[activeTab].net}
        buttonLabel="View details"
        onPressButton={() => handleOpenDetails()}
      />

      {activeTab === 'details' && !stats?.latest && (
        <View style={styles.section}>
          <Text style={styles.subtleText}>No pay records found.</Text>
        </View>
      )}

      {activeTab === 'details' && (
        <>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionLabel}>Statements</Text>
            <Pressable style={styles.dropdownGroove} onPress={() => setRangeModalVisible(true)}>
              <Text style={styles.dropdownValue}>{`${fromDate} - ${toDate}`}</Text>
            </Pressable>
          </View>
          <StatementList
            statements={filteredStatements}
            onPress={(statement) => {
              const match = payrolls.find((p) => p.id === statement.id)
              handleOpenDetails(match)
            }}
          />
        </>
      )}

      <View style={styles.sectionHeader}>
        <Text style={styles.sectionLabel}>Pay by Period</Text>
      </View>
      <PayByPeriodChart 
        data={filteredChart} 
        maxValue={filteredChart.reduce((max, p) => Math.max(max, p.net + p.deductions), 0) * 1.2 || 2000} 
        rangeLabel={`${fromDate} - ${toDate}`}
        onPressFilter={() => setRangeModalVisible(true)}
      />

      <Modal visible={rangeModalVisible} transparent animationType="fade">
        <View style={styles.modalOverlay}>
          <View style={styles.modalCard}>
            <Text style={styles.modalTitle}>Select date range</Text>
            <View style={styles.modalRow}>
              <Text style={styles.modalLabel}>From</Text>
              <TextInput
                style={styles.modalInput}
                value={fromDate}
                onChangeText={setFromDate}
                placeholder="YYYY-MM-DD"
                placeholderTextColor={colors.textMuted}
              />
            </View>
            <View style={styles.modalRow}>
              <Text style={styles.modalLabel}>To</Text>
              <TextInput
                style={styles.modalInput}
                value={toDate}
                onChangeText={setToDate}
                placeholder="YYYY-MM-DD"
                placeholderTextColor={colors.textMuted}
              />
            </View>
            <View style={styles.modalActions}>
              <Pressable style={[styles.modalButton, styles.modalButtonGhost]} onPress={() => setRangeModalVisible(false)}>
                <Text style={styles.modalButtonTextGhost}>Cancel</Text>
              </Pressable>
              <Pressable style={[styles.modalButton, styles.modalButtonPrimary]} onPress={() => setRangeModalVisible(false)}>
                <Text style={styles.modalButtonTextPrimary}>Apply</Text>
              </Pressable>
            </View>
          </View>
        </View>
      </Modal>

      <Modal visible={yearPickerVisible} transparent animationType="fade">
        <View style={styles.modalOverlay}>
          <View style={styles.modalCard}>
            <Text style={styles.modalTitle}>Select year</Text>
            <View style={styles.modalRow}>
              <Text style={styles.modalLabel}>Year</Text>
              <TextInput
                style={styles.modalInput}
                keyboardType="number-pad"
                value={selectedYear}
                onChangeText={setSelectedYear}
                placeholder={`${currentYear}`}
                placeholderTextColor={colors.textMuted}
              />
            </View>
            <View style={styles.modalActions}>
              <Pressable style={[styles.modalButton, styles.modalButtonGhost]} onPress={() => setYearPickerVisible(false)}>
                <Text style={styles.modalButtonTextGhost}>Cancel</Text>
              </Pressable>
              <Pressable
                style={[styles.modalButton, styles.modalButtonPrimary]}
                onPress={() => setYearPickerVisible(false)}
              >
                <Text style={styles.modalButtonTextPrimary}>Apply</Text>
              </Pressable>
            </View>
          </View>
        </View>
      </Modal>
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
  center: {
    justifyContent: 'center',
    alignItems: 'center',
  },
  content: {
    padding: 20,
    gap: 18,
  },
  headerRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  pageTitle: {
    fontSize: 28,
    fontWeight: '800',
    color: colors.textPrimary,
  },
  heroCard: {
    backgroundColor: colors.accent,
    borderRadius: 20,
    padding: 18,
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 10,
    marginBottom: 6,
    shadowColor: 'rgba(0,0,0,0.5)',
    shadowOpacity: 0.32,
    shadowRadius: 18,
    shadowOffset: { width: 0, height: 10 },
    elevation: 10,
    borderWidth: 1,
    borderColor: colors.border,
  },
  heroLeft: {
    gap: 4,
    maxWidth: '100%',
    alignItems: 'center',
  },
  heroLabel: {
    color: colors.textPrimary,
    fontSize: 13,
    letterSpacing: 0.4,
    textTransform: 'uppercase',
    fontWeight: '700',
  },
  heroValue: {
    color: colors.textPrimary,
    fontSize: 28,
    fontWeight: '800',
    textAlign: 'center',
  },
  heroMeta: {
    color: colors.textSecondary,
    fontSize: 13,
    fontWeight: '600',
    textAlign: 'center',
  },
  section: {
    marginTop: 8,
  },
  sectionLabel: {
    fontSize: 16,
    fontWeight: '700',
    color: colors.textPrimary,
    marginBottom: 12,
  },
  subtleText: {
    fontSize: 13,
    color: colors.textSecondary,
    marginBottom: 4,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 12,
  },
  dropdownGroove: {
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 14,
    paddingVertical: 6,
    paddingHorizontal: 12,
    backgroundColor: colors.surfaceLight,
  },
  dropdownValue: {
    fontSize: 12,
    fontWeight: '600',
    color: colors.textPrimary,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.65)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  modalCard: {
    width: '100%',
    backgroundColor: colors.surface,
    borderRadius: 16,
    padding: 18,
    borderWidth: 1,
    borderColor: colors.border,
    gap: 12,
    shadowColor: 'rgba(0,0,0,0.5)',
    shadowOpacity: 0.28,
    shadowRadius: 16,
    shadowOffset: { width: 0, height: 10 },
    elevation: 10,
  },
  modalTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: colors.textPrimary,
  },
  modalSubTitle: {
    fontSize: 13,
    fontWeight: '600',
    color: colors.textSecondary,
    marginBottom: 8,
  },
  breakdownCard: {
    gap: 10,
  },
  breakdownHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  chartWrapper: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  modalRow: {
    gap: 6,
  },
  modalLabel: {
    fontSize: 12,
    fontWeight: '600',
    color: colors.textSecondary,
  },
  modalValue: {
    fontSize: 14,
    fontWeight: '700',
    color: colors.textPrimary,
  },
  modalInput: {
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 10,
    paddingHorizontal: 10,
    paddingVertical: 8,
    fontSize: 14,
    color: colors.textPrimary,
    backgroundColor: colors.surfaceLight,
  },
  modalActions: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    gap: 10,
    marginTop: 6,
  },
  modalButton: {
    borderRadius: 10,
    paddingHorizontal: 14,
    paddingVertical: 10,
  },
  modalButtonGhost: {
    backgroundColor: colors.surfaceLight,
    borderWidth: 1,
    borderColor: colors.border,
  },
  modalButtonPrimary: {
    backgroundColor: colors.accent,
  },
  modalButtonTextGhost: {
    color: colors.textPrimary,
    fontWeight: '700',
  },
  modalButtonTextPrimary: {
    color: colors.textPrimary,
    fontWeight: '700',
  },
})
