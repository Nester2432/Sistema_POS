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
    <form onSubmit={handleSubmit} className="space-y-8">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="space-y-2">
          <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest ml-1">Nombre</label>
          <input
            required
            className="w-full p-3.5 bg-slate-950/50 border border-white/5 rounded-2xl outline-none focus:border-accent-500/50 text-white placeholder:text-slate-700 transition-all font-medium"
            placeholder="Ej: Juan"
            value={formData.nombre}
            onChange={e => setFormData({ ...formData, nombre: e.target.value })}
          />
        </div>

        <div className="space-y-2">
          <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest ml-1">Apellido</label>
          <input
            required
            className="w-full p-3.5 bg-slate-950/50 border border-white/5 rounded-2xl outline-none focus:border-accent-500/50 text-white placeholder:text-slate-700 transition-all font-medium"
            placeholder="Ej: Pérez"
            value={formData.apellido}
            onChange={e => setFormData({ ...formData, apellido: e.target.value })}
          />
        </div>

        <div className="space-y-2">
          <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest ml-1">Documento (DNI/CUIT)</label>
          <input
            required
            className="w-full p-3.5 bg-slate-950/50 border border-white/5 rounded-2xl outline-none focus:border-accent-500/50 text-white placeholder:text-slate-700 transition-all font-medium"
            placeholder="Sin puntos ni guiones"
            value={formData.documento}
            onChange={e => setFormData({ ...formData, documento: e.target.value })}
          />
        </div>

        <div className="space-y-2">
          <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest ml-1">Teléfono</label>
          <input
            className="w-full p-3.5 bg-slate-950/50 border border-white/5 rounded-2xl outline-none focus:border-accent-500/50 text-white placeholder:text-slate-700 transition-all font-medium"
            placeholder="Ej: +54 9 11..."
            value={formData.telefono}
            onChange={e => setFormData({ ...formData, telefono: e.target.value })}
          />
        </div>

        <div className="space-y-2 col-span-full">
          <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest ml-1">Email</label>
          <input
            type="email"
            className="w-full p-3.5 bg-slate-950/50 border border-white/5 rounded-2xl outline-none focus:border-accent-500/50 text-white placeholder:text-slate-700 transition-all font-medium"
            placeholder="cliente@ejemplo.com"
            value={formData.email}
            onChange={e => setFormData({ ...formData, email: e.target.value })}
          />
        </div>

        <div className="space-y-2 col-span-full">
          <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest ml-1">Dirección</label>
          <textarea
            className="w-full p-3.5 bg-slate-950/50 border border-white/5 rounded-2xl outline-none focus:border-accent-500/50 text-white placeholder:text-slate-700 transition-all font-medium resize-none"
            rows={2}
            placeholder="Calle, Altura, Ciudad..."
            value={formData.direccion}
            onChange={e => setFormData({ ...formData, direccion: e.target.value })}
          />
        </div>
      </div>

      <div className="flex justify-end gap-3 pt-8 border-t border-white/5">
        <button
          type="button"
          onClick={onSuccess}
          className="px-8 py-3.5 text-slate-500 font-black text-xs uppercase tracking-widest hover:text-white transition-all"
        >
          Cancelar
        </button>
        <button
          type="submit"
          disabled={mutation.isPending}
          className="flex items-center gap-2 px-10 py-3.5 bg-white text-slate-950 font-black text-xs uppercase tracking-widest rounded-2xl shadow-xl hover:bg-slate-200 transition-all disabled:opacity-50 disabled:cursor-not-allowed active:scale-95"
        >
          {mutation.isPending ? <Loader2 className="animate-spin" size={18} /> : <Save size={18} />}
          {initialData?.id ? 'Actualizar Cliente' : 'Guardar Cliente'}
        </button>
      </div>
    </form>
  );
};
