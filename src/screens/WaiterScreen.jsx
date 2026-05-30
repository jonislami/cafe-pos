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
      } catch (e) { console.error(e) }
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
      } catch (e) { console.error(e) }
    }, 5000)

    return () => clearInterval(interval)
  }, [selectedTable])

  const currentOrder = selectedTable ? (orders[selectedTable.id] || []) : []
  const total = currentOrder.reduce((s, i) => s + i.price * i.qty, 0)
  const filtered = cat === 'All' ? products : products.filter(p => p.category === cat)

  async function syncTable(tableId, items) {
    try {
      const total = items.reduce((s, i) => s + i.price * i.qty, 0)
      await window.electronAPI.syncTableOrder({ tableId, employeeId: user.id, items, total })
    } catch (e) { console.error(e) }
  }

  function addProduct(p) {
    if (!selectedTable) return
    const tableOrder = orders[selectedTable.id] || []
    const existing = tableOrder.find(x => x.name === p.name)
    const updated = existing ? tableOrder.map(x => x.name === p.name ? { ...x, qty: x.qty + 1 } : x) : [...tableOrder, { ...p, qty: 1 }]
    setOrders(prev => ({ ...prev, [selectedTable.id]: updated }))
    syncTable(selectedTable.id, updated)
  }

  function changeQty(name, delta) {
    if (!selectedTable) return
    const tableOrder = orders[selectedTable.id] || []
    const updated = tableOrder.map(x => x.name === name ? { ...x, qty: x.qty + delta } : x).filter(x => x.qty > 0)
    setOrders(prev => ({ ...prev, [selectedTable.id]: updated }))
    syncTable(selectedTable.id, updated)
  }

  async function printReceipt() {
    if (!currentOrder.length) return
    try {
      await window.electronAPI.addOrder({
        table_id: selectedTable.id,
        employee_id: user.id,
        total,
        items: currentOrder.map(i => ({ name: i.name, icon: i.icon || '', qty: i.qty, price: i.price }))
      })
      setShowReceipt(true)
    } catch (e) { console.error(e) }
  }

  function closeReceipt() {
    setShowReceipt(false)
    setOrders(prev => ({ ...prev, [selectedTable.id]: [] }))
    setSelectedTable(null)
  }

  return (
    <div className="flex h-screen bg-[#0a0c10] text-slate-300 font-sans overflow-hidden">

      {/* Table Selector - Slim sidebar */}
      <aside className={`bg-slate-900/40 border-r border-slate-800/50 flex flex-col transition-all duration-300 shrink-0 ${selectedTable ? 'w-24' : 'w-64'}`}>
        <div className="p-6 border-b border-slate-800/30 flex items-center justify-between">
          <span className="text-[10px] font-black text-slate-500 uppercase tracking-widest">{selectedTable ? 'TBL' : 'TABLES'}</span>
        </div>
        <div className="flex-1 overflow-y-auto p-4 space-y-3">
          {tables.map(t => {
            const hasItems = (orders[t.id] || []).length > 0
            const isSelected = selectedTable?.id === t.id
            return (
              <button
                key={t.id}
                onClick={() => setSelectedTable(t)}
                className={`w-full aspect-square rounded-xl flex flex-col items-center justify-center transition-all border ${
                  isSelected ? 'bg-blue-600 border-blue-500 text-white shadow-lg shadow-blue-600/20' :
                  hasItems ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-400' :
                  'bg-slate-900 border-slate-800 text-slate-500 hover:border-slate-700'
                }`}
              >
                <div className="font-black text-sm uppercase">{t.name}</div>
              </button>
            )
          })}
        </div>
        <div className="p-4 border-t border-slate-800/30">
           <button onClick={onLogout} className="w-full aspect-square flex items-center justify-center text-slate-600 hover:text-red-400 transition-colors">🚪</button>
        </div>
      </aside>

      {/* Main Order Panel */}
      {selectedTable ? (
        <div className="flex flex-1 overflow-hidden animate-in fade-in duration-300">

          {/* Products Column */}
          <div className="flex-1 flex flex-col bg-slate-950/50 border-r border-slate-800/50">
            <header className="p-6 border-b border-slate-800/30 flex items-center gap-2 overflow-x-auto no-scrollbar">
              {CATS.map(c => (
                <button
                  key={c}
                  onClick={() => setCat(c)}
                  className={`px-4 py-1.5 rounded-full text-[10px] font-black uppercase tracking-widest transition-all shrink-0 ${
                    cat === c ? 'bg-blue-600 text-white' : 'bg-slate-800/50 text-slate-500 hover:text-slate-300'
                  }`}
                >
                  {c}
                </button>
              ))}
            </header>

            <div className="flex-1 overflow-y-auto p-6 grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 content-start">
              {filtered.map(p => (
                <button
                  key={p.id}
                  onClick={() => addProduct(p)}
                  className="p-5 bg-slate-900/50 border border-slate-800/50 rounded-2xl hover:border-blue-500/50 transition-all text-left flex flex-col justify-between h-32 group active:scale-[0.98]"
                >
                  <div className="text-xs font-bold text-slate-200 line-clamp-2 leading-relaxed">{p.name}</div>
                  <div className="text-blue-400 font-black text-lg">€{p.price.toFixed(2)}</div>
                </button>
              ))}
            </div>
          </div>

          {/* Current Bill Column */}
          <section className="w-80 bg-slate-900/20 flex flex-col shrink-0">
            <header className="p-6 border-b border-slate-800/30 flex justify-between items-center">
              <h2 className="text-[10px] font-black text-slate-500 uppercase tracking-widest">Order Summary</h2>
              <span className="text-[10px] font-black text-blue-500 bg-blue-500/10 px-2 py-0.5 rounded">{selectedTable.name}</span>
            </header>

            <div className="flex-1 overflow-y-auto p-4 space-y-2">
              {currentOrder.length === 0 ? (
                <div className="h-full flex flex-col items-center justify-center opacity-20 italic text-xs">Waiting for selection...</div>
              ) : currentOrder.map(i => (
                <div key={i.name} className="flex items-center gap-3 p-3 bg-slate-900/50 border border-slate-800/30 rounded-xl">
                  <div className="flex-1 min-w-0">
                    <div className="text-xs font-bold text-slate-200 truncate">{i.name}</div>
                    <div className="text-[10px] text-slate-600 font-medium mt-0.5">€{i.price.toFixed(2)}</div>
                  </div>
                  <div className="flex items-center gap-2 bg-slate-950 px-2 py-1 rounded-lg border border-slate-800/50">
                    <button onClick={() => changeQty(i.name, -1)} className="w-6 h-6 flex items-center justify-center hover:text-red-400 transition-colors">−</button>
                    <span className="text-[10px] font-black w-4 text-center">{i.qty}</span>
                    <button onClick={() => changeQty(i.name, 1)} className="w-6 h-6 flex items-center justify-center hover:text-blue-400 transition-colors">+</button>
                  </div>
                  <div className="text-xs font-black text-slate-400 min-w-[45px] text-right">€{(i.price * i.qty).toFixed(2)}</div>
                </div>
              ))}
            </div>

            <div className="p-6 bg-slate-950 border-t border-slate-800/50">
              <div className="flex justify-between items-end mb-6">
                <span className="text-[10px] font-black text-slate-600 uppercase tracking-widest">Total Bill</span>
                <span className="text-3xl font-black text-white tracking-tighter">€{total.toFixed(2)}</span>
              </div>
              <button
                onClick={printReceipt}
                disabled={currentOrder.length === 0}
                className="w-full py-4 bg-blue-600 hover:bg-blue-500 disabled:bg-slate-800 disabled:text-slate-600 rounded-xl text-white font-black uppercase tracking-widest text-[10px] transition-all shadow-lg shadow-blue-600/10"
              >
                Finish & Print
              </button>
            </div>
          </section>
        </div>
      ) : (
        <div className="flex-1 flex items-center justify-center text-slate-800 font-black uppercase tracking-[.2em] text-sm italic">
          Please Select a Table to Start
        </div>
      )}

      {/* Modern Receipt Modal */}
      {showReceipt && (
        <div className="fixed inset-0 bg-slate-950/90 backdrop-blur-md flex items-center justify-center z-50 p-6">
          <div className="bg-white text-slate-950 w-full max-w-xs rounded-2xl shadow-2xl overflow-hidden animate-in zoom-in-95 duration-300">
            <div className="p-10 font-mono text-[10px] leading-relaxed">
              <div className="text-center mb-8">
                <div className="text-xl font-black tracking-tighter mb-1 uppercase">Caffè Centro</div>
                <div className="text-[8px] text-slate-400 tracking-widest">MILANO, IT</div>
              </div>
              <div className="border-y border-dashed border-slate-200 py-4 mb-6 flex justify-between uppercase text-[8px] font-black">
                <span>{new Date().toLocaleDateString()}</span>
                <span>TBL: {selectedTable.name}</span>
              </div>
              <div className="space-y-3 mb-8">
                {currentOrder.map(i => (
                  <div key={i.name} className="flex justify-between items-start gap-4">
                    <span className="flex-1">{i.qty}x {i.name}</span>
                    <span className="font-bold">€{(i.price * i.qty).toFixed(2)}</span>
                  </div>
                ))}
              </div>
              <div className="border-t border-slate-950 pt-4 text-center font-black">
                <div className="text-lg">TOTAL €{total.toFixed(2)}</div>
              </div>
              <div className="text-center mt-10 text-[8px] text-slate-400 italic">~ Grazie per la visita ~</div>
            </div>
            <div className="p-4 bg-slate-50 border-t border-slate-100">
              <button onClick={closeReceipt} className="w-full py-4 bg-slate-950 text-white rounded-xl font-black uppercase tracking-widest text-[10px] active:scale-95 transition-all shadow-lg shadow-black/10">Done</button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
