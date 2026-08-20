import React from 'react'
import ReactDOM from 'react-dom/client'
import { BrowserRouter } from 'react-router-dom'
import App from './App.jsx'
import { AuthProvider } from './contexts/AuthContext.jsx'
import { VoiceProvider } from './contexts/VoiceContext.jsx'
import './index.css'

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <BrowserRouter>
      <AuthProvider>
        <VoiceProvider>
          <App />
        </VoiceProvider>
      </AuthProvider>
    </BrowserRouter>
  </React.StrictMode>,
)
