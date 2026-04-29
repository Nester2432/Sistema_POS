import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import api from '../api/axios';
import { 
  Users, 
  Plus, 
  Search, 
  Phone, 
  Mail, 
  CreditCard,
  MoreVertical,
  ChevronRight
} from 'lucide-react';

export const ClientsPage = () => {
  const [search, setSearch] = useState('');

  const { data, isLoading } = useQuery({
    queryKey: ['clientes', search],
    queryFn: async () => {
      const response = await api.get(`/clientes/?search=${search}`);
      return response.data.data;
    }
  });

  const clients = data?.results || [];

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold text-slate-900 tracking-tight">Clientes / CRM</h2>
          <p className="text-slate-500">Gestione su cartera de clientes y cuentas corrientes</p>
        </div>
        <button className="flex items-center gap-2 px-5 py-2.5 bg-primary-600 text-white rounded-xl text-sm font-bold hover:bg-primary-700 transition-all shadow-lg shadow-primary-100">
          <Plus size={18} />
          Nuevo Cliente
        </button>
      </div>

      <div className="bg-white p-4 rounded-2xl shadow-sm border border-slate-100 flex flex-col md:flex-row gap-4">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
          <input 
            type="text" 
            placeholder="Buscar por nombre, documento o email..." 
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-10 pr-4 py-2.5 bg-slate-50 border-transparent focus:bg-white focus:ring-2 focus:ring-primary-500 rounded-xl outline-none transition-all text-sm"
          />
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        <div className="lg:col-span-8 space-y-4">
          {isLoading ? (
            <div className="p-12 text-center text-slate-400">Cargando clientes...</div>
          ) : clients.length === 0 ? (
            <div className="p-12 bg-white rounded-2xl border border-dashed border-slate-200 text-center text-slate-400">
              No se encontraron clientes.
            </div>
          ) : clients.map((client: any) => (
            <div key={client.id} className="bg-white p-5 rounded-2xl border border-slate-100 hover:shadow-md transition-all flex items-center justify-between group">
              <div className="flex items-center gap-4">
                <div className="h-12 w-12 bg-primary-50 text-primary-600 flex items-center justify-center rounded-xl font-bold text-lg">
                  {client.nombre.charAt(0)}
                </div>
                <div>
                  <h3 className="font-bold text-slate-900">{client.nombre} {client.apellido}</h3>
                  <div className="flex items-center gap-3 mt-1">
                    <span className="flex items-center gap-1 text-xs text-slate-400"><Phone size={12}/> {client.telefono || 'Sin tel'}</span>
                    <span className="flex items-center gap-1 text-xs text-slate-400"><Mail size={12}/> {client.email || 'Sin mail'}</span>
                  </div>
                </div>
              </div>
              
              <div className="flex items-center gap-6">
                <div className="text-right">
                  <p className="text-xs text-slate-400 uppercase font-bold tracking-wider">Saldo CC</p>
                  <p className={`font-mono font-bold ${client.saldo_cc > 0 ? 'text-rose-600' : 'text-emerald-600'}`}>
                    ${client.saldo_cc || '0.00'}
                  </p>
                </div>
                <button className="p-2 text-slate-300 hover:text-slate-600 rounded-lg">
                  <ChevronRight size={20} />
                </button>
              </div>
            </div>
          ))}
        </div>

        <div className="lg:col-span-4 space-y-6">
          <div className="bg-slate-900 rounded-3xl p-6 text-white shadow-xl">
            <h3 className="flex items-center gap-2 font-bold mb-6 text-primary-400">
              <CreditCard size={20} />
              Resumen de Cartera
            </h3>
            <div className="space-y-4">
              <div className="flex justify-between items-end border-b border-slate-800 pb-4">
                <span className="text-slate-400 text-sm">Total Deuda</span>
                <span className="text-2xl font-bold text-rose-400">$45,200.00</span>
              </div>
              <div className="flex justify-between items-end border-b border-slate-800 pb-4">
                <span className="text-slate-400 text-sm">Clientes Activos</span>
                <span className="text-2xl font-bold">128</span>
              </div>
              <div className="flex justify-between items-end">
                <span className="text-slate-400 text-sm">Créditos Otorgados</span>
                <span className="text-2xl font-bold text-primary-400">12</span>
              </div>
            </div>
          </div>
          
          <div className="bg-white p-6 rounded-3xl border border-slate-100">
            <h3 className="font-bold text-slate-900 mb-4">Acciones Rápidas</h3>
            <div className="grid grid-cols-1 gap-2">
              <button className="w-full text-left p-3 hover:bg-slate-50 rounded-xl text-sm text-slate-600 flex items-center gap-2">
                <Plus size={16} /> Registrar Cobro de Cuota
              </button>
              <button className="w-full text-left p-3 hover:bg-slate-50 rounded-xl text-sm text-slate-600 flex items-center gap-2">
                <Search size={16} /> Ver Mayores de Cuenta
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
