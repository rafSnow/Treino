import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App.tsx'
import Login from './Login.tsx'
import { seedDatabase } from './seed'
import { AuthProvider, useAuth } from './AuthContext'
import SplashScreen from './SplashScreen'

import { useEffect } from 'react';

const RootApp = () => {
  const { user, loading } = useAuth();
  
  useEffect(() => {
    if (user) {
      seedDatabase().catch(console.error);
    }
  }, [user]);

  if (loading) {
    return <SplashScreen />;
  }
  
  if (!user) {
    return <Login />;
  }
  
  return <App />;
};

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <AuthProvider>
      <RootApp />
    </AuthProvider>
  </StrictMode>,
)
