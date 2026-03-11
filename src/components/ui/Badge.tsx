import { EstadoHerramienta } from "@/generated/prisma/client";
import { ESTADO_HERRAMIENTA_COLORS, ESTADO_HERRAMIENTA_LABELS } from "@/lib/utils";

interface BadgeProps {
  estado: EstadoHerramienta;
}

export function EstadoBadge({ estado }: BadgeProps) {
  return (
    <span
      className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${ESTADO_HERRAMIENTA_COLORS[estado]}`}
    >
      {ESTADO_HERRAMIENTA_LABELS[estado]}
    </span>
  );
}

interface GenericBadgeProps {
  label: string;
  color?: string;
}

export function Badge({ label, color = "bg-slate-100 text-slate-700" }: GenericBadgeProps) {
  return (
    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${color}`}>
      {label}
    </span>
  );
}
