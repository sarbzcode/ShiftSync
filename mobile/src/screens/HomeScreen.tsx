import { useMemo } from 'react'
import { ScrollView, StyleSheet, Text, View } from 'react-native'
import { useAuth } from '../context/AuthContext'
import useAttendance from '../hooks/useAttendance'
import useSchedule from '../hooks/useSchedule'
import StatusCard from '../components/StatusCard'
import SchedulePreview from '../components/SchedulePreview'
import type { AttendanceRecord } from '../types/api'
import { formatDateTimeLabel } from '../utils/dateFormatters'
import { colors } from '../theme/colors'

export default function HomeScreen({ navigation }: any) {
  const { user } = useAuth()
  const { summary, mutating, isClockedIn, clockIn, clockOut, error, refresh } = useAttendance()
  const { upcoming } = useSchedule()
  const upcomingActive = (upcoming || []).filter((shift) => shift.status !== 'completed')

  const { statusDetailLabel, statusDetailValue } = useMemo(() => {
    const activeRecord = summary?.records.find((record) => !record.clock_out)
    const completedRecords = (summary?.records ?? []).filter(
      (record): record is AttendanceRecord & { clock_out: string } => Boolean(record.clock_out)
    )
    completedRecords.sort((a, b) => new Date(b.clock_out).getTime() - new Date(a.clock_out).getTime())
    const lastClockedOut = completedRecords[0]

    if (isClockedIn) {
      return {
        statusDetailLabel: 'Clocked in at',
        statusDetailValue: activeRecord?.clock_in
          ? formatDateTimeLabel(activeRecord.clock_in)
          : 'Pending...',
      }
    }

    return {
      statusDetailLabel: 'Last clocked out',
      statusDetailValue: lastClockedOut?.clock_out
        ? formatDateTimeLabel(lastClockedOut.clock_out)
        : 'No clock-out yet',
    }
  }, [isClockedIn, summary])

  return (
    <ScrollView style={styles.screen} contentContainerStyle={styles.content}>
      {error ? (
        <View style={styles.errorCard}>
          <Text style={styles.errorText}>{error}</Text>
          <Text
            style={styles.retryLink}
            onPress={() => {
              refresh().catch(() => null)
            }}
          >
            Try again
          </Text>
        </View>
      ) : null}
      <View style={styles.welcomeRow}>
        <View>
          <Text style={styles.welcomeTitle}>Welcome back</Text>
          <Text style={styles.welcomeName}>{user?.name ?? 'Team member'}</Text>
        </View>
      </View>
      <StatusCard
        name={user?.name ?? ''}
        isClockedIn={isClockedIn}
        statusDetailLabel={statusDetailLabel}
        statusDetailValue={statusDetailValue}
        loading={mutating}
        onToggle={isClockedIn ? clockOut : clockIn}
      />
      <SchedulePreview
        upcoming={upcomingActive}
      />
    </ScrollView>
  )
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: colors.background,
  },
  content: {
    paddingHorizontal: 20,
    paddingBottom: 36,
    paddingTop: 20,
    gap: 24,
  },
  welcomeRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    gap: 12,
  },
  welcomeTitle: {
    fontSize: 26,
    fontWeight: '800',
    color: colors.textPrimary,
  },
  welcomeName: {
    fontSize: 18,
    fontWeight: '600',
    color: colors.textSecondary,
    marginTop: 4,
  },
  errorCard: {
    backgroundColor: colors.surface,
    borderColor: colors.error,
    borderWidth: 1,
    borderRadius: 18,
    padding: 14,
  },
  errorText: {
    color: colors.error,
    fontWeight: '600',
  },
  retryLink: {
    color: colors.accent,
    fontWeight: '600',
    marginTop: 8,
    textDecorationLine: 'underline',
  },
})
