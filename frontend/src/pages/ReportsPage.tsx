import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import api from '../api/axios';
import { 
  BarChart3, 
  TrendingUp, 
  Calendar, 
  Download, 
  DollarSign, 
  Package, 
  PieChart,
  ArrowRight
} from 'lucide-react';

export const ReportsPage = () => {
  const [dateRange, setDateRange] = useState({
    inicio: new Date(new Date().setDate(new Date().getDate() - 30)).toISOString().split('T')[0],
    fin: new Date().toISOString().split('T')[0]
  });

  const { data: reporte, isLoading } = useQuery({
    queryKey: ['reporte-ventas', dateRange],
    queryFn: async () => {
      const res = await api.get(`/reportes/ventas/?fecha_inicio=${dateRange.inicio}&fecha_fin=${dateRange.fin}`);
      return res.data.data;
    }
  });

  const { data: inventario } = useQuery({
    queryKey: ['reporte-inventario'],
    queryFn: async () => {
      const res = await api.get('/reportes/inventario/');
      return res.data.data;
    }
  });

  if (isLoading) return <div className="p-8 text-center text-slate-400">Generando reportes...</div>;

  return (
    <div className="space-y-10">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 mb-12">
        <div>
          <h2 className="text-4xl font-black text-white tracking-tighter uppercase tracking-tight">Centro Analítico</h2>
          <p className="text-slate-500 font-bold tracking-tight mt-1">Monitoreo en tiempo real de rendimiento y rentabilidad</p>
        </div>
        <div className="flex items-center gap-3 bg-white/5 backdrop-blur-md p-3 rounded-[1.5rem] border border-white/5 shadow-2xl">
          <div className="flex items-center gap-3 px-3">
            <Calendar size={18} className="text-primary-400" />
            <input 
              type="date" 
              className="text-xs font-black outline-none bg-transparent text-white uppercase tracking-widest"
              value={dateRange.inicio}
              onChange={e => setDateRange({...dateRange, inicio: e.target.value})}
            />
          </div>
          <ArrowRight size={16} className="text-slate-700" />
          <div className="flex items-center gap-3 px-3">
            <input 
              type="date" 
              className="text-xs font-black outline-none bg-transparent text-white uppercase tracking-widest"
              value={dateRange.fin}
              onChange={e => setDateRange({...dateRange, fin: e.target.value})}
            />
          </div>
        </div>
      </div>

      {/* KPIs de Ventas */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
        <div className="bg-gradient-to-br from-primary-600 to-blue-700 p-8 rounded-[3rem] text-white shadow-2xl shadow-primary-500/10 relative overflow-hidden group">
          <div className="absolute top-0 right-0 w-32 h-32 bg-white/10 rounded-full -mr-16 -mt-16 blur-3xl transition-transform group-hover:scale-150 duration-700"></div>
          <div className="flex items-center gap-3 mb-6 opacity-70 relative z-10">
            <TrendingUp size={24} />
            <span className="text-[10px] font-black uppercase tracking-[0.2em]">Recaudación Bruta</span>
          </div>
          <p className="text-5xl font-black tracking-tighter relative z-10">${Number(reporte?.stats?.total_recaudado || 0).toLocaleString()}</p>
          <div className="mt-6 flex items-center justify-between relative z-10 border-t border-white/10 pt-4">
            <p className="text-primary-100 text-xs font-bold uppercase tracking-widest">{reporte?.stats?.cantidad_ventas} OPERACIONES</p>
            <BarChart3 size={16} className="opacity-50" />
          </div>
        </div>

        <div className="bg-white/5 backdrop-blur-md p-8 rounded-[3rem] border border-white/5 shadow-2xl group transition-all hover:bg-white/10">
          <div className="flex items-center gap-3 mb-6 text-slate-500">
            <DollarSign size={24} />
            <span className="text-[10px] font-black uppercase tracking-[0.2em]">Ticket Promedio</span>
          </div>
          <p className="text-5xl font-black text-white tracking-tighter">${Number(reporte?.stats?.promedio_ticket || 0).toFixed(2)}</p>
          <p className="mt-6 text-slate-600 text-xs font-bold uppercase tracking-widest border-t border-white/5 pt-4">Inversión media por cliente</p>
        </div>

        <div className="bg-white/5 backdrop-blur-md p-8 rounded-[3rem] border border-white/5 shadow-2xl group transition-all hover:bg-white/10">
          <div className="flex items-center gap-3 mb-6 text-slate-500">
            <Package size={24} />
            <span className="text-[10px] font-black uppercase tracking-[0.2em]">Valor Activos</span>
          </div>
          <p className="text-5xl font-black text-white tracking-tighter">${Number(inventario?.valor_inventario_venta || 0).toLocaleString()}</p>
          <p className="mt-6 text-slate-600 text-xs font-bold uppercase tracking-widest border-t border-white/5 pt-4">Stock total a precio venta</p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-10">
        {/* Desglose de Pagos */}
        <div className="bg-white/5 backdrop-blur-md p-10 rounded-[3rem] border border-white/5 shadow-2xl">
          <div className="flex items-center justify-between mb-10">
            <div className="flex items-center gap-4">
              <div className="p-3 bg-primary-500/10 text-primary-400 rounded-2xl">
                <PieChart size={24} />
              </div>
              <h3 className="text-2xl font-black text-white tracking-tighter uppercase tracking-widest text-xs opacity-50">Distribución de Ingresos</h3>
            </div>
            <button className="p-3 text-slate-600 hover:text-white hover:bg-white/5 rounded-2xl transition-all">
              <Download size={24} />
            </button>
          </div>
          <div className="space-y-8">
            {reporte?.desglose_pago?.map((m: any, idx: number) => (
              <div key={idx} className="group">
                <div className="flex justify-between mb-3">
                  <span className="font-black text-slate-400 text-xs uppercase tracking-widest">{m.metodo_pago.replace('_', ' ')}</span>
                  <span className="font-black text-white tracking-tighter text-xl">${Number(m.total).toLocaleString()}</span>
                </div>
                <div className="w-full bg-white/5 h-4 rounded-full overflow-hidden p-1 border border-white/5">
                  <div 
                    className="bg-primary-500 h-full rounded-full transition-all duration-1000 shadow-[0_0_15px_rgba(6,182,212,0.4)]" 
                    style={{ width: `${(m.total / reporte?.stats?.total_recaudado) * 100}%` }}
                  ></div>
                </div>
                <p className="text-[10px] text-slate-600 mt-2 uppercase font-black tracking-[0.2em]">{m.cant} TRANSACCIONES</p>
              </div>
            ))}
          </div>
        </div>

        {/* Salud de Inventario */}
        <div className="bg-white/5 backdrop-blur-md p-10 rounded-[3rem] border border-white/5 shadow-2xl">
          <div className="flex items-center gap-4 mb-10">
            <div className="p-3 bg-emerald-500/10 text-emerald-400 rounded-2xl">
              <DollarSign size={24} />
            </div>
            <h3 className="text-2xl font-black text-white tracking-tighter uppercase tracking-widest text-xs opacity-50">Análisis de Capital</h3>
          </div>
          
          <div className="grid grid-cols-2 gap-6 mb-10">
            <div className="p-8 bg-slate-900 border border-white/5 rounded-[2rem] relative overflow-hidden">
              <div className="absolute top-0 right-0 w-16 h-16 bg-white/5 rounded-full -mr-8 -mt-8 blur-2xl"></div>
              <p className="text-[10px] font-black text-slate-600 uppercase tracking-widest mb-2 relative z-10">Costo de Reposición</p>
              <p className="text-3xl font-black text-white tracking-tighter relative z-10">${Number(inventario?.valor_inventario_costo || 0).toLocaleString()}</p>
            </div>
            <div className="p-8 bg-emerald-500/10 border border-emerald-500/20 rounded-[2rem] relative overflow-hidden">
              <div className="absolute top-0 right-0 w-16 h-16 bg-emerald-500/10 rounded-full -mr-8 -mt-8 blur-2xl"></div>
              <p className="text-[10px] font-black text-emerald-500 uppercase tracking-widest mb-2 relative z-10">Utilidad Bruta Est.</p>
              <p className="text-3xl font-black text-emerald-400 tracking-tighter relative z-10">
                ${(Number(inventario?.valor_inventario_venta || 0) - Number(inventario?.valor_inventario_costo || 0)).toLocaleString()}
              </p>
            </div>
          </div>
          
          <div className="space-y-6">
            <div className="flex items-center justify-between mb-4">
              <h4 className="text-xs font-black text-slate-500 uppercase tracking-[0.2em] flex items-center gap-2">
                <span className="w-2 h-2 bg-rose-500 rounded-full animate-ping"></span>
                Alerta Stock Crítico
              </h4>
              <span className="px-3 py-1 bg-rose-500/20 text-rose-400 text-[10px] font-black rounded-lg border border-rose-500/20 uppercase tracking-widest">
                {inventario?.lista_bajo_stock?.length || 0} ITEMS
              </span>
            </div>
            <div className="space-y-3 max-h-56 overflow-auto pr-2 custom-scrollbar">
              {inventario?.lista_bajo_stock?.map((prod: any, idx: number) => (
                <div key={idx} className="p-4 bg-white/5 rounded-2xl border border-white/5 flex justify-between items-center group hover:bg-white/[0.08] transition-all">
                  <div>
                    <p className="text-sm font-black text-white tracking-tight">{prod.nombre}</p>
                    <p className="text-[10px] text-slate-600 font-black uppercase tracking-widest mt-1">SKU: {prod.sku}</p>
                  </div>
                  <div className="text-right">
                    <p className="text-lg font-black text-rose-400 tracking-tighter">{prod.stock_actual} UNID.</p>
                    <p className="text-[10px] text-slate-600 uppercase font-black tracking-widest">MIN: {prod.stock_minimo}</p>
                  </div>
                </div>
              ))}
              {inventario?.lista_bajo_stock?.length === 0 && (
                <div className="py-8 text-center bg-white/5 rounded-[2rem] border border-dashed border-white/10">
                  <p className="text-slate-600 text-xs font-black uppercase tracking-widest">No se detectaron faltantes</p>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
