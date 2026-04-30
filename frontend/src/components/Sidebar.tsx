import { NavLink } from 'react-router-dom';
import { 
  LayoutDashboard, 
  ShoppingCart, 
  Package, 
  Users, 
  Wallet, 
  Truck,
  ArrowRightLeft,
  LogOut
} from 'lucide-react';
import { useAuthStore } from '../store/authStore';
import { SucursalSelector } from './SucursalSelector';
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
  { icon: ArrowRightLeft, label: 'Transferencias', path: '/app/transferencias' },
  { icon: Users, label: 'Clientes', path: '/app/clientes' },
  { icon: BarChart3, label: 'Reportes', path: '/app/reportes' },
];

export const Sidebar = () => {
  const logout = useAuthStore((state) => state.logout);

  return (
    <aside className="w-64 bg-slate-950 border-r border-white/5 flex flex-col h-screen sticky top-0">
      <div className="p-6">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 bg-white text-slate-950 rounded-lg flex items-center justify-center font-bold text-lg">S</div>
          <div>
            <h1 className="text-base font-bold text-white tracking-tight leading-none">Sistema_POS</h1>
            <p className="text-[10px] text-slate-500 font-medium mt-0.5">Control de Gestión</p>
          </div>
        </div>
        
        <div className="mt-6 pt-4 border-t border-white/5">
          <SucursalSelector />
        </div>
      </div>

      <nav className="flex-1 px-3 space-y-1 mt-2">
        {menuItems.map((item) => (
          <NavLink
            key={item.path}
            to={item.path}
            className={({ isActive }) => cn(
              "flex items-center gap-3 px-4 py-2.5 rounded-xl transition-all duration-200 group",
              isActive 
                ? "bg-white/10 text-white border border-white/5" 
                : "text-slate-400 hover:text-slate-200 hover:bg-white/5"
            )}
          >
            <item.icon size={18} />
            <span className="text-sm font-medium">{item.label}</span>
          </NavLink>
        ))}
      </nav>

      <div className="p-4 border-t border-white/5">
        <button
          onClick={logout}
          className="flex items-center gap-3 px-4 py-3 w-full text-slate-500 hover:text-rose-400 hover:bg-rose-500/5 rounded-xl transition-all text-sm font-medium group"
        >
          <LogOut size={18} className="group-hover:-translate-x-1 transition-transform" />
          <span>Cerrar Sesión</span>
        </button>
      </div>
    </aside>
  );
};
