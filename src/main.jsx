import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { GoogleOAuthProvider } from '@react-oauth/google'
import './index.css'
import App from './App.jsx'
import { GoogleDriveProvider } from './context/GoogleDriveContext.jsx'

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <GoogleOAuthProvider clientId={import.meta.env.VITE_GOOGLE_CLIENT_ID ?? ''}>
      <GoogleDriveProvider>
        <App />
      </GoogleDriveProvider>
    </GoogleOAuthProvider>
  </StrictMode>,
)
