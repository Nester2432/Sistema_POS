import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import api from '../api/axios';

export interface Sucursal {
  id: string;
  nombre: string;
  codigo: string;
  direccion: string;
  telefono: string;
  es_principal: boolean;
  activo: boolean;
}

interface SucursalState {
  sucursales: Sucursal[];
  sucursalActiva: Sucursal | null;
  cargando: boolean;
  setSucursalActiva: (sucursal: Sucursal | null) => void;
  cargarSucursales: () => Promise<void>;
  limpiarSucursal: () => void;
}

export const useSucursalStore = create<SucursalState>()(
  persist(
    (set, get) => ({
      sucursales: [],
      sucursalActiva: null,
      cargando: false,

      setSucursalActiva: (sucursal) => {
        set({ sucursalActiva: sucursal });
      },

      limpiarSucursal: () => {
        set({ sucursalActiva: null, sucursales: [] });
      },

      cargarSucursales: async () => {
        set({ cargando: true });
        try {
          const response = await api.get('/sucursales/');
          // El backend envuelve: {data: {count, results:[]}} 
          const payload = response.data?.data;
          const sucursalesData: Sucursal[] = Array.isArray(payload)
            ? payload
            : (payload?.results ?? []);
          
          // Solo guardamos las activas en el store
          const activas = sucursalesData.filter((s: Sucursal) => s.activo);
          
          set({ sucursales: activas });

          const currentActiva = get().sucursalActiva;
          
          // Si no hay sucursal activa, o la actual ya no está en la lista de activas, 
          // autoseleccionar la principal o la primera disponible.
          const stillValid = currentActiva && activas.find((s: Sucursal) => s.id === currentActiva.id);
          
          if (!stillValid && activas.length > 0) {
            const principal = activas.find((s: Sucursal) => s.es_principal) || activas[0];
            set({ sucursalActiva: principal });
          }

        } catch (error) {
          console.error("Error al cargar sucursales:", error);
        } finally {
          set({ cargando: false });
        }
      },
    }),
    {
      name: 'pos_sucursal_activa',
      // Opcional: solo persistir la sucursalActiva, no hace falta persistir la lista completa o el estado de carga
      partialize: (state) => ({ sucursalActiva: state.sucursalActiva }),
    }
  )
);
