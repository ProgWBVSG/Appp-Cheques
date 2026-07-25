import { X, TrendingUp, AlertCircle, FileText, Calendar, CheckCircle2 } from 'lucide-react';
import { format } from 'date-fns';

interface FichaClienteDrawerProps {
  cliente: any | null;
  isOpen: boolean;
  onClose: () => void;
}

import { useLiveQuery } from 'dexie-react-hooks';
import { db } from '../db/db';

export default function FichaClienteDrawer({ cliente, isOpen, onClose }: FichaClienteDrawerProps) {
  if (!isOpen || !cliente) return null;

  const porcentajeUso = (cliente.deuda / cliente.limite) * 100;
  const estaAlLimite = porcentajeUso >= 90;

  const historial = useLiveQuery(async () => {
    if (!cliente?.id) return [];
    const cheques = await db.cheques.where('clienteId').equals(cliente.id).toArray();
    return cheques.sort((a, b) => new Date(b.fechaCobro).getTime() - new Date(a.fechaCobro).getTime());
  }, [cliente?.id]) || [];

  const handleEliminar = async () => {
    if (window.confirm(`¿Estás seguro que querés eliminar a ${cliente.nombre}? Esta acción borrará al cliente de tu lista.`)) {
      await db.clientes.delete(cliente.id);
      onClose();
    }
  };

  return (
    <>
      <div className="fixed inset-0 bg-black/50 z-40 transition-opacity" onClick={onClose} />
      
      <div className="fixed inset-y-0 right-0 w-full md:w-[500px] bg-premium-dark border-l border-premium-muted/20 z-50 shadow-2xl flex flex-col animate-in slide-in-from-right duration-300">
        <div className="flex justify-between items-center p-6 border-b border-premium-muted/20 bg-premium-card">
          <div>
            <h2 className="text-xl font-bold text-premium-text">{cliente.nombre}</h2>
            <p className="text-sm text-premium-muted mt-1">CUIT: {cliente.cuit}</p>
          </div>
          <button onClick={onClose} className="text-premium-muted hover:text-premium-text transition-colors p-2 rounded-full hover:bg-premium-dark">
            <X size={20} />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto p-6 space-y-8">
          
          {/* Métricas del Cliente */}
          <section className="space-y-4">
            <h3 className="text-sm font-semibold text-premium-muted uppercase tracking-wider flex items-center space-x-2">
              <TrendingUp size={16} />
              <span>Estado Financiero</span>
            </h3>
            
            <div className="bg-premium-card p-5 rounded-xl border border-premium-muted/20 space-y-4">
              <div>
                <div className="flex justify-between text-sm mb-1">
                  <span className="text-premium-muted">Límite Operativo Asignado</span>
                  <span className="font-medium text-premium-text">${cliente.limite.toLocaleString('es-AR')}</span>
                </div>
                <div className="flex justify-between text-sm mb-1">
                  <span className="text-premium-muted">Deuda Activa Actual</span>
                  <span className={`font-bold ${estaAlLimite ? 'text-premium-danger' : 'text-premium-warning'}`}>
                    ${cliente.deuda.toLocaleString('es-AR')}
                  </span>
                </div>
                
                <div className="w-full bg-premium-dark rounded-full h-2 mt-3 overflow-hidden">
                  <div 
                    className={`h-2 rounded-full transition-all duration-500 ${estaAlLimite ? 'bg-premium-danger' : 'bg-premium-accent'}`}
                    style={{ width: `${Math.min(porcentajeUso, 100)}%` }}
                  ></div>
                </div>
                <p className="text-xs text-right mt-2 text-premium-muted">
                  {porcentajeUso.toFixed(1)}% del límite utilizado
                </p>
              </div>
            </div>
          </section>

          {/* Historial Reciente */}
          <section className="space-y-4">
            <h3 className="text-sm font-semibold text-premium-muted uppercase tracking-wider flex items-center space-x-2">
              <FileText size={16} />
              <span>Historial de Operaciones</span>
            </h3>
            
            <div className="space-y-3">
              {historial.map((op) => (
                <div key={op.id} className="bg-premium-card p-4 rounded-xl border border-premium-muted/20 flex items-center justify-between">
                  <div className="flex items-start space-x-3">
                    <div className={`p-2 rounded-lg ${
                      op.estado === 'cobrado' ? 'bg-green-500/10 text-green-500' :
                      op.estado === 'rechazado' ? 'bg-premium-danger/10 text-premium-danger' :
                      'bg-premium-accent/10 text-premium-accent'
                    }`}>
                      {op.estado === 'cobrado' && <CheckCircle2 size={18} />}
                      {op.estado === 'rechazado' && <AlertCircle size={18} />}
                      {op.estado !== 'cobrado' && op.estado !== 'rechazado' && <Calendar size={18} />}
                    </div>
                    <div>
                      <p className="font-semibold text-premium-text text-sm">{op.banco}</p>
                      <p className="text-xs text-premium-muted mt-0.5">Vto: {format(new Date(op.fechaCobro), 'dd/MM/yyyy')} | N°: {op.nroCheque}</p>
                    </div>
                  </div>
                  <div className="text-right">
                    <span className="font-bold text-premium-text block">${op.monto.toLocaleString('es-AR')}</span>
                    <span className="text-[10px] text-premium-muted uppercase">{op.estado.replace('_', ' ')}</span>
                  </div>
                </div>
              ))}
              {historial.length === 0 && (
                <p className="text-sm text-premium-muted text-center py-4">No hay operaciones registradas.</p>
              )}
            </div>
          </section>

          {/* Zona de Peligro */}
          <section className="pt-6 border-t border-premium-danger/20">
            <button 
              onClick={handleEliminar}
              className="w-full flex items-center justify-center space-x-2 bg-premium-danger/10 text-premium-danger hover:bg-premium-danger hover:text-white transition-colors py-4 rounded-xl font-semibold border border-premium-danger/30"
            >
              <X size={18} />
              <span>Eliminar Cliente</span>
            </button>
          </section>

        </div>
      </div>
    </>
  );
}
