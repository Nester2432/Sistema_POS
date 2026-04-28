import React, { useState, useEffect } from 'react';
import { useQuery, useMutation } from '@tanstack/react-query';
import api from '../api/axios';
import { 
  Search, 
  Plus, 
  Minus, 
  Trash2, 
  User as UserIcon, 
  CreditCard, 
  CheckCircle2,
  Package,
  ShoppingCart
} from 'lucide-react';

export const POSPage = () => {
  const [cart, setCart] = useState<any[]>([]);
  const [search, setSearch] = useState('');
  const [cliente, setCliente] = useState<any>(null);
  const [metodoPago, setMetodoPago] = useState('EFECTIVO');
  const [descuento, setDescuento] = useState(0);

  // Buscar productos
  const { data: productos = [] } = useQuery({
    queryKey: ['productos-pos', search],
    queryFn: async () => {
      if (search.length < 2) return [];
      const response = await api.get(`/inventario/productos/?search=${search}`);
      return response.data.data.results;
    },
    enabled: search.length >= 2,
  });

  const addToCart = (product: any) => {
    const existing = cart.find(item => item.id === product.id);
    if (existing) {
      setCart(cart.map(item => item.id === product.id ? { ...item, cantidad: item.cantidad + 1 } : item));
    } else {
      setCart([...cart, { ...product, cantidad: 1 }]);
    }
    setSearch('');
  };

  const removeFromCart = (id: string) => setCart(cart.filter(item => item.id !== id));
  
  const updateQty = (id: string, delta: number) => {
    setCart(cart.map(item => {
      if (item.id === id) {
        const newQty = Math.max(1, item.cantidad + delta);
        return { ...item, cantidad: newQty };
      }
      return item;
    }));
  };

  const subtotal = cart.reduce((acc, item) => acc + (item.precio_venta * item.cantidad), 0);
  const total = subtotal - descuento;

  const mutation = useMutation({
    mutationFn: (data: any) => api.post('/ventas/', data),
    onSuccess: () => {
      alert('¡Venta realizada con éxito!');
      setCart([]);
      setCliente(null);
    },
    onError: (err: any) => {
      alert('Error: ' + err.response?.data?.message);
    }
  });

  const handleFinalize = () => {
    if (cart.length === 0) return;
    mutation.mutate({
      items: cart.map(item => ({ producto_id: item.id, cantidad: item.cantidad })),
      tipo_comprobante: 'TICKET',
      metodo_pago: metodoPago,
      cliente_id: cliente?.id,
      descuento_total: descuento
    });
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 h-[calc(100vh-140px)]">
      {/* Selector de Productos */}
      <div className="lg:col-span-8 flex flex-col gap-6">
        <div className="bg-white p-4 rounded-xl shadow-sm border border-slate-200">
          <div className="relative">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={20} />
            <input 
              type="text" 
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Escriba nombre, SKU o escanee código de barras..." 
              className="w-full pl-12 pr-4 py-4 bg-slate-50 border-transparent focus:bg-white focus:ring-2 focus:ring-primary-500 rounded-xl outline-none text-lg transition-all"
              autoFocus
            />
          </div>
          
          {productos.length > 0 && (
            <div className="mt-4 grid grid-cols-1 md:grid-cols-2 gap-3 max-h-96 overflow-auto">
              {productos.map((prod: any) => (
                <button 
                  key={prod.id}
                  onClick={() => addToCart(prod)}
                  className="flex items-center gap-4 p-3 border border-slate-100 rounded-lg hover:bg-primary-50 hover:border-primary-200 transition-all text-left"
                >
                  <div className="h-12 w-12 bg-slate-100 rounded flex items-center justify-center text-slate-400">
                    <Package size={24} />
                  </div>
                  <div className="flex-1">
                    <p className="font-semibold text-slate-900">{prod.nombre}</p>
                    <p className="text-sm text-slate-500">Stock: {prod.stock_actual} | SKU: {prod.sku}</p>
                  </div>
                  <div className="text-right">
                    <p className="font-bold text-primary-600">${prod.precio_venta}</p>
                  </div>
                  <Plus size={20} className="text-primary-500" />
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Carrito */}
        <div className="flex-1 bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden flex flex-col">
          <div className="p-4 border-b bg-slate-50 flex items-center gap-2">
            <ShoppingCart size={20} className="text-slate-500" />
            <h3 className="font-bold">Carrito de Ventas</h3>
          </div>
          <div className="flex-1 overflow-auto p-4">
            {cart.length === 0 ? (
              <div className="h-full flex flex-col items-center justify-center text-slate-400 gap-4">
                <ShoppingCart size={48} />
                <p>El carrito está vacío</p>
              </div>
            ) : (
              <table className="w-full">
                <thead className="text-xs text-slate-400 uppercase border-b">
                  <tr>
                    <th className="text-left pb-2">Producto</th>
                    <th className="text-center pb-2">Precio</th>
                    <th className="text-center pb-2">Cantidad</th>
                    <th className="text-right pb-2">Subtotal</th>
                    <th className="pb-2"></th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-50">
                  {cart.map((item) => (
                    <tr key={item.id} className="group">
                      <td className="py-4">
                        <p className="font-medium text-slate-900">{item.nombre}</p>
                        <p className="text-xs text-slate-500">{item.sku}</p>
                      </td>
                      <td className="py-4 text-center">${item.precio_venta}</td>
                      <td className="py-4">
                        <div className="flex items-center justify-center gap-3">
                          <button onClick={() => updateQty(item.id, -1)} className="p-1 hover:bg-slate-100 rounded text-slate-500"><Minus size={16}/></button>
                          <span className="font-bold w-8 text-center">{item.cantidad}</span>
                          <button onClick={() => updateQty(item.id, 1)} className="p-1 hover:bg-slate-100 rounded text-slate-500"><Plus size={16}/></button>
                        </div>
                      </td>
                      <td className="py-4 text-right font-bold text-slate-900">${(item.precio_venta * item.cantidad).toFixed(2)}</td>
                      <td className="py-4 text-right">
                        <button onClick={() => removeFromCart(item.id)} className="p-2 text-rose-400 hover:bg-rose-50 rounded-lg transition-colors">
                          <Trash2 size={18} />
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
        </div>
      </div>

      {/* Panel de Pago */}
      <div className="lg:col-span-4 bg-white rounded-xl shadow-lg border border-slate-200 flex flex-col overflow-hidden">
        <div className="p-6 bg-slate-900 text-white">
          <p className="text-slate-400 text-sm mb-1 uppercase font-semibold">Total a pagar</p>
          <h2 className="text-5xl font-bold font-mono">${total.toFixed(2)}</h2>
        </div>

        <div className="p-6 flex-1 space-y-6">
          {/* Cliente */}
          <div className="space-y-2">
            <label className="text-xs font-bold text-slate-400 uppercase">Cliente</label>
            <button className="w-full flex items-center justify-between p-3 bg-slate-50 border border-dashed border-slate-300 rounded-lg text-slate-600 hover:bg-slate-100 transition-all">
              <div className="flex items-center gap-2">
                <UserIcon size={18} />
                <span className="text-sm font-medium">{cliente?.nombre || 'Consumidor Final'}</span>
              </div>
              <Plus size={16} />
            </button>
          </div>

          {/* Método de Pago */}
          <div className="space-y-2">
            <label className="text-xs font-bold text-slate-400 uppercase">Método de Pago</label>
            <div className="grid grid-cols-2 gap-2">
              {['EFECTIVO', 'TARJETA', 'TRANSFERENCIA', 'MERCADO_PAGO'].map((m) => (
                <button
                  key={m}
                  onClick={() => setMetodoPago(m)}
                  className={`p-3 rounded-lg border text-xs font-bold transition-all ${
                    metodoPago === m 
                    ? 'bg-primary-600 border-primary-600 text-white shadow-md shadow-primary-100' 
                    : 'bg-white border-slate-200 text-slate-600 hover:border-primary-400'
                  }`}
                >
                  {m.replace('_', ' ')}
                </button>
              ))}
            </div>
          </div>

          {/* Descuentos */}
          <div className="space-y-2">
            <label className="text-xs font-bold text-slate-400 uppercase">Descuento ($)</label>
            <input 
              type="number" 
              value={descuento}
              onChange={(e) => setDescuento(Number(e.target.value))}
              className="w-full p-3 bg-slate-50 border border-slate-200 rounded-lg text-sm font-bold focus:ring-2 focus:ring-primary-500 outline-none"
            />
          </div>
        </div>

        <div className="p-6 border-t bg-slate-50">
          <button
            onClick={handleFinalize}
            disabled={cart.length === 0 || mutation.isPending}
            className="w-full py-5 bg-primary-600 hover:bg-primary-700 disabled:bg-slate-300 text-white text-xl font-bold rounded-2xl shadow-xl shadow-primary-200 flex items-center justify-center gap-3 transition-all active:scale-95"
          >
            {mutation.isPending ? 'Procesando...' : (
              <>
                <CheckCircle2 size={24} />
                FINALIZAR VENTA
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
};
