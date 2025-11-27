import { useEffect, useRef, useState } from 'react'
import { ActivityIndicator, Alert, Animated, Modal, Platform, Pressable, StyleSheet, Text, TouchableOpacity, View } from 'react-native'
import AvatarBadge from './AvatarBadge'
import { colors } from '../theme/colors'

type Props = {
  name: string
  isClockedIn: boolean
  statusDetailLabel: string
  statusDetailValue: string
  loading: boolean
  onToggle: () => void
}

export default function StatusCard({
  name,
  isClockedIn,
  statusDetailLabel,
  statusDetailValue,
  loading,
  onToggle,
}: Props) {
  const pulseAnimation = useRef(new Animated.Value(0)).current
  const [showConfirm, setShowConfirm] = useState(false)

  useEffect(() => {
    let animation: Animated.CompositeAnimation | undefined
    if (isClockedIn) {
      animation = Animated.loop(
        Animated.sequence([
          Animated.timing(pulseAnimation, {
            toValue: 1,
            duration: 1600,
            useNativeDriver: false,
          }),
          Animated.timing(pulseAnimation, {
            toValue: 0,
            duration: 1600,
            useNativeDriver: false,
          }),
        ])
      )
      animation.start()
    } else {
      pulseAnimation.stopAnimation()
      pulseAnimation.setValue(0)
    }

    return () => {
      animation?.stop()
    }
  }, [isClockedIn, pulseAnimation])

  const confirmAction = () => {
    const actionLabel = isClockedIn ? 'Clock Out' : 'Clock In'
    if (Platform.OS === 'web') {
      setShowConfirm(true)
      return
    }
    Alert.alert(
      `${actionLabel}?`,
      `Are you sure you want to ${actionLabel.toLowerCase()} now?`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: actionLabel,
          style: isClockedIn ? 'destructive' : 'default',
          onPress: onToggle,
        },
      ],
    )
  }

  const glowColor = pulseAnimation.interpolate({
    inputRange: [0, 1],
    outputRange: [colors.accentSoft, colors.accent],
  })

  return (
    <Animated.View
      style={[
        styles.card,
        isClockedIn ? styles.cardActive : styles.cardInactive,
        isClockedIn && { borderColor: glowColor as unknown as string },
      ]}
    >
      <View style={styles.headerRow}>
        <AvatarBadge name={name} size={56} />
        <View style={styles.statusCopy}>
          <Text style={styles.statusLabel}>Current status</Text>
          <Text style={styles.statusValue}>
            {isClockedIn ? 'Clocked In' : 'Clocked Out'}
          </Text>
        </View>
      </View>
      <View style={styles.timestampContainer}>
        <Text style={styles.timestampLabel}>{statusDetailLabel}</Text>
        <Text style={styles.timestampValue}>
          {statusDetailValue}
        </Text>
      </View>
      <TouchableOpacity
        onPress={confirmAction}
        disabled={loading}
        activeOpacity={0.85}
        style={[
          styles.ctaButton,
          isClockedIn ? styles.clockOutButton : styles.clockInButton,
          loading && { opacity: 0.7 },
        ]}
      >
        {loading ? (
          <ActivityIndicator color={colors.textPrimary} />
        ) : (
          <Text style={styles.ctaText}>
            {isClockedIn ? 'Clock Out' : 'Clock In'}
          </Text>
        )}
      </TouchableOpacity>

      <Modal transparent visible={showConfirm} animationType="fade" onRequestClose={() => setShowConfirm(false)}>
        <View style={styles.modalOverlay}>
          <View style={styles.modalCard}>
            <View style={styles.modalIcon}>
              <AvatarBadge name={name} size={42} />
            </View>
            <Text style={styles.modalTitle}>{isClockedIn ? 'Clock out?' : 'Clock in?'}</Text>
            <Text style={styles.modalDescription}>
              Are you sure you want to {isClockedIn ? 'clock out' : 'clock in'} now?
            </Text>
            <View style={styles.modalActions}>
              <Pressable
                style={[styles.modalButton, styles.modalButtonGhost]}
                onPress={() => setShowConfirm(false)}
              >
                <Text style={styles.modalButtonTextGhost}>Cancel</Text>
              </Pressable>
              <Pressable
                style={[styles.modalButton, styles.modalButtonPrimary]}
                onPress={() => {
                  setShowConfirm(false)
                  onToggle()
                }}
              >
                <Text style={styles.modalButtonTextPrimary}>{isClockedIn ? 'Clock Out' : 'Clock In'}</Text>
              </Pressable>
            </View>
          </View>
        </View>
      </Modal>
    </Animated.View>
  )
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: colors.surface,
    borderRadius: 20,
    padding: 22,
    shadowColor: 'rgba(0,0,0,0.5)',
    shadowOpacity: 0.32,
    shadowRadius: 16,
    shadowOffset: { width: 0, height: 10 },
    elevation: 8,
    gap: 16,
    borderWidth: 1,
    borderColor: colors.border,
  },
  cardActive: {
    borderColor: colors.accent,
    backgroundColor: colors.surfaceLight,
  },
  cardInactive: {
    borderColor: colors.border,
  },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 16,
  },
  statusCopy: {
    flex: 1,
  },
  statusLabel: {
    color: colors.textMuted,
    fontSize: 12,
    letterSpacing: 0.3,
    textTransform: 'uppercase',
  },
  statusValue: {
    fontSize: 20,
    fontWeight: '700',
    color: colors.textPrimary,
    marginBottom: 6,
  },
  timestampContainer: {
    backgroundColor: colors.surfaceLight,
    borderWidth: 1,
    borderColor: colors.border,
    padding: 16,
    borderRadius: 16,
  },
  timestampLabel: {
    color: colors.textSecondary,
    fontSize: 13,
    marginBottom: 4,
  },
  timestampValue: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.textPrimary,
  },
  ctaButton: {
    borderRadius: 16,
    paddingVertical: 16,
    alignItems: 'center',
    width: '100%',
    shadowColor: 'rgba(0,0,0,0.5)',
    shadowOpacity: 0.28,
    shadowRadius: 12,
    shadowOffset: { width: 0, height: 6 },
    elevation: 8,
  },
  clockOutButton: {
    backgroundColor: colors.error,
  },
  clockInButton: {
    backgroundColor: colors.accent,
  },
  ctaText: {
    color: colors.textPrimary,
    fontWeight: '700',
    fontSize: 16,
    letterSpacing: 0.3,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.65)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  modalCard: {
    width: '100%',
    maxWidth: 360,
    backgroundColor: colors.surface,
    borderRadius: 18,
    padding: 20,
    alignItems: 'center',
    gap: 10,
    borderWidth: 1,
    borderColor: colors.border,
    shadowColor: 'rgba(0,0,0,0.5)',
    shadowOpacity: 0.28,
    shadowRadius: 16,
    shadowOffset: { width: 0, height: 8 },
    elevation: 10,
  },
  modalIcon: {
    marginBottom: 6,
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: '800',
    color: colors.textPrimary,
    textAlign: 'center',
  },
  modalDescription: {
    fontSize: 14,
    color: colors.textSecondary,
    textAlign: 'center',
    marginBottom: 6,
  },
  modalActions: {
    flexDirection: 'row',
    gap: 10,
    marginTop: 6,
  },
  modalButton: {
    borderRadius: 12,
    paddingHorizontal: 14,
    paddingVertical: 10,
    minWidth: 120,
    alignItems: 'center',
    borderWidth: 1,
  },
  modalButtonGhost: {
    backgroundColor: colors.surfaceLight,
    borderColor: colors.border,
  },
  modalButtonPrimary: {
    backgroundColor: colors.accent,
    borderColor: colors.accent,
  },
  modalButtonTextGhost: {
    color: colors.textPrimary,
    fontWeight: '700',
  },
  modalButtonTextPrimary: {
    color: colors.textPrimary,
    fontWeight: '700',
  },
})
