// Tipos que reflejan las entidades del backend NestJS (back-wonder)

// ─── Categoria → GET /categorias ──────────────────────────────────────────────
export interface Categoria {
  id: number;
  nombre: string;
  descripcion?: string;
  imagen_url?: string;
  activa: boolean;
  created_at: string;
  updated_at: string;
}

// ─── Producto → GET /productos ────────────────────────────────────────────────
export interface Producto {
  id: number;
  nombre: string;
  descripcion?: string;
  categoria_id: number;
  precio_costo?: number;
  precio_venta: number;
  stock: number;
  stock_minimo: number;
  marca?: string;
  gradacion_alcoholica?: number;
  volumen_ml?: number;
  tipo_bebida?: string;
  pais_origen?: string;
  imagen_url?: string;
  imagenes_adicionales?: string;
  activo: boolean;
  destacado: boolean;
  created_at: string;
  updated_at: string;
  categoria?: Categoria;
}

// ─── Respuesta del backend para /carrito ──────────────────────────────────────
export interface BackendCarritoItem {
  id: number;
  usuario_id: string;
  producto_id: number;
  cantidad: number;
  precio_unitario: number;
  producto?: {
    id: number;
    nombre: string;
    imagen_url?: string;
    precio_venta: number;
    stock: number;
    activo: boolean;
  };
}

// ─── Estado local del carrito ─────────────────────────────────────────────────
export interface CartItem {
  id: number;          // id del ítem en la tabla carrito
  producto_id: number; // id del producto (para checkout)
  nombre: string;
  precio: number;
  imagen: string | null;
  cantidad: number;
}

// ─── Carrusel de Imágenes ──────────────────────────────────────────────────────
export interface CarruselImagen {
  id: number;
  imagen_url: string;
  titulo?: string;
  descripcion?: string;
  link_url?: string;
  orden: number;
  activo: boolean;
  created_at: string;
  updated_at: string;
}
