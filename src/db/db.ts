import Dexie from 'dexie';
import type { Table } from 'dexie';

export interface Cliente {
  id?: number;
  nombre: string;
  cuit: string;
  telefono: string;
  limite: number;
}

export interface Cheque {
  id?: number;
  clienteId: number;
  cliente: string;
  banco: string;
  nroCheque: string;
  monto: number;
  fechaCobro: string;
  estado: 'en_cartera' | 'depositado' | 'cobrado' | 'rechazado' | 'endosado' | 'vencido';
}

export interface Recordatorio {
  id?: number;
  tipo: 'cliente' | 'cheque' | 'general';
  referenciaId?: number;
  titulo: string;
  texto: string;
  fechaCreacion: string;
  estado: 'pendiente' | 'completado';
}

export class AppDatabase extends Dexie {
  clientes!: Table<Cliente, number>;
  cheques!: Table<Cheque, number>;
  recordatorios!: Table<Recordatorio, number>;

  constructor() {
    super('GestionChequesDB');

    this.version(2).stores({
      clientes: '++id, nombre, cuit',
      cheques: '++id, clienteId, cliente, fechaCobro, estado',
      recordatorios: '++id, tipo, referenciaId, estado, fechaCreacion'
    });
  }
}

export const db = new AppDatabase();

// Limpiar datos de prueba que hayan sido insertados previamente
db.open().then(async () => {
  const totalClientes = await db.clientes.count();
  const clientesFalsos = ['Empresa Alpha S.A.', 'Distribuidora Beta', 'Juan Pérez (Constructora)'];
  if (totalClientes > 0) {
    const todos = await db.clientes.toArray();
    const sonSoloFalsos = todos.every(c => clientesFalsos.includes(c.nombre));
    if (sonSoloFalsos) {
      // Si la base solo tiene los datos de prueba, la vaciamos completamente
      await db.clientes.clear();
      await db.cheques.clear();
      await db.recordatorios.clear();
    }
  }
});
