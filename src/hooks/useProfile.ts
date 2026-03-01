import { useState, useEffect, useCallback } from 'react'
import { useAuth } from '@/contexts/AuthContext'
import { fetchProfile, updateProfile as updateProfileApi } from '@/lib/api'
import type { DbProfile } from '@/types/database'

export function useProfile() {
  const { user } = useAuth()
  const [profile, setProfile] = useState<DbProfile | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (!user) {
      setProfile(null)
      setLoading(false)
      return
    }
    setLoading(true)
    fetchProfile(user.id).then(p => {
      setProfile(p)
      setLoading(false)
    })
  }, [user])

  const updateProfile = useCallback(
    async (data: { display_name?: string; bio?: string; birth_year?: number | null; birth_date?: string | null }) => {
      if (!user) return
      const updated = await updateProfileApi(user.id, data)
      if (updated) setProfile(updated)
    },
    [user],
  )

  return { profile, updateProfile, loading }
}
