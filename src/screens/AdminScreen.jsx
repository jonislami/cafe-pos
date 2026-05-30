import { useState, useEffect } from 'react'

const TABS = ['Dashboard','Products','Employees','Tables','Reports','Settings']

export default function AdminScreen({ user, onLogout }) {
  const [tab, setTab] = useState('Dashboard')

  return (
    <div style={{ display:'flex', flexDirection:'column', height:'100vh', background:'#0f1117' }}>

      {/* Top bar */}
      <div style={{
        padding:'10px 16px', background:'#181b24',
        borderBottom:'1px solid #2d3148',
        display:'flex', alignItems:'center', justifyContent:'space-between'
      }}>
        <div style={{ display:'flex', alignItems:'center', gap:10 }}>
          <div style={{
            width:32, height:32, borderRadius:'50%',
            background:'rgba(59,130,246,0.2)',
            display:'flex', alignItems:'center', justifyContent:'center',
            fontSize:12, fontWeight:600, color:'#3b82f6'
          }}>
            {user.name.split(' ').map(n=>n[0]).join('').slice(0,2)}
          </div>
          <div>
            <div style={{ fontSize:13, fontWeight:500 }}>{user.name}</div>
            <div style={{ fontSize:10, color:'#64748b' }}>Administrator</div>
          </div>
        </div>
        <button onClick={onLogout} style={{
          padding:'5px 12px', background:'#252836',
          border:'1px solid #2d3148', borderRadius:6,
          color:'#94a3b8', cursor:'pointer', fontSize:12
        }}>Logout</button>
      </div>

      <div style={{ display:'flex', flex:1, overflow:'hidden' }}>

        {/* Sidebar */}
        <div style={{
          width:180, background:'#13151f',
          borderRight:'1px solid #2d3148', padding:'16px 0'
        }}>
          {TABS.map(t => (
            <div key={t} onClick={() => setTab(t)} style={{
              padding:'10px 20px', fontSize:13, cursor:'pointer',
              display:'flex', alignItems:'center', gap:10,
              color:      tab===t ? '#f97316' : '#94a3b8',
              background: tab===t ? 'rgba(249,115,22,0.08)' : 'transparent',
              borderRight: tab===t ? '3px solid #f97316' : '3px solid transparent'
            }}>
              {t==='Dashboard' && '📊'}
              {t==='Products'  && '📦'}
              {t==='Employees' && '👥'}
              {t==='Tables'    && '🪑'}
              {t==='Reports'   && '📈'}
              {t==='Settings'  && '⚙️'}
              {' '}{t}
            </div>
          ))}
        </div>

        {/* Content */}
        <div style={{ flex:1, overflowY:'auto', padding:24 }}>
          {tab==='Dashboard' && <Dashboard />}
          {tab==='Products'  && <Products />}
          {tab==='Employees' && <Employees />}
          {tab==='Tables'    && <TablesTab />}
          {tab==='Reports'   && <Reports />}
          {tab==='Settings'  && <Settings />}
        </div>
      </div>
    </div>
  )
}

// ── Dashboard ──────────────────────────────────────────────────────

function Dashboard() {
  const [stats, setStats] = useState({ total_orders:0, total_revenue:0, avg_order:0 })

  useEffect(() => {
    window.electronAPI.getOrderStats()
      .then(s => { if (s) setStats(s) })
      .catch(console.error)
  }, [])

  return (
    <div style={{ display:'flex', flexDirection:'column', gap:20 }}>
      <div style={{ display:'grid', gridTemplateColumns:'repeat(4,1fr)', gap:12 }}>
        {[
          { label:"Today's Revenue", value:`€${Number(stats.total_revenue).toFixed(2)}`, sub:'Live from database' },
          { label:'Orders Today',    value:stats.total_orders, sub:'Completed orders' },
          { label:'Avg Order',       value:`€${Number(stats.avg_order).toFixed(2)}`, sub:'Per order today' },
          { label:'System',          value:'Online', sub:'All systems OK' },
        ].map(s => (
          <div key={s.label} style={{
            background:'#1a1d2e', border:'1px solid #2d3148',
            borderRadius:12, padding:16
          }}>
            <div style={{ fontSize:11, color:'#64748b', marginBottom:8 }}>{s.label}</div>
            <div style={{ fontSize:24, fontWeight:600 }}>{s.value}</div>
            <div style={{ fontSize:11, color:'#22c55e', marginTop:4 }}>{s.sub}</div>
          </div>
        ))}
      </div>

      <RecentOrders />
    </div>
  )
}

function RecentOrders() {
  const [orders, setOrders] = useState([])

  useEffect(() => {
    window.electronAPI.getTodayOrders()
      .then(o => setOrders(o || []))
      .catch(console.error)
  }, [])

  return (
    <div style={{ background:'#1a1d2e', border:'1px solid #2d3148', borderRadius:12 }}>
      <div style={{ padding:'14px 18px', borderBottom:'1px solid #2d3148', fontSize:14, fontWeight:500 }}>
        Recent Orders Today
      </div>
      {orders.length === 0 ? (
        <div style={{ padding:24, textAlign:'center', color:'#64748b', fontSize:13 }}>
          No orders yet today
        </div>
      ) : (
        <table style={{ width:'100%', borderCollapse:'collapse', fontSize:13 }}>
          <thead>
            <tr>{['Time','Table','Waiter','Total'].map(h => (
              <th key={h} style={{ padding:'10px 18px', textAlign:'left', fontSize:11, color:'#64748b', borderBottom:'1px solid #2d3148' }}>{h}</th>
            ))}</tr>
          </thead>
          <tbody>
            {orders.slice(0,10).map(o => (
              <tr key={o.id}>
                <td style={{ padding:'10px 18px', borderBottom:'1px solid rgba(45,49,72,0.5)', color:'#64748b', fontSize:11 }}>
                  {new Date(o.created_at).toLocaleTimeString([],{hour:'2-digit',minute:'2-digit'})}
                </td>
                <td style={{ padding:'10px 18px', borderBottom:'1px solid rgba(45,49,72,0.5)' }}>
                  {o.table_name || '—'}
                </td>
                <td style={{ padding:'10px 18px', borderBottom:'1px solid rgba(45,49,72,0.5)' }}>
                  {o.waiter_name || '—'}
                </td>
                <td style={{ padding:'10px 18px', borderBottom:'1px solid rgba(45,49,72,0.5)', color:'#f97316', fontWeight:600 }}>
                  €{Number(o.total).toFixed(2)}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </div>
  )
}

// ── Products ───────────────────────────────────────────────────────

function Products() {
  const [items, setItems]       = useState([])
  const [showForm, setShowForm] = useState(false)
  const [form, setForm]         = useState({ name:'', category:'coffee', price:'', stock:'', icon:'☕' })

  useEffect(() => { loadProducts() }, [])

  async function loadProducts() {
    try {
      const prods = await window.electronAPI.getProducts()
      setItems(prods)
    } catch(e) { console.error(e) }
  }

  async function handleAdd() {
    if (!form.name || !form.price) return
    await window.electronAPI.addProduct({
      ...form,
      price: parseFloat(form.price),
      stock: parseInt(form.stock) || 0
    })
    setForm({ name:'', category:'coffee', price:'', stock:'', icon:'☕' })
    setShowForm(false)
    loadProducts()
  }

  async function handleDelete(id) {
    if (!window.confirm('Delete this product?')) return
    await window.electronAPI.deleteProduct(id)
    loadProducts()
  }

  const inp = {
    width:'100%', padding:'8px 10px', background:'#252836',
    border:'1px solid #2d3148', borderRadius:7,
    color:'#f1f5f9', fontSize:13
  }

  return (
    <div style={{ display:'flex', flexDirection:'column', gap:16 }}>

      {showForm && (
        <div style={{ background:'#1a1d2e', border:'1px solid #2d3148', borderRadius:12, padding:18 }}>
          <div style={{ fontSize:14, fontWeight:500, marginBottom:14 }}>➕ Add New Product</div>
          <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:12 }}>
            <div>
              <div style={{ fontSize:11, color:'#94a3b8', marginBottom:5 }}>Name</div>
              <input style={inp} value={form.name}
                onChange={e => setForm(p=>({...p, name:e.target.value}))}
                placeholder="e.g. Espresso" />
            </div>
            <div>
              <div style={{ fontSize:11, color:'#94a3b8', marginBottom:5 }}>Icon (emoji)</div>
              <input style={inp} value={form.icon}
                onChange={e => setForm(p=>({...p, icon:e.target.value}))}
                placeholder="☕" />
            </div>
            <div>
              <div style={{ fontSize:11, color:'#94a3b8', marginBottom:5 }}>Category</div>
              <select style={inp} value={form.category}
                onChange={e => setForm(p=>({...p, category:e.target.value}))}>
                <option value="coffee">Coffee</option>
                <option value="drinks">Drinks</option>
                <option value="food">Food</option>
                <option value="alcohol">Alcohol</option>
                <option value="desserts">Desserts</option>
              </select>
            </div>
            <div>
              <div style={{ fontSize:11, color:'#94a3b8', marginBottom:5 }}>Price (€)</div>
              <input style={inp} type="number" step="0.10" value={form.price}
                onChange={e => setForm(p=>({...p, price:e.target.value}))}
                placeholder="1.50" />
            </div>
            <div>
              <div style={{ fontSize:11, color:'#94a3b8', marginBottom:5 }}>Stock</div>
              <input style={inp} type="number" value={form.stock}
                onChange={e => setForm(p=>({...p, stock:e.target.value}))}
                placeholder="99" />
            </div>
          </div>
          <div style={{ display:'flex', gap:10, marginTop:14 }}>
            <button onClick={handleAdd} style={{
              padding:'9px 20px', background:'#f97316', border:'none',
              borderRadius:7, color:'#fff', cursor:'pointer', fontSize:13
            }}>Save Product</button>
            <button onClick={() => setShowForm(false)} style={{
              padding:'9px 20px', background:'#252836', border:'1px solid #2d3148',
              borderRadius:7, color:'#94a3b8', cursor:'pointer', fontSize:13
            }}>Cancel</button>
          </div>
        </div>
      )}

      <div style={{ background:'#1a1d2e', border:'1px solid #2d3148', borderRadius:12 }}>
        <div style={{ padding:'14px 18px', borderBottom:'1px solid #2d3148', display:'flex', justifyContent:'space-between', alignItems:'center' }}>
          <span style={{ fontSize:14, fontWeight:500 }}>Products ({items.length})</span>
          <button onClick={() => setShowForm(true)} style={{
            padding:'6px 14px', background:'#f97316', border:'none',
            borderRadius:7, color:'#fff', fontSize:12, cursor:'pointer'
          }}>+ Add Product</button>
        </div>
        <table style={{ width:'100%', borderCollapse:'collapse', fontSize:13 }}>
          <thead>
            <tr>{['Product','Category','Price','Stock','Actions'].map(h => (
              <th key={h} style={{ padding:'10px 18px', textAlign:'left', fontSize:11, color:'#64748b', borderBottom:'1px solid #2d3148' }}>{h}</th>
            ))}</tr>
          </thead>
          <tbody>
            {items.length === 0 ? (
              <tr><td colSpan={5} style={{ padding:24, textAlign:'center', color:'#64748b' }}>No products yet</td></tr>
            ) : items.map(i => (
              <tr key={i.id}>
                <td style={{ padding:'10px 18px', borderBottom:'1px solid rgba(45,49,72,0.5)' }}>{i.icon} {i.name}</td>
                <td style={{ padding:'10px 18px', borderBottom:'1px solid rgba(45,49,72,0.5)', color:'#64748b' }}>{i.category}</td>
                <td style={{ padding:'10px 18px', borderBottom:'1px solid rgba(45,49,72,0.5)', color:'#f97316' }}>€{Number(i.price).toFixed(2)}</td>
                <td style={{ padding:'10px 18px', borderBottom:'1px solid rgba(45,49,72,0.5)' }}>{i.stock}</td>
                <td style={{ padding:'10px 18px', borderBottom:'1px solid rgba(45,49,72,0.5)' }}>
                  <button onClick={() => handleDelete(i.id)} style={{
                    padding:'3px 10px', background:'#252836',
                    border:'1px solid #2d3148', borderRadius:5,
                    color:'#ef4444', cursor:'pointer', fontSize:11
                  }}>Delete</button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}

// ── Employees ──────────────────────────────────────────────────────

function Employees() {
  const [emps, setEmps]         = useState([])
  const [showForm, setShowForm] = useState(false)
  const [form, setForm]         = useState({ name:'', role:'waiter', card_uid:'', status:'active' })

  useEffect(() => { loadEmployees() }, [])

  async function loadEmployees() {
    try {
      const data = await window.electronAPI.getEmployees()
      setEmps(data)
    } catch(e) { console.error(e) }
  }

  async function handleAdd() {
    if (!form.name) return
    await window.electronAPI.addEmployee(form)
    setForm({ name:'', role:'waiter', card_uid:'', status:'active' })
    setShowForm(false)
    loadEmployees()
  }

  async function handleDelete(id) {
    if (!window.confirm('Remove this employee?')) return
    await window.electronAPI.deleteEmployee(id)
    loadEmployees()
  }

  const inp = {
    width:'100%', padding:'8px 10px', background:'#252836',
    border:'1px solid #2d3148', borderRadius:7,
    color:'#f1f5f9', fontSize:13
  }

  return (
    <div style={{ display:'flex', flexDirection:'column', gap:16 }}>

      {showForm && (
        <div style={{ background:'#1a1d2e', border:'1px solid #2d3148', borderRadius:12, padding:18 }}>
          <div style={{ fontSize:14, fontWeight:500, marginBottom:14 }}>➕ Add New Employee</div>
          <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:12 }}>
            <div>
              <div style={{ fontSize:11, color:'#94a3b8', marginBottom:5 }}>Full Name</div>
              <input style={inp} value={form.name}
                onChange={e => setForm(p=>({...p, name:e.target.value}))}
                placeholder="e.g. John Smith" />
            </div>
            <div>
              <div style={{ fontSize:11, color:'#94a3b8', marginBottom:5 }}>Role</div>
              <select style={inp} value={form.role}
                onChange={e => setForm(p=>({...p, role:e.target.value}))}>
                <option value="waiter">Waiter</option>
                <option value="admin">Admin</option>
                <option value="bartender">Bartender</option>
              </select>
            </div>
            <div>
              <div style={{ fontSize:11, color:'#94a3b8', marginBottom:5 }}>RFID Card UID (optional for now)</div>
              <input style={inp} value={form.card_uid}
                onChange={e => setForm(p=>({...p, card_uid:e.target.value}))}
                placeholder="Add later when card arrives" />
            </div>
            <div>
              <div style={{ fontSize:11, color:'#94a3b8', marginBottom:5 }}>Status</div>
              <select style={inp} value={form.status}
                onChange={e => setForm(p=>({...p, status:e.target.value}))}>
                <option value="active">Active</option>
                <option value="inactive">Inactive</option>
              </select>
            </div>
          </div>
          <div style={{ display:'flex', gap:10, marginTop:14 }}>
            <button onClick={handleAdd} style={{
              padding:'9px 20px', background:'#f97316', border:'none',
              borderRadius:7, color:'#fff', cursor:'pointer', fontSize:13
            }}>Save Employee</button>
            <button onClick={() => setShowForm(false)} style={{
              padding:'9px 20px', background:'#252836', border:'1px solid #2d3148',
              borderRadius:7, color:'#94a3b8', cursor:'pointer', fontSize:13
            }}>Cancel</button>
          </div>
        </div>
      )}

      <div style={{ background:'#1a1d2e', border:'1px solid #2d3148', borderRadius:12 }}>
        <div style={{ padding:'14px 18px', borderBottom:'1px solid #2d3148', display:'flex', justifyContent:'space-between', alignItems:'center' }}>
          <span style={{ fontSize:14, fontWeight:500 }}>Employees ({emps.length})</span>
          <button onClick={() => setShowForm(true)} style={{
            padding:'6px 14px', background:'#f97316', border:'none',
            borderRadius:7, color:'#fff', fontSize:12, cursor:'pointer'
          }}>+ Add Employee</button>
        </div>
        <table style={{ width:'100%', borderCollapse:'collapse', fontSize:13 }}>
          <thead>
            <tr>{['Name','Role','Card UID','Status','Actions'].map(h => (
              <th key={h} style={{ padding:'10px 18px', textAlign:'left', fontSize:11, color:'#64748b', borderBottom:'1px solid #2d3148' }}>{h}</th>
            ))}</tr>
          </thead>
          <tbody>
            {emps.length === 0 ? (
              <tr><td colSpan={5} style={{ padding:24, textAlign:'center', color:'#64748b' }}>No employees yet</td></tr>
            ) : emps.map(e => (
              <tr key={e.id}>
                <td style={{ padding:'10px 18px', fontWeight:500, borderBottom:'1px solid rgba(45,49,72,0.5)' }}>{e.name}</td>
                <td style={{ padding:'10px 18px', borderBottom:'1px solid rgba(45,49,72,0.5)' }}>
                  <span style={{
                    padding:'3px 9px', borderRadius:20, fontSize:10, fontWeight:500,
                    background: e.role==='admin' ? 'rgba(59,130,246,0.12)' : 'rgba(249,115,22,0.12)',
                    color:      e.role==='admin' ? '#3b82f6' : '#f97316'
                  }}>{e.role}</span>
                </td>
                <td style={{ padding:'10px 18px', borderBottom:'1px solid rgba(45,49,72,0.5)', fontFamily:'monospace', fontSize:11, color:'#64748b' }}>
                  {e.card_uid || '— no card yet'}
                </td>
                <td style={{ padding:'10px 18px', borderBottom:'1px solid rgba(45,49,72,0.5)' }}>
                  <span style={{
                    padding:'3px 9px', borderRadius:20, fontSize:10,
                    background: e.status==='active' ? 'rgba(34,197,94,0.12)' : 'rgba(239,68,68,0.12)',
                    color:      e.status==='active' ? '#22c55e' : '#ef4444'
                  }}>{e.status}</span>
                </td>
                <td style={{ padding:'10px 18px', borderBottom:'1px solid rgba(45,49,72,0.5)' }}>
                  <button onClick={() => handleDelete(e.id)} style={{
                    padding:'3px 10px', background:'#252836',
                    border:'1px solid #2d3148', borderRadius:5,
                    color:'#ef4444', cursor:'pointer', fontSize:11
                  }}>Remove</button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}

// ── Tables ─────────────────────────────────────────────────────────

function TablesTab() {
  const [tables, setTables]     = useState([])
  const [newName, setNewName]   = useState('')
  const [showForm, setShowForm] = useState(false)

  useEffect(() => { loadTables() }, [])

  async function loadTables() {
    try {
      const data = await window.electronAPI.getTables()
      setTables(data)
    } catch(e) { console.error(e) }
  }

  async function handleAdd() {
    if (!newName.trim()) return
    await window.electronAPI.addTable(newName.trim())
    setNewName('')
    setShowForm(false)
    loadTables()
  }

  async function handleDelete(id) {
    if (!window.confirm('Remove this table?')) return
    await window.electronAPI.deleteTable(id)
    loadTables()
  }

  return (
    <div style={{ display:'flex', flexDirection:'column', gap:16 }}>

      {showForm && (
        <div style={{ background:'#1a1d2e', border:'1px solid #2d3148', borderRadius:12, padding:18 }}>
          <div style={{ fontSize:14, fontWeight:500, marginBottom:14 }}>➕ Add New Table</div>
          <div style={{ display:'flex', gap:10 }}>
            <input
              value={newName}
              onChange={e => setNewName(e.target.value)}
              placeholder="e.g. Table 11 or VIP Room"
              style={{
                flex:1, padding:'8px 10px', background:'#252836',
                border:'1px solid #2d3148', borderRadius:7,
                color:'#f1f5f9', fontSize:13
              }}
            />
            <button onClick={handleAdd} style={{
              padding:'8px 20px', background:'#f97316', border:'none',
              borderRadius:7, color:'#fff', cursor:'pointer', fontSize:13
            }}>Add</button>
            <button onClick={() => setShowForm(false)} style={{
              padding:'8px 16px', background:'#252836', border:'1px solid #2d3148',
              borderRadius:7, color:'#94a3b8', cursor:'pointer', fontSize:13
            }}>Cancel</button>
          </div>
        </div>
      )}

      <div style={{ background:'#1a1d2e', border:'1px solid #2d3148', borderRadius:12 }}>
        <div style={{ padding:'14px 18px', borderBottom:'1px solid #2d3148', display:'flex', justifyContent:'space-between', alignItems:'center' }}>
          <span style={{ fontSize:14, fontWeight:500 }}>Tables ({tables.length})</span>
          <button onClick={() => setShowForm(true)} style={{
            padding:'6px 14px', background:'#f97316', border:'none',
            borderRadius:7, color:'#fff', fontSize:12, cursor:'pointer'
          }}>+ Add Table</button>
        </div>
        <div style={{ display:'grid', gridTemplateColumns:'repeat(auto-fill, minmax(120px,1fr))', gap:10, padding:16 }}>
          {tables.map(t => (
            <div key={t.id} style={{
              background:'#252836', border:'1px solid #2d3148',
              borderRadius:10, padding:14, textAlign:'center', position:'relative'
            }}>
              <div style={{ fontSize:24, marginBottom:6 }}>🪑</div>
              <div style={{ fontSize:13, fontWeight:600 }}>{t.name}</div>
              <div style={{ fontSize:10, color:'#22c55e', marginTop:4 }}>● Active</div>
              <button onClick={() => handleDelete(t.id)} style={{
                position:'absolute', top:6, right:6,
                width:18, height:18, background:'transparent',
                border:'none', color:'#ef4444', cursor:'pointer', fontSize:14,
                display:'flex', alignItems:'center', justifyContent:'center'
              }}>×</button>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}

// ── Reports ────────────────────────────────────────────────────────

function Reports() {
  const [stats, setStats]   = useState({ total_orders:0, total_revenue:0, avg_order:0 })
  const [orders, setOrders] = useState([])

  useEffect(() => {
    window.electronAPI.getOrderStats().then(s => { if(s) setStats(s) }).catch(console.error)
    window.electronAPI.getTodayOrders().then(o => setOrders(o||[])).catch(console.error)
  }, [])

  return (
    <div style={{ display:'flex', flexDirection:'column', gap:16 }}>
      <div style={{ display:'grid', gridTemplateColumns:'repeat(3,1fr)', gap:12 }}>
        {[
          { label:"Today's Revenue", value:`€${Number(stats.total_revenue).toFixed(2)}` },
          { label:'Total Orders',    value:stats.total_orders },
          { label:'Avg Order Value', value:`€${Number(stats.avg_order).toFixed(2)}` },
        ].map(s => (
          <div key={s.label} style={{
            background:'#1a1d2e', border:'1px solid #2d3148', borderRadius:12, padding:16
          }}>
            <div style={{ fontSize:11, color:'#64748b', marginBottom:8 }}>{s.label}</div>
            <div style={{ fontSize:26, fontWeight:600 }}>{s.value}</div>
          </div>
        ))}
      </div>

      <div style={{ background:'#1a1d2e', border:'1px solid #2d3148', borderRadius:12 }}>
        <div style={{ padding:'14px 18px', borderBottom:'1px solid #2d3148', fontSize:14, fontWeight:500 }}>
          All Orders Today ({orders.length})
        </div>
        {orders.length === 0 ? (
          <div style={{ padding:24, textAlign:'center', color:'#64748b', fontSize:13 }}>No orders today yet</div>
        ) : (
          <table style={{ width:'100%', borderCollapse:'collapse', fontSize:13 }}>
            <thead>
              <tr>{['Time','Table','Waiter','Total'].map(h => (
                <th key={h} style={{ padding:'10px 18px', textAlign:'left', fontSize:11, color:'#64748b', borderBottom:'1px solid #2d3148' }}>{h}</th>
              ))}</tr>
            </thead>
            <tbody>
              {orders.map(o => (
                <tr key={o.id}>
                  <td style={{ padding:'10px 18px', borderBottom:'1px solid rgba(45,49,72,0.5)', color:'#64748b', fontSize:11 }}>
                    {new Date(o.created_at).toLocaleTimeString([],{hour:'2-digit',minute:'2-digit'})}
                  </td>
                  <td style={{ padding:'10px 18px', borderBottom:'1px solid rgba(45,49,72,0.5)' }}>{o.table_name||'—'}</td>
                  <td style={{ padding:'10px 18px', borderBottom:'1px solid rgba(45,49,72,0.5)' }}>{o.waiter_name||'—'}</td>
                  <td style={{ padding:'10px 18px', borderBottom:'1px solid rgba(45,49,72,0.5)', color:'#f97316', fontWeight:600 }}>
                    €{Number(o.total).toFixed(2)}
                  </td>
                </tr>
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
  const [form, setForm] = useState({
    cafe_name: 'Caffè Centro',
    address:   'Via Roma 12, Milano',
    vat:       '12345678901',
    footer:    'Grazie! Thank you!'
  })

  const inp = {
    width:'100%', padding:'8px 10px', background:'#252836',
    border:'1px solid #2d3148', borderRadius:7,
    color:'#f1f5f9', fontSize:13
  }

  return (
    <div style={{ display:'flex', flexDirection:'column', gap:16 }}>
      <div style={{ background:'#1a1d2e', border:'1px solid #2d3148', borderRadius:12, padding:18 }}>
        <div style={{ fontSize:14, fontWeight:500, marginBottom:16 }}>☕ Café Info</div>
        {[
          { label:'Café Name',       key:'cafe_name', placeholder:'My Café' },
          { label:'Address',         key:'address',   placeholder:'Street, City' },
          { label:'VAT Number',      key:'vat',       placeholder:'12345678901' },
          { label:'Receipt Footer',  key:'footer',    placeholder:'Thank you!' },
        ].map(f => (
          <div key={f.key} style={{ marginBottom:12 }}>
            <div style={{ fontSize:11, color:'#94a3b8', marginBottom:5 }}>{f.label}</div>
            <input
              style={inp}
              value={form[f.key]}
              placeholder={f.placeholder}
              onChange={e => setForm(p => ({...p, [f.key]: e.target.value}))}
            />
          </div>
        ))}
        <button style={{
          marginTop:8, padding:'10px 24px', background:'#f97316',
          border:'none', borderRadius:7, color:'#fff',
          fontSize:13, cursor:'pointer'
        }}>💾 Save Settings</button>
      </div>

      <div style={{ background:'#1a1d2e', border:'1px solid #2d3148', borderRadius:12, padding:18 }}>
        <div style={{ fontSize:14, fontWeight:500, marginBottom:12 }}>🖨️ Printer</div>
        <div style={{ fontSize:13, color:'#64748b', marginBottom:10 }}>Thermal printer connection</div>
        <select style={{ ...inp, width:'auto', minWidth:260 }}>
          <option>USB - Epson TM-T20III</option>
          <option>LAN - Star TSP143</option>
          <option>None (receipt preview only)</option>
        </select>
      </div>

      <div style={{
        background:'rgba(34,197,94,0.06)', border:'1px solid rgba(34,197,94,0.2)',
        borderRadius:12, padding:16, fontSize:13, color:'#22c55e',
        display:'flex', alignItems:'center', gap:10
      }}>
        ✅ Database connected · All data saved locally · No internet required
      </div>
    </div>
  )
}