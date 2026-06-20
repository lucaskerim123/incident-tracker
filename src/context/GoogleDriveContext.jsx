import { createContext, useContext, useState, useCallback } from 'react'
import { useGoogleLogin } from '@react-oauth/google'

const Ctx = createContext(null)

export function GoogleDriveProvider({ children }) {
  const [accessToken, setAccessToken] = useState(null)

  const login = useGoogleLogin({
    scope: 'https://www.googleapis.com/auth/drive.file',
    onSuccess: (res) => setAccessToken(res.access_token),
    onError: (err) => console.error('Google login failed', err),
  })

  const logout = useCallback(() => setAccessToken(null), [])

  return (
    <Ctx.Provider value={{ accessToken, login, logout, isConnected: !!accessToken }}>
      {children}
    </Ctx.Provider>
  )
}

export function useGoogleDrive() {
  const ctx = useContext(Ctx)
  if (!ctx) throw new Error('useGoogleDrive must be used within GoogleDriveProvider')
  return ctx
}
