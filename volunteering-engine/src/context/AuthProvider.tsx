import { onAuthStateChanged, type User } from 'firebase/auth'
import { doc, onSnapshot } from 'firebase/firestore'
import { createContext, type ReactNode, useContext, useEffect, useState } from 'react'
import { auth, db } from '../lib/firebase'
import type { UserProfile } from '../types/models'

interface AuthContextValue {
  user: User | null
  profile: UserProfile | null
  loading: boolean
}

const AuthContext = createContext<AuthContextValue | undefined>(undefined)

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null)
  const [profile, setProfile] = useState<UserProfile | null>(null)
  const [authLoading, setAuthLoading] = useState(true)
  // Defaults to "not yet checked" (false) so that on the render where `user`
  // first becomes non-null — before the profile effect below has even run —
  // `loading` already reflects that the profile fetch hasn't resolved yet.
  // A flag that instead defaulted to "not loading" would let RequireRole see
  // profile === null for one tick and incorrectly redirect to /login.
  const [profileChecked, setProfileChecked] = useState(false)

  useEffect(() => {
    return onAuthStateChanged(auth, (nextUser) => {
      setUser(nextUser)
      setAuthLoading(false)
    })
  }, [])

  useEffect(() => {
    if (!user) {
      setProfile(null)
      setProfileChecked(false)
      return
    }
    setProfileChecked(false)
    return onSnapshot(doc(db, 'users', user.uid), (snapshot) => {
      setProfile(snapshot.exists() ? (snapshot.data() as UserProfile) : null)
      setProfileChecked(true)
    })
  }, [user])

  const loading = authLoading || (user !== null && !profileChecked)

  return (
    <AuthContext.Provider value={{ user, profile, loading }}>{children}</AuthContext.Provider>
  )
}

export function useAuth(): AuthContextValue {
  const ctx = useContext(AuthContext)
  if (!ctx) throw new Error('useAuth must be used within an AuthProvider')
  return ctx
}
