import { useState, useEffect } from 'react'

const CATS = ['All', 'coffee', 'drinks', 'food', 'alcohol', 'desserts']

export default function WaiterScreen({ user, onLogout }) {
  const [products, setProducts] = useState([])
  const [tables, setTables] = useState([])
  const [selectedTable, setSelectedTable] = useState(null)
  const [orders, setOrders] = useState({})
  const [cat, setCat] = useState('All')
  const [showReceipt, setShowReceipt] = useState(false)

  useEffect(() => {
    async function loadData() {
      try {
        const prods = await window.electronAPI.getProducts()
        const tbls = await window.electronAPI.getTables()
        const activeOrders = await window.electronAPI.getActiveOrders()
        setProducts(prods)
        setTables(tbls)
        setOrders(activeOrders || {})
      } catch (e) {
        console.error('Failed to load data:', e)
      }
    }
    loadData()

    const interval = setInterval(async () => {
      try {
        const activeOrders = await window.electronAPI.getActiveOrders()
        setOrders(prev => {
          if (selectedTable && prev[selectedTable.id]) {
            return { ...activeOrders, [selectedTable.id]: prev[selectedTable.id] }
          }
          return activeOrders || {}
        })
      } catch (e) {
        console.error('Failed to sync orders:', e)
      }
    }, 5000)

    return () => clearInterval(interval)
  }, [selectedTable])

  const initials = user.name.split(' ').map(n => n[0]).join('').slice(0, 2)
  const filtered = cat === 'All' ? products : products.filter(p => p.category === cat)
  const currentOrder = selectedTable ? (orders[selectedTable.id] || []) : []
  const total = currentOrder.reduce((s, i) => s + i.price * i.qty, 0)
  const itemCount = currentOrder.reduce((s, i) => s + i.qty, 0)

  function tableHasItems(tableId) {
    return (orders[tableId] || []).length > 0
  }

  async function syncTable(tableId, items) {
    try {
      const total = items.reduce((s, i) => s + i.price * i.qty, 0)
      await window.electronAPI.syncTableOrder({
        tableId,
        employeeId: user.id,
        items,
        total
      })
    } catch (e) {
      console.error('Failed to sync table:', e)
    }
  }

  function addProduct(p) {
    if (!selectedTable) return
    const tableOrder = orders[selectedTable.id] || []
    const existing = tableOrder.find(x => x.name === p.name)
    const updated = existing
      ? tableOrder.map(x => x.name === p.name ? { ...x, qty: x.qty + 1 } : x)
      : [...tableOrder, { ...p, qty: 1 }]

    setOrders(prev => ({ ...prev, [selectedTable.id]: updated }))
    syncTable(selectedTable.id, updated)
  }

  function changeQty(name, delta) {
    if (!selectedTable) return
    const tableOrder = orders[selectedTable.id] || []
    const updated = tableOrder
      .map(x => x.name === name ? { ...x, qty: x.qty + delta } : x)
      .filter(x => x.qty > 0)

    setOrders(prev => ({ ...prev, [selectedTable.id]: updated }))
    syncTable(selectedTable.id, updated)
  }

  async function printReceipt() {
    if (!currentOrder.length) return
    try {
      await window.electronAPI.addOrder({
        table_id: selectedTable.id,
        employee_id: user.id,
        total: total,
        items: currentOrder.map(i => ({
          name: i.name,
          icon: i.icon,
          qty: i.qty,
          price: i.price
        }))
      })
    } catch (e) {
      console.error('Order save failed:', e)
    }
    setShowReceipt(true)
  }

  function closeReceipt() {
    setShowReceipt(false)
    setOrders(prev => ({ ...prev, [selectedTable.id]: [] }))
    setSelectedTable(null)
  }

  return (
    <div className="flex flex-col h-screen bg-slate-950 text-slate-50 overflow-hidden">
      {/* Top bar */}
      <header className="h-16 px-6 bg-slate-900/50 border-b border-slate-800 flex items-center justify-between shrink-0 backdrop-blur-md">
        <div className="flex items-center gap-4">
          <div className="w-10 h-10 rounded-xl bg-orange-500/10 border border-orange-500/20 flex items-center justify-center font-bold text-orange-500">
            {initials}
          </div>
          <div>
            <div className="text-sm font-semibold">{user.name}</div>
            <div className="text-xs text-slate-500 leading-none">Server • Shift Active</div>
          </div>
        </div>

        {selectedTable && (
          <div className="px-4 py-1.5 bg-orange-500/10 border border-orange-500/30 rounded-full flex items-center gap-2">
            <span className="text-orange-500 font-bold text-sm uppercase tracking-wider">{selectedTable.name}</span>
          </div>
        )}

        <button
          onClick={onLogout}
          className="px-4 py-2 bg-slate-800 hover:bg-slate-700 border border-slate-700 rounded-lg text-slate-300 transition-colors text-sm font-medium"
        >
          Logout
        </button>
      </header>

      {/* Main content */}
      <main className="flex flex-1 overflow-hidden">
        {/* Tables panel */}
        <aside className={`bg-slate-900/30 border-r border-slate-800 flex flex-col transition-all duration-300 ${selectedTable ? 'w-64' : 'w-full'}`}>
          <div className="p-4 border-b border-slate-800 shrink-0 flex items-center justify-between">
            <h2 className="text-sm font-bold text-slate-400 uppercase tracking-widest">Tables</h2>
            {!selectedTable && <span className="text-xs text-slate-500">{tables.length} Active</span>}
          </div>
          <div className={`flex-1 overflow-y-auto p-4 grid gap-3 content-start ${selectedTable ? 'grid-cols-2' : 'grid-cols-2 md:grid-cols-4 lg:grid-cols-6 xl:grid-cols-8'}`}>
            {tables.map(t => {
              const hasItems = tableHasItems(t.id)
              const isSelected = selectedTable?.id === t.id
              return (
                <button
                  key={t.id}
                  onClick={() => setSelectedTable(t)}
                  className={`relative p-4 rounded-xl border transition-all duration-200 group ${
                    isSelected
                      ? 'bg-orange-500/20 border-orange-500 shadow-[0_0_15px_rgba(249,115,22,0.2)]'
                      : hasItems
                        ? 'bg-emerald-500/5 border-emerald-500/30 hover:border-emerald-500/50'
                        : 'bg-slate-900/50 border-slate-800 hover:border-slate-700'
                  }`}
                >
                  <div className={`font-bold text-lg ${isSelected ? 'text-orange-500' : 'text-slate-200'}`}>{t.name}</div>
                  <div className={`text-[10px] mt-1 font-medium uppercase tracking-tighter ${hasItems ? 'text-emerald-500' : 'text-slate-600'}`}>
                    {hasItems ? `${(orders[t.id] || []).reduce((s, i) => s + i.qty, 0)} items` : 'Free'}
                  </div>
                </button>
              )
            })}
          </div>
        </aside>

        {/* Order screen */}
        {selectedTable && (
          <>
            {/* Products panel */}
            <section className="flex-1 flex flex-col bg-slate-950/50">
              {/* Categories */}
              <nav className="flex gap-2 p-4 border-b border-slate-800 overflow-x-auto no-scrollbar shrink-0">
                {CATS.map(c => (
                  <button
                    key={c}
                    onClick={() => setCat(c)}
                    className={`px-5 py-2 rounded-xl text-xs font-bold uppercase tracking-wider transition-all whitespace-nowrap border ${
                      cat === c
                        ? 'bg-orange-500 border-orange-500 text-white shadow-lg'
                        : 'bg-slate-900 border-slate-800 text-slate-400 hover:border-slate-700 hover:text-slate-200'
                    }`}
                  >
                    {c}
                  </button>
                ))}
              </nav>

              {/* Products grid */}
              <div className="flex-1 overflow-y-auto p-4 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3 content-start">
                {filtered.map(p => (
                  <button
                    key={p.id}
                    onClick={() => addProduct(p)}
                    className="bg-slate-900/50 border border-slate-800 rounded-xl p-4 hover:border-orange-500/50 hover:bg-slate-800/50 transition-all text-left flex flex-col justify-between h-24 group active:scale-[0.98]"
                  >
                    <div className="text-sm font-bold text-slate-200 line-clamp-2">{p.name}</div>
                    <div className="text-orange-500 font-black text-base mt-auto">€{Number(p.price).toFixed(2)}</div>
                  </button>
                ))}
              </div>
            </section>

            {/* Order summary */}
            <section className="w-96 bg-slate-900 border-l border-slate-800 flex flex-col shadow-2xl">
              <div className="p-4 border-b border-slate-800 flex items-center justify-between shrink-0">
                <h2 className="text-sm font-bold text-slate-400 uppercase tracking-widest">Current Order</h2>
                <button
                  onClick={() => setOrders(prev => ({ ...prev, [selectedTable.id]: [] }))}
                  className="text-[10px] font-bold text-slate-600 hover:text-red-400 uppercase transition-colors"
                >Clear All</button>
              </div>

              <div className="flex-1 overflow-y-auto p-4 space-y-2">
                {currentOrder.length === 0 ? (
                  <div className="h-full flex flex-col items-center justify-center text-slate-600 opacity-40 text-center">
                    <p className="font-bold uppercase tracking-widest text-[10px]">No items selected</p>
                  </div>
                ) : currentOrder.map(i => (
                  <div key={i.name} className="bg-slate-800/50 border border-slate-700/50 rounded-lg p-3 flex items-center gap-3">
                    <div className="flex-1 min-w-0">
                      <div className="text-xs font-bold text-slate-200 truncate">{i.name}</div>
                      <div className="text-[10px] text-slate-500 font-medium mt-0.5">€{i.price.toFixed(2)} / unit</div>
                    </div>
                    <div className="flex items-center gap-2 bg-slate-950 p-1 rounded-lg border border-slate-700/50">
                      <button
                        onClick={() => changeQty(i.name, -1)}
                        className="w-7 h-7 flex items-center justify-center rounded-md hover:bg-slate-800 text-slate-300 transition-colors"
                      >−</button>
                      <span className="text-xs font-bold w-4 text-center">{i.qty}</span>
                      <button
                        onClick={() => changeQty(i.name, 1)}
                        className="w-7 h-7 flex items-center justify-center rounded-md hover:bg-slate-800 text-slate-300 transition-colors"
                      >+</button>
                    </div>
                    <div className="text-sm font-bold text-orange-500 min-w-[50px] text-right">
                      €{(i.price * i.qty).toFixed(2)}
                    </div>
                  </div>
                ))}
              </div>

              <div className="p-4 bg-slate-950 border-t border-slate-800">
                <div className="bg-orange-500/5 border border-orange-500/20 rounded-2xl p-5 mb-4">
                  <div className="flex justify-between items-center mb-1">
                    <span className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">Subtotal</span>
                    <span className="text-xs font-bold text-slate-300">€{(total * 0.90).toFixed(2)}</span>
                  </div>
                  <div className="flex justify-between items-center mb-3">
                    <span className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">VAT (10%)</span>
                    <span className="text-xs font-bold text-slate-300">€{(total * 0.10).toFixed(2)}</span>
                  </div>
                  <div className="flex justify-between items-end border-t border-orange-500/20 pt-3 mt-3">
                    <span className="text-xs font-black text-slate-400 uppercase tracking-[.2em]">Total</span>
                    <span className="text-4xl font-black text-orange-500 tracking-tighter">€{total.toFixed(2)}</span>
                  </div>
                </div>
                <button
                  onClick={printReceipt}
                  disabled={currentOrder.length === 0}
                  className="w-full py-4 bg-orange-500 hover:bg-orange-600 disabled:bg-slate-800 disabled:text-slate-600 disabled:cursor-not-allowed rounded-2xl text-white font-black uppercase tracking-widest text-sm shadow-lg shadow-orange-500/20 transition-all active:scale-[0.98]"
                >
                  Confirm & Print
                </button>
              </div>
            </section>
          </>
        )}
      </main>

      {/* Receipt Modal */}
      {showReceipt && (
        <div className="fixed inset-0 bg-slate-950/80 backdrop-blur-sm flex items-center justify-center z-50 p-6">
          <div className="bg-white text-slate-900 w-full max-w-sm rounded-xl shadow-2xl overflow-hidden animate-in zoom-in duration-300">
            <div className="p-8 font-mono text-[11px] leading-relaxed relative">
              {/* Receipt pattern top */}
              <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-slate-200 via-slate-100 to-slate-200" />

              <div className="text-center mb-6">
                <div className="text-lg font-black tracking-tighter mb-1 uppercase">Caffè Centro</div>
                <div className="text-[9px] text-slate-500 uppercase tracking-widest">Via Roma 12, Milano • IT</div>
                <div className="text-[9px] text-slate-500">VAT: 12345678901</div>
              </div>

              <div className="flex justify-between border-y border-dashed border-slate-300 py-3 mb-4 text-[9px] uppercase tracking-tighter text-slate-500 font-bold">
                <span>{new Date().toLocaleDateString()} {new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                <span>Order #A{Math.floor(Math.random() * 9000) + 1000}</span>
              </div>

              <div className="space-y-2 mb-6">
                {currentOrder.map(i => (
                  <div key={i.name} className="flex justify-between items-start gap-4">
                    <span className="flex-1 italic">{i.qty}x {i.name}</span>
                    <span className="font-bold shrink-0">€{(i.price * i.qty).toFixed(2)}</span>
                  </div>
                ))}
              </div>

              <div className="border-t border-dashed border-slate-300 pt-4 mb-4">
                <div className="flex justify-between items-center mb-1">
                  <span className="uppercase text-[9px] font-bold">Subtotal</span>
                  <span>€{(total * 0.9).toFixed(2)}</span>
                </div>
                <div className="flex justify-between items-center mb-3">
                  <span className="uppercase text-[9px] font-bold">VAT (10.0%)</span>
                  <span>€{(total * 0.1).toFixed(2)}</span>
                </div>
                <div className="flex justify-between items-center text-sm font-black border-t border-slate-900 pt-2 uppercase">
                  <span>Grand Total</span>
                  <span>€{total.toFixed(2)}</span>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4 text-[9px] text-slate-400 uppercase font-bold mb-8">
                <div>Table: <span className="text-slate-900">{selectedTable.name}</span></div>
                <div className="text-right">Server: <span className="text-slate-900">{user.name.split(' ')[0]}</span></div>
              </div>

              <div className="text-center italic text-slate-400 mb-2">~ Grazie! Thank you for visiting ~</div>
              <div className="text-[8px] text-center text-slate-300 uppercase tracking-[.3em]">www.caffecentro.it</div>
            </div>

            <div className="p-4 bg-slate-50 border-t border-slate-100">
              <button
                onClick={closeReceipt}
                className="w-full py-4 bg-slate-900 hover:bg-black text-white rounded-xl font-bold uppercase tracking-widest text-xs transition-all shadow-lg active:scale-95"
              >
                Done • Clear Table
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
