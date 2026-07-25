import { useState, useEffect } from 'react';
import { Target, Mic, Plus, ArrowUpRight, ArrowDownRight, Activity, X } from 'lucide-react';
import { useLiveQuery } from 'dexie-react-hooks';
import { db } from '../db/db';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';
import { useVoiceAssistant } from '../hooks/useVoiceAssistant';

export default function Metas() {
  const mesActual = format(new Date(), 'yyyy-MM');
  
  // Datos Reales
  const movimientos = useLiveQuery(() => db.movimientos.orderBy('fecha').reverse().toArray()) || [];
  const metas = useLiveQuery(() => db.metas.where('mes').equals(mesActual).toArray()) || [];
  
  const metaMes = metas.length > 0 ? metas[0] : null;
  
  // IA Asistente
  const { isListening, transcript, error: voiceError, startListening, result, supported } = useVoiceAssistant();

  // Estados de UI
  const [showManualForm, setShowManualForm] = useState(false);
  const [formMonto, setFormMonto] = useState('');
  const [formConcepto, setFormConcepto] = useState('');
  const [formTipo, setFormTipo] = useState<'ingreso' | 'gasto'>('gasto');
  const [showMetaForm, setShowMetaForm] = useState(false);
  const [nuevaMeta, setNuevaMeta] = useState('');

  // Auto-guardado de resultados del asistente
  useEffect(() => {
    if (result) {
      if (result.tipo === 'meta') {
        guardarMeta(result.monto);
      } else {
        guardarMovimiento(result.tipo, result.monto, result.concepto, 'ai');
      }
    }
  }, [result]);

  const guardarMeta = async (monto: number) => {
    if (metaMes) {
      await db.metas.update(metaMes.id!, { metaIngresos: monto });
    } else {
      await db.metas.add({ mes: mesActual, metaIngresos: monto });
    }
    setShowMetaForm(false);
  };

  const guardarMovimiento = async (tipo: 'ingreso' | 'gasto', monto: number, concepto: string, metodo: 'manual' | 'ai') => {
    await db.movimientos.add({
      tipo,
      monto,
      concepto,
      fecha: new Date().toISOString(),
      metodo
    });
  };

  const handleManualSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formMonto || !formConcepto) return;
    guardarMovimiento(formTipo, Number(formMonto), formConcepto, 'manual');
    setShowManualForm(false);
    setFormMonto('');
    setFormConcepto('');
  };

  // Cálculos del Mes
  const movimientosMes = movimientos.filter(m => m.fecha.startsWith(mesActual));
  const totalIngresos = movimientosMes.filter(m => m.tipo === 'ingreso').reduce((acc, m) => acc + m.monto, 0);
  const totalGastos = movimientosMes.filter(m => m.tipo === 'gasto').reduce((acc, m) => acc + m.monto, 0);
  const neto = totalIngresos - totalGastos;
  
  const porcentajeMeta = metaMes ? Math.min((neto / metaMes.metaIngresos) * 100, 100) : 0;

  return (
    <div className="space-y-6 max-w-4xl mx-auto pb-24 animate-in fade-in duration-500 relative">
      <header className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold text-premium-text">Metas y Gastos</h1>
          <p className="text-premium-muted mt-1 capitalize">{format(new Date(), "MMMM yyyy", { locale: es })}</p>
        </div>
        <button 
          onClick={() => setShowMetaForm(true)}
          className="bg-premium-card border border-premium-muted/20 hover:border-premium-accent/50 text-premium-text px-4 py-2 rounded-xl transition-all font-semibold"
        >
          {metaMes ? 'Ajustar Meta' : 'Fijar Meta del Mes'}
        </button>
      </header>

      {/* Progreso de la Meta */}
      {metaMes && (
        <div className="bg-premium-card p-6 rounded-2xl border border-premium-accent/30 shadow-lg relative overflow-hidden">
          <div className="absolute top-0 right-0 p-4 opacity-5">
            <Target size={120} />
          </div>
          <h2 className="text-lg font-semibold text-premium-muted mb-4 flex items-center space-x-2">
            <Target size={20} className="text-premium-accent" />
            <span>Objetivo de Ganancia Neta</span>
          </h2>
          
          <div className="flex justify-between items-end mb-2">
            <div>
              <p className="text-3xl font-bold text-premium-text">${neto.toLocaleString('es-AR')}</p>
              <p className="text-sm text-premium-muted">Progreso actual</p>
            </div>
            <div className="text-right">
              <p className="text-xl font-semibold text-premium-muted">${metaMes.metaIngresos.toLocaleString('es-AR')}</p>
              <p className="text-sm text-premium-muted">Meta</p>
            </div>
          </div>
          
          <div className="w-full bg-premium-dark rounded-full h-4 overflow-hidden border border-premium-muted/20">
            <div 
              className="bg-gradient-to-r from-premium-accent to-blue-400 h-full rounded-full transition-all duration-1000 ease-out"
              style={{ width: `${Math.max(porcentajeMeta, 0)}%` }}
            />
          </div>
          <p className="text-right text-xs font-bold text-premium-accent mt-2">{porcentajeMeta.toFixed(1)}% completado</p>
        </div>
      )}

      {/* Resumen Rápidos */}
      <div className="grid grid-cols-2 gap-4">
        <div className="bg-premium-card p-5 rounded-2xl border border-green-500/20">
          <p className="text-sm text-premium-muted mb-1 flex items-center"><ArrowUpRight size={16} className="mr-1 text-green-500" /> Ingresos</p>
          <p className="text-xl font-bold text-green-500">${totalIngresos.toLocaleString('es-AR')}</p>
        </div>
        <div className="bg-premium-card p-5 rounded-2xl border border-red-500/20">
          <p className="text-sm text-premium-muted mb-1 flex items-center"><ArrowDownRight size={16} className="mr-1 text-red-400" /> Gastos</p>
          <p className="text-xl font-bold text-red-400">${totalGastos.toLocaleString('es-AR')}</p>
        </div>
      </div>

      {/* Botones de Acción (IA vs Manual) */}
      <div className="flex flex-col gap-4 mt-4">
        <div className="flex flex-col sm:flex-row gap-4">
          <button
            onClick={startListening}
            disabled={!supported || isListening}
            className={`flex-1 flex flex-col items-center justify-center p-6 rounded-2xl transition-all shadow-lg border ${
              isListening 
                ? 'bg-blue-600 border-blue-400 animate-pulse text-white' 
                : 'bg-gradient-to-br from-premium-accent to-blue-600 border-premium-accent/30 text-white hover:opacity-90 active:scale-95'
            }`}
          >
            <div className={`p-4 rounded-full mb-3 ${isListening ? 'bg-white/20' : 'bg-white/10'}`}>
              <Mic size={32} className={isListening ? 'animate-bounce' : ''} />
            </div>
            <span className="font-bold text-lg">{isListening ? 'Escuchando...' : 'Asistente de Voz'}</span>
            <span className="text-xs opacity-80 mt-1">"Gasté 5.000 en supermercado"</span>
          </button>

          <button
            onClick={() => setShowManualForm(true)}
            className="flex-1 flex flex-col items-center justify-center p-6 rounded-2xl bg-premium-card border border-premium-muted/20 hover:border-premium-muted/50 text-premium-text transition-all active:scale-95"
          >
            <div className="p-4 rounded-full mb-3 bg-premium-muted/10">
              <Plus size={32} />
            </div>
            <span className="font-bold text-lg">Carga Manual</span>
            <span className="text-xs text-premium-muted mt-1">Escribir los datos a mano</span>
          </button>
        </div>
        
        {/* Recomendación de uso del Asistente */}
        <div className="bg-premium-dark/50 p-4 rounded-xl border border-premium-muted/10 text-sm text-premium-muted flex items-start gap-3">
          <div className="mt-0.5 text-premium-accent">💡</div>
          <p>
            <strong className="text-premium-text">Tip para el Asistente de Voz:</strong> Recomendamos decir categorías amplias en vez de detalles específicos. 
            Por ejemplo, en lugar de decir <em>"Gasté 5000 en ñoquis y salsa"</em>, es mejor decir <em>"Gasté 5000 en comida"</em> o <em>"restaurante"</em>. 
            El asistente entiende decenas de verbos como: <span className="italic">cobré, gané, me depositaron, vendí, gasté, perdí, me debitaron, etc.</span>
          </p>
        </div>
      </div>

      {/* Feedback de voz */}
      {transcript && (
        <div className="bg-premium-dark p-4 rounded-xl border border-premium-muted/20 text-center animate-in slide-in-from-top-2">
          <p className="text-premium-muted text-sm mb-1">Entendí:</p>
          <p className="text-premium-text font-medium text-lg italic">"{transcript}"</p>
        </div>
      )}
      {voiceError && (
        <div className="bg-red-500/10 p-4 rounded-xl border border-red-500/30 text-red-400 text-center animate-in slide-in-from-top-2">
          {voiceError}
        </div>
      )}

      {/* Historial de Movimientos */}
      <div className="mt-8">
        <h3 className="text-lg font-bold text-premium-text mb-4 flex items-center space-x-2">
          <Activity size={20} className="text-premium-accent" />
          <span>Últimos Movimientos</span>
        </h3>
        
        <div className="space-y-3">
          {movimientos.length === 0 ? (
             <div className="text-center p-8 bg-premium-card rounded-xl border border-premium-muted/20">
               <p className="text-premium-muted">No hay movimientos registrados.</p>
               <p className="text-sm mt-2 text-premium-muted/70">Usá el micrófono para cargar tu primer gasto.</p>
             </div>
          ) : (
            movimientos.map(m => (
              <div key={m.id} className="flex justify-between items-center p-4 bg-premium-card rounded-xl border border-premium-muted/20">
                <div className="flex items-center space-x-3">
                  <div className={`p-2 rounded-full ${m.tipo === 'ingreso' ? 'bg-green-500/10 text-green-500' : 'bg-red-500/10 text-red-400'}`}>
                    {m.tipo === 'ingreso' ? <ArrowUpRight size={20} /> : <ArrowDownRight size={20} />}
                  </div>
                  <div>
                    <p className="font-semibold text-premium-text capitalize">{m.concepto}</p>
                    <p className="text-xs text-premium-muted">{format(new Date(m.fecha), 'dd/MM/yyyy HH:mm')} · Carga {m.metodo === 'ai' ? 'Automática (Voz)' : 'Manual'}</p>
                  </div>
                </div>
                <p className={`font-bold ${m.tipo === 'ingreso' ? 'text-green-500' : 'text-red-400'}`}>
                  {m.tipo === 'ingreso' ? '+' : '-'}${m.monto.toLocaleString('es-AR')}
                </p>
              </div>
            ))
          )}
        </div>
      </div>

      {/* Formularios Modales */}
      {showManualForm && (
        <div className="fixed inset-0 z-50 bg-black/60 flex items-center justify-center p-4 backdrop-blur-sm animate-in fade-in">
          <div className="bg-premium-card w-full max-w-md rounded-2xl p-6 border border-premium-muted/20">
            <div className="flex justify-between items-center mb-5">
              <h3 className="text-xl font-bold text-premium-text">Carga Manual</h3>
              <button onClick={() => setShowManualForm(false)} className="text-premium-muted hover:text-white"><X size={20} /></button>
            </div>
            <form onSubmit={handleManualSubmit} className="space-y-4">
              <div className="flex gap-2 p-1 bg-premium-dark rounded-xl">
                <button type="button" onClick={() => setFormTipo('gasto')} className={`flex-1 py-2 rounded-lg font-semibold text-sm transition-all ${formTipo === 'gasto' ? 'bg-red-500 text-white' : 'text-premium-muted'}`}>Gasto</button>
                <button type="button" onClick={() => setFormTipo('ingreso')} className={`flex-1 py-2 rounded-lg font-semibold text-sm transition-all ${formTipo === 'ingreso' ? 'bg-green-500 text-white' : 'text-premium-muted'}`}>Ingreso</button>
              </div>
              <div>
                <label className="block text-sm text-premium-muted mb-1">Monto ($)</label>
                <input type="number" required value={formMonto} onChange={e => setFormMonto(e.target.value)} className="w-full bg-premium-dark border border-premium-muted/30 rounded-lg p-3 text-white outline-none focus:border-premium-accent" placeholder="Ej: 5000" />
              </div>
              <div>
                <label className="block text-sm text-premium-muted mb-1">Concepto / Detalle</label>
                <input type="text" required value={formConcepto} onChange={e => setFormConcepto(e.target.value)} className="w-full bg-premium-dark border border-premium-muted/30 rounded-lg p-3 text-white outline-none focus:border-premium-accent" placeholder="Ej: Nafta V-Power" />
              </div>
              <button type="submit" className="w-full bg-premium-accent hover:bg-blue-600 text-white font-bold py-4 rounded-xl mt-2">Guardar Movimiento</button>
            </form>
          </div>
        </div>
      )}

      {showMetaForm && (
        <div className="fixed inset-0 z-50 bg-black/60 flex items-center justify-center p-4 backdrop-blur-sm animate-in fade-in">
          <div className="bg-premium-card w-full max-w-md rounded-2xl p-6 border border-premium-muted/20">
            <div className="flex justify-between items-center mb-5">
              <h3 className="text-xl font-bold text-premium-text flex items-center space-x-2"><Target size={20} className="text-premium-accent"/><span>Fijar Meta de {format(new Date(), 'MMMM', {locale: es})}</span></h3>
              <button onClick={() => setShowMetaForm(false)} className="text-premium-muted hover:text-white"><X size={20} /></button>
            </div>
            <p className="text-sm text-premium-muted mb-4">¿Cuánto dinero querés generar como ganancia neta este mes?</p>
            <form onSubmit={(e) => { e.preventDefault(); guardarMeta(Number(nuevaMeta)); }} className="space-y-4">
              <div>
                <label className="block text-sm text-premium-muted mb-1">Objetivo mensual ($)</label>
                <input type="number" required value={nuevaMeta} onChange={e => setNuevaMeta(e.target.value)} className="w-full bg-premium-dark border border-premium-muted/30 rounded-lg p-3 text-white outline-none focus:border-premium-accent" placeholder="Ej: 2000000" />
              </div>
              <button type="submit" className="w-full bg-premium-accent hover:bg-blue-600 text-white font-bold py-4 rounded-xl">Fijar Meta</button>
            </form>
          </div>
        </div>
      )}

    </div>
  );
}
