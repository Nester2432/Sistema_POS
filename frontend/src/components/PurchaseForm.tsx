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
    <form onSubmit={handleSubmit} className="space-y-6">
      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-2">
          <label className="text-xs font-bold text-slate-400 uppercase">Proveedor</label>
          <select 
            required
            className="w-full p-3 bg-slate-50 border rounded-xl outline-none"
            value={proveedorId}
            onChange={e => setProveedorId(e.target.value)}
          >
            <option value="">Seleccionar Proveedor...</option>
            {proveedores.map((p: any) => (
              <option key={p.id} value={p.id}>{p.nombre}</option>
            ))}
          </select>
        </div>
        <div className="space-y-2">
          <label className="text-xs font-bold text-slate-400 uppercase">Nro. Factura</label>
          <input 
            required
            className="w-full p-3 bg-slate-50 border rounded-xl outline-none"
            value={nroFactura}
            onChange={e => setNroFactura(e.target.value)}
            placeholder="0001-00001234"
          />
        </div>
        <div className="space-y-2 col-span-full">
          <label className="text-xs font-bold text-slate-400 uppercase">Método de Pago</label>
          <select 
            className="w-full p-3 bg-slate-50 border rounded-xl outline-none"
            value={metodoPago}
            onChange={e => setMetodoPago(e.target.value)}
          >
            <option value="EFECTIVO">Efectivo</option>
            <option value="TRANSFERENCIA">Transferencia</option>
            <option value="TARJETA">Tarjeta</option>
          </select>
        </div>
      </div>

      <div className="space-y-2">
        <label className="text-xs font-bold text-slate-400 uppercase">Añadir Productos</label>
        <div className="relative">
          <input 
            type="text"
            className="w-full p-3 bg-slate-50 border rounded-xl outline-none"
            placeholder="Buscar por nombre o SKU..."
            value={search}
            onChange={e => setSearch(e.target.value)}
          />
          {search && productos.length > 0 && (
            <div className="absolute top-full left-0 right-0 z-20 bg-white border shadow-xl rounded-xl mt-1 max-h-40 overflow-auto">
              {productos.map((p: any) => (
                <button 
                  key={p.id}
                  type="button"
                  onClick={() => addItem(p)}
                  className="w-full p-3 text-left hover:bg-primary-50 border-b flex justify-between"
                >
                  <span className="font-bold">{p.nombre}</span>
                  <span className="text-slate-400">Coste: ${p.precio_costo}</span>
                </button>
              ))}
            </div>
          )}
        </div>
      </div>

      <div className="border rounded-2xl overflow-hidden">
        <table className="w-full text-sm">
          <thead className="bg-slate-50 border-b">
            <tr>
              <th className="p-3 text-left">Producto</th>
              <th className="p-3 text-center w-24">Cant.</th>
              <th className="p-3 text-center w-32">Precio Unit.</th>
              <th className="p-3 text-right">Total</th>
              <th className="p-3"></th>
            </tr>
          </thead>
          <tbody className="divide-y">
            {items.map(item => (
              <tr key={item.producto_id}>
                <td className="p-3 font-bold">{item.nombre}</td>
                <td className="p-3">
                  <input 
                    type="number" 
                    className="w-full p-1 border rounded text-center"
                    value={item.cantidad}
                    onChange={e => updateItem(item.producto_id, 'cantidad', Number(e.target.value))}
                  />
                </td>
                <td className="p-3">
                  <input 
                    type="number" 
                    className="w-full p-1 border rounded text-center"
                    value={item.precio_unitario}
                    onChange={e => updateItem(item.producto_id, 'precio_unitario', Number(e.target.value))}
                  />
                </td>
                <td className="p-3 text-right font-bold">${(item.cantidad * item.precio_unitario).toFixed(2)}</td>
                <td className="p-3 text-center">
                  <button type="button" onClick={() => removeItem(item.producto_id)} className="text-rose-500"><Trash2 size={16}/></button>
                </td>
              </tr>
            ))}
            {items.length === 0 && (
              <tr><td colSpan={5} className="p-8 text-center text-slate-400 italic">No hay ítems en la compra</td></tr>
            )}
          </tbody>
          <tfoot className="bg-slate-900 text-white font-bold">
            <tr>
              <td colSpan={3} className="p-3 text-right">TOTAL COMPRA:</td>
              <td className="p-3 text-right text-lg">${total.toFixed(2)}</td>
              <td></td>
            </tr>
          </tfoot>
        </table>
      </div>

      <div className="flex justify-end gap-3 pt-4">
        <button type="button" onClick={onSuccess} className="px-6 py-2 font-bold text-slate-500">Cancelar</button>
        <button 
          disabled={mutation.isPending || items.length === 0}
          className="px-8 py-3 bg-primary-600 text-white font-bold rounded-xl shadow-lg disabled:bg-slate-300"
        >
          {mutation.isPending ? 'Procesando...' : 'Registrar Compra'}
        </button>
      </div>
    </form>
  );
};
