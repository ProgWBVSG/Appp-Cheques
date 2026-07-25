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

export interface Meta {
  id?: number;
  titulo: string;        // Nombre del objetivo
  metaIngresos: number;  // Monto objetivo
  mes: string;           // YYYY-MM del mes en que aplica
  fechaCreacion: string; // ISO string
}

export interface Movimiento {
  id?: number;
  tipo: 'ingreso' | 'gasto';
  monto: number;
  concepto: string;
  categoria: string;
  fecha: string; // ISO string
  metodo: 'manual' | 'ai';
}


export class AppDatabase extends Dexie {
  clientes!: Table<Cliente, number>;
  cheques!: Table<Cheque, number>;
  recordatorios!: Table<Recordatorio, number>;
  metas!: Table<Meta, number>;
  movimientos!: Table<Movimiento, number>;

  constructor() {
    super('GestionChequesDB');

    // Mantenemos la v2 y agregamos v3 con las nuevas tablas
    this.version(2).stores({
      clientes: '++id, nombre, cuit',
      cheques: '++id, clienteId, cliente, fechaCobro, estado',
      recordatorios: '++id, tipo, referenciaId, estado, fechaCreacion'
    });

    this.version(3).stores({
      clientes: '++id, nombre, cuit',
      cheques: '++id, clienteId, cliente, fechaCobro, estado',
      recordatorios: '++id, tipo, referenciaId, estado, fechaCreacion',
      metas: '++id, mes',
      movimientos: '++id, tipo, fecha, metodo'
    });

    this.version(4).stores({
      clientes: '++id, nombre, cuit',
      cheques: '++id, clienteId, cliente, fechaCobro, estado',
      recordatorios: '++id, tipo, referenciaId, estado, fechaCreacion',
      metas: '++id, mes',
      movimientos: '++id, tipo, fecha, metodo, categoria'
    });

    this.version(5).stores({
      clientes: '++id, nombre, cuit',
      cheques: '++id, clienteId, cliente, fechaCobro, estado',
      recordatorios: '++id, tipo, referenciaId, estado, fechaCreacion',
      metas: '++id, mes, titulo',
      movimientos: '++id, tipo, fecha, metodo, categoria'
    });

    this.version(6).stores({
      clientes: '++id, nombre, cuit',
      cheques: '++id, clienteId, cliente, fechaCobro, estado',
      recordatorios: '++id, tipo, referenciaId, estado, fechaCreacion',
      metas: '++id, mes, titulo, fechaCreacion',
      movimientos: '++id, tipo, fecha, metodo, categoria'
    });
  }
}

export const db = new AppDatabase();

// Limpiar datos de prueba que hayan sido insertados previamente
db.open().then(async () => {
  const clientesFalsos = ['Empresa Alpha S.A.', 'Distribuidora Beta', 'Juan Pérez (Constructora)'];
  
  // Buscar a los clientes falsos
  const clientesParaBorrar = await db.clientes.filter(c => clientesFalsos.includes(c.nombre)).toArray();
  
  if (clientesParaBorrar.length > 0) {
    const idsFalsos = clientesParaBorrar.map(c => c.id!);
    
    // Borrar cheques que pertenezcan a esos IDs falsos
    await db.cheques.filter(ch => idsFalsos.includes(ch.clienteId)).delete();
    
    // Borrar también los cheques por nombre (por si quedó alguno huérfano)
    await db.cheques.filter(ch => clientesFalsos.includes(ch.cliente)).delete();
    
    // Borrar los clientes falsos de la DB
    await db.clientes.bulkDelete(idsFalsos);
  }
});
