import { useLiveQuery } from 'dexie-react-hooks';
import { db } from '../db/db';
import { Download, Table as TableIcon, UserPlus } from 'lucide-react';
import { format } from 'date-fns';
import ClienteFormDrawer from '../components/ClienteFormDrawer';
import { useState } from 'react';

export default function Reportes() {
  const [isNuevoClienteOpen, setIsNuevoClienteOpen] = useState(false);

  // Leer cheques y clientes reales desde Dexie
  const cheques = useLiveQuery(() => db.cheques.toArray()) || [];
  const clientes = useLiveQuery(() => db.clientes.toArray()) || [];

  // Enriquecer cheques con datos del cliente para mostrar en la tabla
  const historial = cheques
    .map(ch => {
      const cliente = clientes.find(c => c.id === ch.clienteId);
      return { ...ch, clienteNombre: cliente?.nombre || ch.cliente };
    })
    .sort((a, b) => new Date(b.fechaCobro).getTime() - new Date(a.fechaCobro).getTime());

  // Resumen de KPIs reales
  const totalEnCartera = cheques
    .filter(c => c.estado === 'en_cartera')
    .reduce((acc, c) => acc + c.monto, 0);

  const totalCobrado = cheques
    .filter(c => c.estado === 'cobrado')
    .reduce((acc, c) => acc + c.monto, 0);

  const totalRechazado = cheques
    .filter(c => c.estado === 'rechazado')
    .reduce((acc, c) => acc + c.monto, 0);

  const exportarCSV = () => {
    const cabeceras = ['Fecha Vencimiento', 'Cliente', 'Banco', 'Nro Cheque', 'Monto', 'Estado'];
    const filas = historial.map(row => [
      format(new Date(row.fechaCobro), 'dd/MM/yyyy'),
      row.clienteNombre,
      row.banco,
      row.nroCheque,
      row.monto,
      row.estado.replace('_', ' '),
    ]);
    const contenidoCSV = [cabeceras.join(','), ...filas.map(fila => fila.map(celda => `"${celda}"`).join(','))].join('\n');
    const blob = new Blob([contenidoCSV], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', `Reporte_Cheques_${format(new Date(), 'yyyy-MM-dd')}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const estadoColor = (estado: string) => {
    if (estado === 'cobrado') return 'bg-green-500/10 text-green-500';
    if (estado === 'rechazado') return 'bg-red-500/10 text-red-400';
    if (estado === 'en_cartera') return 'bg-blue-500/10 text-blue-400';
    if (estado === 'depositado') return 'bg-yellow-500/10 text-yellow-400';
    return 'bg-premium-muted/10 text-premium-muted';
  };

  return (
    <div className="space-y-6 max-w-7xl mx-auto pb-8 animate-in fade-in duration-500">
      {/* Header */}
      <header className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold text-premium-text">Reportes e Historial</h1>
          <p className="text-premium-muted mt-1">Todos tus cheques registrados en tiempo real.</p>
        </div>
        <button
          onClick={exportarCSV}
          className="bg-green-600 hover:bg-green-700 text-white font-semibold py-3 px-5 rounded-xl transition-all shadow-lg flex items-center space-x-2"
        >
          <Download size={20} />
          <span>Exportar a Excel (CSV)</span>
        </button>
      </header>

      {/* KPIs reales */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="bg-premium-card border border-premium-muted/20 rounded-xl p-5">
          <p className="text-sm text-premium-muted mb-1">Capital en Cartera</p>
          <p className="text-2xl font-bold text-premium-accent">${totalEnCartera.toLocaleString('es-AR')}</p>
          <p className="text-xs text-premium-muted mt-1">{cheques.filter(c => c.estado === 'en_cartera').length} cheque(s)</p>
        </div>
        <div className="bg-premium-card border border-green-500/20 rounded-xl p-5">
          <p className="text-sm text-premium-muted mb-1">Total Cobrado</p>
          <p className="text-2xl font-bold text-green-500">${totalCobrado.toLocaleString('es-AR')}</p>
          <p className="text-xs text-premium-muted mt-1">{cheques.filter(c => c.estado === 'cobrado').length} cheque(s)</p>
        </div>
        <div className="bg-premium-card border border-red-500/20 rounded-xl p-5">
          <p className="text-sm text-premium-muted mb-1">Total Rechazado</p>
          <p className="text-2xl font-bold text-red-400">${totalRechazado.toLocaleString('es-AR')}</p>
          <p className="text-xs text-premium-muted mt-1">{cheques.filter(c => c.estado === 'rechazado').length} cheque(s)</p>
        </div>
      </div>

      {/* Atajo agregar cliente */}
      <button
        onClick={() => setIsNuevoClienteOpen(true)}
        className="group flex items-center space-x-4 bg-premium-card border border-premium-muted/20 hover:border-green-500/50 rounded-xl p-5 transition-all hover:bg-green-500/5 text-left w-full sm:w-auto"
      >
        <div className="p-3 rounded-lg bg-green-500/10 text-green-500 group-hover:bg-green-500/20 transition-colors shrink-0">
          <UserPlus size={24} />
        </div>
        <div>
          <p className="font-semibold text-premium-text">Agregar Nuevo Cliente</p>
          <p className="text-sm text-premium-muted mt-0.5">Dar de alta un cliente en la cartera.</p>
        </div>
      </button>

      {/* Tabla de cheques reales */}
      <div className="bg-premium-card rounded-xl border border-premium-muted/20 overflow-hidden shadow-sm">
        <div className="flex items-center justify-between px-6 py-4 border-b border-premium-muted/20">
          <p className="text-sm font-medium text-premium-muted">{historial.length} cheque(s) registrado(s)</p>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-sm text-left text-premium-text">
            <thead className="text-xs text-premium-muted uppercase bg-premium-dark/50 border-b border-premium-muted/20">
              <tr>
                <th className="px-6 py-4 font-semibold">Vencimiento</th>
                <th className="px-6 py-4 font-semibold">Cliente</th>
                <th className="px-6 py-4 font-semibold">Banco / N°</th>
                <th className="px-6 py-4 font-semibold text-right">Monto</th>
                <th className="px-6 py-4 font-semibold">Estado</th>
              </tr>
            </thead>
            <tbody>
              {historial.map((row) => (
                <tr key={row.id} className="border-b border-premium-muted/10 hover:bg-premium-dark/30 transition-colors">
                  <td className="px-6 py-3">{format(new Date(row.fechaCobro), 'dd/MM/yyyy')}</td>
                  <td className="px-6 py-3 font-medium">{row.clienteNombre}</td>
                  <td className="px-6 py-3">
                    {row.banco}
                    <span className="block text-xs text-premium-muted">{row.nroCheque}</span>
                  </td>
                  <td className="px-6 py-3 text-right font-bold text-premium-accent">
                    ${row.monto.toLocaleString('es-AR')}
                  </td>
                  <td className="px-6 py-3">
                    <span className={`px-2 py-1 rounded-md text-xs font-semibold ${estadoColor(row.estado)}`}>
                      {row.estado.replace('_', ' ')}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {historial.length === 0 && (
          <div className="flex flex-col items-center justify-center py-20 text-premium-muted">
            <TableIcon size={48} className="opacity-20 mb-4" />
            <p className="font-medium">No hay cheques registrados todavía.</p>
            <p className="text-sm mt-1">Cargá tu primer cheque desde la sección <span className="text-premium-accent">Operaciones</span>.</p>
          </div>
        )}
      </div>

      <ClienteFormDrawer
        isOpen={isNuevoClienteOpen}
        onClose={() => setIsNuevoClienteOpen(false)}
        onSave={() => setIsNuevoClienteOpen(false)}
      />
    </div>
  );
}
