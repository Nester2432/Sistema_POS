import { useQuery } from '@tanstack/react-query';
import api from '../api/axios';
import { 
  Wallet, 
  ArrowUpCircle, 
  ArrowDownCircle, 
  Lock, 
  Unlock,
  History,
  AlertCircle
} from 'lucide-react';

export const CajaPage = () => {
  const { data: caja, isLoading } = useQuery({
    queryKey: ['caja-actual'],
    queryFn: async () => {
      const response = await api.get('/caja/actual/');
      return response.data.data;
    }
  });

  if (isLoading) return <div className="p-8 text-center text-slate-400">Cargando estado de caja...</div>;

  const estaAbierta = !!caja;

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
        <div className={`lg:col-span-2 p-8 rounded-[2rem] shadow-xl transition-all ${estaAbierta ? 'bg-primary-600 text-white' : 'bg-slate-100 text-slate-500 border-2 border-dashed border-slate-300'}`}>
          <div className="flex items-center justify-between mb-8">
            <div className="flex items-center gap-3">
              <div className={`p-3 rounded-2xl ${estaAbierta ? 'bg-primary-500' : 'bg-slate-200'}`}>
                {estaAbierta ? <Unlock size={24} /> : <Lock size={24} />}
              </div>
              <div>
                <p className="text-sm font-bold opacity-80 uppercase tracking-widest">Estado Actual</p>
                <h3 className="text-2xl font-black">{estaAbierta ? 'CAJA ABIERTA' : 'CAJA CERRADA'}</h3>
              </div>
            </div>
            {estaAbierta && (
              <div className="text-right">
                <p className="text-sm opacity-80">Abierta por: <span className="font-bold">{caja.usuario_apertura_nombre}</span></p>
                <p className="text-xs opacity-60">{new Date(caja.fecha_apertura).toLocaleString()}</p>
              </div>
            )}
          </div>

          {estaAbierta ? (
            <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
              <div>
                <p className="text-primary-100 text-sm mb-1 font-medium">Saldo Inicial</p>
                <p className="text-3xl font-mono font-bold">${caja.saldo_inicial}</p>
              </div>
              <div>
                <p className="text-primary-100 text-sm mb-1 font-medium">Ventas / Ingresos</p>
                <p className="text-3xl font-mono font-bold text-emerald-300">+$25,430.00</p>
              </div>
              <div>
                <p className="text-primary-100 text-sm mb-1 font-medium">Saldo Estimado</p>
                <p className="text-4xl font-mono font-black">${Number(caja.saldo_inicial) + 25430}</p>
              </div>
            </div>
          ) : (
            <div className="flex flex-col items-center py-8 text-center">
              <AlertCircle size={48} className="mb-4 opacity-30" />
              <p className="text-lg font-medium mb-6">Debe abrir la caja para comenzar a registrar ventas.</p>
              <button className="px-8 py-3 bg-slate-900 text-white rounded-2xl font-bold hover:bg-slate-800 transition-all shadow-lg">
                Abrir Caja con Saldo Inicial
              </button>
            </div>
          )}
        </div>

        {/* Acciones de Movimiento */}
        <div className="bg-white p-6 rounded-[2rem] border border-slate-100 shadow-sm flex flex-col justify-center gap-4">
          <button disabled={!estaAbierta} className="flex items-center gap-4 p-4 bg-emerald-50 text-emerald-700 rounded-2xl hover:bg-emerald-100 transition-all group disabled:opacity-50">
            <div className="p-2 bg-emerald-500 text-white rounded-xl group-hover:scale-110 transition-transform">
              <ArrowUpCircle size={24} />
            </div>
            <div className="text-left">
              <p className="font-bold">Ingreso Manual</p>
              <p className="text-xs opacity-70">Aporte de capital, otros</p>
            </div>
          </button>
          
          <button disabled={!estaAbierta} className="flex items-center gap-4 p-4 bg-rose-50 text-rose-700 rounded-2xl hover:bg-rose-100 transition-all group disabled:opacity-50">
            <div className="p-2 bg-rose-500 text-white rounded-xl group-hover:scale-110 transition-transform">
              <ArrowDownCircle size={24} />
            </div>
            <div className="text-left">
              <p className="font-bold">Egreso de Caja</p>
              <p className="text-xs opacity-70">Pagos, retiros, gastos</p>
            </div>
          </button>

          {estaAbierta && (
            <button className="mt-4 w-full py-4 bg-slate-900 text-white rounded-2xl font-bold hover:bg-slate-800 transition-all">
              Cerrar Caja / Arqueo
            </button>
          )}
        </div>
      </div>

      {/* Ultimos Movimientos */}
      <div className="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden">
        <div className="p-4 bg-slate-50 border-b flex items-center justify-between">
          <h3 className="font-bold text-slate-800">Últimos Movimientos</h3>
          <span className="text-xs font-bold text-slate-400 uppercase tracking-widest">Hoy</span>
        </div>
        <div className="p-0">
          <table className="w-full text-left border-collapse">
            <tbody className="divide-y divide-slate-50">
              {[1, 2, 3].map((i) => (
                <tr key={i} className="hover:bg-slate-50 transition-colors">
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-3">
                      <div className="p-2 bg-slate-100 text-slate-500 rounded-lg">
                        <Wallet size={16} />
                      </div>
                      <div>
                        <p className="text-sm font-bold text-slate-900">Venta de Productos #T-00{i}</p>
                        <p className="text-xs text-slate-400">14:30 hs • Efectivo</p>
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4 text-sm text-slate-500 italic">Pago de cliente demo</td>
                  <td className="px-6 py-4 text-right">
                    <span className="font-bold text-emerald-600">+$1,500.00</span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
