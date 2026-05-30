import { useState, useEffect, useRef } from 'react'

export default function LoginScreen({ onLogin }) {
  const [pin, setPin] = useState('')
  const [error, setError] = useState(false)
  const [loading, setLoading] = useState(false)

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
    } catch (e) { console.error(e) }
  }

  const handleNumberClick = (num) => {
    if (pin.length < 4) {
      const newPin = pin + num
      setPin(newPin)
      if (newPin.length === 4) handlePinSubmit(newPin)
    }
  }

  const handlePinSubmit = async (finalPin) => {
    setLoading(true); setError(false)
    try {
      const employee = await window.electronAPI.pinLogin(finalPin)
      if (employee) onLogin(employee)
      else { setError(true); setPin('') }
    } catch (e) { setError(true); setPin('') } finally { setLoading(false) }
  }

  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-[#0a0c10] text-slate-200 font-sans p-6 overflow-hidden">

      <div className="w-full max-w-xs text-center mb-12">
        <h1 className="text-5xl font-black tracking-tighter text-blue-500 mb-2">CaféPOS</h1>
        <p className="text-slate-500 text-[10px] font-bold uppercase tracking-[.3em]">Access Security</p>
      </div>

      <div className="w-full max-w-sm">
        {/* PIN Dots */}
        <div className="flex justify-center gap-6 mb-16">
          {[0, 1, 2, 3].map((i) => (
            <div
              key={i}
              className={`w-3 h-3 rounded-full transition-all duration-300 ${
                pin.length > i ? 'bg-blue-500 scale-125' : error ? 'bg-red-500 animate-pulse' : 'bg-slate-800'
              }`}
            />
          ))}
        </div>

        {/* Minimalist Numpad */}
        <div className="grid grid-cols-3 gap-6">
          {[1, 2, 3, 4, 5, 6, 7, 8, 9].map((num) => (
            <button
              key={num}
              onClick={() => handleNumberClick(num.toString())}
              disabled={loading}
              className="h-20 rounded-2xl bg-slate-900/50 hover:bg-blue-600/10 border border-slate-800/50 hover:border-blue-500/30 text-2xl font-black transition-all disabled:opacity-50 active:scale-90"
            >
              {num}
            </button>
          ))}
          <div />
          <button
            onClick={() => handleNumberClick('0')}
            disabled={loading}
            className="h-20 rounded-2xl bg-slate-900/50 hover:bg-blue-600/10 border border-slate-800/50 hover:border-blue-500/30 text-2xl font-black transition-all disabled:opacity-50 active:scale-90"
          >
            0
          </button>
          <button
            onClick={() => setPin(pin.slice(0, -1))}
            disabled={loading || pin.length === 0}
            className="h-20 flex items-center justify-center text-slate-600 hover:text-slate-300 transition-colors"
          >
            <span className="text-2xl">←</span>
          </button>
        </div>

        <div className="mt-16 text-center">
          <div className="text-slate-700 text-[9px] font-bold uppercase tracking-widest flex items-center justify-center gap-2">
            <span className="w-1.5 h-1.5 bg-blue-500/50 rounded-full" />
            Scanner Active
          </div>
        </div>
      </div>

    </div>
  )
}
