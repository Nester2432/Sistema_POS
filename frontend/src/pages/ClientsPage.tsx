import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import api from '../api/axios';
import { Modal } from '../components/Modal';
import { ClientForm } from '../components/ClientForm';
import { 
  Plus, 
  Search, 
  User as UserIcon, 
  Mail, 
  Phone,
  Edit,
  Trash2,
  Loader2
} from 'lucide-react';

export const ClientsPage = () => {
  const [searchTerm, setSearchTerm] = useState('');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedClient, setSelectedClient] = useState<any>(null);

  const { data, isLoading } = useQuery({
    queryKey: ['clientes', searchTerm],
    queryFn: async () => {
      const res = await api.get(`/clientes/clientes/?search=${searchTerm}`);
      const body = res.data;
      // Paginación directa o éxito envuelto
      return body.results || body.data?.results || body.data || [];
    }
  });

  const clients = Array.isArray(data) ? data : [];

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold text-white tracking-tight">Cartera de Clientes</h2>
          <p className="text-slate-500 text-sm font-medium mt-0.5">Gestión de perfiles y estados de cuenta</p>
        </div>
        <button 
          onClick={() => { setSelectedClient(null); setIsModalOpen(true); }}
          className="flex items-center gap-2 px-5 py-2.5 bg-white text-slate-950 rounded-xl text-xs font-bold hover:bg-slate-200 transition-all shadow-lg active:scale-[0.98]"
        >
          <Plus size={16} />
          NUEVO CLIENTE
        </button>
      </div>

      <div className="bg-white/5 backdrop-blur-md p-4 rounded-2xl border border-white/5 shadow-xl mb-6">
        <div className="relative group">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-500 group-focus-within:text-accent-500 transition-colors" size={18} />
          <input 
            type="text" 
            placeholder="Buscar por nombre, documento o email..." 
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-11 pr-4 py-2.5 bg-slate-900/50 border border-white/5 focus:border-accent-500/50 rounded-xl text-white outline-none transition-all text-sm font-medium placeholder:text-slate-700"
          />
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
        {isLoading ? (
          <div className="col-span-full text-center py-12 text-slate-500 font-medium">
            <Loader2 className="animate-spin mx-auto mb-2" size={32} />
            Cargando base de datos...
          </div>
        ) : clients.length === 0 ? (
          <div className="col-span-full text-center py-12 bg-white/5 rounded-2xl border border-dashed border-white/10">
            <UserIcon className="mx-auto text-slate-800 mb-2" size={48} />
            <p className="text-slate-500 text-sm font-medium">No se encontraron clientes</p>
          </div>
        ) : clients.map((client: any) => (
          <div key={client.id} className="bg-white/5 backdrop-blur-sm p-6 rounded-3xl border border-white/5 hover:bg-white/[0.08] transition-all group relative overflow-hidden">
            <div className="flex items-start justify-between mb-6">
              <div className="h-12 w-12 bg-slate-800 border border-white/5 rounded-xl flex items-center justify-center text-slate-400 group-hover:text-accent-500 transition-colors">
                <UserIcon size={24} />
              </div>
              <div className="flex gap-1">
                <button 
                  onClick={() => { setSelectedClient(client); setIsModalOpen(true); }}
                  className="p-2 text-slate-600 hover:text-white hover:bg-white/5 rounded-lg transition-all"
                >
                  <Edit size={16} />
                </button>
                <button className="p-2 text-slate-600 hover:text-rose-400 hover:bg-rose-500/5 rounded-lg transition-all">
                  <Trash2 size={16} />
                </button>
              </div>
            </div>
            
            <div className="mb-6">
              <h3 className="text-lg font-bold text-white tracking-tight leading-none mb-1">{client.nombre} {client.apellido}</h3>
              <span className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">DNI: {client.documento}</span>
            </div>

            <div className="space-y-2 mb-8">
              <div className="flex items-center gap-2 text-xs font-medium text-slate-400">
                <Mail size={14} className="text-slate-600" />
                <span className="truncate">{client.email || 'Sin correo'}</span>
              </div>
              <div className="flex items-center gap-2 text-xs font-medium text-slate-400">
                <Phone size={14} className="text-slate-600" />
                {client.telefono || 'Sin teléfono'}
              </div>
            </div>

            <div className="pt-4 border-t border-white/5 flex items-center justify-between">
              <span className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">Saldo Cuenta</span>
              <span className={`text-xl font-bold tracking-tight ${Number(client.saldo_cc) > 0 ? 'text-rose-400' : 'text-emerald-400'}`}>
                ${Number(client.saldo_cc || 0).toLocaleString()}
              </span>
            </div>
          </div>
        ))}
      </div>

      <Modal 
        isOpen={isModalOpen} 
        onClose={() => setIsModalOpen(false)} 
        title={selectedClient ? 'Editar Cliente' : 'Nuevo Cliente'}
      >
        <ClientForm 
          onSuccess={() => setIsModalOpen(false)} 
          initialData={selectedClient} 
        />
      </Modal>
    </div>
  );
};
