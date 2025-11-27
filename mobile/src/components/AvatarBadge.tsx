import { Text, View } from 'react-native'
import { colors } from '../theme/colors'

type Props = {
  name: string
  size?: number
}

export default function AvatarBadge({ name, size = 48 }: Props) {
  const initials = name
    .split(' ')
    .map((part) => part[0])
    .join('')
    .slice(0, 2)
    .toUpperCase()

  return (
    <View
      style={{
        width: size,
        height: size,
        borderRadius: size / 2,
        backgroundColor: colors.accent,
        alignItems: 'center',
        justifyContent: 'center',
      }}
    >
      <Text style={{ color: colors.textPrimary, fontWeight: '600', fontSize: size / 2 }}>{initials}</Text>
    </View>
  )
}
