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
  <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-100">
    <div className="flex items-center justify-between">
      <div>
        <p className="text-sm font-medium text-slate-500">{title}</p>
        <h3 className="text-2xl font-bold mt-1 text-slate-900">{value}</h3>
      </div>
      <div className={`p-3 rounded-lg ${color}`}>
        <Icon size={24} />
      </div>
    </div>
    {trend && (
      <div className="mt-4 flex items-center gap-1">
        {trend > 0 ? (
          <ArrowUpRight className="text-emerald-500" size={16} />
        ) : (
          <ArrowDownRight className="text-rose-500" size={16} />
        )}
        <span className={`text-xs font-medium ${trend > 0 ? 'text-emerald-500' : 'text-rose-500'}`}>
          {Math.abs(trend)}% vs ayer
        </span>
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
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-3xl font-black text-slate-900 tracking-tight">Bienvenido de nuevo</h2>
          <p className="text-slate-500 font-medium">Resumen operativo de hoy</p>
        </div>
        <div className="flex gap-3">
          <button className="px-4 py-2.5 bg-white border border-slate-200 text-slate-600 rounded-xl text-sm font-bold hover:bg-slate-50 transition-all active:scale-95 flex items-center gap-2">
            <Download size={18} />
            Exportar
          </button>
          <Link to="/app/pos" className="px-5 py-2.5 bg-white border border-slate-200 text-slate-900 rounded-xl text-sm font-bold hover:bg-slate-50 hover:border-slate-300 transition-all shadow-sm active:scale-95 flex items-center gap-2 group">
            <span>Nueva Venta</span>
            <ArrowRight size={18} className="text-slate-400 group-hover:translate-x-1 transition-transform" />
          </Link>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <StatCard 
          title="Ventas del Día" 
          value={`$${stats?.ventas_hoy}`} 
          icon={TrendingUp} 
          color="bg-emerald-100 text-emerald-600"
          trend={12}
        />
        <StatCard 
          title="Deuda Clientes" 
          value={`$${stats?.clientes_deuda_total}`} 
          icon={Users} 
          color="bg-blue-100 text-blue-600"
        />
        <StatCard 
          title="Productos Bajo Stock" 
          value={stats?.productos_bajo_stock} 
          icon={AlertTriangle} 
          color="bg-amber-100 text-amber-600"
        />
        <StatCard 
          title="Ventas del Mes" 
          value={`$${stats?.ventas_mes}`} 
          icon={Package} 
          color="bg-purple-100 text-purple-600"
        />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 bg-white p-6 rounded-xl shadow-sm border border-slate-100">
          <h3 className="font-bold text-lg mb-4">Productos Más Vendidos (7 días)</h3>
          <div className="space-y-4">
            {stats?.top_productos_semana?.map((item: any, idx: number) => (
              <div key={idx} className="flex items-center justify-between p-3 bg-slate-50 rounded-lg">
                <span className="text-sm font-medium text-slate-700">{item.producto__nombre}</span>
                <span className="text-sm font-bold text-slate-900">{item.cantidad} unidades</span>
              </div>
            ))}
          </div>
        </div>

        <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-100">
          <h3 className="font-bold text-lg mb-4">Métodos de Pago Hoy</h3>
          <div className="space-y-6">
            {stats?.metodos_pago_hoy?.map((item: any, idx: number) => (
              <div key={idx} className="space-y-2">
                <div className="flex justify-between text-sm">
                  <span className="text-slate-500 uppercase">{item.metodo_pago}</span>
                  <span className="font-bold">${item.total}</span>
                </div>
                <div className="w-full bg-slate-100 h-2 rounded-full overflow-hidden">
                  <div className="bg-primary-500 h-full" style={{ width: '65%' }}></div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};
