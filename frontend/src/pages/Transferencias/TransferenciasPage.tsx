import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Link } from 'react-router-dom';
import { Plus, ArrowRightLeft, CheckCircle2, XCircle, Clock } from 'lucide-react';
import toast from 'react-hot-toast';
import { transferenciasApi } from '../../api/transferencias';
import { Transferencia, EstadoTransferencia } from '../../types/transferencias';
import dayjs from 'dayjs';

const getEstadoBadge = (estado: EstadoTransferencia) => {
  switch (estado) {
    case 'CONFIRMADA':
      return <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-medium bg-emerald-500/10 text-emerald-400 border border-emerald-500/20"><CheckCircle2 size={12} /> Confirmada</span>;
    case 'CANCELADA':
      return <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-medium bg-rose-500/10 text-rose-400 border border-rose-500/20"><XCircle size={12} /> Cancelada</span>;
    default:
      return <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-medium bg-amber-500/10 text-amber-400 border border-amber-500/20"><Clock size={12} /> Borrador</span>;
  }
};

export const TransferenciasPage = () => {
  const queryClient = useQueryClient();

  const { data: transferencias, isLoading } = useQuery({
    queryKey: ['transferencias'],
    queryFn: transferenciasApi.getAll
  });

  const confirmarMutation = useMutation({
    mutationFn: transferenciasApi.confirmar,
    onSuccess: () => {
      toast.success('Transferencia confirmada y stock movido exitosamente.');
      queryClient.invalidateQueries({ queryKey: ['transferencias'] });
      // Invalidar inventario global
      queryClient.invalidateQueries({ queryKey: ['productos'] });
    },
    onError: (error: any) => {
      const msg = error.response?.data?.error || 'Error al confirmar transferencia';
      toast.error(typeof msg === 'string' ? msg : JSON.stringify(msg));
    }
  });

  const cancelarMutation = useMutation({
    mutationFn: transferenciasApi.cancelar,
    onSuccess: () => {
      toast.success('Transferencia cancelada.');
      queryClient.invalidateQueries({ queryKey: ['transferencias'] });
    },
    onError: (error: any) => {
      toast.error('Error al cancelar la transferencia.');
    }
  });

  if (isLoading) {
    return <div className="p-8 text-center text-slate-400 animate-pulse">Cargando transferencias...</div>;
  }

  return (
    <div className="p-8 max-w-7xl mx-auto space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-white flex items-center gap-2">
            <ArrowRightLeft className="text-accent-500" />
            Transferencias de Stock
          </h1>
          <p className="text-slate-400 mt-1">Gestiona los movimientos internos de mercadería entre sucursales.</p>
        </div>
        
        <Link 
          to="/app/transferencias/nueva" 
          className="flex items-center gap-2 bg-accent-600 hover:bg-accent-500 text-white px-5 py-2.5 rounded-xl font-medium transition-all shadow-lg shadow-accent-500/20"
        >
          <Plus size={20} />
          <span>Nueva Transferencia</span>
        </Link>
      </div>

      <div className="bg-slate-900 border border-white/5 rounded-2xl overflow-hidden shadow-xl">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="border-b border-white/5 bg-slate-800/50">
                <th className="p-4 text-xs font-semibold text-slate-400 uppercase tracking-wider">Número</th>
                <th className="p-4 text-xs font-semibold text-slate-400 uppercase tracking-wider">Fecha</th>
                <th className="p-4 text-xs font-semibold text-slate-400 uppercase tracking-wider">Origen</th>
                <th className="p-4 text-xs font-semibold text-slate-400 uppercase tracking-wider">Destino</th>
                <th className="p-4 text-xs font-semibold text-slate-400 uppercase tracking-wider">Estado</th>
                <th className="p-4 text-xs font-semibold text-slate-400 uppercase tracking-wider text-right">Acciones</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/5">
              {transferencias?.length === 0 ? (
                <tr>
                  <td colSpan={6} className="p-8 text-center text-slate-500">No hay transferencias registradas.</td>
                </tr>
              ) : (
                transferencias?.map((trans: Transferencia) => (
                  <tr key={trans.id} className="hover:bg-white/[0.02] transition-colors">
                    <td className="p-4">
                      <span className="font-medium text-white">{trans.numero_transferencia || 'Sin Número'}</span>
                    </td>
                    <td className="p-4 text-sm text-slate-300">
                      {dayjs(trans.fecha).format('DD/MM/YYYY HH:mm')}
                    </td>
                    <td className="p-4 text-sm font-medium text-slate-300">
                      {trans.sucursal_origen_nombre}
                    </td>
                    <td className="p-4 text-sm font-medium text-slate-300">
                      {trans.sucursal_destino_nombre}
                    </td>
                    <td className="p-4">
                      {getEstadoBadge(trans.estado)}
                    </td>
                    <td className="p-4 text-right space-x-3">
                      {trans.estado === 'BORRADOR' && (
                        <>
                          <button 
                            onClick={() => confirmarMutation.mutate(trans.id)}
                            disabled={confirmarMutation.isPending}
                            className="text-emerald-400 hover:text-emerald-300 font-medium text-sm transition-colors"
                          >
                            Confirmar
                          </button>
                          <button 
                            onClick={() => cancelarMutation.mutate(trans.id)}
                            disabled={cancelarMutation.isPending}
                            className="text-rose-400 hover:text-rose-300 font-medium text-sm transition-colors"
                          >
                            Cancelar
                          </button>
                        </>
                      )}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
