import { useEffect } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { Store, ChevronDown } from 'lucide-react';
import { useSucursalStore } from '../store/sucursalStore';
import type { Sucursal } from '../store/sucursalStore';
import toast from 'react-hot-toast';

export const SucursalSelector = () => {
  const queryClient = useQueryClient();
  const { sucursales, sucursalActiva, setSucursalActiva, cargarSucursales, cargando } = useSucursalStore();

  useEffect(() => {
    cargarSucursales();
  }, [cargarSucursales]);

  // Si no se pudo cargar y la limpiamos (por ej, 403) reintentamos
  useEffect(() => {
    if (!sucursalActiva && sucursales.length > 0) {
      cargarSucursales();
    }
  }, [sucursalActiva, sucursales.length, cargarSucursales]);

  const handleChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const sucursalId = e.target.value;
    const selected = sucursales.find((s: Sucursal) => s.id === sucursalId) || null;
    
    if (selected && selected.id !== sucursalActiva?.id) {
      setSucursalActiva(selected);
      
      // INVALIDACIÓN TOTAL DE CACHÉ
      // Esto obliga a React Query a volver a disparar cualquier petición en curso (Dashboard, Inventario, Caja, etc)
      queryClient.invalidateQueries();
      
      toast.success(`Contexto cambiado a: ${selected.nombre}`);
    }
  };

  if (cargando && sucursales.length === 0) {
    return (
      <div className="flex items-center gap-2 px-3 py-1.5 bg-slate-800/50 rounded-xl border border-white/5 animate-pulse">
        <Store size={16} className="text-slate-500" />
        <div className="w-24 h-4 bg-slate-700 rounded"></div>
      </div>
    );
  }

  if (sucursales.length === 0) {
    return null; // Si no hay sucursales, probablemente haya un error grave o sea un admin sin asignaciones
  }

  return (
    <div className="relative group flex items-center">
      <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
        <Store size={16} className="text-accent-400" />
      </div>
      
      <select
        value={sucursalActiva?.id || ''}
        onChange={handleChange}
        className="w-full sm:w-auto appearance-none bg-slate-800/80 hover:bg-slate-700/80 text-white font-medium text-sm rounded-xl py-2 pl-9 pr-10 border border-white/5 focus:outline-none focus:ring-2 focus:ring-accent-500 transition-all cursor-pointer shadow-sm"
      >
        {sucursales.map((sucursal) => (
          <option key={sucursal.id} value={sucursal.id} className="bg-slate-900 text-white">
            {sucursal.nombre} {sucursal.es_principal ? '(Principal)' : ''}
          </option>
        ))}
      </select>
      
      <div className="absolute inset-y-0 right-0 pr-3 flex items-center pointer-events-none text-slate-400 group-hover:text-white transition-colors">
        <ChevronDown size={14} />
      </div>
    </div>
  );
};
