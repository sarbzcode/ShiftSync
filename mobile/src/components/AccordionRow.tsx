import { useState } from 'react'
import { Pressable, StyleSheet, Text, View } from 'react-native'
import { Feather } from '@expo/vector-icons'
import { colors } from '../theme/colors'

type Props = {
  label: string
  amount: string
  children?: React.ReactNode
}

export default function AccordionRow({ label, amount, children }: Props) {
  const [expanded, setExpanded] = useState(false)
  return (
    <View style={styles.card}>
      <Pressable style={styles.row} onPress={() => setExpanded((prev) => !prev)}>
        <View>
          <Text style={styles.label}>{label}</Text>
          {expanded && children ? <Text style={styles.subText}>{children}</Text> : null}
        </View>
        <View style={styles.amountRow}>
          <Text style={styles.amount}>{amount}</Text>
          <Feather name={expanded ? 'chevron-up' : 'chevron-down'} size={18} color={colors.textMuted} />
        </View>
      </Pressable>
    </View>
  )
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: colors.surface,
    borderRadius: 16,
    paddingHorizontal: 18,
    paddingVertical: 14,
    marginBottom: 12,
    shadowColor: 'rgba(0,0,0,0.5)',
    shadowOpacity: 0.22,
    shadowRadius: 12,
    shadowOffset: { width: 0, height: 8 },
    elevation: 8,
    borderWidth: 1,
    borderColor: colors.border,
  },
  row: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    gap: 12,
  },
  label: {
    fontSize: 15,
    fontWeight: '600',
    color: colors.textPrimary,
  },
  subText: {
    fontSize: 12,
    color: colors.textSecondary,
    marginTop: 4,
  },
  amountRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  amount: {
    fontSize: 16,
    fontWeight: '700',
    color: colors.textPrimary,
  },
})
