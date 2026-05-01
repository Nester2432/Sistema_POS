export interface Atributo {
  id: string;
  nombre: string;
  activo: boolean;
  valores: ValorAtributo[];
}

export interface ValorAtributo {
  id: string;
  atributo: string;
  valor: string;
}

export interface VarianteValor {
  id: string;
  atributo: string;
  atributo_nombre: string;
  valor: string;
  valor_nombre: string;
}

export interface ProductoVariante {
  id: string;
  producto_padre: string;
  sku: string;
  codigo_barras: string;
  precio_costo: string;
  precio_venta: string;
  activo: boolean;
  valores_detalle: VarianteValor[];
  nombre_completo: string;
  stock_actual?: number; // Para mostrar en el POS/Inventario
}
