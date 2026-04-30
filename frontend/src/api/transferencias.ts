import api from './axios';
import type { Transferencia, TransferenciaCreatePayload } from '../types/transferencias';

export const transferenciasApi = {
  getAll: async (): Promise<Transferencia[]> => {
    const { data } = await api.get('/transferencias/');
    // Backend envuelve: {data: {count, results:[]}}
    const payload = data?.data;
    return Array.isArray(payload) ? payload : (payload?.results ?? []);
  },

  getById: async (id: string): Promise<Transferencia> => {
    const { data } = await api.get(`/transferencias/${id}/`);
    return data;
  },

  create: async (payload: TransferenciaCreatePayload): Promise<Transferencia> => {
    const { data } = await api.post('/transferencias/', payload);
    return data;
  },

  confirmar: async (id: string): Promise<Transferencia> => {
    const { data } = await api.post(`/transferencias/${id}/confirmar/`);
    return data;
  },

  cancelar: async (id: string): Promise<Transferencia> => {
    const { data } = await api.post(`/transferencias/${id}/cancelar/`);
    return data;
  }
};
