import { onAuthStateChanged, type User } from 'firebase/auth'
import { doc, onSnapshot, updateDoc } from 'firebase/firestore'
import { createContext, type ReactNode, useContext, useEffect, useMemo, useState } from 'react'
import { auth, db } from '../lib/firebase'
import { effectiveAccountType, isSiteOwner } from '../lib/roles'
import type { UserProfile } from '../types/models'

interface AuthContextValue {
  user: User | null
  profile: UserProfile | null
  loading: boolean
  isSiteOwner: boolean
}

const AuthContext = createContext<AuthContextValue | undefined>(undefined)

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null)
  const [savedProfile, setProfile] = useState<UserProfile | null>(null)
  const [authLoading, setAuthLoading] = useState(true)
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

  const owner = isSiteOwner(user?.uid)

  const profile = useMemo(
    () => (user && savedProfile ? { ...savedProfile, accountType: effectiveAccountType(user.uid, savedProfile.accountType) } : null),
    [user, savedProfile],
  )

  useEffect(() => {
    if (!user || !owner || !savedProfile) return
    if (savedProfile.accountType !== 'member' && savedProfile.accountType !== 'organization_officer') return
    updateDoc(doc(db, 'users', user.uid), { accountType: 'admin', roleBeforeAdmin: savedProfile.accountType }).catch((error) =>
      console.error('Could not save the owner role:', error),
    )
  }, [user, owner, savedProfile])

  const loading = authLoading || (user !== null && !profileChecked)

  return (
    <AuthContext.Provider value={{ user, profile, loading, isSiteOwner: owner }}>{children}</AuthContext.Provider>
  )
}

export function useAuth(): AuthContextValue {
  const ctx = useContext(AuthContext)
  if (!ctx) throw new Error('useAuth must be used within an AuthProvider')
  return ctx
}
