import { createNativeStackNavigator } from '@react-navigation/native-stack'
import PayrollScreen from '../screens/PayrollScreen'
import PayDetailScreen from '../screens/PayDetailScreen'
import { PayStackParamList } from './types'

const Stack = createNativeStackNavigator<PayStackParamList>()

export default function PayNavigator() {
  return (
    <Stack.Navigator screenOptions={{ headerShown: false }}>
      <Stack.Screen name="Payroll" component={PayrollScreen} />
      <Stack.Screen name="PayDetail" component={PayDetailScreen} />
    </Stack.Navigator>
  )
}
