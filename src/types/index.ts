import type {
  Rol,
  EstadoUsuario,
  EstadoHerramienta,
  TipoTransaccion,
  TipoMantenimiento,
} from "@/generated/prisma/client";

export type { Rol, EstadoUsuario, EstadoHerramienta, TipoTransaccion, TipoMantenimiento };

export interface UsuarioDTO {
  id: number;
  nombre_completo: string;
  documento: string;
  email: string;
  telefono?: string | null;
  direccion?: string | null;
  rol: Rol;
  estado: EstadoUsuario;
}

export interface CategoriaDTO {
  id: number;
  nombre: string;
  descripcion?: string | null;
}

export interface HerramientaDTO {
  id: number;
  codigo_qr: string;
  nombre: string;
  marca?: string | null;
  modelo?: string | null;
  fecha_compra?: Date | null;
  valor_compra?: number | null;
  estado_actual: EstadoHerramienta;
  categoria: CategoriaDTO;
}

export interface TransaccionDTO {
  id: number;
  tipo: TipoTransaccion;
  fecha_hora: Date;
  observaciones?: string | null;
  estado_herramienta_momento: EstadoHerramienta;
  herramienta: HerramientaDTO;
  usuario_responsable: UsuarioDTO;
  encargado: UsuarioDTO;
}

export interface MantenimientoDTO {
  id: number;
  tipo: TipoMantenimiento;
  fecha_inicio: Date;
  fecha_fin?: Date | null;
  costo?: number | null;
  observaciones?: string | null;
  herramienta: HerramientaDTO;
  tecnico: UsuarioDTO;
}

export interface DashboardStats {
  totalHerramientas: number;
  disponibles: number;
  prestadas: number;
  enMantenimiento: number;
  danadas: number;
  perdidas: number;
  totalUsuarios: number;
}
