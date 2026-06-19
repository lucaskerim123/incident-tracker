import { useEffect, useState } from 'react'
import { UserCheck, Zap, HelpCircle } from 'lucide-react'
import { supabase } from '../../lib/supabase'
import { useAppSettings } from '../../hooks/useAppSettings'

const inputClass = 'w-full rounded-lg px-3 py-2 text-sm text-slate-100 border outline-none focus:border-indigo-500 transition-colors'
const inputStyle = { background: '#0f1117', borderColor: '#2a2d3a' }

function Toggle({ checked, onChange, disabled }) {
  return (
    <button
      type="button"
      onClick={onChange}
      disabled={disabled}
      className={`relative inline-flex h-5 w-9 shrink-0 rounded-full transition-colors duration-200 focus:outline-none disabled:opacity-40 ${checked ? 'bg-indigo-500' : 'bg-slate-700'}`}
      role="switch"
      aria-checked={checked}>
      <span className={`inline-block h-4 w-4 mt-0.5 rounded-full bg-white shadow transition-transform duration-200 ${checked ? 'translate-x-4' : 'translate-x-0.5'}`} />
    </button>
  )
}

function SectionLabel({ icon: Icon, children }) {
  return (
    <div className="flex items-center gap-2 mb-3">
      <Icon size={13} className="text-slate-500" />
      <h2 className="text-xs font-semibold uppercase tracking-wider text-slate-500">{children}</h2>
    </div>
  )
}

export default function AdminSettings() {
  const { settings, updateSetting, loading } = useAppSettings()
  const [helpForm, setHelpForm] = useState({ message: '', email: '' })
  const [helpSaving, setHelpSaving] = useState(false)
  const [helpMsg, setHelpMsg] = useState({ text: '', ok: false })
  const [liveIndicator, setLiveIndicator] = useState(false)

  useEffect(() => {
    if (!loading) {
      setHelpForm({
        message: settings.help_message ?? '',
        email: settings.help_email ?? '',
      })
    }
  }, [loading, settings.help_message, settings.help_email])

  // Realtime subscription so changes from another admin session update live
  useEffect(() => {
    const channel = supabase.channel('admin-app-settings')
      .on('postgres_changes', { event: 'UPDATE', schema: 'public', table: 'app_settings' }, () => {
        setLiveIndicator(true)
        setTimeout(() => setLiveIndicator(false), 2000)
      })
      .subscribe()
    return () => { supabase.removeChannel(channel) }
  }, [])

  const toggleSetting = async (key) => {
    const newVal = settings[key] ? 'false' : 'true'
    await updateSetting(key, newVal)
  }

  const saveHelp = async () => {
    setHelpSaving(true); setHelpMsg({ text: '', ok: false })
    const [r1, r2] = await Promise.all([
      updateSetting('help_message', helpForm.message),
      updateSetting('help_email', helpForm.email),
    ])
    setHelpSaving(false)
    if (r1.error || r2.error) {
      setHelpMsg({ text: 'Failed to save. Check permissions.', ok: false })
    } else {
      setHelpMsg({ text: 'Saved.', ok: true })
      setTimeout(() => setHelpMsg({ text: '', ok: false }), 3000)
    }
  }

  return (
    <div className="p-4 max-w-2xl mx-auto pb-8">
      <div className="flex items-center justify-between mb-4">
        <h1 className="text-xl font-bold text-slate-100">App Settings</h1>
        <span className={`text-xs flex items-center gap-1.5 transition-colors ${liveIndicator ? 'text-emerald-400' : 'text-slate-600'}`}>
          <span className="w-1.5 h-1.5 rounded-full bg-current animate-pulse inline-block" />
          Live
        </span>
      </div>

      {/* Registration */}
      <div className="rounded-xl border p-4 mb-4" style={{ background: '#1a1d27', borderColor: '#2a2d3a' }}>
        <SectionLabel icon={UserCheck}>Registration</SectionLabel>
        <div className="flex flex-col gap-3">
          <div className="flex items-center justify-between gap-4 p-3 rounded-lg" style={{ background: '#0f1117' }}>
            <div>
              <p className="text-sm font-medium text-slate-200">Registration open</p>
              <p className="text-xs text-slate-500 mt-0.5">Allow new users to sign up. Turn off to block all new registrations.</p>
            </div>
            <Toggle checked={!!settings.registration_enabled} onChange={() => toggleSetting('registration_enabled')} disabled={loading} />
          </div>

          <div className={`flex items-center justify-between gap-4 p-3 rounded-lg transition-opacity ${!settings.registration_enabled ? 'opacity-40 pointer-events-none' : ''}`}
            style={{ background: '#0f1117' }}>
            <div>
              <p className="text-sm font-medium text-slate-200">Auto-approve registrations</p>
              <p className="text-xs text-slate-500 mt-0.5">New signups go straight to active — skip the pending queue. Requires registration to be open.</p>
            </div>
            <Toggle
              checked={!!settings.auto_approve_registrations}
              onChange={() => toggleSetting('auto_approve_registrations')}
              disabled={loading || !settings.registration_enabled}
            />
          </div>
        </div>
      </div>

      {/* Feature flags */}
      <div className="rounded-xl border p-4 mb-4" style={{ background: '#1a1d27', borderColor: '#2a2d3a' }}>
        <SectionLabel icon={Zap}>App Sections</SectionLabel>
        <p className="text-xs text-slate-500 mb-3 -mt-1">Toggle sections on or off for all users. Disabled sections are hidden from the navigation.</p>
        <div className="flex flex-col gap-2">
          {[
            { key: 'feature_incidents', label: 'Incidents',  desc: 'Incident log and timeline' },
            { key: 'feature_people',    label: 'People',     desc: 'Person profiles and relationships' },
            { key: 'feature_cases',     label: 'Cases',      desc: 'Legal cases and court dates' },
            { key: 'feature_documents', label: 'Documents',  desc: 'File uploads and document links' },
          ].map(({ key, label, desc }) => (
            <div key={key} className="flex items-center justify-between gap-4 p-3 rounded-lg" style={{ background: '#0f1117' }}>
              <div>
                <p className="text-sm font-medium text-slate-200">{label}</p>
                <p className="text-xs text-slate-500">{desc}</p>
              </div>
              <Toggle checked={settings[key] !== false} onChange={() => toggleSetting(key)} disabled={loading} />
            </div>
          ))}
        </div>
      </div>

      {/* Help & Contact */}
      <div className="rounded-xl border p-4" style={{ background: '#1a1d27', borderColor: '#2a2d3a' }}>
        <SectionLabel icon={HelpCircle}>Help &amp; Contact</SectionLabel>
        <p className="text-xs text-slate-500 mb-3 -mt-1">Shown to all users on their Settings page when filled in.</p>
        <div className="flex flex-col gap-3">
          <div>
            <p className="text-xs text-slate-500 mb-1.5">Help message</p>
            <textarea rows={3} value={helpForm.message} onChange={e => setHelpForm(f => ({ ...f, message: e.target.value }))}
              placeholder="e.g. For support, contact the system administrator."
              className={`${inputClass} resize-none`} style={inputStyle} />
          </div>
          <div>
            <p className="text-xs text-slate-500 mb-1.5">Help email</p>
            <input type="email" value={helpForm.email} onChange={e => setHelpForm(f => ({ ...f, email: e.target.value }))}
              placeholder="admin@example.com" className={inputClass} style={inputStyle} />
          </div>
          {helpMsg.text && <p className={`text-xs ${helpMsg.ok ? 'text-emerald-400' : 'text-red-400'}`}>{helpMsg.text}</p>}
          <button onClick={saveHelp} disabled={helpSaving}
            className="px-4 py-2 rounded-lg text-sm font-semibold text-white w-fit disabled:opacity-50"
            style={{ background: '#6366f1' }}>
            {helpSaving ? 'Saving…' : 'Save Help Info'}
          </button>
        </div>
      </div>
    </div>
  )
}
