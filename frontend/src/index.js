import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App';
import { GoogleOAuthProvider } from '@react-oauth/google';
import { AuthProvider } from './context/AuthContext';  

const root = ReactDOM.createRoot(document.getElementById('root'));
root.render(
  <GoogleOAuthProvider clientId="765150354632-8qjjp3l63atclifr8lnscl9gi99o0u5s.apps.googleusercontent.com">
    <AuthProvider> 
      <React.StrictMode>
        <App />
      </React.StrictMode>
    </AuthProvider>
  </GoogleOAuthProvider>
);
