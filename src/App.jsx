import { useState, useEffect } from 'react'
import LoginScreen   from './screens/LoginScreen'
import WaiterScreen  from './screens/WaiterScreen'
import AdminScreen   from './screens/AdminScreen'
import LicenseScreen from './screens/LicenseScreen'

export default function App() {
  const [screen, setScreen]         = useState('checking')
  const [currentUser, setCurrentUser] = useState(null)
  const [licenseInfo, setLicenseInfo] = useState(null)
  const [expiredInfo, setExpiredInfo] = useState(null)

  useEffect(() => {
    async function checkLic() {
      try {
        const result = await window.electronAPI.checkLicense()
        if (result.valid) {
          setLicenseInfo(result)
          setScreen('login')
        } else if (result.expired) {
          setExpiredInfo(result)
          setScreen('license')
        } else {
          setScreen('license')
        }
      } catch(e) {
        setScreen('license')
      }
    }
    checkLic()
  }, [])

  function handleLogin(employee) {
    setCurrentUser(employee)
    setScreen(employee.role === 'admin' ? 'admin' : 'waiter')
  }

  function handleLogout() {
    setCurrentUser(null)
    setScreen('login')
  }

  function handleActivated(result) {
    setLicenseInfo(result)
    setExpiredInfo(null)
    setScreen('login')
  }

  // Show warning banner if license expires soon
  const daysLeft = licenseInfo?.daysLeft
  const showWarning = daysLeft !== undefined && daysLeft <= 30

  return (
    <div style={{ height:'100vh', display:'flex', flexDirection:'column' }}>

      {/* Expiry warning banner */}
      {showWarning && screen !== 'license' && (
        <div style={{
          padding:'8px 20px', textAlign:'center',
          background: daysLeft <= 7 ? '#fef2f2' : '#fffbeb',
          borderBottom: daysLeft <= 7 ? '1px solid #fecaca' : '1px solid #fde68a',
          fontSize:12, fontWeight:600,
          color: daysLeft <= 7 ? '#ef4444' : '#d97706'
        }}>
          {daysLeft <= 7
            ? `License expires in ${daysLeft} day${daysLeft!==1?'s':''}! Contact your provider immediately.`
            : `License expires in ${daysLeft} days. Contact your provider to renew.`
          }
        </div>
      )}

      {screen === 'checking' && (
        <div style={{
          flex:1, display:'flex', alignItems:'center', justifyContent:'center',
          background:'#f8fafc', fontFamily:'Inter,system-ui,sans-serif',
          fontSize:13, color:'#94a3b8'
        }}>
          Loading...
        </div>
      )}

      {screen === 'license' && (
        <LicenseScreen onActivated={handleActivated} expiredInfo={expiredInfo} />
      )}

      {screen === 'login' && (
        <LoginScreen onLogin={handleLogin} />
      )}

      {screen === 'waiter' && (
        <WaiterScreen user={currentUser} onLogout={handleLogout} />
      )}

      {screen === 'admin' && (
        <AdminScreen user={currentUser} onLogout={handleLogout} />
      )}
    </div>
  )
}