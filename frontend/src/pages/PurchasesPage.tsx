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
      return res.data.data.results || [];
    }
  });

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold text-slate-900">Compras</h2>
          <p className="text-slate-500">Registro de entrada de mercadería y facturas de proveedores</p>
        </div>
        <button 
          onClick={() => setIsModalOpen(true)}
          className="flex items-center gap-2 px-4 py-2 bg-primary-600 text-white rounded-xl text-sm font-bold hover:bg-primary-700 transition-all shadow-lg shadow-primary-100 active:scale-95"
        >
          <Plus size={18} />
          Registrar Compra
        </button>
      </div>

      <div className="bg-white p-4 rounded-xl shadow-sm border border-slate-100">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
          <input 
            type="text" 
            placeholder="Buscar por nro. comprobante o proveedor..." 
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-10 pr-4 py-2 bg-slate-50 border-transparent focus:bg-white focus:ring-2 focus:ring-primary-500 rounded-lg outline-none transition-all"
          />
        </div>
      </div>

      <div className="bg-white rounded-2xl shadow-sm border border-slate-100 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead className="bg-slate-50 border-b border-slate-100">
              <tr>
                <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase tracking-wider">Comprobante</th>
                <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase tracking-wider">Proveedor</th>
                <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase tracking-wider">Fecha</th>
                <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase tracking-wider">Total</th>
                <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase tracking-wider">Estado</th>
                <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase tracking-wider"></th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {isLoading ? (
                <tr><td colSpan={6} className="px-6 py-12 text-center text-slate-400">Cargando compras...</td></tr>
              ) : compras.length === 0 ? (
                <tr><td colSpan={6} className="px-6 py-12 text-center text-slate-400 italic">No hay compras registradas</td></tr>
              ) : compras.map((compra: any) => (
                <tr key={compra.id} className="hover:bg-slate-50 transition-colors group">
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-3">
                      <div className="h-10 w-10 bg-slate-100 rounded-lg flex items-center justify-center text-slate-400">
                        <FileText size={20} />
                      </div>
                      <div>
                        <p className="font-bold text-slate-900">{compra.nro_comprobante}</p>
                        <p className="text-xs text-slate-500">{compra.tipo_comprobante}</p>
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-2">
                      <Truck size={14} className="text-slate-400" />
                      <span className="text-sm text-slate-700 font-medium">{compra.proveedor_nombre}</span>
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-2 text-sm text-slate-500">
                      <Calendar size={14} />
                      {new Date(compra.fecha).toLocaleDateString()}
                    </div>
                  </td>
                  <td className="px-6 py-4 font-bold text-slate-900">
                    ${Number(compra.total).toFixed(2)}
                  </td>
                  <td className="px-6 py-4">
                    <span className="px-2 py-1 rounded-full text-[10px] font-bold uppercase bg-emerald-100 text-emerald-700">
                      Completada
                    </span>
                  </td>
                  <td className="px-6 py-4 text-right">
                    <button className="p-2 text-slate-400 hover:text-primary-600 transition-colors">
                      <ChevronRight size={20} />
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
