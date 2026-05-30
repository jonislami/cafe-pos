import { useState, useEffect, useRef } from 'react'

export default function LoginScreen({ onLogin }) {
  const [pin, setPin] = useState('')
  const [error, setError] = useState(false)
  const [loading, setLoading] = useState(false)

  const buffer = useRef('')
  const timer = useRef(null)

  useEffect(() => {
    function handleKey(e) {
      // RFID logic
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
      if (employee) {
        onLogin(employee)
      }
    } catch (e) {
      console.error(e)
    }
  }

  const handleNumberClick = (num) => {
    if (pin.length < 4) {
      const newPin = pin + num
      setPin(newPin)
      if (newPin.length === 4) {
        handlePinSubmit(newPin)
      }
    }
  }

  const handleDelete = () => {
    setPin(pin.slice(0, -1))
    setError(false)
  }

  const handlePinSubmit = async (finalPin) => {
    setLoading(true)
    setError(false)
    try {
      const employee = await window.electronAPI.pinLogin(finalPin)
      if (employee) {
        onLogin(employee)
      } else {
        setError(true)
        setPin('')
        // Brief vibration or shake effect could be added here
      }
    } catch (e) {
      console.error(e)
      setError(true)
      setPin('')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-slate-950 text-slate-50 font-sans p-6">
      <div className="w-full max-w-md bg-slate-900 border border-slate-800 rounded-3xl p-8 shadow-2xl">
        <div className="text-center mb-10">
          <h1 className="text-4xl font-black tracking-tighter mb-2 text-orange-500">CaféPOS</h1>
          <p className="text-slate-400 text-sm">Enter your PIN to start your shift</p>
        </div>

        {/* PIN Indicators */}
        <div className="flex justify-center gap-4 mb-10">
          {[0, 1, 2, 3].map((i) => (
            <div
              key={i}
              className={`w-4 h-4 rounded-full border-2 transition-all duration-200 ${
                pin.length > i
                  ? 'bg-orange-500 border-orange-500 scale-110'
                  : error
                    ? 'border-red-500 bg-red-500/20'
                    : 'border-slate-700 bg-transparent'
              }`}
            />
          ))}
        </div>

        {error && (
          <div className="text-center text-red-400 text-sm mb-6 animate-pulse">
            Invalid PIN. Please try again.
          </div>
        )}

        {/* Numpad */}
        <div className="grid grid-cols-3 gap-4 mb-8">
          {[1, 2, 3, 4, 5, 6, 7, 8, 9].map((num) => (
            <button
              key={num}
              onClick={() => handleNumberClick(num.toString())}
              disabled={loading}
              className="h-16 rounded-2xl bg-slate-800 hover:bg-slate-700 active:bg-slate-600 border border-slate-700/50 text-xl font-semibold transition-colors flex items-center justify-center disabled:opacity-50"
            >
              {num}
            </button>
          ))}
          <div className="h-16" /> {/* Placeholder */}
          <button
            onClick={() => handleNumberClick('0')}
            disabled={loading}
            className="h-16 rounded-2xl bg-slate-800 hover:bg-slate-700 active:bg-slate-600 border border-slate-700/50 text-xl font-semibold transition-colors flex items-center justify-center disabled:opacity-50"
          >
            0
          </button>
          <button
            onClick={handleDelete}
            disabled={loading || pin.length === 0}
            className="h-16 rounded-2xl bg-slate-800/50 hover:bg-red-500/10 hover:text-red-400 active:bg-red-500/20 border border-slate-700/50 text-xl font-semibold transition-colors flex items-center justify-center disabled:opacity-50"
          >
            ⌫
          </button>
        </div>

        <div className="text-center">
          <div className="text-slate-500 text-xs flex items-center justify-center gap-2">
            <span className="w-2 h-2 bg-green-500 rounded-full animate-pulse" />
            RFID System Ready
          </div>
        </div>
      </div>

      {/* Footer info */}
      <div className="mt-8 text-slate-600 text-xs uppercase tracking-widest font-medium">
        Caffè Centro POS v1.0.0
      </div>
    </div>
  )
}
