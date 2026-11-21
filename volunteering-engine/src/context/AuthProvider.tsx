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
  profileError: boolean
  isSiteOwner: boolean
  canSwitchView: boolean
  adminView: boolean
  setAdminView: (adminView: boolean) => void
}

const VIEW_KEY = 'vetwork.adminView'

function readAdminView(): boolean {
  try {
    return localStorage.getItem(VIEW_KEY) !== 'user'
  } catch {
    return true
  }
}

const AuthContext = createContext<AuthContextValue | undefined>(undefined)

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null)
  const [savedProfile, setProfile] = useState<UserProfile | null>(null)
  const [authLoading, setAuthLoading] = useState(true)
  const [profileChecked, setProfileChecked] = useState(false)
  const [profileError, setProfileError] = useState(false)
  const [adminView, setAdminViewState] = useState(readAdminView)

  useEffect(() => {
    return onAuthStateChanged(auth, (nextUser) => {
      setUser(nextUser)
      setAuthLoading(false)
    })
  }, [])

  useEffect(() => {
    setProfileError(false)
    if (!user) {
      setProfile(null)
      setProfileChecked(false)
      return
    }
    setProfileChecked(false)
    return onSnapshot(
      doc(db, 'users', user.uid),
      (snapshot) => {
        setProfile(snapshot.exists() ? (snapshot.data() as UserProfile) : null)
        setProfileChecked(true)
      },
      (error) => {
        // Without this, a refused read left `loading` true forever and the page rendered nothing at all.
        console.error('Could not load your profile:', error)
        setProfile(null)
        setProfileError(true)
        setProfileChecked(true)
      },
    )
  }, [user])

  const owner = isSiteOwner(user?.uid)

  const baseType = user && savedProfile ? effectiveAccountType(user.uid, savedProfile.accountType) : null
  const canSwitchView = baseType === 'admin'

  const profile = useMemo(() => {
    if (!savedProfile || !baseType) return null
    const accountType = baseType === 'admin' && !adminView ? (savedProfile.roleBeforeAdmin ?? 'member') : baseType
    return { ...savedProfile, accountType }
  }, [savedProfile, baseType, adminView])

  function setAdminView(next: boolean) {
    setAdminViewState(next)
    try {
      localStorage.setItem(VIEW_KEY, next ? 'admin' : 'user')
    } catch {
      return
    }
  }

  useEffect(() => {
    if (!user || !owner || !savedProfile) return
    if (savedProfile.accountType !== 'member' && savedProfile.accountType !== 'organization_officer') return
    updateDoc(doc(db, 'users', user.uid), { accountType: 'admin', roleBeforeAdmin: savedProfile.accountType }).catch((error) =>
      console.error('Could not save the owner role:', error),
    )
  }, [user, owner, savedProfile])

  const loading = authLoading || (user !== null && !profileChecked)

  return (
    <AuthContext.Provider value={{ user, profile, loading, profileError, isSiteOwner: owner, canSwitchView, adminView, setAdminView }}>
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth(): AuthContextValue {
  const ctx = useContext(AuthContext)
  if (!ctx) throw new Error('useAuth must be used within an AuthProvider')
  return ctx
}
