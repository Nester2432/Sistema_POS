import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuthStore } from '../store/authStore';
import api from '../api/axios';
import { Mail, Lock, Loader2, ArrowRight, ChevronLeft } from 'lucide-react';

export const LoginPage = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  
  const navigate = useNavigate();
  const setAuth = useAuthStore((state) => state.setAuth);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    
    try {
      const response = await api.post('/auth/login/', { email, password });
      const { access, refresh, usuario } = response.data.data;
      setAuth(usuario, access, refresh);
      navigate('/app');
    } catch (err: any) {
      setError(err.response?.data?.message || 'Credenciales inválidas. Intente nuevamente.');
    } finally {
      setLoading(false);
    }
  };

  const handleDemo = async () => {
    setLoading(true);
    setError('');
    try {
      const response = await api.post('/demo/reset/');
      const { access, refresh, usuario } = response.data.data;
      localStorage.clear();
      setAuth(usuario, access, refresh);
      navigate('/app');
    } catch (err: any) {
      setError('Error al iniciar entorno demo. Intente nuevamente.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-black flex flex-col items-center justify-center p-6 relative overflow-hidden font-['Outfit']">
      {/* Fondo con gradientes dinámicos */}
      <div className="absolute top-0 right-0 w-[500px] h-[500px] bg-primary-600/10 rounded-full blur-[120px] -mr-64 -mt-64 animate-pulse"></div>
      <div className="absolute bottom-0 left-0 w-[400px] h-[400px] bg-blue-600/10 rounded-full blur-[100px] -ml-48 -mb-48"></div>

      <div className="w-full max-w-md relative z-10">
        <Link to="/" className="inline-flex items-center gap-2 text-slate-500 hover:text-white mb-8 transition-colors group">
          <ChevronLeft size={20} className="group-hover:-translate-x-1 transition-transform" />
          <span className="text-xs font-black tracking-widest">VOLVER AL INICIO</span>
        </Link>

        <div className="bg-white/5 backdrop-blur-2xl border border-white/10 rounded-[3rem] shadow-[0_40px_100px_rgba(0,0,0,0.8)] overflow-hidden">
          <div className="p-12 text-center border-b border-white/5 bg-white/[0.02]">
            <div className="w-16 h-16 bg-primary-600 rounded-2xl flex items-center justify-center text-white font-black text-3xl mx-auto mb-6 shadow-2xl shadow-primary-500/20">S</div>
            <h1 className="text-4xl font-black text-white tracking-tighter">Acceso de Usuario</h1>
            <p className="mt-2 text-slate-500 font-bold text-sm tracking-tight">Bienvenido al ecosistema Sistema_POS</p>
          </div>
          
          <form onSubmit={handleSubmit} className="p-12 space-y-8">
            {error && (
              <div className="bg-rose-500/10 text-rose-400 p-4 rounded-2xl text-xs border border-rose-500/20 font-black tracking-wide flex items-center gap-3">
                <div className="w-2 h-2 bg-rose-500 rounded-full animate-ping"></div>
                {error}
              </div>
            )}
            
            <div className="space-y-3">
              <label className="text-[10px] font-black text-slate-500 uppercase tracking-[0.2em] ml-1">Email Profesional</label>
              <div className="relative group">
                <Mail className="absolute left-5 top-1/2 -translate-y-1/2 text-slate-500 group-focus-within:text-primary-400 transition-colors" size={20} />
                <input 
                  type="email" 
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full pl-14 pr-4 py-5 bg-white/5 border border-white/5 focus:border-primary-500/50 focus:bg-white/10 rounded-2xl outline-none transition-all font-bold text-white placeholder:text-slate-700"
                  placeholder="admin@empresa.com"
                />
              </div>
            </div>

            <div className="space-y-3">
              <label className="text-[10px] font-black text-slate-500 uppercase tracking-[0.2em] ml-1">Contraseña</label>
              <div className="relative group">
                <Lock className="absolute left-5 top-1/2 -translate-y-1/2 text-slate-500 group-focus-within:text-primary-400 transition-colors" size={20} />
                <input 
                  type="password" 
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full pl-14 pr-4 py-5 bg-white/5 border border-white/5 focus:border-primary-500/50 focus:bg-white/10 rounded-2xl outline-none transition-all font-bold text-white placeholder:text-slate-700"
                  placeholder="••••••••"
                />
              </div>
            </div>

            <div className="flex flex-col gap-6 pt-4">
              <button
                type="submit"
                disabled={loading}
                className="w-full bg-white hover:bg-slate-200 text-slate-950 font-black py-5 rounded-[1.5rem] shadow-2xl transition-all flex items-center justify-center gap-3 active:scale-95 disabled:opacity-50 text-sm tracking-widest group"
              >
                {loading ? <Loader2 className="animate-spin" size={20} /> : (
                  <>
                    <span>INICIAR SESIÓN</span>
                    <ArrowRight size={20} className="text-slate-400 group-hover:translate-x-1 transition-transform" />
                  </>
                )}
              </button>

              <div className="flex flex-col sm:flex-row gap-4">
                <button
                  type="button"
                  onClick={handleDemo}
                  disabled={loading}
                  className="flex-1 bg-white/5 hover:bg-white/10 text-white border border-white/5 font-black py-4 rounded-2xl transition-all flex items-center justify-center gap-2 shadow-sm active:scale-95 group text-[10px] tracking-[0.2em]"
                >
                  PROBAR DEMO
                </button>

                <button
                  type="button"
                  className="flex-1 bg-white/5 hover:bg-white/10 text-white border border-white/5 font-black py-4 rounded-2xl transition-all flex items-center justify-center gap-2 shadow-sm active:scale-95 group text-[10px] tracking-[0.2em]"
                >
                  SOLICITAR ACCESO
                </button>
              </div>
            </div>
          </form>
        </div>
        
        <p className="mt-12 text-center text-slate-600 text-xs font-medium">
          ¿Problemas con tu acceso? <a href="#" className="text-primary-500 hover:underline">Contactar a soporte</a>
        </p>
      </div>
    </div>
  );
};
