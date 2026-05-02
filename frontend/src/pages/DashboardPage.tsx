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
  Plus,
  Download,
  Receipt
} from 'lucide-react';

const StatCard = ({ title, value, icon: Icon, color, trend }: any) => (
  <div className="bg-white/5 backdrop-blur-md p-6 rounded-2xl border border-white/5 hover:bg-white/[0.08] transition-all group">
    <div className="flex items-center justify-between">
      <div>
        <p className="text-[10px] font-bold text-slate-500 uppercase tracking-widest mb-1">{title}</p>
        <h3 className="text-2xl font-bold text-white tracking-tight">{value}</h3>
      </div>
      <div className={`p-3 rounded-xl ${color} group-hover:scale-105 transition-transform`}>
        <Icon size={24} />
      </div>
    </div>
    {trend !== undefined && (
      <div className="mt-4 flex items-center gap-2">
        <div className={`flex items-center gap-1 px-1.5 py-0.5 rounded-md text-[10px] font-bold ${trend > 0 ? 'bg-emerald-500/10 text-emerald-400' : 'bg-rose-500/10 text-rose-400'}`}>
          {trend > 0 ? <ArrowUpRight size={12} /> : <ArrowDownRight size={12} />}
          {Math.abs(trend)}%
        </div>
        <span className="text-[10px] font-medium text-slate-600">vs ayer</span>
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

  if (isLoading) return <div className="p-10 text-center text-slate-500 font-medium">Cargando tablero de control...</div>;

  return (
    <div className="space-y-8">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold text-white tracking-tight">Panel de Control</h2>
          <p className="text-slate-500 text-sm font-medium mt-0.5">Métricas de rendimiento en tiempo real</p>
        </div>
        <div className="flex gap-3">
          <button className="flex items-center gap-2 px-4 py-2 bg-white/5 border border-white/10 text-slate-300 rounded-xl text-xs font-semibold hover:bg-white/10 transition-all">
            <Download size={16} />
            Exportar
          </button>
          <Link to="/app/pos" className="flex items-center gap-2 px-5 py-2 bg-white text-slate-950 rounded-xl text-xs font-bold hover:bg-slate-200 transition-all shadow-lg active:scale-[0.98]">
            <Plus size={16} />
            Nueva Venta
          </Link>
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        <StatCard 
          title="Ventas del Día" 
          value={`$${Number(stats?.ventas_dia || 0).toLocaleString()}`}
          icon={TrendingUp}
          color="bg-slate-800 text-slate-200"
          trend={stats?.tendencia_ventas}
        />
        <StatCard 
          title="Clientes Nuevos" 
          value={stats?.clientes_nuevos}
          icon={Users}
          color="bg-slate-800 text-slate-200"
          trend={12}
        />
        <StatCard 
          title="Stock Crítico" 
          value={stats?.stock_bajo}
          icon={AlertTriangle}
          color="bg-rose-500/10 text-rose-400"
        />
        <StatCard 
          title="Valor Inventario" 
          value={`$${Number(stats?.valor_inventario || 0).toLocaleString()}`}
          icon={Package}
          color="bg-slate-800 text-slate-200"
        />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2 bg-white/5 backdrop-blur-md p-6 rounded-2xl border border-white/5">
          <div className="flex items-center justify-between mb-6">
            <h3 className="text-xs font-bold text-slate-500 uppercase tracking-widest">Actividad Reciente</h3>
            <Link to="/app/pos" className="text-xs font-bold text-accent-500 hover:underline">Ver todas</Link>
          </div>
          <div className="space-y-4">
            {stats?.ventas_recientes?.map((venta: any) => (
              <div key={venta.id} className="flex items-center justify-between p-3 bg-white/[0.02] hover:bg-white/[0.05] rounded-xl border border-white/5 transition-colors group/item">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-slate-800 rounded-lg flex items-center justify-center text-xs font-bold text-slate-400 group-hover/item:text-primary-400 transition-colors">
                    #{venta.id}
                  </div>
                  <div>
                    <p className="text-sm font-semibold text-white">{venta.cliente_nombre || 'Consumidor Final'}</p>
                    <p className="text-[10px] text-slate-500 font-medium">{new Date(venta.fecha).toLocaleTimeString()} • {venta.metodo_pago}</p>
                  </div>
                </div>
                <div className="flex items-center gap-4">
                  <button 
                    onClick={async () => {
                      try {
                        const res = await api.get(`/ventas/ventas/${venta.id}/ticket-pdf/`, { responseType: 'blob' });
                        const url = window.URL.createObjectURL(new Blob([res.data], { type: 'application/pdf' }));
                        window.open(url, '_blank');
                      } catch (e) { alert("Error al generar ticket"); }
                    }}
                    className="p-2 bg-white/5 text-slate-500 hover:text-white rounded-lg opacity-0 group-hover/item:opacity-100 transition-all"
                    title="Imprimir Ticket"
                  >
                    <Receipt size={16} />
                  </button>
                  <div className="text-right">
                    <p className="text-base font-bold text-white">${Number(venta.total).toLocaleString()}</p>
                    <p className="text-[10px] text-emerald-500 font-bold uppercase tracking-widest">Éxito</p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="bg-white/5 backdrop-blur-md p-6 rounded-2xl border border-white/5">
          <h3 className="text-xs font-bold text-slate-500 uppercase tracking-widest mb-6">Métodos de Pago</h3>
          <div className="space-y-5">
            {Object.entries(stats?.pagos_por_metodo || {}).map(([metodo, total]: any) => (
              <div key={metodo} className="space-y-2">
                <div className="flex justify-between text-xs">
                  <span className="text-slate-400 font-medium capitalize">{metodo.replace('_', ' ')}</span>
                  <span className="text-white font-bold">${Number(total).toLocaleString()}</span>
                </div>
                <div className="h-1.5 bg-white/5 rounded-full overflow-hidden">
                  <div 
                    className="h-full bg-slate-400 rounded-full" 
                    style={{ width: `${(total / (stats.ventas_dia || 1)) * 100}%` }}
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
