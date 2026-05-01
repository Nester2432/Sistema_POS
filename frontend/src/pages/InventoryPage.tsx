import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import api from '../api/axios';
import { Modal } from '../components/Modal';
import { ProductForm } from '../components/ProductForm';
import { 
  Plus, 
  Search, 
  Filter, 
  Download, 
  Edit, 
  Trash2, 
  AlertCircle,
  Package,
  Layers
} from 'lucide-react';
import { VariantesModal } from './Inventario/VariantesModal';

export const InventoryPage = () => {
  const [searchTerm, setSearchTerm] = useState('');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedProduct, setSelectedProduct] = useState<any>(null);
  const [isVariantesOpen, setIsVariantesOpen] = useState(false);
  const [variantProduct, setVariantProduct] = useState<any>(null);
  
  const { data, isLoading } = useQuery({
    queryKey: ['productos', searchTerm],
    queryFn: async () => {
      const response = await api.get(`/inventario/productos/?search=${searchTerm}`);
      return response.data.data || response.data;
    }
  });

  const products = data?.results || (Array.isArray(data) ? data : []);

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold text-white tracking-tight">Inventario Global</h2>
          <p className="text-slate-500 text-sm font-medium mt-0.5">Control de stock y valorización de mercadería</p>
        </div>
        <div className="flex gap-3">
          <button className="flex items-center gap-2 px-4 py-2 bg-white/5 border border-white/10 text-slate-300 rounded-xl text-xs font-semibold hover:bg-white/10 transition-all">
            <Download size={16} />
            Exportar
          </button>
          <button 
            onClick={() => { setSelectedProduct(null); setIsModalOpen(true); }}
            className="flex items-center gap-2 px-5 py-2 bg-white text-slate-950 rounded-xl text-xs font-bold hover:bg-slate-200 transition-all shadow-lg active:scale-[0.98]"
          >
            <Plus size={16} />
            Nuevo Producto
          </button>
        </div>
      </div>

      <div className="bg-white/5 backdrop-blur-md p-4 rounded-2xl border border-white/5 shadow-xl flex flex-col md:flex-row gap-4">
        <div className="relative flex-1 group">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-500 group-focus-within:text-accent-500 transition-colors" size={18} />
          <input 
            type="text" 
            placeholder="Buscar por nombre, SKU o código..." 
            className="w-full pl-11 pr-4 py-2.5 bg-slate-900/50 border border-white/5 focus:border-accent-500/50 rounded-xl text-white placeholder:text-slate-600 outline-none transition-all text-sm font-medium"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
        <button className="px-5 py-2.5 bg-white/5 border border-white/5 text-slate-400 rounded-xl flex items-center gap-2 hover:bg-white/10 transition-all font-bold text-xs">
          <Filter size={16} />
          CATEGORÍAS
        </button>
      </div>

      <div className="bg-white/5 backdrop-blur-md rounded-2xl border border-white/5 shadow-xl overflow-hidden">
        <table className="w-full text-left">
          <thead>
            <tr className="border-b border-white/5 bg-white/[0.02]">
              <th className="px-6 py-4 text-[10px] font-bold text-slate-500 uppercase tracking-widest">Producto</th>
              <th className="px-6 py-4 text-[10px] font-bold text-slate-500 uppercase tracking-widest">SKU</th>
              <th className="px-6 py-4 text-[10px] font-bold text-slate-500 uppercase tracking-widest">Categoría</th>
              <th className="px-6 py-4 text-[10px] font-bold text-slate-500 uppercase tracking-widest">Stock</th>
              <th className="px-6 py-4 text-[10px] font-bold text-slate-500 uppercase tracking-widest">Precio</th>
              <th className="px-6 py-4 text-[10px] font-bold text-slate-500 uppercase tracking-widest text-right">Acciones</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-white/5">
            {isLoading ? (
              <tr><td colSpan={6} className="px-6 py-12 text-center text-slate-500 font-medium">Cargando productos...</td></tr>
            ) : products.length === 0 ? (
              <tr><td colSpan={6} className="px-6 py-12 text-center text-slate-500 font-medium italic">No se encontraron productos en el inventario</td></tr>
            ) : products.map((product: any) => (
              <tr key={product.id} className="hover:bg-white/[0.02] transition-colors group">
                <td className="px-6 py-4">
                  <div className="flex items-center gap-3">
                    <div className="h-10 w-10 bg-slate-800 rounded-lg flex items-center justify-center text-slate-500 group-hover:text-accent-500 transition-colors border border-white/5">
                      <Package size={20} />
                    </div>
                    <div>
                      <p className="font-bold text-white text-sm tracking-tight leading-none mb-1">{product.nombre}</p>
                      <p className="text-[10px] text-slate-500 font-medium uppercase tracking-widest">{product.codigo_barras || 'N/A'}</p>
                    </div>
                  </div>
                </td>
                <td className="px-6 py-4 text-xs font-medium text-slate-400">{product.sku}</td>
                <td className="px-6 py-4">
                  <span className="px-2 py-0.5 bg-white/5 text-slate-400 text-[10px] font-bold rounded-md border border-white/5">
                    {product.categoria_nombre || 'General'}
                  </span>
                </td>
                <td className="px-6 py-4">
                  <div className="flex items-center gap-2">
                    <span className={`text-sm font-bold ${product.stock_actual <= product.stock_minimo ? 'text-rose-500' : 'text-slate-200'}`}>
                      {product.stock_actual}
                    </span>
                    {product.stock_actual <= product.stock_minimo && (
                      <AlertCircle size={14} className="text-rose-500 animate-pulse" />
                    )}
                  </div>
                </td>
                <td className="px-6 py-4">
                  <p className="text-sm font-bold text-white">${Number(product.precio_venta).toLocaleString()}</p>
                  <p className="text-[10px] text-slate-500 font-medium">Costo: ${Number(product.precio_costo).toLocaleString()}</p>
                </td>
                <td className="px-6 py-4 text-right">
                  <div className="flex justify-end gap-2">
                    <button 
                      onClick={() => { setVariantProduct(product); setIsVariantesOpen(true); }}
                      className="p-2 text-slate-500 hover:text-accent-500 hover:bg-accent-500/10 rounded-lg transition-all"
                      title="Gestionar Variantes"
                    >
                      <Layers size={18} />
                    </button>
                    <button 
                      onClick={() => { setSelectedProduct(product); setIsModalOpen(true); }}
                      className="p-2 text-slate-500 hover:text-white hover:bg-white/10 rounded-lg transition-all"
                    >
                      <Edit size={18} />
                    </button>
                    <button className="p-2 text-slate-500 hover:text-red-500 hover:bg-red-500/10 rounded-lg transition-all">
                      <Trash2 size={18} />
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {isVariantesOpen && variantProduct && (
        <VariantesModal 
          producto={variantProduct}
          onClose={() => { setIsVariantesOpen(false); setVariantProduct(null); }}
        />
      )}

      <Modal 
        isOpen={isModalOpen} 
        onClose={() => setIsModalOpen(false)} 
        title={selectedProduct ? 'Editar Producto' : 'Nuevo Producto'}
      >
        <ProductForm 
          initialData={selectedProduct} 
          onSuccess={() => setIsModalOpen(false)} 
        />
      </Modal>
    </div>
  );
};
