import { useQuery } from '@tanstack/react-query';
import { Link } from 'react-router-dom';
import api from '../api/axios';
import { 
  TrendingUp, 
  Users, 
  Package, 
  AlertTriangle,
  ArrowUpRight,
  ArrowDownRight,
  ArrowRight,
  Download
} from 'lucide-react';

const StatCard = ({ title, value, icon: Icon, color, trend }: any) => (
  <div className="bg-white/5 backdrop-blur-sm p-8 rounded-[2.5rem] border border-white/5 shadow-2xl hover:bg-white/[0.08] transition-all group">
    <div className="flex items-center justify-between">
      <div>
        <p className="text-xs font-black text-slate-500 uppercase tracking-[0.2em] mb-2">{title}</p>
        <h3 className="text-3xl font-black text-white tracking-tighter">{value}</h3>
      </div>
      <div className={`p-4 rounded-2xl ${color} shadow-lg shadow-current/10 group-hover:scale-110 transition-transform`}>
        <Icon size={28} />
      </div>
    </div>
    {trend !== undefined && (
      <div className="mt-6 flex items-center gap-2">
        <div className={`flex items-center gap-1 px-2 py-1 rounded-lg text-[10px] font-black tracking-wider ${trend > 0 ? 'bg-emerald-500/10 text-emerald-400' : 'bg-rose-500/10 text-rose-400'}`}>
          {trend > 0 ? <ArrowUpRight size={14} /> : <ArrowDownRight size={14} />}
          {Math.abs(trend)}%
        </div>
        <span className="text-[10px] font-bold text-slate-600 uppercase tracking-widest">vs ayer</span>
      </div>
    )}
  </div>
);

export const DashboardPage = () => {
  const { data: stats, isLoading } = useQuery({
    queryKey: ['dashboard-stats'],
    queryFn: async () => {
      const response = await api.get('/reportes/dashboard/');
      return response.data.data;
    },
  });

  if (isLoading) return <div>Cargando dashboard...</div>;

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 mb-12">
        <div>
          <h2 className="text-4xl font-black text-white tracking-tighter">Bienvenido de nuevo</h2>
          <p className="text-slate-500 font-bold tracking-tight mt-1">Tu negocio hoy en un vistazo rápido</p>
        </div>
        <div className="flex gap-4">
          <button className="px-6 py-3.5 bg-white/5 border border-white/5 text-slate-400 rounded-2xl text-sm font-black hover:bg-white/10 hover:text-white transition-all active:scale-95 flex items-center gap-2">
            <Download size={18} />
            EXPORTAR REPORTE
          </button>
          <Link to="/app/pos" className="px-6 py-3.5 bg-white text-slate-950 rounded-2xl text-sm font-black hover:bg-slate-200 transition-all shadow-xl shadow-white/5 flex items-center gap-2 group">
            <span>NUEVA VENTA</span>
            <ArrowRight size={18} className="text-slate-400 group-hover:translate-x-1 transition-transform" />
          </Link>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8 mb-12">
        <StatCard 
          title="Ventas del Día" 
          value={`$${Number(stats?.ventas_dia || 0).toLocaleString()}`}
          icon={TrendingUp}
          color="bg-primary-500/10 text-primary-400"
          trend={stats?.tendencia_ventas}
        />
        <StatCard 
          title="Clientes Nuevos" 
          value={stats?.clientes_nuevos}
          icon={Users}
          color="bg-blue-500/10 text-blue-400"
          trend={12}
        />
        <StatCard 
          title="Stock Crítico" 
          value={stats?.stock_bajo}
          icon={AlertTriangle}
          color="bg-amber-500/10 text-amber-400"
        />
        <StatCard 
          title="Valor Inventario" 
          value={`$${Number(stats?.valor_inventario || 0).toLocaleString()}`}
          icon={Package}
          color="bg-emerald-500/10 text-emerald-400"
        />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2 bg-white/5 backdrop-blur-sm p-8 rounded-[2.5rem] border border-white/5">
          <h3 className="text-xl font-black text-white mb-8 tracking-tight uppercase tracking-widest text-sm opacity-50">Actividad de Ventas Recientes</h3>
          <div className="space-y-6">
            {stats?.ventas_recientes?.map((venta: any) => (
              <div key={venta.id} className="flex items-center justify-between p-4 bg-white/[0.02] hover:bg-white/[0.05] rounded-2xl border border-white/5 transition-colors group">
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 bg-white/5 rounded-xl flex items-center justify-center text-slate-400 font-bold group-hover:text-primary-400 transition-colors">
                    #{venta.id}
                  </div>
                  <div>
                    <p className="text-sm font-black text-white">{venta.cliente_nombre || 'Consumidor Final'}</p>
                    <p className="text-[10px] text-slate-500 font-bold uppercase tracking-widest mt-1">{venta.metodo_pago} • {new Date(venta.fecha).toLocaleTimeString()}</p>
                  </div>
                </div>
                <div className="text-right">
                  <p className="text-lg font-black text-white">${Number(venta.total).toLocaleString()}</p>
                  <p className="text-[10px] text-emerald-500 font-bold uppercase tracking-widest">Completada</p>
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="bg-white/5 backdrop-blur-sm p-8 rounded-[2.5rem] border border-white/5">
          <h3 className="text-xl font-black text-white mb-8 tracking-tight uppercase tracking-widest text-sm opacity-50">Distribución de Pagos</h3>
          <div className="space-y-6">
            {Object.entries(stats?.pagos_por_metodo || {}).map(([metodo, total]: any) => (
              <div key={metodo} className="space-y-3">
                <div className="flex justify-between text-sm font-bold">
                  <span className="text-slate-400 uppercase tracking-widest text-[10px]">{metodo}</span>
                  <span className="text-white">${Number(total).toLocaleString()}</span>
                </div>
                <div className="h-2 bg-white/5 rounded-full overflow-hidden">
                  <div 
                    className="h-full bg-primary-500 shadow-[0_0_10px_rgba(6,182,212,0.5)]" 
                    style={{ width: `${(total / stats.ventas_dia) * 100}%` }}
                  ></div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};
