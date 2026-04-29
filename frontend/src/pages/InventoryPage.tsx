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
  Package
} from 'lucide-react';

export const InventoryPage = () => {
  const [searchTerm, setSearchTerm] = useState('');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedProduct, setSelectedProduct] = useState<any>(null);
  
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
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 mb-12">
        <div>
          <h2 className="text-4xl font-black text-white tracking-tighter uppercase tracking-tight">Inventario Global</h2>
          <p className="text-slate-500 font-bold tracking-tight mt-1">Control total de stock y valorización de mercadería</p>
        </div>
        <div className="flex gap-4">
          <button className="flex items-center gap-2 px-6 py-3.5 bg-white/5 border border-white/5 text-slate-400 rounded-2xl text-sm font-black hover:bg-white/10 transition-all active:scale-95">
            <Download size={18} />
            EXPORTAR EXCEL
          </button>
          <button 
            onClick={() => { setSelectedProduct(null); setIsModalOpen(true); }}
            className="flex items-center gap-2 px-6 py-3.5 bg-white text-slate-950 rounded-2xl text-sm font-black hover:bg-slate-200 transition-all shadow-xl shadow-white/5 active:scale-95 group"
          >
            <Plus size={18} className="text-primary-600 group-hover:rotate-90 transition-transform" />
            <span>NUEVO PRODUCTO</span>
          </button>
        </div>
      </div>

      {/* Filtros */}
      <div className="bg-white/5 backdrop-blur-md p-6 rounded-[2rem] border border-white/5 shadow-2xl mb-8 flex flex-col md:flex-row gap-6">
        <div className="relative flex-1 group">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-600 group-focus-within:text-primary-400 transition-colors" size={20} />
          <input 
            type="text" 
            placeholder="Buscar por nombre, SKU o código de barras..." 
            className="w-full pl-12 pr-4 py-4 bg-white/5 border border-white/5 focus:bg-white/10 focus:border-primary-500/50 rounded-2xl text-white placeholder:text-slate-600 outline-none transition-all font-medium"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
        <button className="px-6 py-4 bg-white/5 border border-white/5 text-slate-400 rounded-2xl flex items-center gap-2 hover:bg-white/10 transition-all font-black text-xs tracking-widest">
          <Filter size={18} />
          CATEGORÍAS
        </button>
      </div>

      {/* Tabla */}
      <div className="bg-white/5 backdrop-blur-md rounded-[2.5rem] border border-white/5 shadow-2xl overflow-hidden">
        <table className="w-full text-left">
          <thead>
            <tr className="border-b border-white/5 bg-white/[0.02]">
              <th className="px-8 py-6 text-[10px] font-black text-slate-500 uppercase tracking-[0.2em]">Producto</th>
              <th className="px-8 py-6 text-[10px] font-black text-slate-500 uppercase tracking-[0.2em]">SKU</th>
              <th className="px-8 py-6 text-[10px] font-black text-slate-500 uppercase tracking-[0.2em]">Categoría</th>
              <th className="px-8 py-6 text-[10px] font-black text-slate-500 uppercase tracking-[0.2em]">Stock</th>
              <th className="px-8 py-6 text-[10px] font-black text-slate-500 uppercase tracking-[0.2em]">Precio</th>
              <th className="px-8 py-6 text-[10px] font-black text-slate-500 uppercase tracking-[0.2em] text-right">Acciones</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-white/5">
            {isLoading ? (
              <tr><td colSpan={6} className="px-8 py-12 text-center text-slate-500 font-bold">Cargando productos...</td></tr>
            ) : products.length === 0 ? (
              <tr><td colSpan={6} className="px-8 py-12 text-center text-slate-500 font-bold">No se encontraron productos</td></tr>
            ) : products.map((product: any) => (
              <tr key={product.id} className="hover:bg-white/[0.03] transition-colors group">
                <td className="px-8 py-6">
                  <div className="flex items-center gap-4">
                    <div className="h-12 w-12 bg-white/5 rounded-xl flex items-center justify-center text-slate-600 group-hover:text-primary-400 transition-colors border border-white/5">
                      <Package size={24} />
                    </div>
                    <div>
                      <p className="font-black text-white text-lg tracking-tight leading-none mb-1">{product.nombre}</p>
                      <p className="text-[10px] text-slate-500 font-bold uppercase tracking-widest">{product.codigo_barras || 'Sin código'}</p>
                    </div>
                  </div>
                </td>
                <td className="px-8 py-6 text-sm font-bold text-slate-400">{product.sku}</td>
                <td className="px-8 py-6">
                  <span className="px-3 py-1 bg-white/5 text-slate-400 text-[10px] font-black rounded-lg border border-white/5 uppercase tracking-wider">
                    {product.categoria_nombre || 'General'}
                  </span>
                </td>
                <td className="px-8 py-6">
                  <div className="flex items-center gap-2">
                    <span className={`text-lg font-black ${product.stock_actual <= product.stock_minimo ? 'text-rose-500' : 'text-emerald-400'}`}>
                      {product.stock_actual}
                    </span>
                    {product.stock_actual <= product.stock_minimo && (
                      <AlertCircle size={16} className="text-rose-500 animate-pulse" />
                    )}
                  </div>
                </td>
                <td className="px-8 py-6">
                  <p className="text-lg font-black text-white">${Number(product.precio_venta).toLocaleString()}</p>
                  <p className="text-[10px] text-slate-500 font-bold uppercase tracking-widest">Costo: ${Number(product.precio_costo).toLocaleString()}</p>
                </td>
                <td className="px-8 py-6 text-right">
                  <div className="flex items-center justify-end gap-2">
                    <button 
                      onClick={() => { setSelectedProduct(product); setIsModalOpen(true); }}
                      className="p-3 text-slate-500 hover:text-white hover:bg-white/5 rounded-xl transition-all"
                    >
                      <Edit size={20} />
                    </button>
                    <button className="p-3 text-slate-500 hover:text-rose-400 hover:bg-rose-500/5 rounded-xl transition-all">
                      <Trash2 size={20} />
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <Modal 
        isOpen={isModalOpen} 
        onClose={() => setIsModalOpen(false)} 
        title={selectedProduct ? 'Editar Producto' : 'Nuevo Producto'}
      >
        <ProductForm 
          onSuccess={() => setIsModalOpen(false)} 
          initialData={selectedProduct} 
        />
      </Modal>
    </div>
  );
};
