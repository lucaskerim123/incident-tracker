import { createContext, useContext, useEffect, useState } from 'react'
import { supabase } from '../lib/supabase'

const AuthContext = createContext(null)

const ID_DOMAIN = 'it.local'
const idToEmail = (id) => `${id}@${ID_DOMAIN}`

export function AuthProvider({ children }) {
  const [session, setSession] = useState(undefined)
  const [userRole, setUserRole] = useState(null)
  const [userCode, setUserCode] = useState(null)
  const [userStatus, setUserStatus] = useState(null)
  const [displayName, setDisplayName] = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session)
      if (session) fetchRole(session.user.id)
      else setLoading(false)
    })

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session)
      if (session) fetchRole(session.user.id)
      else { setUserRole(null); setUserCode(null); setUserStatus(null); setLoading(false) }
    })

    return () => subscription.unsubscribe()
  }, [])

  async function fetchRole(userId) {
    const { data } = await supabase
      .from('users')
      .select('role, user_code, status, display_name')
      .eq('id', userId)
      .single()
    setUserRole(data?.role ?? 'viewer')
    setUserCode(data?.user_code ?? null)
    setUserStatus(data?.status ?? 'pending')
    setDisplayName(data?.display_name ?? null)
    setLoading(false)
  }

  const signInWithId = async (id, password) => {
    const { data, error } = await supabase.auth.signInWithPassword({ email: idToEmail(id), password })
    if (error) return { data: null, error }
    const { data: userData } = await supabase.from('users')
      .select('status').eq('id', data.user.id).single()
    const status = userData?.status
    if (status === 'pending') {
      await supabase.auth.signOut()
      return { data: null, error: { message: 'Account is pending admin approval.' } }
    }
    if (status === 'suspended') {
      await supabase.auth.signOut()
      return { data: null, error: { message: 'Account suspended. Contact an admin.' } }
    }
    if (status === 'blocked') {
      await supabase.auth.signOut()
      return { data: null, error: { message: 'Account has been blocked.' } }
    }
    return { data, error: null }
  }

  const register = async (id, password) => {
    const { error } = await supabase.auth.signUp({
      email: idToEmail(id),
      password,
    })
    if (error) return { error: error.message }
    return { error: null }
  }

  const signOut = () => supabase.auth.signOut()

  const updatePasscode = (password) =>
    supabase.auth.updateUser({ password })

  return (
    <AuthContext.Provider value={{
      session, user: session?.user, userRole, userCode, userStatus, displayName, loading,
      signInWithId, register, signOut, updatePasscode,
    }}>
      {children}
    </AuthContext.Provider>
  )
}

export const useAuth = () => useContext(AuthContext)
