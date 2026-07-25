import { DollarSign, AlertCircle, Clock, TrendingUp, Zap, ArrowRight, PhoneCall } from 'lucide-react';
import { Link, useNavigate } from 'react-router-dom';
import { isSameDay, format } from 'date-fns';
import { es } from 'date-fns/locale';

import { useLiveQuery } from 'dexie-react-hooks';
import { db } from '../db/db';

export default function Dashboard() {
  const navigate = useNavigate();
  const hoy = new Date();

  const chequesDB = useLiveQuery(() => db.cheques.toArray()) || [];
  const clientesDB = useLiveQuery(() => db.clientes.toArray()) || [];

  // KPIs calculados desde los datos reales
  const capitalEnCartera = chequesDB
    .filter(c => c.estado === 'en_cartera' || c.estado === 'depositado')
    .reduce((acc, c) => acc + c.monto, 0);

  const chequesVencenHoy = chequesDB.filter(c => isSameDay(new Date(c.fechaCobro), hoy));
  const chequesRechazados = chequesDB.filter(c => c.estado === 'rechazado');

  const clientesAlLimite = clientesDB.map(cl => {
    const deuda = chequesDB
      .filter(ch => ch.clienteId === cl.id && (ch.estado === 'en_cartera' || ch.estado === 'depositado' || ch.estado === 'rechazado'))
      .reduce((acc, ch) => acc + ch.monto, 0);
    return { ...cl, deuda };
  }).filter(c => (c.deuda / c.limite) >= 0.85);


  return (
    <div className="space-y-8 animate-in fade-in duration-500">
      <header className="flex justify-between items-start">
        <div>
          <h1 className="text-3xl font-bold text-premium-text">Resumen de Hoy</h1>
          <p className="text-premium-muted mt-1 capitalize">{format(hoy, "EEEE d 'de' MMMM", { locale: es })}</p>
        </div>
      </header>

      {/* CSS global para ocultar la barra de scroll en el carrusel */}
      <style dangerouslySetInnerHTML={{__html: `
        .hide-scrollbar::-webkit-scrollbar { display: none; }
        .hide-scrollbar { -ms-overflow-style: none; scrollbar-width: none; }
      `}} />

      {/* ── ALERTAS INTELIGENTES ─────────────────────────────── */}
      {(chequesVencenHoy.length > 0 || chequesRechazados.length > 0 || clientesAlLimite.length > 0) && (
        <section className="space-y-4">
          <h2 className="text-base font-semibold text-premium-muted uppercase tracking-wider flex items-center space-x-2 mb-2">
            <Zap size={20} className="text-yellow-400" />
            <span>Atención Requerida Hoy</span>
          </h2>

          <div className="flex overflow-x-auto snap-x snap-mandatory gap-4 pb-4 -mx-4 px-4 md:mx-0 md:px-0 hide-scrollbar scroll-smooth">
            {/* Cheques que vencen hoy */}
            {chequesVencenHoy.map(ch => (
              <div key={`vence-${ch.id}`} className="snap-center shrink-0 w-[85vw] md:w-[400px] bg-premium-card border border-premium-warning/40 rounded-xl px-5 py-4 flex flex-col justify-between gap-4 h-full">
                <div className="flex items-start space-x-3">
                  <div className="p-2 bg-premium-warning/10 rounded-lg shrink-0">
                    <Clock size={18} className="text-premium-warning" />
                  </div>
                  <div>
                    <p className="font-semibold text-premium-text text-base leading-tight mb-1">
                      Cheque vence hoy <br/><span className="text-premium-warning">{ch.cliente}</span>
                    </p>
                    <p className="text-sm text-premium-muted">Banco {ch.banco} · ${ch.monto.toLocaleString('es-AR')}</p>
                  </div>
                </div>
                <div className="flex gap-2 w-full mt-auto">
                  <a href={`https://wa.me/54`} target="_blank" rel="noreferrer"
                    className="flex-1 flex items-center justify-center space-x-2 bg-green-600/10 text-green-500 hover:bg-green-600/20 text-sm font-semibold px-2 py-3 min-h-[44px] rounded-lg transition-colors">
                    <PhoneCall size={16} />
                    <span>WhatsApp</span>
                  </a>
                  <Link to="/calendario"
                    className="flex-1 flex items-center justify-center space-x-2 bg-premium-warning/10 text-premium-warning hover:bg-premium-warning/20 text-sm font-semibold px-2 py-3 min-h-[44px] rounded-lg transition-colors">
                    <span>Agenda</span>
                    <ArrowRight size={16} />
                  </Link>
                </div>
              </div>
            ))}

            {/* Cheques rechazados */}
            {chequesRechazados.map(ch => (
                <div key={`rechazado-${ch.id}`} className="snap-center shrink-0 w-[85vw] md:w-[400px] bg-premium-card border border-premium-danger/40 rounded-xl px-5 py-4 flex flex-col justify-between gap-4 h-full">
                  <div className="flex items-start space-x-3">
                    <div className="p-2 bg-premium-danger/10 rounded-lg shrink-0">
                      <AlertCircle size={18} className="text-premium-danger" />
                    </div>
                    <div>
                      <p className="font-semibold text-premium-text text-base leading-tight mb-1">
                        Cheque rechazado <br/><span className="text-premium-danger">{ch.cliente}</span>
                      </p>
                      <p className="text-sm text-premium-muted">Banco {ch.banco} · ${ch.monto.toLocaleString('es-AR')}</p>
                    </div>
                  </div>
                  <a href={`https://wa.me/54`} target="_blank" rel="noreferrer"
                  className="w-full mt-auto flex items-center justify-center space-x-2 bg-green-600/10 text-green-500 hover:bg-green-600/20 text-sm font-semibold px-4 py-3 min-h-[44px] rounded-lg transition-colors">
                  <PhoneCall size={16} />
                  <span>Contactar urgente</span>
                </a>
              </div>
            ))}

            {/* Clientes al límite */}
            {clientesAlLimite.map(cl => {
              const pct = Math.round((cl.deuda / cl.limite) * 100);
              return (
                <div key={`limite-${cl.id}`} className="snap-center shrink-0 w-[85vw] md:w-[400px] bg-premium-card border border-premium-danger/30 rounded-xl px-5 py-4 flex flex-col justify-between gap-4 h-full">
                  <div className="flex items-start space-x-3">
                    <div className="p-2 bg-premium-danger/10 rounded-lg shrink-0">
                      <TrendingUp size={18} className="text-premium-danger" />
                    </div>
                    <div>
                      <p className="font-semibold text-premium-text text-base leading-tight mb-1">
                        Límite al {pct}% <br/><span className="text-premium-danger">{cl.nombre}</span>
                      </p>
                      <p className="text-sm text-premium-muted">Deuda ${cl.deuda.toLocaleString('es-AR')} de ${cl.limite.toLocaleString('es-AR')}</p>
                    </div>
                  </div>
                  <Link to="/clientes"
                    className="w-full mt-auto flex items-center justify-center space-x-2 bg-premium-card border border-premium-muted/20 text-premium-text hover:bg-premium-dark text-sm font-semibold px-4 py-3 min-h-[44px] rounded-lg transition-colors">
                    <span>Ver ficha del cliente</span>
                    <ArrowRight size={16} />
                  </Link>
                </div>
              );
            })}
          </div>
        </section>
      )}

      {/* ── KPIs ─────────────────────────────────────────────── */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-premium-card p-6 rounded-2xl border border-premium-muted/20 hover:border-premium-accent/50 transition-colors">
          <div className="flex items-center space-x-4">
            <div className="p-3 bg-premium-accent/10 rounded-xl">
              <DollarSign className="text-premium-accent" size={24} />
            </div>
            <div>
              <p className="text-base font-medium text-premium-muted">Capital en Cartera</p>
              <h3 className="text-2xl font-bold text-premium-text">${capitalEnCartera.toLocaleString('es-AR')}</h3>
            </div>
          </div>
        </div>


        <Link to="/calendario" className="bg-premium-card p-6 rounded-2xl border border-premium-muted/20 hover:border-premium-warning/50 transition-colors">
          <div className="flex items-center space-x-4">
            <div className={`p-3 rounded-xl ${chequesVencenHoy.length > 0 ? 'bg-premium-warning/20' : 'bg-premium-warning/10'}`}>
              <Clock className="text-premium-warning" size={24} />
            </div>
            <div>
              <p className="text-base font-medium text-premium-muted">Vencen Hoy</p>
              <h3 className={`text-2xl font-bold ${chequesVencenHoy.length > 0 ? 'text-premium-warning' : 'text-premium-text'}`}>
                {chequesVencenHoy.length} {chequesVencenHoy.length === 1 ? 'cheque' : 'cheques'}
              </h3>
            </div>
          </div>
        </Link>

        <Link to="/clientes" className="bg-premium-card p-6 rounded-2xl border border-premium-muted/20 hover:border-premium-danger/50 transition-colors">
          <div className="flex items-center space-x-4">
            <div className={`p-3 rounded-xl ${chequesRechazados.length > 0 ? 'bg-premium-danger/20' : 'bg-premium-danger/10'}`}>
              <AlertCircle className="text-premium-danger" size={24} />
            </div>
            <div>
              <p className="text-base font-medium text-premium-muted">A Gestionar (Rechazos)</p>
              <h3 className={`text-2xl font-bold ${chequesRechazados.length > 0 ? 'text-premium-danger' : 'text-premium-text'}`}>
                {chequesRechazados.length} {chequesRechazados.length === 1 ? 'cheque' : 'cheques'}
              </h3>
            </div>
          </div>
        </Link>
      </div>

      {/* ── ACCIONES RÁPIDAS ─────────────────────────────────── */}
      <div className="flex flex-col sm:flex-row gap-4">
        <button onClick={() => navigate('/cheques')}
          className="flex-1 bg-premium-accent hover:bg-blue-600 text-white font-semibold py-4 px-6 rounded-2xl transition-all shadow-lg shadow-premium-accent/20 flex items-center justify-center space-x-2">
          <span className="text-xl">+</span>
          <span>Cargar Nuevo Cheque</span>
        </button>
        <button onClick={() => navigate('/calculadora', { state: { tab: 'simulador' } })}
          className="flex-1 bg-premium-card hover:bg-premium-muted/10 border border-premium-muted/20 text-premium-text font-semibold py-4 px-6 rounded-2xl transition-all flex items-center justify-center space-x-2">
          <Zap size={20} className="text-premium-accent" />
          <span>Simular Operación</span>
        </button>
        <Link to="/clientes"
          className="flex-1 bg-premium-card hover:bg-premium-muted/10 border border-premium-muted/20 text-premium-text font-semibold py-4 px-6 rounded-2xl transition-all flex items-center justify-center space-x-2">
          <span className="text-xl">+</span>
          <span>Nuevo Cliente</span>
        </Link>
      </div>
    </div>
  );
}
