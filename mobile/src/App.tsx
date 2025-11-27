import { StatusBar } from 'expo-status-bar'
import { SafeAreaProvider } from 'react-native-safe-area-context'
import RootNavigator from './navigation/RootNavigator'
import { AuthProvider } from './context/AuthContext'
import { colors } from './theme/colors'

export default function App() {
  return (
    <SafeAreaProvider>
      <AuthProvider>
        <RootNavigator />
        <StatusBar style="light" backgroundColor={colors.background} />
      </AuthProvider>
    </SafeAreaProvider>
  )
}
