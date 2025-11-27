import { Pressable, StyleSheet, Text, View } from 'react-native'
import { colors } from '../theme/colors'

type DataPoint = {
  label: string
  net: number
  deductions: number
}

type Props = {
  data: DataPoint[]
  maxValue: number
  rangeLabel?: string
  onPressFilter?: () => void
}

export default function PayByPeriodChart({ data, maxValue, rangeLabel = 'Date range', onPressFilter }: Props) {
  const legend = [
    { label: 'Net Pay', color: colors.accent },
    { label: 'Deductions', color: colors.error },
  ]

  return (
    <View style={styles.card}>
      <Pressable style={styles.dropdown} onPress={onPressFilter}>
        <Text style={styles.dropdownText}>{rangeLabel}</Text>
      </Pressable>
      <View style={styles.chartRow}>
        {data.map((point, index) => {
          const netHeight = maxValue === 0 ? 0 : (point.net / maxValue) * 160
          const dedHeight = maxValue === 0 ? 0 : (point.deductions / maxValue) * 160
          const totalHeight = Math.max(netHeight + dedHeight, 8)
          const netRatio = totalHeight === 0 ? 0 : netHeight / (netHeight + dedHeight || 1)
          const dedRatio = totalHeight === 0 ? 0 : dedHeight / (netHeight + dedHeight || 1)
          return (
            <View key={`${point.label}-${index}`} style={styles.barContainer}>
              <Text style={styles.barValue}>CA${(point.net + point.deductions).toFixed(0)}</Text>
              <View style={[styles.barStack, { height: Math.max(totalHeight, 8) }]}>
                <View style={[styles.barSegmentNet, { flex: netRatio || 0 }]} />
                {dedHeight > 0 && <View style={[styles.barSegmentDed, { flex: dedRatio || 0 }]} />}
              </View>
              <Text style={styles.barLabel}>{point.label}</Text>
            </View>
          )
        })}
      </View>

      <View style={styles.legendRow}>
        {legend.map((item) => (
          <View key={item.label} style={styles.legendItem}>
            <View style={[styles.legendDot, { backgroundColor: item.color }]} />
            <Text style={styles.legendLabel}>{item.label}</Text>
          </View>
        ))}
      </View>
    </View>
  )
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: colors.surface,
    borderRadius: 20,
    padding: 18,
    marginTop: 20,
    borderWidth: 1,
    borderColor: colors.border,
    shadowColor: 'rgba(0,0,0,0.5)',
    shadowOpacity: 0.26,
    shadowRadius: 14,
    shadowOffset: { width: 0, height: 8 },
    elevation: 8,
  },
  dropdown: {
    alignSelf: 'flex-end',
    borderWidth: 1,
    borderColor: colors.border,
    paddingVertical: 6,
    paddingHorizontal: 12,
    borderRadius: 14,
    marginBottom: 16,
    backgroundColor: colors.surfaceLight,
  },
  dropdownText: {
    fontSize: 13,
    fontWeight: '600',
    color: colors.textPrimary,
  },
  chartRow: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    justifyContent: 'space-between',
    gap: 12,
    minHeight: 180,
  },
  barContainer: {
    alignItems: 'center',
    flex: 1,
  },
  barStack: {
    width: 26,
    borderRadius: 8,
    overflow: 'hidden',
    backgroundColor: colors.surfaceLight,
    flexDirection: 'column',
  },
  barSegmentNet: {
    backgroundColor: colors.accent,
  },
  barSegmentDed: {
    backgroundColor: colors.error,
  },
  barLabel: {
    marginTop: 6,
    fontSize: 12,
    color: colors.textSecondary,
    fontWeight: '600',
  },
  barValue: {
    fontSize: 11,
    color: colors.textPrimary,
    marginBottom: 6,
    fontWeight: '700',
  },
  legendRow: {
    flexDirection: 'row',
    gap: 16,
    marginTop: 16,
  },
  legendItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  legendDot: {
    width: 10,
    height: 10,
    borderRadius: 999,
  },
  legendLabel: {
    fontSize: 12,
    color: colors.textSecondary,
  },
})
