import { Bell, Search } from 'lucide-react';
import { useAuthStore } from '../store/authStore';

export const Navbar = () => {
  const user = useAuthStore((state) => state.user);

  return (
    <header className="h-20 bg-slate-950/50 backdrop-blur-xl border-b border-white/5 px-8 flex items-center justify-between sticky top-0 z-10">
      <div className="flex items-center gap-4 flex-1">
        <div className="relative w-96 group">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-500 group-focus-within:text-primary-400 transition-colors" size={18} />
          <input 
            type="text" 
            placeholder="Buscar productos, ventas, clientes..." 
            className="w-full pl-12 pr-4 py-2.5 bg-white/5 border border-white/5 focus:bg-white/10 focus:border-primary-500/50 rounded-2xl text-sm transition-all outline-none text-slate-300 placeholder:text-slate-600"
          />
        </div>
      </div>

      <div className="flex items-center gap-6">
        <button className="p-2.5 text-slate-500 hover:text-white hover:bg-white/5 rounded-2xl relative transition-all">
          <Bell size={20} />
          <span className="absolute top-2.5 right-2.5 w-2 h-2 bg-primary-500 rounded-full border-2 border-slate-950 shadow-[0_0_10px_rgba(6,182,212,0.5)]"></span>
        </button>
        
        <div className="h-8 w-px bg-white/5 mx-2"></div>

        <div className="flex items-center gap-4">
          <div className="text-right hidden sm:block">
            <p className="text-sm font-black text-white tracking-tight leading-none">{user?.nombre}</p>
            <p className="text-[10px] text-primary-500 font-bold uppercase tracking-widest mt-1.5">{user?.rol}</p>
          </div>
          <div className="h-11 w-11 bg-gradient-to-br from-primary-500 to-blue-600 text-white flex items-center justify-center rounded-2xl font-black shadow-lg shadow-primary-500/20 text-lg border border-white/10">
            {user?.nombre.charAt(0).toUpperCase()}
          </div>
        </div>
      </div>
    </header>
  );
};
