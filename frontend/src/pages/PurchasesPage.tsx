import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import api from '../api/axios';
import { 
  Truck, 
  Plus, 
  Search, 
  Calendar, 
  Package, 
  CheckCircle2,
  AlertTriangle,
  ChevronRight
} from 'lucide-react';

export const PurchasesPage = () => {
  const [search, setSearch] = useState('');

  const { data, isLoading } = useQuery({
    queryKey: ['compras', search],
    queryFn: async () => {
      const response = await api.get(`/compras/?search=${search}`);
      return response.data.data;
    }
  });

  const purchases = data?.results || [];

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold text-slate-900 tracking-tight">Compras / Proveedores</h2>
          <p className="text-slate-500">Gestione el abastecimiento y deudas a proveedores</p>
        </div>
        <button className="flex items-center gap-2 px-5 py-2.5 bg-slate-900 text-white rounded-xl text-sm font-bold hover:bg-slate-800 transition-all shadow-lg">
          <Plus size={18} />
          Nueva Compra
        </button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-4">
        <div className="bg-white p-5 rounded-2xl border border-slate-100 shadow-sm">
          <p className="text-xs font-bold text-slate-400 uppercase mb-1">Total Compras Mes</p>
          <p className="text-2xl font-black text-slate-900">$125,800</p>
        </div>
        <div className="bg-white p-5 rounded-2xl border border-slate-100 shadow-sm">
          <p className="text-xs font-bold text-slate-400 uppercase mb-1">Proveedores</p>
          <p className="text-2xl font-black text-slate-900">24</p>
        </div>
        <div className="bg-white p-5 rounded-2xl border border-slate-100 shadow-sm">
          <p className="text-xs font-bold text-slate-400 uppercase mb-1">Pendiente Pago</p>
          <p className="text-2xl font-black text-rose-600">$18,400</p>
        </div>
        <div className="bg-white p-5 rounded-2xl border border-slate-100 shadow-sm">
          <p className="text-xs font-bold text-slate-400 uppercase mb-1">Recepciones Hoy</p>
          <p className="text-2xl font-black text-primary-600">3</p>
        </div>
      </div>

      <div className="bg-white p-4 rounded-2xl shadow-sm border border-slate-100 flex flex-col md:flex-row gap-4">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
          <input 
            type="text" 
            placeholder="Buscar por proveedor, comprobante..." 
            className="w-full pl-10 pr-4 py-2.5 bg-slate-50 border-transparent focus:bg-white focus:ring-2 focus:ring-slate-500 rounded-xl outline-none transition-all text-sm"
          />
        </div>
      </div>

      <div className="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead className="bg-slate-50 border-b border-slate-100">
              <tr>
                <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase">Proveedor / Fecha</th>
                <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase">Comprobante</th>
                <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase">Total</th>
                <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase">Estado</th>
                <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase"></th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {isLoading ? (
                <tr><td colSpan={5} className="px-6 py-8 text-center text-slate-400">Cargando compras...</td></tr>
              ) : purchases.length === 0 ? (
                <tr><td colSpan={5} className="px-6 py-8 text-center text-slate-400">No hay registros de compras</td></tr>
              ) : purchases.map((purchase: any) => (
                <tr key={purchase.id} className="hover:bg-slate-50 transition-all group">
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-3">
                      <div className="p-2 bg-slate-100 text-slate-400 rounded-lg">
                        <Truck size={18} />
                      </div>
                      <div>
                        <p className="font-bold text-slate-900">{purchase.proveedor_nombre}</p>
                        <p className="text-xs text-slate-400 flex items-center gap-1">
                          <Calendar size={12} /> {new Date(purchase.fecha).toLocaleDateString()}
                        </p>
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <span className="text-sm font-mono text-slate-600 bg-slate-50 px-2 py-1 rounded border">
                      {purchase.tipo_comprobante}: {purchase.numero_comprobante}
                    </span>
                  </td>
                  <td className="px-6 py-4 font-bold text-slate-900">
                    ${purchase.total}
                  </td>
                  <td className="px-6 py-4">
                    <span className={`px-2 py-1 rounded-full text-[10px] font-bold uppercase ${
                      purchase.estado === 'CONFIRMADA' ? 'bg-emerald-100 text-emerald-700' : 
                      purchase.estado === 'ANULADA' ? 'bg-rose-100 text-rose-700' : 'bg-amber-100 text-amber-700'
                    }`}>
                      {purchase.estado}
                    </span>
                  </td>
                  <td className="px-6 py-4 text-right">
                    <button className="p-2 text-slate-300 hover:text-primary-600 transition-colors">
                      <ChevronRight size={20} />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
