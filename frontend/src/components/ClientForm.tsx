import { useState } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import api from '../api/axios';
import { Save, Loader2 } from 'lucide-react';

interface ClientFormProps {
  onSuccess: () => void;
  initialData?: any;
}

export const ClientForm = ({ onSuccess, initialData }: ClientFormProps) => {
  const queryClient = useQueryClient();
  const [formData, setFormData] = useState({
    nombre: initialData?.nombre || '',
    apellido: initialData?.apellido || '',
    documento: initialData?.documento || '',
    email: initialData?.email || '',
    telefono: initialData?.telefono || '',
    direccion: initialData?.direccion || '',
  });

  const mutation = useMutation({
    mutationFn: (data: any) => {
      if (initialData?.id) {
        return api.put(`/clientes/clientes/${initialData.id}/`, data);
      }
      return api.post('/clientes/clientes/', data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['clientes'] });
      onSuccess();
    }
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    mutation.mutate(formData);
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="space-y-2">
          <label className="text-sm font-bold text-slate-700">Nombre</label>
          <input
            required
            className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl outline-none focus:ring-2 focus:ring-primary-500"
            value={formData.nombre}
            onChange={e => setFormData({ ...formData, nombre: e.target.value })}
          />
        </div>

        <div className="space-y-2">
          <label className="text-sm font-bold text-slate-700">Apellido</label>
          <input
            required
            className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl outline-none focus:ring-2 focus:ring-primary-500"
            value={formData.apellido}
            onChange={e => setFormData({ ...formData, apellido: e.target.value })}
          />
        </div>

        <div className="space-y-2">
          <label className="text-sm font-bold text-slate-700">Documento (DNI/CUIT)</label>
          <input
            required
            className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl outline-none focus:ring-2 focus:ring-primary-500"
            value={formData.documento}
            onChange={e => setFormData({ ...formData, documento: e.target.value })}
          />
        </div>

        <div className="space-y-2">
          <label className="text-sm font-bold text-slate-700">Teléfono</label>
          <input
            className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl outline-none focus:ring-2 focus:ring-primary-500"
            value={formData.telefono}
            onChange={e => setFormData({ ...formData, telefono: e.target.value })}
          />
        </div>

        <div className="space-y-2 col-span-full">
          <label className="text-sm font-bold text-slate-700">Email</label>
          <input
            type="email"
            className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl outline-none focus:ring-2 focus:ring-primary-500"
            value={formData.email}
            onChange={e => setFormData({ ...formData, email: e.target.value })}
          />
        </div>

        <div className="space-y-2 col-span-full">
          <label className="text-sm font-bold text-slate-700">Dirección</label>
          <textarea
            className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl outline-none focus:ring-2 focus:ring-primary-500"
            rows={2}
            value={formData.direccion}
            onChange={e => setFormData({ ...formData, direccion: e.target.value })}
          />
        </div>
      </div>

      <div className="flex justify-end gap-3 pt-6 border-t">
        <button
          type="button"
          onClick={onSuccess}
          className="px-6 py-3 text-slate-600 font-bold hover:bg-slate-100 rounded-xl transition-all"
        >
          Cancelar
        </button>
        <button
          type="submit"
          disabled={mutation.isPending}
          className="flex items-center gap-2 px-8 py-3 bg-primary-600 text-white font-bold rounded-xl shadow-lg shadow-primary-200 hover:bg-primary-700 transition-all disabled:bg-slate-300"
        >
          {mutation.isPending ? <Loader2 className="animate-spin" /> : <Save size={20} />}
          {initialData?.id ? 'Actualizar Cliente' : 'Guardar Cliente'}
        </button>
      </div>
    </form>
  );
};
