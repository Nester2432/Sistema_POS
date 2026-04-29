import { NavLink } from 'react-router-dom';
import { 
  LayoutDashboard, 
  ShoppingCart, 
  Package, 
  Users, 
  Wallet, 
  BarChart3, 
  Truck,
  LogOut
} from 'lucide-react';
import { useAuthStore } from '../store/authStore';
import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';

function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

const menuItems = [
  { icon: LayoutDashboard, label: 'Dashboard', path: '/app' },
  { icon: ShoppingCart, label: 'Punto de Venta', path: '/app/pos' },
  { icon: Package, label: 'Inventario', path: '/app/inventario' },
  { icon: Wallet, label: 'Caja', path: '/app/caja' },
  { icon: Truck, label: 'Compras', path: '/app/compras' },
  { icon: Users, label: 'Clientes', path: '/app/clientes' },
  { icon: BarChart3, label: 'Reportes', path: '/app/reportes' },
];

export const Sidebar = () => {
  const logout = useAuthStore((state) => state.logout);

  return (
    <aside className="w-72 bg-slate-950 border-r border-white/5 flex flex-col h-screen sticky top-0">
      <div className="p-8">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-primary-600 rounded-xl flex items-center justify-center text-white font-black shadow-lg shadow-primary-500/20">S</div>
          <div>
            <h1 className="text-xl font-black text-white tracking-tighter leading-none">Sistema_POS</h1>
            <p className="text-[10px] text-primary-500 font-bold uppercase tracking-widest mt-1">Premium SaaS</p>
          </div>
        </div>
      </div>

      <nav className="flex-1 px-4 space-y-1 mt-4">
        {menuItems.map((item) => (
          <NavLink
            key={item.path}
            to={item.path}
            className={({ isActive }) => cn(
              "flex items-center gap-3 px-5 py-4 rounded-2xl transition-all duration-300 group",
              isActive 
                ? "bg-white/10 text-white shadow-[0_0_20px_rgba(255,255,255,0.05)] border border-white/10" 
                : "text-slate-600 hover:text-slate-300 hover:bg-white/5"
            )}
          >
            <item.icon size={20} className="group-[.active]:text-primary-400" />
            <span className="text-[10px] font-black uppercase tracking-[0.2em]">{item.label}</span>
          </NavLink>
        ))}
      </nav>

      <div className="p-6 border-t border-white/5">
        <button
          onClick={logout}
          className="flex items-center gap-3 px-4 py-4 w-full text-slate-500 hover:text-rose-400 hover:bg-rose-500/5 rounded-2xl transition-all group"
        >
          <LogOut size={22} className="group-hover:-translate-x-1 transition-transform" />
          <span className="font-bold tracking-tight">Finalizar Sesión</span>
        </button>
      </div>
    </aside>
  );
};
