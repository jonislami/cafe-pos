import { useState, useEffect } from 'react'
import { useTranslation } from '../LanguageContext'

const TABS = [
  'dashboard', 'products', 'employees', 'tables', 'reports', 'settings'
]

export default function AdminScreen({ user, onLogout }) {
  const { t } = useTranslation()
  const [tab, setTab] = useState('dashboard')

  return (
    <div style={{
      display:'flex', height:'100vh', background:'#f1f5f9',
      color:'#0f172a', fontFamily:'"Inter",system-ui,sans-serif',
      overflow:'hidden'
    }}>

      {/* Sidebar */}
      <aside style={{
        width:220, background:'#fff',
        borderRight:'1px solid #e2e8f0',
        display:'flex', flexDirection:'column',
        padding:'28px 0', flexShrink:0
      }}>
        {/* Logo */}
        <div style={{ padding:'0 20px 32px' }}>
          <div style={{ display:'flex', alignItems:'center', gap:10 }}>
            <div style={{
              width:32, height:32,
              background:'#0f172a',
              borderRadius:8, display:'flex', alignItems:'center',
              justifyContent:'center', fontSize:14, fontWeight:900, color:'#fff'
            }}>C</div>
            <div>
              <div style={{ fontSize:14, fontWeight:800, color:'#0f172a', letterSpacing:'-0.5px' }}>CaféPOS</div>
              <div style={{ fontSize:9, color:'#94a3b8', fontWeight:700, letterSpacing:'0.15em', textTransform:'uppercase' }}>{t('admin')}</div>
            </div>
          </div>
        </div>

        {/* Nav */}
        <nav style={{ flex:1, padding:'0 10px', display:'flex', flexDirection:'column', gap:2 }}>
          {TABS.map(tabKey => (
            <button key={tabKey} onClick={() => setTab(tabKey)} style={{
              width:'100%', padding:'10px 14px',
              background: tab===tabKey ? 'rgba(15,23,42,0.06)' : 'transparent',
              border: tab===tabKey ? '1px solid rgba(15,23,42,0.12)' : '1px solid transparent',
              borderRadius:10, cursor:'pointer', textAlign:'left',
              fontSize:13, fontWeight: tab===tabKey ? 600 : 400,
              color: tab===tabKey ? '#0f172a' : '#64748b',
              transition:'all .15s', display:'flex', alignItems:'center',
              gap:10, fontFamily:'inherit'
            }}>
              <span style={{
                width:6, height:6, borderRadius:'50%', flexShrink:0,
                background: tab===tabKey ? '#0f172a' : '#e2e8f0',
                transition:'all .15s'
              }}/>
              {t(tabKey)}
            </button>
          ))}
        </nav>

        {/* User card */}
        <div style={{ padding:'0 10px', marginTop:16 }}>
          <div style={{
            padding:'12px 14px', background:'#f8fafc',
            border:'1px solid #e2e8f0', borderRadius:12
          }}>
            <div style={{ display:'flex', alignItems:'center', gap:10, marginBottom:10 }}>
              <div style={{
                width:30, height:30, borderRadius:8,
                background:'#0f172a',
                display:'flex', alignItems:'center', justifyContent:'center',
                fontSize:11, fontWeight:700, color:'#fff', flexShrink:0
              }}>
                {user.name.split(' ').map(n=>n[0]).join('').slice(0,2)}
              </div>
              <div style={{ minWidth:0 }}>
                <div style={{ fontSize:12, fontWeight:600, color:'#0f172a', overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap' }}>{user.name}</div>
                <div style={{ fontSize:10, color:'#94a3b8' }}>{t('administrator')}</div>
              </div>
            </div>
            <button onClick={onLogout} style={{
              width:'100%', padding:'6px', background:'transparent',
              border:'1px solid #fecaca', borderRadius:7,
              color:'#ef4444', fontSize:10, fontWeight:700,
              letterSpacing:'0.08em', textTransform:'uppercase',
              cursor:'pointer', transition:'all .15s', fontFamily:'inherit'
            }}
            onMouseEnter={e => e.target.style.background='#fef2f2'}
            onMouseLeave={e => e.target.style.background='transparent'}
            >{t('signOut')}</button>
          </div>
        </div>
      </aside>

      {/* Main content */}
      <main style={{ flex:1, overflowY:'auto', background:'#f1f5f9' }}>
        <div style={{ maxWidth:960, margin:'0 auto', padding:'40px' }}>

          {/* Header */}
          <div style={{ marginBottom:36 }}>
            <h1 style={{
              fontSize:26, fontWeight:800, color:'#0f172a',
              letterSpacing:'-0.5px', margin:0, marginBottom:4
            }}>{t(tab)}</h1>
            <p style={{ fontSize:13, color:'#94a3b8', margin:0 }}>
              {t(`${tab}Desc`)}
            </p>
          </div>

          {tab==='dashboard' && <Dashboard />}
          {tab==='products'  && <Products />}
          {tab==='employees' && <Employees />}
          {tab==='tables'    && <TablesTab />}
          {tab==='reports'   && <Reports />}
          {tab==='settings'  && <Settings />}
        </div>
      </main>
    </div>
  )
}

// ── Shared ─────────────────────────────────────────────────────────

const card = {
  background:'#fff',
  border:'1px solid #e2e8f0',
  borderRadius:16
}

const inp = {
  width:'100%', padding:'10px 14px',
  background:'#f8fafc', border:'1px solid #e2e8f0',
  borderRadius:10, color:'#0f172a', fontSize:13,
  outline:'none', boxSizing:'border-box',
  transition:'border .15s', fontFamily:'inherit'
}

const label = {
  fontSize:10, fontWeight:700, color:'#94a3b8',
  textTransform:'uppercase', letterSpacing:'0.12em',
  display:'block', marginBottom:8
}

function StatCard({ title, value, sub }) {
  return (
    <div style={{ ...card, padding:'22px 24px' }}>
      <div style={{ ...label, marginBottom:10 }}>{title}</div>
      <div style={{ fontSize:28, fontWeight:800, color:'#0f172a', letterSpacing:'-1px' }}>{value}</div>
      {sub && <div style={{ fontSize:11, color:'#94a3b8', marginTop:4 }}>{sub}</div>}
    </div>
  )
}

function Btn({ children, variant='primary', onClick, style={} }) {
  const base = {
    padding:'9px 20px', borderRadius:10, fontSize:11,
    fontWeight:700, letterSpacing:'0.08em', textTransform:'uppercase',
    cursor:'pointer', border:'none', transition:'all .15s',
    fontFamily:'inherit', ...style
  }
  const variants = {
    primary:   { background:'#0f172a', color:'#fff' },
    secondary: { background:'#f1f5f9', color:'#64748b', border:'1px solid #e2e8f0' },
    danger:    { background:'#fef2f2', color:'#ef4444', border:'1px solid #fecaca' },
  }
  return <button onClick={onClick} style={{ ...base, ...variants[variant] }}>{children}</button>
}

function Row({ children }) {
  return (
    <tr style={{ borderBottom:'1px solid #f1f5f9' }}>{children}</tr>
  )
}

function THead({ cols, rightLast=false }) {
  return (
    <thead>
      <tr>
        {cols.map((h,i) => (
          <th key={i} style={{
            padding:'10px 20px',
            textAlign: rightLast && i===cols.length-1 ? 'right' : 'left',
            fontSize:10, fontWeight:700, color:'#94a3b8',
            textTransform:'uppercase', letterSpacing:'0.1em',
            borderBottom:'1px solid #e2e8f0'
          }}>{h}</th>
        ))}
      </tr>
    </thead>
  )
}

// ── Dashboard ──────────────────────────────────────────────────────

function Dashboard() {
  const { t } = useTranslation()
  const [stats, setStats] = useState({ total_orders:0, total_revenue:0, avg_order:0 })

  useEffect(() => {
    window.electronAPI.getOrderStats()
      .then(s => s && setStats(s))
      .catch(console.error)
  }, [])

  return (
    <div style={{ display:'flex', flexDirection:'column', gap:20 }}>
      <div style={{ display:'grid', gridTemplateColumns:'repeat(3,1fr)', gap:14 }}>
        <StatCard title={t('todaysRevenue')} value={`€${Number(stats.total_revenue).toFixed(2)}`} sub={t('liveTotal')} />
        <StatCard title={t('ordersToday')}    value={stats.total_orders} sub={t('completed')} />
        <StatCard title={t('avgOrder')}       value={`€${Number(stats.avg_order).toFixed(2)}`} sub={t('perTransaction')} />
      </div>
      <RecentOrders />
    </div>
  )
}

function RecentOrders() {
  const { t } = useTranslation()
  const [orders, setOrders] = useState([])

  useEffect(() => {
    window.electronAPI.getTodayOrders()
      .then(o => setOrders(o||[]))
      .catch(console.error)
  }, [])

  return (
    <div style={{ ...card, overflow:'hidden' }}>
      <div style={{
        padding:'16px 20px', borderBottom:'1px solid #e2e8f0',
        display:'flex', justifyContent:'space-between', alignItems:'center'
      }}>
        <span style={{ fontSize:12, fontWeight:700, color:'#94a3b8', textTransform:'uppercase', letterSpacing:'0.1em' }}>
          {t('recentOrders')}
        </span>
        <span style={{ fontSize:11, color:'#cbd5e1' }}>Today</span>
      </div>
      {orders.length === 0 ? (
        <div style={{ padding:32, textAlign:'center', color:'#94a3b8', fontSize:13 }}>
          {t('noOrdersYet')}
        </div>
      ) : (
        <table style={{ width:'100%', borderCollapse:'collapse' }}>
          <THead cols={[t('time'),t('tables'),t('waiter'),t('total')]} rightLast />
          <tbody>
            {orders.slice(0,8).map(o => (
              <Row key={o.id}>
                <td style={{ padding:'12px 20px', fontSize:11, color:'#94a3b8', fontFamily:'monospace' }}>
                  {new Date(o.created_at).toLocaleTimeString([],{hour:'2-digit',minute:'2-digit'})}
                </td>
                <td style={{ padding:'12px 20px', fontSize:13, fontWeight:600, color:'#0f172a' }}>{o.table_name||'—'}</td>
                <td style={{ padding:'12px 20px', fontSize:13, color:'#64748b' }}>{o.waiter_name||'—'}</td>
                <td style={{ padding:'12px 20px', fontSize:14, fontWeight:700, color:'#0f172a', textAlign:'right' }}>
                  €{Number(o.total).toFixed(2)}
                </td>
              </Row>
            ))}
          </tbody>
        </table>
      )}
    </div>
  )
}

// ── Products ───────────────────────────────────────────────────────

function Products() {
  const { t } = useTranslation()
  const [items, setItems]       = useState([])
  const [showForm, setShowForm] = useState(false)
  const [editId, setEditId]     = useState(null)
  const [form, setForm]         = useState({ name:'', category:'coffee', price:'', stock:'', icon:'' })

  useEffect(() => { load() }, [])

  async function load() {
    try {
      const p = await window.electronAPI.getProducts()
      setItems([...p].sort((a,b) => a.category.localeCompare(b.category) || a.name.localeCompare(b.name)))
    } catch(e) { console.error(e) }
  }

  async function handleSubmit() {
    if (!form.name || !form.price) return
    const p = { ...form, price:parseFloat(form.price), stock:parseInt(form.stock)||0 }
    if (editId) await window.electronAPI.updateProduct({ ...p, id:editId })
    else        await window.electronAPI.addProduct(p)
    cancel(); load()
  }

  function startEdit(i) {
    setEditId(i.id)
    setForm({ name:i.name, category:i.category, price:i.price.toString(), stock:i.stock.toString(), icon:'' })
    setShowForm(true)
  }

  function cancel() {
    setEditId(null); setShowForm(false)
    setForm({ name:'', category:'coffee', price:'', stock:'', icon:'' })
  }

  return (
    <div style={{ display:'flex', flexDirection:'column', gap:16 }}>
      <div style={{ display:'flex', justifyContent:'flex-end' }}>
        {!showForm && <Btn onClick={() => setShowForm(true)}>+ {t('addProduct')}</Btn>}
      </div>

      {showForm && (
        <div style={{ ...card, padding:24, borderColor:'#bfdbfe' }}>
          <div style={{ fontSize:14, fontWeight:700, color:'#0f172a', marginBottom:18 }}>
            {editId ? t('editProduct') : t('newProduct')}
          </div>
          <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:14 }}>
            <div>
              <span style={label}>{t('productName')}</span>
              <input style={inp} value={form.name} placeholder="e.g. Espresso"
                onChange={e=>setForm(f=>({...f,name:e.target.value}))} />
            </div>
            <div>
              <span style={label}>{t('category')}</span>
              <select style={inp} value={form.category}
                onChange={e=>setForm(f=>({...f,category:e.target.value}))}>
                {['coffee','drinks','food','alcohol','desserts'].map(c=>(
                  <option key={c} value={c}>{t(`cat_${c}`)}</option>
                ))}
              </select>
            </div>
            <div>
              <span style={label}>{t('price')} (€)</span>
              <input style={inp} type="number" step="0.10" value={form.price} placeholder="0.00"
                onChange={e=>setForm(f=>({...f,price:e.target.value}))} />
            </div>
            <div>
              <span style={label}>{t('stock')}</span>
              <input style={inp} type="number" value={form.stock} placeholder="99"
                onChange={e=>setForm(f=>({...f,stock:e.target.value}))} />
            </div>
          </div>
          <div style={{ display:'flex', gap:10, marginTop:18 }}>
            <Btn onClick={handleSubmit}>{editId ? t('edit') : t('save')}</Btn>
            <Btn variant="secondary" onClick={cancel}>{t('cancel')}</Btn>
          </div>
        </div>
      )}

      <div style={{ ...card, overflow:'hidden' }}>
        <table style={{ width:'100%', borderCollapse:'collapse' }}>
          <THead cols={[t('productName'),t('category'),t('price'),t('stock'),'']} />
          <tbody>
            {items.length === 0 ? (
              <tr><td colSpan={5} style={{ padding:32, textAlign:'center', color:'#94a3b8', fontSize:13 }}>{t('noProducts')}</td></tr>
            ) : items.map(i => (
              <Row key={i.id}>
                <td style={{ padding:'13px 20px', fontSize:13, fontWeight:600, color:'#0f172a' }}>{i.name}</td>
                <td style={{ padding:'13px 20px' }}>
                  <span style={{
                    padding:'3px 10px', borderRadius:20, fontSize:10, fontWeight:700,
                    textTransform:'uppercase', letterSpacing:'0.06em',
                    background:'#f1f5f9', color:'#64748b'
                  }}>{t(`cat_${i.category}`)}</span>
                </td>
                <td style={{ padding:'13px 20px', fontSize:14, fontWeight:700, color:'#0f172a' }}>
                  €{Number(i.price).toFixed(2)}
                </td>
                <td style={{ padding:'13px 20px', fontSize:13, color:'#64748b' }}>{i.stock}</td>
                <td style={{ padding:'13px 20px' }}>
                  <div style={{ display:'flex', gap:8, justifyContent:'flex-end' }}>
                    <Btn variant="secondary" onClick={() => startEdit(i)} style={{ padding:'5px 12px' }}>{t('edit')}</Btn>
                    <Btn variant="danger" onClick={async () => {
                      if(window.confirm(t('deleteConfirm'))) {
                        await window.electronAPI.deleteProduct(i.id); load()
                      }
                    }} style={{ padding:'5px 12px' }}>{t('delete')}</Btn>
                  </div>
                </td>
              </Row>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}

// ── Employees ──────────────────────────────────────────────────────

function Employees() {
  const { t } = useTranslation()
  const [emps, setEmps]         = useState([])
  const [showForm, setShowForm] = useState(false)
  const [editId, setEditId]     = useState(null)
  const [form, setForm]         = useState({ name:'', role:'waiter', card_uid:'', pin:'', status:'active' })

  useEffect(() => { load() }, [])

  async function load() {
    try { setEmps(await window.electronAPI.getEmployees()) }
    catch(e) { console.error(e) }
  }

  async function handleSubmit() {
    if (!form.name) return
    if (editId) await window.electronAPI.updateEmployee({ ...form, id:editId })
    else        await window.electronAPI.addEmployee(form)
    cancel(); load()
  }

  function startEdit(e) {
    setEditId(e.id)
    setForm({ name:e.name, role:e.role, card_uid:e.card_uid||'', pin:e.pin||'', status:e.status })
    setShowForm(true)
  }

  function cancel() {
    setEditId(null); setShowForm(false)
    setForm({ name:'', role:'waiter', card_uid:'', pin:'', status:'active' })
  }

  return (
    <div style={{ display:'flex', flexDirection:'column', gap:16 }}>
      <div style={{ display:'flex', justifyContent:'flex-end' }}>
        {!showForm && <Btn onClick={() => setShowForm(true)}>+ {t('addStaff')}</Btn>}
      </div>

      {showForm && (
        <div style={{ ...card, padding:24, borderColor:'#bfdbfe' }}>
          <div style={{ fontSize:14, fontWeight:700, color:'#0f172a', marginBottom:18 }}>
            {editId ? t('editEmployee') : t('newEmployee')}
          </div>
          <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:14 }}>
            <div>
              <span style={label}>{t('fullName')}</span>
              <input style={inp} value={form.name} placeholder="e.g. John Smith"
                onChange={e=>setForm(f=>({...f,name:e.target.value}))} />
            </div>
            <div>
              <span style={label}>{t('role')}</span>
              <select style={inp} value={form.role}
                onChange={e=>setForm(f=>({...f,role:e.target.value}))}>
                <option value="waiter">{t('waiter')}</option>
                <option value="admin">{t('admin')}</option>
                <option value="bartender">{t('bartender')}</option>
              </select>
            </div>
            <div>
              <span style={label}>{t('pinCode')}</span>
              <input style={inp} type="password" maxLength={4} value={form.pin}
                placeholder="4 digit PIN"
                onChange={e=>setForm(f=>({...f,pin:e.target.value}))} />
            </div>
            <div>
              <span style={label}>{t('rfidCard')} <span style={{ fontWeight:400, textTransform:'none', letterSpacing:0 }}>{t('optional')}</span></span>
              <input style={inp} value={form.card_uid} placeholder="Add when card arrives"
                onChange={e=>setForm(f=>({...f,card_uid:e.target.value}))} />
            </div>
            <div>
              <span style={label}>{t('status')}</span>
              <select style={inp} value={form.status}
                onChange={e=>setForm(f=>({...f,status:e.target.value}))}>
                <option value="active">{t('active')}</option>
                <option value="inactive">{t('inactive')}</option>
              </select>
            </div>
          </div>
          <div style={{ display:'flex', gap:10, marginTop:18 }}>
            <Btn onClick={handleSubmit}>{editId ? t('edit') : t('save')}</Btn>
            <Btn variant="secondary" onClick={cancel}>{t('cancel')}</Btn>
          </div>
        </div>
      )}

      <div style={{ ...card, overflow:'hidden' }}>
        <table style={{ width:'100%', borderCollapse:'collapse' }}>
          <THead cols={[t('fullName'),t('role'),t('pinCode'),t('rfidCard'),t('status'),'']} />
          <tbody>
            {emps.length === 0 ? (
              <tr><td colSpan={6} style={{ padding:32, textAlign:'center', color:'#94a3b8', fontSize:13 }}>{t('noEmployees')}</td></tr>
            ) : emps.map(e => (
              <Row key={e.id}>
                <td style={{ padding:'13px 20px', fontSize:13, fontWeight:600, color:'#0f172a' }}>{e.name}</td>
                <td style={{ padding:'13px 20px' }}>
                  <span style={{
                    padding:'3px 10px', borderRadius:20, fontSize:10, fontWeight:700,
                    textTransform:'uppercase',
                    background: e.role==='admin' ? '#eff6ff' : '#f8fafc',
                    color:      e.role==='admin' ? '#3b82f6' : '#64748b'
                  }}>{t(e.role)}</span>
                </td>
                <td style={{ padding:'13px 20px', fontSize:11, fontFamily:'monospace', color:'#94a3b8' }}>
                  {e.pin ? '••••' : '—'}
                </td>
                <td style={{ padding:'13px 20px', fontSize:11, fontFamily:'monospace', color:'#94a3b8' }}>
                  {e.card_uid || `— ${t('none')}`}
                </td>
                <td style={{ padding:'13px 20px' }}>
                  <span style={{
                    padding:'3px 10px', borderRadius:20, fontSize:10, fontWeight:700,
                    background: e.status==='active' ? '#f0fdf4' : '#fef2f2',
                    color:      e.status==='active' ? '#16a34a' : '#ef4444'
                  }}>{t(e.status)}</span>
                </td>
                <td style={{ padding:'13px 20px' }}>
                  <Btn variant="secondary" onClick={() => startEdit(e)} style={{ padding:'5px 12px' }}>{t('edit')}</Btn>
                </td>
              </Row>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}

// ── Tables ─────────────────────────────────────────────────────────

function TablesTab() {
  const { t } = useTranslation()
  const [tables, setTables]     = useState([])
  const [newName, setNewName]   = useState('')
  const [showForm, setShowForm] = useState(false)

  useEffect(() => { load() }, [])

  async function load() {
    try { setTables(await window.electronAPI.getTables()) }
    catch(e) { console.error(e) }
  }

  async function handleAdd() {
    if (!newName.trim()) return
    await window.electronAPI.addTable(newName.trim())
    setNewName(''); setShowForm(false); load()
  }

  return (
    <div style={{ display:'flex', flexDirection:'column', gap:16 }}>
      <div style={{ display:'flex', justifyContent:'flex-end' }}>
        {!showForm && <Btn onClick={() => setShowForm(true)}>+ {t('addTable')}</Btn>}
      </div>

      {showForm && (
        <div style={{ ...card, padding:20, display:'flex', gap:12, alignItems:'flex-end', maxWidth:380, borderColor:'#bfdbfe' }}>
          <div style={{ flex:1 }}>
            <span style={label}>{t('tableName')}</span>
            <input style={inp} value={newName} placeholder="e.g. Table 11 or VIP Room"
              onChange={e=>setNewName(e.target.value)}
              onKeyDown={e=>e.key==='Enter'&&handleAdd()} />
          </div>
          <Btn onClick={handleAdd}>{t('save')}</Btn>
          <Btn variant="secondary" onClick={() => setShowForm(false)}>{t('cancel')}</Btn>
        </div>
      )}

      <div style={{ display:'grid', gridTemplateColumns:'repeat(auto-fill, minmax(110px,1fr))', gap:10 }}>
        {tables.length === 0 ? (
          <div style={{ gridColumn:'1/-1', padding:32, textAlign:'center', color:'#94a3b8', fontSize:13 }}>
            {t('noTables')}
          </div>
        ) : tables.map(tbl => (
          <div key={tbl.id} style={{
            ...card, padding:'18px 14px', textAlign:'center',
            position:'relative'
          }}>
            <div style={{ fontSize:13, fontWeight:700, color:'#0f172a', marginBottom:4 }}>{tbl.name}</div>
            <div style={{ fontSize:9, fontWeight:700, color:'#16a34a', textTransform:'uppercase', letterSpacing:'0.12em' }}>
              {t('active')}
            </div>
            <button onClick={async () => {
              if(window.confirm(t('removeTableConfirm'))) {
                await window.electronAPI.deleteTable(tbl.id); load()
              }
            }} style={{
              position:'absolute', top:8, right:8,
              width:18, height:18, borderRadius:'50%',
              background:'#fef2f2', border:'1px solid #fecaca',
              color:'#ef4444', cursor:'pointer', fontSize:12,
              display:'flex', alignItems:'center', justifyContent:'center'
            }}>×</button>
          </div>
        ))}
      </div>
    </div>
  )
}

// ── Reports ────────────────────────────────────────────────────────

function Reports() {
  const { t } = useTranslation()
  const [stats, setStats]   = useState({ total_orders:0, total_revenue:0, avg_order:0 })
  const [orders, setOrders] = useState([])

  useEffect(() => {
    window.electronAPI.getOrderStats().then(s => s && setStats(s)).catch(console.error)
    window.electronAPI.getTodayOrders().then(o => setOrders(o||[])).catch(console.error)
  }, [])

  return (
    <div style={{ display:'flex', flexDirection:'column', gap:16 }}>
      <div style={{ display:'grid', gridTemplateColumns:'repeat(3,1fr)', gap:14 }}>
        <StatCard title={t('todaysRevenue')} value={`€${Number(stats.total_revenue).toFixed(2)}`} />
        <StatCard title={t('ordersToday')}    value={stats.total_orders} />
        <StatCard title={t('avgOrder')}       value={`€${Number(stats.avg_order).toFixed(2)}`} />
      </div>

      <div style={{ ...card, overflow:'hidden' }}>
        <div style={{
          padding:'16px 20px', borderBottom:'1px solid #e2e8f0',
          display:'flex', justifyContent:'space-between', alignItems:'center'
        }}>
          <span style={{ fontSize:12, fontWeight:700, color:'#94a3b8', textTransform:'uppercase', letterSpacing:'0.1em' }}>
            {t('allOrdersToday')} ({orders.length})
          </span>
        </div>
        {orders.length === 0 ? (
          <div style={{ padding:32, textAlign:'center', color:'#94a3b8', fontSize:13 }}>{t('noOrdersYet')}</div>
        ) : (
          <table style={{ width:'100%', borderCollapse:'collapse' }}>
            <THead cols={[t('time'),t('tables'),t('waiter'),t('total')]} rightLast />
            <tbody>
              {orders.map(o => (
                <Row key={o.id}>
                  <td style={{ padding:'12px 20px', fontSize:11, color:'#94a3b8', fontFamily:'monospace' }}>
                    {new Date(o.created_at).toLocaleTimeString([],{hour:'2-digit',minute:'2-digit'})}
                  </td>
                  <td style={{ padding:'12px 20px', fontSize:13, fontWeight:600, color:'#0f172a' }}>{o.table_name||'—'}</td>
                  <td style={{ padding:'12px 20px', fontSize:13, color:'#64748b' }}>{o.waiter_name||'—'}</td>
                  <td style={{ padding:'12px 20px', fontSize:14, fontWeight:700, color:'#0f172a', textAlign:'right' }}>
                    €{Number(o.total).toFixed(2)}
                  </td>
                </Row>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  )
}

// ── Settings ───────────────────────────────────────────────────────

function Settings() {
  const { t, lang, changeLanguage, settings, setSettings } = useTranslation()
  const [form, setForm] = useState({
    cafe_name: '', address: '',
    vat_number: '', footer: '',
    language: 'en'
  })
  const [saved, setSaved] = useState(false)

  useEffect(() => {
    if (settings) {
      setForm({
        cafe_name: settings.cafe_name || '',
        address: settings.address || '',
        vat_number: settings.vat_number || '',
        footer: settings.footer || '',
        language: settings.language || 'en'
      })
    }
  }, [settings])

  async function handleSave() {
    try {
      await window.electronAPI.updateSettings(form)
      setSettings(prev => ({ ...prev, ...form }))
      if (form.language !== lang) {
        changeLanguage(form.language)
      }
      setSaved(true)
      setTimeout(() => setSaved(false), 2000)
    } catch (e) {
      console.error(e)
    }
  }

  const fields = [
    { label: t('businessName'), key: 'cafe_name', placeholder: 'My Café' },
    { label: t('address'), key: 'address', placeholder: 'Street, City' },
    { label: t('vatNumber'), key: 'vat_number', placeholder: '12345678901' },
    { label: t('receiptFooter'), key: 'footer', placeholder: 'Thank you!' },
  ]

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 14, maxWidth: 520 }}>
      <div style={{ ...card, padding: 24 }}>
        <div style={{ fontSize: 12, fontWeight: 700, color: '#94a3b8', textTransform: 'uppercase', letterSpacing: '0.1em', marginBottom: 20 }}>
          {t('cafeConfiguration')}
        </div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
          {fields.map(f => (
            <div key={f.key}>
              <span style={label}>{f.label}</span>
              <input style={inp} value={form[f.key]} placeholder={f.placeholder}
                onChange={e => setForm(p => ({ ...p, [f.key]: e.target.value }))} />
            </div>
          ))}

          <div>
            <span style={label}>{t('language')}</span>
            <select style={inp} value={form.language}
              onChange={e => setForm(p => ({ ...p, language: e.target.value }))}>
              <option value="en">English</option>
              <option value="it">Italiano</option>
            </select>
          </div>
        </div>
        <div style={{ marginTop: 20, paddingTop: 18, borderTop: '1px solid #e2e8f0' }}>
          <Btn onClick={handleSave} style={{ background: saved ? '#16a34a' : '#0f172a' }}>
            {saved ? t('saved') : t('saveConfiguration')}
          </Btn>
        </div>
      </div>

      <div style={{ ...card, padding: 20 }}>
        <div style={{ fontSize: 12, fontWeight: 700, color: '#94a3b8', textTransform: 'uppercase', letterSpacing: '0.1em', marginBottom: 14 }}>
          {t('printer')}
        </div>
        <span style={label}>{t('thermalPrinter')}</span>
        <select style={{ ...inp, width:'auto', minWidth:260 }}>
          <option>USB — Epson TM-T20III</option>
          <option>LAN — Star TSP143</option>
          <option>Receipt preview only</option>
        </select>
      </div>

      <div style={{
        padding:'12px 16px', borderRadius:10,
        background:'#f0fdf4', border:'1px solid #bbf7d0',
        fontSize:12, color:'#16a34a',
        display:'flex', alignItems:'center', gap:8
      }}>
        {t('dbConnected')}
      </div>
    </div>
  )
}