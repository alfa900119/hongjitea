import React from 'react'
import ReactDOM from 'react-dom/client'
import App from './HongJiShop.jsx'
import AdminPanel from './HongJiAdmin.jsx'

const isAdmin = window.location.pathname === '/admin'

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    {isAdmin ? <AdminPanel /> : <App />}
  </React.StrictMode>
)
