import { useState } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import api from '../api/axios';
import { Unlock, Lock, ArrowUpCircle, ArrowDownCircle, Loader2, ArrowRight } from 'lucide-react';

interface FormProps {
  onSuccess: () => void;
}

// 1. Abrir Caja
export const AbrirCajaForm = ({ onSuccess }: FormProps) => {
  const queryClient = useQueryClient();
  const [saldo, setSaldo] = useState(0);

  const mutation = useMutation({
    mutationFn: (data: any) => api.post('/caja/abrir/', data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['caja-mi-caja'] });
      onSuccess();
    }
  });

  return (
    <div className="space-y-8">
      <div className="p-6 bg-primary-500/10 border border-primary-500/20 rounded-[2rem] flex items-center gap-5 text-primary-100">
        <Unlock size={40} className="text-primary-400 shrink-0" />
        <p className="text-sm font-bold leading-relaxed tracking-tight">Ingrese el saldo inicial en efectivo para comenzar las operaciones del turno.</p>
      </div>
      
      <div className="space-y-3">
        <label className="text-[10px] font-black text-slate-500 uppercase tracking-[0.2em] ml-1">Saldo Inicial ($)</label>
        <input 
          type="number"
          autoFocus
          className="w-full p-6 bg-white/5 border border-white/5 rounded-2xl text-4xl font-black text-white focus:border-primary-500/50 outline-none transition-all tracking-tighter"
          value={saldo}
          onChange={e => setSaldo(Number(e.target.value))}
        />
      </div>

      <button 
        onClick={() => mutation.mutate({ saldo_inicial: saldo })}
        disabled={mutation.isPending}
        className="w-full py-6 bg-white text-slate-950 rounded-[2rem] font-black text-xl hover:bg-slate-200 shadow-2xl shadow-white/5 transition-all active:scale-95 disabled:opacity-50 flex items-center justify-center gap-3 group"
      >
        {mutation.isPending ? <Loader2 className="animate-spin" size={24} /> : (
          <>
            <span className="text-sm uppercase tracking-widest">CONFIRMAR APERTURA</span>
            <ArrowRight size={24} className="text-slate-400 group-hover:translate-x-1 transition-transform" />
          </>
        )}
      </button>
    </div>
  );
};

// 2. Movimiento Manual
export const MovimientoCajaForm = ({ onSuccess, tipo }: { onSuccess: () => void, tipo: 'INGRESO' | 'EGRESO' }) => {
  const queryClient = useQueryClient();
  const [formData, setFormData] = useState({ monto: 0, concepto: '', metodo_pago: 'EFECTIVO' });

  const mutation = useMutation({
    mutationFn: (data: any) => api.post('/caja/movimiento-manual/', { ...data, tipo }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['caja-mi-caja'] });
      onSuccess();
    }
  });

  return (
    <div className="space-y-8">
      <div className={`p-6 rounded-[2rem] flex items-center gap-5 ${tipo === 'INGRESO' ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20' : 'bg-rose-500/10 text-rose-400 border border-rose-500/20'}`}>
        {tipo === 'INGRESO' ? <ArrowUpCircle size={40} className="shrink-0" /> : <ArrowDownCircle size={40} className="shrink-0" />}
        <p className="text-sm font-bold leading-relaxed tracking-tight uppercase tracking-widest text-xs opacity-80">Registro de {tipo.toLowerCase()} manual de efectivo.</p>
      </div>

      <div className="space-y-6">
        <div className="space-y-3">
          <label className="text-[10px] font-black text-slate-500 uppercase tracking-[0.2em] ml-1">Concepto / Motivo</label>
          <input 
            required
            className="w-full p-4 bg-white/5 border border-white/5 rounded-2xl outline-none focus:border-primary-500/50 text-white font-bold"
            value={formData.concepto}
            onChange={e => setFormData({ ...formData, concepto: e.target.value })}
            placeholder="Ej: Pago de flete, Aporte de socio..."
          />
        </div>
        <div className="space-y-3">
          <label className="text-[10px] font-black text-slate-500 uppercase tracking-[0.2em] ml-1">Monto ($)</label>
          <input 
            type="number"
            className="w-full p-6 bg-white/5 border border-white/5 rounded-2xl text-3xl font-black text-white focus:border-primary-500/50 outline-none transition-all tracking-tighter"
            value={formData.monto}
            onChange={e => setFormData({ ...formData, monto: Number(e.target.value) })}
          />
        </div>
      </div>

      <button 
        onClick={() => mutation.mutate(formData)}
        disabled={mutation.isPending}
        className="w-full py-6 bg-white text-slate-950 rounded-[2rem] font-black shadow-2xl transition-all active:scale-95 disabled:opacity-50 hover:bg-slate-200 flex items-center justify-center gap-3 group"
      >
        {mutation.isPending ? <Loader2 className="animate-spin" /> : (
          <>
            <span className="text-sm uppercase tracking-widest">REGISTRAR {tipo}</span>
            <ArrowRight size={20} className="text-slate-400 group-hover:translate-x-1 transition-transform" />
          </>
        )}
      </button>
    </div>
  );
};

// 3. Cerrar Caja
export const CerrarCajaForm = ({ onSuccess, saldoEstimado, cajaId }: { onSuccess: () => void, saldoEstimado: number, cajaId: number }) => {
  const queryClient = useQueryClient();
  const [saldoDeclarado, setSaldoDeclarado] = useState(0);

  const mutation = useMutation({
    mutationFn: (data: any) => api.post(`/caja/${cajaId}/cerrar/`, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['caja-mi-caja'] });
      onSuccess();
    }
  });

  const diferencia = saldoDeclarado - saldoEstimado;

  return (
    <div className="space-y-8">
      <div className="p-8 bg-slate-950 border border-white/5 rounded-[2.5rem] space-y-2 shadow-inner text-center">
        <p className="text-[10px] text-slate-500 uppercase font-black tracking-[0.3em]">Saldo Estimado en Sistema</p>
        <p className="text-5xl font-black text-white tracking-tighter">${saldoEstimado.toFixed(2)}</p>
      </div>

      <div className="space-y-3">
        <label className="text-[10px] font-black text-slate-500 uppercase tracking-[0.2em] ml-1 text-center block">Monto Contado en Caja ($)</label>
        <input 
          type="number"
          autoFocus
          className="w-full p-6 bg-white/5 border border-white/10 rounded-2xl text-4xl font-black text-white text-center focus:border-primary-500/50 outline-none transition-all tracking-tighter"
          value={saldoDeclarado}
          onChange={e => setSaldoDeclarado(Number(e.target.value))}
        />
      </div>

      {saldoDeclarado > 0 && (
        <div className={`p-5 rounded-2xl font-black flex items-center justify-between border ${diferencia === 0 ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20' : 'bg-rose-500/10 text-rose-400 border-rose-500/20'}`}>
          <span className="text-[10px] uppercase tracking-widest">Diferencia de Arqueo:</span>
          <span className="text-xl tracking-tighter">${diferencia.toFixed(2)}</span>
        </div>
      )}

      <button 
        onClick={() => mutation.mutate({ saldo_final_declarado: saldoDeclarado })}
        disabled={mutation.isPending}
        className="w-full py-6 bg-white text-slate-950 rounded-[2rem] font-black text-lg shadow-2xl hover:bg-slate-200 transition-all active:scale-95 disabled:opacity-50 flex items-center justify-center gap-3 group"
      >
        {mutation.isPending ? <Loader2 className="animate-spin" /> : <Lock size={20} className="text-slate-400" />}
        <span className="text-sm uppercase tracking-widest">FINALIZAR TURNO</span>
      </button>
    </div>
  );
};
