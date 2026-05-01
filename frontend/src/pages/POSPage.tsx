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
import { VarianteSelectorModal } from './POS/VarianteSelectorModal';
import type { ProductoVariante } from '../types/variantes';

export const POSPage = () => {
  const queryClient = useQueryClient();
  const [cart, setCart] = useState<any[]>([]);
  const [search, setSearch] = useState('');
  const [cliente, setCliente] = useState<any>(null);
  const [descuento, setDescuento] = useState(0);
  const [pagos, setPagos] = useState<any[]>([{ metodo_pago: 'EFECTIVO', monto: 0, referencia: '' }]);
  const [isSuccessModalOpen, setIsSuccessModalOpen] = useState(false);
  const [lastVenta, setLastVenta] = useState<any>(null);
  const [variantProduct, setVariantProduct] = useState<any>(null);

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
      const res = await api.get(`/inventario/productos/?search=${search}`);
      const body = res.data;
      return body.results || body.data?.results || body.data || [];
    },
    enabled: search.length >= 2,
  });

  // 3. Buscar Clientes
  const [clientSearch, setClientSearch] = useState('');
  const { data: clientes = [] } = useQuery({
    queryKey: ['clientes-pos', clientSearch],
    queryFn: async () => {
      const res = await api.get(`/clientes/clientes/?search=${clientSearch}`);
      const body = res.data;
      return body.results || body.data?.results || body.data || [];
    }
  });

  const addToCart = (product: any, variante?: ProductoVariante) => {
    // Si el producto tiene variantes y no se ha pasado una, abrir modal
    if (product.tiene_variantes && !variante) {
      setVariantProduct(product);
      return;
    }

    const itemId = variante ? `${product.id}-${variante.id}` : `${product.id}`;
    const itemPrice = variante && Number(variante.precio_venta) > 0 ? Number(variante.precio_venta) : Number(product.precio_venta);
    const itemName = variante ? `${product.nombre} (${variante.valores_detalle.map(v => v.valor_nombre).join('/')})` : product.nombre;

    const existing = cart.find(item => item.cartId === itemId);
    if (existing) {
      setCart(cart.map(item => 
        item.cartId === itemId ? { ...item, cantidad: item.cantidad + 1 } : item
      ));
    } else {
      setCart([...cart, { 
        ...product, 
        cartId: itemId,
        varianteId: variante?.id,
        nombre: itemName,
        precio_venta: itemPrice,
        cantidad: 1 
      }]);
    }
    setSearch('');
    setVariantProduct(null);
  };

  const updateQuantity = (cartId: string, delta: number) => {
    setCart(cart.map(item => {
      if (item.cartId === cartId) {
        const newQty = Math.max(1, item.cantidad + delta);
        return { ...item, cantidad: newQty };
      }
      return item;
    }));
  };

  const removeFromCart = (cartId: string) => {
    setCart(cart.filter(item => item.cartId !== cartId));
  };

  const subtotal = cart.reduce((acc, item) => acc + (item.precio_venta * item.cantidad), 0);
  const total = subtotal - descuento;
  const totalPagado = pagos.reduce((acc, p) => acc + Number(p.monto || 0), 0);
  const restante = total - totalPagado;

  const mutation = useMutation({
    mutationFn: (data: any) => api.post('/ventas/ventas/', data),
    onSuccess: (res) => {
      setLastVenta(res.data.data);
      setCart([]);
      setCliente(null);
      setDescuento(0);
      setPagos([{ metodo_pago: 'EFECTIVO', monto: 0, referencia: '' }]);
      setIsSuccessModalOpen(true);
      queryClient.invalidateQueries({ queryKey: ['dashboard-stats'] });
    }
  });

  const handleFinalize = () => {
    if (Math.abs(restante) > 0.01) return; // Validación de seguridad extra

    mutation.mutate({
      items: cart.map(item => ({ 
        producto_id: item.id, 
        variante_id: item.varianteId,
        cantidad: item.cantidad 
      })),
      pagos: pagos.filter(p => Number(p.monto) > 0),
      tipo_comprobante: 'TICKET',
      cliente_id: cliente?.id,
      descuento_total: descuento
    });
  };

  const addPago = () => {
    setPagos([...pagos, { metodo_pago: 'EFECTIVO', monto: 0, referencia: '' }]);
  };

  const updatePago = (index: number, field: string, value: any) => {
    const newPagos = [...pagos];
    newPagos[index] = { ...newPagos[index], [field]: value };
    setPagos(newPagos);
  };

  const removePago = (index: number) => {
    setPagos(pagos.filter((_, i) => i !== index));
  };

  const completarRestante = (index: number) => {
    const newPagos = [...pagos];
    const currentMonto = Number(newPagos[index].monto || 0);
    newPagos[index].monto = (currentMonto + restante).toFixed(2);
    setPagos(newPagos);
  };

  if (!caja) {
    return (
      <div className="h-full flex flex-col items-center justify-center text-center p-12 bg-white/5 backdrop-blur-md rounded-2xl border border-white/5">
        <div className="p-6 bg-amber-500/10 rounded-full text-amber-500 mb-6">
          <AlertTriangle size={64} />
        </div>
        <h2 className="text-2xl font-bold text-white mb-2 tracking-tight">Caja Cerrada</h2>
        <p className="text-slate-500 max-w-sm mb-8 text-sm font-medium leading-relaxed">
          Debes abrir un turno de caja antes de poder realizar ventas. Es necesario para el control de arqueo y seguridad.
        </p>
        <Link 
          to="/app/caja" 
          className="flex items-center gap-2 px-8 py-3 bg-white text-slate-950 rounded-xl font-bold text-sm hover:bg-slate-200 transition-all shadow-lg active:scale-[0.98]"
        >
          <span>Gestionar Caja</span>
          <ArrowRight size={18} />
        </Link>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 h-[calc(100vh-120px)]">
      {/* Selector de Productos */}
      <div className="lg:col-span-8 flex flex-col gap-6">
        <div className="bg-white/5 backdrop-blur-md p-4 rounded-2xl border border-white/5 shadow-xl">
          <div className="relative group">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-500 group-focus-within:text-accent-500 transition-colors" size={20} />
            <input 
              type="text" 
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Buscar producto por nombre o código..." 
              className="w-full pl-11 pr-4 py-3 bg-slate-900/50 border border-white/5 focus:border-accent-500/50 rounded-xl outline-none text-base transition-all text-white placeholder:text-slate-600 font-medium"
            />
          </div>
          
          {productos.length > 0 && (
            <div className="mt-4 grid grid-cols-1 md:grid-cols-2 gap-3 max-h-[400px] overflow-auto pr-1">
              {productos.map((prod: any) => (
                <button 
                  key={prod.id}
                  onClick={() => addToCart(prod)}
                  className="flex items-center gap-4 p-3 bg-white/5 border border-white/5 rounded-xl hover:bg-white/10 hover:border-accent-500/30 transition-all text-left group"
                >
                  <div className="h-12 w-12 bg-slate-800 rounded-lg flex items-center justify-center text-slate-500 group-hover:text-accent-500 transition-colors border border-white/5">
                    <Package size={24} />
                  </div>
                  <div className="flex-1">
                    <p className="font-bold text-white text-sm leading-none mb-1">{prod.nombre}</p>
                    <p className="text-[10px] text-slate-500 font-medium uppercase tracking-widest">{prod.sku}</p>
                    <p className="text-base font-bold text-slate-200 mt-1">${Number(prod.precio_venta).toLocaleString()}</p>
                  </div>
                  <div className="p-2 bg-white/5 text-slate-400 rounded-lg opacity-0 group-hover:opacity-100 transition-opacity">
                    <Plus size={16} />
                  </div>
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Cliente */}
        <div className="bg-white/5 backdrop-blur-md p-6 rounded-2xl border border-white/5">
          <h3 className="text-[10px] font-bold text-slate-500 uppercase tracking-widest mb-4">Información del Cliente</h3>
          <div className="flex flex-col sm:flex-row gap-4 items-center">
            <div className="flex-1 relative w-full group">
              <UserIcon className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-500 group-focus-within:text-accent-500" size={18} />
              <input 
                type="text"
                placeholder="Buscar cliente..."
                className="w-full pl-11 pr-4 py-2.5 bg-slate-900/50 border border-white/5 rounded-xl text-sm text-white outline-none focus:border-accent-500/50"
                value={clientSearch}
                onChange={e => setClientSearch(e.target.value)}
              />
              {clientes.length > 0 && clientSearch && (
                <div className="absolute top-full left-0 right-0 mt-2 bg-slate-900 border border-white/10 rounded-xl shadow-2xl z-50 overflow-hidden">
                  {clientes.map((c: any) => (
                    <button 
                      key={c.id}
                      onClick={() => { setCliente(c); setClientSearch(''); }}
                      className="w-full p-3 text-left hover:bg-white/5 text-sm text-white font-medium border-b border-white/5 last:border-0"
                    >
                      {c.nombre} <span className="text-slate-500 text-xs ml-2">({c.documento})</span>
                    </button>
                  ))}
                </div>
              )}
            </div>
            {cliente && (
              <div className="flex items-center gap-3 px-4 py-2 bg-accent-500/10 border border-accent-500/20 rounded-xl text-white">
                <div className="w-8 h-8 bg-accent-500 rounded-lg flex items-center justify-center font-bold text-xs">
                  {cliente.nombre.charAt(0)}
                </div>
                <div>
                  <p className="text-xs font-bold">{cliente.nombre}</p>
                  <p className="text-[10px] text-accent-500/80 font-medium">{cliente.documento}</p>
                </div>
                <button onClick={() => setCliente(null)} className="ml-2 text-slate-500 hover:text-white transition-colors">
                  <X size={16} />
                </button>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Carrito */}
      <div className="lg:col-span-4 flex flex-col bg-slate-900 rounded-2xl border border-white/5 shadow-2xl overflow-hidden relative">
        <div className="p-5 border-b border-white/5 flex items-center justify-between bg-white/[0.02]">
          <h3 className="text-xs font-bold text-slate-500 uppercase tracking-widest">Resumen de Venta</h3>
          <span className="px-2 py-0.5 bg-white/10 text-white text-[10px] font-bold rounded-md">
            {cart.reduce((acc, item) => acc + item.cantidad, 0)} items
          </span>
        </div>

        <div className="flex-1 overflow-auto p-4 space-y-3">
          {cart.length === 0 ? (
            <div className="h-full flex flex-col items-center justify-center text-slate-800 gap-3 opacity-40">
              <ShoppingCart size={48} strokeWidth={1.5} />
              <p className="text-[10px] font-bold uppercase tracking-widest">Esperando productos...</p>
            </div>
          ) : (
            cart.map(item => (
              <div key={item.id} className="p-3 bg-white/[0.02] rounded-xl border border-white/5 group transition-all hover:bg-white/[0.04]">
                <div className="flex justify-between items-start mb-2">
                  <div className="flex-1">
                    <p className="font-semibold text-white text-sm leading-tight pr-6">{item.nombre}</p>
                    <p className="text-[10px] text-slate-500 font-medium mt-1">${Number(item.precio_venta).toLocaleString()} c/u</p>
                  </div>
                  <button 
                    onClick={() => removeFromCart(item.id)}
                    className="p-1 text-slate-600 hover:text-rose-400 transition-all"
                  >
                    <Trash2 size={14} />
                  </button>
                </div>
                <div className="flex items-center justify-between">
                  <div className="flex items-center bg-slate-950 rounded-lg border border-white/5 p-0.5">
                    <button 
                      onClick={() => updateQuantity(item.id, -1)}
                      className="p-1 hover:bg-white/5 rounded text-slate-400"
                    >
                      <Minus size={12} />
                    </button>
                    <span className="w-8 text-center font-bold text-white text-xs">{item.cantidad}</span>
                    <button 
                      onClick={() => updateQuantity(item.id, 1)}
                      className="p-1 hover:bg-white/5 rounded text-slate-400"
                    >
                      <Plus size={12} />
                    </button>
                  </div>
                  <p className="font-bold text-white text-base">${(item.precio_venta * item.cantidad).toLocaleString()}</p>
                </div>
              </div>
            ))
          )}
        </div>

        {/* Sección de Pagos Divididos */}
        <div className="p-6 bg-slate-950/80 backdrop-blur-md border-t border-white/5 space-y-6">
          <div className="flex justify-between items-end border-b border-white/5 pb-4">
            <div className="space-y-1">
              <span className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">Total a Pagar</span>
              <p className="text-4xl font-bold text-white tracking-tight">${total.toLocaleString()}</p>
            </div>
            <div className="text-right space-y-1">
              <span className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">Restante</span>
              <p className={`text-xl font-bold tracking-tight ${Math.abs(restante) < 0.01 ? 'text-emerald-500' : 'text-rose-500'}`}>
                ${restante.toLocaleString()}
              </p>
            </div>
          </div>

          <div className="space-y-3 max-h-48 overflow-auto pr-1">
            {pagos.map((pago, index) => (
              <div key={index} className="space-y-2 p-3 bg-white/5 rounded-xl border border-white/5 relative group">
                <div className="flex gap-2">
                  <select 
                    className="flex-1 bg-slate-900 border border-white/10 rounded-lg p-2 text-xs text-white outline-none focus:border-accent-500"
                    value={pago.metodo_pago}
                    onChange={(e) => updatePago(index, 'metodo_pago', e.target.value)}
                  >
                    <option value="EFECTIVO">Efectivo</option>
                    <option value="TARJETA">Tarjeta</option>
                    <option value="TRANSFERENCIA">Transferencia</option>
                    <option value="MERCADO_PAGO">Mercado Pago</option>
                    <option value="CUENTA_CORRIENTE">Cuenta Corriente</option>
                  </select>
                  <input 
                    type="number"
                    step="0.01"
                    placeholder="Monto"
                    className="w-28 bg-slate-900 border border-white/10 rounded-lg p-2 text-xs text-white text-right font-bold outline-none focus:border-accent-500"
                    value={pago.monto}
                    onChange={(e) => updatePago(index, 'monto', e.target.value)}
                  />
                  {pagos.length > 1 && (
                    <button onClick={() => removePago(index)} className="p-2 text-slate-600 hover:text-rose-400">
                      <Trash2 size={14} />
                    </button>
                  )}
                </div>
                <div className="flex justify-between items-center gap-2">
                  <input 
                    type="text"
                    placeholder="Referencia (opcional)"
                    className="flex-1 bg-transparent border-none text-[10px] text-slate-500 outline-none placeholder:text-slate-700 font-medium"
                    value={pago.referencia}
                    onChange={(e) => updatePago(index, 'referencia', e.target.value)}
                  />
                  <button 
                    onClick={() => completarRestante(index)}
                    className="text-[10px] font-black text-accent-500 uppercase tracking-widest hover:text-accent-400 transition-colors"
                  >
                    Completar Restante
                  </button>
                </div>
              </div>
            ))}
          </div>

          <button 
            onClick={addPago}
            className="w-full py-2 border border-dashed border-white/10 rounded-xl text-[10px] font-bold text-slate-500 uppercase tracking-widest hover:bg-white/5 hover:text-white transition-all"
          >
            + Añadir otro método de pago
          </button>

          <button
            onClick={handleFinalize}
            disabled={cart.length === 0 || mutation.isPending || Math.abs(restante) > 0.01}
            className="w-full py-4 bg-white hover:bg-slate-200 disabled:bg-slate-800/50 disabled:text-slate-600 text-slate-950 text-base font-bold rounded-2xl transition-all active:scale-[0.98] flex items-center justify-center gap-2 shadow-xl shadow-white/5"
          >
            {mutation.isPending ? <Loader2 className="animate-spin" size={20} /> : (
              <>
                <span>FINALIZAR VENTA</span>
                <ArrowRight size={20} />
              </>
            )}
          </button>
        </div>
      </div>

      {variantProduct && (
        <VarianteSelectorModal 
          producto={variantProduct}
          onSelect={(v) => addToCart(variantProduct, v)}
          onClose={() => setVariantProduct(null)}
        />
      )}

      {isSuccessModalOpen && lastVenta && (
        <Modal isOpen={isSuccessModalOpen} onClose={() => setIsSuccessModalOpen(false)} title="Operación Exitosa">
        <div className="text-center space-y-6 p-2">
          <div className="flex justify-center">
            <div className="p-5 bg-emerald-500/10 text-emerald-500 rounded-full border border-emerald-500/20">
              <CheckCircle2 size={48} />
            </div>
          </div>
          <div>
            <h4 className="text-2xl font-bold text-white tracking-tight">Venta Completada</h4>
            <p className="text-slate-500 font-medium text-xs mt-1">Comprobante: {lastVenta?.nro_comprobante}</p>
          </div>
          <div className="bg-white/5 p-6 rounded-2xl border border-white/5">
            <p className="text-[10px] font-bold text-slate-500 uppercase tracking-widest mb-1">Monto Cobrado</p>
            <p className="text-4xl font-bold text-white tracking-tight">${Number(lastVenta?.total).toLocaleString()}</p>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <button className="flex items-center justify-center gap-2 py-3 bg-white/5 border border-white/10 text-white rounded-xl text-xs font-bold hover:bg-white/10">
              <Receipt size={16} />
              Ticket
            </button>
            <button 
              onClick={() => setIsSuccessModalOpen(false)}
              className="py-3 bg-white text-slate-950 rounded-xl text-xs font-bold hover:bg-slate-200"
            >
              Nueva Venta
            </button>
          </div>
        </div>
      </Modal>
      )}
    </div>
  );
};
