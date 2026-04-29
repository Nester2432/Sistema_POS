import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Link } from 'react-router-dom';
import api from '../api/axios';
import { Modal } from '../components/Modal';
import { 
  Search, 
  Plus, 
  Minus, 
  Trash2, 
  User as UserIcon, 
  CheckCircle2,
  Package,
  ShoppingCart,
  AlertTriangle,
  Receipt,
  ArrowRight
} from 'lucide-react';

export const POSPage = () => {
  const queryClient = useQueryClient();
  const [cart, setCart] = useState<any[]>([]);
  const [search, setSearch] = useState('');
  const [cliente, setCliente] = useState<any>(null);
  const [metodoPago, setMetodoPago] = useState('EFECTIVO');
  const [descuento, setDescuento] = useState(0);
  const [isSuccessModalOpen, setIsSuccessModalOpen] = useState(false);
  const [lastVenta, setLastVenta] = useState<any>(null);

  // 1. Verificar Estado de Caja
  const { data: caja } = useQuery({
    queryKey: ['caja-mi-caja'],
    queryFn: async () => {
      const res = await api.get('/caja/mi-caja/');
      return res.data.data;
    }
  });

  // 2. Buscar productos
  const { data: productos = [] } = useQuery({
    queryKey: ['productos-pos', search],
    queryFn: async () => {
      if (search.length < 2) return [];
      const response = await api.get(`/inventario/productos/?search=${search}`);
      return response.data.data.results;
    },
    enabled: search.length >= 2,
  });

  // 3. Buscar Clientes
  const [clientSearch, setClientSearch] = useState('');
  const { data: clientes = [] } = useQuery({
    queryKey: ['clientes-pos', clientSearch],
    queryFn: async () => {
      const res = await api.get(`/clientes/clientes/?search=${clientSearch}`);
      return res.data.data.results;
    }
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

  const subtotal = cart.reduce((acc, item) => acc + (Number(item.precio_venta) * item.cantidad), 0);
  const total = subtotal - descuento;

  const mutation = useMutation({
    mutationFn: (data: any) => api.post('/ventas/ventas/', data),
    onSuccess: (res) => {
      setLastVenta(res.data.data);
      setIsSuccessModalOpen(true);
      setCart([]);
      setCliente(null);
      setDescuento(0);
      queryClient.invalidateQueries({ queryKey: ['productos-pos'] });
    },
    onError: (err: any) => {
      alert('Error al procesar venta: ' + (err.response?.data?.message || 'Error desconocido'));
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

  if (!caja) {
    return (
      <div className="h-full flex flex-col items-center justify-center text-center p-8 bg-white/50 backdrop-blur-sm rounded-[3rem] border border-slate-100">
        <div className="p-8 bg-amber-50 rounded-full text-amber-500 mb-8 animate-pulse">
          <AlertTriangle size={80} />
        </div>
        <h2 className="text-4xl font-black text-slate-900 mb-4 tracking-tighter">Caja Cerrada</h2>
        <p className="text-slate-500 max-w-md mb-10 text-lg font-medium leading-relaxed">
          Debes abrir un turno de caja antes de poder realizar ventas. Es necesario para el control de arqueo y seguridad.
        </p>
        <Link 
          to="/app/caja" 
          className="px-10 py-5 bg-white text-slate-900 border border-slate-200 rounded-[1.5rem] font-bold text-xl hover:bg-slate-50 hover:border-slate-300 shadow-sm transition-all active:scale-95 flex items-center gap-3 group"
        >
          <span>Gestionar Caja</span>
          <ArrowRight size={24} className="text-slate-400 group-hover:translate-x-1 transition-transform" />
        </Link>
      </div>
    );
  }

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
              placeholder="Buscar producto por nombre o SKU..." 
              className="w-full pl-12 pr-4 py-4 bg-slate-50 border-transparent focus:bg-white focus:ring-2 focus:ring-primary-500 rounded-xl outline-none text-lg transition-all"
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
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Carrito */}
        <div className="flex-1 bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden flex flex-col">
          <div className="p-4 border-b bg-slate-50 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <ShoppingCart size={20} className="text-slate-500" />
              <h3 className="font-bold">Carrito</h3>
            </div>
            <button onClick={() => setCart([])} className="text-xs font-bold text-rose-500 hover:underline">LIMPIAR TODO</button>
          </div>
          <div className="flex-1 overflow-auto p-4">
            {cart.length === 0 ? (
              <div className="h-full flex flex-col items-center justify-center text-slate-400 gap-4 opacity-30">
                <ShoppingCart size={64} />
                <p className="font-bold">Carrito vacío</p>
              </div>
            ) : (
              <table className="w-full">
                <thead className="text-xs text-slate-400 uppercase border-b">
                  <tr>
                    <th className="text-left pb-2">Item</th>
                    <th className="text-center pb-2">Cant</th>
                    <th className="text-right pb-2">Total</th>
                    <th className="pb-2"></th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-50">
                  {cart.map((item) => (
                    <tr key={item.id} className="group">
                      <td className="py-4">
                        <p className="font-bold text-slate-900">{item.nombre}</p>
                        <p className="text-xs text-slate-500">${item.precio_venta}</p>
                      </td>
                      <td className="py-4 text-center">
                        <div className="flex items-center justify-center gap-2">
                          <button onClick={() => updateQty(item.id, -1)} className="p-1 hover:bg-slate-100 rounded text-slate-500"><Minus size={14}/></button>
                          <span className="font-bold w-6 text-center">{item.cantidad}</span>
                          <button onClick={() => updateQty(item.id, 1)} className="p-1 hover:bg-slate-100 rounded text-slate-500"><Plus size={14}/></button>
                        </div>
                      </td>
                      <td className="py-4 text-right font-bold text-slate-900">${(item.precio_venta * item.cantidad).toFixed(2)}</td>
                      <td className="py-4 text-right">
                        <button onClick={() => removeFromCart(item.id)} className="p-2 text-rose-300 hover:text-rose-600 transition-colors">
                          <Trash2 size={16} />
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

      {/* Panel Lateral de Cobro */}
      <div className="lg:col-span-4 bg-white rounded-xl shadow-lg border border-slate-200 flex flex-col overflow-hidden">
        <div className="p-6 bg-slate-900 text-white">
          <p className="text-slate-400 text-xs mb-1 uppercase font-bold tracking-widest">Total a pagar</p>
          <h2 className="text-5xl font-black font-mono">${total.toFixed(2)}</h2>
        </div>

        <div className="p-6 flex-1 space-y-6 overflow-y-auto">
          {/* Cliente Selector */}
          <div className="space-y-2">
            <label className="text-xs font-bold text-slate-400 uppercase">Cliente</label>
            <div className="flex gap-2">
              <div className="flex-1 p-3 bg-slate-50 border border-slate-200 rounded-xl flex items-center gap-2">
                <UserIcon size={18} className="text-slate-400" />
                <span className="font-bold text-slate-700">{cliente?.nombre || 'Consumidor Final'}</span>
              </div>
              <button 
                onClick={() => setCliente(null)}
                className="px-3 bg-slate-100 text-slate-400 hover:text-rose-500 rounded-xl"
              >
                <Trash2 size={18} />
              </button>
            </div>
            {!cliente && (
              <div className="relative">
                <input 
                  type="text"
                  placeholder="Buscar cliente..."
                  className="w-full text-xs p-2 bg-slate-50 border rounded-lg outline-none focus:ring-1 focus:ring-primary-500"
                  value={clientSearch}
                  onChange={e => setClientSearch(e.target.value)}
                />
                {clientSearch && clientes.length > 0 && (
                  <div className="absolute top-full left-0 right-0 z-10 mt-1 bg-white border shadow-xl rounded-lg max-h-40 overflow-auto">
                    {clientes.map((c: any) => (
                      <button 
                        key={c.id}
                        onClick={() => { setCliente(c); setClientSearch(''); }}
                        className="w-full p-2 text-left hover:bg-primary-50 text-xs border-b"
                      >
                        <p className="font-bold">{c.nombre} {c.apellido}</p>
                        <p className="text-[10px] text-slate-500">{c.documento}</p>
                      </button>
                    ))}
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Pago */}
          <div className="space-y-2">
            <label className="text-xs font-bold text-slate-400 uppercase">Forma de Pago</label>
            <div className="grid grid-cols-2 gap-2">
              {['EFECTIVO', 'TARJETA', 'TRANSFERENCIA', 'MERCADO_PAGO'].map((m) => (
                <button
                  key={m}
                  onClick={() => setMetodoPago(m)}
                  className={`p-3 rounded-xl border text-[10px] font-black transition-all ${
                    metodoPago === m 
                    ? 'bg-primary-600 border-primary-600 text-white shadow-lg' 
                    : 'bg-white border-slate-200 text-slate-500 hover:border-primary-400'
                  }`}
                >
                  {m.replace('_', ' ')}
                </button>
              ))}
            </div>
          </div>

          {/* Descuento */}
          <div className="space-y-2">
            <label className="text-xs font-bold text-slate-400 uppercase">Descuento ($)</label>
            <input 
              type="number"
              className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl text-lg font-bold outline-none focus:ring-2 focus:ring-primary-500"
              value={descuento}
              onChange={e => setDescuento(Number(e.target.value))}
            />
          </div>
        </div>

        <div className="p-6 border-t bg-slate-50">
          <button
            onClick={handleFinalize}
            disabled={cart.length === 0 || mutation.isPending}
            className="w-full py-5 bg-primary-600 hover:bg-primary-700 disabled:bg-slate-200 text-white text-xl font-black rounded-2xl shadow-xl shadow-primary-200 flex items-center justify-center gap-3 transition-all active:scale-95"
          >
            {mutation.isPending ? 'PROCESANDO...' : (
              <>
                <CheckCircle2 size={24} />
                COBRAR
              </>
            )}
          </button>
        </div>
      </div>

      {/* Modal de Éxito */}
      <Modal isOpen={isSuccessModalOpen} onClose={() => setIsSuccessModalOpen(false)} title="¡Venta Exitosa!">
        <div className="text-center space-y-6">
          <div className="flex justify-center">
            <div className="p-4 bg-emerald-100 text-emerald-600 rounded-full">
              <CheckCircle2 size={64} />
            </div>
          </div>
          <div>
            <h4 className="text-2xl font-bold text-slate-900">Venta Registrada</h4>
            <p className="text-slate-500">Comprobante: {lastVenta?.nro_comprobante}</p>
          </div>
          <div className="bg-slate-50 p-6 rounded-2xl border border-dashed border-slate-200">
            <p className="text-sm font-bold text-slate-400 uppercase mb-2">Total Cobrado</p>
            <p className="text-4xl font-black text-slate-900">${Number(lastVenta?.total).toFixed(2)}</p>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <button className="flex items-center justify-center gap-2 p-4 border-2 border-slate-200 rounded-2xl font-bold hover:bg-slate-50 transition-all">
              <Receipt size={20} />
              Imprimir Ticket
            </button>
            <button 
              onClick={() => setIsSuccessModalOpen(false)}
              className="p-4 bg-primary-600 text-white rounded-2xl font-bold hover:bg-primary-700 transition-all"
            >
              Nueva Venta
            </button>
          </div>
        </div>
      </Modal>
    </div>
  );
};
