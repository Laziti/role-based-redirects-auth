import { createRoot } from 'react-dom/client'
import App from './App.tsx'
import './index.css'
import { Toaster } from 'sonner'
import { HelmetProvider } from 'react-helmet-async';

const root = createRoot(document.getElementById("root")!)

// Add theme class to document body for dark mode
document.documentElement.classList.add('dark-theme')

root.render(
  <>
    <HelmetProvider>
      <App />
    </HelmetProvider>
    <Toaster position="top-center" richColors />
  </>
)
