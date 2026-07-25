import { useState } from 'react';
import { Calendar as CalendarIcon, CheckCircle2, AlertCircle, Clock, ArrowRightLeft, List, LayoutGrid, ChevronLeft, ChevronRight, CheckCheck } from 'lucide-react';
import { format, startOfMonth, endOfMonth, startOfWeek, endOfWeek, eachDayOfInterval, isSameMonth, isSameDay, addMonths, subMonths } from 'date-fns';
import { es } from 'date-fns/locale';
import { useRecordatorios } from '../context/RecordatoriosContext';
import RecordatorioDrawer from '../components/RecordatorioDrawer';

import { useLiveQuery } from 'dexie-react-hooks';
import { db } from '../db/db';
import type { Cheque } from '../db/db';

const ESTADOS_CONFIG: Record<string, { label: string; icon: any; color: string; bg: string; dot: string }> = {
  en_cartera: { label: 'En Cartera', icon: Clock,           color: 'text-premium-accent',   bg: 'bg-premium-accent/10 border-premium-accent/20',   dot: 'bg-premium-accent' },
  depositado:  { label: 'Depositado', icon: CheckCircle2,   color: 'text-premium-success',  bg: 'bg-premium-success/10 border-premium-success/20',  dot: 'bg-premium-success' },
  cobrado:     { label: 'Cobrado',    icon: CheckCircle2,   color: 'text-green-500',         bg: 'bg-green-500/10 border-green-500/20',              dot: 'bg-green-500' },
  rechazado:   { label: 'Rechazado',  icon: AlertCircle,    color: 'text-premium-danger',   bg: 'bg-premium-danger/10 border-premium-danger/20',    dot: 'bg-premium-danger' },
  endosado:    { label: 'Endosado',   icon: ArrowRightLeft, color: 'text-premium-warning',  bg: 'bg-premium-warning/10 border-premium-warning/20',  dot: 'bg-premium-warning' },
};

// ──────────────────────────────────────────────────────────
// Vista: Lista
// ──────────────────────────────────────────────────────────
function VistaLista({ cheques }: { cheques: Cheque[] }) {
  return (
    <div className="space-y-4">
      {cheques.map((cheque) => {
        const config = ESTADOS_CONFIG[cheque.estado];
        const Icon = config.icon;
        const fecha = new Date(cheque.fechaCobro);
        return (
          <div key={cheque.id} className="bg-premium-card rounded-2xl border border-premium-muted/20 p-4 hover:border-premium-muted/40 transition-colors flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
            <div className="flex items-center space-x-4">
              <div className="flex flex-col items-center justify-center bg-premium-dark w-16 h-16 rounded-xl border border-premium-muted/10 shrink-0">
                <span className="text-xs text-premium-muted uppercase font-semibold">{format(fecha, 'MMM', { locale: es })}</span>
                <span className="text-xl font-bold text-premium-text">{format(fecha, 'dd')}</span>
              </div>
              <div>
                <h3 className="font-bold text-lg text-premium-text">{cheque.cliente}</h3>
                <div className="flex items-center text-sm text-premium-muted mt-1 space-x-3">
                  <span className="flex items-center space-x-1">
                    <CalendarIcon size={14} />
                    <span>{format(fecha, 'EEEE dd', { locale: es })}</span>
                  </span>
                  <span>•</span>
                  <span>Banco {cheque.banco}</span>
                </div>
              </div>
            </div>
            <div className="flex flex-row md:flex-col items-center md:items-end justify-between w-full md:w-auto gap-2">
              <span className="text-xl font-bold text-premium-text">${cheque.monto.toLocaleString('es-AR')}</span>
              <div className={`px-3 py-1 rounded-full border text-xs font-medium flex items-center space-x-1 ${config.bg} ${config.color}`}>
                <Icon size={12} />
                <span>{config.label}</span>
              </div>
            </div>
          </div>
        );
      })}
      {cheques.length === 0 && (
        <div className="text-center py-12 text-premium-muted">No hay cheques para el filtro seleccionado.</div>
      )}
    </div>
  );
}

// ──────────────────────────────────────────────────────────
// Vista: Cuadrícula (Calendario mensual)
// ──────────────────────────────────────────────────────────
function VistaCuadricula({ cheques }: { cheques: Cheque[] }) {
  const [mesActual, setMesActual] = useState(new Date());
  const [diaSeleccionado, setDiaSeleccionado] = useState<Date | null>(null);
  const [estadosCheques, setEstadosCheques] = useState<Record<number, string>>({});
  const [recordatorioTarget, setRecordatorioTarget] = useState<any | null>(null);

  const { recordatorios } = useRecordatorios();

  const inicioMes   = startOfMonth(mesActual);
  const finMes      = endOfMonth(mesActual);
  const inicioGrid  = startOfWeek(inicioMes, { weekStartsOn: 1 });
  const finGrid     = endOfWeek(finMes, { weekStartsOn: 1 });
  const dias        = eachDayOfInterval({ start: inicioGrid, end: finGrid });

  const chequesPorDia = (dia: Date) =>
    cheques.filter(c => isSameDay(new Date(c.fechaCobro), dia));

  const getEstado = (c: Cheque) => estadosCheques[c.id!] ?? c.estado;

  const marcarCobrado = async (id: number) => {
    // Actualizar en base de datos real
    await db.cheques.update(id, { estado: 'cobrado' });
    setEstadosCheques(prev => ({ ...prev, [id]: 'cobrado' }));
  };

  const chequesDelDia = diaSeleccionado ? chequesPorDia(diaSeleccionado) : [];

  return (
    <div className="space-y-4">
      {/* Navegación del mes */}
      <div className="flex items-center justify-between bg-premium-card rounded-xl border border-premium-muted/20 px-5 py-3">
        <button onClick={() => setMesActual(subMonths(mesActual, 1))}
          className="p-2 rounded-lg hover:bg-premium-dark transition-colors text-premium-muted hover:text-premium-text">
          <ChevronLeft size={20} />
        </button>
        <h2 className="text-lg font-bold text-premium-text capitalize">
          {format(mesActual, 'MMMM yyyy', { locale: es })}
        </h2>
        <button onClick={() => setMesActual(addMonths(mesActual, 1))}
          className="p-2 rounded-lg hover:bg-premium-dark transition-colors text-premium-muted hover:text-premium-text">
          <ChevronRight size={20} />
        </button>
      </div>

      {/* Grilla */}
      <div className="bg-premium-card rounded-xl border border-premium-muted/20 overflow-hidden">
        <div className="grid grid-cols-7 border-b border-premium-muted/20">
          {['Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb', 'Dom'].map(d => (
            <div key={d} className="text-center text-xs font-semibold text-premium-muted py-3 uppercase tracking-wider">{d}</div>
          ))}
        </div>
        <div className="grid grid-cols-7">
          {dias.map((dia, idx) => {
            const esMesActual = isSameMonth(dia, mesActual);
            const esHoy       = isSameDay(dia, new Date());
            const esSeleccion = diaSeleccionado && isSameDay(dia, diaSeleccionado);
            const esPasado    = dia < new Date() && !esHoy;
            const chequesDia  = chequesPorDia(dia);
            const tieneItems  = chequesDia.length > 0;

            return (
              <div key={idx}
                onClick={() => setDiaSeleccionado(tieneItems ? dia : null)}
                className={`min-h-[100px] p-2 border-r border-b border-premium-muted/10 transition-colors flex flex-col
                  ${!esMesActual ? 'opacity-25' : ''}
                  ${esPasado && esMesActual ? 'bg-black/20' : ''}
                  ${tieneItems ? 'cursor-pointer hover:bg-premium-dark/40' : ''}
                  ${esSeleccion ? 'bg-premium-accent/10 border-premium-accent/30' : ''}
                `}
              >
                <span className={`text-base font-semibold w-8 h-8 flex items-center justify-center rounded-full mb-1 self-end
                  ${esHoy ? 'bg-premium-accent text-white' : esPasado && esMesActual ? 'text-premium-muted/40' : 'text-premium-muted'}`}>
                  {format(dia, 'd')}
                </span>
                <div className="flex flex-col gap-1 flex-1">
                  {chequesDia.slice(0, 2).map((c, i) => {
                    const estado = getEstado(c);
                    const cfg = ESTADOS_CONFIG[estado] ?? ESTADOS_CONFIG['en_cartera'];
                    const tieneRec = recordatorios.some(r => r.tipo === 'cheque' && r.referenciaId === c.id && r.estado === 'pendiente');
                    return (
                      <div key={i} className={`flex items-center space-x-1 rounded px-1 py-0.5 ${cfg.bg} relative`}>
                        {tieneRec && <span className="absolute -top-1 -right-1 w-2 h-2 bg-premium-warning rounded-full shadow-[0_0_4px_rgba(234,179,8,0.8)] animate-pulse" />}
                        <span className={`w-1.5 h-1.5 rounded-full shrink-0 ${cfg.dot}`} />
                        <span className={`text-xs font-medium truncate ${cfg.color}`}>
                          {c.cliente.split(' ')[0]}
                        </span>
                      </div>
                    );
                  })}
                  {chequesDia.length > 2 && (
                    <span className="text-xs text-premium-muted pl-1">+{chequesDia.length - 2} más</span>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Panel de detalle del día */}
      {diaSeleccionado && chequesDelDia.length > 0 && (
        <div className="bg-premium-card rounded-xl border border-premium-accent/20 p-5 space-y-4 animate-in fade-in duration-300">
          <h3 className="font-bold text-premium-text flex items-center space-x-2">
            <CalendarIcon size={18} className="text-premium-accent" />
            <span>Vencimientos del {format(diaSeleccionado, "d 'de' MMMM", { locale: es })}</span>
          </h3>
          {chequesDelDia.map(c => {
            const estado = getEstado(c);
            const cfg = ESTADOS_CONFIG[estado] ?? ESTADOS_CONFIG['en_cartera'];
            const Icon = cfg.icon;
            const yaCobrado = estado === 'cobrado';
            return (
              <div key={c.id} className={`flex flex-col md:flex-row md:items-center justify-between p-4 rounded-lg border ${cfg.bg} gap-4`}>
                <div className="flex items-center space-x-3 flex-1">
                  <Icon size={20} className={cfg.color} />
                  <div>
                    <div className="flex items-center space-x-2">
                      <p className="font-semibold text-premium-text text-base">{c.cliente}</p>
                      {recordatorios.some(r => r.tipo === 'cheque' && r.referenciaId === c.id && r.estado === 'pendiente') && (
                        <div className="w-2 h-2 rounded-full bg-premium-warning shadow-[0_0_8px_rgba(234,179,8,0.6)] animate-pulse" title="Tiene recordatorios" />
                      )}
                    </div>
                    <p className="text-sm text-premium-muted">Banco {c.banco} · {cfg.label}</p>
                  </div>
                </div>
                <div className="flex items-center justify-between md:justify-end w-full md:w-auto space-x-3 shrink-0">
                  <p className="font-bold text-premium-text text-lg">${c.monto.toLocaleString('es-AR')}</p>
                  <div className="flex items-center space-x-2">
                    <button
                      onClick={() => setRecordatorioTarget(c)}
                      className="p-2 text-premium-muted hover:text-premium-warning bg-premium-dark/50 rounded-lg transition-colors border border-premium-muted/10 min-h-[44px] flex items-center justify-center"
                      title="Añadir Recordatorio"
                    >
                      <List size={20} />
                    </button>
                  {!yaCobrado && (estado === 'en_cartera' || estado === 'depositado') && (
                    <button
                      onClick={() => marcarCobrado(c.id!)}
                      className="flex items-center space-x-1.5 bg-green-500 hover:bg-green-600 text-white text-sm font-semibold px-4 py-3 min-h-[44px] rounded-lg transition-all active:scale-95"
                    >
                      <CheckCheck size={16} />
                      <span>Cobrado</span>
                    </button>
                  )}
                  {yaCobrado && (
                    <span className="text-sm bg-green-500/10 text-green-500 border border-green-500/20 px-4 py-3 min-h-[44px] rounded-lg font-semibold flex items-center">
                      ✓ Cobrado
                    </span>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      <RecordatorioDrawer
        isOpen={!!recordatorioTarget}
        onClose={() => setRecordatorioTarget(null)}
        tipo="cheque"
        referenciaId={recordatorioTarget?.id}
        tituloSugerido={`Cheque ${recordatorioTarget?.cliente.split(' ')[0]} - $${recordatorioTarget?.monto.toLocaleString('es-AR')}`}
      />
    </div>
  );
}


// ──────────────────────────────────────────────────────────
// Componente Principal
// ──────────────────────────────────────────────────────────
export default function Calendario() {
  const [filtroEstado, setFiltroEstado] = useState<string>('todos');
  const [vista, setVista] = useState<'lista' | 'cuadricula'>('lista');

  const todosLosCheques = useLiveQuery(() => db.cheques.toArray()) || [];

  const chequesFiltrados = todosLosCheques
    .filter(c => filtroEstado === 'todos' || c.estado === filtroEstado)
    .sort((a, b) => new Date(a.fechaCobro).getTime() - new Date(b.fechaCobro).getTime());

  return (
    <div className="space-y-6 max-w-5xl mx-auto pb-8 animate-in fade-in duration-500">
      <header className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold text-premium-text">Calendario y Vencimientos</h1>
          <p className="text-premium-muted mt-1">Flujo de caja y control de cobros.</p>
        </div>

        {/* Selector de vista */}
        <div className="flex items-center bg-premium-card border border-premium-muted/20 rounded-xl p-1">
          <button
            onClick={() => setVista('lista')}
            className={`flex items-center space-x-2 px-4 py-3 min-h-[48px] rounded-lg text-sm font-medium transition-all ${
              vista === 'lista'
                ? 'bg-premium-accent text-white shadow'
                : 'text-premium-muted hover:text-premium-text'
            }`}
          >
            <List size={18} />
            <span>Lista</span>
          </button>
          <button
            onClick={() => setVista('cuadricula')}
            className={`flex items-center space-x-2 px-4 py-3 min-h-[48px] rounded-lg text-sm font-medium transition-all ${
              vista === 'cuadricula'
                ? 'bg-premium-accent text-white shadow'
                : 'text-premium-muted hover:text-premium-text'
            }`}
          >
            <LayoutGrid size={18} />
            <span>Calendario</span>
          </button>
        </div>
      </header>

      {/* Filtros de estado */}
      <div className="flex overflow-x-auto pb-2 gap-2 hide-scrollbar">
        <button
          onClick={() => setFiltroEstado('todos')}
          className={`whitespace-nowrap px-4 py-3 min-h-[48px] rounded-xl text-sm font-medium transition-colors ${
            filtroEstado === 'todos'
              ? 'bg-premium-card text-premium-text border border-premium-muted/30'
              : 'text-premium-muted hover:bg-premium-card/50'
          }`}
        >
          Todos
        </button>
        {Object.entries(ESTADOS_CONFIG).map(([key, config]) => (
          <button
            key={key}
            onClick={() => setFiltroEstado(key)}
            className={`whitespace-nowrap px-4 py-3 min-h-[48px] rounded-xl text-sm font-medium transition-colors flex items-center space-x-2 ${
              filtroEstado === key
                ? config.bg + ' border text-premium-text'
                : 'text-premium-muted hover:bg-premium-card/50'
            }`}
          >
            <config.icon size={16} className={config.color} />
            <span>{config.label}</span>
          </button>
        ))}
      </div>

      {/* Vistas */}
      {vista === 'lista'
        ? <VistaLista cheques={chequesFiltrados} />
        : <VistaCuadricula cheques={chequesFiltrados} />
      }
    </div>
  );
}
