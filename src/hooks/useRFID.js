import { useEffect, useRef } from 'react'

/**
 * RFID readers in HID/keyboard mode fire characters rapidly
 * followed by Enter. We buffer them and fire on Enter.
 * 
 * Most USB RFID readers send 8–12 chars in < 50ms then Enter.
 */
export function useRFID(onScan) {
  const buffer = useRef('')
  const timer  = useRef(null)

  useEffect(() => {
    function handleKeyDown(e) {
      // Only capture when no input/textarea is focused
      const tag = document.activeElement?.tagName
      if (tag === 'INPUT' || tag === 'TEXTAREA' || tag === 'SELECT') return

      if (e.key === 'Enter') {
        const uid = buffer.current.trim()
        if (uid.length >= 4) onScan(uid)  // minimum valid UID length
        buffer.current = ''
        clearTimeout(timer.current)
        return
      }

      // Accumulate characters
      if (e.key.length === 1) {
        buffer.current += e.key
        // Auto-flush after 100ms of no input (fallback for readers without Enter)
        clearTimeout(timer.current)
        timer.current = setTimeout(() => {
          if (buffer.current.length >= 4) onScan(buffer.current.trim())
          buffer.current = ''
        }, 100)
      }
    }

    window.addEventListener('keydown', handleKeyDown)
    return () => {
      window.removeEventListener('keydown', handleKeyDown)
      clearTimeout(timer.current)
    }
  }, [onScan])
}