import { useState } from 'react'
import LoginScreen from './screens/LoginScreen'
import WaiterScreen from './screens/WaiterScreen'
import AdminScreen from './screens/AdminScreen'

export default function App() {
  const [screen, setScreen] = useState('login')
  const [currentUser, setCurrentUser] = useState(null)

  function handleLogin(employee) {
    setCurrentUser(employee)
    if (employee.role === 'admin') {
      setScreen('admin')
    } else {
      setScreen('waiter')
    }
  }

  function handleLogout() {
    setCurrentUser(null)
    setScreen('login')
  }

  return (
    <div style={{ height: '100vh', display: 'flex', flexDirection: 'column' }}>
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