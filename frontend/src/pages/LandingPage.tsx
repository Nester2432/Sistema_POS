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
  Globe
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
      <section className="max-w-7xl mx-auto px-8 pt-32 pb-40 flex flex-col items-center text-center relative z-10">
        <div className="inline-flex items-center gap-2 px-4 py-2 bg-white/5 border border-white/5 rounded-full text-[10px] font-black text-primary-400 uppercase tracking-[0.3em] mb-10">
          <Sparkles size={14} />
          <span>SaaS POS DE PRÓXIMA GENERACIÓN</span>
        </div>
        <h1 className="text-6xl md:text-8xl font-black text-white max-w-5xl leading-[1.1] mb-10 tracking-tighter">
          Domina tu negocio con <span className="text-transparent bg-clip-text bg-gradient-to-r from-primary-400 to-blue-500">precisión absoluta.</span>
        </h1>
        <p className="text-xl text-slate-500 max-w-2xl mb-14 font-medium leading-relaxed">
          La plataforma definitiva para escalar tus ventas, controlar stock en tiempo real y gestionar finanzas con una interfaz premium e intuitiva.
        </p>
        <div className="flex flex-col sm:flex-row gap-6">
          <Link 
            to="/login" 
            className="flex items-center justify-center gap-3 px-12 py-6 bg-white text-slate-950 rounded-[2rem] font-black text-lg hover:bg-slate-200 transition-all shadow-2xl shadow-white/5 active:scale-95 group"
          >
            <span>PROBAR DEMO GRATIS</span>
            <ArrowRight size={24} className="text-slate-400 group-hover:translate-x-2 transition-transform" />
          </Link>
          
          <button className="flex items-center justify-center gap-3 px-12 py-6 bg-white/5 text-white border border-white/10 rounded-[2rem] font-black text-lg hover:bg-white/10 transition-all active:scale-95 group">
            <Zap size={24} className="text-primary-500" />
            <span>SOLICITAR ACCESO</span>
          </button>
        </div>
      </section>

      {/* Beneficios */}
      <section id="beneficios" className="max-w-7xl mx-auto px-8 py-40 relative z-10 border-t border-white/5">
        <div className="text-center mb-24">
          <h2 className="text-xs font-black text-primary-500 uppercase tracking-[0.4em] mb-4">CAPACIDADES CORE</h2>
          <p className="text-4xl font-black text-white tracking-tighter">Potencia bruta para tu empresa</p>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
          <BenefitCard 
            icon={Package} 
            title="Inventario Inteligente" 
            desc="Control total con alertas de stock crítico y trazabilidad completa de movimientos." 
          />
          <BenefitCard 
            icon={ShoppingCart} 
            title="Punto de Venta Pro" 
            desc="Interfaz táctica optimizada para velocidad extrema y precisión en cada ticket." 
          />
          <BenefitCard 
            icon={Wallet} 
            title="Arqueo Blindado" 
            desc="Gestión de caja con auditoría de movimientos y reportes de diferencias automáticos." 
          />
          <BenefitCard 
            icon={Users} 
            title="Ecosistema CRM" 
            desc="Fideliza clientes y gestiona cuentas corrientes con perfiles financieros detallados." 
          />
        </div>
      </section>

      {/* Screenshots / Mockups */}
      <section id="screenshots" className="bg-slate-900/50 py-40 border-y border-white/5 relative overflow-hidden">
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-full h-full bg-[radial-gradient(circle_at_center,_var(--tw-gradient-stops))] from-primary-600/5 via-transparent to-transparent opacity-50"></div>
        
        <div className="max-w-7xl mx-auto px-8 text-center mb-32 relative z-10">
          <Globe className="mx-auto text-primary-500 mb-6" size={48} />
          <h2 className="text-5xl font-black text-white tracking-tighter mb-4">Arquitectura de Alto Nivel</h2>
          <p className="text-slate-500 font-bold max-w-2xl mx-auto">Diseñado bajo estándares de software de grado industrial, empaquetado en una experiencia minimalista.</p>
        </div>
        
        <div className="flex flex-col gap-40 max-w-7xl mx-auto px-8 relative z-10">
          <div className="flex flex-col lg:flex-row items-center gap-24">
            <div className="flex-1 text-left">
              <div className="inline-block p-2 bg-primary-500/10 text-primary-400 rounded-lg mb-6">
                <BarChart3 size={24} />
              </div>
              <h3 className="text-4xl font-black text-white tracking-tighter mb-6 uppercase tracking-tight">Dashboard de Mando</h3>
              <p className="text-slate-500 mb-8 font-medium leading-relaxed">Visualiza la salud de tu negocio con métricas en tiempo real, gráficos predictivos y estados de cuenta.</p>
              <ul className="space-y-4">
                {['Métricas de facturación diaria', 'Desglose de métodos de pago', 'Alertas de stock automático'].map((t) => (
                  <li key={t} className="flex items-center gap-3 text-slate-300 font-bold text-sm tracking-tight">
                    <CheckCircle2 size={20} className="text-primary-500 shadow-[0_0_10px_rgba(6,182,212,0.4)]" /> {t}
                  </li>
                ))}
              </ul>
            </div>
            <div className="flex-1 bg-white/5 rounded-[3rem] p-6 shadow-[0_40px_100px_rgba(0,0,0,0.6)] border border-white/10 group">
              <div className="bg-slate-950 rounded-[2rem] overflow-hidden border border-white/5 transition-transform group-hover:scale-[1.02] duration-700">
                <img src="/dashboard_mockup.png" alt="Dashboard" className="opacity-80 group-hover:opacity-100 transition-opacity" />
              </div>
            </div>
          </div>

          <div className="flex flex-col lg:flex-row-reverse items-center gap-24">
            <div className="flex-1 text-left">
              <div className="inline-block p-2 bg-blue-500/10 text-blue-400 rounded-lg mb-6">
                <ShoppingCart size={24} />
              </div>
              <h3 className="text-4xl font-black text-white tracking-tighter mb-6 uppercase tracking-tight">Terminal de Ventas</h3>
              <p className="text-slate-500 mb-8 font-medium leading-relaxed">El POS más rápido del mercado. Búsqueda inteligente, gestión de descuentos y carrito persistente.</p>
              <ul className="space-y-4">
                {['Búsqueda táctica por SKU', 'Cierre de ticket en 2 clicks', 'Soporte multimoneda nativo'].map((t) => (
                  <li key={t} className="flex items-center gap-3 text-slate-300 font-bold text-sm tracking-tight">
                    <CheckCircle2 size={20} className="text-blue-500 shadow-[0_0_10px_rgba(59,130,246,0.4)]" /> {t}
                  </li>
                ))}
              </ul>
            </div>
            <div className="flex-1 bg-white/5 rounded-[3rem] p-6 shadow-[0_40px_100px_rgba(0,0,0,0.6)] border border-white/10 group">
              <div className="bg-slate-950 rounded-[2rem] overflow-hidden border border-white/5 transition-transform group-hover:scale-[1.02] duration-700">
                <img src="/pos_mockup.png" alt="POS" className="opacity-80 group-hover:opacity-100 transition-opacity" />
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Final CTA */}
      <section className="py-56 text-center px-8 relative overflow-hidden">
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-primary-600/10 rounded-full blur-[120px] pointer-events-none"></div>
        <h2 className="text-6xl md:text-8xl font-black text-white mb-14 tracking-tighter relative z-10 leading-none">
          ¿Listo para el <br/><span className="text-primary-500">siguiente nivel?</span>
        </h2>
        <div className="flex flex-col sm:flex-row gap-6 justify-center relative z-10">
          <Link to="/login" className="px-16 py-8 bg-white text-slate-950 rounded-[2.5rem] font-black text-2xl hover:bg-slate-200 shadow-[0_20px_50px_rgba(255,255,255,0.1)] transition-all active:scale-95">
            EMPEZAR AHORA
          </Link>
          <button className="px-16 py-8 bg-white/5 text-white border border-white/10 rounded-[2.5rem] font-black text-2xl hover:bg-white/10 transition-all active:scale-95">
            AGENDAR DEMO
          </button>
        </div>
      </section>

      {/* Footer */}
      <footer className="py-20 border-t border-white/5 text-center relative z-10">
        <div className="flex items-center justify-center gap-3 mb-8">
          <div className="w-8 h-8 bg-white/5 rounded-lg flex items-center justify-center text-white font-black text-sm">S</div>
          <span className="text-[10px] font-black text-slate-600 uppercase tracking-[0.4em]">SISTEMA_POS CLOUD SUITE</span>
        </div>
        <p className="text-slate-700 text-xs font-bold tracking-widest uppercase">&copy; 2026 INFINITE CODE SA. TODOS LOS DERECHOS RESERVADOS.</p>
      </footer>
    </div>
  );
};
