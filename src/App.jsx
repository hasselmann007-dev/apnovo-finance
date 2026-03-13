import React, { useState, useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { supabase } from './lib/supabase';
import Login from './pages/Login';
import Dashboard from './pages/Dashboard';
import CommunityUGC from './pages/CommunityUGC';
import Chats from './pages/Chats';
import RecoverPassword from './pages/RecoverPassword';
import GoalDetailView from './pages/GoalDetailView';
import { ThemeProvider } from './contexts/ThemeContext';

function App() {
  const [session, setSession] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      setLoading(false);
    });

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session);
    });

    return () => subscription.unsubscribe();
  }, []);

  if (loading) {
    return <div className="min-h-screen flex items-center justify-center bg-gray-50 text-indigo-600 font-bold">Carregando Apnovo...</div>;
  }

  return (
    <ThemeProvider>
      <Router>
        <Routes>
          <Route 
            path="/" 
            element={!session ? <Login /> : <Navigate to="/dashboard" replace />} 
          />
          <Route 
            path="/dashboard" 
            element={session ? <Dashboard session={session} /> : <Navigate to="/" replace />} 
          />
          <Route 
            path="/comunidade" 
            element={session ? <CommunityUGC session={session} /> : <Navigate to="/" replace />} 
          />
          <Route 
            path="/chats" 
            element={session ? <Chats session={session} /> : <Navigate to="/" replace />} 
          />
          <Route 
            path="/metas/:id" 
            element={session ? <GoalDetailView session={session} /> : <Navigate to="/" replace />} 
          />
          <Route 
            path="/recuperar" 
            element={<RecoverPassword />} 
          />
        </Routes>
      </Router>
    </ThemeProvider>
  );
}

export default App;
