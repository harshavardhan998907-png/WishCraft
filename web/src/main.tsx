import React from 'react'
import ReactDOM from 'react-dom/client'
import { BrowserRouter } from 'react-router-dom'
import { HelmetProvider } from 'react-helmet-async'
import App from './App'
import './index.css'
import { ThemeProvider } from './theme/ThemeProvider'
import { AnalyticsProvider } from './modules/analytics/providers/AnalyticsProvider'

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <HelmetProvider>
      <ThemeProvider>
        <AnalyticsProvider>
          <BrowserRouter>
            <App />
          </BrowserRouter>
        </AnalyticsProvider>
      </ThemeProvider>
    </HelmetProvider>
  </React.StrictMode>,
)
