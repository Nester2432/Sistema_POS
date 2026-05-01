import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { X, Plus, Trash2, Settings2, Tag, Package } from 'lucide-react';
import toast from 'react-hot-toast';
import { variantesApi } from '../../api/variantes';
import type { Atributo, ProductoVariante } from '../../types/variantes';

interface VariantesModalProps {
  producto: any;
  onClose: () => void;
}

export const VariantesModal: React.FC<VariantesModalProps> = ({ producto, onClose }) => {
  const queryClient = useQueryClient();
  const [activeTab, setActiveTab] = useState<'variantes' | 'atributos'>('variantes');
  const [nuevoAtributo, setNuevoAtributo] = useState('');
  
  // Queries
  const { data: atributos = [] } = useQuery({
    queryKey: ['atributos'],
    queryFn: variantesApi.getAtributos
  });

  const { data: variantes = [] } = useQuery({
    queryKey: ['variantes', producto.id],
    queryFn: () => variantesApi.getVariantes(producto.id)
  });

  // Mutations
  const createAtribMutation = useMutation({
    mutationFn: (nombre: string) => variantesApi.createAtributo(nombre),
    onSuccess: () => {
      setNuevoAtributo('');
      queryClient.invalidateQueries({ queryKey: ['atributos'] });
      toast.success('Atributo creado');
    }
  });

  const createValorMutation = useMutation({
    mutationFn: ({ id, valor }: { id: string, valor: string }) => variantesApi.createValor(id, valor),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['atributos'] });
      toast.success('Valor añadido');
    }
  });

  const [nuevaVariante, setNuevaVariante] = useState({
    sku: '',
    precio_venta: '0',
    precio_costo: '0'
  });

  const createVarMutation = useMutation({
    mutationFn: (data: any) => variantesApi.createVariante({
      ...data,
      producto_padre: producto.id
    }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['variantes', producto.id] });
      toast.success('Variante creada');
      setNuevaVariante({ sku: '', precio_venta: '0', precio_costo: '0' });
    }
  });

  const handleAddValor = (atribId: string) => {
    const valor = prompt('Nombre del valor (ej: Rojo, XL, 128GB):');
    if (valor) {
      createValorMutation.mutate({ id: atribId, valor });
    }
  };

  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-slate-950/90 backdrop-blur-md">
      <div className="bg-slate-900 border border-white/10 w-full max-w-4xl rounded-3xl overflow-hidden shadow-2xl flex flex-col h-[85vh]">
        {/* Header */}
        <div className="p-6 border-b border-white/5 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 bg-white/5 rounded-2xl flex items-center justify-center">
              <Settings2 className="text-accent-500" size={24} />
            </div>
            <div>
              <h3 className="text-xl font-black text-white tracking-tight">Variantes: {producto.nombre}</h3>
              <p className="text-slate-500 text-xs font-bold tracking-tight uppercase">Configuración de atributos y stock específico</p>
            </div>
          </div>
          <button onClick={onClose} className="p-2 hover:bg-white/5 rounded-xl transition-colors">
            <X className="text-slate-500" />
          </button>
        </div>

        {/* Tabs */}
        <div className="flex px-6 border-b border-white/5">
          <button 
            onClick={() => setActiveTab('variantes')}
            className={`px-6 py-4 text-xs font-black uppercase tracking-widest border-b-2 transition-all ${activeTab === 'variantes' ? 'border-accent-500 text-accent-500' : 'border-transparent text-slate-500 hover:text-white'}`}
          >
            Lista de Variantes
          </button>
          <button 
            onClick={() => setActiveTab('atributos')}
            className={`px-6 py-4 text-xs font-black uppercase tracking-widest border-b-2 transition-all ${activeTab === 'atributos' ? 'border-accent-500 text-accent-500' : 'border-transparent text-slate-500 hover:text-white'}`}
          >
            Atributos Globales
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-6">
          {activeTab === 'atributos' ? (
            <div className="space-y-6">
              <div className="flex gap-4">
                <input 
                  type="text" 
                  value={nuevoAtributo}
                  onChange={(e) => setNuevoAtributo(e.target.value)}
                  placeholder="Nuevo atributo (ej: Talle, Color...)"
                  className="flex-1 bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white outline-none focus:border-accent-500/50"
                />
                <button 
                  onClick={() => nuevoAtributo && createAtribMutation.mutate(nuevoAtributo)}
                  className="px-6 bg-white text-slate-950 rounded-xl font-bold text-sm hover:bg-slate-200 transition-all flex items-center gap-2"
                >
                  <Plus size={18} />
                  CREAR
                </button>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {atributos.map((atrib: Atributo) => (
                  <div key={atrib.id} className="p-5 bg-white/5 border border-white/5 rounded-2xl">
                    <div className="flex items-center justify-between mb-4">
                      <h4 className="text-white font-black uppercase tracking-tight">{atrib.nombre}</h4>
                      <button onClick={() => handleAddValor(atrib.id)} className="p-1.5 bg-accent-500/10 text-accent-500 rounded-lg hover:bg-accent-500/20">
                        <Plus size={16} />
                      </button>
                    </div>
                    <div className="flex flex-wrap gap-2">
                      {atrib.valores.map(v => (
                        <span key={v.id} className="px-3 py-1 bg-slate-800 text-white text-xs font-bold rounded-lg border border-white/5">
                          {v.valor}
                        </span>
                      ))}
                      {atrib.valores.length === 0 && <span className="text-slate-600 text-xs italic">Sin valores definidos</span>}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ) : (
            <div className="space-y-6">
              {/* Formulario Nueva Variante Simplificado */}
              <div className="p-6 bg-accent-500/5 border border-accent-500/10 rounded-2xl">
                <h4 className="text-accent-500 font-black text-xs uppercase tracking-widest mb-4 flex items-center gap-2">
                  <Plus size={16} />
                  Crear Nueva Variante
                </h4>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <input 
                    type="text" 
                    placeholder="SKU"
                    value={nuevaVariante.sku}
                    onChange={(e) => setNuevaVariante({...nuevaVariante, sku: e.target.value})}
                    className="bg-slate-950 border border-white/10 rounded-xl px-4 py-2.5 text-white text-sm outline-none focus:border-accent-500"
                  />
                  <input 
                    type="number" 
                    placeholder="Precio Venta (0 = heredado)"
                    value={nuevaVariante.precio_venta}
                    onChange={(e) => setNuevaVariante({...nuevaVariante, precio_venta: e.target.value})}
                    className="bg-slate-950 border border-white/10 rounded-xl px-4 py-2.5 text-white text-sm outline-none focus:border-accent-500"
                  />
                  <button 
                    onClick={() => nuevaVariante.sku && createVarMutation.mutate(nuevaVariante)}
                    className="bg-accent-500 text-white rounded-xl font-bold text-sm hover:bg-accent-600 transition-all shadow-lg"
                  >
                    GUARDAR VARIANTE
                  </button>
                </div>
                <p className="text-[10px] text-slate-500 mt-3 italic">* Nota: Después de crear la variante, podrás asignar sus valores de atributos en la lista inferior.</p>
              </div>

              {/* Lista de Variantes */}
              <div className="space-y-3">
                {variantes.map((v: ProductoVariante) => (
                  <div key={v.id} className="flex items-center justify-between p-4 bg-white/5 border border-white/5 rounded-2xl group hover:bg-white/10 transition-all">
                    <div className="flex items-center gap-4">
                      <div className="w-10 h-10 bg-white/5 rounded-xl flex items-center justify-center">
                        <Tag className="text-slate-500" size={20} />
                      </div>
                      <div>
                        <p className="text-white font-bold text-sm tracking-tight">{v.nombre_completo || v.sku}</p>
                        <p className="text-[10px] text-slate-500 font-black uppercase tracking-widest">{v.sku}</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-6">
                      <div className="text-right">
                        <p className="text-[10px] text-slate-500 font-black uppercase tracking-widest leading-none mb-1">Precio</p>
                        <p className="text-white font-black tracking-tight text-sm">${Number(v.precio_venta) > 0 ? v.precio_venta : producto.precio_venta}</p>
                      </div>
                      <button className="p-2 text-slate-500 hover:text-red-500 transition-colors">
                        <Trash2 size={18} />
                      </button>
                    </div>
                  </div>
                ))}
                {variantes.length === 0 && (
                  <div className="py-12 text-center">
                    <Package className="mx-auto text-slate-700 mb-4" size={48} />
                    <p className="text-slate-500 font-bold tracking-tight">No hay variantes configuradas aún</p>
                  </div>
                )}
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="p-6 bg-white/5 border-t border-white/5 flex justify-end">
          <button 
            onClick={onClose}
            className="px-10 py-3 bg-white text-slate-950 rounded-2xl font-black text-sm hover:bg-slate-200 transition-all shadow-xl active:scale-95"
          >
            LISTO
          </button>
        </div>
      </div>
    </div>
  );
};
