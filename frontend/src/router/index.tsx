import { createBrowserRouter, RouterProvider, Navigate } from 'react-router-dom';
import { LandingPage } from '../pages/LandingPage';
import { LoginPage } from '../pages/LoginPage';
import { DashboardPage } from '../pages/DashboardPage';
import { POSPage } from '../pages/POSPage';
import { InventoryPage } from '../pages/InventoryPage';
import { ClientsPage } from '../pages/ClientsPage';
import { CajaPage } from '../pages/CajaPage';
import { PurchasesPage } from '../pages/PurchasesPage';
import { MainLayout } from '../layouts/MainLayout';

import { TransferenciasPage } from '../pages/Transferencias/TransferenciasPage';
import { NuevaTransferenciaPage } from '../pages/Transferencias/NuevaTransferenciaPage';

// Componentes temporales para las rutas que implementaremos luego
const Placeholder = ({ name }: { name: string }) => (
  <div className="p-8 text-center text-slate-500">
    <h2 className="text-xl font-bold">Módulo de {name}</h2>
    <p>Estamos trabajando en esta pantalla...</p>
  </div>
);

const router = createBrowserRouter([
  {
    path: '/',
    element: <LandingPage />,
  },
  {
    path: '/login',
    element: <LoginPage />,
  },
  {
    path: '/app',
    element: <MainLayout />,
    children: [
      { index: true, element: <DashboardPage /> },
      { path: 'pos', element: <POSPage /> },
      { path: 'inventario', element: <InventoryPage /> },
      { path: 'caja', element: <CajaPage /> },
      { path: 'compras', element: <PurchasesPage /> },
      { path: 'clientes', element: <ClientsPage /> },
      { path: 'reportes', element: <Placeholder name="Reportes" /> },
      { path: 'transferencias', element: <TransferenciasPage /> },
      { path: 'transferencias/nueva', element: <NuevaTransferenciaPage /> },
    ],
  },
  {
    path: '*',
    element: <Navigate to="/" replace />,
  },
]);

export const AppRouter = () => <RouterProvider router={router} />;
