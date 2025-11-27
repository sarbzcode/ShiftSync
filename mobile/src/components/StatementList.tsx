import { Pressable, StyleSheet, Text, View } from 'react-native'
import { colors } from '../theme/colors'

type Statement = {
  id: string
  date: string
  gross: string
  net: string
  hours: number
}

type Props = {
  statements: Statement[]
  onPress?: (statement: Statement) => void
}

export default function StatementList({ statements, onPress }: Props) {
  return (
    <View style={styles.container}>
      {statements.map((statement, index) => (
        <Pressable
          key={statement.id}
          style={[styles.row, index !== statements.length - 1 && styles.rowSpacing]}
          onPress={() => onPress?.(statement)}
        >
          <View>
            <Text style={styles.rowDate}>{statement.date}</Text>
            <Text style={styles.rowSubtext}>Hours worked {statement.hours.toFixed(2)}h</Text>
          </View>
          <View style={styles.netPill}>
            <Text style={styles.net}>{statement.net}</Text>
          </View>
        </Pressable>
      ))}
    </View>
  )
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: colors.surface,
    borderRadius: 20,
    padding: 18,
    gap: 12,
    borderWidth: 1,
    borderColor: colors.border,
    shadowColor: 'rgba(0,0,0,0.5)',
    shadowOpacity: 0.24,
    shadowRadius: 14,
    shadowOffset: { width: 0, height: 8 },
    elevation: 8,
  },
  row: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  rowSpacing: {
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: colors.border,
    paddingBottom: 12,
  },
  rowDate: {
    fontSize: 15,
    fontWeight: '600',
    color: colors.textPrimary,
  },
  rowSubtext: {
    fontSize: 12,
    color: colors.textSecondary,
    marginTop: 2,
  },
  netPill: {
    backgroundColor: colors.accentSoft,
    borderRadius: 12,
    paddingHorizontal: 12,
    paddingVertical: 6,
  },
  net: {
    fontSize: 16,
    fontWeight: '700',
    color: colors.accent,
  },
})
