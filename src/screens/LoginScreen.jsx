import { useState, useEffect, useRef } from 'react'

export default function LoginScreen({ onLogin }) {
  const [pin, setPin]           = useState('')
  const [error, setError]       = useState(false)
  const [loading, setLoading]   = useState(false)
  const [shake, setShake]       = useState(false)
  const [clickCount, setClickCount] = useState(0)
  const [showRevoke, setShowRevoke] = useState(false)
  const [revokeKey, setRevokeKey]   = useState('')
  const [revokeMsg, setRevokeMsg]   = useState('')

  const buffer = useRef('')
  const timer  = useRef(null)

  useEffect(() => {
    function handleKey(e) {
      if (e.key === 'Enter') {
        const uid = buffer.current.trim()
        if (uid.length >= 4) checkRFID(uid)
        buffer.current = ''
        clearTimeout(timer.current)
        return
      }
      if (e.key.length === 1) {
        buffer.current += e.key
        clearTimeout(timer.current)
        timer.current = setTimeout(() => {
          if (buffer.current.length >= 4) checkRFID(buffer.current.trim())
          buffer.current = ''
        }, 100)
      }
    }
    window.addEventListener('keydown', handleKey)
    return () => window.removeEventListener('keydown', handleKey)
  }, [])

  async function checkRFID(uid) {
    try {
      const emp = await window.electronAPI.rfidLogin(uid)
      if (emp) onLogin(emp)
    } catch(e) { console.error(e) }
  }

  function handleNumber(num) {
    if (loading || pin.length >= 4) return
    const next = pin + num
    setPin(next)
    setError(false)
    if (next.length === 4) submit(next)
  }

  async function submit(finalPin) {
    setLoading(true)
    try {
      const emp = await window.electronAPI.pinLogin(finalPin)
      if (emp) {
        onLogin(emp)
      } else {
        setError(true)
        setShake(true)
        setTimeout(() => { setPin(''); setError(false); setShake(false) }, 700)
      }
    } catch(e) {
      setError(true)
      setTimeout(() => { setPin(''); setError(false) }, 700)
    } finally {
      setLoading(false)
    }
  }

  // Secret logo click — 5 times opens revoke panel
  function handleLogoClick() {
    const next = clickCount + 1
    setClickCount(next)
    if (next >= 5) {
      setClickCount(0)
      setShowRevoke(true)
    }
  }

  async function handleRevokeSubmit() {
    if (!revokeKey.trim()) return
    setRevokeMsg('')
    try {
      const result = await window.electronAPI.activateLicense(revokeKey.trim())
      if (result.expired) {
        setRevokeMsg('License revoked. App will lock on restart.')
        setTimeout(() => {
          window.location.reload()
        }, 2000)
      } else if (result.valid) {
        setRevokeMsg('Valid key entered — license updated!')
        setTimeout(() => {
          setShowRevoke(false)
          setRevokeKey('')
          setRevokeMsg('')
          setClickCount(0)
        }, 1500)
      } else {
        setRevokeMsg('Error: ' + (result.reason || 'Invalid key'))
      }
    } catch(e) {
      setRevokeMsg('Failed to process key.')
    }
  }

  return (
    <div style={{
      display:'flex', flexDirection:'column', alignItems:'center',
      justifyContent:'center', minHeight:'100vh',
      background:'#f8fafc', fontFamily:'"Inter",system-ui,sans-serif',
      padding:24
    }}>
      <style>{`
        @keyframes shake {
          0%,100%{transform:translateX(0)}
          20%{transform:translateX(-8px)} 40%{transform:translateX(8px)}
          60%{transform:translateX(-5px)} 80%{transform:translateX(5px)}
        }
        .num-btn:hover { background:#e2e8f0 !important; }
        .num-btn:active { transform:scale(0.95); }
      `}</style>

      {/* Logo — click 5 times to open revoke panel */}
      <div style={{ textAlign:'center', marginBottom:48 }}>
        <div
          onClick={handleLogoClick}
          style={{
            width:48, height:48, background:'#0f172a', borderRadius:14,
            display:'flex', alignItems:'center', justifyContent:'center',
            margin:'0 auto 16px', fontSize:20, fontWeight:900, color:'#fff',
            cursor:'default', userSelect:'none'
          }}
        >C</div>
        <div style={{ fontSize:22, fontWeight:800, color:'#0f172a', letterSpacing:'-0.5px' }}>
          CaféPOS
        </div>
        <div style={{
          fontSize:10, color:'#94a3b8', fontWeight:600,
          letterSpacing:'0.2em', textTransform:'uppercase', marginTop:4
        }}>
          Staff Access
        </div>
      </div>

      {/* PIN dots */}
      <div style={{
        display:'flex', gap:16, marginBottom:40,
        animation: shake ? 'shake 0.4s ease' : 'none'
      }}>
        {[0,1,2,3].map(i => (
          <div key={i} style={{
            width:12, height:12, borderRadius:'50%',
            transition:'all .2s',
            background: error ? '#ef4444' : pin.length > i ? '#0f172a' : '#e2e8f0',
            transform: pin.length > i ? 'scale(1.2)' : 'scale(1)'
          }}/>
        ))}
      </div>

      {/* Numpad */}
      <div style={{ display:'grid', gridTemplateColumns:'repeat(3,1fr)', gap:10, width:240 }}>
        {[1,2,3,4,5,6,7,8,9].map(n => (
          <button key={n} className="num-btn"
            onClick={() => handleNumber(n.toString())}
            disabled={loading} style={{
              height:68, borderRadius:14, background:'#fff',
              border:'1px solid #e2e8f0', color:'#0f172a',
              fontSize:20, fontWeight:700, cursor:'pointer',
              transition:'all .12s', fontFamily:'inherit',
              boxShadow:'0 1px 3px rgba(0,0,0,0.06)'
            }}>{n}</button>
        ))}
        <div />
        <button className="num-btn"
          onClick={() => handleNumber('0')}
          disabled={loading} style={{
            height:68, borderRadius:14, background:'#fff',
            border:'1px solid #e2e8f0', color:'#0f172a',
            fontSize:20, fontWeight:700, cursor:'pointer',
            transition:'all .12s', fontFamily:'inherit',
            boxShadow:'0 1px 3px rgba(0,0,0,0.06)'
          }}>0</button>
        <button onClick={() => { setPin(p => p.slice(0,-1)); setError(false) }}
          disabled={loading || pin.length === 0} style={{
            height:68, borderRadius:14, background:'transparent',
            border:'none', color:'#94a3b8', fontSize:20,
            cursor: pin.length === 0 ? 'not-allowed' : 'pointer',
            transition:'all .12s', fontFamily:'inherit'
          }}>⌫</button>
      </div>

      {/* RFID hint */}
      <div style={{
        marginTop:40, fontSize:10, color:'#cbd5e1', fontWeight:600,
        textTransform:'uppercase', letterSpacing:'0.15em',
        display:'flex', alignItems:'center', gap:8
      }}>
        <div style={{ width:6, height:6, borderRadius:'50%', background:'#94a3b8' }}/>
        RFID Scanner Active
      </div>

      {/* ── Secret Revoke Panel ── */}
      {showRevoke && (
        <div style={{
          position:'fixed', inset:0,
          background:'rgba(15,23,42,0.7)',
          backdropFilter:'blur(8px)',
          display:'flex', alignItems:'center', justifyContent:'center',
          zIndex:999, padding:24
        }}>
          <div style={{
            background:'#fff', borderRadius:16,
            border:'1px solid #e2e8f0',
            padding:'32px 28px', width:'100%', maxWidth:380,
            boxShadow:'0 24px 48px rgba(0,0,0,0.15)'
          }}>
            {/* Header */}
            <div style={{ marginBottom:24 }}>
              <div style={{ fontSize:16, fontWeight:800, color:'#0f172a', marginBottom:4 }}>
                License Management
              </div>
              <div style={{ fontSize:12, color:'#94a3b8' }}>
                Enter a license key or revoke key below.
              </div>
            </div>

            {/* Input */}
            <div style={{ marginBottom:14 }}>
              <div style={{
                fontSize:10, fontWeight:700, color:'#94a3b8',
                textTransform:'uppercase', letterSpacing:'0.12em', marginBottom:8
              }}>License Key</div>
              <input
                value={revokeKey}
                onChange={e => { setRevokeKey(e.target.value.toUpperCase()); setRevokeMsg('') }}
                onKeyDown={e => e.key === 'Enter' && handleRevokeSubmit()}
                placeholder="XXXXX-XXXXX-XXXXX-XXXXX"
                autoFocus
                style={{
                  width:'100%', padding:'12px 14px',
                  background:'#f8fafc', border:'1px solid #e2e8f0',
                  borderRadius:10, color:'#0f172a', fontSize:13,
                  fontFamily:'"DM Mono","Courier New",monospace',
                  letterSpacing:'0.08em', outline:'none',
                  boxSizing:'border-box', textAlign:'center'
                }}
              />
            </div>

            {/* Message */}
            {revokeMsg && (
              <div style={{
                padding:'10px 14px', borderRadius:8, marginBottom:14,
                fontSize:12, fontWeight:500,
                background: revokeMsg.startsWith('Error') ? '#fef2f2' : '#f0fdf4',
                color:      revokeMsg.startsWith('Error') ? '#ef4444' : '#16a34a',
                border: revokeMsg.startsWith('Error')
                  ? '1px solid #fecaca' : '1px solid #bbf7d0'
              }}>{revokeMsg}</div>
            )}

            {/* Buttons */}
            <div style={{ display:'flex', gap:10 }}>
              <button onClick={handleRevokeSubmit} style={{
                flex:1, padding:'11px',
                background:'#0f172a', border:'none', borderRadius:10,
                color:'#fff', fontSize:11, fontWeight:700,
                textTransform:'uppercase', letterSpacing:'0.08em',
                cursor:'pointer', fontFamily:'inherit'
              }}>Apply Key</button>
              <button onClick={() => {
                setShowRevoke(false)
                setRevokeKey('')
                setRevokeMsg('')
                setClickCount(0)
              }} style={{
                flex:1, padding:'11px',
                background:'#f1f5f9', border:'1px solid #e2e8f0',
                borderRadius:10, color:'#64748b', fontSize:11, fontWeight:700,
                textTransform:'uppercase', letterSpacing:'0.08em',
                cursor:'pointer', fontFamily:'inherit'
              }}>Cancel</button>
            </div>

            <div style={{
              marginTop:16, fontSize:11, color:'#cbd5e1',
              textAlign:'center', lineHeight:1.6
            }}>
              This panel is for authorized use only.
            </div>
          </div>
        </div>
      )}
    </div>
  )
}