import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { BrowserRouter } from 'react-router-dom';
import { Provider } from 'react-redux';
import { Toaster } from 'react-hot-toast';
import { store } from './redux/store';
import { LocationProvider } from './context/LocationContext.jsx';
import ErrorBoundary from './components/shared/ErrorBoundary.jsx';
import App from './App.jsx';

import 'slick-carousel/slick/slick.css';
import 'slick-carousel/slick/slick-theme.css';
import './index.css';

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <Provider store={store}>
      <BrowserRouter>
        <LocationProvider>
          <ErrorBoundary>
            <App />
          </ErrorBoundary>
          <Toaster 
            position="top-center"
            toastOptions={{
              style: {
                background: '#121212',
                color: '#fff',
                border: '1px solid #262626',
                borderRadius: '12px',
                fontSize: '13px',
              },
            }}
          />
        </LocationProvider>
      </BrowserRouter>
    </Provider>
  </StrictMode>
);
