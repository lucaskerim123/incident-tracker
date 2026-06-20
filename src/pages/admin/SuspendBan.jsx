import { useEffect, useState } from 'react'
import { format } from 'date-fns'
import { supabase } from '../../lib/supabase'
import { usePermissions } from '../../hooks/usePermissions'

const inputClass = 'w-full rounded-lg px-3 py-2 text-sm text-slate-100 border outline-none focus:border-indigo-500 transition-colors'
const inputStyle = { background: '#0f1117', borderColor: '#2a2d3a' }
const selectClass = 'text-xs rounded px-2 py-1 border text-slate-300 outline-none focus:border-indigo-500'
const selectStyle = { background: '#1a1d27', borderColor: '#2a2d3a' }

export default function SuspendBan() {
  const { isAdmin } = usePermissions()
  const [tab, setTab] = useState('suspend')

  const [allUsers, setAllUsers] = useState([])
  const [suspendedUsers, setSuspendedUsers] = useState([])
  const [bannedUsers, setBannedUsers] = useState([])

  const [suspendForm, setSuspendForm] = useState({ userId: '', reason: '', durationPreset: '7d', customDate: '' })
  const [suspendLoading, setSuspendLoading] = useState(false)
  const [suspendMsg, setSuspendMsg] = useState({ text: '', ok: false })

  const [banUserForm, setBanUserForm] = useState({ userId: '', reason: '', permanent: true, customDate: '' })
  const [banUserLoading, setBanUserLoading] = useState(false)
  const [banUserMsg, setBanUserMsg] = useState({ text: '', ok: false })

  const [banForm, setBanForm] = useState({ type: 'email', value: '', reason: '' })
  const [banLoading, setBanLoading] = useState(false)
  const [banMsg, setBanMsg] = useState({ text: '', ok: false })

  useEffect(() => {
    supabase.from('users').select('id, user_code, display_name, email, role, status').neq('role', 'admin').order('user_code')
      .then(({ data }) => setAllUsers(data ?? []))
    supabase.from('users').select('id, user_code, display_name, email, role, suspension_reason, suspension_expires_at').eq('status', 'suspended').order('user_code')
      .then(({ data }) => setSuspendedUsers(data ?? []))
    supabase.from('users').select('id, user_code, display_name, email, role, ban_reason, ban_expires_at').eq('status', 'blocked').order('user_code')
      .then(({ data }) => setBannedUsers(data ?? []))
  }, [])

  const eligibleForSuspend = allUsers.filter(u => u.status === 'active')
  const eligibleForBan = allUsers.filter(u => u.status === 'active' || u.status === 'suspended')

  const doSuspend = async (e) => {
    e.preventDefault()
    if (!suspendForm.userId) return
    setSuspendLoading(true); setSuspendMsg({ text: '', ok: false })
    let expiresAt = null
    if (suspendForm.durationPreset !== 'indefinite') {
      if (suspendForm.durationPreset === 'custom') {
        expiresAt = suspendForm.customDate || null
      } else {
        const days = { '1d': 1, '3d': 3, '7d': 7, '14d': 14, '30d': 30 }[suspendForm.durationPreset]
        const d = new Date(); d.setDate(d.getDate() + days)
        expiresAt = d.toISOString()
      }
    }
    const { error } = await supabase.rpc('suspend_user', {
      target_id: suspendForm.userId,
      reason: suspendForm.reason.trim() || null,
      expires_at: expiresAt,
    })
    setSuspendLoading(false)
    if (error) { setSuspendMsg({ text: `Error: ${error.message}`, ok: false }); return }
    const target = allUsers.find(u => u.id === suspendForm.userId)
    if (target) {
      setAllUsers(u => u.map(x => x.id === suspendForm.userId ? { ...x, status: 'suspended' } : x))
      setSuspendedUsers(s => [...s, { ...target, suspension_reason: suspendForm.reason.trim() || null, suspension_expires_at: expiresAt }])
    }
    setSuspendMsg({ text: 'User suspended.', ok: true })
    setSuspendForm({ userId: '', reason: '', durationPreset: '7d', customDate: '' })
    setTimeout(() => setSuspendMsg({ text: '', ok: false }), 3000)
  }

  const doUnsuspend = async (targetId) => {
    const { error } = await supabase.rpc('unsuspend_user', { target_id: targetId })
    if (error) { alert(`Failed: ${error.message}`); return }
    setSuspendedUsers(s => s.filter(x => x.id !== targetId))
    setAllUsers(u => u.map(x => x.id === targetId ? { ...x, status: 'active' } : x))
  }

  const doBanUser = async (e) => {
    e.preventDefault()
    if (!banUserForm.userId) return
    setBanUserLoading(true); setBanUserMsg({ text: '', ok: false })
    const expiresAt = banUserForm.permanent ? null : (banUserForm.customDate || null)
    const { error } = await supabase.rpc('ban_user', {
      target_id: banUserForm.userId,
      reason: banUserForm.reason.trim() || null,
      expires_at: expiresAt,
    })
    setBanUserLoading(false)
    if (error) { setBanUserMsg({ text: `Error: ${error.message}`, ok: false }); return }
    setSuspendedUsers(s => s.filter(x => x.id !== banUserForm.userId))
    const target = allUsers.find(u => u.id === banUserForm.userId)
    if (target) {
      setAllUsers(u => u.map(x => x.id === banUserForm.userId ? { ...x, status: 'blocked' } : x))
      setBannedUsers(b => [...b, { ...target, ban_reason: banUserForm.reason.trim() || null, ban_expires_at: expiresAt }])
    }
    setBanUserMsg({ text: 'User banned.', ok: true })
    setBanUserForm({ userId: '', reason: '', permanent: true, customDate: '' })
    setTimeout(() => setBanUserMsg({ text: '', ok: false }), 3000)
  }

  const doUnban = async (targetId) => {
    const { error } = await supabase.rpc('unban_user', { target_id: targetId })
    if (error) { alert(`Failed: ${error.message}`); return }
    setBannedUsers(b => b.filter(x => x.id !== targetId))
    setAllUsers(u => u.map(x => x.id === targetId ? { ...x, status: 'active' } : x))
  }

  const addBan = async (e) => {
    e.preventDefault()
    if (!banForm.value.trim()) return
    setBanLoading(true); setBanMsg({ text: '', ok: false })
    const { error } = await supabase.rpc('add_ban', {
      p_type: banForm.type,
      p_value: banForm.value.trim(),
      p_reason: banForm.reason.trim() || null,
    })
    setBanLoading(false)
    if (error) { setBanMsg({ text: `Error: ${error.message}`, ok: false }); return }
    setBanMsg({ text: 'Ban added.', ok: true })
    setBanForm(f => ({ ...f, value: '', reason: '' }))
    setTimeout(() => setBanMsg({ text: '', ok: false }), 3000)
  }

  const tabs = [
    { key: 'suspend', label: 'Suspend a User' },
    ...(isAdmin ? [{ key: 'ban', label: 'Ban a User' }] : []),
    { key: 'addban', label: 'Add IP / Email / User Ban' },
  ]

  return (
    <div className="p-4 max-w-2xl mx-auto pb-8">
      <h1 className="text-xl font-bold text-slate-100 mb-4">Suspend / Ban</h1>

      <div className="rounded-xl border" style={{ background: '#1a1d27', borderColor: '#2a2d3a' }}>
        {/* Tab bar */}
        <div className="flex border-b overflow-x-auto" style={{ borderColor: '#2a2d3a' }}>
          {tabs.map(t => (
            <button key={t.key} onClick={() => setTab(t.key)}
              className={`px-4 py-3 text-xs font-semibold border-b-2 transition-colors shrink-0 ${
                tab === t.key ? 'border-indigo-500 text-indigo-400' : 'border-transparent text-slate-500 hover:text-slate-300'
              }`}>
              {t.label}
            </button>
          ))}
        </div>

        <div className="p-4">
          {/* ── Suspend Tab ── */}
          {tab === 'suspend' && (
            <div className="flex flex-col gap-5">
              <form onSubmit={doSuspend} className="flex flex-col gap-3">
                <div>
                  <label className="text-xs text-slate-500 mb-1 block">User</label>
                  <select value={suspendForm.userId} onChange={e => setSuspendForm(f => ({ ...f, userId: e.target.value }))}
                    className={`${inputClass} text-xs`} style={inputStyle} required>
                    <option value="">Select a user…</option>
                    {eligibleForSuspend.map(u => (
                      <option key={u.id} value={u.id}>#{u.user_code} — {u.display_name ?? u.email ?? 'No name'}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="text-xs text-slate-500 mb-1 block">Reason <span className="text-slate-600">(optional)</span></label>
                  <input value={suspendForm.reason} onChange={e => setSuspendForm(f => ({ ...f, reason: e.target.value }))}
                    placeholder="e.g. spam, policy violation" className={inputClass} style={inputStyle} />
                </div>
                <div>
                  <label className="text-xs text-slate-500 mb-2 block">Duration</label>
                  <div className="flex flex-wrap gap-1.5">
                    {[
                      { key: '1d', label: '1 day' }, { key: '3d', label: '3 days' }, { key: '7d', label: '7 days' },
                      { key: '14d', label: '14 days' }, { key: '30d', label: '30 days' },
                      { key: 'indefinite', label: 'Indefinite' }, { key: 'custom', label: 'Custom…' },
                    ].map(({ key, label }) => (
                      <button key={key} type="button" onClick={() => setSuspendForm(f => ({ ...f, durationPreset: key }))}
                        className="px-2.5 py-1 rounded-lg text-xs font-medium transition-colors"
                        style={suspendForm.durationPreset === key
                          ? { background: 'rgba(234,179,8,0.2)', color: '#eab308' }
                          : { background: '#0f1117', color: '#64748b' }}>
                        {label}
                      </button>
                    ))}
                  </div>
                  {suspendForm.durationPreset === 'custom' && (
                    <input type="datetime-local" value={suspendForm.customDate}
                      onChange={e => setSuspendForm(f => ({ ...f, customDate: e.target.value }))}
                      className={`mt-2 ${inputClass} text-xs`} style={inputStyle} />
                  )}
                </div>
                {suspendMsg.text && <p className={`text-xs ${suspendMsg.ok ? 'text-emerald-400' : 'text-red-400'}`}>{suspendMsg.text}</p>}
                <div>
                  <button type="submit" disabled={suspendLoading || !suspendForm.userId}
                    className="px-4 py-2 rounded-lg text-xs font-semibold disabled:opacity-50"
                    style={{ background: 'rgba(234,179,8,0.2)', color: '#eab308' }}>
                    {suspendLoading ? 'Suspending…' : 'Suspend User'}
                  </button>
                </div>
              </form>

              {suspendedUsers.length > 0 && (
                <div>
                  <p className="text-xs text-slate-500 mb-2 font-semibold uppercase tracking-wider">Currently Suspended ({suspendedUsers.length})</p>
                  <div className="flex flex-col gap-1.5">
                    {suspendedUsers.map(u => (
                      <div key={u.id} className="flex items-center justify-between gap-2 p-2.5 rounded-lg" style={{ background: '#0f1117' }}>
                        <div className="flex flex-col gap-0.5 min-w-0">
                          <div className="flex items-center gap-2">
                            <span className="text-xs font-mono text-slate-400">#{u.user_code}</span>
                            <span className="text-xs text-slate-300 truncate">{u.display_name ?? u.email ?? 'No name'}</span>
                          </div>
                          <div className="flex items-center gap-2 flex-wrap">
                            {u.suspension_reason
                              ? <span className="text-xs text-slate-600">"{u.suspension_reason}"</span>
                              : <span className="text-xs text-slate-700 italic">No reason</span>}
                            <span className="text-xs font-medium" style={{ color: '#eab308' }}>
                              {u.suspension_expires_at
                                ? `Until ${format(new Date(u.suspension_expires_at), 'd MMM yyyy HH:mm')}`
                                : 'Indefinitely'}
                            </span>
                          </div>
                        </div>
                        <div className="flex items-center gap-1 shrink-0">
                          <button onClick={() => doUnsuspend(u.id)}
                            className="px-2 py-1 rounded text-xs font-medium text-emerald-400 hover:bg-emerald-500/10 transition-colors">
                            Unsuspend
                          </button>
                          {isAdmin && (
                            <button onClick={() => { setTab('ban'); setBanUserForm(f => ({ ...f, userId: u.id })) }}
                              className="px-2 py-1 rounded text-xs font-medium text-red-400 hover:bg-red-500/10 transition-colors">
                              → Ban
                            </button>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}

          {/* ── Ban User Tab (admin only) ── */}
          {tab === 'ban' && isAdmin && (
            <div className="flex flex-col gap-5">
              <form onSubmit={doBanUser} className="flex flex-col gap-3">
                <div>
                  <label className="text-xs text-slate-500 mb-1 block">User</label>
                  <select value={banUserForm.userId} onChange={e => setBanUserForm(f => ({ ...f, userId: e.target.value }))}
                    className={`${inputClass} text-xs`} style={inputStyle} required>
                    <option value="">Select a user…</option>
                    {eligibleForBan.map(u => (
                      <option key={u.id} value={u.id}>
                        #{u.user_code} — {u.display_name ?? u.email ?? 'No name'}{u.status === 'suspended' ? ' (suspended)' : ''}
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="text-xs text-slate-500 mb-1 block">Reason <span className="text-slate-600">(optional)</span></label>
                  <input value={banUserForm.reason} onChange={e => setBanUserForm(f => ({ ...f, reason: e.target.value }))}
                    placeholder="e.g. abuse, repeated violations" className={inputClass} style={inputStyle} />
                </div>
                <div>
                  <label className="text-xs text-slate-500 mb-2 block">Duration</label>
                  <div className="flex gap-1.5">
                    {[{ permanent: true, label: 'Permanent' }, { permanent: false, label: 'Custom date…' }].map(({ permanent, label }) => (
                      <button key={String(permanent)} type="button" onClick={() => setBanUserForm(f => ({ ...f, permanent }))}
                        className="px-2.5 py-1 rounded-lg text-xs font-medium transition-colors"
                        style={banUserForm.permanent === permanent
                          ? { background: 'rgba(239,68,68,0.2)', color: '#f87171' }
                          : { background: '#0f1117', color: '#64748b' }}>
                        {label}
                      </button>
                    ))}
                  </div>
                  {!banUserForm.permanent && (
                    <input type="datetime-local" value={banUserForm.customDate}
                      onChange={e => setBanUserForm(f => ({ ...f, customDate: e.target.value }))}
                      className={`mt-2 ${inputClass} text-xs`} style={inputStyle} />
                  )}
                </div>
                {banUserMsg.text && <p className={`text-xs ${banUserMsg.ok ? 'text-emerald-400' : 'text-red-400'}`}>{banUserMsg.text}</p>}
                <div>
                  <button type="submit" disabled={banUserLoading || !banUserForm.userId}
                    className="px-4 py-2 rounded-lg text-xs font-semibold text-white disabled:opacity-50"
                    style={{ background: '#ef4444' }}>
                    {banUserLoading ? 'Banning…' : 'Ban User'}
                  </button>
                </div>
              </form>

              {bannedUsers.length > 0 && (
                <div>
                  <p className="text-xs text-slate-500 mb-2 font-semibold uppercase tracking-wider">Currently Banned ({bannedUsers.length})</p>
                  <div className="flex flex-col gap-1.5">
                    {bannedUsers.map(u => (
                      <div key={u.id} className="flex items-center justify-between gap-2 p-2.5 rounded-lg" style={{ background: '#0f1117' }}>
                        <div className="flex flex-col gap-0.5 min-w-0">
                          <div className="flex items-center gap-2">
                            <span className="text-xs font-mono text-slate-400">#{u.user_code}</span>
                            <span className="text-xs text-slate-300 truncate">{u.display_name ?? u.email ?? 'No name'}</span>
                          </div>
                          <div className="flex items-center gap-2 flex-wrap">
                            {u.ban_reason ? <span className="text-xs text-slate-600">"{u.ban_reason}"</span> : <span className="text-xs text-slate-700 italic">No reason</span>}
                            <span className="text-xs font-semibold text-red-400">
                              {u.ban_expires_at ? `Until ${format(new Date(u.ban_expires_at), 'd MMM yyyy HH:mm')}` : 'Permanent'}
                            </span>
                          </div>
                        </div>
                        <button onClick={() => doUnban(u.id)}
                          className="px-2 py-1 rounded text-xs font-medium text-emerald-400 hover:bg-emerald-500/10 transition-colors shrink-0">
                          Unban
                        </button>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}

          {/* ── Add IP / Email / User Ban Tab ── */}
          {tab === 'addban' && (
            <div className="flex flex-col gap-4">
              <p className="text-xs text-slate-500">
                Block access by IP address, email address, or user ID. These bans are enforced at the authentication layer and appear in the Ban List.
              </p>
              <form onSubmit={addBan} className="flex flex-col gap-3">
                <div>
                  <label className="text-xs text-slate-500 mb-1 block">Type</label>
                  <select value={banForm.type} onChange={e => setBanForm(f => ({ ...f, type: e.target.value }))}
                    className={selectClass} style={{ ...selectStyle, padding: '8px 12px', borderRadius: 8, width: '100%', fontSize: 13 }}>
                    <option value="email">Email address</option>
                    <option value="ip">IP address</option>
                    <option value="user">User ID</option>
                  </select>
                </div>
                <div>
                  <label className="text-xs text-slate-500 mb-1 block">Value</label>
                  <input value={banForm.value} onChange={e => setBanForm(f => ({ ...f, value: e.target.value }))}
                    placeholder={banForm.type === 'ip' ? '192.168.1.1' : banForm.type === 'email' ? 'user@example.com' : 'user-uuid…'}
                    className={inputClass} style={inputStyle} required />
                </div>
                <div>
                  <label className="text-xs text-slate-500 mb-1 block">Reason <span className="text-slate-600">(optional)</span></label>
                  <input value={banForm.reason} onChange={e => setBanForm(f => ({ ...f, reason: e.target.value }))}
                    placeholder="e.g. spam, abuse" className={inputClass} style={inputStyle} />
                </div>
                {banMsg.text && <p className={`text-xs ${banMsg.ok ? 'text-emerald-400' : 'text-red-400'}`}>{banMsg.text}</p>}
                <div>
                  <button type="submit" disabled={banLoading || !banForm.value.trim()}
                    className="px-4 py-2 rounded-lg text-xs font-semibold text-white disabled:opacity-50"
                    style={{ background: '#ef4444' }}>
                    {banLoading ? 'Adding…' : 'Add Ban'}
                  </button>
                </div>
              </form>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
