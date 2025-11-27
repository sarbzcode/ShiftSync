import { ScrollView, Text, View } from 'react-native'
import AvatarBadge from '../components/AvatarBadge'
import useProfile from '../hooks/useProfile'
import { colors } from '../theme/colors'

export default function ProfileScreen() {
  const profile = useProfile()

  if (!profile) {
    return null
  }

  const infoRows = [
    { label: 'Full name', value: profile.name },
    { label: 'Email', value: profile.email },
    { label: 'Username', value: profile.username },
    { label: 'Role', value: profile.role },
    profile.department ? { label: 'Department', value: profile.department } : null,
    profile.pay_rate ? { label: 'Pay rate', value: `$${profile.pay_rate.toFixed(2)}/hr` } : null,
  ].filter(Boolean) as Array<{ label: string; value: string }>

  return (
    <ScrollView style={{ flex: 1, backgroundColor: colors.background }} contentContainerStyle={{ padding: 20 }}>
      <View
        style={{
          backgroundColor: colors.surface,
          padding: 24,
          borderRadius: 20,
          alignItems: 'center',
          gap: 12,
          borderWidth: 1,
          borderColor: colors.border,
          shadowColor: 'rgba(0,0,0,0.5)',
          shadowOpacity: 0.25,
          shadowRadius: 14,
          shadowOffset: { width: 0, height: 8 },
          elevation: 8,
        }}
      >
        <AvatarBadge name={profile.name} size={80} />
        <Text style={{ fontSize: 20, fontWeight: '700', color: colors.textPrimary }}>{profile.name}</Text>
        <Text style={{ color: colors.textSecondary }}>{profile.email}</Text>
      </View>

      <View style={{ marginTop: 24, backgroundColor: colors.surface, borderRadius: 20, padding: 20, gap: 16, borderWidth: 1, borderColor: colors.border }}>
        {infoRows.map((row, index) => (
          <View key={row.label} style={{ paddingBottom: index === infoRows.length - 1 ? 0 : 12, borderBottomWidth: index === infoRows.length - 1 ? 0 : 1, borderBottomColor: index === infoRows.length - 1 ? 'transparent' : colors.border }}>
            <Text style={{ color: colors.textSecondary, fontSize: 12, textTransform: 'uppercase' }}>{row.label}</Text>
            <Text style={{ fontSize: 16, fontWeight: '600', color: colors.textPrimary }}>{row.value}</Text>
          </View>
        ))}
      </View>
    </ScrollView>
  )
}
