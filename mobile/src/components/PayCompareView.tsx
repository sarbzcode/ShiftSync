import { StyleSheet, Text, View } from 'react-native'
import { Feather } from '@expo/vector-icons'
import { colors } from '../theme/colors'

type Props = {
  statement1: string
  statement2: string
  changeLabel: string
  changeAmount: string
  bars: Array<{
    label: string
    amount: string
    height: number
  }>
}

export default function PayCompareView({ statement1, statement2, changeLabel, changeAmount, bars }: Props) {
  return (
    <View style={styles.container}>
      <View style={styles.dropdownRow}>
        {[statement1, statement2].map((label) => (
          <View key={label} style={styles.dropdown}>
            <Text style={styles.dropdownLabel}>{label}</Text>
            <Feather name="chevron-down" size={16} color={colors.textMuted} />
          </View>
        ))}
      </View>

      <View style={styles.card}>
        <View style={styles.headerRow}>
          <Text style={styles.title}>{changeLabel}</Text>
          <Text style={styles.changeAmount}>{changeAmount}</Text>
        </View>

        <View style={styles.chartRow}>
          {bars.map((bar) => (
            <View key={bar.label} style={styles.barContainer}>
              <View style={[styles.bar, { height: Math.max(bar.height, 8) }]} />
              <Text style={styles.barAmount}>{bar.amount}</Text>
              <Text style={styles.barLabel}>{bar.label}</Text>
            </View>
          ))}
        </View>
      </View>
    </View>
  )
}

const styles = StyleSheet.create({
  container: {
    marginBottom: 24,
    gap: 12,
  },
  dropdownRow: {
    flexDirection: 'row',
    gap: 12,
  },
  dropdown: {
    flex: 1,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: colors.border,
    padding: 12,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: colors.surfaceLight,
  },
  dropdownLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: colors.textPrimary,
  },
  card: {
    backgroundColor: colors.surface,
    borderRadius: 20,
    padding: 18,
    shadowColor: 'rgba(0,0,0,0.5)',
    shadowOpacity: 0.26,
    shadowRadius: 16,
    shadowOffset: { width: 0, height: 10 },
    elevation: 10,
    borderWidth: 1,
    borderColor: colors.border,
  },
  headerRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  title: {
    fontSize: 16,
    fontWeight: '700',
    color: colors.textPrimary,
  },
  changeAmount: {
    fontSize: 14,
    fontWeight: '600',
    color: colors.accent,
  },
  chartRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-end',
    gap: 12,
  },
  barContainer: {
    flex: 1,
    alignItems: 'center',
    gap: 6,
  },
  bar: {
    width: 28,
    borderRadius: 8,
    backgroundColor: colors.success,
    alignSelf: 'center',
  },
  barAmount: {
    fontSize: 13,
    fontWeight: '600',
    color: colors.textPrimary,
  },
  barLabel: {
    fontSize: 12,
    color: colors.textSecondary,
  },
})
