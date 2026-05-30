import { useState, useEffect } from 'react'

const TABS = ['Dashboard', 'Products', 'Employees', 'Tables', 'Reports', 'Settings']

export default function AdminScreen({ user, onLogout }) {
  const [tab, setTab] = useState('Dashboard')

  return (
    <div className="flex h-screen bg-slate-950 text-slate-200 overflow-hidden font-sans">

      {/* Sidebar - Cleaner & more minimalist */}
      <aside className="w-64 bg-slate-900/40 border-r border-slate-800/50 flex flex-col py-8 shrink-0">
        <div className="px-8 mb-10">
          <h1 className="text-xl font-black tracking-tighter text-blue-500">CaféPOS</h1>
          <p className="text-[10px] text-slate-500 font-bold uppercase tracking-widest mt-1">Admin Panel</p>
        </div>

        <nav className="flex-1 px-4 space-y-1">
          {TABS.map(t => (
            <button
              key={t}
              onClick={() => setTab(t)}
              className={`w-full flex items-center px-4 py-3 rounded-lg text-sm font-medium transition-all ${
                tab === t
                  ? 'bg-blue-600/10 text-blue-400 border border-blue-500/20'
                  : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/50'
              }`}
            >
              {t}
            </button>
          ))}
        </nav>

        <div className="px-6 mt-auto">
          <div className="p-4 rounded-xl border border-slate-800/50 bg-slate-900/30">
            <div className="text-xs font-semibold text-slate-300 truncate">{user.name}</div>
            <button onClick={onLogout} className="text-[10px] text-slate-500 hover:text-red-400 font-bold uppercase tracking-widest mt-2 transition-colors">Sign Out</button>
          </div>
        </div>
      </aside>

      {/* Main Content Area */}
      <main className="flex-1 overflow-y-auto p-10 bg-[#0a0c10]">
        <div className="max-w-5xl mx-auto">
          <header className="mb-12 flex justify-between items-end">
            <div>
              <h2 className="text-4xl font-black tracking-tight text-white mb-2">{tab}</h2>
              <p className="text-slate-500 text-sm">Manage your business settings and data.</p>
            </div>
          </header>

          <div className="animate-in fade-in slide-in-from-bottom-2 duration-300">
            {tab === 'Dashboard' && <Dashboard />}
            {tab === 'Products'  && <Products />}
            {tab === 'Employees' && <Employees />}
            {tab === 'Tables'    && <TablesTab />}
            {tab === 'Reports'   && <Reports />}
            {tab === 'Settings'  && <Settings />}
          </div>
        </div>
      </main>
    </div>
  )
}

// ── Shared UI Components ──────────────────────────────────────────

const Card = ({ children, className = "" }) => (
  <div className={`bg-slate-900/50 border border-slate-800/50 rounded-2xl ${className}`}>
    {children}
  </div>
)

const Input = (props) => (
  <input {...props} className="w-full px-4 py-2.5 bg-slate-950 border border-slate-800 rounded-xl text-sm focus:border-blue-500/50 transition-all outline-none" />
)

const Select = (props) => (
  <select {...props} className="w-full px-4 py-2.5 bg-slate-950 border border-slate-800 rounded-xl text-sm focus:border-blue-500/50 transition-all outline-none appearance-none" />
)

const Button = ({ children, variant = 'primary', ...props }) => {
  const styles = {
    primary: "bg-blue-600 hover:bg-blue-500 text-white shadow-lg shadow-blue-600/20",
    secondary: "bg-slate-800 hover:bg-slate-700 text-slate-300",
    danger: "bg-red-500/10 hover:bg-red-500 text-red-500 hover:text-white border border-red-500/20"
  }
  return (
    <button {...props} className={`px-5 py-2.5 rounded-xl text-xs font-bold uppercase tracking-widest transition-all ${styles[variant]}`}>
      {children}
    </button>
  )
}

// ── Sub-screens ───────────────────────────────────────────────────

function Dashboard() {
  const [stats, setStats] = useState({ total_orders: 0, total_revenue: 0, avg_order: 0 })

  useEffect(() => {
    window.electronAPI.getOrderStats().then(s => s && setStats(s)).catch(console.error)
  }, [])

  return (
    <div className="space-y-12">
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {[
          { label: "Revenue", value: `€${Number(stats.total_revenue).toFixed(2)}`, color: 'text-blue-400' },
          { label: 'Orders', value: stats.total_orders, color: 'text-slate-100' },
          { label: 'Average', value: `€${Number(stats.avg_order).toFixed(2)}`, color: 'text-slate-100' },
        ].map(s => (
          <Card key={s.label} className="p-8">
            <div className="text-[10px] font-black text-slate-500 uppercase tracking-[.2em] mb-4">{s.label}</div>
            <div className={`text-4xl font-black ${s.color}`}>{s.value}</div>
          </Card>
        ))}
      </div>
      <RecentOrders />
    </div>
  )
}

function RecentOrders() {
  const [orders, setOrders] = useState([])
  useEffect(() => {
    window.electronAPI.getTodayOrders().then(o => setOrders(o || [])).catch(console.error)
  }, [])

  return (
    <Card className="overflow-hidden">
      <div className="p-6 border-b border-slate-800/50 flex justify-between items-center">
        <h3 className="font-bold text-sm text-slate-400 uppercase tracking-widest">Recent Activity</h3>
      </div>
      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="text-left text-[10px] font-black text-slate-600 uppercase tracking-widest">
              <th className="px-8 py-4 border-b border-slate-800/50">Time</th>
              <th className="px-8 py-4 border-b border-slate-800/50">Table</th>
              <th className="px-8 py-4 border-b border-slate-800/50 text-right">Total</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-800/30">
            {orders.slice(0, 5).map(o => (
              <tr key={o.id} className="hover:bg-slate-800/20 transition-colors">
                <td className="px-8 py-5 text-slate-500 font-mono text-xs">{new Date(o.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</td>
                <td className="px-8 py-5 font-bold">{o.table_name}</td>
                <td className="px-8 py-5 text-right font-black text-blue-400">€{Number(o.total).toFixed(2)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </Card>
  )
}

function Products() {
  const [items, setItems] = useState([])
  const [showForm, setShowForm] = useState(false)
  const [editingId, setEditingId] = useState(null)
  const [form, setForm] = useState({ name: '', category: 'coffee', price: '', stock: '' })

  useEffect(() => { loadProducts() }, [])

  async function loadProducts() {
    try {
      const prods = await window.electronAPI.getProducts()
      const sorted = [...prods].sort((a, b) => a.category.localeCompare(b.category) || a.name.localeCompare(b.name))
      setItems(sorted)
    } catch (e) { console.error(e) }
  }

  async function handleSubmit() {
    if (!form.name || !form.price) return
    const p = { ...form, price: parseFloat(form.price), stock: parseInt(form.stock) || 0 }
    if (editingId) await window.electronAPI.updateProduct({ ...p, id: editingId })
    else await window.electronAPI.addProduct(p)
    cancel()
    loadProducts()
  }

  const cancel = () => { setEditingId(null); setShowForm(false); setForm({ name: '', category: 'coffee', price: '', stock: '' }) }

  return (
    <div className="space-y-8">
      <div className="flex justify-end">
        {!showForm && <Button onClick={() => setShowForm(true)}>Add Product</Button>}
      </div>

      {showForm && (
        <Card className="p-8 border-blue-500/20 shadow-2xl shadow-blue-900/10">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div><label className="text-[10px] font-black text-slate-500 uppercase tracking-widest mb-2 block">Name</label><Input value={form.name} onChange={e=>setForm(f=>({...f, name:e.target.value}))}/></div>
            <div><label className="text-[10px] font-black text-slate-500 uppercase tracking-widest mb-2 block">Category</label>
              <Select value={form.category} onChange={e=>setForm(f=>({...f, category:e.target.value}))}>
                {['coffee','drinks','food','alcohol','desserts'].map(c=><option key={c} value={c}>{c}</option>)}
              </Select>
            </div>
            <div><label className="text-[10px] font-black text-slate-500 uppercase tracking-widest mb-2 block">Price (€)</label><Input type="number" value={form.price} onChange={e=>setForm(f=>({...f, price:e.target.value}))}/></div>
            <div><label className="text-[10px] font-black text-slate-500 uppercase tracking-widest mb-2 block">Stock</label><Input type="number" value={form.stock} onChange={e=>setForm(f=>({...f, stock:e.target.value}))}/></div>
          </div>
          <div className="flex gap-3 mt-8">
            <Button onClick={handleSubmit}>{editingId ? 'Update' : 'Save'}</Button>
            <Button variant="secondary" onClick={cancel}>Cancel</Button>
          </div>
        </Card>
      )}

      <Card className="overflow-hidden">
        <table className="w-full text-sm">
          <thead>
            <tr className="text-left text-[10px] font-black text-slate-600 uppercase tracking-widest">
              <th className="px-8 py-4 border-b border-slate-800/50">Name</th>
              <th className="px-8 py-4 border-b border-slate-800/50">Category</th>
              <th className="px-8 py-4 border-b border-slate-800/50">Price</th>
              <th className="px-8 py-4 border-b border-slate-800/50 text-right">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-800/30">
            {items.map(i => (
              <tr key={i.id} className="group hover:bg-slate-800/20 transition-colors">
                <td className="px-8 py-5 font-bold text-slate-100">{i.name}</td>
                <td className="px-8 py-5 text-slate-500 uppercase text-[10px] font-bold">{i.category}</td>
                <td className="px-8 py-5 font-bold text-blue-400">€{i.price.toFixed(2)}</td>
                <td className="px-8 py-5 text-right opacity-0 group-hover:opacity-100 transition-opacity space-x-4">
                  <button onClick={() => { setEditingId(i.id); setForm({ ...i, price: i.price.toString() }); setShowForm(true) }} className="text-xs font-bold text-slate-400 hover:text-white uppercase tracking-widest">Edit</button>
                  <button onClick={async () => { if(confirm('Delete?')) { await window.electronAPI.deleteProduct(i.id); loadProducts() } }} className="text-xs font-bold text-red-500/50 hover:text-red-500 uppercase tracking-widest">Delete</button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </Card>
    </div>
  )
}

function Employees() {
  const [emps, setEmps] = useState([])
  const [showForm, setShowForm] = useState(false)
  const [editingId, setEditingId] = useState(null)
  const [form, setForm] = useState({ name: '', role: 'waiter', pin: '', status: 'active' })

  useEffect(() => { load() }, [])
  const load = () => window.electronAPI.getEmployees().then(setEmps)
  const cancel = () => { setShowForm(false); setEditingId(null); setForm({ name: '', role: 'waiter', pin: '', status: 'active' }) }

  async function handleSubmit() {
    if (!form.name) return
    if (editingId) await window.electronAPI.updateEmployee({ ...form, id: editingId })
    else await window.electronAPI.addEmployee(form)
    cancel(); load()
  }

  return (
    <div className="space-y-8">
      <div className="flex justify-end">
        {!showForm && <Button onClick={() => setShowForm(true)}>Add Staff</Button>}
      </div>
      {showForm && (
        <Card className="p-8 border-blue-500/20">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div><label className="text-[10px] font-black text-slate-500 uppercase tracking-widest mb-2 block">Full Name</label><Input value={form.name} onChange={e=>setForm(f=>({...f, name:e.target.value}))}/></div>
            <div><label className="text-[10px] font-black text-slate-500 uppercase tracking-widest mb-2 block">Role</label>
              <Select value={form.role} onChange={e=>setForm(f=>({...f, role:e.target.value}))}>
                <option value="waiter">Server</option><option value="admin">Admin</option>
              </Select>
            </div>
            <div><label className="text-[10px] font-black text-slate-500 uppercase tracking-widest mb-2 block">Login PIN</label><Input maxLength={4} value={form.pin} onChange={e=>setForm(f=>({...f, pin:e.target.value}))}/></div>
          </div>
          <div className="flex gap-3 mt-8">
            <Button onClick={handleSubmit}>Save</Button><Button variant="secondary" onClick={cancel}>Cancel</Button>
          </div>
        </Card>
      )}
      <Card className="overflow-hidden">
        <table className="w-full text-sm">
          <thead>
            <tr className="text-left text-[10px] font-black text-slate-600 uppercase tracking-widest">
              <th className="px-8 py-4 border-b border-slate-800/50">Name</th>
              <th className="px-8 py-4 border-b border-slate-800/50">Role</th>
              <th className="px-8 py-4 border-b border-slate-800/50 text-right">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-800/30">
            {emps.map(e => (
              <tr key={e.id} className="group hover:bg-slate-800/20 transition-colors">
                <td className="px-8 py-5 font-bold">{e.name}</td>
                <td className="px-8 py-5 text-xs text-slate-500 uppercase font-semibold">{e.role}</td>
                <td className="px-8 py-5 text-right opacity-0 group-hover:opacity-100 transition-opacity space-x-4">
                  <button onClick={() => { setEditingId(e.id); setForm({ ...e, pin: e.pin || '' }); setShowForm(true) }} className="text-xs font-bold text-slate-400 hover:text-white uppercase tracking-widest">Edit</button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </Card>
    </div>
  )
}

function TablesTab() {
  const [tables, setTables] = useState([])
  const [newName, setNewName] = useState('')
  const [showForm, setShowForm] = useState(false)

  useEffect(() => { load() }, [])
  const load = () => window.electronAPI.getTables().then(setTables)

  async function handleAdd() {
    if (!newName.trim()) return
    await window.electronAPI.addTable(newName.trim())
    setNewName(''); setShowForm(false); load()
  }

  return (
    <div className="space-y-10">
      <div className="flex justify-end">{!showForm && <Button onClick={()=>setShowForm(true)}>Add Table</Button>}</div>
      {showForm && (
        <Card className="p-8 flex items-end gap-4 max-w-xl">
          <div className="flex-1">
            <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest mb-2 block">Table Name</label>
            <Input value={newName} onChange={e=>setNewName(e.target.value)} placeholder="e.g. VIP 01" />
          </div>
          <Button onClick={handleAdd}>Add</Button>
          <Button variant="secondary" onClick={()=>setShowForm(false)}>Cancel</Button>
        </Card>
      )}
      <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-6 gap-4">
        {tables.map(t => (
          <Card key={t.id} className="p-6 flex flex-col items-center justify-center hover:border-slate-600 transition-all group relative">
            <div className="font-black text-white text-lg">{t.name}</div>
            <div className="text-[9px] font-bold text-slate-600 uppercase tracking-tighter mt-1">Operational</div>
            <button onClick={async () => { if(confirm('Remove?')) { await window.electronAPI.deleteTable(t.id); load() } }} className="absolute -top-2 -right-2 w-6 h-6 bg-red-500 text-white rounded-full flex items-center justify-center text-xs opacity-0 group-hover:opacity-100 transition-opacity">×</button>
          </Card>
        ))}
      </div>
    </div>
  )
}

function Reports() {
  const [stats, setStats] = useState({ total_orders: 0, total_revenue: 0, avg_order: 0 })
  const [orders, setOrders] = useState([])
  useEffect(() => {
    window.electronAPI.getOrderStats().then(s => s && setStats(s)).catch(console.error)
    window.electronAPI.getTodayOrders().then(o => setOrders(o || [])).catch(console.error)
  }, [])

  return (
    <div className="space-y-12">
      <Card className="overflow-hidden">
        <div className="p-6 border-b border-slate-800/50 bg-slate-900/20">
          <h3 className="font-bold text-sm text-slate-400 uppercase tracking-widest">Revenue Breakdown</h3>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="text-left text-[10px] font-black text-slate-600 uppercase tracking-widest">
                <th className="px-8 py-4 border-b border-slate-800/50">Time</th>
                <th className="px-8 py-4 border-b border-slate-800/50">Staff</th>
                <th className="px-8 py-4 border-b border-slate-800/50 text-right">Total</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/30">
              {orders.map(o => (
                <tr key={o.id}>
                  <td className="px-8 py-4 text-slate-500 font-mono text-xs">{new Date(o.created_at).toLocaleString()}</td>
                  <td className="px-8 py-4 font-bold">{o.waiter_name}</td>
                  <td className="px-8 py-4 text-right font-black text-blue-400">€{Number(o.total).toFixed(2)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Card>
    </div>
  )
}

function Settings() {
  const [form, setForm] = useState({ cafe_name: 'Caffè Centro', address: 'Via Roma 12, Milano', vat: '12345678901', footer: 'Grazie!' })
  return (
    <Card className="p-10 max-w-2xl">
      <div className="space-y-8">
        {[
          { label: 'Business Name', key: 'cafe_name' },
          { label: 'Legal Address', key: 'address' },
          { label: 'VAT Registration', key: 'vat' },
          { label: 'Footer Message', key: 'footer' },
        ].map(f => (
          <div key={f.key}>
            <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest mb-2 block">{f.label}</label>
            <Input value={form[f.key]} onChange={e => setForm(p => ({ ...p, [f.key]: e.target.value }))} />
          </div>
        ))}
        <div className="pt-4 border-t border-slate-800/50">
          <Button>Update Configuration</Button>
        </div>
      </div>
    </Card>
  )
}
