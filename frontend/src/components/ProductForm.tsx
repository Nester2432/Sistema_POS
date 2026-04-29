import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import api from '../api/axios';
import { Save, Loader2 } from 'lucide-react';

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

  // Cargar Categorías y Proveedores
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
    <form onSubmit={handleSubmit} className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="space-y-2 col-span-full">
          <label className="text-sm font-bold text-slate-700">Nombre del Producto</label>
          <input
            required
            className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl outline-none focus:ring-2 focus:ring-primary-500 transition-all"
            value={formData.nombre}
            onChange={e => setFormData({ ...formData, nombre: e.target.value })}
            placeholder="Ej: Heladera Samsung No Frost"
          />
        </div>

        <div className="space-y-2">
          <label className="text-sm font-bold text-slate-700">SKU / Referencia</label>
          <input
            className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl outline-none focus:ring-2 focus:ring-primary-500"
            value={formData.sku}
            onChange={e => setFormData({ ...formData, sku: e.target.value })}
          />
        </div>

        <div className="space-y-2">
          <label className="text-sm font-bold text-slate-700">Código de Barras</label>
          <input
            className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl outline-none focus:ring-2 focus:ring-primary-500"
            value={formData.codigo_barras}
            onChange={e => setFormData({ ...formData, codigo_barras: e.target.value })}
          />
        </div>

        <div className="space-y-2">
          <label className="text-sm font-bold text-slate-700">Categoría</label>
          <select
            required
            className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl outline-none focus:ring-2 focus:ring-primary-500"
            value={formData.categoria}
            onChange={e => setFormData({ ...formData, categoria: e.target.value })}
          >
            <option value="">Seleccionar...</option>
            {categorias.map((c: any) => (
              <option key={c.id} value={c.id}>{c.nombre}</option>
            ))}
          </select>
        </div>

        <div className="space-y-2">
          <label className="text-sm font-bold text-slate-700">Proveedor</label>
          <select
            className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl outline-none focus:ring-2 focus:ring-primary-500"
            value={formData.proveedor}
            onChange={e => setFormData({ ...formData, proveedor: e.target.value })}
          >
            <option value="">Ninguno</option>
            {proveedores.map((p: any) => (
              <option key={p.id} value={p.id}>{p.nombre}</option>
            ))}
          </select>
        </div>

        <div className="space-y-2 p-4 bg-emerald-50 rounded-2xl border border-emerald-100">
          <label className="text-sm font-bold text-emerald-800">Precio de Venta ($)</label>
          <input
            required
            type="number"
            step="0.01"
            className="w-full p-2 bg-white border-transparent rounded-lg outline-none text-emerald-700 font-bold text-lg"
            value={formData.precio_venta}
            onChange={e => setFormData({ ...formData, precio_venta: Number(e.target.value) })}
          />
        </div>

        <div className="space-y-2 p-4 bg-slate-50 rounded-2xl border border-slate-100">
          <label className="text-sm font-bold text-slate-500">Precio de Costo ($)</label>
          <input
            required
            type="number"
            step="0.01"
            className="w-full p-2 bg-white border-transparent rounded-lg outline-none text-slate-600 font-bold text-lg"
            value={formData.precio_costo}
            onChange={e => setFormData({ ...formData, precio_costo: Number(e.target.value) })}
          />
        </div>

        <div className="space-y-2">
          <label className="text-sm font-bold text-slate-700">Stock Inicial</label>
          <input
            required
            type="number"
            className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl outline-none"
            value={formData.stock_actual}
            onChange={e => setFormData({ ...formData, stock_actual: Number(e.target.value) })}
          />
        </div>

        <div className="space-y-2">
          <label className="text-sm font-bold text-slate-700">Stock Mínimo (Alerta)</label>
          <input
            required
            type="number"
            className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl outline-none"
            value={formData.stock_minimo}
            onChange={e => setFormData({ ...formData, stock_minimo: Number(e.target.value) })}
          />
        </div>
      </div>

      <div className="flex justify-end gap-3 pt-6 border-t">
        <button
          type="button"
          onClick={onSuccess}
          className="px-6 py-3 text-slate-600 font-bold hover:bg-slate-100 rounded-xl transition-all"
        >
          Cancelar
        </button>
        <button
          type="submit"
          disabled={mutation.isPending}
          className="flex items-center gap-2 px-8 py-3 bg-primary-600 text-white font-bold rounded-xl shadow-lg shadow-primary-200 hover:bg-primary-700 transition-all disabled:bg-slate-300"
        >
          {mutation.isPending ? <Loader2 className="animate-spin" /> : <Save size={20} />}
          {initialData?.id ? 'Actualizar Producto' : 'Guardar Producto'}
        </button>
      </div>
    </form>
  );
};
