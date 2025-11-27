import { DefaultTheme, NavigationContainer } from '@react-navigation/native'
import { createNativeStackNavigator } from '@react-navigation/native-stack'
import { useEffect } from 'react'
import AuthNavigator from './AuthNavigator'
import AppNavigator from './AppNavigator'
import { RootStackParamList } from './types'
import { useAuth } from '../context/AuthContext'
import { onUnauthorized } from '../services/api'
import { colors } from '../theme/colors'

const Stack = createNativeStackNavigator<RootStackParamList>()
const navTheme = {
  ...DefaultTheme,
  colors: {
    ...DefaultTheme.colors,
    background: colors.background,
    card: colors.surface,
    text: colors.textPrimary,
    border: colors.border,
    primary: colors.accent,
    notification: colors.accent,
  },
}

export default function RootNavigator() {
  const { token, loading, logout } = useAuth()

  useEffect(() => {
    onUnauthorized(() => {
      logout()
    })
  }, [logout])

  if (loading) {
    return null
  }

  return (
    <NavigationContainer theme={navTheme}>
      <Stack.Navigator screenOptions={{ headerShown: false }}>
        {token ? (
          <Stack.Screen name="App" component={AppNavigator} />
        ) : (
          <Stack.Screen name="Auth" component={AuthNavigator} />
        )}
      </Stack.Navigator>
    </NavigationContainer>
  )
}
