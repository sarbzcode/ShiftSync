import AsyncStorage from '@react-native-async-storage/async-storage'
import { login as loginRequest } from './api'
import { LoginResponse, User } from '../types/api'

const serializeUser = (response: LoginResponse): User => ({
  id: response.user_id,
  username: response.username,
  name: response.name,
  email: response.email,
  role: response.role,
})

export const login = async (username: string, password: string) => {
  const data = await loginRequest(username, password)
  const user = serializeUser(data)
  await AsyncStorage.multiSet([
    ['access_token', data.access_token],
    ['user', JSON.stringify(user)],
  ])
  return { token: data.access_token, user }
}

export const logout = () => AsyncStorage.multiRemove(['access_token', 'user'])

export const loadSession = async () => {
  const [[, token], [, userJSON]] = await AsyncStorage.multiGet(['access_token', 'user'])
  if (token && userJSON) {
    return { token, user: JSON.parse(userJSON) as User }
  }
  return { token: null, user: null }
}
