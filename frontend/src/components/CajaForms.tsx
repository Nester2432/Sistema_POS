import { useState } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import api from '../api/axios';
import { Unlock, Lock, Save, ArrowUpCircle, ArrowDownCircle, Loader2, ArrowRight } from 'lucide-react';

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
      queryClient.invalidateQueries({ queryKey: ['caja-actual'] });
      onSuccess();
    }
  });

  return (
    <div className="space-y-6">
      <div className="p-4 bg-slate-50 rounded-2xl flex items-center gap-4 text-slate-600 border border-slate-100">
        <Unlock size={32} className="text-primary-600" />
        <p className="text-sm font-medium">Ingrese el saldo disponible en efectivo al momento de iniciar la jornada.</p>
      </div>
      <div className="space-y-2">
        <label className="text-xs font-black text-slate-400 uppercase tracking-widest ml-1">Saldo Inicial ($)</label>
        <input 
          type="number"
          autoFocus
          className="w-full p-5 bg-slate-50 border-2 border-slate-100 rounded-2xl text-3xl font-mono font-black text-slate-900 focus:border-primary-500 outline-none transition-all"
          value={saldo}
          onChange={e => setSaldo(Number(e.target.value))}
        />
      </div>
      <button 
        onClick={() => mutation.mutate({ saldo_inicial: saldo })}
        disabled={mutation.isPending}
        className="w-full py-5 bg-white border border-slate-200 text-slate-900 rounded-[1.5rem] font-black text-xl hover:bg-slate-50 hover:border-slate-300 shadow-sm transition-all flex items-center justify-center gap-3 active:scale-95 disabled:opacity-50 group"
      >
        {mutation.isPending ? <Loader2 className="animate-spin" size={24} /> : (
          <>
            <span>CONFIRMAR APERTURA</span>
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
      queryClient.invalidateQueries({ queryKey: ['caja-actual'] });
      onSuccess();
    }
  });

  return (
    <div className="space-y-6">
      <div className={`p-4 rounded-2xl flex items-center gap-4 ${tipo === 'INGRESO' ? 'bg-emerald-50 text-emerald-700' : 'bg-rose-50 text-rose-700'}`}>
        {tipo === 'INGRESO' ? <ArrowUpCircle size={32} /> : <ArrowDownCircle size={32} />}
        <p className="text-sm font-medium">Registre un {tipo.toLowerCase()} manual de dinero.</p>
      </div>
      <div className="space-y-4">
        <div>
          <label className="text-xs font-black text-slate-400 uppercase tracking-widest ml-1">Concepto / Motivo</label>
          <input 
            required
            className="w-full p-4 bg-slate-50 border border-slate-200 rounded-2xl outline-none focus:border-primary-500 font-bold"
            value={formData.concepto}
            onChange={e => setFormData({ ...formData, concepto: e.target.value })}
            placeholder="Ej: Pago de flete, Aporte de socio..."
          />
        </div>
        <div>
          <label className="text-xs font-black text-slate-400 uppercase tracking-widest ml-1">Monto ($)</label>
          <input 
            type="number"
            className="w-full p-4 bg-slate-50 border border-slate-200 rounded-2xl text-2xl font-black outline-none focus:border-primary-500"
            value={formData.monto}
            onChange={e => setFormData({ ...formData, monto: Number(e.target.value) })}
          />
        </div>
      </div>
      <button 
        onClick={() => mutation.mutate(formData)}
        disabled={mutation.isPending}
        className="w-full py-5 bg-white border border-slate-200 text-slate-900 rounded-[1.5rem] font-black shadow-sm transition-all flex items-center justify-center gap-3 active:scale-95 disabled:opacity-50 hover:bg-slate-50 group"
      >
        {mutation.isPending ? <Loader2 className="animate-spin" /> : (
          <>
            <span>REGISTRAR {tipo}</span>
            <ArrowRight size={20} className="text-slate-400 group-hover:translate-x-1 transition-transform" />
          </>
        )}
      </button>
    </div>
  );
};

// 3. Cerrar Caja
export const CerrarCajaForm = ({ onSuccess, saldoEstimado }: { onSuccess: () => void, saldoEstimado: number }) => {
  const queryClient = useQueryClient();
  const [saldoDeclarado, setSaldoDeclarado] = useState(0);

  const mutation = useMutation({
    mutationFn: (data: any) => api.post('/caja/cerrar/', data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['caja-actual'] });
      onSuccess();
    }
  });

  const diferencia = saldoDeclarado - saldoEstimado;

  return (
    <div className="space-y-6">
      <div className="p-6 bg-slate-900 text-white rounded-[2rem] space-y-2 shadow-inner">
        <p className="text-[10px] text-slate-400 uppercase font-black tracking-[0.2em]">Saldo Estimado (Sistema)</p>
        <p className="text-3xl font-mono font-black">${saldoEstimado.toFixed(2)}</p>
      </div>

      <div className="space-y-2">
        <label className="text-xs font-black text-slate-400 uppercase tracking-widest ml-1">Monto Contado en Caja ($)</label>
        <input 
          type="number"
          autoFocus
          className="w-full p-5 bg-slate-50 border-2 border-slate-100 rounded-2xl text-3xl font-mono font-black focus:border-primary-500 outline-none"
          value={saldoDeclarado}
          onChange={e => setSaldoDeclarado(Number(e.target.value))}
        />
      </div>

      {saldoDeclarado > 0 && (
        <div className={`p-4 rounded-2xl font-black flex items-center justify-between border-2 ${diferencia === 0 ? 'bg-emerald-50 text-emerald-700 border-emerald-100' : 'bg-rose-50 text-rose-700 border-rose-100'}`}>
          <span className="text-sm">Diferencia:</span>
          <span className="text-lg">${diferencia.toFixed(2)}</span>
        </div>
      )}

      <button 
        onClick={() => mutation.mutate({ saldo_final_declarado: saldoDeclarado })}
        disabled={mutation.isPending}
        className="w-full py-5 bg-slate-900 text-white rounded-[1.5rem] font-black text-lg shadow-xl hover:bg-black transition-all flex items-center justify-center gap-3 active:scale-95 disabled:opacity-50"
      >
        {mutation.isPending ? <Loader2 className="animate-spin" /> : <Lock size={20} />}
        <span>CERRAR CAJA Y TERMINAR TURNO</span>
      </button>
    </div>
  );
};
