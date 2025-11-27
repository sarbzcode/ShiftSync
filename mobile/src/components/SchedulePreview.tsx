import { Text, TouchableOpacity, View, StyleSheet, useWindowDimensions } from 'react-native'
import { Feather } from '@expo/vector-icons'
import { ShiftResponse } from '../types/api'
import { formatDateLabel } from '../utils/dateFormatters'
import { colors } from '../theme/colors'

type Props = {
  upcoming: ShiftResponse[]
}

const getStatusColor = (status: ShiftResponse['status']) =>
  status === 'completed' ? colors.border : colors.accent

export default function SchedulePreview({ upcoming }: Props) {
  const { width } = useWindowDimensions()

  return (
    <View style={styles.card}>
      <View style={styles.cardHeader}>
        <View>
          <Text style={styles.title}>Upcoming schedule</Text>
          <Text style={styles.subtitle}>Stay ready for the next shift</Text>
        </View>
      </View>
      {upcoming.length === 0 ? (
        <Text style={styles.emptyState}>No upcoming shifts.</Text>
      ) : (
        upcoming.map((shift) => {
          const indicatorColor = getStatusColor(shift.status)
          return (
            <View key={shift.id} style={styles.shiftRow}>
              <View style={[styles.shiftIndicator, { backgroundColor: indicatorColor }]} />
              <View style={styles.shiftCopy}>
                <View style={styles.shiftLine}>
                  <Feather name="calendar" size={16} color={colors.accent} />
                  <Text style={styles.shiftDate}>{formatDateLabel(shift.shift_date, 'EEEE, MMM d')}</Text>
                </View>
                <View style={styles.shiftLine}>
                  <Feather name="clock" size={16} color={colors.textSecondary} />
                  <Text style={styles.shiftTime}>{shift.start_time} - {shift.end_time}</Text>
                </View>
              </View>
              <Text style={[styles.shiftStatus, shift.status === 'completed' && styles.shiftStatusCompleted]}>
                {shift.status === 'completed' ? 'Completed' : 'Upcoming'}
              </Text>
            </View>
          )
        })
      )}
    </View>
  )
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: colors.surface,
    borderRadius: 20,
    padding: 22,
    shadowColor: 'rgba(0,0,0,0.5)',
    shadowOpacity: 0.26,
    shadowRadius: 14,
    shadowOffset: { width: 0, height: 8 },
    elevation: 8,
    gap: 14,
    borderWidth: 1,
    borderColor: colors.border,
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    gap: 12,
    marginBottom: 6,
  },
  title: {
    fontSize: 18,
    fontWeight: '700',
    color: colors.textPrimary,
  },
  subtitle: {
    color: colors.textSecondary,
    fontSize: 13,
  },
  viewAllButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  viewAllText: {
    color: colors.accent,
    fontWeight: '600',
    textDecorationLine: 'underline',
  },
  emptyState: {
    color: colors.textMuted,
  },
  shiftRow: {
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: 18,
    borderWidth: 1,
    borderColor: colors.border,
    padding: 16,
    gap: 12,
    backgroundColor: colors.surfaceLight,
  },
  shiftIndicator: {
    width: 6,
    borderRadius: 999,
    alignSelf: 'stretch',
  },
  shiftCopy: {
    flex: 1,
    gap: 6,
  },
  shiftLine: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  shiftDate: {
    fontWeight: '600',
    fontSize: 15,
    color: colors.textPrimary,
  },
  shiftTime: {
    color: colors.textSecondary,
    fontSize: 14,
    fontWeight: '500',
  },
  shiftStatus: {
    fontWeight: '600',
    color: colors.accent,
  },
  shiftStatusCompleted: {
    color: colors.textMuted,
  },
})
