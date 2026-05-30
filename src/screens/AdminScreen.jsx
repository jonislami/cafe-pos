import { useState, useEffect } from 'react'

const TABS = ['Dashboard', 'Products', 'Employees', 'Tables', 'Reports', 'Settings']

export default function AdminScreen({ user, onLogout }) {
  const [tab, setTab] = useState('Dashboard')

  return (
    <div className="flex flex-col h-screen bg-slate-950 text-slate-50 overflow-hidden font-sans">

      {/* Top bar */}
      <header className="h-16 px-6 bg-slate-900/50 border-b border-slate-800 flex items-center justify-between shrink-0 backdrop-blur-md">
        <div className="flex items-center gap-4">
          <div className="w-10 h-10 rounded-xl bg-blue-500/10 border border-blue-500/20 flex items-center justify-center font-bold text-blue-500">
            {user.name.split(' ').map(n => n[0]).join('').slice(0, 2)}
          </div>
          <div>
            <div className="text-sm font-semibold">{user.name}</div>
            <div className="text-xs text-slate-500 leading-none">Administrator • Control Center</div>
          </div>
        </div>
        <button
          onClick={onLogout}
          className="px-4 py-2 bg-slate-800 hover:bg-slate-700 border border-slate-700 rounded-lg text-slate-300 transition-colors text-sm font-medium"
        >
          Logout
        </button>
      </header>

      <div className="flex flex-1 overflow-hidden">

        {/* Sidebar */}
        <aside className="w-64 bg-slate-900/30 border-r border-slate-800 flex flex-col py-6 shrink-0">
          <div className="px-6 mb-6">
            <h2 className="text-[10px] font-black text-slate-500 uppercase tracking-[.2em]">Management</h2>
          </div>
          <nav className="flex-1 space-y-1 px-3">
            {TABS.map(t => (
              <button
                key={t}
                onClick={() => setTab(t)}
                className={`w-full flex items-center gap-4 px-4 py-3 rounded-xl text-sm font-bold transition-all group ${
                  tab === t
                    ? 'bg-orange-500 text-white shadow-lg shadow-orange-500/20'
                    : 'text-slate-400 hover:bg-slate-800 hover:text-slate-200'
                }`}
              >
                {t}
              </button>
            ))}
          </nav>

          <div className="px-6 mt-auto">
            <div className="p-4 bg-slate-900/50 border border-slate-800 rounded-2xl">
              <div className="text-[9px] font-bold text-slate-500 uppercase mb-1">System Status</div>
              <div className="flex items-center gap-2">
                <span className="w-2 h-2 bg-green-500 rounded-full animate-pulse" />
                <span className="text-xs font-medium text-slate-300">Operational</span>
              </div>
            </div>
          </div>
        </aside>

        {/* Content Area */}
        <main className="flex-1 overflow-y-auto bg-slate-950/50 p-8 custom-scrollbar">
          <div className="max-w-6xl mx-auto">
            <header className="mb-10">
              <h1 className="text-3xl font-black tracking-tight mb-2">{tab}</h1>
              <p className="text-slate-500 text-sm">Overview and management of your POS {tab.toLowerCase()}.</p>
            </header>

            <div className="animate-in fade-in slide-in-from-bottom-4 duration-500">
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
    </div>
  )
}

// ── Components ──────────────────────────────────────────────────────

function Dashboard() {
  const [stats, setStats] = useState({ total_orders: 0, total_revenue: 0, avg_order: 0 })

  useEffect(() => {
    window.electronAPI.getOrderStats()
      .then(s => { if (s) setStats(s) })
      .catch(console.error)
  }, [])

  return (
    <div className="space-y-8">
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {[
          { label: "Today's Revenue", value: `€${Number(stats.total_revenue).toFixed(2)}`, color: 'text-emerald-500' },
          { label: 'Orders Today', value: stats.total_orders, color: 'text-blue-500' },
          { label: 'Avg Order', value: `€${Number(stats.avg_order).toFixed(2)}`, color: 'text-purple-500' },
          { label: 'Active Waiters', value: '3', color: 'text-orange-500' },
        ].map(s => (
          <div key={s.label} className="bg-slate-900 border border-slate-800 rounded-3xl p-6 hover:border-slate-700 transition-all group">
            <div className="flex justify-between items-start mb-4">
              <span className="text-[10px] font-black text-slate-500 uppercase tracking-widest leading-none mt-2">Live Status</span>
            </div>
            <div className="text-3xl font-black mb-1 transition-transform group-hover:translate-x-1">{s.value}</div>
            <div className="text-xs font-bold text-slate-500 uppercase tracking-widest">{s.label}</div>
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
    <div className="bg-slate-900 border border-slate-800 rounded-3xl overflow-hidden shadow-xl">
      <div className="p-6 border-b border-slate-800 flex items-center justify-between">
        <h3 className="font-bold text-lg">Recent Transactions</h3>
        <button className="text-xs font-bold text-orange-500 hover:underline uppercase tracking-widest">View All</button>
      </div>
      <div className="overflow-x-auto">
        {orders.length === 0 ? (
          <div className="p-20 text-center flex flex-col items-center opacity-40">
            <div className="text-5xl mb-4">📋</div>
            <p className="font-bold uppercase tracking-widest text-xs">No orders processed today</p>
          </div>
        ) : (
          <table className="w-full border-collapse text-sm">
            <thead>
              <tr className="bg-slate-950/50">
                {['Time', 'Table', 'Waiter', 'Status', 'Total'].map(h => (
                  <th key={h} className="px-6 py-4 text-left text-[10px] font-black text-slate-500 uppercase tracking-widest border-b border-slate-800">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/50">
              {orders.slice(0, 8).map(o => (
                <tr key={o.id} className="hover:bg-slate-800/30 transition-colors">
                  <td className="px-6 py-4 whitespace-nowrap font-mono text-xs text-slate-500 uppercase">
                    {new Date(o.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap font-bold text-slate-200">
                    {o.table_name || '—'}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-slate-400">
                    {o.waiter_name || '—'}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className="px-2 py-1 rounded-md bg-emerald-500/10 text-emerald-500 text-[10px] font-black uppercase tracking-tighter">Completed</span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap font-black text-orange-500 text-right">
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

function Products() {
  const [items, setItems] = useState([])
  const [showForm, setShowForm] = useState(false)
  const [editingId, setEditingId] = useState(null)
  const [form, setForm] = useState({ name: '', category: 'coffee', price: '', stock: '', icon: '' })

  useEffect(() => { loadProducts() }, [])

  async function loadProducts() {
    try {
      const prods = await window.electronAPI.getProducts()
      // Sort by category then name for a more professional feel
      const sorted = [...prods].sort((a, b) => {
        if (a.category !== b.category) return a.category.localeCompare(b.category)
        return a.name.localeCompare(b.name)
      })
      setItems(sorted)
    } catch (e) { console.error(e) }
  }

  async function handleSubmit() {
    if (!form.name || !form.price) return
    const payload = {
      ...form,
      price: parseFloat(form.price),
      stock: parseInt(form.stock) || 0
    }

    if (editingId) {
      await window.electronAPI.updateProduct({ ...payload, id: editingId })
    } else {
      await window.electronAPI.addProduct(payload)
    }

    cancelForm()
    loadProducts()
  }

  function handleEdit(item) {
    setForm({
      name: item.name,
      category: item.category,
      price: item.price.toString(),
      stock: item.stock.toString(),
      icon: item.icon || ''
    })
    setEditingId(item.id)
    setShowForm(true)
  }

  function cancelForm() {
    setForm({ name: '', category: 'coffee', price: '', stock: '', icon: '' })
    setEditingId(null)
    setShowForm(false)
  }

  async function handleDelete(id) {
    if (!window.confirm('Are you sure? This will remove the product from active menu.')) return
    await window.electronAPI.deleteProduct(id)
    loadProducts()
  }

  const inpClass = "w-full px-4 py-3 bg-slate-800 border border-slate-700 rounded-xl text-slate-200 text-sm focus:border-orange-500 focus:ring-1 focus:ring-orange-500 transition-all outline-none"
  const labelClass = "block text-[10px] font-black text-slate-500 uppercase tracking-widest mb-2 px-1"

  return (
    <div className="space-y-8">
      {showForm && (
        <div className="bg-slate-900 border border-orange-500/30 rounded-3xl p-8 shadow-2xl animate-in zoom-in-95 duration-200">
          <h3 className="font-bold text-xl mb-6">{editingId ? 'Edit Menu Item' : 'Create New Menu Item'}</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            <div>
              <label className={labelClass}>Product Name</label>
              <input className={inpClass} value={form.name} onChange={e => setForm(p => ({ ...p, name: e.target.value }))} placeholder="e.g. Double Espresso" />
            </div>
            <div>
              <label className={labelClass}>Category</label>
              <select className={inpClass} value={form.category} onChange={e => setForm(p => ({ ...p, category: e.target.value }))}>
                <option value="coffee">Coffee</option>
                <option value="drinks">Drinks</option>
                <option value="food">Food</option>
                <option value="alcohol">Alcohol</option>
                <option value="desserts">Desserts</option>
              </select>
            </div>
            <div>
              <label className={labelClass}>Price (€)</label>
              <input className={inpClass} type="number" step="0.10" value={form.price} onChange={e => setForm(p => ({ ...p, price: e.target.value }))} placeholder="3.50" />
            </div>
            <div>
              <label className={labelClass}>Initial Stock</label>
              <input className={inpClass} type="number" value={form.stock} onChange={e => setForm(p => ({ ...p, stock: e.target.value }))} placeholder="100" />
            </div>
          </div>
          <div className="flex gap-4 mt-10">
            <button onClick={handleSubmit} className="px-8 py-3 bg-orange-500 hover:bg-orange-600 text-white rounded-xl font-bold text-sm shadow-lg shadow-orange-500/20 transition-all">
              {editingId ? 'Update Item' : 'Save Item'}
            </button>
            <button onClick={cancelForm} className="px-8 py-3 bg-slate-800 hover:bg-slate-700 text-slate-400 rounded-xl font-bold text-sm transition-all">
              Discard
            </button>
          </div>
        </div>
      )}

      <div className="bg-slate-900 border border-slate-800 rounded-3xl overflow-hidden shadow-xl">
        <div className="p-6 border-b border-slate-800 flex items-center justify-between">
          <h3 className="font-bold text-lg">Active Menu ({items.length})</h3>
          <button onClick={() => setShowForm(true)} className="px-4 py-2 bg-orange-500 hover:bg-orange-600 text-white rounded-lg font-bold text-xs uppercase tracking-widest transition-all">
            + New Item
          </button>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full border-collapse text-sm">
            <thead>
              <tr className="bg-slate-950/50">
                {['Item', 'Category', 'Price', 'Stock', 'Status', 'Actions'].map(h => (
                  <th key={h} className="px-6 py-4 text-left text-[10px] font-black text-slate-500 uppercase tracking-widest border-b border-slate-800">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/50">
              {items.map(i => (
                <tr key={i.id} className="hover:bg-slate-800/30 transition-colors group">
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className="font-bold text-slate-200">{i.name}</span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className="text-xs font-bold text-slate-500 uppercase tracking-tighter">{i.category}</span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap font-black text-orange-500">
                    €{Number(i.price).toFixed(2)}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-slate-400 font-mono text-xs">
                    {i.stock}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className="px-2 py-1 rounded-md bg-emerald-500/10 text-emerald-500 text-[9px] font-black uppercase tracking-tighter">Active</span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="flex gap-3 opacity-0 group-hover:opacity-100 transition-opacity">
                      <button onClick={() => handleEdit(i)} className="text-orange-500 hover:text-orange-400 text-xs font-bold uppercase tracking-widest">
                        Edit
                      </button>
                      <button onClick={() => handleDelete(i.id)} className="text-red-500 hover:text-red-400 text-xs font-bold uppercase tracking-widest">
                        Delete
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )
}

function Employees() {
  const [emps, setEmps] = useState([])
  const [showForm, setShowForm] = useState(false)
  const [editingId, setEditingId] = useState(null)
  const [form, setForm] = useState({ name: '', role: 'waiter', card_uid: '', pin: '', status: 'active' })

  useEffect(() => { loadEmployees() }, [])

  async function loadEmployees() {
    try {
      const data = await window.electronAPI.getEmployees()
      setEmps(data)
    } catch (e) { console.error(e) }
  }

  async function handleSubmit() {
    if (!form.name) return
    if (editingId) {
      await window.electronAPI.updateEmployee({ ...form, id: editingId })
    } else {
      await window.electronAPI.addEmployee(form)
    }
    cancelForm()
    loadEmployees()
  }

  function handleEdit(e) {
    setForm({
      name: e.name,
      role: e.role,
      card_uid: e.card_uid || '',
      pin: e.pin || '',
      status: e.status
    })
    setEditingId(e.id)
    setShowForm(true)
  }

  function cancelForm() {
    setForm({ name: '', role: 'waiter', card_uid: '', pin: '', status: 'active' })
    setEditingId(null)
    setShowForm(false)
  }

  async function handleDelete(id) {
    if (!window.confirm('Deactivate this employee account?')) return
    await window.electronAPI.deleteEmployee(id)
    loadEmployees()
  }

  const inpClass = "w-full px-4 py-3 bg-slate-800 border border-slate-700 rounded-xl text-slate-200 text-sm focus:border-orange-500 transition-all outline-none"
  const labelClass = "block text-[10px] font-black text-slate-500 uppercase tracking-widest mb-2 px-1"

  return (
    <div className="space-y-8">
      {showForm && (
        <div className="bg-slate-900 border border-orange-500/30 rounded-3xl p-8 shadow-2xl animate-in zoom-in-95 duration-200">
          <h3 className="font-bold text-xl mb-6">{editingId ? 'Edit Employee' : 'Register New Employee'}</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            <div>
              <label className={labelClass}>Full Name</label>
              <input className={inpClass} value={form.name} onChange={e => setForm(p => ({ ...p, name: e.target.value }))} placeholder="Marco Romano" />
            </div>
            <div>
              <label className={labelClass}>Role</label>
              <select className={inpClass} value={form.role} onChange={e => setForm(p => ({ ...p, role: e.target.value }))}>
                <option value="waiter">Server</option>
                <option value="admin">Administrator</option>
                <option value="bartender">Bartender</option>
              </select>
            </div>
            <div>
              <label className={labelClass}>Login PIN (4 digits)</label>
              <input className={inpClass} maxLength={4} value={form.pin} onChange={e => setForm(p => ({ ...p, pin: e.target.value }))} placeholder="1234" />
            </div>
            <div>
              <label className={labelClass}>RFID UID (Optional)</label>
              <input className={inpClass} value={form.card_uid} onChange={e => setForm(p => ({ ...p, card_uid: e.target.value }))} placeholder="A1B2C3D4" />
            </div>
          </div>
          <div className="flex gap-4 mt-10">
            <button onClick={handleSubmit} className="px-8 py-3 bg-orange-500 hover:bg-orange-600 text-white rounded-xl font-bold text-sm shadow-lg shadow-orange-500/20 transition-all">
              {editingId ? 'Update Employee' : 'Confirm Registration'}
            </button>
            <button onClick={cancelForm} className="px-8 py-3 bg-slate-800 hover:bg-slate-700 text-slate-400 rounded-xl font-bold text-sm transition-all">
              Discard
            </button>
          </div>
        </div>
      )}

      <div className="bg-slate-900 border border-slate-800 rounded-3xl overflow-hidden shadow-xl">
        <div className="p-6 border-b border-slate-800 flex items-center justify-between">
          <h3 className="font-bold text-lg">Staff Directory</h3>
          <button onClick={() => setShowForm(true)} className="px-4 py-2 bg-orange-500 hover:bg-orange-600 text-white rounded-lg font-bold text-xs uppercase tracking-widest transition-all">
            + New Employee
          </button>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full border-collapse text-sm">
            <thead>
              <tr className="bg-slate-950/50">
                {['Employee', 'Role', 'Access Methods', 'Status', 'Actions'].map(h => (
                  <th key={h} className="px-6 py-4 text-left text-[10px] font-black text-slate-500 uppercase tracking-widest border-b border-slate-800">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/50">
              {emps.map(e => (
                <tr key={e.id} className="hover:bg-slate-800/30 transition-colors group">
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-full bg-slate-800 flex items-center justify-center font-bold text-[10px] text-slate-400 border border-slate-700">
                        {e.name.split(' ').map(n => n[0]).join('')}
                      </div>
                      <span className="font-bold text-slate-200">{e.name}</span>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className={`px-2 py-1 rounded-md text-[9px] font-black uppercase tracking-tighter ${
                      e.role === 'admin' ? 'bg-blue-500/10 text-blue-500' : 'bg-orange-500/10 text-orange-500'
                    }`}>
                      {e.role}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="flex gap-2">
                      <span title="PIN Access" className={`w-5 h-5 rounded flex items-center justify-center text-[10px] border ${e.pin ? 'border-emerald-500/50 text-emerald-500' : 'border-slate-800 text-slate-700'}`}>🔢</span>
                      <span title="RFID Access" className={`w-5 h-5 rounded flex items-center justify-center text-[10px] border ${e.card_uid ? 'border-emerald-500/50 text-emerald-500' : 'border-slate-800 text-slate-700'}`}>📡</span>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className={`px-2 py-1 rounded-md text-[9px] font-black uppercase tracking-tighter ${
                      e.status === 'active' ? 'bg-emerald-500/10 text-emerald-500' : 'bg-red-500/10 text-red-500'
                    }`}>
                      {e.status}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="flex gap-3 opacity-0 group-hover:opacity-100 transition-opacity">
                      <button onClick={() => handleEdit(e)} className="text-orange-500 hover:text-orange-400 text-xs font-bold uppercase tracking-widest">
                        Edit
                      </button>
                      <button onClick={() => handleDelete(e.id)} className="text-red-500 hover:text-red-400 text-xs font-bold uppercase tracking-widest">
                        Delete
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )
}

function TablesTab() {
  const [tables, setTables] = useState([])
  const [newName, setNewName] = useState('')
  const [showForm, setShowForm] = useState(false)

  useEffect(() => { loadTables() }, [])

  async function loadTables() {
    try {
      const data = await window.electronAPI.getTables()
      setTables(data)
    } catch (e) { console.error(e) }
  }

  async function handleAdd() {
    if (!newName.trim()) return
    await window.electronAPI.addTable(newName.trim())
    setNewName('')
    setShowForm(false)
    loadTables()
  }

  async function handleDelete(id) {
    if (!window.confirm('Delete this table?')) return
    await window.electronAPI.deleteTable(id)
    loadTables()
  }

  return (
    <div className="space-y-8">
      {showForm && (
        <div className="bg-slate-900 border border-slate-700 rounded-3xl p-6 flex items-end gap-4 max-w-xl animate-in fade-in slide-in-from-top-4">
          <div className="flex-1">
            <label className="block text-[10px] font-black text-slate-500 uppercase tracking-widest mb-2 px-1">Table Label / Location</label>
            <input
              value={newName}
              onChange={e => setNewName(e.target.value)}
              placeholder="e.g. Balcony T-01"
              className="w-full px-4 py-3 bg-slate-800 border border-slate-700 rounded-xl text-slate-200 outline-none focus:border-orange-500"
            />
          </div>
          <button onClick={handleAdd} className="h-12 px-8 bg-orange-500 hover:bg-orange-600 text-white rounded-xl font-bold transition-all">Add</button>
          <button onClick={() => setShowForm(false)} className="h-12 px-6 bg-slate-800 text-slate-400 rounded-xl font-bold transition-all">Cancel</button>
        </div>
      )}

      <div className="bg-slate-900 border border-slate-800 rounded-3xl p-8 shadow-xl">
        <div className="flex justify-between items-center mb-8">
          <h3 className="font-bold text-lg">Floor Map ({tables.length} Tables)</h3>
          {!showForm && <button onClick={() => setShowForm(true)} className="px-4 py-2 bg-orange-500 hover:bg-orange-600 text-white rounded-lg font-bold text-xs uppercase tracking-widest transition-all">+ Add Table</button>}
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-6">
          {tables.map(t => (
            <div key={t.id} className="relative aspect-square bg-slate-950 border border-slate-800 rounded-3xl p-6 flex flex-col items-center justify-center transition-all hover:border-slate-600 group">
              <div className="font-black text-slate-200 uppercase tracking-widest text-lg">{t.name}</div>
              <div className="mt-2 flex items-center gap-1.5">
                <span className="w-1.5 h-1.5 bg-emerald-500 rounded-full" />
                <span className="text-[9px] font-black text-slate-500 uppercase tracking-tighter">Operational</span>
              </div>
              <button
                onClick={() => handleDelete(t.id)}
                className="absolute top-4 right-4 w-6 h-6 rounded-full bg-slate-800 flex items-center justify-center text-red-500 opacity-0 group-hover:opacity-100 transition-opacity hover:bg-red-500 hover:text-white"
              >
                ×
              </button>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}

function Reports() {
  const [stats, setStats] = useState({ total_orders: 0, total_revenue: 0, avg_order: 0 })
  const [orders, setOrders] = useState([])

  useEffect(() => {
    window.electronAPI.getOrderStats().then(s => { if (s) setStats(s) }).catch(console.error)
    window.electronAPI.getTodayOrders().then(o => setOrders(o || [])).catch(console.error)
  }, [])

  return (
    <div className="space-y-8">
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {[
          { label: "Gross Revenue", value: `€${Number(stats.total_revenue).toFixed(2)}` },
          { label: 'Completed Orders', value: stats.total_orders },
          { label: 'Average Ticket', value: `€${Number(stats.avg_order).toFixed(2)}` },
        ].map(s => (
          <div key={s.label} className="bg-slate-900 border border-slate-800 rounded-3xl p-6">
            <div className="text-[10px] font-black text-slate-500 uppercase tracking-[.2em] mb-4">{s.label}</div>
            <div className="text-4xl font-black">{s.value}</div>
          </div>
        ))}
      </div>

      <div className="bg-slate-900 border border-slate-800 rounded-3xl overflow-hidden shadow-xl">
        <div className="p-6 border-b border-slate-800 bg-slate-950/30">
          <h3 className="font-bold text-lg">Sales History</h3>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full border-collapse text-sm">
            <thead>
              <tr className="bg-slate-950/50">
                {['Timestamp', 'Table ID', 'Assigned Staff', 'Method', 'Total'].map(h => (
                  <th key={h} className="px-6 py-4 text-left text-[10px] font-black text-slate-500 uppercase tracking-widest border-b border-slate-800">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/50">
              {orders.map(o => (
                <tr key={o.id} className="hover:bg-slate-800/30 transition-colors">
                  <td className="px-6 py-4 whitespace-nowrap font-mono text-xs text-slate-500">
                    {new Date(o.created_at).toLocaleString()}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap font-bold text-slate-300">{o.table_name || '—'}</td>
                  <td className="px-6 py-4 whitespace-nowrap text-slate-400">{o.waiter_name || '—'}</td>
                  <td className="px-6 py-4 whitespace-nowrap text-[10px] font-bold text-slate-600 uppercase italic">In-Store</td>
                  <td className="px-6 py-4 whitespace-nowrap font-black text-orange-500 text-right">
                    €{Number(o.total).toFixed(2)}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )
}

function Settings() {
  const [form, setForm] = useState({
    cafe_name: 'Caffè Centro',
    address: 'Via Roma 12, Milano',
    vat: '12345678901',
    footer: 'Grazie! Thank you!'
  })

  const inpClass = "w-full px-4 py-3 bg-slate-800 border border-slate-700 rounded-xl text-slate-200 text-sm focus:border-orange-500 transition-all outline-none"
  const labelClass = "block text-[10px] font-black text-slate-500 uppercase tracking-widest mb-2 px-1"

  return (
    <div className="space-y-8 max-w-4xl">
      <div className="bg-slate-900 border border-slate-800 rounded-3xl p-8 shadow-xl">
        <h3 className="font-bold text-xl mb-8 flex items-center gap-3">
          <span className="text-2xl">🏪</span> Establishment Profile
        </h3>
        <div className="space-y-6">
          {[
            { label: 'Business Name', key: 'cafe_name', placeholder: 'The Great Coffee Shop' },
            { label: 'Legal Address', key: 'address', placeholder: '123 Business St, London' },
            { label: 'VAT / Tax Registration', key: 'vat', placeholder: 'GB123456789' },
            { label: 'Receipt Footer Message', key: 'footer', placeholder: 'We hope to see you again soon!' },
          ].map(f => (
            <div key={f.key}>
              <label className={labelClass}>{f.label}</label>
              <input
                className={inpClass}
                value={form[f.key]}
                placeholder={f.placeholder}
                onChange={e => setForm(p => ({ ...p, [f.key]: e.target.value }))}
              />
            </div>
          ))}
          <div className="pt-4">
            <button className="px-10 py-4 bg-orange-500 hover:bg-orange-600 text-white rounded-2xl font-black uppercase tracking-[.2em] text-xs shadow-xl shadow-orange-500/20 transition-all active:scale-[0.98]">
              Update Settings
            </button>
          </div>
        </div>
      </div>

      <div className="bg-slate-900 border border-slate-800 rounded-3xl p-8 shadow-xl">
        <h3 className="font-bold text-xl mb-6 flex items-center gap-3">
          <span className="text-2xl">🖨️</span> Hardware Integration
        </h3>
        <div className="p-6 bg-slate-950/50 border border-slate-800 rounded-2xl">
          <label className={labelClass}>Thermal Receipt Printer</label>
          <select className={inpClass + " max-w-md"}>
            <option>System Default (PDF Preview)</option>
            <option disabled>USB - Epson TM-T20III (Disconnected)</option>
            <option disabled>LAN - Star TSP143 (Searching...)</option>
          </select>
          <p className="mt-4 text-[10px] text-slate-500 font-bold uppercase tracking-widest leading-loose">
            Note: Native printing requires the Printer Bridge driver to be active in the system tray.
          </p>
        </div>
      </div>
    </div>
  )
}
