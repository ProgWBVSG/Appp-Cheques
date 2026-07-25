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
  cliente: string; // Nombre desnormalizado para consultas rápidas
  banco: string;
  nroCheque: string;
  monto: number;
  fechaCobro: string; // ISO string
  estado: 'en_cartera' | 'depositado' | 'cobrado' | 'rechazado' | 'endosado' | 'vencido';
}

export interface Recordatorio {
  id?: number;
  tipo: 'cliente' | 'cheque' | 'general';
  referenciaId?: number; // ID del cliente o del cheque
  titulo: string;
  texto: string;
  fechaCreacion: string; // ISO string
  estado: 'pendiente' | 'completado';
}

export class AppDatabase extends Dexie {
  clientes!: Table<Cliente, number>;
  cheques!: Table<Cheque, number>;
  recordatorios!: Table<Recordatorio, number>;

  constructor() {
    super('GestionChequesDB');
    
    this.version(1).stores({
      clientes: '++id, nombre, cuit',
      cheques: '++id, clienteId, cliente, fechaCobro, estado',
      recordatorios: '++id, tipo, referenciaId, estado, fechaCreacion'
    });

    this.on('populate', async () => {
      await this.clientes.bulkAdd([
        { nombre: 'Empresa Alpha S.A.', cuit: '30-12345678-9', telefono: '1123456789', limite: 5000000 },
        { nombre: 'Distribuidora Beta', cuit: '30-98765432-1', telefono: '1198765432', limite: 2000000 },
        { nombre: 'Juan Pérez (Constructora)', cuit: '20-11223344-5', telefono: '1144556677', limite: 10000000 },
      ]);

      const now = new Date();
      const addDays = (date: Date, days: number) => {
        const result = new Date(date);
        result.setDate(result.getDate() + days);
        return result.toISOString();
      };

      await this.cheques.bulkAdd([
        { clienteId: 1, cliente: 'Empresa Alpha S.A.', banco: 'Galicia', nroCheque: '000001', monto: 450000, fechaCobro: now.toISOString(), estado: 'en_cartera' },
        { clienteId: 2, cliente: 'Distribuidora Beta', banco: 'Santander', nroCheque: '000002', monto: 1250000, fechaCobro: addDays(now, 2), estado: 'depositado' },
        { clienteId: 3, cliente: 'Juan Pérez (Constructora)', banco: 'Provincia', nroCheque: '000003', monto: 300000, fechaCobro: addDays(now, -1), estado: 'rechazado' },
      ]);
    });
  }
}

export const db = new AppDatabase();
