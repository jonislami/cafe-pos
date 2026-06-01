import { useState, useEffect } from 'react'
import { useTranslation } from '../LanguageContext'

const CATS = ['All','coffee','drinks','food','alcohol','desserts']

export default function WaiterScreen({ user, onLogout }) {
  const { t, settings } = useTranslation()
  const [products, setProducts]           = useState([])
  const [tables, setTables]               = useState([])
  const [selectedTable, setSelectedTable] = useState(null)
  const [orders, setOrders]               = useState({})
  const [cat, setCat]                     = useState('All')
  const [showReceipt, setShowReceipt]     = useState(false)

  const initials = user.name.split(' ').map(n=>n[0]).join('').slice(0,2).toUpperCase()

  useEffect(() => {
    async function load() {
      try {
        const [prods, tbls, active] = await Promise.all([
          window.electronAPI.getProducts(),
          window.electronAPI.getTables(),
          window.electronAPI.getActiveOrders(),
        ])
        setProducts(prods)
        setTables(tbls)
        setOrders(active || {})
      } catch(e) { console.error(e) }
    }
    load()

    const interval = setInterval(async () => {
      try {
        const active = await window.electronAPI.getActiveOrders()
        setOrders(prev => {
          if (selectedTable && prev[selectedTable.id]) {
            return { ...active, [selectedTable.id]: prev[selectedTable.id] }
          }
          return active || {}
        })
      } catch(e) { console.error(e) }
    }, 5000)
    return () => clearInterval(interval)
  }, [selectedTable])

  const currentOrder = selectedTable ? (orders[selectedTable.id] || []) : []
  const total        = currentOrder.reduce((s,i) => s + i.price * i.qty, 0)
  const itemCount    = currentOrder.reduce((s,i) => s + i.qty, 0)
  const filtered     = cat === 'All' ? products : products.filter(p => p.category === cat)

  async function syncTable(tableId, items) {
    try {
      await window.electronAPI.syncTableOrder({
        tableId, employeeId: user.id,
        items, total: items.reduce((s,i) => s+i.price*i.qty, 0)
      })
    } catch(e) { console.error(e) }
  }

  function addProduct(p) {
    if (!selectedTable) return
    const prev = orders[selectedTable.id] || []
    const existing = prev.find(x => x.id === p.id)
    const updated = existing
      ? prev.map(x => x.id === p.id ? { ...x, qty: x.qty+1 } : x)
      : [...prev, { ...p, qty:1 }]
    setOrders(o => ({ ...o, [selectedTable.id]: updated }))
    syncTable(selectedTable.id, updated)
  }

  function changeQty(id, delta) {
    if (!selectedTable) return
    const updated = (orders[selectedTable.id] || [])
      .map(x => x.id === id ? { ...x, qty: x.qty+delta } : x)
      .filter(x => x.qty > 0)
    setOrders(o => ({ ...o, [selectedTable.id]: updated }))
    syncTable(selectedTable.id, updated)
  }

  async function printReceipt() {
    if (!currentOrder.length) return
    try {
      await window.electronAPI.addOrder({
        table_id:    selectedTable.id,
        employee_id: user.id,
        total,
        items: currentOrder.map(i => ({
          name: i.name, icon: '', qty: i.qty, price: i.price
        }))
      })
      setShowReceipt(true)
    } catch(e) { console.error(e) }
  }

  function closeReceipt() {
    setShowReceipt(false)
    setOrders(prev => ({ ...prev, [selectedTable.id]: [] }))
    syncTable(selectedTable.id, [])
    setSelectedTable(null)
  }

  const f = { fontFamily:'"Inter",system-ui,sans-serif' }

  return (
    <div style={{ display:'flex', height:'100vh', background:'#f1f5f9', ...f, overflow:'hidden' }}>
      <style>{`
        .prod-btn:hover { background:#e2e8f0 !important; border-color:#94a3b8 !important; }
        .prod-btn:active { transform:scale(0.97); }
        .tbl-btn:hover { border-color:#94a3b8 !important; }
        .qty-btn:hover { background:#e2e8f0 !important; }
      `}</style>

      {/* ── Table Sidebar ── */}
      <aside style={{
        width: selectedTable ? 100 : 200,
        background:'#fff', borderRight:'1px solid #e2e8f0',
        display:'flex', flexDirection:'column',
        transition:'width .2s', flexShrink:0, overflow:'hidden'
      }}>
        <div style={{
          padding:'20px 14px 14px',
          borderBottom:'1px solid #f1f5f9'
        }}>
          {!selectedTable ? (
            <div>
              <div style={{
                width:32, height:32, background:'#0f172a', borderRadius:8,
                display:'flex', alignItems:'center', justifyContent:'center',
                fontSize:11, fontWeight:800, color:'#fff', marginBottom:12
              }}>{initials}</div>
              <div style={{ fontSize:10, color:'#94a3b8', fontWeight:700, textTransform:'uppercase', letterSpacing:'0.12em' }}>
                {t('tables')}
              </div>
            </div>
          ) : (
            <div style={{
              width:32, height:32, background:'#0f172a', borderRadius:8,
              display:'flex', alignItems:'center', justifyContent:'center',
              fontSize:11, fontWeight:800, color:'#fff', margin:'0 auto'
            }}>{initials}</div>
          )}
        </div>

        <div style={{ flex:1, overflowY:'auto', padding:'10px 8px', display:'flex', flexDirection:'column', gap:5 }}>
          {tables.map(t => {
            const hasItems   = (orders[t.id] || []).length > 0
            const isSelected = selectedTable?.id === t.id
            const qty        = (orders[t.id] || []).reduce((s,i) => s+i.qty, 0)
            return (
              <button key={t.id} className="tbl-btn" onClick={() => setSelectedTable(t)} style={{
                width:'100%', padding: selectedTable ? '10px 4px' : '10px 10px',
                borderRadius:10, border:'none', cursor:'pointer',
                textAlign: selectedTable ? 'center' : 'left',
                transition:'all .12s', fontFamily:'inherit',
                background: isSelected ? '#0f172a' : hasItems ? '#f0fdf4' : '#f8fafc',
                border: isSelected ? '1px solid #0f172a'
                  : hasItems ? '1px solid #bbf7d0' : '1px solid #e2e8f0',
              }}>
                <div style={{
                  fontSize:12, fontWeight:700,
                  color: isSelected ? '#fff' : hasItems ? '#15803d' : '#475569',
                  whiteSpace:'nowrap', overflow:'hidden', textOverflow:'ellipsis'
                }}>{t.name}</div>
                {!selectedTable && (
                  <div style={{ fontSize:9, marginTop:2, color: hasItems ? '#16a34a' : '#cbd5e1', fontWeight:600 }}>
                    {hasItems ? `${qty} ${t('items')}` : t('free')}
                  </div>
                )}
                {selectedTable && hasItems && !isSelected && (
                  <div style={{
                    width:14, height:14, borderRadius:'50%',
                    background:'#22c55e', color:'#fff', fontSize:8,
                    fontWeight:800, display:'flex', alignItems:'center',
                    justifyContent:'center', margin:'3px auto 0'
                  }}>{qty}</div>
                )}
              </button>
            )
          })}
        </div>

        <div style={{ padding:8, borderTop:'1px solid #f1f5f9' }}>
          <button onClick={onLogout} style={{
            width:'100%', padding:'9px 4px', background:'transparent',
            border:'1px solid #fee2e2', borderRadius:8, color:'#fca5a5',
            cursor:'pointer', fontSize:10, fontWeight:700,
            textTransform:'uppercase', letterSpacing:'0.08em',
            fontFamily:'inherit', transition:'all .15s'
          }}
          onMouseEnter={e => { e.currentTarget.style.background='#fef2f2'; e.currentTarget.style.color='#ef4444' }}
          onMouseLeave={e => { e.currentTarget.style.background='transparent'; e.currentTarget.style.color='#fca5a5' }}
          >{selectedTable ? t('out') : t('signOut')}</button>
        </div>
      </aside>

      {/* ── Main ── */}
      {!selectedTable ? (
        <div style={{
          flex:1, display:'flex', alignItems:'center',
          justifyContent:'center', flexDirection:'column', gap:12
        }}>
          <div style={{ fontSize:40, color:'#e2e8f0' }}>—</div>
          <div style={{ fontSize:12, fontWeight:700, color:'#cbd5e1',
            textTransform:'uppercase', letterSpacing:'0.2em' }}>
            Select a table to begin
          </div>
        </div>
      ) : (
        <div style={{ flex:1, display:'flex', overflow:'hidden' }}>

          {/* Products */}
          <div style={{
            flex:1, display:'flex', flexDirection:'column',
            background:'#f8fafc', borderRight:'1px solid #e2e8f0'
          }}>
            {/* Category tabs */}
            <div style={{
              display:'flex', gap:6, padding:'12px 14px',
              borderBottom:'1px solid #e2e8f0', overflowX:'auto', flexShrink:0,
              background:'#fff'
            }}>
              {CATS.map(c => (
                <button key={c} onClick={() => setCat(c)} style={{
                  padding:'6px 14px', borderRadius:20, border:'none',
                  cursor:'pointer', fontSize:10, fontWeight:700,
                  whiteSpace:'nowrap', textTransform:'uppercase',
                  letterSpacing:'0.08em', fontFamily:'inherit', transition:'all .12s',
                  background: cat===c ? '#0f172a' : '#f1f5f9',
                  color:      cat===c ? '#fff' : '#64748b',
                }}>{c === 'All' ? t('all') : t(`cat_${c}`)}</button>
              ))}
            </div>

            {/* Grid */}
            <div style={{
              flex:1, overflowY:'auto', padding:14,
              display:'grid',
              gridTemplateColumns:'repeat(auto-fill, minmax(130px,1fr))',
              gap:8, alignContent:'start'
            }}>
              {filtered.map(p => (
                <button key={p.id} className="prod-btn" onClick={() => addProduct(p)} style={{
                  padding:'16px 14px', height:90,
                  background:'#fff', border:'1px solid #e2e8f0',
                  borderRadius:12, cursor:'pointer', textAlign:'left',
                  display:'flex', flexDirection:'column', justifyContent:'space-between',
                  transition:'all .12s', fontFamily:'inherit',
                  boxShadow:'0 1px 3px rgba(0,0,0,0.04)'
                }}>
                  <div style={{ fontSize:12, fontWeight:600, color:'#1e293b', lineHeight:1.3 }}>{p.name}</div>
                  <div style={{ fontSize:16, fontWeight:800, color:'#0f172a' }}>
                    €{Number(p.price).toFixed(2)}
                  </div>
                </button>
              ))}
            </div>
          </div>

          {/* Order Panel */}
          <div style={{
            width:270, display:'flex', flexDirection:'column',
            background:'#fff', flexShrink:0
          }}>
            {/* Header */}
            <div style={{
              padding:'16px 18px', borderBottom:'1px solid #f1f5f9',
              display:'flex', justifyContent:'space-between', alignItems:'center'
            }}>
              <div>
                <div style={{ fontSize:10, fontWeight:700, color:'#94a3b8', textTransform:'uppercase', letterSpacing:'0.1em' }}>
                  {t('order')}
                </div>
                <div style={{ fontSize:14, fontWeight:700, color:'#0f172a', marginTop:2 }}>
                  {selectedTable.name}
                </div>
              </div>
              {currentOrder.length > 0 && (
                <button onClick={() => {
                  setOrders(prev => ({ ...prev, [selectedTable.id]: [] }))
                  syncTable(selectedTable.id, [])
                }} style={{
                  background:'none', border:'none', color:'#cbd5e1',
                  cursor:'pointer', fontSize:11, fontWeight:700,
                  textTransform:'uppercase', letterSpacing:'0.08em',
                  fontFamily:'inherit', transition:'color .15s'
                }}
                onMouseEnter={e => e.currentTarget.style.color='#ef4444'}
                onMouseLeave={e => e.currentTarget.style.color='#cbd5e1'}
                >{t('clear')}</button>
              )}
            </div>

            {/* Items */}
            <div style={{ flex:1, overflowY:'auto', padding:'10px 12px' }}>
              {currentOrder.length === 0 ? (
                <div style={{
                  display:'flex', flexDirection:'column', alignItems:'center',
                  justifyContent:'center', height:'100%', gap:8, color:'#e2e8f0'
                }}>
                  <div style={{ fontSize:12, fontWeight:600, textTransform:'uppercase', letterSpacing:'0.1em' }}>
                    {t('noItemsYet')}
                  </div>
                </div>
              ) : currentOrder.map(i => (
                <div key={i.id} style={{
                  display:'flex', alignItems:'center', gap:8,
                  padding:'10px 10px', marginBottom:5,
                  background:'#f8fafc', border:'1px solid #f1f5f9',
                  borderRadius:10
                }}>
                  <div style={{ flex:1, minWidth:0 }}>
                    <div style={{ fontSize:12, fontWeight:600, color:'#1e293b', overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap' }}>{i.name}</div>
                    <div style={{ fontSize:10, color:'#94a3b8', marginTop:1 }}>€{Number(i.price).toFixed(2)}</div>
                  </div>
                  <div style={{
                    display:'flex', alignItems:'center', gap:5,
                    background:'#fff', border:'1px solid #e2e8f0',
                    borderRadius:8, padding:'3px 6px'
                  }}>
                    <button className="qty-btn" onClick={() => changeQty(i.id,-1)} style={{
                      width:20, height:20, background:'transparent',
                      border:'none', color:'#94a3b8', cursor:'pointer',
                      fontSize:16, display:'flex', alignItems:'center',
                      justifyContent:'center', borderRadius:5, transition:'all .12s'
                    }}>−</button>
                    <span style={{ fontSize:12, fontWeight:700, color:'#1e293b', minWidth:14, textAlign:'center' }}>{i.qty}</span>
                    <button className="qty-btn" onClick={() => changeQty(i.id,1)} style={{
                      width:20, height:20, background:'transparent',
                      border:'none', color:'#94a3b8', cursor:'pointer',
                      fontSize:16, display:'flex', alignItems:'center',
                      justifyContent:'center', borderRadius:5, transition:'all .12s'
                    }}>+</button>
                  </div>
                  <div style={{ fontSize:12, fontWeight:700, color:'#1e293b', minWidth:42, textAlign:'right', flexShrink:0 }}>
                    €{(i.price * i.qty).toFixed(2)}
                  </div>
                </div>
              ))}
            </div>

            {/* Total + Print */}
            <div style={{
              padding:'14px 16px 18px',
              borderTop:'1px solid #f1f5f9',
              background:'#fff'
            }}>
              <div style={{ display:'flex', justifyContent:'space-between', alignItems:'flex-end', marginBottom:14 }}>
                <div>
                  <div style={{ fontSize:9, fontWeight:700, color:'#94a3b8', textTransform:'uppercase', letterSpacing:'0.12em', marginBottom:2 }}>{t('total')}</div>
                  <div style={{ fontSize:10, color:'#cbd5e1' }}>{itemCount} {itemCount!==1 ? t('items') : t('item')}</div>
                </div>
                <div style={{ fontSize:30, fontWeight:900, color:'#0f172a', letterSpacing:'-1px' }}>
                  €{total.toFixed(2)}
                </div>
              </div>
              <button onClick={printReceipt} disabled={currentOrder.length===0} style={{
                width:'100%', padding:'14px',
                background: currentOrder.length===0 ? '#f1f5f9' : '#0f172a',
                border:'none', borderRadius:12,
                color: currentOrder.length===0 ? '#cbd5e1' : '#fff',
                fontSize:11, fontWeight:800,
                textTransform:'uppercase', letterSpacing:'0.1em',
                cursor: currentOrder.length===0 ? 'not-allowed' : 'pointer',
                fontFamily:'inherit', transition:'all .15s',
                boxShadow: currentOrder.length>0 ? '0 4px 14px rgba(0,0,0,0.15)' : 'none'
              }}>
                {t('printReceipt')}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Receipt Modal */}
      {showReceipt && (
        <div style={{
          position:'fixed', inset:0, background:'rgba(15,23,42,0.6)',
          backdropFilter:'blur(8px)',
          display:'flex', alignItems:'center', justifyContent:'center',
          zIndex:100, padding:24
        }}>
          <div style={{
            background:'#fff', color:'#0f172a',
            width:'100%', maxWidth:280, borderRadius:16,
            overflow:'hidden', boxShadow:'0 32px 64px rgba(0,0,0,0.25)'
          }}>
            <div style={{ padding:'28px 24px 20px', fontFamily:'"DM Mono","Courier New",monospace', fontSize:11, lineHeight:1.8 }}>
              <div style={{ textAlign:'center', marginBottom:18 }}>
                <div style={{ fontSize:16, fontWeight:900, letterSpacing:'-0.5px', textTransform:'uppercase' }}>
                  {settings?.cafe_name || 'CaféPOS'}
                </div>
                <div style={{ fontSize:9, color:'#94a3b8', letterSpacing:'0.2em', textTransform:'uppercase', marginTop:2 }}>
                  {settings?.address || ''}
                </div>
              </div>

              <div style={{
                borderTop:'1px dashed #e2e8f0', borderBottom:'1px dashed #e2e8f0',
                padding:'8px 0', margin:'0 0 14px',
                display:'flex', justifyContent:'space-between',
                fontSize:9, color:'#94a3b8', textTransform:'uppercase', fontWeight:600
              }}>
                <span>{new Date().toLocaleDateString()}</span>
                <span>{selectedTable.name}</span>
              </div>

              <div style={{ marginBottom:14, display:'flex', flexDirection:'column', gap:5 }}>
                {currentOrder.map(i => (
                  <div key={i.id} style={{ display:'flex', justifyContent:'space-between', gap:8 }}>
                    <span style={{ flex:1 }}>{i.qty}x {i.name}</span>
                    <span style={{ fontWeight:700 }}>€{(i.price*i.qty).toFixed(2)}</span>
                  </div>
                ))}
              </div>

              <div style={{
                borderTop:'1.5px solid #0f172a', paddingTop:10,
                display:'flex', justifyContent:'space-between',
                fontSize:15, fontWeight:900
              }}>
                <span>TOTAL</span>
                <span>€{total.toFixed(2)}</span>
              </div>

              <div style={{ textAlign:'center', marginTop:16, fontSize:9, color:'#cbd5e1' }}>
                {user.name.split(' ')[0]} · {new Date().toLocaleTimeString([],{hour:'2-digit',minute:'2-digit'})}
              </div>
              <div style={{ textAlign:'center', marginTop:4, fontSize:9, color:'#cbd5e1', fontStyle:'italic' }}>
                {settings?.footer || t('grazie')}
              </div>
            </div>

            <div style={{ padding:'0 14px 14px' }}>
              <button onClick={closeReceipt} style={{
                width:'100%', padding:'13px', background:'#0f172a',
                border:'none', borderRadius:10, color:'#fff',
                fontSize:11, fontWeight:800, textTransform:'uppercase',
                letterSpacing:'0.12em', cursor:'pointer', fontFamily:'inherit'
              }}>{t('doneClearTable')}</button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}