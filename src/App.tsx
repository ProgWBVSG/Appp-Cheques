import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import AppLayout from './layouts/AppLayout';
import Login from './pages/Login';
import Dashboard from './pages/Dashboard';
import Clientes from './pages/Clientes';
import Cheques from './pages/Cheques';
import Calendario from './pages/Calendario';
import Reportes from './pages/Reportes';
import Calculadora from './pages/Calculadora';
import Tutorial from './pages/Tutorial';
import Metas from './pages/Metas';
import { useEffect, useState } from 'react';
import { supabase } from './lib/supabase';
import type { Session } from '@supabase/supabase-js';

import { RecordatoriosProvider } from './context/RecordatoriosContext';
import InstallPrompt from './components/InstallPrompt';

function App() {
  // FAKE SESSION FOR DEMO PURPOSES
  const [session] = useState<Session | null>({ user: { id: 'demo' } } as any);
  const [loading] = useState(false);
  console.log(supabase); // Evita error de variable no usada en demo

  useEffect(() => {
    // DEMO BYPASS: Comentado para que no pise la sesión falsa con "null".
    /*
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      setLoading(false);
    }).catch(() => {
      setLoading(false);
    });

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session);
    });

    return () => subscription.unsubscribe();
    */
  }, []);

  if (loading) {
    return <div className="min-h-screen bg-premium-dark flex items-center justify-center text-premium-text">Cargando...</div>;
  }

  return (
    <RecordatoriosProvider>
      <InstallPrompt />
      <Router>
        <Routes>
          <Route path="/login" element={!session ? <Login /> : <Navigate to="/" />} />
          
          {/* Protected Routes */}
          <Route path="/" element={session ? <AppLayout /> : <Navigate to="/login" />}>
            <Route index element={<Dashboard />} />
            <Route path="clientes" element={<Clientes />} />
            <Route path="cheques" element={<Cheques />} />
            <Route path="calendario" element={<Calendario />} />
            <Route path="reportes" element={<Reportes />} />
            <Route path="metas" element={<Metas />} />
            <Route path="calculadora" element={<Calculadora />} />
            <Route path="tutorial" element={<Tutorial />} />
          </Route>
        </Routes>
      </Router>
    </RecordatoriosProvider>
  );
}

export default App;
