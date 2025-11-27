import { StyleSheet, Text, View, Pressable } from 'react-native'
import { colors } from '../theme/colors'

type Props = {
  netLabel: string
  netAmount: string
  buttonLabel: string
  onPressButton?: () => void
}

export default function DonutChartCard({
  netLabel,
  netAmount,
  buttonLabel,
  onPressButton,
}: Props) {
  return (
    <View style={styles.card}>
      <View style={styles.contentRow}>
        <View style={styles.summary}>
          <Text style={styles.summaryLabel}>{netLabel}</Text>
          <Text style={styles.summaryValue}>{netAmount}</Text>
          <Pressable style={styles.button} onPress={onPressButton}>
            <Text style={styles.buttonText}>{buttonLabel}</Text>
          </Pressable>
        </View>
      </View>
    </View>
  )
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: colors.surface,
    borderRadius: 24,
    padding: 20,
    marginBottom: 20,
    borderWidth: 1,
    borderColor: colors.border,
    shadowColor: 'rgba(0,0,0,0.5)',
    shadowOpacity: 0.26,
    shadowOffset: { width: 0, height: 8 },
    shadowRadius: 14,
    elevation: 8,
  },
  contentRow: {
    flexDirection: 'column',
    alignItems: 'center',
    gap: 16,
    justifyContent: 'center',
  },
  summary: {
    gap: 6,
    alignItems: 'center',
    justifyContent: 'center',
  },
  summaryLabel: {
    fontSize: 15,
    fontWeight: '700',
    color: colors.textPrimary,
    textAlign: 'center',
  },
  summaryValue: {
    fontSize: 30,
    fontWeight: '800',
    color: colors.accent,
    marginVertical: 4,
    textAlign: 'center',
  },
  button: {
    borderRadius: 999,
    paddingVertical: 10,
    paddingHorizontal: 18,
    alignSelf: 'center',
    alignItems: 'center',
    backgroundColor: colors.accent,
    shadowColor: 'rgba(0,0,0,0.5)',
    shadowOpacity: 0.28,
    shadowRadius: 12,
    shadowOffset: { width: 0, height: 8 },
    elevation: 8,
  },
  buttonText: {
    color: colors.textPrimary,
    fontWeight: '700',
    fontSize: 14,
    letterSpacing: 0.2,
  },
})
