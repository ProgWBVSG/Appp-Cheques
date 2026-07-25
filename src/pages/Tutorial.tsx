import { useState } from 'react';
import { HelpCircle, ChevronDown, Bell, Users, Calculator, LayoutDashboard } from 'lucide-react';

const MODULES = [
  {
    id: 'dashboard',
    title: 'Dashboard y Alertas',
    icon: LayoutDashboard,
    color: 'text-blue-500',
    bg: 'bg-blue-500/10 border-blue-500/20',
    content: (
      <div className="space-y-4 text-premium-muted text-base leading-relaxed">
        <p>El <strong>Dashboard</strong> es la pantalla principal. Acá vas a ver un resumen rápido de cómo está el negocio hoy.</p>
        <ul className="list-disc pl-5 space-y-2">
          <li>Las <strong className="text-premium-danger">Alertas Rojas</strong> te avisan de cosas urgentes: cheques rechazados o clientes que se pasaron de su límite.</li>
          <li>Las <strong className="text-premium-warning">Alertas Amarillas</strong> te muestran los cheques que vencen hoy para que no te olvides de cobrarlos.</li>
        </ul>
        <p>Desde estas alertas tenés botones grandes para mandar un <strong>WhatsApp</strong> o ir directo a la ficha del cliente con un solo toque.</p>
      </div>
    ),
  },
  {
    id: 'clientes',
    title: 'Gestión de Clientes',
    icon: Users,
    color: 'text-emerald-500',
    bg: 'bg-emerald-500/10 border-emerald-500/20',
    content: (
      <div className="space-y-4 text-premium-muted text-base leading-relaxed">
        <p>En la pestaña <strong>Clientes</strong> podés buscar rápido a cualquier persona por nombre o CUIT.</p>
        <ul className="list-disc pl-5 space-y-2">
          <li><strong>Nuevo Cliente:</strong> Tocá el botón azul arriba para agregar a alguien y definirle su "Límite Operativo" (cuánta plata le aguantás).</li>
          <li><strong>Barra de Deuda:</strong> En cada tarjeta hay una barra de color. Si está <span className="text-premium-accent font-bold">azul</span>, está todo bien. Si se pone <span className="text-premium-danger font-bold">roja</span>, significa que el cliente te debe más de lo que le permitiste.</li>
          <li><strong>Nueva Operación:</strong> Tocando este botón vas directo a cargarle un cheque sin tener que volver a escribir su nombre.</li>
        </ul>
      </div>
    ),
  },
  {
    id: 'calculadora',
    title: 'Calculadora y Simulador',
    icon: Calculator,
    color: 'text-purple-500',
    bg: 'bg-purple-500/10 border-purple-500/20',
    content: (
      <div className="space-y-4 text-premium-muted text-base leading-relaxed">
        <p>La <strong>Calculadora</strong> hace todo el trabajo matemático por vos en tiempo real.</p>
        <ul className="list-disc pl-5 space-y-2">
          <li><strong>Conversor:</strong> Cambiá de pesos a cualquier dólar (Blue, MEP) o Euros. Se actualiza solo de internet.</li>
          <li><strong>Simulador de Cheques:</strong> Poné el monto, cuándo vence y la tasa. Te dice exacto cuánta plata en mano le tenés que dar al cliente.</li>
          <li><strong>Botón Mágico:</strong> Si el cálculo te cierra, tocá el botón azul gigante que dice <strong>"Usar estos datos"</strong>. Te lleva a la pantalla de guardar el cheque con todos los números ya cargados para que no tipees nada.</li>
        </ul>
      </div>
    ),
  },
  {
    id: 'recordatorios',
    title: 'Campanita de Recordatorios',
    icon: Bell,
    color: 'text-orange-500',
    bg: 'bg-orange-500/10 border-orange-500/20',
    content: (
      <div className="space-y-4 text-premium-muted text-base leading-relaxed">
        <p>Olvidate de los papelitos sueltos. Usá los <strong>Recordatorios</strong>.</p>
        <ul className="list-disc pl-5 space-y-2">
          <li>Vas a ver una <strong>Campana flotante</strong> abajo a la derecha de tu pantalla. Si titila en rojo, tenés cosas por hacer.</li>
          <li>Para agregar una nota a un Cliente, buscá los <strong className="text-premium-text">tres puntitos (⋮)</strong> en su tarjeta y tocá ahí.</li>
          <li>Para agregar una nota a un Cheque en la Agenda, tocá el ícono de <strong className="text-premium-text">lista (☰)</strong> al lado del monto.</li>
          <li>Cuando termines la tarea (ej: ya llamaste al banco), abrís la campana y tocás <strong>"Marcar Listo"</strong>.</li>
        </ul>
      </div>
    ),
  },
];

export default function Tutorial() {
  const [expanded, setExpanded] = useState<string | null>('dashboard');

  const toggle = (id: string) => {
    setExpanded(expanded === id ? null : id);
  };

  return (
    <div className="space-y-6 max-w-3xl mx-auto pb-12 animate-in fade-in duration-500">
      <header className="flex items-center space-x-4">
        <div className="p-3 bg-premium-accent/10 rounded-2xl text-premium-accent">
          <HelpCircle size={32} />
        </div>
        <div>
          <h1 className="text-3xl font-bold text-premium-text">Tutorial Rápido</h1>
          <p className="text-premium-muted mt-1 text-lg">Aprendé a usar las funciones clave del sistema.</p>
        </div>
      </header>

      <div className="space-y-4 mt-8">
        {MODULES.map((mod) => {
          const isExpanded = expanded === mod.id;
          const Icon = mod.icon;

          return (
            <div 
              key={mod.id} 
              className={`bg-premium-card rounded-2xl border transition-colors overflow-hidden
                ${isExpanded ? 'border-premium-accent/40 shadow-lg' : 'border-premium-muted/20 hover:border-premium-muted/40'}
              `}
            >
              <button
                onClick={() => toggle(mod.id)}
                className="w-full flex items-center justify-between p-5 min-h-[72px] text-left transition-colors focus:outline-none"
              >
                <div className="flex items-center space-x-4">
                  <div className={`p-2.5 rounded-xl border ${mod.bg}`}>
                    <Icon size={24} className={mod.color} />
                  </div>
                  <span className="text-xl font-bold text-premium-text">{mod.title}</span>
                </div>
                <div className={`text-premium-muted transition-transform duration-300 p-2 ${isExpanded ? 'rotate-180' : ''}`}>
                  <ChevronDown size={28} />
                </div>
              </button>
              
              <div 
                className={`transition-all duration-300 ease-in-out ${
                  isExpanded ? 'max-h-[800px] opacity-100' : 'max-h-0 opacity-0'
                }`}
              >
                <div className="p-6 pt-2 border-t border-premium-muted/10">
                  {mod.content}
                </div>
              </div>
            </div>
          );
        })}
      </div>

      <div className="mt-8 bg-premium-accent/10 border border-premium-accent/20 rounded-2xl p-6 text-center">
        <p className="text-lg text-premium-text font-semibold">
          ¿Todo listo? Podés volver a esta sección cuando quieras usando el botón de ayuda.
        </p>
      </div>
    </div>
  );
}
