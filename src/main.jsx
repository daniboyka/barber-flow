import React from 'react'
import ReactDOM from 'react-dom/client'
import App from './App.jsx'
import './index.css'
import { AppointmentProvider } from './context/AppointmentContext' // <--- Importamos

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <AppointmentProvider> {/* <--- Envolvemos la App */}
      <App />
    </AppointmentProvider>
  </React.StrictMode>,
)