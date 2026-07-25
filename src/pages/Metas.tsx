import { useState, useEffect } from 'react';
import { Target, Mic, Plus, ArrowUpRight, ArrowDownRight, Activity, X, Trash2, TrendingUp } from 'lucide-react';
import { useLiveQuery } from 'dexie-react-hooks';
import { db } from '../db/db';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';
import { useVoiceAssistant } from '../hooks/useVoiceAssistant';
import { detectarCategoria, getColorCategoria, CATEGORIAS } from '../utils/categorizer';
import {
  PieChart, Pie, Cell, Tooltip, ResponsiveContainer,
  AreaChart, Area, XAxis, YAxis, CartesianGrid, Legend,
} from 'recharts';

export default function Metas() {
  const mesActual = format(new Date(), 'yyyy-MM');

  const movimientos = useLiveQuery(() => db.movimientos.orderBy('fecha').reverse().toArray()) || [];
  const metas = useLiveQuery(() => db.metas.where('mes').equals(mesActual).toArray()) || [];
  const metaMes = metas.length > 0 ? metas[0] : null;

  const { isListening, transcript, error: voiceError, startListening, result, supported } = useVoiceAssistant();

  const [showManualForm, setShowManualForm] = useState(false);
  const [formMonto, setFormMonto] = useState('');
  const [formConcepto, setFormConcepto] = useState('');
  const [formTipo, setFormTipo] = useState<'ingreso' | 'gasto'>('gasto');
  const [showMetaForm, setShowMetaForm] = useState(false);
  const [nuevaMeta, setNuevaMeta] = useState('');

  useEffect(() => {
    if (result) {
      if (result.tipo === 'meta') {
        guardarMeta(result.monto);
      } else {
        const cat = detectarCategoria(result.concepto + ' ' + transcript);
        guardarMovimiento(result.tipo, result.monto, result.concepto, cat, 'ai');
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

  const guardarMovimiento = async (
    tipo: 'ingreso' | 'gasto',
    monto: number,
    concepto: string,
    categoria: string,
    metodo: 'manual' | 'ai'
  ) => {
    await db.movimientos.add({ tipo, monto, concepto, categoria, fecha: new Date().toISOString(), metodo });
  };

  const eliminarMovimiento = async (id: number) => {
    await db.movimientos.delete(id);
  };

  const handleManualSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formMonto || !formConcepto) return;
    const cat = detectarCategoria(formConcepto);
    guardarMovimiento(formTipo, Number(formMonto), formConcepto, cat, 'manual');
    setShowManualForm(false);
    setFormMonto('');
    setFormConcepto('');
  };

  // ─── Cálculos del mes ──────────────────────────────────────
  const movimientosMes = movimientos.filter(m => m.fecha.startsWith(mesActual));
  const totalIngresos = movimientosMes.filter(m => m.tipo === 'ingreso').reduce((acc, m) => acc + m.monto, 0);
  const totalGastos = movimientosMes.filter(m => m.tipo === 'gasto').reduce((acc, m) => acc + m.monto, 0);
  const neto = totalIngresos - totalGastos;
  const porcentajeMeta = metaMes ? Math.min((neto / metaMes.metaIngresos) * 100, 100) : 0;

  // ─── Datos para Pie Chart (gastos por categoría) ──────────
  const gastosMes = movimientosMes.filter(m => m.tipo === 'gasto');
  const pieData = CATEGORIAS
    .map(cat => ({
      name: cat.label,
      value: gastosMes.filter(m => (m.categoria || 'Otros') === cat.label).reduce((a, m) => a + m.monto, 0),
      color: cat.color,
    }))
    .filter(d => d.value > 0);

  // ─── Datos para Area Chart (ingresos vs gastos por día) ───
  const areaData: Record<string, { fecha: string; ingresos: number; gastos: number }> = {};
  movimientosMes.forEach(m => {
    const dia = format(new Date(m.fecha), 'dd/MM');
    if (!areaData[dia]) areaData[dia] = { fecha: dia, ingresos: 0, gastos: 0 };
    if (m.tipo === 'ingreso') areaData[dia].ingresos += m.monto;
    else areaData[dia].gastos += m.monto;
  });
  const areaChartData = Object.values(areaData).reverse();

  const CustomTooltip = ({ active, payload }: any) => {
    if (active && payload?.length) {
      return (
        <div className="bg-premium-card border border-premium-muted/20 rounded-xl p-3 text-sm shadow-xl">
          <p className="font-bold text-premium-text">{payload[0].name}</p>
          <p className="text-premium-muted">${payload[0].value?.toLocaleString('es-AR')}</p>
        </div>
      );
    }
    return null;
  };

  return (
    <div className="space-y-6 max-w-4xl mx-auto pb-24 animate-in fade-in duration-500">
      {/* Header */}
      <header className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold text-premium-text">Metas y Gastos</h1>
          <p className="text-premium-muted mt-1 capitalize">{format(new Date(), "MMMM yyyy", { locale: es })}</p>
        </div>
        <button onClick={() => setShowMetaForm(true)} className="bg-premium-card border border-premium-muted/20 hover:border-premium-accent/50 text-premium-text px-4 py-2 rounded-xl transition-all font-semibold">
          {metaMes ? 'Ajustar Meta' : 'Fijar Meta del Mes'}
        </button>
      </header>

      {/* Barra de progreso de meta */}
      {metaMes && (
        <div className="bg-premium-card p-6 rounded-2xl border border-premium-accent/30 shadow-lg relative overflow-hidden">
          <div className="absolute top-0 right-0 p-4 opacity-5"><Target size={120} /></div>
          <h2 className="text-lg font-semibold text-premium-muted mb-4 flex items-center space-x-2">
            <Target size={20} className="text-premium-accent" /><span>Objetivo de Ganancia Neta</span>
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
            <div className="bg-gradient-to-r from-premium-accent to-blue-400 h-full rounded-full transition-all duration-1000 ease-out" style={{ width: `${Math.max(porcentajeMeta, 0)}%` }} />
          </div>
          <p className="text-right text-xs font-bold text-premium-accent mt-2">{porcentajeMeta.toFixed(1)}% completado</p>
        </div>
      )}

      {/* Resumen rápido */}
      <div className="grid grid-cols-3 gap-3">
        <div className="bg-premium-card p-4 rounded-2xl border border-green-500/20">
          <p className="text-xs text-premium-muted mb-1 flex items-center gap-1"><ArrowUpRight size={14} className="text-green-500" /> Ingresos</p>
          <p className="text-lg font-bold text-green-500">${totalIngresos.toLocaleString('es-AR')}</p>
        </div>
        <div className="bg-premium-card p-4 rounded-2xl border border-red-500/20">
          <p className="text-xs text-premium-muted mb-1 flex items-center gap-1"><ArrowDownRight size={14} className="text-red-400" /> Gastos</p>
          <p className="text-lg font-bold text-red-400">${totalGastos.toLocaleString('es-AR')}</p>
        </div>
        <div className={`bg-premium-card p-4 rounded-2xl border ${neto >= 0 ? 'border-blue-500/20' : 'border-red-500/30'}`}>
          <p className="text-xs text-premium-muted mb-1 flex items-center gap-1"><TrendingUp size={14} className="text-premium-accent" /> Neto</p>
          <p className={`text-lg font-bold ${neto >= 0 ? 'text-premium-accent' : 'text-red-400'}`}>${neto.toLocaleString('es-AR')}</p>
        </div>
      </div>

      {/* ── GRÁFICOS ────────────────────────────────────── */}
      {movimientosMes.length > 0 && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">

          {/* PIE CHART - Gastos por Categoría */}
          {pieData.length > 0 && (
            <div className="bg-premium-card p-6 rounded-2xl border border-premium-muted/20">
              <h3 className="text-base font-bold text-premium-text mb-4">Gastos por Categoría</h3>
              <ResponsiveContainer width="100%" height={220}>
                <PieChart>
                  <Pie data={pieData} cx="50%" cy="50%" innerRadius={55} outerRadius={90} paddingAngle={3} dataKey="value">
                    {pieData.map((entry, i) => (
                      <Cell key={i} fill={entry.color} stroke="transparent" />
                    ))}
                  </Pie>
                  <Tooltip content={<CustomTooltip />} />
                </PieChart>
              </ResponsiveContainer>
              {/* Leyenda */}
              <div className="mt-3 space-y-1.5 max-h-36 overflow-y-auto">
                {pieData.map((d, i) => (
                  <div key={i} className="flex justify-between items-center text-sm">
                    <div className="flex items-center gap-2">
                      <div className="w-3 h-3 rounded-full flex-shrink-0" style={{ background: d.color }} />
                      <span className="text-premium-muted">{d.name}</span>
                    </div>
                    <span className="font-semibold text-premium-text">${d.value.toLocaleString('es-AR')}</span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* AREA CHART - Ingresos vs Gastos en el tiempo */}
          {areaChartData.length > 0 && (
            <div className="bg-premium-card p-6 rounded-2xl border border-premium-muted/20">
              <h3 className="text-base font-bold text-premium-text mb-4">Ingresos vs Gastos (este mes)</h3>
              <ResponsiveContainer width="100%" height={220}>
                <AreaChart data={areaChartData} margin={{ top: 5, right: 5, left: -20, bottom: 0 }}>
                  <defs>
                    <linearGradient id="ingresosGrad" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#22C55E" stopOpacity={0.3} />
                      <stop offset="95%" stopColor="#22C55E" stopOpacity={0} />
                    </linearGradient>
                    <linearGradient id="gastosGrad" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#EF4444" stopOpacity={0.3} />
                      <stop offset="95%" stopColor="#EF4444" stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="#ffffff08" />
                  <XAxis dataKey="fecha" tick={{ fontSize: 10, fill: '#6B7280' }} />
                  <YAxis tick={{ fontSize: 10, fill: '#6B7280' }} tickFormatter={v => `$${(v/1000).toFixed(0)}k`} />
                  <Tooltip
                    contentStyle={{ background: '#1e2130', border: '1px solid #ffffff15', borderRadius: '12px', fontSize: 12 }}
                    formatter={(v: any) => [`$${Number(v).toLocaleString('es-AR')}`, '']}
                  />
                  <Legend iconType="circle" wrapperStyle={{ fontSize: 12 }} />
                  <Area type="monotone" dataKey="ingresos" name="Ingresos" stroke="#22C55E" fill="url(#ingresosGrad)" strokeWidth={2} />
                  <Area type="monotone" dataKey="gastos" name="Gastos" stroke="#EF4444" fill="url(#gastosGrad)" strokeWidth={2} />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          )}
        </div>
      )}

      {/* Botones Asistente + Manual */}
      <div className="flex flex-col gap-4 mt-2">
        <div className="flex flex-col sm:flex-row gap-4">
          <button
            onClick={startListening}
            disabled={!supported || isListening}
            className={`flex-1 flex flex-col items-center justify-center p-6 rounded-2xl transition-all shadow-lg border ${isListening ? 'bg-blue-600 border-blue-400 animate-pulse text-white' : 'bg-gradient-to-br from-premium-accent to-blue-600 border-premium-accent/30 text-white hover:opacity-90 active:scale-95'}`}
          >
            <div className={`p-4 rounded-full mb-3 ${isListening ? 'bg-white/20' : 'bg-white/10'}`}>
              <Mic size={32} className={isListening ? 'animate-bounce' : ''} />
            </div>
            <span className="font-bold text-lg">{isListening ? 'Escuchando...' : 'Asistente de Voz'}</span>
            <span className="text-xs opacity-80 mt-1">"Gasté 5.000 en supermercado"</span>
          </button>

          <button onClick={() => setShowManualForm(true)} className="flex-1 flex flex-col items-center justify-center p-6 rounded-2xl bg-premium-card border border-premium-muted/20 hover:border-premium-muted/50 text-premium-text transition-all active:scale-95">
            <div className="p-4 rounded-full mb-3 bg-premium-muted/10"><Plus size={32} /></div>
            <span className="font-bold text-lg">Carga Manual</span>
            <span className="text-xs text-premium-muted mt-1">Escribir los datos a mano</span>
          </button>
        </div>

        <div className="bg-premium-dark/50 p-4 rounded-xl border border-premium-muted/10 text-sm text-premium-muted flex items-start gap-3">
          <div className="mt-0.5 text-premium-accent">💡</div>
          <p>
            <strong className="text-premium-text">Tip:</strong> Decí categorías amplias para mejor análisis. Ej: <em>"Gasté 5000 en comida"</em>, <em>"Cobré 10k de alquiler"</em>, <em>"Le envié 3000 a mi hijo"</em>.
            Verbos reconocidos: cobré, gané, gasté, pagué, perdí, envié, mandé, me debitaron, vendí, me pagaron…
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

      {/* Lista de Movimientos */}
      <div>
        <h3 className="text-lg font-bold text-premium-text mb-4 flex items-center space-x-2">
          <Activity size={20} className="text-premium-accent" /><span>Movimientos del Mes</span>
        </h3>
        <div className="space-y-3">
          {movimientos.length === 0 ? (
            <div className="text-center p-8 bg-premium-card rounded-xl border border-premium-muted/20">
              <p className="text-premium-muted">No hay movimientos registrados.</p>
              <p className="text-sm mt-2 text-premium-muted/70">Usá el micrófono o el formulario para cargar el primero.</p>
            </div>
          ) : (
            movimientos.map(m => {
              const cat = m.categoria || detectarCategoria(m.concepto);
              const catColor = getColorCategoria(cat as any);
              return (
                <div key={m.id} className="flex justify-between items-center p-4 bg-premium-card rounded-xl border border-premium-muted/20 gap-3">
                  <div className="flex items-center space-x-3 min-w-0">
                    <div className={`p-2 rounded-full flex-shrink-0 ${m.tipo === 'ingreso' ? 'bg-green-500/10 text-green-500' : 'bg-red-500/10 text-red-400'}`}>
                      {m.tipo === 'ingreso' ? <ArrowUpRight size={20} /> : <ArrowDownRight size={20} />}
                    </div>
                    <div className="min-w-0">
                      <p className="font-semibold text-premium-text capitalize truncate">{m.concepto}</p>
                      <div className="flex items-center gap-2 mt-0.5 flex-wrap">
                        <span className="text-xs px-2 py-0.5 rounded-full font-medium" style={{ background: catColor + '20', color: catColor }}>{cat}</span>
                        <span className="text-xs text-premium-muted">{format(new Date(m.fecha), 'dd/MM HH:mm')} · {m.metodo === 'ai' ? '🎙️ Voz' : '✍️ Manual'}</span>
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center gap-3 flex-shrink-0">
                    <p className={`font-bold text-right ${m.tipo === 'ingreso' ? 'text-green-500' : 'text-red-400'}`}>
                      {m.tipo === 'ingreso' ? '+' : '-'}${m.monto.toLocaleString('es-AR')}
                    </p>
                    <button
                      onClick={() => m.id && eliminarMovimiento(m.id)}
                      className="text-premium-muted hover:text-red-400 transition-colors p-1.5 rounded-lg hover:bg-red-500/10"
                      title="Eliminar movimiento"
                    >
                      <Trash2 size={16} />
                    </button>
                  </div>
                </div>
              );
            })
          )}
        </div>
      </div>

      {/* Modal Manual */}
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
                <input type="text" required value={formConcepto} onChange={e => setFormConcepto(e.target.value)} className="w-full bg-premium-dark border border-premium-muted/30 rounded-lg p-3 text-white outline-none focus:border-premium-accent" placeholder="Ej: Supermercado" />
                {formConcepto && (
                  <p className="text-xs mt-1" style={{ color: getColorCategoria(detectarCategoria(formConcepto) as any) }}>
                    📂 Categoría detectada: <strong>{detectarCategoria(formConcepto)}</strong>
                  </p>
                )}
              </div>
              <button type="submit" className="w-full bg-premium-accent hover:bg-blue-600 text-white font-bold py-4 rounded-xl mt-2">Guardar Movimiento</button>
            </form>
          </div>
        </div>
      )}

      {/* Modal Meta */}
      {showMetaForm && (
        <div className="fixed inset-0 z-50 bg-black/60 flex items-center justify-center p-4 backdrop-blur-sm animate-in fade-in">
          <div className="bg-premium-card w-full max-w-md rounded-2xl p-6 border border-premium-muted/20">
            <div className="flex justify-between items-center mb-5">
              <h3 className="text-xl font-bold text-premium-text flex items-center space-x-2"><Target size={20} className="text-premium-accent" /><span>Fijar Meta de {format(new Date(), 'MMMM', { locale: es })}</span></h3>
              <button onClick={() => setShowMetaForm(false)} className="text-premium-muted hover:text-white"><X size={20} /></button>
            </div>
            <p className="text-sm text-premium-muted mb-4">¿Cuánto dinero querés generar como ganancia neta este mes?</p>
            <form onSubmit={e => { e.preventDefault(); guardarMeta(Number(nuevaMeta)); }} className="space-y-4">
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
