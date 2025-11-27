import { useState } from 'react'
import {
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native'
import { LinearGradient } from 'expo-linear-gradient'
import { Feather } from '@expo/vector-icons'
import { useAuth } from '../context/AuthContext'
import { colors } from '../theme/colors'

export default function LoginScreen() {
  const { login } = useAuth()
  const [username, setUsername] = useState('')
  const [password, setPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  const handleSubmit = async () => {
    setLoading(true)
    setError('')
    try {
      await login(username.trim(), password)
    } catch (err: any) {
      setError(err.response?.data?.detail ?? 'Unable to login')
    } finally {
      setLoading(false)
    }
  }

  return (
    <View style={styles.background}>
      <KeyboardAvoidingView
        style={styles.keyboardWrapper}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      >
        <View style={styles.cardWrapper}>
          <View style={styles.card}>
            <LinearGradient
              colors={[colors.accent, colors.backgroundSecondary]}
              start={{ x: 0, y: 0 }}
              end={{ x: 0.9, y: 1 }}
              style={styles.cardHeader}
            >
              <Text style={styles.headerBrand}>ShiftSync</Text>
              <Text style={styles.headerSubtitle}>Workforce Management System</Text>
            </LinearGradient>

            <View style={styles.form}>
              <Text style={styles.formTitle}>Welcome Back</Text>

              {error ? (
                <View style={styles.errorBox}>
                  <Feather name="alert-circle" size={18} color={colors.error} />
                  <Text style={styles.errorText}>{error}</Text>
                </View>
              ) : null}

              <View style={styles.fieldGroup}>
                <Text style={styles.fieldLabel}>Username</Text>
                <TextInput
                  placeholder="Enter your username"
                  autoCapitalize="none"
                  value={username}
                  onChangeText={setUsername}
                  style={styles.input}
                  placeholderTextColor={colors.textMuted}
                />
              </View>

              <View style={styles.fieldGroup}>
                <Text style={styles.fieldLabel}>Password</Text>
                <TextInput
                  placeholder="Enter your password"
                  secureTextEntry
                  value={password}
                  onChangeText={setPassword}
                  style={styles.input}
                  placeholderTextColor={colors.textMuted}
                />
              </View>

              <TouchableOpacity
                onPress={handleSubmit}
                disabled={loading}
                style={[styles.button, loading && { opacity: 0.7 }]}
              >
                {loading ? (
                  <ActivityIndicator color={colors.textPrimary} />
                ) : (
                  <>
                    <Feather name="log-in" size={18} color={colors.textPrimary} />
                    <Text style={styles.buttonText}>Sign In</Text>
                  </>
                )}
              </TouchableOpacity>

              <Text style={styles.footerHint}>
                Forgot your password? <Text style={styles.footerStrong}>Contact your administrator</Text>
              </Text>
            </View>
          </View>

          <Text style={styles.footerText}>© {new Date().getFullYear()} ShiftSync. All rights reserved.</Text>
        </View>
      </KeyboardAvoidingView>
    </View>
  )
}

const styles = StyleSheet.create({
  background: {
    flex: 1,
    backgroundColor: colors.background,
  },
  keyboardWrapper: {
    flex: 1,
    paddingHorizontal: 24,
    justifyContent: 'center',
  },
  cardWrapper: {
    width: '100%',
    maxWidth: 420,
    alignSelf: 'center',
  },
  card: {
    borderRadius: 24,
    backgroundColor: colors.surface,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: colors.border,
    shadowColor: 'rgba(0,0,0,0.5)',
    shadowOpacity: 0.35,
    shadowRadius: 20,
    shadowOffset: { width: 0, height: 12 },
    elevation: 10,
  },
  cardHeader: {
    paddingVertical: 32,
    paddingHorizontal: 24,
    alignItems: 'center',
  },
  headerBrand: {
    fontSize: 26,
    fontWeight: '800',
    color: colors.textPrimary,
  },
  headerSubtitle: {
    marginTop: 6,
    fontSize: 13,
    color: colors.textSecondary,
  },
  form: {
    paddingHorizontal: 24,
    paddingTop: 32,
    paddingBottom: 24,
    gap: 18,
  },
  formTitle: {
    fontSize: 22,
    fontWeight: '700',
    textAlign: 'center',
    color: colors.textPrimary,
  },
  fieldGroup: {
    gap: 8,
  },
  fieldLabel: {
    fontSize: 13,
    fontWeight: '600',
    color: colors.textPrimary,
  },
  input: {
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 14,
    paddingHorizontal: 14,
    paddingVertical: 12,
    fontSize: 15,
    color: colors.textPrimary,
    backgroundColor: colors.surfaceLight,
  },
  errorBox: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: colors.error,
    padding: 10,
    backgroundColor: colors.backgroundSecondary,
  },
  errorText: {
    fontSize: 13,
    color: colors.error,
    flex: 1,
  },
  button: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    backgroundColor: colors.accent,
    borderRadius: 14,
    paddingVertical: 14,
    shadowColor: 'rgba(0,0,0,0.5)',
    shadowOpacity: 0.35,
    shadowRadius: 16,
    shadowOffset: { width: 0, height: 8 },
    elevation: 8,
  },
  buttonText: {
    color: colors.textPrimary,
    fontWeight: '600',
    fontSize: 16,
  },
  footerHint: {
    marginTop: 8,
    textAlign: 'center',
    fontSize: 13,
    color: colors.textSecondary,
  },
  footerStrong: {
    color: colors.textPrimary,
    fontWeight: '600',
  },
  footerText: {
    textAlign: 'center',
    marginTop: 16,
    fontSize: 12,
    color: colors.textMuted,
  },
})
