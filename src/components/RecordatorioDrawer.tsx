import { useState, useEffect } from 'react';
import { X, Save } from 'lucide-react';
import { useRecordatorios } from '../context/RecordatoriosContext';

interface RecordatorioDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  tipo: 'cliente' | 'cheque';
  referenciaId?: number;
  tituloSugerido?: string;
}

export default function RecordatorioDrawer({ isOpen, onClose, tipo, referenciaId, tituloSugerido }: RecordatorioDrawerProps) {
  const { agregarRecordatorio } = useRecordatorios();
  const [titulo, setTitulo] = useState('');
  const [texto, setTexto] = useState('');

  useEffect(() => {
    if (isOpen) {
      setTitulo(tituloSugerido || '');
      setTexto('');
    }
  }, [isOpen, tituloSugerido]);

  if (!isOpen) return null;

  const handleSave = () => {
    if (!titulo.trim() || !texto.trim()) return;
    agregarRecordatorio({
      tipo,
      referenciaId,
      titulo: titulo.trim(),
      texto: texto.trim()
    });
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex justify-end">
      {/* Overlay */}
      <div 
        className="fixed inset-0 bg-black/60 backdrop-blur-sm animate-in fade-in duration-300"
        onClick={onClose}
      />
      
      {/* Drawer */}
      <div className="relative w-full max-w-md bg-premium-dark h-full shadow-2xl flex flex-col animate-in slide-in-from-right duration-300">
        <div className="flex items-center justify-between p-6 border-b border-premium-muted/10 bg-premium-card">
          <h2 className="text-xl font-bold text-premium-text">Nuevo Recordatorio</h2>
          <button 
            onClick={onClose}
            className="p-2 text-premium-muted hover:text-white hover:bg-premium-muted/20 rounded-full transition-colors"
          >
            <X size={24} />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto p-6 space-y-6">
          <div>
            <label className="block text-base font-semibold text-premium-muted mb-2">Título</label>
            <input 
              type="text" 
              value={titulo}
              onChange={(e) => setTitulo(e.target.value)}
              className="w-full bg-premium-card border border-premium-muted/20 rounded-xl px-4 py-3 min-h-[56px] text-base text-premium-text focus:border-premium-accent outline-none transition-colors"
              placeholder="Ej: Llamar mañana"
            />
          </div>
          <div>
            <label className="block text-base font-semibold text-premium-muted mb-2">Nota / Detalle</label>
            <textarea 
              value={texto}
              onChange={(e) => setTexto(e.target.value)}
              className="w-full bg-premium-card border border-premium-muted/20 rounded-xl px-4 py-4 min-h-[150px] text-base text-premium-text focus:border-premium-accent outline-none transition-colors resize-none"
              placeholder="Escribe el recordatorio aquí..."
            />
          </div>
        </div>

        <div className="p-6 bg-premium-card border-t border-premium-muted/10">
          <button
            onClick={handleSave}
            disabled={!titulo.trim() || !texto.trim()}
            className="w-full bg-premium-accent hover:bg-blue-600 disabled:opacity-50 disabled:hover:bg-premium-accent text-white font-semibold py-3 min-h-[56px] text-lg rounded-xl flex items-center justify-center space-x-2 transition-all shadow-lg shadow-premium-accent/20"
          >
            <Save size={22} />
            <span>Guardar Recordatorio</span>
          </button>
        </div>
      </div>
    </div>
  );
}
