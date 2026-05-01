import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import api from '../api/axios';
import { Trash2 } from 'lucide-react';

export const PurchaseForm = ({ onSuccess }: { onSuccess: () => void }) => {
  const queryClient = useQueryClient();
  const [items, setItems] = useState<any[]>([]);
  const [proveedorId, setProveedorId] = useState('');
  const [nroFactura, setNroFactura] = useState('');
  const [metodoPago, setMetodoPago] = useState('EFECTIVO');

  // Buscar productos para añadir a la compra
  const [search, setSearch] = useState('');
  const { data: productos = [] } = useQuery({
    queryKey: ['productos-compras', search],
    queryFn: async () => {
      const res = await api.get(`/inventario/productos/?search=${search}`);
      const body = res.data;
      return body.results || body.data?.results || body.data || [];
    },
    enabled: search.length > 1
  });

  // Cargar proveedores
  const { data: proveedores = [] } = useQuery({
    queryKey: ['proveedores'],
    queryFn: async () => {
      const res = await api.get('/inventario/proveedores/');
      const body = res.data;
      return body.results || body.data?.results || body.data || [];
    }
  });

  const addItem = (prod: any) => {
    if (items.find(i => i.producto_id === prod.id)) return;
    setItems([...items, { producto_id: prod.id, nombre: prod.nombre, cantidad: 1, precio_unitario: prod.precio_costo }]);
    setSearch('');
  };

  const removeItem = (id: string) => setItems(items.filter(i => i.producto_id !== id));

  const updateItem = (id: string, field: string, value: any) => {
    setItems(items.map(i => i.producto_id === id ? { ...i, [field]: value } : i));
  };

  const total = items.reduce((acc, item) => acc + (item.cantidad * item.precio_unitario), 0);

  const mutation = useMutation({
    mutationFn: (data: any) => api.post('/compras/compras/', data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['compras'] });
      queryClient.invalidateQueries({ queryKey: ['productos'] });
      onSuccess();
    }
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (items.length === 0 || !proveedorId) return;
    mutation.mutate({
      proveedor_id: proveedorId,
      nro_comprobante: nroFactura,
      tipo_comprobante: 'FACTURA',
      metodo_pago: metodoPago,
      items: items.map(i => ({ producto_id: i.producto_id, cantidad: i.cantidad, precio_unitario: i.precio_unitario }))
    });
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-8">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="space-y-2">
          <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest ml-1">Proveedor</label>
          <select 
            required
            className="w-full p-3.5 bg-slate-950/50 border border-white/5 rounded-2xl outline-none focus:border-accent-500/50 text-white font-medium appearance-none"
            value={proveedorId}
            onChange={e => setProveedorId(e.target.value)}
          >
            <option value="" className="bg-slate-900">Seleccionar Proveedor...</option>
            {proveedores.map((p: any) => (
              <option key={p.id} value={p.id} className="bg-slate-900">{p.nombre}</option>
            ))}
          </select>
        </div>
        <div className="space-y-2">
          <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest ml-1">Nro. Factura</label>
          <input 
            required
            className="w-full p-3.5 bg-slate-950/50 border border-white/5 rounded-2xl outline-none focus:border-accent-500/50 text-white placeholder:text-slate-700 font-medium"
            value={nroFactura}
            onChange={e => setNroFactura(e.target.value)}
            placeholder="0001-00001234"
          />
        </div>
        <div className="space-y-2 col-span-full">
          <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest ml-1">Método de Pago</label>
          <select 
            className="w-full p-3.5 bg-slate-950/50 border border-white/5 rounded-2xl outline-none focus:border-accent-500/50 text-white font-medium appearance-none"
            value={metodoPago}
            onChange={e => setMetodoPago(e.target.value)}
          >
            <option value="EFECTIVO" className="bg-slate-900">Efectivo</option>
            <option value="TRANSFERENCIA" className="bg-slate-900">Transferencia</option>
            <option value="TARJETA" className="bg-slate-900">Tarjeta</option>
          </select>
        </div>
      </div>

      <div className="space-y-3">
        <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest ml-1">Añadir Productos</label>
        <div className="relative">
          <input 
            type="text"
            className="w-full p-4 bg-white/5 border border-white/5 rounded-2xl outline-none focus:border-accent-500/50 focus:bg-white/10 text-white placeholder:text-slate-700 font-bold transition-all"
            placeholder="Buscar por nombre o SKU..."
            value={search}
            onChange={e => setSearch(e.target.value)}
          />
          {search && productos.length > 0 && (
            <div className="absolute top-full left-0 right-0 z-20 bg-slate-900 border border-white/10 shadow-2xl rounded-2xl mt-2 max-h-60 overflow-auto overflow-x-hidden">
              {productos.map((p: any) => (
                <button 
                  key={p.id}
                  type="button"
                  onClick={() => addItem(p)}
                  className="w-full p-4 text-left hover:bg-white/5 border-b border-white/5 flex justify-between items-center transition-colors group"
                >
                  <div>
                    <p className="font-bold text-white group-hover:text-accent-500 transition-colors">{p.nombre}</p>
                    <p className="text-[10px] text-slate-500 font-black uppercase tracking-widest">{p.sku}</p>
                  </div>
                  <span className="text-sm font-black text-white bg-white/5 px-3 py-1 rounded-lg border border-white/5">${p.precio_costo}</span>
                </button>
              ))}
            </div>
          )}
        </div>
      </div>

      <div className="bg-slate-950/30 border border-white/5 rounded-3xl overflow-hidden shadow-inner">
        <table className="w-full text-sm">
          <thead className="bg-white/[0.02] border-b border-white/5">
            <tr>
              <th className="p-4 text-left text-[10px] font-black text-slate-500 uppercase tracking-widest">Producto</th>
              <th className="p-4 text-center w-24 text-[10px] font-black text-slate-500 uppercase tracking-widest">Cant.</th>
              <th className="p-4 text-center w-32 text-[10px] font-black text-slate-500 uppercase tracking-widest">P. Unit.</th>
              <th className="p-4 text-right text-[10px] font-black text-slate-500 uppercase tracking-widest">Total</th>
              <th className="p-4 w-12"></th>
            </tr>
          </thead>
          <tbody className="divide-y divide-white/5">
            {items.map(item => (
              <tr key={item.producto_id} className="hover:bg-white/[0.01] transition-colors">
                <td className="p-4">
                  <p className="font-bold text-white leading-tight">{item.nombre}</p>
                </td>
                <td className="p-4">
                  <input 
                    type="number" 
                    className="w-full bg-slate-900 border border-white/10 rounded-xl p-2 text-center text-white font-bold text-xs outline-none focus:border-accent-500"
                    value={item.cantidad}
                    onChange={e => updateItem(item.producto_id, 'cantidad', Number(e.target.value))}
                  />
                </td>
                <td className="p-4">
                  <input 
                    type="number" 
                    className="w-full bg-slate-900 border border-white/10 rounded-xl p-2 text-center text-white font-bold text-xs outline-none focus:border-accent-500"
                    value={item.precio_unitario}
                    onChange={e => updateItem(item.producto_id, 'precio_unitario', Number(e.target.value))}
                  />
                </td>
                <td className="p-4 text-right">
                  <span className="font-black text-white tracking-tight">${(item.cantidad * item.precio_unitario).toLocaleString()}</span>
                </td>
                <td className="p-4 text-center">
                  <button type="button" onClick={() => removeItem(item.producto_id)} className="text-slate-600 hover:text-rose-400 transition-colors">
                    <Trash2 size={18}/>
                  </button>
                </td>
              </tr>
            ))}
            {items.length === 0 && (
              <tr><td colSpan={5} className="p-12 text-center text-slate-600 font-bold tracking-tight uppercase text-xs opacity-50">No hay ítems en la lista de compra</td></tr>
            )}
          </tbody>
          <tfoot className="bg-white/5 border-t border-white/5">
            <tr>
              <td colSpan={3} className="p-6 text-right text-[10px] font-black text-slate-500 uppercase tracking-widest">Total de la Operación:</td>
              <td className="p-6 text-right">
                <span className="text-3xl font-black text-white tracking-tighter">${total.toLocaleString()}</span>
              </td>
              <td></td>
            </tr>
          </tfoot>
        </table>
      </div>

      <div className="flex justify-end gap-3 pt-8 border-t border-white/5">
        <button 
          type="button" 
          onClick={onSuccess} 
          className="px-8 py-4 text-slate-500 font-black text-xs uppercase tracking-widest hover:text-white transition-all"
        >
          Cancelar
        </button>
        <button 
          disabled={mutation.isPending || items.length === 0 || !proveedorId}
          className="px-10 py-4 bg-white text-slate-950 font-black text-xs uppercase tracking-widest rounded-2xl shadow-xl hover:bg-slate-200 transition-all disabled:opacity-50 disabled:cursor-not-allowed active:scale-95"
        >
          {mutation.isPending ? 'Procesando...' : 'Registrar Compra'}
        </button>
      </div>
    </form>
  );
};
