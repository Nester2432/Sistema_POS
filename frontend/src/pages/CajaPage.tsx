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

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-slate-900 tracking-tight">Gestión de Caja</h2>
          <p className="text-slate-500">Control de ingresos, egresos y arqueo</p>
        </div>
        <div className="flex gap-3">
          <button className="flex items-center gap-2 px-4 py-2 bg-white border border-slate-200 text-slate-700 rounded-xl text-sm font-bold hover:bg-slate-50 transition-all">
            <History size={18} />
            Historial de Cierres
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Estado de Caja */}
        <div className={`lg:col-span-2 p-8 rounded-[2rem] shadow-xl transition-all ${estaAbierta ? 'bg-slate-900 text-white' : 'bg-white text-slate-500 border border-slate-200'}`}>
          <div className="flex items-center justify-between mb-8">
            <div className="flex items-center gap-3">
              <div className={`p-3 rounded-2xl ${estaAbierta ? 'bg-slate-800 border border-white/10' : 'bg-slate-50'}`}>
                {estaAbierta ? <Unlock size={24} className="text-primary-400" /> : <Lock size={24} />}
              </div>
              <div>
                <p className="text-sm font-black opacity-60 uppercase tracking-widest">Estado Actual</p>
                <h3 className="text-2xl font-black tracking-tight">{estaAbierta ? 'CAJA ABIERTA' : 'CAJA CERRADA'}</h3>
              </div>
            </div>
            {estaAbierta && (
              <div className="text-right">
                <p className="text-sm opacity-60 font-medium">Responsable: <span className="text-white">{caja.usuario_apertura_nombre}</span></p>
                <p className="text-xs opacity-40">{new Date(caja.fecha_apertura).toLocaleString()}</p>
              </div>
            )}
          </div>

          {estaAbierta ? (
            <div className="grid grid-cols-1 md:grid-cols-3 gap-8 pt-4 border-t border-white/5">
              <div>
                <p className="text-slate-400 text-xs mb-1 font-black uppercase tracking-wider">Saldo Inicial</p>
                <p className="text-3xl font-mono font-bold text-white">${caja.saldo_inicial}</p>
              </div>
              <div>
                <p className="text-slate-400 text-xs mb-1 font-black uppercase tracking-wider">Flujo Neto</p>
                <p className={`text-3xl font-mono font-bold ${(caja.total_ingresos - caja.total_egresos) >= 0 ? 'text-emerald-400' : 'text-rose-400'}`}>
                  ${((caja.total_ingresos || 0) - (caja.total_egresos || 0)).toFixed(2)}
                </p>
              </div>
              <div>
                <p className="text-primary-400 text-xs mb-1 font-black uppercase tracking-wider">Saldo en Sistema</p>
                <p className="text-4xl font-mono font-black text-white">${saldoEstimado.toFixed(2)}</p>
              </div>
            </div>
          ) : (
            <div className="flex flex-col items-center py-8 text-center">
              <AlertCircle size={48} className="mb-4 opacity-30" />
              <p className="text-lg font-medium mb-6">Debe abrir la caja para comenzar a registrar ventas.</p>
              <button 
                onClick={() => setModalType('ABRIR')}
                className="px-8 py-3 bg-slate-900 text-white rounded-2xl font-bold hover:bg-slate-800 transition-all shadow-lg"
              >
                Abrir Caja con Saldo Inicial
              </button>
            </div>
          )}
        </div>

        {/* Acciones de Movimiento */}
        <div className="bg-white p-6 rounded-[2rem] border border-slate-100 shadow-sm flex flex-col justify-center gap-4">
          <button 
            disabled={!estaAbierta} 
            onClick={() => setModalType('INGRESO')}
            className="flex items-center gap-4 p-4 bg-emerald-50 text-emerald-700 rounded-2xl hover:bg-emerald-100 transition-all group disabled:opacity-50"
          >
            <div className="p-2 bg-emerald-500 text-white rounded-xl group-hover:scale-110 transition-transform">
              <ArrowUpCircle size={24} />
            </div>
            <div className="text-left">
              <p className="font-bold">Ingreso Manual</p>
              <p className="text-xs opacity-70">Aporte de capital, otros</p>
            </div>
          </button>
          
          <button 
            disabled={!estaAbierta} 
            onClick={() => setModalType('EGRESO')}
            className="flex items-center gap-4 p-4 bg-rose-50 text-rose-700 rounded-2xl hover:bg-rose-100 transition-all group disabled:opacity-50"
          >
            <div className="p-2 bg-rose-500 text-white rounded-xl group-hover:scale-110 transition-transform">
              <ArrowDownCircle size={24} />
            </div>
            <div className="text-left">
              <p className="font-bold">Egreso de Caja</p>
              <p className="text-xs opacity-70">Pagos, retiros, gastos</p>
            </div>
          </button>

          {estaAbierta && (
            <button 
              onClick={() => setModalType('CERRAR')}
              className="mt-4 w-full py-4 bg-slate-900 text-white rounded-2xl font-bold hover:bg-slate-800 transition-all"
            >
              Cerrar Caja / Arqueo
            </button>
          )}
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2 bg-white/5 backdrop-blur-md rounded-[2.5rem] border border-white/5 shadow-2xl overflow-hidden">
          <div className="p-8 border-b border-white/5 flex items-center justify-between bg-white/[0.02]">
            <h3 className="text-xl font-black text-white tracking-tighter uppercase tracking-widest text-[10px] opacity-50">Movimientos de Turno</h3>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-left">
              <thead>
                <tr className="bg-white/[0.01] border-b border-white/5">
                  <th className="px-8 py-5 text-[10px] font-black text-slate-500 uppercase tracking-widest">Tipo</th>
                  <th className="px-8 py-5 text-[10px] font-black text-slate-500 uppercase tracking-widest">Concepto</th>
                  <th className="px-8 py-5 text-[10px] font-black text-slate-500 uppercase tracking-widest text-right">Monto</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/5">
                {(!estaAbierta || caja.movimientos?.length === 0) ? (
                  <tr>
                    <td colSpan={3} className="px-8 py-12 text-center text-slate-600 font-bold italic">No hay movimientos registrados en este turno.</td>
                  </tr>
                ) : caja.movimientos?.map((mov: any) => (
                  <tr key={mov.id} className="hover:bg-white/[0.02] transition-colors group">
                    <td className="px-8 py-6">
                      <div className="flex items-center gap-3">
                        {mov.monto > 0 ? (
                          <div className="p-2 bg-emerald-500/10 text-emerald-400 rounded-lg"><ArrowUpCircle size={18} /></div>
                        ) : (
                          <div className="p-2 bg-rose-500/10 text-rose-400 rounded-lg"><ArrowDownCircle size={18} /></div>
                        )}
                        <span className="font-black text-xs text-white tracking-widest">{mov.tipo}</span>
                      </div>
                    </td>
                    <td className="px-8 py-6">
                      <p className="text-sm font-bold text-slate-300">{mov.concepto}</p>
                      <p className="text-[10px] text-slate-600 font-bold uppercase tracking-widest mt-1">{new Date(mov.fecha).toLocaleTimeString()}</p>
                    </td>
                    <td className="px-8 py-6 text-right">
                      <p className={`text-lg font-black ${mov.monto > 0 ? 'text-emerald-400' : 'text-rose-400'}`}>
                        {mov.monto > 0 ? '+' : ''}{Number(mov.monto).toLocaleString()}
                      </p>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Acciones Rápidas */}
        <div className="space-y-6">
          <div className="bg-slate-900 p-8 rounded-[2.5rem] border border-white/5 shadow-2xl">
            <h3 className="text-xs font-black text-slate-500 uppercase tracking-[0.2em] mb-6 text-center">Acciones de Efectivo</h3>
            <div className="space-y-4">
              <button 
                onClick={() => setModalType('INGRESO')}
                className="w-full flex items-center justify-between p-5 bg-emerald-500/5 border border-emerald-500/20 rounded-[1.5rem] text-emerald-400 hover:bg-emerald-500/10 transition-all group"
              >
                <div className="flex items-center gap-4">
                  <div className="p-3 bg-emerald-500/20 rounded-xl group-hover:scale-110 transition-transform">
                    <ArrowUpCircle size={24} />
                  </div>
                  <div className="text-left">
                    <p className="font-black text-sm tracking-tight">INGRESO MANUAL</p>
                    <p className="text-[10px] opacity-60 font-bold uppercase tracking-widest">Aporte capital, otros</p>
                  </div>
                </div>
                <Plus size={20} className="opacity-40" />
              </button>

              <button 
                onClick={() => setModalType('EGRESO')}
                className="w-full flex items-center justify-between p-5 bg-rose-500/5 border border-rose-500/20 rounded-[1.5rem] text-rose-400 hover:bg-rose-500/10 transition-all group"
              >
                <div className="flex items-center gap-4">
                  <div className="p-3 bg-rose-500/20 rounded-xl group-hover:scale-110 transition-transform">
                    <ArrowDownCircle size={24} />
                  </div>
                  <div className="text-left">
                    <p className="font-black text-sm tracking-tight">EGRESO DE CAJA</p>
                    <p className="text-[10px] opacity-60 font-bold uppercase tracking-widest">Pagos, retiros, gastos</p>
                  </div>
                </div>
                <Minus size={20} className="opacity-40" />
              </button>
            </div>
          </div>

          <button 
            onClick={() => setModalType('CERRAR')}
            className="w-full py-6 bg-white text-slate-950 rounded-[2rem] font-black text-lg shadow-2xl shadow-white/5 hover:bg-slate-200 transition-all active:scale-95 flex items-center justify-center gap-3 group"
          >
            <Lock size={20} className="text-slate-400 group-hover:rotate-12 transition-transform" />
            <span>CERRAR CAJA / ARQUEO</span>
          </button>
        </div>
      </div>

      {/* MODALES */}
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
