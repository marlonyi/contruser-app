import { EstadoHerramienta, Rol } from "@/generated/prisma/client";

export function formatCurrency(value: number | null | undefined): string {
  if (value === null || value === undefined) return "$ 0";
  return new Intl.NumberFormat("es-CO", {
    style: "currency",
    currency: "COP",
    minimumFractionDigits: 0,
  }).format(value);
}

export function formatDate(date: Date | string | null | undefined): string {
  if (!date) return "—";
  return new Intl.DateTimeFormat("es-CO", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
  }).format(new Date(date));
}

export function formatDateTime(date: Date | string | null | undefined): string {
  if (!date) return "—";
  return new Intl.DateTimeFormat("es-CO", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  }).format(new Date(date));
}

export const ESTADO_HERRAMIENTA_LABELS: Record<EstadoHerramienta, string> = {
  DISPONIBLE: "Disponible",
  PRESTADA: "Prestada",
  MANTENIMIENTO: "En Mantenimiento",
  DANADA: "Dañada",
  PERDIDA: "Perdida",
};

export const ESTADO_HERRAMIENTA_COLORS: Record<EstadoHerramienta, string> = {
  DISPONIBLE: "bg-green-100 text-green-800",
  PRESTADA: "bg-blue-100 text-blue-800",
  MANTENIMIENTO: "bg-yellow-100 text-yellow-800",
  DANADA: "bg-red-100 text-red-800",
  PERDIDA: "bg-gray-100 text-gray-800",
};

export const ROL_LABELS: Record<Rol, string> = {
  ADMIN: "Administrador",
  ENCARGADO: "Encargado de Almacén",
  EMPLEADO: "Empleado / Técnico",
  CLIENTE: "Cliente",
};

export function generateQRCode(id: number): string {
  return `CONTRUSER-TOOL-${id}-${Date.now()}`;
}
