import { prisma } from "@/lib/prisma";
import { EstadoBadge } from "@/components/ui/Badge";
import { formatDateTime } from "@/lib/utils";
import { DonutChart } from "@/components/ui/DonutChart";
import { EstadoHerramienta } from "@/generated/prisma/client";
import { ESTADO_HERRAMIENTA_LABELS } from "@/lib/utils";

export const dynamic = "force-dynamic";

export default async function ReportesPage() {
  const [herramientasPorEstado, herramientasPorCategoria, usuariosConHerramientas, transaccionesRecientes] =
    await Promise.all([
      prisma.herramienta.groupBy({
        by: ["estado_actual"],
        _count: { id: true },
      }),
      prisma.herramienta.groupBy({
        by: ["categoria_id"],
        _count: { id: true },
        orderBy: { _count: { id: "desc" } },
      }),
      prisma.usuario.findMany({
        where: {
          transaccionesComoResponsable: {
            some: {
              tipo: "ENTREGA",
              herramienta: { estado_actual: "PRESTADA" },
            },
          },
        },
        include: {
          transaccionesComoResponsable: {
            where: {
              tipo: "ENTREGA",
              herramienta: { estado_actual: "PRESTADA" },
            },
            include: {
              herramienta: { select: { nombre: true, codigo_qr: true } },
            },
            orderBy: { fecha_hora: "desc" },
          },
        },
      }),
      prisma.transaccion.findMany({
        take: 10,
        orderBy: { fecha_hora: "desc" },
        include: {
          herramienta: { select: { nombre: true } },
          usuario_responsable: { select: { nombre_completo: true } },
        },
      }),
    ]);

  const categorias = await prisma.categoria.findMany();
  const categoriaMap = Object.fromEntries(categorias.map((c) => [c.id, c.nombre]));

  const totalHerramientas = herramientasPorEstado.reduce((acc, h) => acc + h._count.id, 0);

  // Chart data
  const estadoChartData = herramientasPorEstado.map((g) => ({
    label: ESTADO_HERRAMIENTA_LABELS[g.estado_actual as EstadoHerramienta],
    value: g._count.id,
    color: getEstadoColor(g.estado_actual as EstadoHerramienta),
  }));

  return (
    <div className="min-h-screen">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-slate-800">Reportes</h1>
        <p className="text-slate-500 mt-1">Resumen de inventario y estado del sistema</p>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-8">
        {herramientasPorEstado.map((g) => {
          const estado = g.estado_actual as EstadoHerramienta;
          const porcentaje = Math.round((g._count.id / totalHerramientas) * 100) || 0;
          return (
            <div key={g.estado_actual} className={`rounded-xl border p-4 ${getEstadoBgClass(estado)}`}>
              <p className="text-sm font-medium opacity-80">{ESTADO_HERRAMIENTA_LABELS[estado]}</p>
              <div className="flex items-end justify-between mt-1">
                <p className="text-2xl font-bold">{g._count.id}</p>
                <p className="text-sm opacity-60">{porcentaje}%</p>
              </div>
            </div>
          );
        })}
      </div>

      {/* Charts Row */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
        {/* Estado Distribution */}
        <div className="bg-white rounded-2xl shadow-sm border border-slate-100 overflow-hidden">
          <div className="p-6 border-b border-slate-100">
            <h2 className="text-base font-semibold text-slate-800">Distribución por Estado</h2>
            <p className="text-sm text-slate-500 mt-1">Estado actual de las herramientas</p>
          </div>
          <div className="p-6">
            {estadoChartData.length > 0 ? (
              <div className="flex items-center justify-center">
                <DonutChart data={estadoChartData} size={200} showLegend={false} centerValue={totalHerramientas} centerLabel="Total" />
              </div>
            ) : (
              <div className="py-12 text-center text-slate-400">
                <p>No hay herramientas registradas</p>
              </div>
            )}
          </div>
        </div>

        {/* By Category */}
        <div className="bg-white rounded-2xl shadow-sm border border-slate-100 overflow-hidden">
          <div className="p-6 border-b border-slate-100">
            <h2 className="text-base font-semibold text-slate-800">Herramientas por Categoría</h2>
            <p className="text-sm text-slate-500 mt-1">Distribución por tipo de herramienta</p>
          </div>
          <div className="p-6 space-y-4">
            {herramientasPorCategoria.length > 0 ? (
              herramientasPorCategoria.slice(0, 6).map((g, idx) => {
                const total = herramientasPorCategoria.reduce((acc, c) => acc + c._count.id, 0);
                const porcentaje = Math.round((g._count.id / total) * 100) || 0;
                return (
                  <div key={g.categoria_id}>
                    <div className="flex items-center justify-between mb-1">
                      <span className="text-sm font-medium text-slate-700">{categoriaMap[g.categoria_id] || "Sin categoría"}</span>
                      <span className="text-sm font-semibold text-slate-800">{g._count.id}</span>
                    </div>
                    <div className="h-2 bg-slate-100 rounded-full overflow-hidden">
                      <div className="h-full rounded-full transition-all" style={{ width: `${porcentaje}%`, backgroundColor: getCategoriaColor(idx) }} />
                    </div>
                  </div>
                );
              })
            ) : (
              <div className="py-8 text-center text-slate-400">
                <p>No hay datos disponibles</p>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Paz y Salvo */}
      <div className="bg-white rounded-2xl shadow-sm border border-slate-100 overflow-hidden mb-8">
        <div className="p-6 border-b border-slate-100">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-red-100 rounded-xl flex items-center justify-center">
              <svg className="w-5 h-5 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
              </svg>
            </div>
            <div>
              <h2 className="text-base font-semibold text-slate-800">Herramientas Pendientes</h2>
              <p className="text-sm text-slate-500">Usuarios con herramientas prestadas sin devolver</p>
            </div>
          </div>
        </div>

        {usuariosConHerramientas.length === 0 ? (
          <div className="py-12 text-center">
            <div className="w-16 h-16 bg-emerald-100 rounded-2xl flex items-center justify-center mx-auto mb-4">
              <svg className="w-8 h-8 text-emerald-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
            <h3 className="text-lg font-semibold text-slate-800 mb-1">¡Todo en orden!</h3>
            <p className="text-slate-500">No hay herramientas pendientes de devolución</p>
          </div>
        ) : (
          <div className="divide-y divide-slate-50">
            {usuariosConHerramientas.map((u) => (
              <div key={u.id} className="p-5">
                <div className="flex items-start justify-between mb-3">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-blue-600 rounded-xl flex items-center justify-center text-white font-bold">
                      {u.nombre_completo.split(" ").slice(0, 2).map(n => n[0]).join("")}
                    </div>
                    <div>
                      <p className="font-semibold text-slate-800">{u.nombre_completo}</p>
                      <p className="text-sm text-slate-400">{u.transaccionesComoResponsable.length} herramienta(s) prestada(s)</p>
                    </div>
                  </div>
                  <span className="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium bg-red-100 text-red-700">
                    Pendiente
                  </span>
                </div>
                <div className="ml-13 space-y-2">
                  {u.transaccionesComoResponsable.map((t) => (
                    <div key={t.id} className="flex items-center gap-2 text-sm text-slate-600 bg-slate-50 rounded-lg px-3 py-2">
                      <svg className="w-4 h-4 text-red-400 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
                      </svg>
                      <span className="font-medium">{t.herramienta.nombre}</span>
                      <span className="text-slate-400 font-mono text-xs">{t.herramienta.codigo_qr}</span>
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Recent Transactions */}
      <div className="bg-white rounded-2xl shadow-sm border border-slate-100 overflow-hidden">
        <div className="p-6 border-b border-slate-100">
          <h2 className="text-base font-semibold text-slate-800">Últimas Transacciones</h2>
          <p className="text-sm text-slate-500 mt-1">Actividad reciente del sistema</p>
        </div>

        {transaccionesRecientes.length === 0 ? (
          <div className="py-12 text-center">
            <p className="text-slate-400">No hay transacciones recientes</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-slate-100 bg-slate-50/50">
                  <th className="text-left px-6 py-3 text-slate-500 font-semibold">Herramienta</th>
                  <th className="text-left px-6 py-3 text-slate-500 font-semibold">Tipo</th>
                  <th className="text-left px-6 py-3 text-slate-500 font-semibold">Responsable</th>
                  <th className="text-left px-6 py-3 text-slate-500 font-semibold">Fecha</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-50">
                {transaccionesRecientes.map((t) => (
                  <tr key={t.id} className="hover:bg-slate-50/50 transition-colors">
                    <td className="px-6 py-4">
                      <p className="font-medium text-slate-800">{t.herramienta.nombre}</p>
                    </td>
                    <td className="px-6 py-4">
                      <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium ${
                        t.tipo === "ENTREGA" ? "bg-blue-100 text-blue-700" : "bg-emerald-100 text-emerald-700"
                      }`}>
                        {t.tipo === "ENTREGA" ? "Entrega" : "Devolución"}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-slate-600">{t.usuario_responsable.nombre_completo}</td>
                    <td className="px-6 py-4 text-slate-500">{formatDateTime(t.fecha_hora)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}

function getEstadoColor(estado: EstadoHerramienta): string {
  const colors: Record<EstadoHerramienta, string> = {
    DISPONIBLE: "#22c55e",
    PRESTADA: "#3b82f6",
    MANTENIMIENTO: "#f59e0b",
    DANADA: "#ef4444",
    PERDIDA: "#6b7280",
  };
  return colors[estado];
}

function getEstadoBgClass(estado: EstadoHerramienta): string {
  const classes: Record<EstadoHerramienta, string> = {
    DISPONIBLE: "bg-emerald-50 border-emerald-200 text-emerald-800",
    PRESTADA: "bg-blue-50 border-blue-200 text-blue-800",
    MANTENIMIENTO: "bg-amber-50 border-amber-200 text-amber-800",
    DANADA: "bg-red-50 border-red-200 text-red-800",
    PERDIDA: "bg-slate-50 border-slate-200 text-slate-800",
  };
  return classes[estado];
}

function getCategoriaColor(index: number): string {
  const colors = ["#3b82f6", "#22c55e", "#f59e0b", "#ef4444", "#8b5cf6", "#06b6d4"];
  return colors[index % colors.length];
}