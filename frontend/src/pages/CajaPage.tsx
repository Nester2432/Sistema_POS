import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import api from '../api/axios';
import { Modal } from '../components/Modal';
import { AbrirCajaForm, CerrarCajaForm, MovimientoCajaForm } from '../components/CajaForms';
import { 
  ArrowUpCircle, 
  ArrowDownCircle, 
  Lock, 
  Unlock,
  History,
  AlertCircle,
  Plus,
  Minus
} from 'lucide-react';

export const CajaPage = () => {
  const [modalType, setModalType] = useState<string | null>(null);

  const { data: caja, isLoading } = useQuery({
    queryKey: ['caja-mi-caja'],
    queryFn: async () => {
      const response = await api.get('/caja/mi-caja/');
      return response.data.data;
    }
  });

  if (isLoading) return <div className="p-8 text-center text-slate-400">Cargando estado de caja...</div>;

  const estaAbierta = !!caja;
  const saldoEstimado = estaAbierta ? (Number(caja.saldo_inicial) + (caja.total_ingresos || 0) - (caja.total_egresos || 0)) : 0;

  if (!estaAbierta) {
    return (
      <div className="h-full flex flex-col items-center justify-center text-center p-12 bg-white/5 backdrop-blur-md rounded-2xl border border-white/5">
        <div className="p-6 bg-accent-500/10 rounded-full text-accent-500 mb-6">
          <Lock size={64} />
        </div>
        <h2 className="text-2xl font-bold text-white mb-2 tracking-tight">Caja Cerrada</h2>
        <p className="text-slate-500 max-w-sm mb-8 text-sm font-medium leading-relaxed">
          No hay turnos activos en este momento. Inicia una nueva jornada para comenzar a registrar movimientos.
        </p>
        <button 
          onClick={() => setModalType('ABRIR')}
          className="flex items-center gap-2 px-8 py-3 bg-white text-slate-950 rounded-xl font-bold text-sm hover:bg-slate-200 transition-all shadow-lg active:scale-[0.98]"
        >
          <Unlock size={18} />
          <span>Abrir Nueva Caja</span>
        </button>
        
        <Modal isOpen={modalType === 'ABRIR'} onClose={() => setModalType(null)} title="Apertura de Caja">
          <AbrirCajaForm onSuccess={() => setModalType(null)} />
        </Modal>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold text-white tracking-tight">Gestión de Turno</h2>
          <p className="text-slate-500 text-sm font-medium mt-0.5">Control de flujo de caja y arqueo de valores</p>
        </div>
        <div className="flex items-center gap-3">
          <div className="px-3 py-1 bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 rounded-full text-[10px] font-bold tracking-widest flex items-center gap-2">
            <span className="w-1.5 h-1.5 bg-emerald-500 rounded-full animate-pulse"></span>
            TURNO ACTIVO
          </div>
          <span className="text-slate-500 text-xs font-medium">Iniciado: {new Date(caja.fecha_apertura).toLocaleString()}</span>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-white/5 p-6 rounded-2xl border border-white/5 shadow-xl">
          <p className="text-[10px] font-bold text-slate-500 uppercase tracking-widest mb-1">Saldo Apertura</p>
          <p className="text-3xl font-bold text-white tracking-tight">${Number(caja.saldo_inicial).toLocaleString()}</p>
        </div>
        <div className="bg-white/5 p-6 rounded-2xl border border-white/5 shadow-xl">
          <p className="text-[10px] font-bold text-slate-500 uppercase tracking-widest mb-1">Flujo Neto</p>
          <p className={`text-3xl font-bold tracking-tight ${(caja.total_ingresos - caja.total_egresos) >= 0 ? 'text-emerald-400' : 'text-rose-400'}`}>
            ${((caja.total_ingresos || 0) - (caja.total_egresos || 0)).toLocaleString()}
          </p>
        </div>
        <div className="bg-white/5 p-6 rounded-2xl border border-white/5 shadow-xl relative overflow-hidden group">
          <div className="absolute top-0 right-0 w-24 h-24 bg-accent-500/5 rounded-full -mr-12 -mt-12 blur-2xl"></div>
          <p className="text-[10px] font-bold text-slate-500 uppercase tracking-widest mb-1">Saldo en Sistema</p>
          <p className="text-3xl font-bold text-white tracking-tight">${saldoEstimado.toLocaleString()}</p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 bg-white/5 backdrop-blur-md rounded-2xl border border-white/5 shadow-xl overflow-hidden">
          <div className="p-5 border-b border-white/5 flex items-center justify-between bg-white/[0.02]">
            <h3 className="text-xs font-bold text-slate-500 uppercase tracking-widest">Historial de Movimientos</h3>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-left">
              <thead>
                <tr className="bg-white/[0.01] border-b border-white/5">
                  <th className="px-6 py-4 text-[10px] font-bold text-slate-500 uppercase tracking-widest">Tipo</th>
                  <th className="px-6 py-4 text-[10px] font-bold text-slate-500 uppercase tracking-widest">Concepto</th>
                  <th className="px-6 py-4 text-[10px] font-bold text-slate-500 uppercase tracking-widest text-right">Monto</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/5">
                {(!estaAbierta || caja.movimientos?.length === 0) ? (
                  <tr>
                    <td colSpan={3} className="px-6 py-12 text-center text-slate-600 font-medium italic">No hay movimientos registrados en este turno.</td>
                  </tr>
                ) : caja.movimientos?.map((mov: any) => (
                  <tr key={mov.id} className="hover:bg-white/[0.01] transition-colors">
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-3">
                        {mov.monto > 0 ? (
                          <ArrowUpCircle size={14} className="text-emerald-500" />
                        ) : (
                          <ArrowDownCircle size={14} className="text-rose-500" />
                        )}
                        <span className="font-bold text-xs text-white uppercase tracking-wider">{mov.tipo}</span>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <p className="text-sm font-medium text-slate-300">{mov.concepto}</p>
                      <p className="text-[10px] text-slate-600 font-medium">{new Date(mov.fecha).toLocaleTimeString()}</p>
                    </td>
                    <td className="px-6 py-4 text-right">
                      <p className={`text-base font-bold ${mov.monto > 0 ? 'text-emerald-400' : 'text-rose-400'}`}>
                        {mov.monto > 0 ? '+' : ''}{Number(mov.monto).toLocaleString()}
                      </p>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        <div className="space-y-6">
          <div className="bg-slate-900/50 p-6 rounded-2xl border border-white/5 shadow-xl">
            <h3 className="text-[10px] font-bold text-slate-500 uppercase tracking-widest mb-6 text-center">Acciones Rápidas</h3>
            <div className="space-y-3">
              <button 
                onClick={() => setModalType('INGRESO')}
                className="w-full flex items-center justify-between p-4 bg-white/5 border border-white/5 rounded-xl text-slate-300 hover:bg-emerald-500/5 hover:text-emerald-400 hover:border-emerald-500/20 transition-all group"
              >
                <div className="flex items-center gap-3">
                  <ArrowUpCircle size={18} />
                  <div className="text-left">
                    <p className="font-bold text-xs">INGRESO MANUAL</p>
                    <p className="text-[10px] opacity-50">Aporte capital, otros</p>
                  </div>
                </div>
                <Plus size={16} className="opacity-40" />
              </button>

              <button 
                onClick={() => setModalType('EGRESO')}
                className="w-full flex items-center justify-between p-4 bg-white/5 border border-white/5 rounded-xl text-slate-300 hover:bg-rose-500/5 hover:text-rose-400 hover:border-rose-500/20 transition-all group"
              >
                <div className="flex items-center gap-3">
                  <ArrowDownCircle size={18} />
                  <div className="text-left">
                    <p className="font-bold text-xs">EGRESO DE CAJA</p>
                    <p className="text-[10px] opacity-50">Pagos, retiros, gastos</p>
                  </div>
                </div>
                <Minus size={16} className="opacity-40" />
              </button>
            </div>
          </div>

          <button 
            onClick={() => setModalType('CERRAR')}
            className="w-full py-4 bg-white text-slate-950 rounded-xl font-bold text-sm shadow-xl hover:bg-slate-200 transition-all active:scale-[0.98] flex items-center justify-center gap-2"
          >
            <Lock size={18} />
            <span>CERRAR CAJA / ARQUEO</span>
          </button>
        </div>
      </div>

      <Modal 
        isOpen={!!modalType} 
        onClose={() => setModalType(null)} 
        title={modalType === 'ABRIR' ? 'Apertura de Caja' : modalType === 'CERRAR' ? 'Cierre de Caja' : 'Movimiento de Caja'}
      >
        {modalType === 'ABRIR' && <AbrirCajaForm onSuccess={() => setModalType(null)} />}
        {modalType === 'CERRAR' && <CerrarCajaForm cajaId={caja.id} onSuccess={() => setModalType(null)} saldoEstimado={saldoEstimado} />}
        {(modalType === 'INGRESO' || modalType === 'EGRESO') && <MovimientoCajaForm onSuccess={() => setModalType(null)} tipo={modalType as any} />}
      </Modal>
    </div>
  );
};
