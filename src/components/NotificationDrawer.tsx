import { X, Check, Bell, User, FileText } from 'lucide-react';
import { useRecordatorios } from '../context/RecordatoriosContext';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';

interface NotificationDrawerProps {
  isOpen: boolean;
  onClose: () => void;
}

export default function NotificationDrawer({ isOpen, onClose }: NotificationDrawerProps) {
  const { recordatorios, completarRecordatorio } = useRecordatorios();
  const pendientes = recordatorios.filter(r => r.estado === 'pendiente');

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex justify-end">
      {/* Overlay */}
      <div 
        className="fixed inset-0 bg-black/60 backdrop-blur-sm animate-in fade-in duration-300"
        onClick={onClose}
      />
      
      {/* Drawer */}
      <div className="relative w-full max-w-md bg-premium-dark h-full shadow-2xl flex flex-col animate-in slide-in-from-right duration-300 border-l border-premium-muted/20">
        <div className="flex items-center justify-between p-6 border-b border-premium-muted/10 bg-premium-card">
          <div className="flex items-center space-x-3">
            <div className="relative">
              <Bell size={24} className="text-premium-text" />
              {pendientes.length > 0 && (
                <span className="absolute -top-1 -right-1 w-3 h-3 bg-premium-danger rounded-full animate-pulse border-2 border-premium-card" />
              )}
            </div>
            <h2 className="text-xl font-bold text-premium-text">Recordatorios</h2>
          </div>
          <button 
            onClick={onClose}
            className="p-2 text-premium-muted hover:text-white hover:bg-premium-muted/20 rounded-full transition-colors"
          >
            <X size={24} />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto p-4 space-y-4">
          {pendientes.length === 0 ? (
            <div className="h-full flex flex-col items-center justify-center text-premium-muted space-y-4">
              <Bell size={48} className="opacity-20" />
              <p className="text-lg">No hay recordatorios pendientes</p>
            </div>
          ) : (
            pendientes.map(rec => (
              <div key={rec.id} className="bg-premium-card border border-premium-muted/20 rounded-xl p-4 flex flex-col gap-3">
                <div className="flex justify-between items-start">
                  <div className="flex items-center space-x-2">
                    <span className={`p-1.5 rounded-lg ${rec.tipo === 'cliente' ? 'bg-blue-500/20 text-blue-500' : 'bg-orange-500/20 text-orange-500'}`}>
                      {rec.tipo === 'cliente' ? <User size={16} /> : <FileText size={16} />}
                    </span>
                    <span className="text-xs font-semibold text-premium-muted uppercase tracking-wider">
                      {rec.tipo}
                    </span>
                  </div>
                  <span className="text-xs text-premium-muted">
                    {format(new Date(rec.fechaCreacion), "d MMM, HH:mm", { locale: es })}
                  </span>
                </div>
                
                <div>
                  <h4 className="text-base font-bold text-premium-text">{rec.titulo}</h4>
                  <p className="text-sm text-premium-muted mt-1 leading-relaxed">{rec.texto}</p>
                </div>

                <div className="flex justify-end pt-2 border-t border-premium-muted/10">
                  <button
                    onClick={() => completarRecordatorio(rec.id!)}
                    className="flex items-center space-x-1.5 bg-premium-success/20 hover:bg-premium-success/30 text-premium-success text-xs font-semibold px-3 py-2 rounded-lg transition-colors"
                  >
                    <Check size={18} />
                    <span>Marcar Listo</span>
                  </button>
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
}
