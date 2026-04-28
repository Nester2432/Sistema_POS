import React from 'react';
import { Link } from 'react-router-dom';
import { 
  CheckCircle2, 
  ShoppingCart, 
  Package, 
  Wallet, 
  Users, 
  ArrowRight,
  Play
} from 'lucide-react';

const BenefitCard = ({ icon: Icon, title, desc }: any) => (
  <div className="flex flex-col items-start p-8 bg-white rounded-2xl border border-slate-100 shadow-sm hover:shadow-md transition-all">
    <div className="p-3 bg-primary-100 text-primary-600 rounded-xl mb-4">
      <Icon size={24} />
    </div>
    <h3 className="text-xl font-bold text-slate-900 mb-2">{title}</h3>
    <p className="text-slate-500 text-sm leading-relaxed">{desc}</p>
  </div>
);

export const LandingPage = () => {
  return (
    <div className="bg-slate-50 min-h-screen">
      {/* Header / Nav */}
      <nav className="max-w-7xl mx-auto px-6 py-6 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className="w-10 h-10 bg-primary-600 rounded-xl flex items-center justify-center text-white font-bold text-xl">S</div>
          <span className="text-2xl font-bold text-slate-900 tracking-tight">Sistema_POS</span>
        </div>
        <div className="hidden md:flex items-center gap-8 text-sm font-medium text-slate-600">
          <a href="#beneficios" className="hover:text-primary-600">Beneficios</a>
          <a href="#screenshots" className="hover:text-primary-600">Pantallas</a>
          <Link to="/login" className="px-5 py-2 bg-slate-900 text-white rounded-full hover:bg-slate-800 transition-all">Ingresar</Link>
        </div>
      </nav>

      {/* Hero Section */}
      <section className="max-w-7xl mx-auto px-6 pt-20 pb-32 flex flex-col items-center text-center">
        <span className="px-4 py-1.5 bg-primary-50 text-primary-600 rounded-full text-xs font-bold uppercase tracking-wider mb-6">Software POS SaaS Multiempresa</span>
        <h1 className="text-5xl md:text-7xl font-extrabold text-slate-900 max-w-4xl leading-tight mb-8">
          Controlá tu negocio en minutos, <span className="text-primary-600">sin complicaciones.</span>
        </h1>
        <p className="text-xl text-slate-500 max-w-2xl mb-10">
          La solución más completa y rápida para gestionar tus ventas, stock y finanzas en una sola plataforma.
        </p>
        <div className="flex flex-col sm:flex-row gap-4">
          <Link to="/login" className="flex items-center gap-2 px-8 py-4 bg-primary-600 text-white rounded-2xl font-bold text-lg hover:bg-primary-700 shadow-xl shadow-primary-200 transition-all">
            Probar demo
            <Play size={20} fill="currentColor" />
          </Link>
          <button className="flex items-center gap-2 px-8 py-4 bg-white text-slate-700 border border-slate-200 rounded-2xl font-bold text-lg hover:bg-slate-50 transition-all">
            Solicitar acceso
            <ArrowRight size={20} />
          </button>
        </div>
      </section>

      {/* Beneficios */}
      <section id="beneficios" className="max-w-7xl mx-auto px-6 py-24 border-t border-slate-100">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
          <BenefitCard 
            icon={Package} 
            title="Control de stock" 
            desc="Gestión de inventario con alertas de stock bajo e importación masiva desde Excel." 
          />
          <BenefitCard 
            icon={ShoppingCart} 
            title="Ventas rápidas" 
            desc="Punto de venta intuitivo diseñado para agilizar la atención al cliente." 
          />
          <BenefitCard 
            icon={Wallet} 
            title="Caja clara" 
            desc="Apertura, cierre y arqueo de caja con reporte de diferencias automático." 
          />
          <BenefitCard 
            icon={Users} 
            title="Clientes y deudas" 
            desc="CRM integrado para gestionar cuentas corrientes y saldos de clientes." 
          />
        </div>
      </section>

      {/* Screenshots / Mockups */}
      <section id="screenshots" className="bg-slate-900 py-32 overflow-hidden">
        <div className="max-w-7xl mx-auto px-6 text-center mb-16">
          <h2 className="text-4xl font-bold text-white mb-4">Todo lo que necesitas en una sola App</h2>
          <p className="text-slate-400">Diseñado para ser potente pero asombrosamente simple.</p>
        </div>
        
        <div className="flex flex-col gap-24 max-w-7xl mx-auto px-6">
          <div className="flex flex-col lg:flex-row items-center gap-16">
            <div className="flex-1 text-left">
              <h3 className="text-3xl font-bold text-white mb-4">Dashboard Inteligente</h3>
              <p className="text-slate-400 mb-6">Métricas en tiempo real de tus ventas, métodos de pago y deudores.</p>
              <ul className="space-y-3">
                {['Ventas de hoy', 'Gráfico de última semana', 'KPIs de stock'].map((t) => (
                  <li key={t} className="flex items-center gap-2 text-slate-300">
                    <CheckCircle2 size={18} className="text-primary-500" /> {t}
                  </li>
                ))}
              </ul>
            </div>
            <div className="flex-1 bg-slate-800 rounded-3xl p-4 shadow-2xl border border-slate-700">
              <img src="/dashboard_mockup.png" alt="Dashboard" className="rounded-2xl" />
            </div>
          </div>

          <div className="flex flex-col lg:flex-row-reverse items-center gap-16">
            <div className="flex-1 text-left">
              <h3 className="text-3xl font-bold text-white mb-4">Punto de Venta Pro</h3>
              <p className="text-slate-400 mb-6">Vende en segundos con nuestro POS optimizado para velocidad.</p>
              <ul className="space-y-3">
                {['Búsqueda instantánea', 'Carrito dinámico', 'Ticket PDF automático'].map((t) => (
                  <li key={t} className="flex items-center gap-2 text-slate-300">
                    <CheckCircle2 size={18} className="text-primary-500" /> {t}
                  </li>
                ))}
              </ul>
            </div>
            <div className="flex-1 bg-slate-800 rounded-3xl p-4 shadow-2xl border border-slate-700">
              <img src="/pos_mockup.png" alt="POS" className="rounded-2xl" />
            </div>
          </div>
        </div>
      </section>

      {/* Final CTA */}
      <section className="py-32 bg-white text-center px-6">
        <h2 className="text-4xl md:text-5xl font-extrabold text-slate-900 mb-8">¿Listo para llevar tu negocio al siguiente nivel?</h2>
        <div className="flex flex-col sm:flex-row gap-4 justify-center">
          <Link to="/login" className="px-10 py-5 bg-primary-600 text-white rounded-2xl font-bold text-xl hover:bg-primary-700 shadow-2xl shadow-primary-200 transition-all">
            Comenzar ahora
          </Link>
          <button className="px-10 py-5 bg-slate-100 text-slate-700 rounded-2xl font-bold text-xl hover:bg-slate-200 transition-all">
            Agendar Demo
          </button>
        </div>
      </section>

      {/* Footer */}
      <footer className="py-12 border-t border-slate-100 text-center text-slate-400 text-sm">
        <p>&copy; 2026 Sistema_POS SaaS. Todos los derechos reservados.</p>
      </footer>
    </div>
  );
};
