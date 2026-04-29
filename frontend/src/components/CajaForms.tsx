import { useState } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import api from '../api/axios';
import { Unlock, Lock, Save, ArrowUpCircle, ArrowDownCircle } from 'lucide-react';

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
      <div className="p-4 bg-primary-50 rounded-2xl flex items-center gap-4 text-primary-700">
        <Unlock size={32} />
        <p className="text-sm font-medium">Ingrese el saldo disponible en efectivo al momento de iniciar la jornada.</p>
      </div>
      <div className="space-y-2">
        <label className="text-sm font-bold text-slate-700 uppercase">Saldo Inicial ($)</label>
        <input 
          type="number"
          autoFocus
          className="w-full p-4 bg-slate-50 border-2 border-slate-200 rounded-2xl text-2xl font-mono font-bold focus:border-primary-500 outline-none transition-all"
          value={saldo}
          onChange={e => setSaldo(Number(e.target.value))}
        />
      </div>
      <button 
        onClick={() => mutation.mutate({ saldo_inicial: saldo })}
        disabled={mutation.isPending}
        className="w-full py-4 bg-primary-600 text-white rounded-2xl font-bold shadow-lg hover:bg-primary-700 transition-all flex items-center justify-center gap-2 active:scale-95"
      >
        <Unlock size={20} />
        ABRIR CAJA
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
          <label className="text-xs font-bold text-slate-400 uppercase">Concepto / Motivo</label>
          <input 
            required
            className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl outline-none"
            value={formData.concepto}
            onChange={e => setFormData({ ...formData, concepto: e.target.value })}
            placeholder="Ej: Pago de flete, Aporte de socio..."
          />
        </div>
        <div>
          <label className="text-xs font-bold text-slate-400 uppercase">Monto ($)</label>
          <input 
            type="number"
            className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl text-xl font-bold outline-none"
            value={formData.monto}
            onChange={e => setFormData({ ...formData, monto: Number(e.target.value) })}
          />
        </div>
      </div>
      <button 
        onClick={() => mutation.mutate(formData)}
        disabled={mutation.isPending}
        className={`w-full py-4 text-white rounded-2xl font-bold shadow-lg transition-all flex items-center justify-center gap-2 active:scale-95 ${tipo === 'INGRESO' ? 'bg-emerald-600 hover:bg-emerald-700' : 'bg-rose-600 hover:bg-rose-700'}`}
      >
        <Save size={20} />
        REGISTRAR {tipo}
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
      <div className="p-4 bg-slate-900 text-white rounded-2xl space-y-2">
        <p className="text-xs text-slate-400 uppercase font-bold">Saldo Estimado (Sistema)</p>
        <p className="text-2xl font-mono font-bold">${saldoEstimado.toFixed(2)}</p>
      </div>

      <div className="space-y-2">
        <label className="text-sm font-bold text-slate-700 uppercase">Monto Contado en Caja ($)</label>
        <input 
          type="number"
          autoFocus
          className="w-full p-4 bg-slate-50 border-2 border-slate-200 rounded-2xl text-2xl font-mono font-bold focus:border-primary-500 outline-none"
          value={saldoDeclarado}
          onChange={e => setSaldoDeclarado(Number(e.target.value))}
        />
      </div>

      {saldoDeclarado > 0 && (
        <div className={`p-4 rounded-xl font-bold flex items-center justify-between ${diferencia === 0 ? 'bg-emerald-50 text-emerald-700' : 'bg-amber-50 text-amber-700'}`}>
          <span>Diferencia:</span>
          <span>${diferencia.toFixed(2)}</span>
        </div>
      )}

      <button 
        onClick={() => mutation.mutate({ saldo_final_declarado: saldoDeclarado })}
        disabled={mutation.isPending}
        className="w-full py-4 bg-slate-900 text-white rounded-2xl font-bold shadow-lg hover:bg-slate-800 transition-all flex items-center justify-center gap-2 active:scale-95"
      >
        <Lock size={20} />
        CERRAR CAJA Y TERMINAR TURNO
      </button>
    </div>
  );
};
