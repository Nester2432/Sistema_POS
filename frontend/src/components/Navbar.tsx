import { Bell, Search } from 'lucide-react';
import { useAuthStore } from '../store/authStore';

export const Navbar = () => {
  const user = useAuthStore((state) => state.user);

  return (
    <header className="h-16 bg-white border-b border-slate-200 px-6 flex items-center justify-between sticky top-0 z-10">
      <div className="flex items-center gap-4 flex-1">
        <div className="relative w-96">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
          <input 
            type="text" 
            placeholder="Buscar productos, ventas..." 
            className="w-full pl-10 pr-4 py-2 bg-slate-100 border-transparent focus:bg-white focus:border-primary-500 rounded-lg text-sm transition-all"
          />
        </div>
      </div>

      <div className="flex items-center gap-4">
        <button className="p-2 text-slate-500 hover:bg-slate-100 rounded-full relative">
          <Bell size={20} />
          <span className="absolute top-1.5 right-1.5 w-2 h-2 bg-red-500 rounded-full border-2 border-white"></span>
        </button>
        
        <div className="h-8 w-px bg-slate-200 mx-2"></div>

        <div className="flex items-center gap-3">
          <div className="text-right">
            <p className="text-sm font-semibold text-slate-900">{user?.nombre}</p>
            <p className="text-xs text-slate-500 capitalize">{user?.rol}</p>
          </div>
          <div className="h-10 w-10 bg-primary-100 text-primary-700 flex items-center justify-center rounded-full font-bold">
            {user?.nombre.charAt(0).toUpperCase()}
          </div>
        </div>
      </div>
    </header>
  );
};
