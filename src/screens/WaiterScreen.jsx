import { useState, useEffect } from 'react'

const CATS = ['All','coffee','drinks','food','alcohol','desserts']

export default function WaiterScreen({ user, onLogout }) {
  const [products, setProducts]           = useState([])
  const [tables, setTables]               = useState([])
  const [selectedTable, setSelectedTable] = useState(null)
  const [orders, setOrders]               = useState({})
  const [cat, setCat]                     = useState('All')
  const [showReceipt, setShowReceipt]     = useState(false)

  useEffect(() => {
    async function loadData() {
      try {
        const prods = await window.electronAPI.getProducts()
        const tbls  = await window.electronAPI.getTables()
        const activeOrders = await window.electronAPI.getActiveOrders()
        setProducts(prods)
        setTables(tbls)
        setOrders(activeOrders || {})
      } catch(e) {
        console.error('Failed to load data:', e)
      }
    }
    loadData()

    const interval = setInterval(async () => {
      try {
        const activeOrders = await window.electronAPI.getActiveOrders()
        setOrders(activeOrders || {})
      } catch (e) {
        console.error('Failed to sync orders:', e)
      }
    }, 5000)

    return () => clearInterval(interval)
  }, [])

  const initials     = user.name.split(' ').map(n => n[0]).join('').slice(0,2)
  const filtered     = cat === 'All' ? products : products.filter(p => p.category === cat)
  const currentOrder = selectedTable ? (orders[selectedTable.id] || []) : []
  const total        = currentOrder.reduce((s,i) => s + i.price * i.qty, 0)
  const itemCount    = currentOrder.reduce((s,i) => s + i.qty, 0)

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
    const existing   = tableOrder.find(x => x.name === p.name)
    const updated    = existing
      ? tableOrder.map(x => x.name === p.name ? { ...x, qty: x.qty + 1 } : x)
      : [...tableOrder, { ...p, qty: 1 }]

    setOrders(prev => ({ ...prev, [selectedTable.id]: updated }))
    syncTable(selectedTable.id, updated)
  }

  function changeQty(name, delta) {
    if (!selectedTable) return
    const tableOrder = orders[selectedTable.id] || []
    const updated    = tableOrder
      .map(x => x.name === name ? { ...x, qty: x.qty + delta } : x)
      .filter(x => x.qty > 0)

    setOrders(prev => ({ ...prev, [selectedTable.id]: updated }))
    syncTable(selectedTable.id, updated)
  }

  async function printReceipt() {
    if (!currentOrder.length) return
    try {
      await window.electronAPI.addOrder({
        table_id:    selectedTable.id,
        employee_id: user.id,
        total:       total,
        items:       currentOrder.map(i => ({
          name:  i.name,
          icon:  i.icon,
          qty:   i.qty,
          price: i.price
        }))
      })
    } catch(e) {
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
    <div style={{ display:'flex', flexDirection:'column', height:'100vh', background:'#0f1117' }}>

      {/* Top bar */}
      <div style={{
        padding:'10px 16px', background:'#181b24',
        borderBottom:'1px solid #2d3148',
        display:'flex', alignItems:'center', justifyContent:'space-between',
        flexShrink:0
      }}>
        <div style={{ display:'flex', alignItems:'center', gap:10 }}>
          <div style={{
            width:32, height:32, borderRadius:'50%',
            background:'rgba(249,115,22,0.2)',
            display:'flex', alignItems:'center', justifyContent:'center',
            fontSize:12, fontWeight:600, color:'#f97316'
          }}>{initials}</div>
          <div>
            <div style={{ fontSize:13, fontWeight:500 }}>{user.name}</div>
            <div style={{ fontSize:10, color:'#64748b' }}>Waiter</div>
          </div>
        </div>

        {selectedTable && (
          <div style={{
            padding:'6px 16px',
            background:'rgba(249,115,22,0.1)',
            border:'1px solid rgba(249,115,22,0.4)',
            borderRadius:20, fontSize:13, fontWeight:600, color:'#f97316'
          }}>
            🪑 {selectedTable.name}
          </div>
        )}

        <button onClick={onLogout} style={{
          padding:'5px 12px', background:'#252836',
          border:'1px solid #2d3148', borderRadius:6,
          color:'#94a3b8', cursor:'pointer', fontSize:12
        }}>Logout</button>
      </div>

      {/* Main */}
      <div style={{ display:'flex', flex:1, overflow:'hidden' }}>

        {/* Tables panel */}
        <div style={{
          width: selectedTable ? 200 : '100%',
          background:'#181b24',
          borderRight: selectedTable ? '1px solid #2d3148' : 'none',
          display:'flex', flexDirection:'column',
          transition:'width .2s'
        }}>
          <div style={{
            padding:'14px 16px', borderBottom:'1px solid #2d3148',
            fontSize:13, fontWeight:500, color:'#94a3b8'
          }}>
            🪑 Select Table
          </div>
          <div style={{
            flex:1, overflowY:'auto', padding:12,
            display:'grid',
            gridTemplateColumns: selectedTable
              ? 'repeat(2,1fr)'
              : 'repeat(auto-fill, minmax(140px,1fr))',
            gap:10, alignContent:'start'
          }}>
            {tables.map(t => {
              const hasItems  = tableHasItems(t.id)
              const isSelected = selectedTable?.id === t.id
              return (
                <div
                  key={t.id}
                  onClick={() => setSelectedTable(t)}
                  style={{
                    background: isSelected
                      ? 'rgba(249,115,22,0.15)'
                      : hasItems
                      ? 'rgba(34,197,94,0.06)'
                      : '#1a1d2e',
                    border: isSelected
                      ? '2px solid #f97316'
                      : hasItems
                      ? '1px solid #22c55e'
                      : '1px solid #2d3148',
                    borderRadius:12,
                    padding: selectedTable ? '14px 8px' : '24px 16px',
                    cursor:'pointer', textAlign:'center', transition:'all .15s'
                  }}
                >
                  <div style={{ fontSize: selectedTable ? 22 : 32, marginBottom:6 }}>🪑</div>
                  <div style={{
                    fontSize: selectedTable ? 12 : 16, fontWeight:600,
                    color: isSelected ? '#f97316' : '#f1f5f9'
                  }}>{t.name}</div>
                  <div style={{ fontSize:10, marginTop:4, color: hasItems ? '#22c55e' : '#64748b' }}>
                    {hasItems
                      ? `${(orders[t.id]||[]).reduce((s,i)=>s+i.qty,0)} items`
                      : 'Empty'}
                  </div>
                </div>
              )
            })}
          </div>
        </div>

        {/* Order screen */}
        {selectedTable && (
          <>
            {/* Products panel */}
            <div style={{
              flex:1, background:'#181b24',
              display:'flex', flexDirection:'column',
              borderRight:'1px solid #2d3148'
            }}>
              {/* Categories */}
              <div style={{
                display:'flex', gap:8, padding:'10px 12px',
                borderBottom:'1px solid #2d3148',
                overflowX:'auto', flexShrink:0
              }}>
                {CATS.map(c => (
                  <div key={c} onClick={() => setCat(c)} style={{
                    padding:'5px 14px', borderRadius:20, cursor:'pointer',
                    fontSize:12, whiteSpace:'nowrap',
                    background: cat===c ? 'rgba(249,115,22,0.15)' : '#252836',
                    border:     cat===c ? '1px solid #f97316' : '1px solid #2d3148',
                    color:      cat===c ? '#f97316' : '#94a3b8'
                  }}>{c}</div>
                ))}
              </div>

              {/* Products grid */}
              <div style={{
                flex:1, overflowY:'auto', padding:12,
                display:'grid',
                gridTemplateColumns:'repeat(auto-fill, minmax(110px,1fr))',
                gap:10, alignContent:'start'
              }}>
                {filtered.map(p => (
                  <div key={p.id} onClick={() => addProduct(p)} style={{
                    background:'#1a1d2e', border:'1px solid #2d3148',
                    borderRadius:12, padding:'14px 8px',
                    cursor:'pointer', textAlign:'center', transition:'all .15s'
                  }}>
                    <div style={{ fontSize:28, marginBottom:6 }}>{p.icon}</div>
                    <div style={{ fontSize:12, fontWeight:500, marginBottom:4 }}>{p.name}</div>
                    <div style={{ fontSize:14, fontWeight:600, color:'#f97316' }}>
                      €{Number(p.price).toFixed(2)}
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Order summary */}
            <div style={{
              width:240, background:'#181b24',
              display:'flex', flexDirection:'column'
            }}>
              <div style={{
                padding:'12px 16px', borderBottom:'1px solid #2d3148',
                display:'flex', justifyContent:'space-between', alignItems:'center'
              }}>
                <span style={{ fontSize:13, fontWeight:500, color:'#94a3b8' }}>Order</span>
                <button
                  onClick={() => setOrders(prev => ({ ...prev, [selectedTable.id]: [] }))}
                  style={{ background:'none', border:'none', color:'#64748b', cursor:'pointer', fontSize:11 }}
                >Clear</button>
              </div>

              <div style={{ flex:1, overflowY:'auto', padding:10 }}>
                {currentOrder.length === 0 ? (
                  <div style={{ textAlign:'center', padding:'32px 16px', color:'#64748b', fontSize:13 }}>
                    <div style={{ fontSize:28, marginBottom:8 }}>🛒</div>
                    Tap a product to add
                  </div>
                ) : currentOrder.map(i => (
                  <div key={i.name} style={{
                    display:'flex', alignItems:'center', gap:6,
                    padding:8, background:'#252836',
                    borderRadius:8, marginBottom:6
                  }}>
                    <span style={{ fontSize:16 }}>{i.icon}</span>
                    <span style={{ flex:1, fontSize:11, fontWeight:500 }}>{i.name}</span>
                    <button onClick={() => changeQty(i.name,-1)} style={{
                      width:20, height:20, background:'#1e2130',
                      border:'none', borderRadius:4,
                      cursor:'pointer', color:'#f1f5f9', fontSize:14
                    }}>−</button>
                    <span style={{ fontSize:12, fontWeight:600, minWidth:14, textAlign:'center' }}>
                      {i.qty}
                    </span>
                    <button onClick={() => changeQty(i.name,1)} style={{
                      width:20, height:20, background:'#1e2130',
                      border:'none', borderRadius:4,
                      cursor:'pointer', color:'#f1f5f9', fontSize:14
                    }}>+</button>
                    <span style={{ fontSize:11, fontWeight:600, color:'#f97316', minWidth:38, textAlign:'right' }}>
                      €{(i.price * i.qty).toFixed(2)}
                    </span>
                  </div>
                ))}
              </div>

              <div style={{ padding:'0 12px 12px' }}>
                <div style={{
                  background:'rgba(249,115,22,0.08)',
                  border:'1px solid rgba(249,115,22,0.3)',
                  borderRadius:10, padding:14, textAlign:'center', marginBottom:10
                }}>
                  <div style={{ fontSize:11, color:'#94a3b8', marginBottom:2 }}>TOTAL</div>
                  <div style={{ fontSize:30, fontWeight:600, color:'#f97316' }}>
                    €{total.toFixed(2)}
                  </div>
                  <div style={{ fontSize:11, color:'#64748b', marginTop:2 }}>
                    {itemCount} items · {selectedTable.name}
                  </div>
                </div>
                <button onClick={printReceipt} style={{
                  width:'100%', padding:14, background:'#f97316',
                  border:'none', borderRadius:10, color:'#fff',
                  fontSize:14, fontWeight:600, cursor:'pointer'
                }}>
                  🖨️ Print Receipt
                </button>
              </div>
            </div>
          </>
        )}
      </div>

      {/* Receipt Modal */}
      {showReceipt && (
        <div style={{
          position:'fixed', inset:0, background:'rgba(0,0,0,0.7)',
          display:'flex', alignItems:'center', justifyContent:'center', zIndex:100
        }}>
          <div style={{
            background:'#fff', color:'#000', padding:24,
            width:280, borderRadius:8, fontFamily:'monospace', fontSize:12
          }}>
            <div style={{ textAlign:'center', fontWeight:700, fontSize:16, marginBottom:2 }}>
              ☕ CAFFÈ CENTRO
            </div>
            <div style={{ textAlign:'center', fontSize:10, color:'#666', marginBottom:14 }}>
              Via Roma 12, Milano
            </div>
            <hr style={{ border:'none', borderTop:'1px dashed #ccc', margin:'8px 0' }} />
            <div style={{ display:'flex', justifyContent:'space-between', fontSize:10, color:'#888', marginBottom:8 }}>
              <span>{new Date().toLocaleDateString()}</span>
              <span>{new Date().toLocaleTimeString([],{hour:'2-digit',minute:'2-digit'})}</span>
            </div>
            {currentOrder.map(i => (
              <div key={i.name} style={{ display:'flex', justifyContent:'space-between', padding:'3px 0' }}>
                <span>{i.qty}x {i.name}</span>
                <span>€{(i.price * i.qty).toFixed(2)}</span>
              </div>
            ))}
            <hr style={{ border:'none', borderTop:'1px dashed #ccc', margin:'8px 0' }} />
            <div style={{ display:'flex', justifyContent:'space-between', fontWeight:700, fontSize:15 }}>
              <span>TOTAL</span>
              <span>€{total.toFixed(2)}</span>
            </div>
            <div style={{ display:'flex', justifyContent:'space-between', fontSize:10, color:'#888', marginTop:8 }}>
              <span>Table: {selectedTable.name}</span>
              <span>Waiter: {user.name.split(' ')[0]}</span>
            </div>
            <hr style={{ border:'none', borderTop:'1px dashed #ccc', margin:'8px 0' }} />
            <div style={{ textAlign:'center', fontSize:10, color:'#888' }}>Grazie! Thank you!</div>
            <button onClick={closeReceipt} style={{
              width:'100%', marginTop:12, padding:10,
              background:'#f97316', border:'none',
              borderRadius:6, color:'#fff', cursor:'pointer', fontSize:12
            }}>✓ Done — Clear Table</button>
          </div>
        </div>
      )}
    </div>
  )
}