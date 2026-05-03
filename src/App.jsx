import './App.css'
import { useState } from 'react'
import Login from './components/Login'
import Dashboard from './components/Dashboard'
import Developers from './components/Developers'
import Shortlist from './components/Shortlist'

function App() {
  const [signedIn, setSignedIn] = useState(() =>
    localStorage.getItem("isSignedIn") === "true"
  )
  const [currentPage, setCurrentPage] = useState('dashboard')

  const handleNavigate = (page) => {
    setCurrentPage(page)
  }

  const handleSignOut = () => {
    localStorage.removeItem("isSignedIn")
    setSignedIn(false)
  }

  if (!signedIn) {
    return <Login onSignIn={() => {
      localStorage.setItem("isSignedIn", "true")
      setSignedIn(true)
    }} />
  }

  if (currentPage === 'dashboard') {
    return <Dashboard onSignOut={handleSignOut} onNavigate={handleNavigate} />
  }

  if (currentPage === 'developers') {
    return <Developers onSignOut={handleSignOut} onNavigate={handleNavigate} />
  }

  if (currentPage === 'shortlist') {
    return <Shortlist onSignOut={handleSignOut} onNavigate={handleNavigate} />
  }

  return <Dashboard onSignOut={handleSignOut} onNavigate={handleNavigate} />
}

export default App
