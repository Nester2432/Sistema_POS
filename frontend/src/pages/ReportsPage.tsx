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
    <div className="space-y-8">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold text-slate-900 tracking-tight">Reportes & Estadísticas</h2>
          <p className="text-slate-500">Análisis detallado de rendimiento y rentabilidad</p>
        </div>
        <div className="flex items-center gap-3 bg-white p-2 rounded-2xl border shadow-sm">
          <div className="flex items-center gap-2 px-3">
            <Calendar size={16} className="text-slate-400" />
            <input 
              type="date" 
              className="text-sm font-bold outline-none bg-transparent"
              value={dateRange.inicio}
              onChange={e => setDateRange({...dateRange, inicio: e.target.value})}
            />
          </div>
          <ArrowRight size={16} className="text-slate-300" />
          <div className="flex items-center gap-2 px-3">
            <input 
              type="date" 
              className="text-sm font-bold outline-none bg-transparent"
              value={dateRange.fin}
              onChange={e => setDateRange({...dateRange, fin: e.target.value})}
            />
          </div>
        </div>
      </div>

      {/* KPIs de Ventas */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-gradient-to-br from-primary-600 to-primary-700 p-6 rounded-[2rem] text-white shadow-xl shadow-primary-100">
          <div className="flex items-center gap-3 mb-4 opacity-80">
            <TrendingUp size={20} />
            <span className="text-xs font-bold uppercase tracking-widest">Recaudación Total</span>
          </div>
          <p className="text-4xl font-black font-mono">${Number(reporte?.stats?.total_recaudado || 0).toLocaleString()}</p>
          <p className="mt-2 text-primary-100 text-sm">{reporte?.stats?.cantidad_ventas} ventas en el período</p>
        </div>

        <div className="bg-white p-6 rounded-[2rem] border border-slate-100 shadow-sm">
          <div className="flex items-center gap-3 mb-4 text-slate-400">
            <BarChart3 size={20} />
            <span className="text-xs font-bold uppercase tracking-widest">Ticket Promedio</span>
          </div>
          <p className="text-4xl font-black font-mono text-slate-900">${Number(reporte?.stats?.promedio_ticket || 0).toFixed(2)}</p>
          <p className="mt-2 text-slate-500 text-sm">Gasto medio por cliente</p>
        </div>

        <div className="bg-white p-6 rounded-[2rem] border border-slate-100 shadow-sm">
          <div className="flex items-center gap-3 mb-4 text-slate-400">
            <Package size={20} />
            <span className="text-xs font-bold uppercase tracking-widest">Valor de Inventario</span>
          </div>
          <p className="text-4xl font-black font-mono text-slate-900">${Number(inventario?.valor_inventario_venta || 0).toLocaleString()}</p>
          <p className="mt-2 text-slate-500 text-sm">A precio de venta actual</p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Desglose de Pagos */}
        <div className="bg-white p-8 rounded-[2rem] border border-slate-100 shadow-sm">
          <div className="flex items-center justify-between mb-8">
            <div className="flex items-center gap-3">
              <PieChart className="text-primary-600" />
              <h3 className="text-xl font-bold text-slate-900">Métodos de Pago</h3>
            </div>
            <button className="p-2 text-slate-400 hover:text-primary-600 transition-colors">
              <Download size={20} />
            </button>
          </div>
          <div className="space-y-6">
            {reporte?.desglose_pago?.map((m: any, idx: number) => (
              <div key={idx} className="group">
                <div className="flex justify-between mb-2">
                  <span className="font-bold text-slate-700">{m.metodo_pago.replace('_', ' ')}</span>
                  <span className="font-mono font-bold text-slate-900">${Number(m.total).toLocaleString()}</span>
                </div>
                <div className="w-full bg-slate-50 h-3 rounded-full overflow-hidden">
                  <div 
                    className="bg-primary-500 h-full transition-all duration-1000 group-hover:bg-primary-600" 
                    style={{ width: `${(m.total / reporte?.stats?.total_recaudado) * 100}%` }}
                  ></div>
                </div>
                <p className="text-[10px] text-slate-400 mt-1 uppercase font-bold">{m.cant} transacciones</p>
              </div>
            ))}
          </div>
        </div>

        {/* Salud de Inventario */}
        <div className="bg-white p-8 rounded-[2rem] border border-slate-100 shadow-sm">
          <div className="flex items-center gap-3 mb-8">
            <DollarSign className="text-emerald-600" />
            <h3 className="text-xl font-bold text-slate-900">Valorización de Stock</h3>
          </div>
          <div className="grid grid-cols-2 gap-6 mb-8">
            <div className="p-6 bg-slate-50 rounded-2xl">
              <p className="text-xs font-bold text-slate-400 uppercase mb-1">Costo de Reposición</p>
              <p className="text-2xl font-black text-slate-700">${Number(inventario?.valor_inventario_costo || 0).toLocaleString()}</p>
            </div>
            <div className="p-6 bg-emerald-50 rounded-2xl">
              <p className="text-xs font-bold text-emerald-600 uppercase mb-1">Ganancia Estimada</p>
              <p className="text-2xl font-black text-emerald-700">
                ${(Number(inventario?.valor_inventario_venta || 0) - Number(inventario?.valor_inventario_costo || 0)).toLocaleString()}
              </p>
            </div>
          </div>
          
          <div className="space-y-4">
            <h4 className="text-sm font-bold text-slate-900 flex items-center gap-2">
              <span className="w-2 h-2 bg-rose-500 rounded-full animate-pulse"></span>
              Productos con Stock Crítico
            </h4>
            <div className="divide-y border-t border-b max-h-48 overflow-auto">
              {inventario?.lista_bajo_stock?.map((prod: any, idx: number) => (
                <div key={idx} className="py-3 flex justify-between items-center">
                  <div>
                    <p className="text-sm font-bold text-slate-800">{prod.nombre}</p>
                    <p className="text-xs text-slate-400">SKU: {prod.sku}</p>
                  </div>
                  <div className="text-right">
                    <p className="text-sm font-black text-rose-600">{prod.stock_actual} unid.</p>
                    <p className="text-[10px] text-slate-400 uppercase font-bold">Min: {prod.stock_minimo}</p>
                  </div>
                </div>
              ))}
              {inventario?.lista_bajo_stock?.length === 0 && (
                <p className="py-4 text-center text-slate-400 text-sm">No hay productos con stock bajo</p>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
