import React from 'react';
import { useQuery } from '@tanstack/react-query';
import { X, Package, Tag, Info } from 'lucide-react';
import { variantesApi } from '../../api/variantes';
import type { ProductoVariante } from '../../types/variantes';

interface VarianteSelectorModalProps {
  producto: any;
  onSelect: (variante: ProductoVariante) => void;
  onClose: () => void;
}

export const VarianteSelectorModal: React.FC<VarianteSelectorModalProps> = ({ 
  producto, 
  onSelect, 
  onClose 
}) => {
  const { data: variantes = [], isLoading } = useQuery({
    queryKey: ['variantes', producto.id],
    queryFn: () => variantesApi.getVariantes(producto.id)
  });

  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="bg-slate-900 border border-white/10 w-full max-w-2xl rounded-3xl overflow-hidden shadow-2xl shadow-black/50 animate-in zoom-in-95 duration-200">
        <div className="p-6 border-b border-white/5 flex items-center justify-between bg-gradient-to-r from-white/5 to-transparent">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 bg-white/5 rounded-2xl flex items-center justify-center">
              <Package className="text-white" size={24} />
            </div>
            <div>
              <h3 className="text-xl font-black text-white tracking-tight">{producto.nombre}</h3>
              <p className="text-slate-500 text-sm font-bold tracking-tight uppercase">Seleccione una variante para continuar</p>
            </div>
          </div>
          <button 
            onClick={onClose}
            className="w-10 h-10 flex items-center justify-center rounded-xl bg-white/5 text-slate-400 hover:text-white hover:bg-white/10 transition-colors"
          >
            <X size={20} />
          </button>
        </div>

        <div className="p-6 max-h-[60vh] overflow-y-auto">
          {isLoading ? (
            <div className="flex flex-col items-center justify-center py-12 gap-4">
              <div className="w-12 h-12 border-4 border-white/10 border-t-white rounded-full animate-spin"></div>
              <p className="text-slate-500 font-bold tracking-tight">Cargando variantes...</p>
            </div>
          ) : variantes.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-12 text-center">
              <div className="w-16 h-16 bg-red-500/10 text-red-500 rounded-full flex items-center justify-center mb-4">
                <Info size={32} />
              </div>
              <h4 className="text-white font-bold text-lg mb-1">No hay variantes disponibles</h4>
              <p className="text-slate-500 max-w-xs">Este producto está marcado con variantes pero no tiene ninguna configurada o activa.</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {variantes.map((v) => (
                <button
                  key={v.id}
                  onClick={() => onSelect(v)}
                  className="group relative flex flex-col p-5 bg-white/5 border border-white/5 rounded-2xl text-left hover:bg-white/10 hover:border-white/20 transition-all active:scale-[0.98]"
                >
                  <div className="flex items-center justify-between mb-3">
                    <span className="text-xs font-black text-slate-500 uppercase tracking-widest">{v.sku}</span>
                    <Tag size={16} className="text-slate-500 group-hover:text-white transition-colors" />
                  </div>
                  
                  <div className="mb-4">
                    <h4 className="text-white font-bold text-lg leading-tight mb-1">
                      {v.valores_detalle.map(vd => vd.valor_nombre).join(' / ')}
                    </h4>
                    <div className="flex flex-wrap gap-2">
                      {v.valores_detalle.map(vd => (
                        <span key={vd.id} className="px-2 py-0.5 bg-white/10 rounded text-[10px] font-black text-white uppercase tracking-tighter">
                          {vd.atributo_nombre}: {vd.valor_nombre}
                        </span>
                      ))}
                    </div>
                  </div>

                  <div className="mt-auto flex items-end justify-between">
                    <div>
                      <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest leading-none mb-1">Precio</p>
                      <p className="text-xl font-black text-white tabular-nums tracking-tighter">
                        ${Number(v.precio_venta) > 0 ? Number(v.precio_venta).toLocaleString() : Number(producto.precio_venta).toLocaleString()}
                      </p>
                    </div>
                    {/* El stock debería venir del backend filtrado por sucursal, por ahora placeholder */}
                    <div className="text-right">
                      <span className="text-[10px] font-black text-green-500 uppercase tracking-widest bg-green-500/10 px-2 py-1 rounded">
                        Disponible
                      </span>
                    </div>
                  </div>
                </button>
              ))}
            </div>
          )}
        </div>
        
        <div className="p-6 bg-white/5 border-t border-white/5 flex justify-end">
          <button 
            onClick={onClose}
            className="px-8 py-3 text-sm font-black text-white hover:text-slate-400 transition-colors uppercase tracking-widest"
          >
            Cancelar
          </button>
        </div>
      </div>
    </div>
  );
};
