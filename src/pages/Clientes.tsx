import { useState } from 'react';
import { Search, MoreVertical, Phone, FileText } from 'lucide-react';
import { abrirWhatsApp } from '../utils/whatsapp';
import { useNavigate } from 'react-router-dom';
import ClienteFormDrawer from '../components/ClienteFormDrawer';
import FichaClienteDrawer from '../components/FichaClienteDrawer';
import RecordatorioDrawer from '../components/RecordatorioDrawer';
import { useRecordatorios } from '../context/RecordatoriosContext';

import { useLiveQuery } from 'dexie-react-hooks';
import { db } from '../db/db';

export default function Clientes() {
  const [busqueda, setBusqueda] = useState('');
  const navigate = useNavigate();
  
  // Drawer states
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [fichaSeleccionada, setFichaSeleccionada] = useState<any | null>(null);
  const [recordatorioTarget, setRecordatorioTarget] = useState<any | null>(null);

  const { recordatorios } = useRecordatorios();

  // Cargar clientes desde Dexie calculando deuda y cheques activos en tiempo real
  const clientes = useLiveQuery(async () => {
    const todosLosClientes = await db.clientes.toArray();
    const todosLosCheques = await db.cheques.toArray();

    return todosLosClientes.map(cliente => {
      const chequesDelCliente = todosLosCheques.filter(ch => ch.clienteId === cliente.id);
      
      const chequesActivos = chequesDelCliente.filter(
        ch => ch.estado === 'en_cartera' || ch.estado === 'depositado'
      );
      
      const chequesRechazados = chequesDelCliente.filter(
        ch => ch.estado === 'rechazado'
      );

      // Deuda activa: suma de monto de cheques en cartera, depositados o rechazados (que aún debe)
      const deuda = [...chequesActivos, ...chequesRechazados].reduce((acc, ch) => acc + ch.monto, 0);

      return {
        ...cliente,
        deuda,
        chequesActivos: chequesActivos.length
      };
    }).sort((a, b) => a.nombre.localeCompare(b.nombre));
  });

  const clientesFiltrados = (clientes || []).filter(c => 
    c.nombre.toLowerCase().includes(busqueda.toLowerCase()) || 
    c.cuit.includes(busqueda)
  );

  const handleGuardarCliente = async (nuevoCliente: any) => {
    await db.clientes.add(nuevoCliente);
  };

  const handleWhatsApp = (telefono: string, nombre: string) => {
    const mensaje = `Hola ${nombre}, te escribo por el estado de tus operaciones...`;
    abrirWhatsApp(telefono, mensaje);
  };

  return (
    <div className="space-y-6 max-w-7xl mx-auto pb-8 animate-in fade-in duration-500">
      <header className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold text-premium-text">Cartera de Clientes</h1>
          <p className="text-premium-muted mt-1">Administración de clientes y límites operativos.</p>
        </div>
        <button 
          onClick={() => setIsFormOpen(true)}
          className="bg-premium-accent hover:bg-blue-600 text-white font-semibold py-3 px-5 min-h-[48px] rounded-xl transition-all shadow-lg shadow-premium-accent/20 flex items-center space-x-2"
        >
          <span>+ Nuevo Cliente</span>
        </button>
      </header>

      {/* Buscador */}
      <div className="relative">
        <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-premium-muted" size={20} />
        <input 
          type="text" 
          placeholder="Buscar por nombre o CUIT..."
          className="w-full bg-premium-card border border-premium-muted/20 rounded-xl pl-12 pr-4 py-4 min-h-[56px] text-base text-premium-text focus:border-premium-accent outline-none transition-colors"
          value={busqueda}
          onChange={(e) => setBusqueda(e.target.value)}
        />
      </div>

      {/* Grilla de Clientes */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {clientesFiltrados.map((cliente) => (
          <div key={cliente.id} className="bg-premium-card rounded-xl border border-premium-muted/20 p-6 flex flex-col hover:border-premium-muted/40 transition-colors">
            <div className="flex justify-between items-start mb-4">
              <div className="flex-1">
                <div className="flex items-center space-x-2">
                  <h3 className="text-xl font-bold text-premium-text">{cliente.nombre}</h3>
                  {recordatorios.some(r => r.tipo === 'cliente' && r.referenciaId === cliente.id && r.estado === 'pendiente') && (
                    <div className="w-2.5 h-2.5 rounded-full bg-premium-warning shadow-[0_0_8px_rgba(234,179,8,0.6)] animate-pulse" />
                  )}
                </div>
                <p className="text-base text-premium-muted">CUIT: {cliente.cuit}</p>
              </div>
              <button 
                onClick={() => setRecordatorioTarget(cliente)}
                className="text-premium-muted hover:text-premium-warning p-2 transition-colors"
                title="Añadir Recordatorio"
              >
                <MoreVertical size={24} />
              </button>
            </div>

            <div className="space-y-4 mb-6 flex-1">
              <div className="flex justify-between text-base">
                <span className="text-premium-muted">Límite Operativo</span>
                <span className="font-semibold text-premium-text">${cliente.limite.toLocaleString('es-AR')}</span>
              </div>
              <div className="flex justify-between text-base">
                <span className="text-premium-muted">Deuda Activa</span>
                <span className={`font-semibold ${cliente.deuda >= cliente.limite ? 'text-premium-danger' : 'text-premium-warning'}`}>
                  ${cliente.deuda.toLocaleString('es-AR')}
                </span>
              </div>
              
              <div className="w-full bg-premium-dark rounded-full h-2 mt-2 overflow-hidden">
                <div 
                  className={`h-2 rounded-full ${cliente.deuda >= cliente.limite ? 'bg-premium-danger' : 'bg-premium-accent'}`}
                  style={{ width: `${Math.min((cliente.deuda / cliente.limite) * 100, 100)}%` }}
                ></div>
              </div>

              <div className="pt-2">
                <span className="inline-flex items-center px-3 py-1 rounded-md text-sm font-medium bg-premium-dark text-premium-muted border border-premium-muted/10">
                  {cliente.chequesActivos} cheques circulando
                </span>
              </div>
            </div>

            <div className="flex flex-col gap-3 mt-auto pt-4 border-t border-premium-muted/10">
              <div className="flex space-x-3">
                <button 
                  onClick={() => handleWhatsApp(cliente.telefono, cliente.nombre)}
                  className="flex-1 bg-green-500/10 text-green-500 hover:bg-green-500/20 font-semibold py-3 min-h-[44px] text-sm rounded-lg flex items-center justify-center space-x-2 transition-colors"
                >
                  <Phone size={18} />
                  <span>WhatsApp</span>
                </button>
                <button 
                  onClick={() => setFichaSeleccionada(cliente)}
                  className="flex-1 bg-premium-dark text-premium-text hover:bg-premium-muted/10 border border-premium-muted/20 font-semibold py-3 min-h-[44px] text-sm rounded-lg transition-colors"
                >
                  Ficha
                </button>
              </div>
              <button
                onClick={() => navigate('/cheques', { state: { nombreCliente: cliente.nombre } })}
                className="w-full bg-premium-accent/10 text-premium-accent hover:bg-premium-accent/20 font-semibold py-3 min-h-[48px] text-base rounded-lg flex items-center justify-center space-x-2 transition-colors border border-premium-accent/20"
              >
                <FileText size={18} />
                <span>+ Nueva Operación</span>
              </button>
            </div>
          </div>
        ))}
      </div>

      <ClienteFormDrawer 
        isOpen={isFormOpen} 
        onClose={() => setIsFormOpen(false)} 
        onSave={handleGuardarCliente}
      />

      <FichaClienteDrawer 
        isOpen={!!fichaSeleccionada} 
        cliente={fichaSeleccionada}
        onClose={() => setFichaSeleccionada(null)} 
      />

      <RecordatorioDrawer
        isOpen={!!recordatorioTarget}
        onClose={() => setRecordatorioTarget(null)}
        tipo="cliente"
        referenciaId={recordatorioTarget?.id}
        tituloSugerido={`Recordatorio: ${recordatorioTarget?.nombre}`}
      />

      {clientesFiltrados.length === 0 && (
        <div className="text-center py-12 text-premium-muted">
          No se encontraron clientes con esa búsqueda.
        </div>
      )}
    </div>
  );
}
