import { ComponentProps } from 'react'
import { Feather } from '@expo/vector-icons'
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs'
import { SafeAreaView } from 'react-native-safe-area-context'
import { StyleSheet, View } from 'react-native'
import HomeScreen from '../screens/HomeScreen'
import ScheduleScreen from '../screens/ScheduleScreen'
import PayNavigator from './PayNavigator'
import ProfileScreen from '../screens/ProfileScreen'
import AppHeader from '../components/AppHeader'
import { AppTabParamList } from './types'
import { colors } from '../theme/colors'

const Tab = createBottomTabNavigator<AppTabParamList>()

const iconMap: Record<keyof AppTabParamList, ComponentProps<typeof Feather>['name']> = {
  Home: 'home',
  Schedule: 'calendar',
  Pay: 'dollar-sign',
  Profile: 'user',
}

export default function AppNavigator() {
  return (
    <SafeAreaView style={styles.safeArea} edges={['top', 'left', 'right']}>
      <AppHeader />
      <View style={styles.navigatorContainer}>
        <Tab.Navigator
          initialRouteName="Home"
          screenOptions={({ route }) => ({
            headerShown: false,
            tabBarActiveTintColor: colors.accent,
            tabBarInactiveTintColor: colors.textMuted,
            tabBarStyle: styles.tabBar,
            tabBarItemStyle: styles.tabItem,
            tabBarHideOnKeyboard: true,
            tabBarPressColor: colors.accentSoft,
            tabBarShowLabel: false,
            tabBarIcon: ({ size, focused }) => (
              <View
                style={[
                  styles.tabIconWrapper,
                  focused ? styles.tabIconWrapperActive : styles.tabIconWrapperInactive,
                ]}
              >
                <Feather
                  name={iconMap[route.name as keyof AppTabParamList]}
                  color={focused ? colors.accent : colors.textMuted}
                  size={focused ? size + 2 : size}
                />
              </View>
            ),
          })}
        >
          <Tab.Screen name="Home" component={HomeScreen} />
          <Tab.Screen name="Schedule" component={ScheduleScreen} />
          <Tab.Screen name="Pay" component={PayNavigator} />
          <Tab.Screen name="Profile" component={ProfileScreen} />
        </Tab.Navigator>
      </View>
    </SafeAreaView>
  )
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: colors.background,
    paddingTop: 0,
  },
  navigatorContainer: {
    flex: 1,
  },
  tabBar: {
    backgroundColor: colors.backgroundSecondary,
    borderTopWidth: 1,
    borderTopColor: colors.border,
    height: 78,
    paddingBottom: 14,
    paddingTop: 10,
    paddingHorizontal: 22,
    shadowColor: 'rgba(0,0,0,0.5)',
    shadowOpacity: 0.35,
    shadowRadius: 18,
    shadowOffset: { width: 0, height: -6 },
    elevation: 14,
  },
  tabItem: {
    paddingVertical: 6,
  },
  tabIconWrapper: {
    width: 48,
    height: 48,
    borderRadius: 24,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
  },
  tabIconWrapperInactive: {
    borderColor: colors.border,
    backgroundColor: colors.surfaceLight,
    shadowOpacity: 0.08,
    shadowColor: 'rgba(0,0,0,0.5)',
    shadowOffset: { width: 0, height: 4 },
    shadowRadius: 8,
    elevation: 4,
  },
  tabIconWrapperActive: {
    borderColor: colors.accent,
    backgroundColor: colors.surface,
    shadowColor: 'rgba(0,0,0,0.5)',
    shadowOpacity: 0.35,
    shadowRadius: 16,
    shadowOffset: { width: 0, height: 8 },
    elevation: 12,
  },
})
