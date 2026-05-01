import api from './axios';
import type { Atributo, ValorAtributo, ProductoVariante } from '../types/variantes';

export const variantesApi = {
  // Atributos
  getAtributos: async (): Promise<Atributo[]> => {
    const { data } = await api.get('/variantes/atributos/');
    const payload = data?.data;
    return Array.isArray(payload) ? payload : (payload?.results ?? []);
  },
  
  createAtributo: async (nombre: string): Promise<Atributo> => {
    const { data } = await api.post('/variantes/atributos/', { nombre });
    return data?.data || data;
  },

  // Valores
  createValor: async (atributoId: string, valor: string): Promise<ValorAtributo> => {
    const { data } = await api.post('/variantes/valores/', { atributo: atributoId, valor });
    return data?.data || data;
  },

  // Variantes
  getVariantes: async (productoId: string): Promise<ProductoVariante[]> => {
    const { data } = await api.get(`/variantes/variantes/?producto_id=${productoId}`);
    const payload = data?.data;
    return Array.isArray(payload) ? payload : (payload?.results ?? []);
  },

  createVariante: async (payload: Partial<ProductoVariante>): Promise<ProductoVariante> => {
    const { data } = await api.post('/variantes/variantes/', payload);
    return data?.data || data;
  }
};
