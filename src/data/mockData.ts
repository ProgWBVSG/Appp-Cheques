import { addDays } from 'date-fns';

// ─── Fuente de datos centralizada ───────────────────────────────────────────
// En producción esto vendrá de Supabase. Por ahora es el mock compartido
// por todos los módulos para que las alertas y los flujos estén sincronizados.

export interface Cliente {
  id: number;
  nombre: string;
  cuit: string;
  telefono: string;
  limite: number;
  deuda: number;
  chequesActivos: number;
}

export interface Cheque {
  id: number;
  cliente: string;
  clienteId: number;
  banco: string;
  nroCheque: string;
  monto: number;
  fechaCobro: string;
  estado: 'en_cartera' | 'depositado' | 'cobrado' | 'rechazado' | 'endosado';
}

export const CLIENTES: Cliente[] = [
  { id: 1, nombre: 'Empresa Alpha S.A.',        cuit: '30-12345678-9', telefono: '1123456789', limite: 5000000,  deuda: 1250000, chequesActivos: 3 },
  { id: 2, nombre: 'Distribuidora Beta',         cuit: '30-98765432-1', telefono: '1198765432', limite: 2000000,  deuda: 2000000, chequesActivos: 1 },
  { id: 3, nombre: 'Juan Pérez (Constructora)',  cuit: '20-11223344-5', telefono: '1144556677', limite: 10000000, deuda: 0,       chequesActivos: 0 },
  { id: 4, nombre: 'Comercial Sur S.R.L.',       cuit: '30-55667788-2', telefono: '1133445566', limite: 3000000,  deuda: 1800000, chequesActivos: 2 },
];

export const CHEQUES: Cheque[] = [
  { id: 1, cliente: 'Empresa Alpha S.A.',       clienteId: 1, banco: 'Galicia',   nroCheque: '000001', monto: 450000,  fechaCobro: new Date().toISOString(),              estado: 'en_cartera' },
  { id: 2, cliente: 'Distribuidora Beta',        clienteId: 2, banco: 'Santander', nroCheque: '000002', monto: 1250000, fechaCobro: addDays(new Date(), 2).toISOString(),  estado: 'depositado' },
  { id: 3, cliente: 'Juan Pérez (Constructora)', clienteId: 3, banco: 'Provincia', nroCheque: '000003', monto: 300000,  fechaCobro: addDays(new Date(), -1).toISOString(), estado: 'rechazado' },
  { id: 4, cliente: 'Empresa Alpha S.A.',        clienteId: 1, banco: 'Macro',     nroCheque: '000004', monto: 800000,  fechaCobro: addDays(new Date(), 5).toISOString(),  estado: 'endosado' },
  { id: 5, cliente: 'Distribuidora Beta',        clienteId: 2, banco: 'HSBC',      nroCheque: '000005', monto: 600000,  fechaCobro: addDays(new Date(), 12).toISOString(), estado: 'en_cartera' },
  { id: 6, nombre: 'Comercial Sur S.R.L.',       clienteId: 4, banco: 'Nación',    nroCheque: '000006', monto: 220000,  fechaCobro: addDays(new Date(), 18).toISOString(), estado: 'depositado' } as any,
];

export interface Recordatorio {
  id: number;
  tipo: 'cliente' | 'cheque' | 'general';
  referenciaId?: number; // ID del cliente o del cheque
  titulo: string;
  texto: string;
  fechaCreacion: string;
  estado: 'pendiente' | 'completado';
}

export const RECORDATORIOS_MOCK: Recordatorio[] = [
  {
    id: 1,
    tipo: 'cliente',
    referenciaId: 1, // Empresa Alpha
    titulo: 'Llamar a Empresa Alpha',
    texto: 'Consultar si van a renovar el descubierto la semana que viene.',
    fechaCreacion: new Date().toISOString(),
    estado: 'pendiente'
  },
  {
    id: 2,
    tipo: 'cheque',
    referenciaId: 3, // Cheque rechazado Juan Perez
    titulo: 'Cheque Rechazado - Juan Pérez',
    texto: 'Hablar con Juan para ver cuándo cubre el cheque rechazado de $300.000.',
    fechaCreacion: new Date().toISOString(),
    estado: 'pendiente'
  }
];
