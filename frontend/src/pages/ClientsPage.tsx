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
  CreditCard,
  Edit,
  Trash2
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
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold text-slate-900">Clientes</h2>
          <p className="text-slate-500">Gestione su base de clientes y cuentas corrientes</p>
        </div>
        <button 
          onClick={() => { setSelectedClient(null); setIsModalOpen(true); }}
          className="flex items-center gap-2 px-4 py-2 bg-primary-600 text-white rounded-lg text-sm font-medium hover:bg-primary-700 transition-all shadow-md shadow-primary-100"
        >
          <Plus size={18} />
          Nuevo Cliente
        </button>
      </div>

      <div className="bg-white p-4 rounded-xl shadow-sm border border-slate-100">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
          <input 
            type="text" 
            placeholder="Buscar por nombre, documento o email..." 
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-10 pr-4 py-2 bg-slate-50 border-transparent focus:bg-white focus:ring-2 focus:ring-primary-500 rounded-lg outline-none transition-all"
          />
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {isLoading ? (
          <p className="col-span-full text-center py-12 text-slate-500">Cargando clientes...</p>
        ) : clients.length === 0 ? (
          <p className="col-span-full text-center py-12 text-slate-500">No se encontraron clientes</p>
        ) : clients.map((client: any) => (
          <div key={client.id} className="bg-white p-6 rounded-2xl shadow-sm border border-slate-100 hover:shadow-md transition-all group relative">
            <div className="flex items-start justify-between mb-4">
              <div className="h-12 w-12 bg-primary-50 text-primary-600 rounded-xl flex items-center justify-center">
                <UserIcon size={24} />
              </div>
              <div className="flex gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                <button 
                  onClick={() => { setSelectedClient(client); setIsModalOpen(true); }}
                  className="p-2 text-slate-400 hover:text-primary-600 hover:bg-primary-50 rounded-lg"
                >
                  <Edit size={16} />
                </button>
                <button className="p-2 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg">
                  <Trash2 size={16} />
                </button>
              </div>
            </div>
            
            <h3 className="text-lg font-bold text-slate-900 mb-1">{client.nombre} {client.apellido}</h3>
            <p className="text-sm text-slate-500 mb-4">{client.documento}</p>

            <div className="space-y-2 mb-6">
              <div className="flex items-center gap-2 text-sm text-slate-600">
                <Mail size={14} className="text-slate-400" />
                {client.email || 'Sin email'}
              </div>
              <div className="flex items-center gap-2 text-sm text-slate-600">
                <Phone size={14} className="text-slate-400" />
                {client.telefono || 'Sin teléfono'}
              </div>
            </div>

            <div className="pt-4 border-t flex items-center justify-between">
              <div className="flex items-center gap-2">
                <CreditCard size={16} className="text-slate-400" />
                <span className="text-xs font-bold text-slate-400 uppercase">Cuenta Corriente</span>
              </div>
              <span className={`font-bold ${client.saldo_cc > 0 ? 'text-rose-600' : 'text-emerald-600'}`}>
                ${client.saldo_cc || '0.00'}
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
