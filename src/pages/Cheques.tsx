import { useState, useEffect, useRef } from 'react';
import { calcularOperacionCheque } from '../utils/finance';
import { generarMensajeWhatsApp, abrirWhatsApp } from '../utils/whatsapp';
import { Calculator, Send, Save, CreditCard, Zap, User, AlertCircle } from 'lucide-react';
import { useLocation } from 'react-router-dom';
import { useLiveQuery } from 'dexie-react-hooks';
import { db } from '../db/db';

export default function Cheques() {
  const location = useLocation();
  const preloaded = (location.state as any) || {};

  const [formData, setFormData] = useState({
    nombreCliente: preloaded.nombreCliente || '',
    telefonoCliente: '',
    banco: preloaded.banco || '',
    nroCheque: '',
    montoNominal: preloaded.montoNominal || '',
    fechaEmision: preloaded.fechaEmision || new Date().toISOString().split('T')[0],
    fechaVencimiento: preloaded.fechaVencimiento || '',
    tasa: preloaded.tasa || '45',
    comision: preloaded.comision || '2',
  });

  const [calculo, setCalculo] = useState<ReturnType<typeof calcularOperacionCheque> | null>(null);
  const [guardado, setGuardado] = useState(false);

  const clientesDB = useLiveQuery(() => db.clientes.toArray()) || [];
  const chequesDB = useLiveQuery(() => db.cheques.toArray()) || [];

  // ── Autocomplete de cliente ────────────────────────────
  const [sugerencias, setSugerencias] = useState<typeof clientesDB>([]);
  const [mostrarSugerencias, setMostrarSugerencias] = useState(false);
  const autoRef = useRef<HTMLDivElement>(null);
  
  const clienteSeleccionado = clientesDB.find(c => c.nombre === formData.nombreCliente);
  
  // Calcular deuda real del cliente
  const deudaCliente = clienteSeleccionado 
    ? chequesDB.filter(ch => ch.clienteId === clienteSeleccionado.id && (ch.estado === 'en_cartera' || ch.estado === 'depositado' || ch.estado === 'rechazado'))
               .reduce((acc, ch) => acc + ch.monto, 0)
    : 0;

  const limiteDisponible = clienteSeleccionado ? clienteSeleccionado.limite - deudaCliente : null;
  const superaLimite = limiteDisponible !== null && Number(formData.montoNominal) > limiteDisponible;

  // Cerrar dropdown al click fuera
  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (autoRef.current && !autoRef.current.contains(e.target as Node)) {
        setMostrarSugerencias(false);
      }
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  const handleClienteChange = (val: string) => {
    setFormData(prev => ({ ...prev, nombreCliente: val, telefonoCliente: '' }));
    if (val.length > 0) {
      const found = clientesDB.filter(c => c.nombre.toLowerCase().includes(val.toLowerCase()));
      setSugerencias(found);
      setMostrarSugerencias(found.length > 0);
    } else {
      setSugerencias([]);
      setMostrarSugerencias(false);
    }
  };

  const seleccionarCliente = (cliente: any) => {
    setFormData(prev => ({ ...prev, nombreCliente: cliente.nombre, telefonoCliente: cliente.telefono }));
    setSugerencias([]);
    setMostrarSugerencias(false);
  };

  // ── Auto-cálculo en tiempo real ──────────────────────────
  useEffect(() => {
    const { montoNominal, fechaEmision, fechaVencimiento, tasa, comision } = formData;
    if (!montoNominal || !fechaEmision || !fechaVencimiento || !tasa || !comision) { setCalculo(null); return; }
    try {
      const r = calcularOperacionCheque(Number(montoNominal), fechaEmision, fechaVencimiento, Number(tasa), Number(comision));
      setCalculo(r.dias > 0 ? r : null);
    } catch { setCalculo(null); }
  }, [formData]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleCompartir = () => {
    if (!calculo) return;
    const mensaje = generarMensajeWhatsApp(
      formData.nombreCliente || 'Cliente', formData.banco, formData.nroCheque,
      Number(formData.montoNominal), formData.fechaVencimiento,
      calculo.dias, Number(formData.tasa), calculo.comisionMonto, calculo.netoCliente
    );
    // Si tenemos el teléfono del cliente, lo usamos directamente
    abrirWhatsApp(formData.telefonoCliente || '', mensaje);
  };

  const handleGuardar = async () => {
    if (!clienteSeleccionado) {
      alert("Por favor, seleccioná un cliente válido de la lista.");
      return;
    }
    if (!formData.banco || !formData.montoNominal || !formData.fechaVencimiento) {
      alert("Completá los campos obligatorios.");
      return;
    }

    await db.cheques.add({
      clienteId: clienteSeleccionado.id!,
      cliente: clienteSeleccionado.nombre,
      banco: formData.banco,
      nroCheque: formData.nroCheque || '-',
      monto: Number(formData.montoNominal),
      fechaCobro: new Date(formData.fechaVencimiento).toISOString(),
      estado: 'en_cartera'
    });

    setGuardado(true);
    setTimeout(() => {
      setGuardado(false);
      setFormData({
        nombreCliente: '', telefonoCliente: '', banco: '', nroCheque: '', 
        montoNominal: '', fechaEmision: new Date().toISOString().split('T')[0], 
        fechaVencimiento: '', tasa: '45', comision: '2'
      });
    }, 2500);
  };

  const inputCls = "w-full min-h-[48px] bg-premium-dark border border-premium-muted/30 rounded-lg px-4 py-3 text-base text-premium-text focus:border-premium-accent outline-none transition-colors [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none";

  return (
    <div className="space-y-6 max-w-4xl mx-auto pb-8 animate-in fade-in duration-500">
      <header className="flex items-start justify-between">
        <div>
          <h1 className="text-3xl font-bold text-premium-text">Carga de Cheques</h1>
          <p className="text-premium-muted mt-1">Simulador y registro financiero.</p>
        </div>
        <div className="flex items-center space-x-1.5 bg-premium-accent/10 text-premium-accent text-xs font-semibold px-3 py-1.5 rounded-full">
          <Zap size={12} /><span>Cálculo automático activo</span>
        </div>
      </header>

      {/* Aviso pre-carga desde Simulador */}
      {preloaded.montoNominal && (
        <div className="bg-premium-accent/10 border border-premium-accent/30 rounded-xl px-4 py-3 text-sm text-premium-accent font-medium flex items-center space-x-2">
          <Zap size={16} /><span>Datos pre-cargados desde el Simulador. Seleccioná el cliente y el banco para guardar.</span>
        </div>
      )}

      {/* Alerta de límite superado */}
      {superaLimite && clienteSeleccionado && (
        <div className="bg-premium-danger/10 border border-premium-danger/40 rounded-xl px-4 py-3 text-sm text-premium-danger font-medium flex items-center space-x-2">
          <AlertCircle size={16} />
          <span>
            <strong>{clienteSeleccionado.nombre}</strong> tiene solo{' '}
            <strong>${limiteDisponible!.toLocaleString('es-AR')}</strong> disponibles de su límite operativo.
            Esta operación lo excede.
          </span>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Formulario */}
        <div className="lg:col-span-2 bg-premium-card p-6 rounded-2xl border border-premium-muted/20">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">

            {/* ── Campo cliente con autocomplete ── */}
            <div className="md:col-span-2" ref={autoRef}>
              <label className="block text-base font-medium text-premium-muted mb-2">Cliente</label>
              <div className="relative">
                <User size={20} className="absolute left-3 top-1/2 -translate-y-1/2 text-premium-muted pointer-events-none" />
                <input
                  type="text"
                  name="nombreCliente"
                  value={formData.nombreCliente}
                  onChange={(e) => handleClienteChange(e.target.value)}
                  onFocus={() => formData.nombreCliente && setMostrarSugerencias(sugerencias.length > 0)}
                  className={`${inputCls} pl-9 ${clienteSeleccionado ? 'border-premium-success/50' : ''}`}
                  placeholder="Escribí el nombre del cliente..."
                  autoComplete="off"
                />
                {/* Dropdown de sugerencias */}
                {mostrarSugerencias && (
                  <div className="absolute z-30 top-full left-0 right-0 mt-1 bg-premium-card border border-premium-muted/30 rounded-xl shadow-xl overflow-hidden">
                    {sugerencias.map(c => {
                      const deuda = chequesDB
                        .filter(ch => ch.clienteId === c.id && (ch.estado === 'en_cartera' || ch.estado === 'depositado' || ch.estado === 'rechazado'))
                        .reduce((acc, ch) => acc + ch.monto, 0);
                      const pct = Math.round((deuda / c.limite) * 100);
                      const disponible = c.limite - deuda;
                      return (
                        <button
                          key={c.id}
                          type="button"
                          onMouseDown={() => seleccionarCliente(c)}
                          className="w-full flex items-center justify-between px-4 py-3 hover:bg-premium-dark/50 transition-colors text-left"
                        >
                          <div>
                            <p className="font-semibold text-premium-text text-sm">{c.nombre}</p>
                            <p className="text-xs text-premium-muted">CUIT: {c.cuit}</p>
                          </div>
                          <div className="text-right shrink-0 ml-4">
                            <p className="text-xs font-semibold text-premium-success">${disponible.toLocaleString('es-AR')} disp.</p>
                            <p className={`text-xs ${pct >= 90 ? 'text-premium-danger' : 'text-premium-muted'}`}>{pct}% usado</p>
                          </div>
                        </button>
                      );
                    })}
                  </div>
                )}
              </div>
              {/* Info del cliente seleccionado */}
              {clienteSeleccionado && (
                <div className="mt-2 flex items-center space-x-3 text-xs">
                  <span className="text-premium-success">✓ Cliente encontrado</span>
                  <span className="text-premium-muted">·</span>
                  <span className="text-premium-muted">
                    Disponible: <span className="font-semibold text-premium-text">${limiteDisponible!.toLocaleString('es-AR')}</span>
                  </span>
                  <span className="text-premium-muted">·</span>
                  <span className="text-premium-muted">📱 WhatsApp listo</span>
                </div>
              )}
            </div>

            <div>
              <label className="block text-base font-medium text-premium-muted mb-2">Banco</label>
              <input type="text" name="banco" value={formData.banco} onChange={handleChange} className={inputCls} placeholder="Ej: Galicia" />
            </div>
            <div>
              <label className="block text-base font-medium text-premium-muted mb-2">Número de Cheque</label>
              <input type="text" name="nroCheque" value={formData.nroCheque} onChange={handleChange} className={inputCls} placeholder="000123456" />
            </div>
            <div>
              <label className="block text-base font-medium text-premium-muted mb-2">Monto Nominal ($)</label>
              <input type="number" name="montoNominal" value={formData.montoNominal} onChange={handleChange} className={`${inputCls} ${superaLimite ? 'border-premium-danger/50' : ''}`} placeholder="0.00" />
            </div>
            <div>
              <label className="block text-base font-medium text-premium-muted mb-2">Fecha Emisión</label>
              <input type="date" name="fechaEmision" value={formData.fechaEmision} onChange={handleChange} className={inputCls} />
            </div>
            <div>
              <label className="block text-base font-medium text-premium-muted mb-2">Fecha Vencimiento</label>
              <input type="date" name="fechaVencimiento" value={formData.fechaVencimiento} onChange={handleChange} className={inputCls} />
            </div>
            <div>
              <label className="block text-base font-medium text-premium-muted mb-2">Tasa Aplicada (% TNA)</label>
              <input type="number" name="tasa" value={formData.tasa} onChange={handleChange} className={inputCls} />
            </div>
            <div>
              <label className="block text-base font-medium text-premium-muted mb-2">Comisión (%)</label>
              <input type="number" name="comision" value={formData.comision} onChange={handleChange} className={inputCls} />
            </div>
          </div>
        </div>

        {/* Panel de Liquidación */}
        <div className="bg-premium-card p-6 rounded-2xl border border-premium-accent/30 shadow-lg shadow-premium-accent/5">
          <h2 className="text-xl font-bold text-premium-text mb-4 flex items-center space-x-2">
            <CreditCard className="text-premium-accent" size={24} /><span>Liquidación</span>
          </h2>

          {calculo ? (
            <div className="space-y-4">
              <div className="flex justify-between items-center py-2 border-b border-premium-muted/20">
                <span className="text-premium-muted">Días al Vto:</span>
                <span className="font-semibold text-premium-text">{calculo.dias} días</span>
              </div>
              <div className="flex justify-between items-center py-2 border-b border-premium-muted/20">
                <span className="text-premium-muted">Interés (Desc):</span>
                <span className="font-semibold text-premium-danger">-${calculo.interesDescuento.toLocaleString('es-AR')}</span>
              </div>
              <div className="flex justify-between items-center py-2 border-b border-premium-muted/20">
                <span className="text-premium-muted">Comisión:</span>
                <span className="font-semibold text-premium-danger">-${calculo.comisionMonto.toLocaleString('es-AR')}</span>
              </div>
              <div className="pt-2">
                <div className="bg-premium-dark p-4 rounded-xl border border-premium-success/30">
                  <span className="block text-sm text-premium-muted mb-1">Neto a Entregar</span>
                  <span className="text-2xl font-bold text-premium-success">${calculo.netoCliente.toLocaleString('es-AR')}</span>
                </div>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-sm text-premium-muted">Tu ganancia:</span>
                <span className="text-lg font-bold text-premium-accent">${calculo.gananciaTotal.toLocaleString('es-AR')}</span>
              </div>
              <div className="flex gap-4 pt-4">
                <button onClick={handleCompartir}
                  className="flex-1 bg-green-600 hover:bg-green-700 text-white py-4 min-h-[56px] text-lg rounded-xl flex items-center justify-center space-x-2 transition-colors">
                  <Send size={22} />
                  <span>{formData.telefonoCliente ? 'WhatsApp ✓' : 'WhatsApp'}</span>
                </button>
                <button onClick={handleGuardar}
                  className={`flex-1 py-4 min-h-[56px] text-lg rounded-xl flex items-center justify-center space-x-2 transition-all ${guardado ? 'bg-green-500 text-white' : 'bg-premium-accent hover:bg-blue-600 text-white'}`}>
                  <Save size={22} />
                  <span>{guardado ? '¡Guardado!' : 'Guardar'}</span>
                </button>
              </div>
            </div>
          ) : (
            <div className="h-full min-h-[300px] flex flex-col items-center justify-center text-premium-muted">
              <Calculator size={48} className="mb-4 opacity-20" />
              <p className="text-center text-sm">La liquidación se calcula automáticamente.<br />Completá el monto y las fechas.</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
