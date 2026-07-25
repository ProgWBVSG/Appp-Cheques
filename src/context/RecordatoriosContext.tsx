import { createContext, useContext } from 'react';
import type { ReactNode } from 'react';
import { useLiveQuery } from 'dexie-react-hooks';
import { db } from '../db/db';
import type { Recordatorio } from '../db/db';

interface RecordatoriosContextType {
  recordatorios: Recordatorio[];
  agregarRecordatorio: (rec: Omit<Recordatorio, 'id' | 'fechaCreacion' | 'estado'>) => void;
  completarRecordatorio: (id: number) => void;
  eliminarRecordatorio: (id: number) => void;
}

const RecordatoriosContext = createContext<RecordatoriosContextType | undefined>(undefined);

export function RecordatoriosProvider({ children }: { children: ReactNode }) {
  // Leer recordatorios desde Dexie, ordenados por fecha de creación (más recientes primero)
  const recordatorios = useLiveQuery(async () => {
    const todos = await db.recordatorios.toArray();
    return todos.sort((a, b) => new Date(b.fechaCreacion).getTime() - new Date(a.fechaCreacion).getTime());
  }) || [];

  const agregarRecordatorio = async (rec: Omit<Recordatorio, 'id' | 'fechaCreacion' | 'estado'>) => {
    await db.recordatorios.add({
      ...rec,
      fechaCreacion: new Date().toISOString(),
      estado: 'pendiente'
    });
  };

  const completarRecordatorio = async (id: number) => {
    await db.recordatorios.update(id, { estado: 'completado' });
  };

  const eliminarRecordatorio = async (id: number) => {
    await db.recordatorios.delete(id);
  };

  return (
    <RecordatoriosContext.Provider value={{ recordatorios, agregarRecordatorio, completarRecordatorio, eliminarRecordatorio }}>
      {children}
    </RecordatoriosContext.Provider>
  );
}

export function useRecordatorios() {
  const context = useContext(RecordatoriosContext);
  if (!context) {
    throw new Error('useRecordatorios debe ser usado dentro de un RecordatoriosProvider');
  }
  return context;
}
