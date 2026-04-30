import './App.css'
import { useState } from 'react'
import Login from './components/Login'
import Dashboard from './components/Dashboard'
import Developers from './components/Developers'
import Shortlist from './components/Shortlist'

function App() {
  const [signedIn, setSignedIn] = useState(false)
  const [currentPage, setCurrentPage] = useState('dashboard')

  const handleNavigate = (page) => {
    setCurrentPage(page)
  }

  if (!signedIn) {
    return <Login onSignIn={() => setSignedIn(true)} />
  }

  if (currentPage === 'dashboard') {
    return <Dashboard onSignOut={() => setSignedIn(false)} onNavigate={handleNavigate} />
  }

  if (currentPage === 'developers') {
    return <Developers onSignOut={() => setSignedIn(false)} onNavigate={handleNavigate} />
  }

  if (currentPage === 'shortlist') {
    return <Shortlist onSignOut={() => setSignedIn(false)} onNavigate={handleNavigate} />
  }

  return <Dashboard onSignOut={() => setSignedIn(false)} onNavigate={handleNavigate} />
}

export default App
