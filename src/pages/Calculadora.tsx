import { useState, useEffect, useCallback } from 'react';
import { ArrowLeftRight, RefreshCw, TrendingUp, Clock, Calculator, Send } from 'lucide-react';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';
import { useNavigate } from 'react-router-dom';
import { calcularOperacionCheque } from '../utils/finance';

// ─── Tipos ────────────────────────────────────────────────
interface Moneda {
  codigo: string;
  label: string;
  simbolo: string;
  flag: string;
  tasaEnARS: number;
}

const MONEDAS_DEFAULT: Omit<Moneda, 'tasaEnARS'>[] = [
  { codigo: 'ARS',      label: 'Peso Argentino',  simbolo: '$',   flag: '🇦🇷' },
  { codigo: 'USD_OF',   label: 'Dólar Oficial',   simbolo: 'U$D', flag: '🇺🇸' },
  { codigo: 'USD_BLUE', label: 'Dólar Blue',      simbolo: 'U$D', flag: '🟦' },
  { codigo: 'USD_MEP',  label: 'Dólar MEP',       simbolo: 'U$D', flag: '📈' },
  { codigo: 'USD_CCL',  label: 'Dólar CCL',       simbolo: 'U$D', flag: '🏦' },
  { codigo: 'EUR',      label: 'Euro',             simbolo: '€',   flag: '🇪🇺' },
  { codigo: 'BRL',      label: 'Real Brasileño',  simbolo: 'R$',  flag: '🇧🇷' },
];

const CASA_MAP: Record<string, string> = {
  oficial: 'USD_OF',
  blue:    'USD_BLUE',
  mep:     'USD_MEP',
  bolsa:   'USD_MEP',
  ccl:     'USD_CCL',
  contadoconliqui: 'USD_CCL',
};

// ─── Hook: cotizaciones en vivo ────────────────────────────
function useCotizaciones() {
  const [monedas, setMonedas]           = useState<Moneda[]>([]);
  const [loading, setLoading]           = useState(true);
  const [error, setError]               = useState<string | null>(null);
  const [ultimaAct, setUltimaAct]       = useState<Date | null>(null);

  const fetchTasas = useCallback(async () => {
    try {
      const [dolaresRes, eurRes, brlRes] = await Promise.all([
        fetch('https://dolarapi.com/v1/dolares'),
        fetch('https://dolarapi.com/v1/cotizaciones/eur'),
        fetch('https://dolarapi.com/v1/cotizaciones/brl'),
      ]);
      if (!dolaresRes.ok) throw new Error('API error');

      const dolares: any[] = await dolaresRes.json();
      const eur: any        = await eurRes.json();
      const brl: any        = await brlRes.json();

      const tasasMap: Record<string, number> = { ARS: 1 };
      dolares.forEach((d: any) => {
        const codigo = CASA_MAP[d.casa];
        if (codigo && d.venta) tasasMap[codigo] = Number(d.venta);
      });
      if (eur.venta) tasasMap['EUR'] = Number(eur.venta);
      if (brl.venta) tasasMap['BRL'] = Number(brl.venta);

      setMonedas(
        MONEDAS_DEFAULT
          .filter((m) => tasasMap[m.codigo] !== undefined)
          .map((m) => ({ ...m, tasaEnARS: tasasMap[m.codigo] }))
      );
      setUltimaAct(new Date());
      setError(null);
    } catch {
      setError('Error al cargar cotizaciones.');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchTasas();
    const iv = setInterval(fetchTasas, 300_000);
    return () => clearInterval(iv);
  }, [fetchTasas]);

  return { monedas, loading, error, ultimaAct, fetchTasas };
}

// ─── Selector ─────────────────────────────────────────────
function SelectorMoneda({ value, onChange, monedas }: { value: string; onChange: (c: string) => void; monedas: Moneda[] }) {
  return (
    <select
      value={value}
      onChange={(e) => onChange(e.target.value)}
      className="w-full bg-premium-dark border border-premium-muted/30 rounded-xl px-4 py-3 text-premium-text font-semibold focus:border-premium-accent outline-none transition-colors cursor-pointer"
    >
      {monedas.map((m) => (
        <option key={m.codigo} value={m.codigo}>{m.flag} {m.label}</option>
      ))}
    </select>
  );
}

// ─── Status bar compartida ─────────────────────────────────
function StatusBar({ loading, error, ultimaAct, onRefresh }: { loading: boolean; error: string | null; ultimaAct: Date | null; onRefresh: () => void }) {
  return (
    <div className="flex items-center justify-between text-sm text-premium-muted">
      <div className="flex items-center space-x-2">
        <div className={`w-2.5 h-2.5 rounded-full ${loading ? 'bg-yellow-500 animate-pulse' : error ? 'bg-premium-danger' : 'bg-green-500'}`} />
        <span>{loading ? 'Cargando cotizaciones...' : error ?? 'Cotizaciones en vivo'}</span>
      </div>
      <div className="flex items-center space-x-3">
        {ultimaAct && (
          <span className="flex items-center space-x-1">
            <Clock size={12} />
            <span>{format(ultimaAct, 'HH:mm:ss', { locale: es })}</span>
          </span>
        )}
        <button onClick={onRefresh} disabled={loading} className="flex items-center space-x-1 px-2 py-1 rounded-lg hover:bg-premium-card transition-colors disabled:opacity-50">
          <RefreshCw size={12} className={loading ? 'animate-spin' : ''} />
          <span>Actualizar</span>
        </button>
      </div>
    </div>
  );
}

// ═══════════════════════════════════════════════════════════
// TAB 1: Conversor de Divisas
// ═══════════════════════════════════════════════════════════
function TabConversor({ monedas, loading }: { monedas: Moneda[]; loading: boolean }) {
  const [desde, setDesde] = useState('USD_BLUE');
  const [hasta, setHasta] = useState('ARS');
  const [monto, setMonto] = useState<string>('1');
  const [resultado, setRes] = useState(0);

  useEffect(() => {
    if (!monedas.length) return;
    const mD = monedas.find((m) => m.codigo === desde);
    const mH = monedas.find((m) => m.codigo === hasta);
    if (!mD || !mH) return;
    const n = parseFloat(monto.replace(',', '.')) || 0;
    setRes((n * mD.tasaEnARS) / mH.tasaEnARS);
  }, [monto, desde, hasta, monedas]);

  const swap = () => { setDesde(hasta); setHasta(desde); };
  const fmt = (n: number) => n.toLocaleString('es-AR', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
  const mD = monedas.find((m) => m.codigo === desde);
  const mH = monedas.find((m) => m.codigo === hasta);
  const tasa = mD && mH ? mD.tasaEnARS / mH.tasaEnARS : null;

  return (
    <div className="space-y-4">
      <div className="bg-premium-card rounded-2xl border border-premium-muted/20 overflow-hidden shadow-xl">
        <div className="p-6 border-b border-premium-muted/10">
          <label className="block text-sm font-semibold text-premium-muted uppercase tracking-wider mb-3">Convertir</label>
          <div className="flex flex-col sm:flex-row gap-3">
            <input type="number" min="0" value={monto} onChange={(e) => setMonto(e.target.value)}
              className="flex-1 bg-premium-dark border border-premium-muted/30 rounded-xl px-5 py-4 text-3xl font-bold text-premium-text focus:border-premium-accent outline-none [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none" placeholder="0" />
            <div className="sm:w-56"><SelectorMoneda value={desde} onChange={setDesde} monedas={monedas} /></div>
          </div>
        </div>

        <div className="relative h-0 flex items-center justify-center">
          <button onClick={swap} className="absolute z-10 bg-premium-accent hover:bg-blue-600 text-white rounded-full p-3 shadow-lg transition-all hover:scale-110 active:scale-95">
            <ArrowLeftRight size={20} />
          </button>
        </div>

        <div className="p-6 pt-8 bg-premium-dark/30">
          <label className="block text-sm font-semibold text-premium-muted uppercase tracking-wider mb-3">Resultado</label>
          <div className="flex flex-col sm:flex-row gap-3 items-center">
            <div className="flex-1 bg-premium-dark rounded-xl px-5 py-4 border border-premium-muted/20">
              {loading ? <div className="h-10 w-32 bg-premium-muted/10 rounded animate-pulse" /> :
                <span className="text-3xl font-bold text-premium-accent">{fmt(resultado)}</span>}
            </div>
            <div className="sm:w-56"><SelectorMoneda value={hasta} onChange={setHasta} monedas={monedas} /></div>
          </div>
          {!loading && tasa !== null && mD && mH && (
            <p className="mt-4 text-sm text-premium-muted">
              <span className="font-medium text-premium-text">1 {mD.label}</span>{' = '}
              <span className="font-bold text-premium-accent">{fmt(tasa)} {mH.label}</span>
              {' · '}
              <span className="font-medium text-premium-text">1 {mH.label}</span>{' = '}
              <span className="font-bold text-premium-accent">{fmt(1 / tasa)} {mD.label}</span>
            </p>
          )}
        </div>
      </div>

      {/* Tabla de referencia */}
      {!loading && mD && (
        <div className="bg-premium-card rounded-2xl border border-premium-muted/20 overflow-hidden">
          <div className="px-6 py-4 border-b border-premium-muted/10 flex items-center space-x-2">
            <TrendingUp size={18} className="text-premium-accent" />
            <h2 className="font-bold text-premium-text">1 {mD.label} en todas las monedas</h2>
          </div>
          <div className="divide-y divide-premium-muted/10">
            {monedas.filter((m) => m.codigo !== desde).map((m) => {
              const val = mD.tasaEnARS / m.tasaEnARS;
              return (
                <div key={m.codigo} onClick={() => setHasta(m.codigo)}
                  className="flex items-center justify-between px-6 py-4 hover:bg-premium-dark/30 transition-colors cursor-pointer">
                  <div className="flex items-center space-x-3">
                    <span className="text-2xl">{m.flag}</span>
                    <div>
                      <p className="font-semibold text-premium-text">{m.label}</p>
                      <p className="text-xs text-premium-muted">{m.codigo.replace('USD_', 'USD ')}</p>
                    </div>
                  </div>
                  <p className="font-bold text-premium-accent text-lg">{fmt(val)} <span className="text-sm text-premium-muted">{m.simbolo}</span></p>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}

// ═══════════════════════════════════════════════════════════
// TAB 2: Simulador de Cheque — AUTOMATIZACIÓN CLAVE
// ═══════════════════════════════════════════════════════════
function TabSimulador({ monedas, loading }: { monedas: Moneda[]; loading: boolean }) {
  const navigate = useNavigate();
  const hoy = new Date().toISOString().split('T')[0];

  const [form, setForm] = useState({
    montoNominal: '',
    fechaEmision: hoy,
    fechaVencimiento: '',
    tasa: '45',
    comision: '2',
  });

  const [resultado, setResultado] = useState<ReturnType<typeof calcularOperacionCheque> | null>(null);

  // Auto-calcular al cambiar cualquier campo
  useEffect(() => {
    const { montoNominal, fechaEmision, fechaVencimiento, tasa, comision } = form;
    if (!montoNominal || !fechaVencimiento || !tasa || !comision) { setResultado(null); return; }
    try {
      const r = calcularOperacionCheque(Number(montoNominal), fechaEmision, fechaVencimiento, Number(tasa), Number(comision));
      if (r.dias > 0) setResultado(r);
      else setResultado(null);
    } catch { setResultado(null); }
  }, [form]);

  const fmt = (n: number) => n.toLocaleString('es-AR', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
  const fmtDolar = (n: number) => n.toLocaleString('es-AR', { minimumFractionDigits: 2, maximumFractionDigits: 2 });

  const getDolarMonto = (codigo: string) => {
    const m = monedas.find((x) => x.codigo === codigo);
    if (!m || !resultado) return null;
    return resultado.netoCliente / m.tasaEnARS;
  };

  const dolaresMostrar = [
    { codigo: 'USD_OF',   label: 'Oficial',  flag: '🇺🇸' },
    { codigo: 'USD_BLUE', label: 'Blue',     flag: '🟦' },
    { codigo: 'USD_MEP',  label: 'MEP',      flag: '📈' },
    { codigo: 'USD_CCL',  label: 'CCL',      flag: '🏦' },
  ];

  // Pre-llenar el formulario de Cheques con estos datos
  const usarEnCheques = () => {
    navigate('/cheques', {
      state: {
        montoNominal: form.montoNominal,
        fechaEmision: form.fechaEmision,
        fechaVencimiento: form.fechaVencimiento,
        tasa: form.tasa,
        comision: form.comision,
      }
    });
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
      {/* Formulario */}
      <div className="bg-premium-card rounded-2xl border border-premium-muted/20 p-6 space-y-4">
        <h3 className="font-bold text-premium-text flex items-center space-x-2">
          <Calculator size={20} className="text-premium-accent" />
          <span>Datos del Cheque</span>
        </h3>

        {[
          { label: 'Monto Nominal ($)', name: 'montoNominal', type: 'number', placeholder: 'Ej: 500000' },
          { label: 'Fecha Emisión', name: 'fechaEmision', type: 'date', placeholder: '' },
          { label: 'Fecha Vencimiento', name: 'fechaVencimiento', type: 'date', placeholder: '' },
          { label: 'Tasa TNA (%)', name: 'tasa', type: 'number', placeholder: 'Ej: 45' },
          { label: 'Comisión (%)', name: 'comision', type: 'number', placeholder: 'Ej: 2' },
        ].map(({ label, name, type, placeholder }) => (
          <div key={name}>
            <label className="block text-base font-semibold text-premium-muted mb-2">{label}</label>
            <input type={type} placeholder={placeholder}
              value={(form as any)[name]}
              onChange={(e) => setForm({ ...form, [name]: e.target.value })}
              className="w-full min-h-[48px] bg-premium-dark border border-premium-muted/30 rounded-lg px-4 py-3 text-base text-premium-text focus:border-premium-accent outline-none transition-colors [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none" />
          </div>
        ))}
      </div>

      {/* Resultados en tiempo real */}
      <div className="space-y-4">
        {resultado ? (
          <>
            {/* Resultado principal en ARS */}
            <div className="bg-premium-card rounded-2xl border border-premium-accent/30 p-6 shadow-lg shadow-premium-accent/5">
              <div className="flex justify-between items-start mb-4">
                <div>
                  <p className="text-sm font-semibold text-premium-muted uppercase tracking-wider">Liquidación en ARS</p>
                  <p className="text-sm text-premium-muted mt-1">{resultado.dias} días al vencimiento</p>
                </div>
                <span className="text-sm bg-premium-accent/10 text-premium-accent px-3 py-1.5 rounded-md font-semibold">En vivo</span>
              </div>
              <div className="space-y-3">
                <div className="flex justify-between text-sm">
                  <span className="text-premium-muted">Monto Nominal</span>
                  <span className="font-semibold text-premium-text">${fmt(Number(form.montoNominal))}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-premium-muted">Interés descontado</span>
                  <span className="font-semibold text-premium-danger">-${fmt(resultado.interesDescuento)}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-premium-muted">Comisión</span>
                  <span className="font-semibold text-premium-danger">-${fmt(resultado.comisionMonto)}</span>
                </div>
                <div className="pt-3 border-t border-premium-muted/20">
                  <div className="flex justify-between">
                    <span className="font-bold text-premium-text">Neto a Entregar</span>
                    <span className="text-2xl font-bold text-premium-success">${fmt(resultado.netoCliente)}</span>
                  </div>
                  <div className="flex justify-between mt-1">
                    <span className="text-sm text-premium-muted">Tu ganancia</span>
                    <span className="text-sm font-bold text-premium-accent">${fmt(resultado.gananciaTotal)}</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Equivalencias en dólares — AUTOMATIZACIÓN CLAVE */}
            {!loading && (
              <div className="bg-premium-card rounded-2xl border border-premium-muted/20 p-5">
                <p className="text-sm font-semibold text-premium-muted uppercase tracking-wider mb-4">
                  Neto equivalente en divisas (cotización actual)
                </p>
                <div className="grid grid-cols-2 gap-3">
                  {dolaresMostrar.map(({ codigo, label, flag }) => {
                    const val = getDolarMonto(codigo);
                    return (
                      <div key={codigo} className="bg-premium-dark rounded-xl p-3 border border-premium-muted/10">
                        <p className="text-xs text-premium-muted">{flag} {label}</p>
                        <p className="text-lg font-bold text-premium-accent mt-1">
                          {val !== null ? `U$D ${fmtDolar(val)}` : '—'}
                        </p>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}

            {/* Botón de flujo integrado */}
            <button onClick={usarEnCheques}
              className="w-full bg-premium-accent hover:bg-blue-600 text-white font-semibold py-4 min-h-[56px] text-lg rounded-xl flex items-center justify-center space-x-2 transition-all shadow-lg shadow-premium-accent/20 active:scale-95">
              <Send size={22} />
              <span>Usar estos datos → Registrar Cheque</span>
            </button>
          </>
        ) : (
          <div className="bg-premium-card rounded-2xl border border-premium-muted/20 h-full min-h-[300px] flex flex-col items-center justify-center text-premium-muted p-6">
            <Calculator size={48} className="opacity-20 mb-4" />
            <p className="text-center text-sm">Completá el monto y las fechas para ver la liquidación en tiempo real.</p>
          </div>
        )}
      </div>
    </div>
  );
}

// ═══════════════════════════════════════════════════════════
// Componente Principal con tabs
// ═══════════════════════════════════════════════════════════
export default function Calculadora() {
  const { monedas, loading, error, ultimaAct, fetchTasas } = useCotizaciones();
  const [tab, setTab] = useState<'conversor' | 'simulador'>('conversor');

  return (
    <div className="space-y-6 max-w-4xl mx-auto pb-8 animate-in fade-in duration-500">
      <header>
        <h1 className="text-3xl font-bold text-premium-text">Calculadora Financiera</h1>
        <p className="text-premium-muted mt-1">Conversor de divisas y simulador de operaciones de cheques en tiempo real.</p>
      </header>

      <StatusBar loading={loading} error={error} ultimaAct={ultimaAct} onRefresh={fetchTasas} />

      <div className="flex bg-premium-card border border-premium-muted/20 rounded-xl p-1 w-fit overflow-x-auto">
        <button onClick={() => setTab('conversor')}
          className={`flex items-center space-x-2 px-5 py-3 rounded-lg text-base font-semibold transition-all whitespace-nowrap ${tab === 'conversor' ? 'bg-premium-accent text-white shadow' : 'text-premium-muted hover:text-premium-text'}`}>
          <ArrowLeftRight size={18} />
          <span>Conversor de Divisas</span>
        </button>
        <button onClick={() => setTab('simulador')}
          className={`flex items-center space-x-2 px-5 py-3 rounded-lg text-base font-semibold transition-all whitespace-nowrap ${tab === 'simulador' ? 'bg-premium-accent text-white shadow' : 'text-premium-muted hover:text-premium-text'}`}>
          <Calculator size={18} />
          <span>Simulador de Cheque</span>
        </button>
      </div>

      {tab === 'conversor'
        ? <TabConversor monedas={monedas} loading={loading} />
        : <TabSimulador monedas={monedas} loading={loading} />
      }
    </div>
  );
}
