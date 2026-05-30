import { useState } from 'react'

export default function LicenseScreen({ onActivated, expiredInfo }) {
  const [key, setKey]       = useState('')
  const [error, setError]   = useState('')
  const [loading, setLoading] = useState(false)
  const [success, setSuccess] = useState(false)

  async function handleActivate() {
    if (!key.trim()) return
    setLoading(true)
    setError('')
    try {
      const result = await window.electronAPI.activateLicense(key.trim())
      if (result.valid) {
        setSuccess(true)
        setTimeout(() => onActivated(result), 1500)
      } else {
        setError(result.reason || 'Invalid license key')
      }
    } catch(e) {
      setError('Activation failed. Try again.')
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
      <div style={{
        width:'100%', maxWidth:420,
        background:'#fff', borderRadius:20,
        border:'1px solid #e2e8f0',
        padding:'40px 36px',
        boxShadow:'0 4px 24px rgba(0,0,0,0.06)'
      }}>
        {/* Logo */}
        <div style={{ textAlign:'center', marginBottom:32 }}>
          <div style={{
            width:44, height:44, background:'#0f172a', borderRadius:12,
            display:'flex', alignItems:'center', justifyContent:'center',
            margin:'0 auto 14px', fontSize:20, fontWeight:900, color:'#fff'
          }}>C</div>
          <div style={{ fontSize:20, fontWeight:800, color:'#0f172a', letterSpacing:'-0.5px' }}>
            CaféPOS
          </div>
          <div style={{ fontSize:10, color:'#94a3b8', fontWeight:600, letterSpacing:'0.2em', textTransform:'uppercase', marginTop:4 }}>
            License Activation
          </div>
        </div>

        {/* Expired warning */}
        {expiredInfo && (
          <div style={{
            background:'#fef2f2', border:'1px solid #fecaca',
            borderRadius:10, padding:'12px 16px', marginBottom:20,
            fontSize:12, color:'#ef4444'
          }}>
            <div style={{ fontWeight:700, marginBottom:2 }}>License Expired</div>
            <div style={{ color:'#f87171' }}>
              Your license expired on {expiredInfo.expiry}.<br/>
              Please contact your provider for a new key.
            </div>
          </div>
        )}

        {/* Description */}
        {!expiredInfo && (
          <div style={{
            background:'#f8fafc', border:'1px solid #e2e8f0',
            borderRadius:10, padding:'12px 16px', marginBottom:24,
            fontSize:12, color:'#64748b', lineHeight:1.6
          }}>
            Enter the license key provided by your software vendor to activate CaféPOS.
          </div>
        )}

        {/* Key input */}
        <div style={{ marginBottom:16 }}>
          <div style={{
            fontSize:10, fontWeight:700, color:'#94a3b8',
            textTransform:'uppercase', letterSpacing:'0.12em', marginBottom:8
          }}>License Key</div>
          <input
            value={key}
            onChange={e => { setKey(e.target.value.toUpperCase()); setError('') }}
            onKeyDown={e => e.key==='Enter' && handleActivate()}
            placeholder="XXXXX-XXXXX-XXXXX-XXXXX"
            style={{
              width:'100%', padding:'12px 14px',
              background:'#f8fafc', border:`1px solid ${error ? '#fca5a5' : '#e2e8f0'}`,
              borderRadius:10, color:'#0f172a', fontSize:14,
              fontFamily:'"DM Mono","Courier New",monospace',
              letterSpacing:'0.1em', outline:'none',
              boxSizing:'border-box', transition:'border .15s',
              textAlign:'center'
            }}
          />
        </div>

        {/* Error */}
        {error && (
          <div style={{
            fontSize:12, color:'#ef4444', marginBottom:14,
            textAlign:'center', fontWeight:500
          }}>{error}</div>
        )}

        {/* Success */}
        {success && (
          <div style={{
            fontSize:12, color:'#16a34a', marginBottom:14,
            textAlign:'center', fontWeight:600,
            background:'#f0fdf4', padding:'10px', borderRadius:8,
            border:'1px solid #bbf7d0'
          }}>
            License activated! Starting app...
          </div>
        )}

        {/* Button */}
        <button
          onClick={handleActivate}
          disabled={loading || success || !key.trim()}
          style={{
            width:'100%', padding:'13px',
            background: success ? '#16a34a' : !key.trim() ? '#f1f5f9' : '#0f172a',
            border:'none', borderRadius:10,
            color: !key.trim() ? '#94a3b8' : '#fff',
            fontSize:12, fontWeight:700,
            textTransform:'uppercase', letterSpacing:'0.1em',
            cursor: !key.trim() ? 'not-allowed' : 'pointer',
            fontFamily:'inherit', transition:'all .15s'
          }}
        >
          {loading ? 'Activating...' : success ? 'Activated!' : 'Activate License'}
        </button>

        {/* Contact */}
        <div style={{
          marginTop:24, textAlign:'center',
          fontSize:11, color:'#cbd5e1', lineHeight:1.6
        }}>
          Need a license key?<br/>
          <span style={{ color:'#94a3b8', fontWeight:600 }}>
            Contact your software provider
          </span>
        </div>
      </div>
    </div>
  )
}