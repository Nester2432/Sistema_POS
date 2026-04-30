import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { ArrowLeft, Save, Trash2, Search, AlertCircle, Plus } from 'lucide-react';
import toast from 'react-hot-toast';

import { transferenciasApi } from '../../api/transferencias';
import { useSucursalStore } from '../../store/sucursalStore';
import api from '../../api/axios';

interface ProductoSeleccionado {
  producto_id: string;
  nombre: string;
  sku: string;
  cantidad: number;
}

export const NuevaTransferenciaPage = () => {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const { sucursales, sucursalActiva } = useSucursalStore();
  
  // Si no pasamos sucursal_origen al backend, usará la del header (sucursalActiva)
  const [destinoId, setDestinoId] = useState<string>('');
  const [observaciones, setObservaciones] = useState('');
  
  // Buscador de productos
  const [search, setSearch] = useState('');
  const [items, setItems] = useState<ProductoSeleccionado[]>([]);

  // Buscar productos (usamos el listado normal)
  const { data: productos } = useQuery({
    queryKey: ['productos'],
    queryFn: async () => {
      const { data } = await api.get('/inventario/productos/');
      return data;
    }
  });

  const productosFiltrados = productos?.filter((p: any) => 
    p.nombre.toLowerCase().includes(search.toLowerCase()) || 
    p.sku.toLowerCase().includes(search.toLowerCase())
  ).slice(0, 5) || [];

  const agregarProducto = (prod: any) => {
    if (items.find(i => i.producto_id === prod.id)) {
      toast.error('El producto ya está en la lista.');
      return;
    }
    setItems([...items, {
      producto_id: prod.id,
      nombre: prod.nombre,
      sku: prod.sku,
      cantidad: 1
    }]);
    setSearch('');
  };

  const actualizarCantidad = (id: string, qty: number) => {
    if (qty <= 0) return;
    setItems(items.map(i => i.producto_id === id ? { ...i, cantidad: qty } : i));
  };

  const removerItem = (id: string) => {
    setItems(items.filter(i => i.producto_id !== id));
  };

  const createMutation = useMutation({
    mutationFn: transferenciasApi.create,
    onSuccess: () => {
      toast.success('Borrador de transferencia creado.');
      queryClient.invalidateQueries({ queryKey: ['transferencias'] });
      navigate('/app/transferencias');
    },
    onError: (error: any) => {
      const msg = error.response?.data?.error || 'Error al crear la transferencia';
      toast.error(typeof msg === 'string' ? msg : JSON.stringify(msg));
    }
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!destinoId) return toast.error('Selecciona una sucursal de destino.');
    if (destinoId === sucursalActiva?.id) return toast.error('El destino no puede ser tu sucursal actual.');
    if (items.length === 0) return toast.error('Añade al menos un producto a transferir.');

    createMutation.mutate({
      sucursal_destino: destinoId,
      observaciones,
      items: items.map(i => ({ producto: i.producto_id, cantidad: i.cantidad }))
    });
  };

  const destinosDisponibles = sucursales.filter(s => s.id !== sucursalActiva?.id);

  return (
    <div className="p-8 max-w-5xl mx-auto">
      <div className="flex items-center gap-4 mb-8">
        <button 
          onClick={() => navigate(-1)}
          className="p-2 hover:bg-white/10 rounded-xl transition-colors text-slate-400 hover:text-white"
        >
          <ArrowLeft size={20} />
        </button>
        <div>
          <h1 className="text-2xl font-bold text-white tracking-tight">Nueva Transferencia</h1>
          <p className="text-slate-400">Origen actual: <span className="text-accent-400 font-medium">{sucursalActiva?.nombre}</span></p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-6">
          <div className="bg-slate-900 border border-white/5 rounded-2xl p-6 shadow-xl relative">
            <h2 className="text-lg font-semibold text-white mb-4">Productos a Mover</h2>
            
            <div className="relative mb-6 z-10">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
              <input 
                type="text" 
                placeholder="Buscar por nombre o SKU..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="w-full bg-slate-950 border border-white/10 rounded-xl py-2.5 pl-10 pr-4 text-white focus:ring-2 focus:ring-accent-500 outline-none"
              />
              
              {search && productosFiltrados.length > 0 && (
                <div className="absolute top-full left-0 right-0 mt-2 bg-slate-800 border border-white/10 rounded-xl shadow-2xl overflow-hidden">
                  {productosFiltrados.map((p: any) => (
                    <button
                      key={p.id}
                      onClick={() => agregarProducto(p)}
                      className="w-full text-left px-4 py-3 hover:bg-slate-700/50 flex justify-between items-center transition-colors"
                    >
                      <div>
                        <p className="text-sm font-medium text-white">{p.nombre}</p>
                        <p className="text-xs text-slate-400">{p.sku}</p>
                      </div>
                      <Plus size={16} className="text-accent-400" />
                    </button>
                  ))}
                </div>
              )}
            </div>

            {items.length === 0 ? (
              <div className="text-center py-10 border-2 border-dashed border-white/10 rounded-xl">
                <p className="text-slate-500 text-sm">Busca y selecciona productos para agregar a la transferencia.</p>
              </div>
            ) : (
              <div className="space-y-2">
                {items.map(item => (
                  <div key={item.producto_id} className="flex items-center gap-4 bg-slate-950/50 p-3 rounded-xl border border-white/5">
                    <div className="flex-1">
                      <p className="text-sm font-medium text-white">{item.nombre}</p>
                      <p className="text-xs text-slate-500">{item.sku}</p>
                    </div>
                    <div className="flex items-center gap-2">
                      <input 
                        type="number" 
                        min="1"
                        value={item.cantidad}
                        onChange={(e) => actualizarCantidad(item.producto_id, parseFloat(e.target.value))}
                        className="w-20 bg-slate-900 border border-white/10 rounded-lg px-3 py-1.5 text-white text-center focus:ring-1 focus:ring-accent-500 outline-none"
                      />
                      <button 
                        onClick={() => removerItem(item.producto_id)}
                        className="p-1.5 text-slate-500 hover:text-rose-400 hover:bg-rose-500/10 rounded-lg transition-colors"
                      >
                        <Trash2 size={16} />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        <div className="space-y-6">
          <form onSubmit={handleSubmit} className="bg-slate-900 border border-white/5 rounded-2xl p-6 shadow-xl sticky top-24">
            <h2 className="text-lg font-semibold text-white mb-4">Destino de Transferencia</h2>
            
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-slate-400 mb-1.5">Sucursal Destino</label>
                <select 
                  required
                  value={destinoId}
                  onChange={(e) => setDestinoId(e.target.value)}
                  className="w-full bg-slate-950 border border-white/10 rounded-xl px-4 py-2.5 text-white focus:ring-2 focus:ring-accent-500 outline-none appearance-none"
                >
                  <option value="">Selecciona un destino...</option>
                  {destinosDisponibles.map(s => (
                    <option key={s.id} value={s.id}>{s.nombre}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-400 mb-1.5">Observaciones</label>
                <textarea 
                  value={observaciones}
                  onChange={(e) => setObservaciones(e.target.value)}
                  placeholder="Ej: Traslado de stock bajo..."
                  rows={3}
                  className="w-full bg-slate-950 border border-white/10 rounded-xl px-4 py-2.5 text-white focus:ring-2 focus:ring-accent-500 outline-none resize-none"
                ></textarea>
              </div>

              <div className="pt-4 border-t border-white/5">
                <button
                  type="submit"
                  disabled={createMutation.isPending || items.length === 0 || !destinoId}
                  className="w-full flex items-center justify-center gap-2 bg-accent-600 hover:bg-accent-500 text-white py-3 rounded-xl font-medium transition-all shadow-lg shadow-accent-500/20 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  <Save size={18} />
                  {createMutation.isPending ? 'Guardando...' : 'Crear Borrador'}
                </button>
                <p className="text-center text-xs text-slate-500 mt-3 flex items-center justify-center gap-1">
                  <AlertCircle size={12} />
                  El stock no se descuenta hasta confirmar.
                </p>
              </div>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};
