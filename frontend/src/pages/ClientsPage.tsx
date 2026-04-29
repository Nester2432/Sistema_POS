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
      return res.data.data.results || [];
    }
  });

  const clients = Array.isArray(data) ? data : [];

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 mb-12">
        <div>
          <h2 className="text-4xl font-black text-white tracking-tighter uppercase tracking-tight">Cartera de Clientes</h2>
          <p className="text-slate-500 font-bold tracking-tight mt-1">Gestión de perfiles y estados de cuenta corriente</p>
        </div>
        <button 
          onClick={() => { setSelectedClient(null); setIsModalOpen(true); }}
          className="flex items-center gap-3 px-8 py-4 bg-white text-slate-950 rounded-2xl text-sm font-black hover:bg-slate-200 transition-all shadow-xl shadow-white/5 active:scale-95 group"
        >
          <Plus size={20} className="text-primary-600 group-hover:rotate-90 transition-transform" />
          <span>NUEVO CLIENTE</span>
        </button>
      </div>

      <div className="bg-white/5 backdrop-blur-md p-6 rounded-[2rem] border border-white/5 shadow-2xl mb-8">
        <div className="relative group">
          <Search className="absolute left-5 top-1/2 -translate-y-1/2 text-slate-600 group-focus-within:text-primary-400 transition-colors" size={20} />
          <input 
            type="text" 
            placeholder="Buscar por nombre, documento o email del cliente..." 
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-14 pr-4 py-4 bg-white/5 border border-white/5 focus:bg-white/10 focus:border-primary-500/50 rounded-2xl text-white outline-none transition-all font-medium placeholder:text-slate-700"
          />
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
        {isLoading ? (
          <div className="col-span-full text-center py-24">
            <Loader2 className="animate-spin mx-auto text-primary-500 mb-4" size={48} />
            <p className="text-slate-500 font-black uppercase tracking-widest text-xs">Cargando base de datos...</p>
          </div>
        ) : clients.length === 0 ? (
          <div className="col-span-full text-center py-24 bg-white/5 rounded-[3rem] border border-dashed border-white/10">
            <UserIcon className="mx-auto text-slate-800 mb-4" size={64} />
            <p className="text-slate-500 font-black uppercase tracking-widest text-xs">No se encontraron registros</p>
          </div>
        ) : clients.map((client: any) => (
          <div key={client.id} className="bg-white/5 backdrop-blur-sm p-8 rounded-[2.5rem] border border-white/5 hover:bg-white/[0.08] transition-all group relative overflow-hidden">
            {/* Decoración de fondo */}
            <div className="absolute top-0 right-0 w-24 h-24 bg-primary-500/5 rounded-full -mr-12 -mt-12 blur-2xl group-hover:bg-primary-500/10 transition-colors"></div>
            
            <div className="flex items-start justify-between mb-8 relative z-10">
              <div className="h-16 w-16 bg-white/5 border border-white/5 rounded-2xl flex items-center justify-center text-slate-500 group-hover:text-primary-400 transition-colors">
                <UserIcon size={32} />
              </div>
              <div className="flex gap-2">
                <button 
                  onClick={() => { setSelectedClient(client); setIsModalOpen(true); }}
                  className="p-3 text-slate-600 hover:text-white hover:bg-white/5 rounded-xl transition-all"
                >
                  <Edit size={18} />
                </button>
                <button className="p-3 text-slate-600 hover:text-rose-400 hover:bg-rose-500/5 rounded-xl transition-all">
                  <Trash2 size={18} />
                </button>
              </div>
            </div>
            
            <div className="mb-8 relative z-10">
              <h3 className="text-2xl font-black text-white tracking-tighter leading-none mb-2">{client.nombre} {client.apellido}</h3>
              <div className="inline-block px-3 py-1 bg-white/5 border border-white/5 rounded-lg text-[10px] font-black text-slate-500 uppercase tracking-widest">
                ID: {client.documento}
              </div>
            </div>

            <div className="space-y-3 mb-10 relative z-10">
              <div className="flex items-center gap-3 text-sm font-bold text-slate-400">
                <Mail size={16} className="text-slate-600" />
                {client.email || 'Sin correo vinculado'}
              </div>
              <div className="flex items-center gap-3 text-sm font-bold text-slate-400">
                <Phone size={16} className="text-slate-600" />
                {client.telefono || 'Sin teléfono registrado'}
              </div>
            </div>

            <div className="pt-6 border-t border-white/5 flex items-center justify-between relative z-10">
              <div className="flex items-center gap-2">
                <div className="w-2 h-2 bg-primary-500 rounded-full shadow-[0_0_8px_rgba(6,182,212,0.8)]"></div>
                <span className="text-[10px] font-black text-slate-500 uppercase tracking-[0.2em]">Cuenta Corriente</span>
              </div>
              <span className={`text-2xl font-black tracking-tighter ${Number(client.saldo_cc) > 0 ? 'text-rose-400' : 'text-emerald-400'}`}>
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
