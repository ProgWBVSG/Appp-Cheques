import { Outlet, Link, useLocation, useNavigate } from 'react-router-dom';
import { Home, Users, FileText, Calendar, LogOut, Table, Calculator, HelpCircle } from 'lucide-react';
import { supabase } from '../lib/supabase';
import CotizacionesBar from '../components/CotizacionesBar';
import { isSameDay } from 'date-fns';
import { useState } from 'react';
import NotificationDrawer from '../components/NotificationDrawer';
import { useRecordatorios } from '../context/RecordatoriosContext';
import { Bell } from 'lucide-react';
import { useLiveQuery } from 'dexie-react-hooks';
import { db } from '../db/db';

export default function AppLayout() {
  const location = useLocation();
  const navigate = useNavigate();

  // ── Cálculo de alertas para badges ──────────────────────
  const hoy = new Date();
  const chequesDB = useLiveQuery(() => db.cheques.toArray()) || [];
  const vencenHoy = chequesDB.filter(c => isSameDay(new Date(c.fechaCobro), hoy)).length;
  const rechazados = chequesDB.filter(c => c.estado === 'rechazado').length;
  const totalAlertas = vencenHoy + rechazados;

  const { recordatorios } = useRecordatorios();
  const notificacionesPendientes = recordatorios.filter(r => r.estado === 'pendiente').length;

  const [isDrawerOpen, setIsDrawerOpen] = useState(false);

  const navItems = [
    { path: '/',            icon: Home,       label: 'Dashboard',   badge: totalAlertas },
    { path: '/clientes',    icon: Users,      label: 'Clientes',    badge: 0 },
    { path: '/cheques',     icon: FileText,   label: 'Cheques',     badge: 0 },
    { path: '/calendario',  icon: Calendar,   label: 'Agenda',      badge: vencenHoy },
    { path: '/reportes',    icon: Table,      label: 'Reportes',    badge: 0 },
    { path: '/calculadora', icon: Calculator, label: 'Calculadora', badge: 0 },
  ];

  const handleLogout = async () => {
    await supabase.auth.signOut();
  };

  return (
    <div className="min-h-screen bg-premium-dark flex flex-col">
      {/* Ticker de Cotizaciones Global */}
      <CotizacionesBar />

      <div className="flex-1 flex flex-col md:flex-row overflow-hidden">
        {/* Sidebar (Desktop) */}
        <aside className="hidden md:flex flex-col w-64 bg-premium-card border-r border-premium-muted/20">
          <div className="p-6">
            <h1 className="text-xl font-bold text-premium-accent">Gestión Cheques</h1>
          </div>
          <nav className="flex-1 px-4 space-y-1">
            {navItems.map((item) => {
              const isActive = location.pathname === item.path;
              const Icon = item.icon;
              return (
                <Link
                  key={item.path}
                  to={item.path}
                  className={`relative flex items-center space-x-3 px-4 py-3 rounded-lg transition-colors ${
                    isActive
                      ? 'bg-premium-accent/10 text-premium-accent'
                      : 'text-premium-muted hover:bg-premium-dark hover:text-premium-text'
                  }`}
                >
                  <Icon size={20} />
                  <span className="font-medium">{item.label}</span>
                  {item.badge > 0 && (
                    <span className="absolute right-3 top-1/2 -translate-y-1/2 bg-premium-danger text-white text-xs font-bold w-6 h-6 rounded-full flex items-center justify-center animate-pulse">
                      {item.badge > 9 ? '9+' : item.badge}
                    </span>
                  )}
                </Link>
              );
            })}
          </nav>
          <div className="p-4">
            <button
              onClick={handleLogout}
              className="flex items-center space-x-3 px-4 py-3 w-full rounded-lg text-premium-danger hover:bg-premium-danger/10 transition-colors"
            >
              <LogOut size={20} />
              <span className="font-medium">Salir</span>
            </button>
          </div>
        </aside>

        {/* Main Content */}
        <main className="flex-1 pb-20 md:pb-0 h-screen overflow-y-auto">
          <div className="p-4 md:p-8">
            <Outlet />
          </div>
        </main>

        {/* Bottom Bar (Mobile) */}
        <nav className="md:hidden fixed bottom-0 left-0 right-0 bg-premium-card border-t border-premium-muted/20 flex justify-around items-center h-20 px-2 z-50 pb-2">
          {navItems.map((item) => {
            const isActive = location.pathname === item.path;
            const Icon = item.icon;
            return (
              <Link
                key={item.path}
                to={item.path}
                className={`relative flex flex-col items-center justify-center w-full h-full space-y-1.5 ${
                  isActive ? 'text-premium-accent' : 'text-premium-muted'
                }`}
              >
                <div className="relative">
                  <Icon size={26} />
                  {item.badge > 0 && (
                    <span className="absolute -top-2 -right-2 bg-premium-danger text-white text-[11px] font-bold w-5 h-5 rounded-full flex items-center justify-center">
                      {item.badge > 9 ? '9+' : item.badge}
                    </span>
                  )}
                </div>
                <span className="text-xs font-medium">{item.label}</span>
              </Link>
            );
          })}
        </nav>
      </div>

      {/* Botón flotante de Ayuda/Tutorial */}
      <button
        onClick={() => navigate('/tutorial')}
        className="fixed z-40 bottom-40 md:bottom-[96px] right-4 md:right-8 w-14 h-14 bg-premium-card border border-premium-muted/20 hover:bg-premium-muted/10 text-premium-text rounded-full flex items-center justify-center shadow-lg transition-all hover:scale-110 active:scale-95"
        title="Tutorial / Ayuda"
      >
        <HelpCircle size={24} />
      </button>

      {/* Botón flotante de Notificaciones */}
      <button
        onClick={() => setIsDrawerOpen(true)}
        className="fixed z-40 bottom-24 md:bottom-8 right-4 md:right-8 w-14 h-14 bg-premium-accent hover:bg-blue-600 text-white rounded-full flex items-center justify-center shadow-lg shadow-premium-accent/30 transition-all hover:scale-110 active:scale-95"
        title="Notificaciones"
      >
        <Bell size={24} />
        {notificacionesPendientes > 0 && (
          <span className="absolute top-0 right-0 w-4 h-4 bg-premium-danger border-2 border-premium-accent rounded-full animate-pulse" />
        )}
      </button>

      <NotificationDrawer 
        isOpen={isDrawerOpen} 
        onClose={() => setIsDrawerOpen(false)} 
      />
    </div>
  );
}
