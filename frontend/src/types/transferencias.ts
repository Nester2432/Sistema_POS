export type EstadoTransferencia = 'BORRADOR' | 'CONFIRMADA' | 'CANCELADA';

export interface TransferenciaItem {
  id?: number;
  producto: string; // UUID
  producto_nombre?: string;
  producto_sku?: string;
  cantidad: number | string;
}

export interface Transferencia {
  id: string; // UUID
  numero_transferencia: string | null;
  sucursal_origen: string;
  sucursal_origen_nombre: string;
  sucursal_destino: string;
  sucursal_destino_nombre: string;
  usuario: string;
  usuario_nombre: string;
  estado: EstadoTransferencia;
  observaciones: string;
  fecha: string;
  items: TransferenciaItem[];
}

export interface TransferenciaCreatePayload {
  sucursal_origen?: string;
  sucursal_destino: string;
  observaciones: string;
  items: {
    producto: string;
    cantidad: number;
  }[];
}
