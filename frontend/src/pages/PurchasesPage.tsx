import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import api from '../api/axios';
import { Modal } from '../components/Modal';
import { PurchaseForm } from '../components/PurchaseForm';
import { 
  Plus, 
  Search, 
  Truck, 
  Calendar,
  ChevronRight,
  FileText
} from 'lucide-react';

export const PurchasesPage = () => {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');

  const { data: compras = [], isLoading } = useQuery({
    queryKey: ['compras', searchTerm],
    queryFn: async () => {
      const res = await api.get(`/compras/compras/?search=${searchTerm}`);
      const body = res.data;
      return body.results || body.data?.results || body.data || [];
    }
  });

  return (
    <div className="space-y-8">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 mb-12">
        <div>
          <h2 className="text-4xl font-black text-white tracking-tighter uppercase tracking-tight">Gestión de Compras</h2>
          <p className="text-slate-500 font-bold tracking-tight mt-1">Ingreso de mercadería y control de facturación de proveedores</p>
        </div>
        <button 
          onClick={() => setIsModalOpen(true)}
          className="flex items-center gap-3 px-8 py-4 bg-white text-slate-950 rounded-2xl text-sm font-black hover:bg-slate-200 transition-all shadow-xl shadow-white/5 active:scale-95 group"
        >
          <Plus size={20} className="text-primary-600 group-hover:rotate-90 transition-transform" />
          <span>REGISTRAR COMPRA</span>
        </button>
      </div>

      <div className="bg-white/5 backdrop-blur-md p-6 rounded-[2rem] border border-white/5 shadow-2xl mb-8">
        <div className="relative group">
          <Search className="absolute left-5 top-1/2 -translate-y-1/2 text-slate-600 group-focus-within:text-primary-400 transition-colors" size={20} />
          <input 
            type="text" 
            placeholder="Buscar por nro. comprobante o nombre del proveedor..." 
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-14 pr-4 py-4 bg-white/5 border border-white/5 focus:bg-white/10 focus:border-primary-500/50 rounded-2xl text-white outline-none transition-all font-medium placeholder:text-slate-700"
          />
        </div>
      </div>

      <div className="bg-white/5 backdrop-blur-md rounded-[2.5rem] border border-white/5 shadow-2xl overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead>
              <tr className="bg-white/[0.02] border-b border-white/5">
                <th className="px-8 py-6 text-[10px] font-black text-slate-500 uppercase tracking-[0.2em]">Comprobante</th>
                <th className="px-8 py-6 text-[10px] font-black text-slate-500 uppercase tracking-[0.2em]">Proveedor</th>
                <th className="px-8 py-6 text-[10px] font-black text-slate-500 uppercase tracking-[0.2em]">Fecha</th>
                <th className="px-8 py-6 text-[10px] font-black text-slate-500 uppercase tracking-[0.2em]">Total</th>
                <th className="px-8 py-6 text-[10px] font-black text-slate-500 uppercase tracking-[0.2em]">Estado</th>
                <th className="px-8 py-6 text-[10px] font-black text-slate-500 uppercase tracking-[0.2em] text-right">Acciones</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/5">
              {isLoading ? (
                <tr><td colSpan={6} className="px-8 py-12 text-center text-slate-500 font-bold uppercase tracking-widest text-xs">Cargando registros...</td></tr>
              ) : compras.length === 0 ? (
                <tr><td colSpan={6} className="px-8 py-12 text-center text-slate-500 font-bold italic">No hay compras registradas en el historial</td></tr>
              ) : compras.map((compra: any) => (
                <tr key={compra.id} className="hover:bg-white/[0.02] transition-colors group">
                  <td className="px-8 py-6">
                    <div className="flex items-center gap-4">
                      <div className="h-12 w-12 bg-white/5 border border-white/5 rounded-xl flex items-center justify-center text-slate-500 group-hover:text-primary-400 transition-colors">
                        <FileText size={24} />
                      </div>
                      <div>
                        <p className="font-black text-white tracking-tight leading-none mb-1">{compra.nro_comprobante}</p>
                        <p className="text-[10px] text-slate-500 font-black uppercase tracking-widest">{compra.tipo_comprobante}</p>
                      </div>
                    </div>
                  </td>
                  <td className="px-8 py-6">
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 bg-white/5 rounded-lg flex items-center justify-center">
                        <Truck size={14} className="text-slate-500" />
                      </div>
                      <span className="text-sm text-slate-300 font-bold tracking-tight">{compra.proveedor_nombre}</span>
                    </div>
                  </td>
                  <td className="px-8 py-6">
                    <div className="flex items-center gap-2 text-xs font-bold text-slate-500 uppercase tracking-widest">
                      <Calendar size={14} className="opacity-50" />
                      {new Date(compra.fecha).toLocaleDateString()}
                    </div>
                  </td>
                  <td className="px-8 py-6">
                    <p className="text-xl font-black text-white tracking-tighter">${Number(compra.total).toLocaleString()}</p>
                  </td>
                  <td className="px-8 py-6">
                    <span className="px-3 py-1 bg-emerald-500/10 text-emerald-400 text-[10px] font-black rounded-lg border border-emerald-500/20 uppercase tracking-widest">
                      Completada
                    </span>
                  </td>
                  <td className="px-8 py-6 text-right">
                    <button className="p-3 text-slate-600 hover:text-white hover:bg-white/5 rounded-xl transition-all">
                      <ChevronRight size={24} />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      <Modal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} title="Registrar Nueva Compra">
        <PurchaseForm onSuccess={() => setIsModalOpen(false)} />
      </Modal>
    </div>
  );
};
