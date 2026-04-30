import { Link } from 'react-router-dom';
import { 
  CheckCircle2, 
  ShoppingCart, 
  Package, 
  Wallet, 
  Users, 
  ArrowRight,
  Sparkles,
  Zap,
  Globe,
  BarChart3
} from 'lucide-react';

const BenefitCard = ({ icon: Icon, title, desc }: any) => (
  <div className="flex flex-col items-start p-10 bg-white/5 backdrop-blur-md rounded-[2.5rem] border border-white/5 shadow-2xl hover:bg-white/10 transition-all group overflow-hidden relative">
    <div className="absolute top-0 right-0 w-20 h-20 bg-primary-500/5 rounded-full -mr-10 -mt-10 blur-2xl group-hover:bg-primary-500/10 transition-colors"></div>
    <div className="p-4 bg-primary-500/10 text-primary-400 rounded-2xl mb-6 group-hover:scale-110 transition-transform">
      <Icon size={28} />
    </div>
    <h3 className="text-xl font-black text-white mb-3 tracking-tight">{title}</h3>
    <p className="text-slate-500 text-sm leading-relaxed font-medium">{desc}</p>
  </div>
);

export const LandingPage = () => {
  return (
    <div className="bg-slate-950 min-h-screen text-slate-300 font-['Outfit'] selection:bg-primary-500 selection:text-white">
      {/* Fondo con gradientes dinámicos */}
      <div className="fixed top-0 right-0 w-[800px] h-[800px] bg-primary-600/5 rounded-full blur-[150px] -mr-96 -mt-96 pointer-events-none"></div>
      <div className="fixed bottom-0 left-0 w-[600px] h-[600px] bg-blue-600/5 rounded-full blur-[120px] -ml-48 -mb-48 pointer-events-none"></div>

      {/* Header / Nav */}
      <nav className="max-w-7xl mx-auto px-8 py-8 flex items-center justify-between relative z-50">
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 bg-primary-600 rounded-2xl flex items-center justify-center text-white font-black text-2xl shadow-2xl shadow-primary-500/20">S</div>
          <span className="text-2xl font-black text-white tracking-tighter uppercase tracking-widest text-sm">Sistema_POS</span>
        </div>
        <div className="hidden md:flex items-center gap-10">
          <a href="#beneficios" className="text-xs font-black tracking-widest text-slate-500 hover:text-white transition-colors">BENEFICIOS</a>
          <a href="#screenshots" className="text-xs font-black tracking-widest text-slate-500 hover:text-white transition-colors">PANTALLAS</a>
          <Link to="/login" className="px-8 py-3 bg-white text-slate-950 rounded-2xl font-black text-xs tracking-widest hover:bg-slate-200 transition-all shadow-xl shadow-white/5">INGRESAR</Link>
        </div>
      </nav>

      {/* Hero Section */}
      <section className="max-w-7xl mx-auto px-8 pt-20 pb-32 flex flex-col items-center text-center relative z-10">
        <div className="inline-flex items-center gap-2 px-3 py-1 bg-white/5 border border-white/10 rounded-full text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-8">
          <Sparkles size={14} className="text-accent-500" />
          <span>SISTEMA POS DE ALTO RENDIMIENTO</span>
        </div>
        <h1 className="text-5xl md:text-7xl font-bold text-white max-w-4xl leading-[1.1] mb-8 tracking-tight">
          Gestiona tu negocio con <span className="text-slate-500">precisión industrial.</span>
        </h1>
        <p className="text-lg text-slate-500 max-w-xl mb-12 font-medium leading-relaxed">
          Optimiza tus ventas, controla tu inventario en tiempo real y fideliza clientes con una plataforma diseñada para la eficiencia.
        </p>
        <div className="flex flex-col sm:flex-row gap-4">
          <Link 
            to="/login" 
            className="flex items-center justify-center gap-2 px-8 py-3 bg-white text-slate-950 rounded-xl font-bold text-sm hover:bg-slate-200 transition-all shadow-lg active:scale-[0.98] group"
          >
            <span>Probar Demo Gratis</span>
            <ArrowRight size={18} className="group-hover:translate-x-1 transition-transform" />
          </Link>
          
          <button className="flex items-center justify-center gap-2 px-8 py-3 bg-white/5 text-white border border-white/10 rounded-xl font-bold text-sm hover:bg-white/10 transition-all active:scale-[0.98]">
            <span>Solicitar Acceso</span>
          </button>
        </div>
      </section>

      {/* Beneficios */}
      <section id="beneficios" className="max-w-7xl mx-auto px-8 py-24 relative z-10 border-t border-white/5">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          <BenefitCard 
            icon={Package} 
            title="Inventario" 
            desc="Control total con alertas de stock crítico y trazabilidad completa." 
          />
          <BenefitCard 
            icon={ShoppingCart} 
            title="Punto de Venta" 
            desc="Interfaz optimizada para velocidad extrema en cada transacción." 
          />
          <BenefitCard 
            icon={Wallet} 
            title="Caja Blindada" 
            desc="Gestión de arqueo con auditoría de movimientos automática." 
          />
          <BenefitCard 
            icon={Users} 
            title="Ecosistema CRM" 
            desc="Fideliza clientes y gestiona perfiles financieros detallados." 
          />
        </div>
      </section>

      {/* Screenshots / Mockups */}
      <section id="screenshots" className="bg-slate-900/30 py-24 border-y border-white/5 relative overflow-hidden">
        <div className="max-w-7xl mx-auto px-8">
          <div className="text-center mb-16 relative z-10">
            <h2 className="text-3xl font-bold text-white tracking-tight mb-4">Arquitectura de Alto Nivel</h2>
            <p className="text-slate-500 max-w-xl mx-auto text-sm font-medium">Diseñado bajo estándares industriales para garantizar escalabilidad total.</p>
          </div>
          
          <div className="flex flex-col gap-32 relative z-10">
            <div className="flex flex-col lg:flex-row items-center gap-20">
              <div className="flex-1 text-left">
                <div className="inline-flex p-2 bg-accent-500/10 text-accent-500 rounded-lg mb-6">
                  <BarChart3 size={24} />
                </div>
                <h3 className="text-2xl font-bold text-white tracking-tight mb-4 uppercase text-sm opacity-50 tracking-widest">Dashboard de Mando</h3>
                <p className="text-slate-500 mb-6 text-sm font-medium leading-relaxed">Visualiza la salud de tu negocio con métricas en tiempo real.</p>
                <ul className="space-y-3">
                  {['Facturación diaria', 'Métodos de pago', 'Alertas de stock'].map((t) => (
                    <li key={t} className="flex items-center gap-2 text-slate-300 font-semibold text-xs">
                      <CheckCircle2 size={16} className="text-accent-500" /> {t}
                    </li>
                  ))}
                </ul>
              </div>
              <div className="flex-1 bg-white/5 rounded-2xl p-4 shadow-2xl border border-white/5 group">
                <div className="bg-slate-950 rounded-xl overflow-hidden border border-white/5 transition-transform group-hover:scale-[1.01] duration-500">
                  <img src="/dashboard_mockup.png" alt="Dashboard" className="opacity-70 group-hover:opacity-90 transition-opacity" />
                </div>
              </div>
            </div>

            <div className="flex flex-col lg:flex-row-reverse items-center gap-20">
              <div className="flex-1 text-left">
                <div className="inline-flex p-2 bg-accent-500/10 text-accent-500 rounded-lg mb-6">
                  <ShoppingCart size={24} />
                </div>
                <h3 className="text-2xl font-bold text-white tracking-tight mb-4 uppercase text-sm opacity-50 tracking-widest">Terminal POS</h3>
                <p className="text-slate-500 mb-6 text-sm font-medium leading-relaxed">El punto de venta más rápido. Búsqueda inteligente y gestión ágil.</p>
                <ul className="space-y-3">
                  {['Búsqueda táctica', 'Cierre en 2 clicks', 'Tickets PDF'].map((t) => (
                    <li key={t} className="flex items-center gap-2 text-slate-300 font-semibold text-xs">
                      <CheckCircle2 size={16} className="text-accent-500" /> {t}
                    </li>
                  ))}
                </ul>
              </div>
              <div className="flex-1 bg-white/5 rounded-2xl p-4 shadow-2xl border border-white/5 group">
                <div className="bg-slate-950 rounded-xl overflow-hidden border border-white/5 transition-transform group-hover:scale-[1.01] duration-500">
                  <img src="/pos_mockup.png" alt="POS" className="opacity-70 group-hover:opacity-90 transition-opacity" />
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Final CTA */}
      <section className="py-40 text-center px-8 relative">
        <h2 className="text-4xl md:text-5xl font-bold text-white mb-10 tracking-tight leading-none">
          ¿Listo para el <br/><span className="text-accent-500">siguiente nivel?</span>
        </h2>
        <div className="flex flex-col sm:flex-row gap-4 justify-center">
          <Link to="/login" className="px-10 py-4 bg-white text-slate-950 rounded-xl font-bold text-sm shadow-xl transition-all active:scale-[0.98]">
            EMPEZAR AHORA
          </Link>
          <button className="px-10 py-4 bg-white/5 text-white border border-white/10 rounded-xl font-bold text-sm hover:bg-white/10 transition-all active:scale-[0.98]">
            AGENDAR DEMO
          </button>
        </div>
      </section>

      {/* Footer */}
      <footer className="py-12 border-t border-white/5 text-center text-slate-600">
        <div className="flex items-center justify-center gap-2 mb-6">
          <div className="w-6 h-6 bg-white/5 rounded flex items-center justify-center text-white font-bold text-[10px]">S</div>
          <span className="text-[10px] font-bold uppercase tracking-widest">SISTEMA_POS SUITE</span>
        </div>
        <p className="text-[10px] font-medium tracking-widest uppercase">&copy; 2026 TODOS LOS DERECHOS RESERVADOS.</p>
      </footer>
    </div>
  );
};
