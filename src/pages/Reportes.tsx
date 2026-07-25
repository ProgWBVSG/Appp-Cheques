import { useState } from 'react';
import { Download, Table as TableIcon, UserPlus, PlusCircle, X, Save, User, FileDigit, DollarSign, FileText } from 'lucide-react';
import { format } from 'date-fns';
import ClienteFormDrawer from '../components/ClienteFormDrawer';

// Tipo para las entradas del historial
interface OperacionHistorial {
  id: number;
  fechaOperacion: string;
  cliente: string;
  banco: string;
  nroCheque: string;
  montoNominal: number;
  dias: number;
  tasa: number;
  comision: number;
  interes: number;
  neto: number;
  estado: string;
}

const INITIAL_HISTORIAL: OperacionHistorial[] = [
  { id: 1, fechaOperacion: '2024-10-01', cliente: 'Empresa Alpha S.A.', banco: 'Galicia', nroCheque: '000123456', montoNominal: 450000, dias: 30, tasa: 45, comision: 9000, interes: 16875, neto: 424125, estado: 'Cobrado' },
  { id: 2, fechaOperacion: '2024-10-02', cliente: 'Distribuidora Beta', banco: 'Santander', nroCheque: '000987654', montoNominal: 1250000, dias: 45, tasa: 45, comision: 25000, interes: 70312.5, neto: 1154687.5, estado: 'Depositado' },
  { id: 3, fechaOperacion: '2024-10-03', cliente: 'Juan Pérez', banco: 'Provincia', nroCheque: '000112233', montoNominal: 300000, dias: 15, tasa: 45, comision: 6000, interes: 5625, neto: 288375, estado: 'Rechazado' },
];

// Formulario inline para cargar una nueva operación en el historial
function NuevaOperacionDrawer({ isOpen, onClose, onSave }: { isOpen: boolean; onClose: () => void; onSave: (op: OperacionHistorial) => void }) {
  const [form, setForm] = useState({ cliente: '', banco: '', nroCheque: '', montoNominal: '', dias: '', tasa: '45', comision: '2', estado: 'Depositado' });

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const nominal = Number(form.montoNominal);
    const dias = Number(form.dias);
    const tasa = Number(form.tasa);
    const comisionMonto = nominal * (Number(form.comision) / 100);
    const interes = nominal * (tasa / 100) * (dias / 360);
    const neto = nominal - interes - comisionMonto;

    onSave({
      id: Date.now(),
      fechaOperacion: new Date().toISOString().split('T')[0],
      cliente: form.cliente,
      banco: form.banco,
      nroCheque: form.nroCheque,
      montoNominal: nominal,
      dias,
      tasa,
      comision: comisionMonto,
      interes: Number(interes.toFixed(2)),
      neto: Number(neto.toFixed(2)),
      estado: form.estado,
    });
    setForm({ cliente: '', banco: '', nroCheque: '', montoNominal: '', dias: '', tasa: '45', comision: '2', estado: 'Depositado' });
    onClose();
  };

  return (
    <>
      <div className="fixed inset-0 bg-black/50 z-40" onClick={onClose} />
      <div className="fixed inset-y-0 right-0 w-full md:w-[480px] bg-premium-dark border-l border-premium-muted/20 z-50 shadow-2xl flex flex-col animate-in slide-in-from-right duration-300">
        <div className="flex justify-between items-center p-6 border-b border-premium-muted/20 bg-premium-card">
          <div className="flex items-center space-x-3">
            <FileText className="text-premium-accent" size={22} />
            <h2 className="text-xl font-bold text-premium-text">Cargar Nueva Operación</h2>
          </div>
          <button onClick={onClose} className="text-premium-muted hover:text-premium-text transition-colors p-2 rounded-full hover:bg-premium-dark">
            <X size={20} />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto p-6">
          <form id="op-form" onSubmit={handleSubmit} className="space-y-5">
            {[
              { label: 'Cliente / Razón Social', name: 'cliente', placeholder: 'Ej: Empresa Alpha S.A.', icon: <User size={16} />, type: 'text' },
              { label: 'Banco Emisor', name: 'banco', placeholder: 'Ej: Galicia', icon: <FileDigit size={16} />, type: 'text' },
              { label: 'Número de Cheque', name: 'nroCheque', placeholder: 'Ej: 000123456', icon: <FileDigit size={16} />, type: 'text' },
              { label: 'Monto Nominal ($)', name: 'montoNominal', placeholder: 'Ej: 500000', icon: <DollarSign size={16} />, type: 'number' },
              { label: 'Días al Vencimiento', name: 'dias', placeholder: 'Ej: 30', icon: <FileDigit size={16} />, type: 'number' },
              { label: 'Tasa TNA (%)', name: 'tasa', placeholder: 'Ej: 45', icon: <DollarSign size={16} />, type: 'number' },
              { label: 'Comisión (%)', name: 'comision', placeholder: 'Ej: 2', icon: <DollarSign size={16} />, type: 'number' },
            ].map(({ label, name, placeholder, icon, type }) => (
              <div key={name}>
                <label className="block text-sm font-medium text-premium-muted mb-2 flex items-center space-x-2">
                  {icon}<span>{label}</span>
                </label>
                <input
                  type={type}
                  required
                  className="w-full bg-premium-card border border-premium-muted/30 rounded-lg px-4 py-3 text-premium-text focus:border-premium-accent outline-none transition-colors"
                  placeholder={placeholder}
                  value={(form as any)[name]}
                  onChange={(e) => setForm({ ...form, [name]: e.target.value })}
                />
              </div>
            ))}

            <div>
              <label className="block text-sm font-medium text-premium-muted mb-2">Estado</label>
              <select
                className="w-full bg-premium-card border border-premium-muted/30 rounded-lg px-4 py-3 text-premium-text focus:border-premium-accent outline-none transition-colors"
                value={form.estado}
                onChange={(e) => setForm({ ...form, estado: e.target.value })}
              >
                {['Depositado', 'En Cartera', 'Cobrado', 'Rechazado', 'Endosado'].map(s => (
                  <option key={s} value={s}>{s}</option>
                ))}
              </select>
            </div>
          </form>
        </div>

        <div className="p-6 border-t border-premium-muted/20 bg-premium-card flex gap-3">
          <button type="button" onClick={onClose} className="flex-1 border border-premium-muted/30 text-premium-text font-semibold py-3 rounded-xl hover:bg-premium-muted/10 transition-colors">
            Cancelar
          </button>
          <button type="submit" form="op-form" className="flex-1 bg-premium-accent hover:bg-blue-600 text-white font-semibold py-3 rounded-xl flex items-center justify-center space-x-2 transition-colors">
            <Save size={18} />
            <span>Registrar Operación</span>
          </button>
        </div>
      </div>
    </>
  );
}

export default function Reportes() {
  const [historial, setHistorial] = useState<OperacionHistorial[]>(INITIAL_HISTORIAL);
  const [isNuevaOpOpen, setIsNuevaOpOpen] = useState(false);
  const [isNuevoClienteOpen, setIsNuevoClienteOpen] = useState(false);

  const exportarExcel = () => {
    const cabeceras = ['Fecha Operacion', 'Cliente', 'Banco', 'Nro Cheque', 'Monto Nominal', 'Dias', 'Tasa TNA %', 'Comision', 'Interes', 'Neto Entregado', 'Estado'];
    const filas = historial.map(row => [row.fechaOperacion, row.cliente, row.banco, row.nroCheque, row.montoNominal, row.dias, row.tasa, row.comision, row.interes, row.neto, row.estado]);
    const contenidoCSV = [cabeceras.join(','), ...filas.map(fila => fila.map(celda => `"${celda}"`).join(','))].join('\n');
    const blob = new Blob([contenidoCSV], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', `Reporte_Operaciones_${format(new Date(), 'yyyy-MM-dd')}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="space-y-6 max-w-7xl mx-auto pb-8 animate-in fade-in duration-500">
      {/* Header */}
      <header className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold text-premium-text">Reportes e Historial</h1>
          <p className="text-premium-muted mt-1">Visualización tabular de operaciones con opción de exportación.</p>
        </div>
        <button
          onClick={exportarExcel}
          className="bg-green-600 hover:bg-green-700 text-white font-semibold py-3 px-5 rounded-xl transition-all shadow-lg flex items-center space-x-2"
        >
          <Download size={20} />
          <span>Exportar a Excel (CSV)</span>
        </button>
      </header>

      {/* Atajos rápidos */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <button
          onClick={() => setIsNuevaOpOpen(true)}
          className="group flex items-center space-x-4 bg-premium-card border border-premium-accent/30 hover:border-premium-accent/70 rounded-xl p-5 transition-all hover:bg-premium-accent/5 text-left"
        >
          <div className="p-3 rounded-lg bg-premium-accent/10 text-premium-accent group-hover:bg-premium-accent/20 transition-colors shrink-0">
            <PlusCircle size={24} />
          </div>
          <div>
            <p className="font-semibold text-premium-text">Cargar Nueva Operación</p>
            <p className="text-sm text-premium-muted mt-0.5">Registrar un cheque en el historial directamente.</p>
          </div>
        </button>

        <button
          onClick={() => setIsNuevoClienteOpen(true)}
          className="group flex items-center space-x-4 bg-premium-card border border-premium-muted/20 hover:border-green-500/50 rounded-xl p-5 transition-all hover:bg-green-500/5 text-left"
        >
          <div className="p-3 rounded-lg bg-green-500/10 text-green-500 group-hover:bg-green-500/20 transition-colors shrink-0">
            <UserPlus size={24} />
          </div>
          <div>
            <p className="font-semibold text-premium-text">Agregar Nuevo Cliente</p>
            <p className="text-sm text-premium-muted mt-0.5">Dar de alta un cliente en la cartera desde aquí.</p>
          </div>
        </button>
      </div>

      {/* Tabla estilo Excel */}
      <div className="bg-premium-card rounded-xl border border-premium-muted/20 overflow-hidden shadow-sm">
        {/* Barra de herramientas de la tabla */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-premium-muted/20">
          <p className="text-sm font-medium text-premium-muted">{historial.length} operaciones registradas</p>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-sm text-left text-premium-text">
            <thead className="text-xs text-premium-muted uppercase bg-premium-dark/50 border-b border-premium-muted/20">
              <tr>
                <th scope="col" className="px-6 py-4 font-semibold">Fecha</th>
                <th scope="col" className="px-6 py-4 font-semibold">Cliente</th>
                <th scope="col" className="px-6 py-4 font-semibold">Banco / N°</th>
                <th scope="col" className="px-6 py-4 font-semibold text-right">Nominal</th>
                <th scope="col" className="px-6 py-4 font-semibold text-right">Días</th>
                <th scope="col" className="px-6 py-4 font-semibold text-right">TNA %</th>
                <th scope="col" className="px-6 py-4 font-semibold text-right">Comisión</th>
                <th scope="col" className="px-6 py-4 font-semibold text-right">Interés</th>
                <th scope="col" className="px-6 py-4 font-semibold text-right">Neto Entregado</th>
                <th scope="col" className="px-6 py-4 font-semibold">Estado</th>
              </tr>
            </thead>
            <tbody>
              {historial.map((row) => (
                <tr key={row.id} className="border-b border-premium-muted/10 hover:bg-premium-dark/30 transition-colors group">
                  <td className="px-6 py-3">{format(new Date(row.fechaOperacion), 'dd/MM/yyyy')}</td>
                  <td className="px-6 py-3 font-medium">{row.cliente}</td>
                  <td className="px-6 py-3">
                    {row.banco}
                    <span className="block text-xs text-premium-muted">{row.nroCheque}</span>
                  </td>
                  <td className="px-6 py-3 text-right font-medium text-premium-accent">${row.montoNominal.toLocaleString('es-AR')}</td>
                  <td className="px-6 py-3 text-right">{row.dias}</td>
                  <td className="px-6 py-3 text-right">{row.tasa}%</td>
                  <td className="px-6 py-3 text-right text-premium-danger">-${row.comision.toLocaleString('es-AR')}</td>
                  <td className="px-6 py-3 text-right text-premium-danger">-${row.interes.toLocaleString('es-AR')}</td>
                  <td className="px-6 py-3 text-right font-bold text-premium-success">${row.neto.toLocaleString('es-AR')}</td>
                  <td className="px-6 py-3">
                    <span className={`px-2 py-1 rounded-md text-xs font-semibold ${
                      row.estado === 'Cobrado' ? 'bg-green-500/10 text-green-500' :
                      row.estado === 'Rechazado' ? 'bg-premium-danger/10 text-premium-danger' :
                      'bg-premium-accent/10 text-premium-accent'
                    }`}>
                      {row.estado}
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
            <p className="font-medium">No hay operaciones registradas.</p>
            <button onClick={() => setIsNuevaOpOpen(true)} className="mt-4 text-premium-accent hover:underline text-sm">
              + Cargar la primera operación
            </button>
          </div>
        )}
      </div>

      {/* Drawers */}
      <NuevaOperacionDrawer
        isOpen={isNuevaOpOpen}
        onClose={() => setIsNuevaOpOpen(false)}
        onSave={(op) => setHistorial([op, ...historial])}
      />
      <ClienteFormDrawer
        isOpen={isNuevoClienteOpen}
        onClose={() => setIsNuevoClienteOpen(false)}
        onSave={() => setIsNuevoClienteOpen(false)}
      />
    </div>
  );
}
