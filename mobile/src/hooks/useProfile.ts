import { useEffect, useState } from 'react'
import { getMyProfile } from '../services/api'
import { UserProfile } from '../types/api'
import { useAuth } from '../context/AuthContext'

export default function useProfile() {
  const { user } = useAuth()
  const [profile, setProfile] = useState<UserProfile | null>(null)

  useEffect(() => {
    const load = async () => {
      try {
        const result = await getMyProfile()
        setProfile(result)
      } catch {
        if (user) {
          setProfile({
            id: user.id,
            name: user.name,
            email: user.email,
            username: user.username,
            role: user.role,
          })
        }
      }
    }
    load()
  }, [user])

  return profile
}
