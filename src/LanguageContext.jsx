import React, { createContext, useContext, useState, useEffect } from 'react'
import { translations } from './i18n'

const LanguageContext = createContext()

export function LanguageProvider({ children }) {
  const [lang, setLang] = useState('en')
  const [settings, setSettings] = useState(null)

  useEffect(() => {
    async function loadSettings() {
      try {
        const s = await window.electronAPI.getSettings()
        setSettings(s)
        if (s.language) {
          setLang(s.language)
        }
      } catch (e) {
        console.error('Failed to load settings:', e)
      }
    }
    loadSettings()
  }, [])

  const t = (key) => {
    return translations[lang][key] || key
  }

  const changeLanguage = async (newLang) => {
    setLang(newLang)
    try {
      await window.electronAPI.updateSettings({ language: newLang })
    } catch (e) {
      console.error('Failed to save language setting:', e)
    }
  }

  return (
    <LanguageContext.Provider value={{ lang, t, changeLanguage, settings, setSettings }}>
      {children}
    </LanguageContext.Provider>
  )
}

export function useTranslation() {
  const context = useContext(LanguageContext)
  if (!context) {
    throw new Error('useTranslation must be used within a LanguageProvider')
  }
  return context
}
