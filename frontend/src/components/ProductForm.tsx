import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import api from '../api/axios';
import { Loader2, ArrowRight } from 'lucide-react';

interface ProductFormProps {
  onSuccess: () => void;
  initialData?: any;
}

export const ProductForm = ({ onSuccess, initialData }: ProductFormProps) => {
  const queryClient = useQueryClient();
  const [formData, setFormData] = useState({
    nombre: initialData?.nombre || '',
    sku: initialData?.sku || '',
    codigo_barras: initialData?.codigo_barras || '',
    precio_costo: initialData?.precio_costo || 0,
    precio_venta: initialData?.precio_venta || 0,
    stock_actual: initialData?.stock_actual || 0,
    stock_minimo: initialData?.stock_minimo || 2,
    categoria: initialData?.categoria || '',
    proveedor: initialData?.proveedor || '',
    activo: initialData?.activo ?? true,
  });

  const { data: categorias = [] } = useQuery({
    queryKey: ['categorias'],
    queryFn: async () => {
      const res = await api.get('/inventario/categorias/');
      return res.data.data.results || [];
    }
  });

  const { data: proveedores = [] } = useQuery({
    queryKey: ['proveedores'],
    queryFn: async () => {
      const res = await api.get('/inventario/proveedores/');
      return res.data.data.results || [];
    }
  });

  const mutation = useMutation({
    mutationFn: (data: any) => {
      if (initialData?.id) {
        return api.put(`/inventario/productos/${initialData.id}/`, data);
      }
      return api.post('/inventario/productos/', data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['productos'] });
      onSuccess();
    }
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    mutation.mutate(formData);
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-8">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        {/* Sección de Nombre (Ancho completo) */}
        <div className="space-y-3 col-span-full">
          <label className="text-[10px] font-black text-slate-500 uppercase tracking-[0.2em] ml-1">Nombre del Producto</label>
          <input
            required
            autoFocus
            className="w-full p-4 bg-white/5 border border-white/5 rounded-2xl outline-none focus:border-primary-500/50 focus:bg-white/10 transition-all text-white font-bold text-lg placeholder:text-slate-700"
            value={formData.nombre}
            onChange={e => setFormData({ ...formData, nombre: e.target.value })}
            placeholder="Ej: Heladera Samsung No Frost"
          />
        </div>

        {/* SKU y Código */}
        <div className="space-y-3">
          <label className="text-[10px] font-black text-slate-500 uppercase tracking-[0.2em] ml-1">SKU / Referencia</label>
          <input
            className="w-full p-4 bg-white/5 border border-white/5 rounded-2xl outline-none focus:border-primary-500/50 focus:bg-white/10 transition-all text-white font-bold"
            value={formData.sku}
            onChange={e => setFormData({ ...formData, sku: e.target.value })}
            placeholder="SKU-000"
          />
        </div>

        <div className="space-y-3">
          <label className="text-[10px] font-black text-slate-500 uppercase tracking-[0.2em] ml-1">Código de Barras</label>
          <input
            className="w-full p-4 bg-white/5 border border-white/5 rounded-2xl outline-none focus:border-primary-500/50 focus:bg-white/10 transition-all text-white font-bold"
            value={formData.codigo_barras}
            onChange={e => setFormData({ ...formData, codigo_barras: e.target.value })}
            placeholder="779123456789"
          />
        </div>

        {/* Categoría y Proveedor */}
        <div className="space-y-3">
          <label className="text-[10px] font-black text-slate-500 uppercase tracking-[0.2em] ml-1">Categoría</label>
          <select
            required
            className="w-full p-4 bg-white/5 border border-white/5 rounded-2xl outline-none focus:border-primary-500/50 focus:bg-white/10 transition-all text-white font-bold appearance-none"
            value={formData.categoria}
            onChange={e => setFormData({ ...formData, categoria: e.target.value })}
          >
            <option value="" className="bg-slate-900">Seleccionar...</option>
            {categorias.map((c: any) => (
              <option key={c.id} value={c.id} className="bg-slate-900">{c.nombre}</option>
            ))}
          </select>
        </div>

        <div className="space-y-3">
          <label className="text-[10px] font-black text-slate-500 uppercase tracking-[0.2em] ml-1">Proveedor</label>
          <select
            className="w-full p-4 bg-white/5 border border-white/5 rounded-2xl outline-none focus:border-primary-500/50 focus:bg-white/10 transition-all text-white font-bold appearance-none"
            value={formData.proveedor}
            onChange={e => setFormData({ ...formData, proveedor: e.target.value })}
          >
            <option value="" className="bg-slate-900">Ninguno</option>
            {proveedores.map((p: any) => (
              <option key={p.id} value={p.id} className="bg-slate-900">{p.nombre}</option>
            ))}
          </select>
        </div>

        {/* Precios con diseño destacado */}
        <div className="space-y-3 p-6 bg-primary-500/5 border border-primary-500/10 rounded-[2rem]">
          <label className="text-[10px] font-black text-primary-400 uppercase tracking-[0.2em] ml-1">Precio de Venta ($)</label>
          <input
            required
            type="number"
            step="0.01"
            className="w-full bg-transparent border-none outline-none text-white font-black text-3xl tracking-tighter"
            value={formData.precio_venta}
            onChange={e => setFormData({ ...formData, precio_venta: Number(e.target.value) })}
          />
        </div>

        <div className="space-y-3 p-6 bg-white/5 border border-white/10 rounded-[2rem]">
          <label className="text-[10px] font-black text-slate-500 uppercase tracking-[0.2em] ml-1">Precio de Costo ($)</label>
          <input
            required
            type="number"
            step="0.01"
            className="w-full bg-transparent border-none outline-none text-slate-300 font-black text-3xl tracking-tighter"
            value={formData.precio_costo}
            onChange={e => setFormData({ ...formData, precio_costo: Number(e.target.value) })}
          />
        </div>

        {/* Stocks */}
        <div className="space-y-3">
          <label className="text-[10px] font-black text-slate-500 uppercase tracking-[0.2em] ml-1">Stock Inicial</label>
          <input
            required
            type="number"
            className="w-full p-4 bg-white/5 border border-white/5 rounded-2xl outline-none focus:border-primary-500/50 text-white font-bold"
            value={formData.stock_actual}
            onChange={e => setFormData({ ...formData, stock_actual: Number(e.target.value) })}
          />
        </div>

        <div className="space-y-3">
          <label className="text-[10px] font-black text-slate-500 uppercase tracking-[0.2em] ml-1">Stock Mínimo (Alerta)</label>
          <input
            required
            type="number"
            className="w-full p-4 bg-white/5 border border-white/5 rounded-2xl outline-none focus:border-primary-500/50 text-white font-bold"
            value={formData.stock_minimo}
            onChange={e => setFormData({ ...formData, stock_minimo: Number(e.target.value) })}
          />
        </div>
      </div>

      {/* Botones de Acción */}
      <div className="flex justify-end gap-4 pt-8 border-t border-white/5">
        <button
          type="button"
          onClick={onSuccess}
          className="px-8 py-4 text-slate-500 font-black text-xs uppercase tracking-widest hover:text-white transition-all active:scale-95"
        >
          CANCELAR
        </button>
        <button
          type="submit"
          disabled={mutation.isPending}
          className="flex items-center gap-3 px-10 py-4 bg-white text-slate-950 font-black rounded-2xl shadow-xl shadow-white/5 hover:bg-slate-200 transition-all disabled:opacity-50 active:scale-95 group"
        >
          {mutation.isPending ? (
            <Loader2 className="animate-spin" size={20} />
          ) : (
            <>
              <span className="text-xs uppercase tracking-widest">{initialData?.id ? 'ACTUALIZAR' : 'GUARDAR PRODUCTO'}</span>
              <ArrowRight size={18} className="text-slate-400 group-hover:translate-x-1 transition-transform" />
            </>
          )}
        </button>
      </div>
    </form>
  );
};
