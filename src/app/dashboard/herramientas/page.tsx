import { prisma } from "@/lib/prisma";
import Link from "next/link";
import { EstadoBadge } from "@/components/ui/Badge";
import { formatCurrency, formatDate } from "@/lib/utils";

export const dynamic = "force-dynamic";

export default async function HerramientasPage() {
  const herramientas = await prisma.herramienta.findMany({
    orderBy: { createdAt: "desc" },
    include: { categoria: true },
  });

  return (
    <div>
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-2xl font-bold text-slate-800">Herramientas</h1>
          <p className="text-slate-500 mt-1">Inventario completo de herramientas</p>
        </div>
        <Link
          href="/dashboard/herramientas/nueva"
          className="inline-flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white font-medium px-4 py-2.5 rounded-lg text-sm transition"
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
          </svg>
          Nueva Herramienta
        </Link>
      </div>

      <div className="bg-white rounded-2xl shadow-sm border border-slate-100 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-slate-100 bg-slate-50">
                <th className="text-left px-6 py-3 text-slate-500 font-medium">Nombre</th>
                <th className="text-left px-6 py-3 text-slate-500 font-medium">Categoría</th>
                <th className="text-left px-6 py-3 text-slate-500 font-medium">Marca / Modelo</th>
                <th className="text-left px-6 py-3 text-slate-500 font-medium">Estado</th>
                <th className="text-left px-6 py-3 text-slate-500 font-medium">Valor Compra</th>
                <th className="text-left px-6 py-3 text-slate-500 font-medium">Fecha Compra</th>
                <th className="text-left px-6 py-3 text-slate-500 font-medium">Acciones</th>
              </tr>
            </thead>
            <tbody>
              {herramientas.length === 0 ? (
                <tr>
                  <td colSpan={7} className="text-center py-12 text-slate-400">
                    <svg className="w-12 h-12 mx-auto mb-3 text-slate-200" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5}
                        d="M20 13V6a2 2 0 00-2-2H6a2 2 0 00-2 2v7m16 0v5a2 2 0 01-2 2H6a2 2 0 01-2-2v-5m16 0h-2.586a1 1 0 00-.707.293l-2.414 2.414a1 1 0 01-.707.293h-3.172a1 1 0 01-.707-.293l-2.414-2.414A1 1 0 006.586 13H4" />
                    </svg>
                    No hay herramientas registradas
                  </td>
                </tr>
              ) : (
                herramientas.map((h) => (
                  <tr key={h.id} className="border-b border-slate-50 hover:bg-slate-50 transition">
                    <td className="px-6 py-3">
                      <div className="font-medium text-slate-800">{h.nombre}</div>
                      <div className="text-xs text-slate-400 font-mono">{h.codigo_qr}</div>
                    </td>
                    <td className="px-6 py-3 text-slate-600">{h.categoria.nombre}</td>
                    <td className="px-6 py-3 text-slate-600">
                      {[h.marca, h.modelo].filter(Boolean).join(" / ") || "—"}
                    </td>
                    <td className="px-6 py-3">
                      <EstadoBadge estado={h.estado_actual} />
                    </td>
                    <td className="px-6 py-3 text-slate-600">
                      {formatCurrency(h.valor_compra ? Number(h.valor_compra) : null)}
                    </td>
                    <td className="px-6 py-3 text-slate-600">{formatDate(h.fecha_compra)}</td>
                    <td className="px-6 py-3">
                      <Link
                        href={`/dashboard/herramientas/${h.id}`}
                        className="text-blue-600 hover:text-blue-800 font-medium text-sm"
                      >
                        Ver detalle →
                      </Link>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
