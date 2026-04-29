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
    <div className="flex min-h-screen bg-slate-50">
      <Sidebar />
      <div className="flex-1 flex flex-col min-w-0">
        {/* Banner de Modo Demo */}
        <div className="bg-amber-500 text-white text-[10px] font-bold uppercase tracking-[0.2em] py-1 text-center">
          Entorno de Pruebas • Los datos se reinician periódicamente
        </div>
        <Navbar />
        <main className="p-6 overflow-auto">
          <Outlet />
        </main>
      </div>
    </div>
  );
};
