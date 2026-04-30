import axios from 'axios';
import { useAuthStore } from '../store/authStore';
import { useSucursalStore } from '../store/sucursalStore';

const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL || 'http://localhost:8000/api/v1',
  headers: {
    'Content-Type': 'application/json',
  },
});

// Interceptor para añadir el token a las peticiones
api.interceptors.request.use((config) => {
  const token = useAuthStore.getState().token;
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }

  const sucursalActiva = useSucursalStore.getState().sucursalActiva;
  if (sucursalActiva) {
    config.headers['X-Sucursal-ID'] = sucursalActiva.id;
  }
  
  return config;
});

// Interceptor para manejar el refresh token
api.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config;
    
    if (error.response?.status === 401 && !originalRequest._retry) {
      originalRequest._retry = true;
      const refreshToken = useAuthStore.getState().refreshToken;
      
      if (refreshToken) {
        try {
          const response = await axios.post(`${api.defaults.baseURL}/auth/refresh/`, {
            refresh: refreshToken,
          });
          
          const { access } = response.data;
          useAuthStore.getState().setToken(access);
          
          originalRequest.headers.Authorization = `Bearer ${access}`;
          return api(originalRequest);
        } catch (refreshError) {
          useAuthStore.getState().logout();
          return Promise.reject(refreshError);
        }
      }
    }

    // Manejo de Error 403 (Forbidden) por Sucursal Inválida
    if (error.response?.status === 403) {
      // Limpiamos la sucursal activa inválida
      useSucursalStore.getState().limpiarSucursal();
      // Opcional: Podríamos emitir un evento para recargar o recargar directamente
      // Pero reactivaremos el flujo en el UI (que verá que es null y recargará)
    }
    
    return Promise.reject(error);
  }
);

export default api;
