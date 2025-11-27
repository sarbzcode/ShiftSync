import { ActivityIndicator, ScrollView, Text, View } from 'react-native'
import useSchedule from '../hooks/useSchedule'
import { formatDateLabel } from '../utils/dateFormatters'
import { colors } from '../theme/colors'

export default function ScheduleScreen() {
  const { grouped, loading, refresh } = useSchedule()

  return (
    <ScrollView style={{ flex: 1, backgroundColor: colors.background }} contentContainerStyle={{ padding: 20 }}>
      <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
        <Text style={{ fontSize: 24, fontWeight: '700', color: colors.textPrimary }}>Schedule</Text>
        <Text style={{ color: colors.accent, fontWeight: '600' }} onPress={refresh}>
          Refresh
        </Text>
      </View>
      {loading ? (
        <ActivityIndicator color={colors.accent} />
      ) : (
        grouped.map((group) => (
          <View key={group.date} style={{ marginBottom: 16 }}>
            <Text style={{ fontWeight: '600', marginBottom: 8, color: colors.textSecondary }}>
              {formatDateLabel(group.date, 'EEEE, MMM d')}
            </Text>
            {group.shifts.map((shift) => (
              <View
                key={shift.id}
                style={{
                  backgroundColor: colors.surface,
                  borderRadius: 12,
                  borderWidth: 1,
                  borderColor: colors.border,
                  padding: 16,
                  marginBottom: 8,
                }}
              >
                <Text style={{ fontWeight: '600', color: colors.textPrimary }}>
                  {shift.start_time} - {shift.end_time}
                </Text>
                <Text style={{ color: colors.textSecondary, marginTop: 4 }}>Status: {shift.status}</Text>
              </View>
            ))}
          </View>
        ))
      )}
    </ScrollView>
  )
}
