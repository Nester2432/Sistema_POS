import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuthStore } from '../store/authStore';
import api from '../api/axios';
import { Mail, Lock, Loader2, ArrowRight } from 'lucide-react';

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
      setError(err.response?.data?.message || 'Error al iniciar sesión. Verifique sus credenciales.');
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
      setError('No se pudo iniciar la demo comercial. Intente nuevamente.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-950 flex items-center justify-center p-4 bg-[radial-gradient(circle_at_top_right,_var(--tw-gradient-stops))] from-slate-900 via-slate-950 to-black">
      <div className="w-full max-w-md bg-white rounded-[2.5rem] shadow-[0_20px_50px_rgba(0,0,0,0.5)] overflow-hidden border border-white/10">
        <div className="p-10 bg-primary-600 text-white text-center relative overflow-hidden">
          <div className="absolute top-0 right-0 w-32 h-32 bg-white/10 rounded-full -mr-16 -mt-16 blur-2xl"></div>
          <h1 className="text-4xl font-black tracking-tighter">Sistema_POS</h1>
          <p className="mt-2 text-primary-100 font-medium">Potencia tu negocio hoy</p>
        </div>
        
        <form onSubmit={handleSubmit} className="p-10 space-y-6">
          {error && (
            <div className="bg-rose-50 text-rose-600 p-4 rounded-2xl text-sm border border-rose-100 font-bold">
              {error}
            </div>
          )}
          
          <div className="space-y-2">
            <label className="text-xs font-black text-slate-400 uppercase tracking-widest ml-1">Email</label>
            <div className="relative">
              <Mail className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
              <input 
                type="email" 
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full pl-12 pr-4 py-4 bg-slate-50 border-transparent border-2 focus:border-primary-500 rounded-2xl outline-none transition-all font-medium"
                placeholder="admin@empresa.com"
              />
            </div>
          </div>

          <div className="space-y-2">
            <label className="text-xs font-black text-slate-400 uppercase tracking-widest ml-1">Contraseña</label>
            <div className="relative">
              <Lock className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
              <input 
                type="password" 
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full pl-12 pr-4 py-4 bg-slate-50 border-transparent border-2 focus:border-primary-500 rounded-2xl outline-none transition-all font-medium"
                placeholder="••••••••"
              />
            </div>
          </div>

          <div className="flex flex-col gap-4">
            <button
              type="submit"
              disabled={loading}
              className="w-full bg-slate-900 hover:bg-black text-white font-bold py-4 rounded-2xl transition-all flex items-center justify-center gap-2 shadow-lg active:scale-95 disabled:opacity-50"
            >
              {loading ? <Loader2 className="animate-spin" size={20} /> : 'INICIAR SESIÓN'}
            </button>

            <div className="flex flex-col sm:flex-row gap-3">
              <button
                type="button"
                onClick={handleDemo}
                disabled={loading}
                className="flex-1 bg-white hover:bg-slate-50 text-slate-900 border border-slate-200 font-bold py-4 rounded-2xl transition-all flex items-center justify-center gap-2 shadow-sm active:scale-95 group"
              >
                <span className="text-sm">Probar demo</span>
                <ArrowRight size={16} className="text-slate-400 group-hover:translate-x-1 transition-transform" />
              </button>

              <button
                type="button"
                className="flex-1 bg-white hover:bg-slate-50 text-slate-900 border border-slate-200 font-bold py-4 rounded-2xl transition-all flex items-center justify-center gap-2 shadow-sm active:scale-95 group"
              >
                <span className="text-sm">Solicitar acceso</span>
                <ArrowRight size={16} className="text-slate-400 group-hover:translate-x-1 transition-transform" />
              </button>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
};
