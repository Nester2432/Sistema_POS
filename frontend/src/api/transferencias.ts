import api from './axios';
import type { Transferencia, TransferenciaCreatePayload } from '../types/transferencias';

export const transferenciasApi = {
  getAll: async (): Promise<Transferencia[]> => {
    const { data } = await api.get('/transferencias/');
    // La API puede devolver {count, results:[]} si hay paginación global
    return Array.isArray(data) ? data : (data.results ?? []);
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
