import { prisma } from "@/lib/prisma";
import { EstadoBadge } from "@/components/ui/Badge";
import { formatDateTime } from "@/lib/utils";

export const dynamic = "force-dynamic";

export default async function PrestamosPage() {
  const transacciones = await prisma.transaccion.findMany({
    orderBy: { fecha_hora: "desc" },
    include: {
      herramienta: { select: { nombre: true, codigo_qr: true } },
      usuario_responsable: { select: { nombre_completo: true, documento: true } },
      encargado: { select: { nombre_completo: true } },
    },
  });

  const activos = transacciones.filter((t) => t.tipo === "ENTREGA");
  const devoluciones = transacciones.filter((t) => t.tipo === "DEVOLUCION");

  return (
    <div>
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-2xl font-bold text-slate-800">Préstamos y Devoluciones</h1>
          <p className="text-slate-500 mt-1">
            {activos.length} entregas · {devoluciones.length} devoluciones registradas
          </p>
        </div>
        <a
          href="/dashboard/prestamos/nuevo"
          className="inline-flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white font-medium px-4 py-2.5 rounded-lg text-sm transition"
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
          </svg>
          Registrar Transacción
        </a>
      </div>

      <div className="bg-white rounded-2xl shadow-sm border border-slate-100 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-slate-100 bg-slate-50">
                <th className="text-left px-6 py-3 text-slate-500 font-medium">Herramienta</th>
                <th className="text-left px-6 py-3 text-slate-500 font-medium">Tipo</th>
                <th className="text-left px-6 py-3 text-slate-500 font-medium">Responsable</th>
                <th className="text-left px-6 py-3 text-slate-500 font-medium">Encargado</th>
                <th className="text-left px-6 py-3 text-slate-500 font-medium">Estado c/momento</th>
                <th className="text-left px-6 py-3 text-slate-500 font-medium">Fecha</th>
                <th className="text-left px-6 py-3 text-slate-500 font-medium">Observaciones</th>
              </tr>
            </thead>
            <tbody>
              {transacciones.length === 0 ? (
                <tr>
                  <td colSpan={7} className="text-center py-12 text-slate-400">
                    No hay transacciones registradas
                  </td>
                </tr>
              ) : (
                transacciones.map((t) => (
                  <tr key={t.id} className="border-b border-slate-50 hover:bg-slate-50 transition">
                    <td className="px-6 py-3">
                      <div className="font-medium text-slate-800">{t.herramienta.nombre}</div>
                      <div className="text-xs text-slate-400 font-mono">{t.herramienta.codigo_qr}</div>
                    </td>
                    <td className="px-6 py-3">
                      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                        t.tipo === "ENTREGA"
                          ? "bg-blue-100 text-blue-800"
                          : "bg-green-100 text-green-800"
                      }`}>
                        {t.tipo === "ENTREGA" ? "Entrega" : "Devolución"}
                      </span>
                    </td>
                    <td className="px-6 py-3 text-slate-700">{t.usuario_responsable.nombre_completo}</td>
                    <td className="px-6 py-3 text-slate-600">{t.encargado.nombre_completo}</td>
                    <td className="px-6 py-3">
                      <EstadoBadge estado={t.estado_herramienta_momento} />
                    </td>
                    <td className="px-6 py-3 text-slate-500 whitespace-nowrap">
                      {formatDateTime(t.fecha_hora)}
                    </td>
                    <td className="px-6 py-3 text-slate-500 max-w-xs truncate">
                      {t.observaciones || "—"}
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
