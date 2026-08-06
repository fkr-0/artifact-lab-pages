import { StrictMode } from 'react'
import ReactDOM from 'react-dom/client'
import App from './App'
import { ThemeProvider } from './hooks/use-theme'
import './index.css'

const rootElement = document.getElementById('root')

if (!rootElement) {
  throw new Error('Git Recipe Book could not find its #root mount element.')
}

ReactDOM.createRoot(rootElement).render(
  <StrictMode>
    <ThemeProvider>
      <App />
    </ThemeProvider>
  </StrictMode>,
)
