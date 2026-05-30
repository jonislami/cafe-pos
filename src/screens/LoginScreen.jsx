import { useState, useEffect, useRef } from 'react'

export default function LoginScreen({ onLogin }) {
  const [pin, setPin]         = useState('')
  const [error, setError]     = useState(false)
  const [loading, setLoading] = useState(false)
  const [shake, setShake]     = useState(false)
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

      {/* Logo */}
      <div style={{ textAlign:'center', marginBottom:48 }}>
        <div style={{
          width:48, height:48, background:'#1e293b', borderRadius:14,
          display:'flex', alignItems:'center', justifyContent:'center',
          margin:'0 auto 16px', fontSize:20, fontWeight:900, color:'#fff'
        }}>C</div>
        <div style={{ fontSize:22, fontWeight:800, color:'#0f172a', letterSpacing:'-0.5px' }}>CaféPOS</div>
        <div style={{ fontSize:10, color:'#94a3b8', fontWeight:600, letterSpacing:'0.2em', textTransform:'uppercase', marginTop:4 }}>
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
            background: error ? '#ef4444' : pin.length > i ? '#1e293b' : '#e2e8f0',
            transform: pin.length > i ? 'scale(1.2)' : 'scale(1)'
          }}/>
        ))}
      </div>

      {/* Numpad */}
      <div style={{ display:'grid', gridTemplateColumns:'repeat(3,1fr)', gap:10, width:240 }}>
        {[1,2,3,4,5,6,7,8,9].map(n => (
          <button key={n} className="num-btn" onClick={() => handleNumber(n.toString())}
            disabled={loading} style={{
              height:68, borderRadius:14, background:'#fff',
              border:'1px solid #e2e8f0', color:'#0f172a',
              fontSize:20, fontWeight:700, cursor:'pointer',
              transition:'all .12s', fontFamily:'inherit',
              boxShadow:'0 1px 3px rgba(0,0,0,0.06)'
            }}>{n}</button>
        ))}
        <div />
        <button className="num-btn" onClick={() => handleNumber('0')} disabled={loading} style={{
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
        <div style={{
          width:6, height:6, borderRadius:'50%', background:'#94a3b8'
        }}/>
        RFID Scanner Active
      </div>
    </div>
  )
}