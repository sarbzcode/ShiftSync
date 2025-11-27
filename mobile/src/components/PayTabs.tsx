import { Pressable, StyleSheet, Text, View } from 'react-native'
import { colors } from '../theme/colors'

type Tab = {
  key: string
  label: string
}

type Props = {
  tabs: Tab[]
  selected: string
  onSelect: (key: string) => void
}

export default function PayTabs({ tabs, selected, onSelect }: Props) {
  return (
    <View style={styles.container}>
      {tabs.map((tab) => {
        const active = tab.key === selected
        return (
          <Pressable
            key={tab.key}
            onPress={() => onSelect(tab.key)}
            style={[styles.tab, active && styles.activeTab]}
          >
            <Text style={[styles.tabLabel, active && styles.activeLabel]}>{tab.label}</Text>
            <View style={[styles.indicator, active && styles.activeIndicator]} />
          </Pressable>
        )
      })}
    </View>
  )
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    borderRadius: 16,
    backgroundColor: colors.surfaceLight,
    padding: 4,
    marginBottom: 18,
    borderWidth: 1,
    borderColor: colors.border,
  },
  tab: {
    flex: 1,
    paddingVertical: 10,
    alignItems: 'center',
    justifyContent: 'center',
    position: 'relative',
    borderRadius: 12,
  },
  tabLabel: {
    fontSize: 14,
    fontWeight: '700',
    letterSpacing: 0.3,
    color: colors.textSecondary,
  },
  activeTab: {
    backgroundColor: colors.accent,
    borderRadius: 12,
    shadowColor: 'rgba(0,0,0,0.5)',
    shadowOpacity: 0.28,
    shadowRadius: 12,
    shadowOffset: { width: 0, height: 6 },
    elevation: 8,
  },
  activeLabel: {
    color: colors.textPrimary,
  },
  indicator: {
    position: 'absolute',
    bottom: 6,
    width: '34%',
    height: 3,
    borderRadius: 999,
    backgroundColor: 'transparent',
  },
  activeIndicator: {
    backgroundColor: colors.textPrimary,
  },
})
