import { useEffect, useRef } from 'react'

const DEMO_STAFF = [
  { id: 1, name: 'Marco Romano', role: 'admin',  card_uid: 'A1B2C3D4' },
  { id: 2, name: 'Sofia Greco',  role: 'waiter', card_uid: 'E5F6G7H8' },
  { id: 3, name: 'Luca Bianchi', role: 'waiter', card_uid: 'I9J0K1L2' },
]

export default function LoginScreen({ onLogin }) {
  const buffer = useRef('')
  const timer = useRef(null)

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
      const employee = await window.electronAPI.rfidLogin(uid)
      if (employee) onLogin(employee)
    } catch (e) {
      console.error(e)
    }
  }

  return (
    <div style={{
      flex: 1, display: 'flex', alignItems: 'center',
      justifyContent: 'center', background: '#0f1117'
    }}>
      <div style={{
        background: '#1a1d2e', border: '1px solid #2d3148',
        borderRadius: 20, padding: 48, textAlign: 'center',
        width: 360
      }}>
        <div style={{
          width: 80, height: 80, borderRadius: '50%',
          background: 'rgba(249,115,22,0.1)',
          border: '2px dashed #f97316',
          display: 'flex', alignItems: 'center',
          justifyContent: 'center', margin: '0 auto 24px',
          fontSize: 32
        }}>📡</div>

        <div style={{ fontSize: 22, fontWeight: 600, marginBottom: 8 }}>
          CaféPOS
        </div>
        <div style={{ fontSize: 14, color: '#94a3b8', marginBottom: 8 }}>
          Tap RFID card to login
        </div>
        <div style={{ fontSize: 11, color: '#64748b', marginBottom: 20 }}>
          or select employee below to demo
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
          {DEMO_STAFF.map(emp => (
            <div
              key={emp.id}
              onClick={() => onLogin(emp)}
              style={{
                padding: '12px 8px', background: '#252836',
                border: '1px solid #2d3148', borderRadius: 10,
                cursor: 'pointer', fontSize: 12, color: '#f1f5f9'
              }}
            >
              <div>{emp.role === 'admin' ? '👨‍💼' : '👨‍🍳'} {emp.name}</div>
              <div style={{ fontSize: 10, color: '#64748b', marginTop: 3 }}>
                {emp.role}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}