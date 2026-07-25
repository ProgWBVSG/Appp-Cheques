import { X, Save, User, Phone, FileDigit, DollarSign } from 'lucide-react';
import { useState } from 'react';

interface ClienteFormDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (cliente: any) => void;
}

export default function ClienteFormDrawer({ isOpen, onClose, onSave }: ClienteFormDrawerProps) {
  const [formData, setFormData] = useState({
    nombre: '',
    cuit: '',
    telefono: '',
    limite: ''
  });

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSave({
      ...formData,
      limite: Number(formData.limite)
    });
    setFormData({ nombre: '', cuit: '', telefono: '', limite: '' });
    onClose();
  };

  return (
    <>
      <div className="fixed inset-0 bg-black/50 z-40 transition-opacity" onClick={onClose} />
      
      <div className="fixed inset-y-0 right-0 w-full md:w-[450px] bg-premium-dark border-l border-premium-muted/20 z-50 shadow-2xl flex flex-col animate-in slide-in-from-right duration-300">
        <div className="flex justify-between items-center p-6 border-b border-premium-muted/20 bg-premium-card">
          <h2 className="text-xl font-bold text-premium-text">Nuevo Cliente</h2>
          <button onClick={onClose} className="text-premium-muted hover:text-premium-text transition-colors p-2 rounded-full hover:bg-premium-dark">
            <X size={20} />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto p-6">
          <form id="cliente-form" onSubmit={handleSubmit} className="space-y-5">
            <div>
              <label className="block text-sm font-medium text-premium-muted mb-2 flex items-center space-x-2">
                <User size={16} />
                <span>Razón Social / Nombre</span>
              </label>
              <input 
                type="text" 
                required
                className="w-full bg-premium-card border border-premium-muted/30 rounded-lg px-4 py-3 text-premium-text focus:border-premium-accent outline-none transition-colors" 
                placeholder="Ej: Empresa Alpha S.A."
                value={formData.nombre}
                onChange={(e) => setFormData({...formData, nombre: e.target.value})}
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-premium-muted mb-2 flex items-center space-x-2">
                <FileDigit size={16} />
                <span>CUIT</span>
              </label>
              <input 
                type="text" 
                required
                className="w-full bg-premium-card border border-premium-muted/30 rounded-lg px-4 py-3 text-premium-text focus:border-premium-accent outline-none transition-colors" 
                placeholder="Ej: 30-12345678-9"
                value={formData.cuit}
                onChange={(e) => setFormData({...formData, cuit: e.target.value})}
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-premium-muted mb-2 flex items-center space-x-2">
                <Phone size={16} />
                <span>Teléfono (WhatsApp)</span>
              </label>
              <input 
                type="tel" 
                required
                className="w-full bg-premium-card border border-premium-muted/30 rounded-lg px-4 py-3 text-premium-text focus:border-premium-accent outline-none transition-colors" 
                placeholder="Ej: 1123456789"
                value={formData.telefono}
                onChange={(e) => setFormData({...formData, telefono: e.target.value})}
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-premium-muted mb-2 flex items-center space-x-2">
                <DollarSign size={16} />
                <span>Límite Operativo Aprobado ($)</span>
              </label>
              <input 
                type="number" 
                required
                className="w-full bg-premium-card border border-premium-muted/30 rounded-lg px-4 py-3 text-premium-text focus:border-premium-accent outline-none transition-colors" 
                placeholder="Ej: 5000000"
                value={formData.limite}
                onChange={(e) => setFormData({...formData, limite: e.target.value})}
              />
              <p className="text-xs text-premium-muted mt-2">Este límite define el máximo de deuda activa permitida para el cliente.</p>
            </div>
          </form>
        </div>

        <div className="p-6 border-t border-premium-muted/20 bg-premium-card flex gap-3">
          <button 
            type="button"
            onClick={onClose}
            className="flex-1 bg-transparent border border-premium-muted/30 text-premium-text font-semibold py-3 px-4 rounded-xl hover:bg-premium-muted/10 transition-colors"
          >
            Cancelar
          </button>
          <button 
            type="submit"
            form="cliente-form"
            className="flex-1 bg-premium-accent hover:bg-blue-600 text-white font-semibold py-3 px-4 rounded-xl shadow-lg flex items-center justify-center space-x-2 transition-colors"
          >
            <Save size={18} />
            <span>Guardar Cliente</span>
          </button>
        </div>
      </div>
    </>
  );
}
