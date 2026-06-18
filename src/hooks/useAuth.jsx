import { createContext, useContext, useEffect, useState } from 'react'
import { supabase } from '../lib/supabase'

const AuthContext = createContext(null)

export function AuthProvider({ children }) {
  const [session, setSession] = useState(undefined)
  const [userRole, setUserRole] = useState(null)
  const [userCode, setUserCode] = useState(null)
  const [userStatus, setUserStatus] = useState(null)
  const [displayName, setDisplayName] = useState(null)
  const [loading, setLoading] = useState(true)

  const [suspensionReason, setSuspensionReason] = useState(null)
  const [suspensionExpiresAt, setSuspensionExpiresAt] = useState(null)
  const [banReason, setBanReason] = useState(null)
  const [banExpiresAt, setBanExpiresAt] = useState(null)

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session)
      if (session) fetchRole(session.user.id)
      else setLoading(false)
    })

    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      setSession(session)
      if (session) {
        if (event === 'SIGNED_IN') setLoading(true)
        fetchRole(session.user.id)
      } else {
        setUserRole(null); setUserCode(null); setUserStatus(null); setLoading(false)
        setSuspensionReason(null); setSuspensionExpiresAt(null)
        setBanReason(null); setBanExpiresAt(null)
      }
    })

    return () => subscription.unsubscribe()
  }, [])

  // Realtime: detect live status changes (e.g. admin suspends a logged-in user)
  useEffect(() => {
    if (!session?.user?.id) return
    const userId = session.user.id

    const channel = supabase
      .channel(`user-status-${userId}`)
      .on(
        'postgres_changes',
        { event: 'UPDATE', schema: 'public', table: 'users', filter: `id=eq.${userId}` },
        (payload) => {
          const u = payload.new
          const now = new Date()

          // If expiry has already passed, let fetchRole clean up the DB too
          if (u.status === 'suspended' && u.suspension_expires_at && new Date(u.suspension_expires_at) < now) {
            fetchRole(userId)
            return
          }
          if (u.status === 'blocked' && u.ban_expires_at && new Date(u.ban_expires_at) < now) {
            fetchRole(userId)
            return
          }

          setUserStatus(u.status ?? null)
          setSuspensionReason(u.suspension_reason ?? null)
          setSuspensionExpiresAt(u.suspension_expires_at ?? null)
          setBanReason(u.ban_reason ?? null)
          setBanExpiresAt(u.ban_expires_at ?? null)
        }
      )
      .subscribe()

    return () => { supabase.removeChannel(channel) }
  }, [session?.user?.id])

  async function fetchRole(userId) {
    // Auto-clear expired suspension/ban at DB level, get effective status
    await supabase.rpc('check_and_clear_expired_restrictions', { target_id: userId })

    const { data } = await supabase
      .from('users')
      .select('role, user_code, status, display_name, suspension_reason, suspension_expires_at, ban_reason, ban_expires_at')
      .eq('id', userId)
      .single()

    setUserRole(data?.role ?? 'viewer')
    setUserCode(data?.user_code ?? null)
    setUserStatus(data?.status ?? 'pending')
    setDisplayName(data?.display_name ?? null)
    setSuspensionReason(data?.suspension_reason ?? null)
    setSuspensionExpiresAt(data?.suspension_expires_at ?? null)
    setBanReason(data?.ban_reason ?? null)
    setBanExpiresAt(data?.ban_expires_at ?? null)
    setLoading(false)
  }

  const signInWithEmail = async (email, password) => {
    const { data, error } = await supabase.auth.signInWithPassword({ email, password })
    if (error) return { data: null, error }

    // Auto-clear expiry and get effective status
    const { data: effectiveStatus } = await supabase
      .rpc('check_and_clear_expired_restrictions', { target_id: data.user.id })

    if (effectiveStatus === 'pending') {
      await supabase.auth.signOut()
      return { data: null, error: { message: 'Account is pending admin approval.' } }
    }
    if (effectiveStatus === 'suspended' || effectiveStatus === 'blocked') {
      // Keep the session alive — RequireAuth will render Suspended/Banned with reason + expiry
      return { data, error: null }
    }
    // Non-blocking: log IP + user agent for this login event
    ;(async () => {
      try {
        const res = await fetch('https://api64.ipify.org?format=json')
        const { ip } = await res.json()
        await supabase.rpc('log_login_event', { p_ip: ip, p_user_agent: navigator.userAgent })
      } catch { /* ignore — login still succeeds */ }
    })()
    return { data, error: null }
  }

  const signOut = () => supabase.auth.signOut()

  const updatePasscode = (password) =>
    supabase.auth.updateUser({ password })

  return (
    <AuthContext.Provider value={{
      session, user: session?.user, userRole, userCode, userStatus, displayName, loading,
      suspensionReason, suspensionExpiresAt, banReason, banExpiresAt,
      signInWithEmail, signOut, updatePasscode,
    }}>
      {children}
    </AuthContext.Provider>
  )
}

export const useAuth = () => useContext(AuthContext)
