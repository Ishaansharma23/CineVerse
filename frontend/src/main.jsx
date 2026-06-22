import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import 'slick-carousel/slick/slick.css'
import 'slick-carousel/slick/slick-theme.css'
import './index.css'
import App from './App.jsx'
import { BrowserRouter } from 'react-router-dom'
import { LocationProvider } from './context/LocationContext.jsx'

createRoot(document.getElementById('root')).render(
  <BrowserRouter>
  <StrictMode>
    <LocationProvider>
       <App />
    </LocationProvider>
  </StrictMode>
  </BrowserRouter>,
)
