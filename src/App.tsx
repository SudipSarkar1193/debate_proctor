import './App.css'
import React from 'react'
import DashboardPage from './pages/DashboardPage'
import LoginPage from './pages/LoginPage'


const App: React.FC = () => {
  return (
    <div className="h-screen w-screen bg-gray-700">
      <LoginPage />
    </div>
  )
}

export default App
