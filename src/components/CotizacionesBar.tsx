import { useState, useEffect, useCallback, useRef } from 'react';
import { TrendingUp, RefreshCw, Pause, Play } from 'lucide-react';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';

interface Cotizacion {
  nombre: string;
  casa: string;
  compra: number;
  venta: number;
}

// ── Calcula el spread Blue vs Oficial como insight ──────────
function buildTickerItems(cotizaciones: Cotizacion[]): string[] {
  const items: string[] = [];

  // 1. Cotizaciones formateadas
  for (const c of cotizaciones) {
    items.push(`${c.nombre.toUpperCase()}   C: $${c.compra.toLocaleString('es-AR')}   V: $${c.venta.toLocaleString('es-AR')}`);
  }

  // 2. Insights calculados
  const oficial = cotizaciones.find(c => c.casa === 'oficial');
  const blue    = cotizaciones.find(c => c.casa === 'blue');
  const mep     = cotizaciones.find(c => c.casa === 'mep');
  const ccl     = cotizaciones.find(c => c.casa === 'ccl');

  if (oficial && blue) {
    const spread = blue.venta - oficial.venta;
    const pct    = ((spread / oficial.venta) * 100).toFixed(1);
    items.push(`BRECHA CAMBIARIA   Blue vs Oficial: +$${spread.toLocaleString('es-AR')} (+${pct}%)`);
  }

  if (mep && ccl) {
    const diff = ccl.venta - mep.venta;
    items.push(`SPREAD MEP / CCL   Diferencia: $${diff.toLocaleString('es-AR')}`);
  }

  if (blue) {
    items.push(`DÓLAR BLUE   Referencia del mercado informal: $${blue.venta.toLocaleString('es-AR')}`);
  }

  // 3. Timestamp
  const hora = format(new Date(), "HH:mm 'hs'", { locale: es });
  items.push(`Cotizaciones actualizadas a las ${hora} — Fuente: DolarAPI`);

  return items;
}

export default function CotizacionesBar() {
  const [tickerItems, setTickerItems]     = useState<string[]>([]);
  const [loading, setLoading]             = useState(true);
  const [paused, setPaused]               = useState(false);
  const [ultimaAct, setUltimaAct]         = useState<string>('');
  const containerRef                       = useRef<HTMLDivElement>(null);

  const fetchCotizaciones = useCallback(async () => {
    try {
      const [dolaresRes, eurRes, brlRes] = await Promise.all([
        fetch('https://dolarapi.com/v1/dolares'),
        fetch('https://dolarapi.com/v1/cotizaciones/eur'),
        fetch('https://dolarapi.com/v1/cotizaciones/brl'),
      ]);

      const dolares: any[] = await dolaresRes.json();
      const eur: any       = await eurRes.json();
      const brl: any       = await brlRes.json();

      const casas = ['oficial', 'blue', 'mep', 'ccl'];
      const filtrados: Cotizacion[] = dolares
        .filter((d: any) => casas.includes(d.casa))
        .sort((a: any, b: any) => casas.indexOf(a.casa) - casas.indexOf(b.casa))
        .map((d: any) => ({ nombre: `Dólar ${d.nombre}`, casa: d.casa, compra: d.compra, venta: d.venta }));

      const todas: Cotizacion[] = [
        ...filtrados,
        { nombre: 'Euro',  casa: 'eur', compra: eur.compra, venta: eur.venta },
        { nombre: 'Real',  casa: 'brl', compra: brl.compra, venta: brl.venta },
      ];

      setTickerItems(buildTickerItems(todas));
      setUltimaAct(format(new Date(), 'HH:mm', { locale: es }));
    } catch (err) {
      console.error('Error fetching cotizaciones:', err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchCotizaciones();
    const iv = setInterval(fetchCotizaciones, 300_000);
    return () => clearInterval(iv);
  }, [fetchCotizaciones]);

  // ── Velocidad dinámica según cantidad de items ─────────
  const durationSeg = Math.max(35, tickerItems.length * 5);

  // ── Duplicamos los items para el loop continuo ─────────
  const doubled = [...tickerItems, ...tickerItems];

  return (
    <>
      {/* Estilos del ticker inyectados inline */}
      <style>{`
        @keyframes ticker-move {
          0%   { transform: translateX(0); }
          100% { transform: translateX(-50%); }
        }
        .ticker-track {
          display: flex;
          width: max-content;
          animation: ticker-move ${durationSeg}s linear infinite;
          will-change: transform;
        }
        .ticker-track.paused {
          animation-play-state: paused;
        }
      `}</style>

      <div
        className="bg-premium-dark border-b border-premium-muted/20 w-full flex items-center h-14 sticky top-0 z-40 select-none"
        ref={containerRef}
        onMouseEnter={() => setPaused(true)}
        onMouseLeave={() => setPaused(false)}
        onTouchStart={() => setPaused(true)}
        onTouchEnd={() => setPaused(false)}
      >
        {/* Etiqueta izquierda */}
        <div className="shrink-0 flex items-center space-x-2 bg-premium-accent px-4 h-full text-white text-xs sm:text-sm font-bold tracking-widest uppercase">
          <TrendingUp size={18} />
          <span>Mercado</span>
        </div>

        {/* Ticker scrollable */}
        <div className="flex-1 overflow-hidden h-full flex items-center relative">
          {/* Fade izquierda */}
          <div className="absolute left-0 top-0 bottom-0 w-8 bg-gradient-to-r from-premium-dark to-transparent z-10 pointer-events-none" />

          {loading && tickerItems.length === 0 ? (
            <div className="flex items-center space-x-2 text-premium-muted text-sm px-4 animate-pulse">
              <RefreshCw size={16} className="animate-spin" />
              <span>Cargando cotizaciones en vivo...</span>
            </div>
          ) : (
            <div className={`ticker-track ${paused ? 'paused' : ''}`}>
              {doubled.map((item, idx) => (
                <span
                  key={idx}
                  className="whitespace-nowrap text-[15px] px-8 text-premium-muted"
                >
                  {/* Ítems de cotización vs insights tienen color diferente */}
                  {item.includes('BRECHA') || item.includes('SPREAD') || item.includes('Cotizaciones') ? (
                    <span className="text-premium-warning font-semibold">{item}</span>
                  ) : item.includes('BLUE') && !item.includes('Dólar Blue') ? (
                    <span className="text-premium-accent font-semibold">{item}</span>
                  ) : (
                    <>
                      <span className="text-premium-text font-semibold">
                        {item.split('   ')[0]}
                      </span>
                      <span className="text-premium-muted">
                        {'   ' + item.split('   ').slice(1).join('   ')}
                      </span>
                    </>
                  )}
                  <span className="text-premium-muted/20 mx-4">◆</span>
                </span>
              ))}
            </div>
          )}

          {/* Fade derecha */}
          <div className="absolute right-0 top-0 bottom-0 w-8 bg-gradient-to-l from-premium-dark to-transparent z-10 pointer-events-none" />
        </div>

        {/* Controles derecha */}
        <div className="shrink-0 hidden md:flex items-center space-x-4 px-4 border-l border-premium-muted/10 h-full">
          {ultimaAct && (
            <span className="text-xs text-premium-muted hidden sm:block">{ultimaAct}</span>
          )}
          <button
            onClick={() => setPaused(p => !p)}
            className="text-premium-muted hover:text-premium-text transition-colors p-2 rounded-lg bg-premium-card/50 hover:bg-premium-card"
            title={paused ? 'Reanudar' : 'Pausar'}
          >
            {paused ? <Play size={20} /> : <Pause size={20} />}
          </button>
          <button
            onClick={fetchCotizaciones}
            disabled={loading}
            className="text-premium-muted hover:text-premium-text transition-colors p-2 rounded-lg bg-premium-card/50 hover:bg-premium-card disabled:opacity-40"
            title="Actualizar"
          >
            <RefreshCw size={20} className={loading ? 'animate-spin' : ''} />
          </button>
        </div>
      </div>
    </>
  );
}
