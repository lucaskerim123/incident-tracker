import { createContext, useContext, useEffect, useState } from 'react'
import { supabase } from '../lib/supabase'

const AuthContext = createContext(null)

const ID_DOMAIN = 'it.local'
const idToEmail = (id) => `${id}@${ID_DOMAIN}`

export function AuthProvider({ children }) {
  const [session, setSession] = useState(undefined)
  const [userRole, setUserRole] = useState(null)
  const [userCode, setUserCode] = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session)
      if (session) fetchProfile(session.user.id)
      else setLoading(false)
    })

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session)
      if (session) fetchProfile(session.user.id)
      else { setUserRole(null); setUserCode(null); setLoading(false) }
    })

    return () => subscription.unsubscribe()
  }, [])

  async function fetchProfile(userId) {
    const { data } = await supabase
      .from('users')
      .select('role, user_code')
      .eq('id', userId)
      .single()
    setUserRole(data?.role ?? 'viewer')
    setUserCode(data?.user_code ?? null)
    setLoading(false)
  }

  // Sign in with numeric user_code + passcode
  const signInWithId = (id, passcode) =>
    supabase.auth.signInWithPassword({ email: idToEmail(id), password: passcode })

  // First-ever user setup: reserves user_code 1000, then signs up
  const registerFirstUser = async (passcode) => {
    const { data: code, error: codeErr } = await supabase.rpc('reserve_first_user_code')
    if (codeErr) return { error: codeErr.message }
    const { error } = await supabase.auth.signUp({
      email: idToEmail(code),
      password: passcode,
    })
    if (error) return { error: error.message }
    return { userCode: code, error: null }
  }

  // Invited user registration: validates invite code then signs up
  const registerWithInvite = async (userCode, token, passcode) => {
    const { data: valid, error: valErr } = await supabase.rpc('validate_invitation', {
      p_user_code: userCode,
      p_token: token,
    })
    if (valErr || !valid) return { error: 'Invalid ID or invite code.' }
    const { error } = await supabase.auth.signUp({
      email: idToEmail(userCode),
      password: passcode,
    })
    if (error) return { error: error.message }
    return { error: null }
  }

  const signOut = () => supabase.auth.signOut()

  const updatePasscode = (newPasscode) =>
    supabase.auth.updateUser({ password: newPasscode })

  return (
    <AuthContext.Provider value={{
      session, user: session?.user, userRole, userCode, loading,
      signInWithId, registerFirstUser, registerWithInvite, signOut, updatePasscode,
    }}>
      {children}
    </AuthContext.Provider>
  )
}

export const useAuth = () => useContext(AuthContext)
