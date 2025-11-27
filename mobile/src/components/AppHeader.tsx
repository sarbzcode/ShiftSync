import { useState } from 'react'
import { Modal, Pressable, StyleSheet, Text, View } from 'react-native'
import { Feather } from '@expo/vector-icons'
import { LinearGradient } from 'expo-linear-gradient'
import { useAuth } from '../context/AuthContext'
import { colors } from '../theme/colors'

export default function AppHeader() {
  const { logout } = useAuth()
  const [showConfirm, setShowConfirm] = useState(false)

  const closeModal = () => setShowConfirm(false)
  const handleLogout = () => {
    setShowConfirm(false)
    logout()
  }

  return (
    <>
      <View style={styles.shadowWrapper}>
        <LinearGradient
          colors={[colors.accent, colors.backgroundSecondary]}
          start={{ x: 0, y: 0 }}
          end={{ x: 0.9, y: 1 }}
          style={styles.container}
        >
          <View style={styles.headerRow}>
            <Text style={styles.brandName}>ShiftSync</Text>
            <Pressable
              accessibilityRole="button"
              accessibilityLabel="Logout"
              accessibilityHint="Opens a confirmation prompt to logout"
              onPress={() => setShowConfirm(true)}
              style={({ pressed }) => [
                styles.powerButton,
                pressed && { opacity: 0.85, transform: [{ scale: 0.94 }] },
              ]}
            >
              <Feather name="power" size={20} color={colors.textPrimary} />
            </Pressable>
          </View>
        </LinearGradient>
      </View>
      <Modal
        transparent
        visible={showConfirm}
        animationType="fade"
        onRequestClose={closeModal}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalCard}>
            <View style={styles.modalIcon}>
              <Feather name="power" size={28} color={colors.accent} />
            </View>
            <Text style={styles.modalTitle}>Do you want to logout?</Text>
            <Text style={styles.modalDescription}>You can stay signed in to continue managing your shifts.</Text>
            <View style={styles.modalActions}>
              <Pressable
                onPress={closeModal}
                style={({ pressed }) => [
                  styles.actionButton,
                  styles.cancelButton,
                  pressed && { opacity: 0.9 },
                ]}
              >
                <Text style={[styles.actionText, styles.cancelText]}>Cancel</Text>
              </Pressable>
              <Pressable
                onPress={handleLogout}
                style={({ pressed }) => [
                  styles.actionButton,
                  styles.logoutButton,
                  pressed && { opacity: 0.9 },
                ]}
              >
                <Text style={[styles.actionText, styles.logoutText]}>Logout</Text>
              </Pressable>
            </View>
          </View>
        </View>
      </Modal>
    </>
  )
}

const styles = StyleSheet.create({
  shadowWrapper: {
    backgroundColor: 'transparent',
    borderBottomLeftRadius: 20,
    borderBottomRightRadius: 20,
    shadowColor: 'rgba(0,0,0,0.5)',
    shadowOpacity: 0.35,
    shadowRadius: 18,
    shadowOffset: { width: 0, height: 8 },
    elevation: 14,
    marginBottom: 0,
    marginHorizontal: 0,
  },
  container: {
    paddingHorizontal: 24,
    paddingVertical: 20,
  },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  brandName: {
    fontSize: 30,
    fontWeight: '700',
    color: colors.textPrimary,
    letterSpacing: 0.7,
  },
  powerButton: {
    backgroundColor: colors.accent,
    width: 44,
    height: 44,
    borderRadius: 22,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: colors.border,
    shadowColor: 'rgba(0,0,0,0.5)',
    shadowOpacity: 0.35,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 4 },
    elevation: 8,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.65)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 24,
  },
  modalCard: {
    width: '100%',
    backgroundColor: colors.surface,
    borderRadius: 20,
    padding: 24,
    alignItems: 'center',
    gap: 12,
    borderWidth: 1,
    borderColor: colors.border,
    shadowColor: 'rgba(0,0,0,0.5)',
    shadowOpacity: 0.3,
    shadowRadius: 18,
    shadowOffset: { width: 0, height: 12 },
    elevation: 12,
  },
  modalIcon: {
    backgroundColor: colors.accentSoft,
    borderRadius: 999,
    padding: 14,
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: colors.textPrimary,
    textAlign: 'center',
  },
  modalDescription: {
    fontSize: 14,
    color: colors.textSecondary,
    textAlign: 'center',
  },
  modalActions: {
    flexDirection: 'row',
    gap: 12,
    marginTop: 8,
  },
  actionButton: {
    borderRadius: 999,
    paddingVertical: 10,
    paddingHorizontal: 20,
    minWidth: 120,
    alignItems: 'center',
    borderWidth: 1,
  },
  cancelButton: {
    borderColor: colors.border,
    backgroundColor: colors.surfaceLight,
  },
  logoutButton: {
    borderColor: colors.accent,
    backgroundColor: colors.accent,
  },
  actionText: {
    fontWeight: '600',
    fontSize: 15,
  },
  cancelText: {
    color: colors.textPrimary,
  },
  logoutText: {
    color: colors.textPrimary,
  },
})
