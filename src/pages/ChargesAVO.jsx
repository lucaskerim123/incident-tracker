import { useEffect, useState, useRef } from 'react'
import { format, differenceInDays } from 'date-fns'
import { Plus, Pencil, Trash2, X, Search, Upload, FileText, AlertCircle } from 'lucide-react'
import { supabase } from '../lib/supabase'
import { useAuth } from '../hooks/useAuth'
import { usePermissions } from '../hooks/usePermissions'
import ConfirmDialog from '../components/ConfirmDialog'
import DocumentViewer from '../components/DocumentViewer'

const IC = 'w-full rounded-lg px-3 py-2 text-sm text-slate-100 border outline-none focus:border-indigo-500 transition-colors'
const IS = { background: '#0f1117', borderColor: '#2a2d3a' }

// ─── Charges ────────────────────────────────────────────────────────────────

const CHARGE_STATUS  = ['pending', 'adjourned', 'finalised', 'withdrawn']
const BREACH_TYPES   = ['avo', 'bail', 'ico']
const PLEA_OPTIONS   = ['no plea', 'guilty', 'not guilty']

const CHARGE_STATUS_STYLE = {
  pending:    { bg: 'rgba(249,115,22,0.12)',  text: '#fb923c' },
  adjourned:  { bg: 'rgba(234,179,8,0.12)',   text: '#eab308' },
  finalised:  { bg: 'rgba(16,185,129,0.12)',  text: '#34d399' },
  withdrawn:  { bg: 'rgba(148,163,184,0.12)', text: '#94a3b8' },
}

const BREACH_STYLE = {
  avo:  { bg: 'rgba(239,68,68,0.12)',   text: '#f87171' },
  bail: { bg: 'rgba(249,115,22,0.12)',  text: '#fb923c' },
  ico:  { bg: 'rgba(139,92,246,0.12)', text: '#a78bfa' },
}

const EMPTY_CHARGE = { charge_number: '', date_of_charge: '', breach_type: '', linked_incident_id: '', plea: '', outcome: '', status: 'pending', notes: '', fact_sheet_url: '' }

function ChargeForm({ initial = EMPTY_CHARGE, incidents, onSave, onCancel }) {
  const [form, setForm] = useState(initial)
  const [error, setError] = useState('')
  const set = (k, v) => setForm(f => ({ ...f, [k]: v }))

  const handleSave = () => {
    if (!form.status) { setError('Status is required.'); return }
    setError('')
    onSave(form)
  }

  return (
    <div className="flex flex-col gap-2">
      <div className="grid grid-cols-2 gap-2">
        <input placeholder="Charge number (H …)" value={form.charge_number} onChange={e => set('charge_number', e.target.value)}
          className={IC} style={IS} />
        <input type="date" value={form.date_of_charge} onChange={e => set('date_of_charge', e.target.value)}
          className={IC} style={{ ...IS, colorScheme: 'dark' }} />
      </div>
      <div className="grid grid-cols-2 gap-2">
        <select value={form.breach_type} onChange={e => set('breach_type', e.target.value)} className={IC} style={IS}>
          <option value="">No breach type</option>
          {BREACH_TYPES.map(b => <option key={b} value={b}>{b.toUpperCase()}</option>)}
        </select>
        <select value={form.status} onChange={e => set('status', e.target.value)} className={IC} style={IS}>
          {CHARGE_STATUS.map(s => <option key={s} value={s}>{s.charAt(0).toUpperCase() + s.slice(1)}</option>)}
        </select>
      </div>
      <select value={form.plea} onChange={e => set('plea', e.target.value)} className={IC} style={IS}>
        <option value="">No plea recorded</option>
        {PLEA_OPTIONS.map(p => <option key={p} value={p}>{p.charAt(0).toUpperCase() + p.slice(1)}</option>)}
      </select>
      <select value={form.linked_incident_id} onChange={e => set('linked_incident_id', e.target.value)} className={IC} style={IS}>
        <option value="">No linked incident</option>
        {incidents.map(i => <option key={i.id} value={i.id}>{i.title}</option>)}
      </select>
      <textarea rows={2} placeholder="Outcome" value={form.outcome} onChange={e => set('outcome', e.target.value)}
        className={`${IC} resize-none`} style={IS} />
      <textarea rows={2} placeholder="Notes" value={form.notes} onChange={e => set('notes', e.target.value)}
        className={`${IC} resize-none`} style={IS} />
      <input type="url" placeholder="Fact sheet URL (optional)" value={form.fact_sheet_url} onChange={e => set('fact_sheet_url', e.target.value)}
        className={IC} style={IS} />
      {error && <p className="text-xs text-red-400">{error}</p>}
      <div className="flex gap-2 justify-end">
        <button onClick={onCancel} className="px-3 py-1.5 rounded-lg text-sm text-slate-400 hover:text-slate-200 border"
          style={{ background: '#1a1d27', borderColor: '#2a2d3a' }}>
          <X size={14} className="inline mr-1" />Cancel
        </button>
        <button onClick={handleSave} className="px-3 py-1.5 rounded-lg text-sm font-semibold text-white"
          style={{ background: '#6366f1' }}>
          Save
        </button>
      </div>
    </div>
  )
}

function ChargeCard({ charge, incidentTitle, docs, canManage, canUpload, onEdit, onDelete, userId }) {
  const st = CHARGE_STATUS_STYLE[charge.status] ?? CHARGE_STATUS_STYLE.pending
  const br = charge.breach_type ? BREACH_STYLE[charge.breach_type] : null
  const [uploading, setUploading] = useState(false)
  const [cardDocs, setCardDocs] = useState(docs)
  const fileRef = useRef(null)

  useEffect(() => { setCardDocs(docs) }, [docs])

  const uploadFile = async (file) => {
    if (!file) return
    setUploading(true)
    const path = `${userId}/${Date.now()}_${file.name}`
    const { error: upErr } = await supabase.storage.from('documents').upload(path, file)
    if (!upErr) {
      const { data } = await supabase.from('documents')
        .insert({ user_id: userId, title: file.name, file_path: path, category: 'legal', related_charge_id: charge.id })
        .select().single()
      if (data) setCardDocs(d => [...d, data])
    }
    setUploading(false)
  }

  return (
    <div className="rounded-xl border" style={{ background: '#1a1d27', borderColor: '#2a2d3a' }}>
      <div className="p-3.5">
        <div className="flex items-start justify-between gap-2 mb-2">
          <div className="flex flex-wrap gap-1.5">
            {charge.charge_number && (
              <span className="text-xs font-mono text-slate-400 px-2 py-0.5 rounded" style={{ background: '#0f1117' }}>{charge.charge_number}</span>
            )}
            <span style={{ ...st, padding: '2px 8px', fontSize: 11, borderRadius: 5, fontWeight: 600 }}>{charge.status}</span>
            {br && <span style={{ ...br, padding: '2px 8px', fontSize: 11, borderRadius: 5, fontWeight: 600 }}>Breach: {charge.breach_type.toUpperCase()}</span>}
            {charge.plea && charge.plea !== 'no plea' && (
              <span className="text-[11px] px-2 py-0.5 rounded font-semibold" style={{ background: 'rgba(99,102,241,0.12)', color: '#818cf8' }}>
                {charge.plea}
              </span>
            )}
          </div>
          {charge.date_of_charge && (
            <time className="text-xs text-slate-500 shrink-0">{format(new Date(charge.date_of_charge), 'd MMM yyyy')}</time>
          )}
        </div>

        {incidentTitle && (
          <p className="text-xs text-slate-500 mb-2">Linked: <span className="text-slate-400">{incidentTitle}</span></p>
        )}
        {charge.outcome && (
          <p className="text-sm text-slate-300 mb-2 leading-relaxed">{charge.outcome}</p>
        )}
        {charge.notes && (
          <p className="text-xs text-slate-500 leading-relaxed">{charge.notes}</p>
        )}
        {charge.fact_sheet_url && (
          <a href={charge.fact_sheet_url} target="_blank" rel="noopener noreferrer"
            className="inline-flex items-center gap-1.5 mt-2 text-xs text-indigo-400 hover:text-indigo-300 transition-colors">
            <FileText size={11} /> Fact sheet
          </a>
        )}
      </div>

      {/* Fact sheets */}
      {(cardDocs.length > 0 || canUpload) && (
        <div className="px-3.5 pb-3.5 border-t pt-3" style={{ borderColor: '#2a2d3a' }}>
          {cardDocs.length > 0 && (
            <div className="flex flex-col gap-1.5 mb-2">
              {cardDocs.map(d => <DocumentViewer key={d.id} doc={d} />)}
            </div>
          )}
          {canUpload && (
            <>
              <input ref={fileRef} type="file" className="hidden" onChange={e => uploadFile(e.target.files?.[0])} />
              <button onClick={() => fileRef.current?.click()} disabled={uploading}
                className="flex items-center gap-1.5 text-xs text-slate-500 hover:text-indigo-400 transition-colors disabled:opacity-40">
                <Upload size={12} /> {uploading ? 'Uploading…' : 'Add fact sheet'}
              </button>
            </>
          )}
        </div>
      )}

      {canManage && (
        <div className="flex justify-end gap-0.5 px-2 pb-2">
          <button onClick={onEdit} className="p-1.5 rounded text-slate-600 hover:text-indigo-400 hover:bg-indigo-500/10 transition-colors">
            <Pencil size={13} />
          </button>
          <button onClick={onDelete} className="p-1.5 rounded text-slate-600 hover:text-red-400 hover:bg-red-500/10 transition-colors">
            <Trash2 size={13} />
          </button>
        </div>
      )}
    </div>
  )
}

// ─── Court Orders ────────────────────────────────────────────────────────────

const ORDER_TYPES  = ['AVO', 'ICO', 'CCO']
const ORDER_STATUS = ['active', 'withdrawn', 'expired']

const ORDER_STATUS_STYLE = {
  active:    { bg: 'rgba(239,68,68,0.12)',   text: '#f87171' },
  withdrawn: { bg: 'rgba(148,163,184,0.12)', text: '#94a3b8' },
  expired:   { bg: 'rgba(100,116,139,0.12)', text: '#64748b' },
}

const ORDER_TYPE_STYLE = {
  AVO: { bg: 'rgba(239,68,68,0.15)',   text: '#f87171' },
  ICO: { bg: 'rgba(139,92,246,0.15)', text: '#a78bfa' },
  CCO: { bg: 'rgba(249,115,22,0.15)', text: '#fb923c' },
}

const EMPTY_ORDER = { order_type: 'AVO', protecting_who: '', protected_from: '', status: 'active', conditions: '', expiry_date: '', notes: '' }

function OrderForm({ initial = EMPTY_ORDER, onSave, onCancel }) {
  const [form, setForm] = useState(initial)
  const [error, setError] = useState('')
  const set = (k, v) => setForm(f => ({ ...f, [k]: v }))

  const handleSave = () => {
    if (!form.order_type) { setError('Order type is required.'); return }
    setError('')
    onSave(form)
  }

  return (
    <div className="flex flex-col gap-2">
      <div className="grid grid-cols-2 gap-2">
        <select value={form.order_type} onChange={e => set('order_type', e.target.value)} className={IC} style={IS}>
          {ORDER_TYPES.map(t => <option key={t} value={t}>{t}</option>)}
        </select>
        <select value={form.status} onChange={e => set('status', e.target.value)} className={IC} style={IS}>
          {ORDER_STATUS.map(s => <option key={s} value={s}>{s.charAt(0).toUpperCase() + s.slice(1)}</option>)}
        </select>
      </div>
      <input placeholder="Protecting who" value={form.protecting_who} onChange={e => set('protecting_who', e.target.value)}
        className={IC} style={IS} />
      <input placeholder="Protected from (defendant)" value={form.protected_from} onChange={e => set('protected_from', e.target.value)}
        className={IC} style={IS} />
      <textarea rows={3} placeholder="Conditions" value={form.conditions} onChange={e => set('conditions', e.target.value)}
        className={`${IC} resize-none`} style={IS} />
      <div className="grid grid-cols-2 gap-2">
        <div>
          <label className="block text-xs text-slate-500 mb-1">Expiry date</label>
          <input type="date" value={form.expiry_date} onChange={e => set('expiry_date', e.target.value)}
            className={IC} style={{ ...IS, colorScheme: 'dark' }} />
        </div>
        <div />
      </div>
      <textarea rows={2} placeholder="Notes" value={form.notes} onChange={e => set('notes', e.target.value)}
        className={`${IC} resize-none`} style={IS} />
      {error && <p className="text-xs text-red-400">{error}</p>}
      <div className="flex gap-2 justify-end">
        <button onClick={onCancel} className="px-3 py-1.5 rounded-lg text-sm text-slate-400 hover:text-slate-200 border"
          style={{ background: '#1a1d27', borderColor: '#2a2d3a' }}>
          <X size={14} className="inline mr-1" />Cancel
        </button>
        <button onClick={handleSave} className="px-3 py-1.5 rounded-lg text-sm font-semibold text-white"
          style={{ background: '#6366f1' }}>
          Save
        </button>
      </div>
    </div>
  )
}

function OrderCard({ order, canManage, onEdit, onDelete }) {
  const st  = ORDER_STATUS_STYLE[order.status]  ?? ORDER_STATUS_STYLE.active
  const ot  = ORDER_TYPE_STYLE[order.order_type] ?? {}
  const daysLeft = order.expiry_date ? differenceInDays(new Date(order.expiry_date), new Date()) : null
  const expiringSoon = daysLeft !== null && daysLeft >= 0 && daysLeft <= 30

  return (
    <div className="rounded-xl border p-3.5" style={{ background: '#1a1d27', borderColor: expiringSoon ? 'rgba(249,115,22,0.4)' : '#2a2d3a' }}>
      <div className="flex items-start justify-between gap-2 mb-2">
        <div className="flex flex-wrap gap-1.5">
          <span style={{ ...ot, padding: '2px 8px', fontSize: 11, borderRadius: 5, fontWeight: 700 }}>{order.order_type}</span>
          <span style={{ ...st, padding: '2px 8px', fontSize: 11, borderRadius: 5, fontWeight: 600 }}>{order.status}</span>
        </div>
        {order.expiry_date && (
          <div className="text-right shrink-0">
            <time className={`text-xs ${expiringSoon ? 'text-orange-400' : 'text-slate-500'}`}>
              Expires {format(new Date(order.expiry_date), 'd MMM yyyy')}
            </time>
            {expiringSoon && daysLeft > 0 && (
              <p className="text-[10px] text-orange-400 flex items-center gap-1 justify-end mt-0.5">
                <AlertCircle size={9} />{daysLeft}d remaining
              </p>
            )}
            {daysLeft === 0 && <p className="text-[10px] text-red-400 mt-0.5">Expires today</p>}
          </div>
        )}
      </div>

      {(order.protecting_who || order.protected_from) && (
        <div className="flex items-center gap-2 mb-2 text-sm">
          {order.protecting_who && <span className="text-slate-300">{order.protecting_who}</span>}
          {order.protecting_who && order.protected_from && <span className="text-slate-600">vs</span>}
          {order.protected_from && <span className="text-slate-300">{order.protected_from}</span>}
        </div>
      )}

      {order.conditions && (
        <p className="text-sm text-slate-400 whitespace-pre-wrap leading-relaxed mb-2">{order.conditions}</p>
      )}
      {order.notes && (
        <p className="text-xs text-slate-500 leading-relaxed">{order.notes}</p>
      )}

      {canManage && (
        <div className="flex justify-end gap-0.5 mt-2">
          <button onClick={onEdit} className="p-1.5 rounded text-slate-600 hover:text-indigo-400 hover:bg-indigo-500/10 transition-colors">
            <Pencil size={13} />
          </button>
          <button onClick={onDelete} className="p-1.5 rounded text-slate-600 hover:text-red-400 hover:bg-red-500/10 transition-colors">
            <Trash2 size={13} />
          </button>
        </div>
      )}
    </div>
  )
}

// ─── Main Page ───────────────────────────────────────────────────────────────

export default function ChargesAVO() {
  const { user } = useAuth()
  const { can } = usePermissions()
  const [tab, setTab] = useState('charges')

  // Charges state
  const [charges, setCharges] = useState([])
  const [chargeDocs, setChargeDocs] = useState({})
  const [incidents, setIncidents] = useState([])
  const [chargesLoading, setChargesLoading] = useState(true)
  const [showChargeForm, setShowChargeForm] = useState(false)
  const [editingCharge, setEditingCharge] = useState(null)
  const [confirmDeleteCharge, setConfirmDeleteCharge] = useState(null)
  const [chargeSearch, setChargeSearch] = useState('')

  // Orders state
  const [orders, setOrders] = useState([])
  const [ordersLoading, setOrdersLoading] = useState(true)
  const [showOrderForm, setShowOrderForm] = useState(false)
  const [editingOrder, setEditingOrder] = useState(null)
  const [confirmDeleteOrder, setConfirmDeleteOrder] = useState(null)
  const [orderSearch, setOrderSearch] = useState('')

  useEffect(() => {
    if (!user) return
    // Load charges + related docs
    Promise.all([
      supabase.from('charges').select('*').order('created_at', { ascending: false }),
      supabase.from('documents').select('*').not('related_charge_id', 'is', null),
      supabase.from('incidents').select('id, title').order('date', { ascending: false }),
    ]).then(([cRes, dRes, iRes]) => {
      setCharges(cRes.data ?? [])
      const docMap = {}
      ;(dRes.data ?? []).forEach(d => {
        if (!docMap[d.related_charge_id]) docMap[d.related_charge_id] = []
        docMap[d.related_charge_id].push(d)
      })
      setChargeDocs(docMap)
      setIncidents(iRes.data ?? [])
      setChargesLoading(false)
    })

    // Load orders
    supabase.from('court_orders').select('*').order('created_at', { ascending: false })
      .then(({ data }) => { setOrders(data ?? []); setOrdersLoading(false) })
  }, [user])

  // ─── Charges CRUD ───
  const saveCharge = async (form) => {
    const payload = {
      charge_number:      form.charge_number || null,
      date_of_charge:     form.date_of_charge || null,
      breach_type:        form.breach_type || null,
      linked_incident_id: form.linked_incident_id || null,
      plea:               form.plea || null,
      outcome:            form.outcome || null,
      status:             form.status,
      notes:              form.notes || null,
      fact_sheet_url:     form.fact_sheet_url || null,
    }
    if (editingCharge) {
      const { data } = await supabase.from('charges').update(payload).eq('id', editingCharge.id).select().single()
      if (data) setCharges(c => c.map(x => x.id === data.id ? data : x))
      setEditingCharge(null)
    } else {
      const { data } = await supabase.from('charges').insert({ ...payload, user_id: user.id }).select().single()
      if (data) setCharges(c => [data, ...c])
      setShowChargeForm(false)
    }
  }

  const deleteCharge = async () => {
    if (!confirmDeleteCharge) return
    await supabase.from('charges').delete().eq('id', confirmDeleteCharge)
    setCharges(c => c.filter(x => x.id !== confirmDeleteCharge))
    setConfirmDeleteCharge(null)
  }

  // ─── Orders CRUD ───
  const saveOrder = async (form) => {
    const payload = {
      order_type:     form.order_type,
      protecting_who: form.protecting_who || null,
      protected_from: form.protected_from || null,
      status:         form.status,
      conditions:     form.conditions || null,
      expiry_date:    form.expiry_date || null,
      notes:          form.notes || null,
    }
    if (editingOrder) {
      const { data } = await supabase.from('court_orders').update(payload).eq('id', editingOrder.id).select().single()
      if (data) setOrders(o => o.map(x => x.id === data.id ? data : x))
      setEditingOrder(null)
    } else {
      const { data } = await supabase.from('court_orders').insert({ ...payload, user_id: user.id }).select().single()
      if (data) setOrders(o => [data, ...o])
      setShowOrderForm(false)
    }
  }

  const deleteOrder = async () => {
    if (!confirmDeleteOrder) return
    await supabase.from('court_orders').delete().eq('id', confirmDeleteOrder)
    setOrders(o => o.filter(x => x.id !== confirmDeleteOrder))
    setConfirmDeleteOrder(null)
  }

  // ─── Filtered lists ───
  const incidentMap = Object.fromEntries(incidents.map(i => [i.id, i.title]))

  const filteredCharges = charges.filter(c => {
    if (!chargeSearch.trim()) return true
    const q = chargeSearch.toLowerCase()
    return (
      c.charge_number?.toLowerCase().includes(q) ||
      c.outcome?.toLowerCase().includes(q) ||
      c.notes?.toLowerCase().includes(q) ||
      c.breach_type?.toLowerCase().includes(q) ||
      incidentMap[c.linked_incident_id]?.toLowerCase().includes(q)
    )
  })

  const filteredOrders = orders.filter(o => {
    if (!orderSearch.trim()) return true
    const q = orderSearch.toLowerCase()
    return (
      o.protecting_who?.toLowerCase().includes(q) ||
      o.protected_from?.toLowerCase().includes(q) ||
      o.conditions?.toLowerCase().includes(q) ||
      o.notes?.toLowerCase().includes(q) ||
      o.order_type?.toLowerCase().includes(q)
    )
  })

  return (
    <div className="p-4 max-w-2xl mx-auto pb-8">
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <h1 className="text-xl font-bold text-slate-100">Charges / AVO</h1>
        {can.manageCases && (
          <button
            onClick={() => tab === 'charges' ? setShowChargeForm(true) : setShowOrderForm(true)}
            className="flex items-center gap-1.5 px-3 py-2 rounded-lg text-sm font-semibold text-white"
            style={{ background: '#6366f1' }}>
            <Plus size={16} /> Add
          </button>
        )}
      </div>

      {/* Tabs */}
      <div className="flex gap-1 mb-4 p-1 rounded-lg" style={{ background: '#1a1d27' }}>
        {[{ id: 'charges', label: 'Charges' }, { id: 'orders', label: 'Court Orders (AVO / ICO / CCO)' }].map(t => (
          <button key={t.id} onClick={() => setTab(t.id)}
            className={`flex-1 py-1.5 rounded-md text-sm font-medium transition-colors ${tab === t.id ? 'text-slate-100' : 'text-slate-500 hover:text-slate-300'}`}
            style={tab === t.id ? { background: '#2a2d3a' } : {}}>
            {t.label}
          </button>
        ))}
      </div>

      {/* ─── CHARGES TAB ─── */}
      {tab === 'charges' && (
        <>
          {/* New charge form */}
          {showChargeForm && (
            <div className="rounded-xl border p-4 mb-3" style={{ background: '#1a1d27', borderColor: '#6366f1' }}>
              <h3 className="text-sm font-semibold text-slate-200 mb-3">New Charge</h3>
              <ChargeForm incidents={incidents} onSave={saveCharge} onCancel={() => setShowChargeForm(false)} />
            </div>
          )}

          {/* Search */}
          {charges.length > 0 && (
            <div className="relative mb-3">
              <Search size={14} className="absolute left-3 top-2.5 text-slate-500 pointer-events-none" />
              <input type="text" placeholder="Search charges…" value={chargeSearch} onChange={e => setChargeSearch(e.target.value)}
                className="w-full pl-9 pr-3 py-2 rounded-lg text-sm text-slate-100 border outline-none focus:border-indigo-500 transition-colors"
                style={{ background: '#1a1d27', borderColor: '#2a2d3a' }} />
            </div>
          )}

          {chargesLoading ? (
            <div className="flex justify-center py-12">
              <div className="w-6 h-6 border-2 border-indigo-500 border-t-transparent rounded-full animate-spin" />
            </div>
          ) : filteredCharges.length === 0 ? (
            <div className="rounded-xl p-10 border text-center" style={{ background: '#1a1d27', borderColor: '#2a2d3a' }}>
              <p className="text-slate-400 text-sm">
                {charges.length === 0 ? 'No charges recorded yet.' : 'No charges match your search.'}
              </p>
            </div>
          ) : (
            <div className="flex flex-col gap-2">
              <p className="text-xs text-slate-500 mb-1">{filteredCharges.length} charge{filteredCharges.length !== 1 ? 's' : ''}</p>
              {filteredCharges.map(c => (
                editingCharge?.id === c.id ? (
                  <div key={c.id} className="rounded-xl border p-4" style={{ background: '#1a1d27', borderColor: '#6366f1' }}>
                    <h3 className="text-sm font-semibold text-slate-200 mb-3">Edit Charge</h3>
                    <ChargeForm initial={c} incidents={incidents} onSave={saveCharge} onCancel={() => setEditingCharge(null)} />
                  </div>
                ) : (
                  <ChargeCard
                    key={c.id}
                    charge={c}
                    incidentTitle={incidentMap[c.linked_incident_id]}
                    docs={chargeDocs[c.id] ?? []}
                    canManage={can.manageCases}
                    canUpload={can.upload}
                    onEdit={() => setEditingCharge(c)}
                    onDelete={() => setConfirmDeleteCharge(c.id)}
                    userId={user?.id}
                  />
                )
              ))}
            </div>
          )}
        </>
      )}

      {/* ─── ORDERS TAB ─── */}
      {tab === 'orders' && (
        <>
          {/* New order form */}
          {showOrderForm && (
            <div className="rounded-xl border p-4 mb-3" style={{ background: '#1a1d27', borderColor: '#6366f1' }}>
              <h3 className="text-sm font-semibold text-slate-200 mb-3">New Court Order</h3>
              <OrderForm onSave={saveOrder} onCancel={() => setShowOrderForm(false)} />
            </div>
          )}

          {/* Search */}
          {orders.length > 0 && (
            <div className="relative mb-3">
              <Search size={14} className="absolute left-3 top-2.5 text-slate-500 pointer-events-none" />
              <input type="text" placeholder="Search orders…" value={orderSearch} onChange={e => setOrderSearch(e.target.value)}
                className="w-full pl-9 pr-3 py-2 rounded-lg text-sm text-slate-100 border outline-none focus:border-indigo-500 transition-colors"
                style={{ background: '#1a1d27', borderColor: '#2a2d3a' }} />
            </div>
          )}

          {ordersLoading ? (
            <div className="flex justify-center py-12">
              <div className="w-6 h-6 border-2 border-indigo-500 border-t-transparent rounded-full animate-spin" />
            </div>
          ) : filteredOrders.length === 0 ? (
            <div className="rounded-xl p-10 border text-center" style={{ background: '#1a1d27', borderColor: '#2a2d3a' }}>
              <p className="text-slate-400 text-sm">
                {orders.length === 0 ? 'No court orders recorded yet.' : 'No orders match your search.'}
              </p>
            </div>
          ) : (
            <div className="flex flex-col gap-2">
              <p className="text-xs text-slate-500 mb-1">{filteredOrders.length} order{filteredOrders.length !== 1 ? 's' : ''}</p>
              {filteredOrders.map(o => (
                editingOrder?.id === o.id ? (
                  <div key={o.id} className="rounded-xl border p-4" style={{ background: '#1a1d27', borderColor: '#6366f1' }}>
                    <h3 className="text-sm font-semibold text-slate-200 mb-3">Edit Court Order</h3>
                    <OrderForm initial={o} onSave={saveOrder} onCancel={() => setEditingOrder(null)} />
                  </div>
                ) : (
                  <OrderCard
                    key={o.id}
                    order={o}
                    canManage={can.manageCases}
                    onEdit={() => setEditingOrder(o)}
                    onDelete={() => setConfirmDeleteOrder(o.id)}
                  />
                )
              ))}
            </div>
          )}
        </>
      )}

      <ConfirmDialog
        open={!!confirmDeleteCharge}
        title="Delete Charge"
        message="This will permanently delete this charge record."
        confirmLabel="Delete"
        onConfirm={deleteCharge}
        onCancel={() => setConfirmDeleteCharge(null)}
      />
      <ConfirmDialog
        open={!!confirmDeleteOrder}
        title="Delete Court Order"
        message="This will permanently delete this court order."
        confirmLabel="Delete"
        onConfirm={deleteOrder}
        onCancel={() => setConfirmDeleteOrder(null)}
      />
    </div>
  )
}
