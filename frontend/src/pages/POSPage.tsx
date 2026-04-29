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
  ArrowRight,
  Loader2,
  X
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
      setCart(cart.map(item => 
        item.id === product.id ? { ...item, cantidad: item.cantidad + 1 } : item
      ));
    } else {
      setCart([...cart, { ...product, cantidad: 1 }]);
    }
    setSearch('');
  };

  const updateQuantity = (id: number, delta: number) => {
    setCart(cart.map(item => {
      if (item.id === id) {
        const newQty = Math.max(1, item.cantidad + delta);
        return { ...item, cantidad: newQty };
      }
      return item;
    }));
  };

  const removeFromCart = (id: number) => {
    setCart(cart.filter(item => item.id !== id));
  };

  const subtotal = cart.reduce((acc, item) => acc + (item.precio_venta * item.cantidad), 0);
  const total = subtotal - descuento;

  const mutation = useMutation({
    mutationFn: (data: any) => api.post('/ventas/ventas/', data),
    onSuccess: (res) => {
      setLastVenta(res.data.data);
      setCart([]);
      setCliente(null);
      setDescuento(0);
      setIsSuccessModalOpen(true);
      queryClient.invalidateQueries({ queryKey: ['dashboard-stats'] });
    }
  });

  const handleFinalize = () => {
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
      <div className="h-full flex flex-col items-center justify-center text-center p-8 bg-white/5 backdrop-blur-sm rounded-[3rem] border border-white/5">
        <div className="p-8 bg-amber-500/10 rounded-full text-amber-500 mb-8 animate-pulse shadow-[0_0_30px_rgba(245,158,11,0.2)]">
          <AlertTriangle size={80} />
        </div>
        <h2 className="text-4xl font-black text-white mb-4 tracking-tighter">Caja Cerrada</h2>
        <p className="text-slate-500 max-w-md mb-10 text-lg font-medium leading-relaxed">
          Debes abrir un turno de caja antes de poder realizar ventas. Es necesario para el control de arqueo y seguridad.
        </p>
        <Link 
          to="/app/caja" 
          className="px-10 py-5 bg-white text-slate-950 rounded-[1.5rem] font-black text-xl hover:bg-slate-200 shadow-xl shadow-white/5 transition-all active:scale-95 flex items-center gap-3 group"
        >
          <span>Gestionar Caja</span>
          <ArrowRight size={24} className="text-slate-400 group-hover:translate-x-1 transition-transform" />
        </Link>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 h-[calc(100vh-160px)]">
      {/* Selector de Productos */}
      <div className="lg:col-span-8 flex flex-col gap-6">
        <div className="bg-white/5 backdrop-blur-md p-6 rounded-[2.5rem] border border-white/5 shadow-2xl">
          <div className="relative group">
            <Search className="absolute left-5 top-1/2 -translate-y-1/2 text-slate-600 group-focus-within:text-primary-400 transition-colors" size={24} />
            <input 
              type="text" 
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Escribe nombre o SKU del producto..." 
              className="w-full pl-14 pr-6 py-5 bg-white/5 border border-white/5 focus:bg-white/10 focus:border-primary-500/50 rounded-[1.5rem] outline-none text-xl transition-all text-white placeholder:text-slate-600 font-bold"
            />
          </div>
          
          {productos.length > 0 && (
            <div className="mt-6 grid grid-cols-1 md:grid-cols-2 gap-4 max-h-[500px] overflow-auto pr-2 custom-scrollbar">
              {productos.map((prod: any) => (
                <button 
                  key={prod.id}
                  onClick={() => addToCart(prod)}
                  className="flex items-center gap-4 p-4 bg-white/5 border border-white/5 rounded-2xl hover:bg-white/10 hover:border-primary-500/30 transition-all text-left group"
                >
                  <div className="h-16 w-16 bg-white/5 rounded-xl flex items-center justify-center text-slate-500 group-hover:text-primary-400 transition-colors border border-white/5">
                    <Package size={32} />
                  </div>
                  <div className="flex-1">
                    <p className="font-black text-white text-lg leading-tight mb-1">{prod.nombre}</p>
                    <p className="text-[10px] text-slate-500 font-black uppercase tracking-widest">{prod.sku}</p>
                    <p className="text-xl font-black text-primary-400 mt-1">${Number(prod.precio_venta).toLocaleString()}</p>
                  </div>
                  <div className="p-2 bg-primary-500/10 text-primary-400 rounded-xl opacity-0 group-hover:opacity-100 transition-opacity">
                    <Plus size={20} />
                  </div>
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Cliente y Otros */}
        <div className="bg-white/5 backdrop-blur-md p-8 rounded-[2.5rem] border border-white/5">
          <h3 className="text-xs font-black text-slate-500 uppercase tracking-[0.2em] mb-6">Información del Cliente</h3>
          <div className="flex flex-col md:flex-row gap-6 items-center">
            <div className="flex-1 relative w-full group">
              <UserIcon className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-500 group-focus-within:text-primary-400" size={20} />
              <input 
                type="text"
                placeholder="Buscar cliente por nombre o DNI..."
                className="w-full pl-12 pr-4 py-4 bg-white/5 border border-white/5 rounded-2xl text-white outline-none focus:border-primary-500/50"
                value={clientSearch}
                onChange={e => setClientSearch(e.target.value)}
              />
              {clientes.length > 0 && clientSearch && (
                <div className="absolute top-full left-0 right-0 mt-2 bg-slate-900 border border-white/10 rounded-2xl shadow-2xl z-50 overflow-hidden">
                  {clientes.map((c: any) => (
                    <button 
                      key={c.id}
                      onClick={() => { setCliente(c); setClientSearch(''); }}
                      className="w-full p-4 text-left hover:bg-white/5 text-white font-bold border-b border-white/5 last:border-0"
                    >
                      {c.nombre} <span className="text-slate-500 text-xs ml-2">({c.documento})</span>
                    </button>
                  ))}
                </div>
              )}
            </div>
            {cliente && (
              <div className="flex items-center gap-4 p-4 bg-primary-500/10 border border-primary-500/20 rounded-2xl text-white">
                <div className="w-10 h-10 bg-primary-500 rounded-xl flex items-center justify-center font-black">
                  {cliente.nombre.charAt(0)}
                </div>
                <div>
                  <p className="text-sm font-black tracking-tight">{cliente.nombre}</p>
                  <p className="text-[10px] text-primary-400 font-bold uppercase tracking-widest">{cliente.documento}</p>
                </div>
                <button onClick={() => setCliente(null)} className="text-slate-500 hover:text-white transition-colors">
                  <X size={18} />
                </button>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Carrito y Cobro */}
      <div className="lg:col-span-4 flex flex-col bg-slate-900 rounded-[3rem] border border-white/5 shadow-2xl overflow-hidden relative">
        <div className="p-8 border-b border-white/5 flex items-center justify-between bg-white/[0.02]">
          <h3 className="text-xl font-black text-white tracking-tighter uppercase tracking-widest text-xs opacity-50">Carrito de Venta</h3>
          <span className="px-3 py-1 bg-white/10 text-white text-[10px] font-black rounded-lg border border-white/10">
            {cart.reduce((acc, item) => acc + item.cantidad, 0)} ITEMS
          </span>
        </div>

        <div className="flex-1 overflow-auto p-6 space-y-4 custom-scrollbar">
          {cart.length === 0 ? (
            <div className="h-full flex flex-col items-center justify-center text-slate-700 gap-4 opacity-20">
              <ShoppingCart size={80} strokeWidth={1} />
              <p className="font-black text-xs uppercase tracking-[0.2em]">Carrito Vacío</p>
            </div>
          ) : (
            cart.map(item => (
              <div key={item.id} className="p-4 bg-white/5 rounded-2xl border border-white/5 group relative overflow-hidden transition-all hover:bg-white/[0.08]">
                <div className="flex justify-between items-start mb-3">
                  <div className="flex-1">
                    <p className="font-black text-white text-sm leading-tight pr-8">{item.nombre}</p>
                    <p className="text-[10px] text-slate-500 font-bold uppercase mt-1 tracking-wider">${Number(item.precio_venta).toLocaleString()} c/u</p>
                  </div>
                  <button 
                    onClick={() => removeFromCart(item.id)}
                    className="p-1.5 text-slate-600 hover:text-rose-400 hover:bg-rose-500/10 rounded-lg transition-all"
                  >
                    <Trash2 size={16} />
                  </button>
                </div>
                <div className="flex items-center justify-between">
                  <div className="flex items-center bg-slate-950 rounded-xl border border-white/5 p-1">
                    <button 
                      onClick={() => updateQuantity(item.id, -1)}
                      className="p-1.5 hover:bg-white/5 rounded-lg text-slate-400 transition-colors"
                    >
                      <Minus size={14} />
                    </button>
                    <span className="w-10 text-center font-black text-white text-sm">{item.cantidad}</span>
                    <button 
                      onClick={() => updateQuantity(item.id, 1)}
                      className="p-1.5 hover:bg-white/5 rounded-lg text-slate-400 transition-colors"
                    >
                      <Plus size={14} />
                    </button>
                  </div>
                  <p className="font-black text-white text-lg tracking-tighter">${(item.precio_venta * item.cantidad).toLocaleString()}</p>
                </div>
              </div>
            ))
          )}
        </div>

        {/* Totales y Finalizar */}
        <div className="p-8 bg-slate-950/80 backdrop-blur-md border-t border-white/5 space-y-6">
          <div className="space-y-3">
            <div className="flex justify-between text-slate-500 font-bold text-xs uppercase tracking-widest">
              <span>Subtotal</span>
              <span className="text-white">${subtotal.toLocaleString()}</span>
            </div>
            {descuento > 0 && (
              <div className="flex justify-between text-rose-400 font-bold text-xs uppercase tracking-widest">
                <span>Descuento</span>
                <span>-${descuento.toLocaleString()}</span>
              </div>
            )}
            <div className="flex justify-between items-end pt-4 border-t border-white/5">
              <span className="text-[10px] font-black text-slate-600 uppercase tracking-[0.3em]">Total Cobro</span>
              <span className="text-5xl font-black text-white tracking-tighter shadow-primary-500/20 shadow-sm">${total.toLocaleString()}</span>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <button 
              onClick={() => setMetodoPago('EFECTIVO')}
              className={`py-3 rounded-xl font-black text-[10px] tracking-widest transition-all border ${metodoPago === 'EFECTIVO' ? 'bg-primary-500 text-white border-primary-400 shadow-lg shadow-primary-500/20' : 'bg-white/5 text-slate-500 border-white/5 hover:bg-white/10'}`}
            >
              EFECTIVO
            </button>
            <button 
              onClick={() => setMetodoPago('TRANSFERENCIA')}
              className={`py-3 rounded-xl font-black text-[10px] tracking-widest transition-all border ${metodoPago === 'TRANSFERENCIA' ? 'bg-primary-500 text-white border-primary-400 shadow-lg shadow-primary-500/20' : 'bg-white/5 text-slate-500 border-white/5 hover:bg-white/10'}`}
            >
              TRANSFERENCIA
            </button>
          </div>

          <button
            onClick={handleFinalize}
            disabled={cart.length === 0 || mutation.isPending}
            className="w-full py-6 bg-white hover:bg-slate-200 disabled:bg-slate-800 disabled:text-slate-600 text-slate-950 text-2xl font-black rounded-[2rem] shadow-2xl transition-all active:scale-95 flex items-center justify-center gap-3 group"
          >
            {mutation.isPending ? <Loader2 className="animate-spin" /> : (
              <>
                <span>FINALIZAR COBRO</span>
                <ArrowRight size={28} className="text-slate-400 group-hover:translate-x-2 transition-transform" />
              </>
            )}
          </button>
        </div>
      </div>

      {/* Modal de Éxito */}
      <Modal isOpen={isSuccessModalOpen} onClose={() => setIsSuccessModalOpen(false)} title="VENTA FINALIZADA">
        <div className="text-center space-y-8 p-4">
          <div className="flex justify-center">
            <div className="p-6 bg-emerald-500/10 text-emerald-400 rounded-full shadow-[0_0_50px_rgba(16,185,129,0.2)] border border-emerald-500/20 animate-bounce">
              <CheckCircle2 size={64} />
            </div>
          </div>
          <div>
            <h4 className="text-3xl font-black text-white tracking-tighter">¡Operación Exitosa!</h4>
            <p className="text-slate-500 font-bold uppercase tracking-widest text-[10px] mt-2">Ticket Nro: {lastVenta?.nro_comprobante}</p>
          </div>
          <div className="bg-white/5 p-8 rounded-[2rem] border border-dashed border-white/10 relative overflow-hidden">
            <div className="absolute top-0 right-0 w-20 h-20 bg-emerald-500/5 rounded-full -mr-10 -mt-10 blur-2xl"></div>
            <p className="text-xs font-black text-slate-500 uppercase tracking-[0.2em] mb-2">Total Recibido</p>
            <p className="text-5xl font-black text-white tracking-tighter">${Number(lastVenta?.total).toLocaleString()}</p>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <button className="flex items-center justify-center gap-2 py-4 bg-white/5 border border-white/10 text-white rounded-2xl font-black text-xs tracking-widest hover:bg-white/10 transition-all">
              <Receipt size={18} />
              IMPRIMIR
            </button>
            <button 
              onClick={() => setIsSuccessModalOpen(false)}
              className="py-4 bg-white text-slate-950 rounded-2xl font-black text-xs tracking-widest hover:bg-slate-200 transition-all"
            >
              NUEVA VENTA
            </button>
          </div>
        </div>
      </Modal>
    </div>
  );
};
