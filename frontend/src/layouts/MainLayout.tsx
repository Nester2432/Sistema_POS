import { Outlet, Navigate } from 'react-router-dom';
import { Sidebar } from '../components/Sidebar';
import { Navbar } from '../components/Navbar';
import { useAuthStore } from '../store/authStore';

export const MainLayout = () => {
  const { token, _hasHydrated } = useAuthStore();

  // Si no ha cargado el estado de localStorage, esperamos
  if (!_hasHydrated) {
    return <div className="min-h-screen flex items-center justify-center">Cargando sesión...</div>;
  }

  // Si ya cargó y no hay token, al login
  if (!token) {
    console.log("Acceso denegado: No hay token activo.");
    return <Navigate to="/login" replace />;
  }

  return (
    <div className="flex min-h-screen bg-slate-950 text-slate-50">
      <Sidebar />
      <div className="flex-1 flex flex-col min-w-0">
        {/* Banner de Modo Demo */}
        <div className="bg-primary-600/10 text-primary-400 text-[10px] font-black uppercase tracking-[0.2em] py-1.5 text-center border-b border-primary-500/10 backdrop-blur-md">
          SaaS Demo • Entorno de Pruebas • Operatividad Completa
        </div>
        <Navbar />
        <main className="p-8 overflow-auto">
          <div className="max-w-7xl mx-auto">
            <Outlet />
          </div>
        </main>
      </div>
    </div>
  );
};
