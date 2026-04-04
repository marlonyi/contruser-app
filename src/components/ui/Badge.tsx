import { EstadoHerramienta } from "@/generated/prisma/client";
import { ESTADO_HERRAMIENTA_COLORS, ESTADO_HERRAMIENTA_LABELS } from "@/lib/utils";

interface BadgeProps {
  label: string;
  color?: string;
  size?: "sm" | "md";
  dot?: boolean;
}

export function Badge({ label, color = "bg-slate-100 text-slate-700", size = "sm", dot }: BadgeProps) {
  return (
    <span
      className={`
        inline-flex items-center gap-1.5 font-medium rounded-full
        ${size === "sm" ? "px-2.5 py-0.5 text-xs" : "px-3 py-1 text-sm"}
        ${color}
      `}
    >
      {dot && (
        <span className={`w-1.5 h-1.5 rounded-full ${color.includes("bg-") ? color.split(" ")[0].replace("bg-", "bg-") : "bg-current"}`} />
      )}
      {label}
    </span>
  );
}

interface EstadoBadgeProps {
  estado: EstadoHerramienta;
  size?: "sm" | "md";
}

export function EstadoBadge({ estado, size = "sm" }: EstadoBadgeProps) {
  const baseColor = ESTADO_HERRAMIENTA_COLORS[estado];
  // Convert to more vibrant colors
  const vibrantColors: Record<EstadoHerramienta, string> = {
    DISPONIBLE: "bg-emerald-100 text-emerald-700 border border-emerald-200",
    PRESTADA: "bg-blue-100 text-blue-700 border border-blue-200",
    MANTENIMIENTO: "bg-amber-100 text-amber-700 border border-amber-200",
    DANADA: "bg-red-100 text-red-700 border border-red-200",
    PERDIDA: "bg-slate-100 text-slate-600 border border-slate-200",
  };

  return (
    <span
      className={`
        inline-flex items-center gap-1.5 font-medium rounded-full
        ${size === "sm" ? "px-2.5 py-0.5 text-xs" : "px-3 py-1 text-sm"}
        ${vibrantColors[estado]}
      `}
    >
      <span className={`w-1.5 h-1.5 rounded-full ${vibrantColors[estado].split(" ")[0].replace("bg-", "bg-").replace("100", "500")}`} />
      {ESTADO_HERRAMIENTA_LABELS[estado]}
    </span>
  );
}

// Specialized badges for different contexts
export function RoleBadge({ rol }: { rol: string }) {
  const roleStyles: Record<string, string> = {
    ADMIN: "bg-gradient-to-r from-purple-100 to-purple-200 text-purple-700 border border-purple-200",
    ENCARGADO: "bg-gradient-to-r from-blue-100 to-blue-200 text-blue-700 border border-blue-200",
    EMPLEADO: "bg-gradient-to-r from-slate-100 to-slate-200 text-slate-700 border border-slate-200",
    CLIENTE: "bg-gradient-to-r from-orange-100 to-orange-200 text-orange-700 border border-orange-200",
  };

  const roleLabels: Record<string, string> = {
    ADMIN: "Administrador",
    ENCARGADO: "Encargado",
    EMPLEADO: "Empleado",
    CLIENTE: "Cliente",
  };

  return (
    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${roleStyles[rol] || "bg-slate-100 text-slate-700"}`}>
      {roleLabels[rol] || rol}
    </span>
  );
}

export function TransactionBadge({ tipo }: { tipo: "ENTREGA" | "DEVOLUCION" }) {
  const styles = {
    ENTREGA: "bg-gradient-to-r from-blue-100 to-blue-200 text-blue-700 border border-blue-200",
    DEVOLUCION: "bg-gradient-to-r from-emerald-100 to-emerald-200 text-emerald-700 border border-emerald-200",
  };

  const labels = {
    ENTREGA: "Entrega",
    DEVOLUCION: "Devolución",
  };

  return (
    <span className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-medium ${styles[tipo]}`}>
      {tipo === "ENTREGA" ? (
        <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7h12m0 0l-4-4m4 4l-4 4m0 6H4m0 0l4 4m-4-4l4-4" />
        </svg>
      ) : (
        <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
        </svg>
      )}
      {labels[tipo]}
    </span>
  );
}

export function MaintenanceBadge({ tipo }: { tipo: "PREVENTIVO" | "CORRECTIVO" }) {
  const styles = {
    PREVENTIVO: "bg-gradient-to-r from-amber-100 to-amber-200 text-amber-700 border border-amber-200",
    CORRECTIVO: "bg-gradient-to-r from-red-100 to-red-200 text-red-700 border border-red-200",
  };

  const labels = {
    PREVENTIVO: "Preventivo",
    CORRECTIVO: "Correctivo",
  };

  return (
    <span className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-medium ${styles[tipo]}`}>
      {tipo === "PREVENTIVO" ? (
        <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-2.332 9-7.031 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
        </svg>
      ) : (
        <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
        </svg>
      )}
      {labels[tipo]}
    </span>
  );
}