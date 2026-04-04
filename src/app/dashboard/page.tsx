import { prisma } from "@/lib/prisma";
import { StatCard } from "@/components/ui/StatCard";
import { EstadoBadge } from "@/components/ui/Badge";
import { DonutChart } from "@/components/ui/DonutChart";
import { EstadoHerramienta } from "@/generated/prisma/client";
import { ESTADO_HERRAMIENTA_LABELS, ESTADO_HERRAMIENTA_COLORS, ROL_LABELS } from "@/lib/utils";

export const dynamic = "force-dynamic";

async function getStats() {
  const [herramientas, usuarios, transaccionesHoy, categoriasStats, transaccionesRecientes] = await Promise.all([
    prisma.herramienta.groupBy({
      by: ["estado_actual"],
      _count: { id: true },
    }),
    prisma.usuario.groupBy({
      by: ["rol"],
      _count: { id: true },
      where: { estado: "ACTIVO" },
    }),
    prisma.transaccion.count({
      where: {
        fecha_hora: { gte: new Date(new Date().setHours(0, 0, 0, 0)) },
      },
    }),
    prisma.categoria.findMany({
      select: {
        id: true,
        nombre: true,
        _count: { select: { herramientas: true } },
      },
      orderBy: { herramientas: { _count: "desc" } },
      take: 6,
    }),
    prisma.transaccion.findMany({
      take: 6,
      orderBy: { fecha_hora: "desc" },
      include: {
        herramienta: { select: { nombre: true, codigo_qr: true } },
        usuario_responsable: { select: { nombre_completo: true } },
      },
    }),
  ]);

  const counts: Record<EstadoHerramienta, number> = {
    DISPONIBLE: 0,
    PRESTADA: 0,
    MANTENIMIENTO: 0,
    DANADA: 0,
    PERDIDA: 0,
  };
  let totalHerramientas = 0;
  for (const g of herramientas) {
    counts[g.estado_actual] = g._count.id;
    totalHerramientas += g._count.id;
  }

  const usuariosPorRol = Object.fromEntries(usuarios.map((u) => [u.rol, u._count.id]));
  const totalUsuarios = Object.values(usuariosPorRol).reduce((a, b) => a + b, 0);

  return {
    counts,
    totalHerramientas,
    totalUsuarios,
    transaccionesHoy,
    usuariosPorRol,
    categoriasStats,
    transaccionesRecientes,
  };
}

export default async function DashboardPage() {
  const { counts, totalHerramientas, totalUsuarios, transaccionesHoy, usuariosPorRol, categoriasStats, transaccionesRecientes } =
    await getStats();

  // Datos para el gráfico de estados
  const estadoChartData = Object.entries(counts)
    .filter(([_, count]) => count > 0)
    .map(([estado, count]) => ({
      label: ESTADO_HERRAMIENTA_LABELS[estado as EstadoHerramienta],
      value: count,
      color: getEstadoColor(estado as EstadoHerramienta),
    }));

  // Datos para el gráfico de categorías
  const categoriaChartData = categoriasStats
    .filter((c) => c._count.herramientas > 0)
    .map((c, idx) => ({
      label: c.nombre,
      value: c._count.herramientas,
      color: getCategoriaColor(idx),
    }));

  return (
    <div className="min-h-screen">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-slate-800">Dashboard</h1>
        <p className="text-slate-500 mt-1">Resumen general del inventario de herramientas</p>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-5 mb-8">
        <StatCard
          title="Total Herramientas"
          value={totalHerramientas}
          color="bg-gradient-to-br from-blue-500 to-blue-600"
          icon={
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
            </svg>
          }
          subtitle="En inventario"
        />
        <StatCard
          title="Disponibles"
          value={counts.DISPONIBLE}
          color="bg-gradient-to-br from-emerald-500 to-emerald-600"
          icon={
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          }
          subtitle={`${Math.round((counts.DISPONIBLE / totalHerramientas) * 100) || 0}% del total`}
        />
        <StatCard
          title="Prestadas"
          value={counts.PRESTADA}
          color="bg-gradient-to-br from-blue-500 to-blue-600"
          icon={
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7h12m0 0l-4-4m4 4l-4 4m0 6H4m0 0l4 4m-4-4l4-4" />
            </svg>
          }
          subtitle={`${transaccionesHoy} transacciones hoy`}
        />
        <StatCard
          title="En Mantenimiento"
          value={counts.MANTENIMIENTO}
          color="bg-gradient-to-br from-amber-500 to-amber-600"
          icon={
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
            </svg>
          }
        />
      </div>

      {/* Secondary Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-5 mb-8">
        <StatCard
          title="Usuarios Activos"
          value={totalUsuarios}
          color="bg-gradient-to-br from-purple-500 to-purple-600"
          icon={
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0z" />
            </svg>
          }
        />
        <StatCard
          title="Dañadas"
          value={counts.DANADA}
          color="bg-gradient-to-br from-red-500 to-red-600"
          icon={
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
            </svg>
          }
        />
        <StatCard
          title="Perdidas"
          value={counts.PERDIDA}
          color="bg-gradient-to-br from-slate-500 to-slate-600"
          icon={
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8.228 9c.549-1.165 2.03-2 3.772-2 2.21 0 4 1.343 4 3 0 1.4-1.278 2.575-3.006 2.907-.542.104-.994.54-.994 1.093m0 3h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          }
        />
      </div>

      {/* Charts Row */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
        {/* Estado Chart */}
        <div className="bg-white rounded-2xl shadow-sm border border-slate-100 overflow-hidden">
          <div className="p-6 border-b border-slate-100">
            <h2 className="text-base font-semibold text-slate-800">Estado de Herramientas</h2>
            <p className="text-sm text-slate-500 mt-1">Distribución por estado actual</p>
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
            <div className="mt-6 grid grid-cols-2 sm:grid-cols-3 gap-3">
              {Object.entries(counts).map(([estado, count]) => (
                <div key={estado} className="flex items-center gap-2 p-2 rounded-lg bg-slate-50">
                  <div className={`w-3 h-3 rounded-full ${getEstadoBgColor(estado as EstadoHerramienta)}`} />
                  <div className="flex-1 min-w-0">
                    <p className="text-xs text-slate-500 truncate">{ESTADO_HERRAMIENTA_LABELS[estado as EstadoHerramienta]}</p>
                    <p className="text-sm font-semibold text-slate-800">{count}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Categories Chart */}
        <div className="bg-white rounded-2xl shadow-sm border border-slate-100 overflow-hidden">
          <div className="p-6 border-b border-slate-100">
            <h2 className="text-base font-semibold text-slate-800">Herramientas por Categoría</h2>
            <p className="text-sm text-slate-500 mt-1">Top categorías del inventario</p>
          </div>
          <div className="p-6">
            {categoriaChartData.length > 0 ? (
              <>
                <div className="flex items-center justify-center mb-6">
                  <DonutChart data={categoriaChartData} size={200} showLegend={false} />
                </div>
                <div className="space-y-3">
                  {categoriasStats.slice(0, 5).map((cat, idx) => {
                    const total = categoriasStats.reduce((acc, c) => acc + c._count.herramientas, 0);
                    const percentage = Math.round((cat._count.herramientas / total) * 100) || 0;
                    return (
                      <div key={cat.id} className="flex items-center gap-3">
                        <div className="w-3 h-3 rounded-full flex-shrink-0" style={{ backgroundColor: getCategoriaColor(idx) }} />
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center justify-between mb-1">
                            <span className="text-sm font-medium text-slate-700 truncate">{cat.nombre}</span>
                            <span className="text-sm font-semibold text-slate-800">{cat._count.herramientas}</span>
                          </div>
                          <div className="h-2 bg-slate-100 rounded-full overflow-hidden">
                            <div className="h-full rounded-full transition-all duration-500" style={{ width: `${percentage}%`, backgroundColor: getCategoriaColor(idx) }} />
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </>
            ) : (
              <div className="py-12 text-center text-slate-400">
                <p>No hay categorías con herramientas</p>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Bottom Row */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Recent Transactions */}
        <div className="bg-white rounded-2xl shadow-sm border border-slate-100 overflow-hidden">
          <div className="p-6 border-b border-slate-100 flex items-center justify-between">
            <div>
              <h2 className="text-base font-semibold text-slate-800">Últimas Transacciones</h2>
              <p className="text-sm text-slate-500 mt-1">Actividad reciente de préstamos</p>
            </div>
            <a href="/dashboard/prestamos" className="text-sm text-blue-600 hover:text-blue-700 font-medium">
              Ver todas →
            </a>
          </div>
          <div className="divide-y divide-slate-50">
            {transaccionesRecientes.length === 0 ? (
              <div className="py-12 text-center">
                <div className="w-12 h-12 bg-slate-100 rounded-full flex items-center justify-center mx-auto mb-3">
                  <svg className="w-6 h-6 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7h12m0 0l-4-4m4 4l-4 4m0 6H4m0 0l4 4m-4-4l4-4" />
                  </svg>
                </div>
                <p className="text-slate-500">No hay transacciones recientes</p>
              </div>
            ) : (
              transaccionesRecientes.map((t) => (
                <div key={t.id} className="p-4 flex items-center gap-4 hover:bg-slate-50 transition-colors">
                  <div className={`w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0 ${t.tipo === "ENTREGA" ? "bg-blue-100" : "bg-emerald-100"}`}>
                    {t.tipo === "ENTREGA" ? (
                      <svg className="w-5 h-5 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7h12m0 0l-4-4m4 4l-4 4m0 6H4m0 0l4 4m-4-4l4-4" />
                      </svg>
                    ) : (
                      <svg className="w-5 h-5 text-emerald-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                      </svg>
                    )}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="font-medium text-slate-800 truncate">{t.herramienta.nombre}</p>
                    <p className="text-sm text-slate-500 truncate">{t.usuario_responsable.nombre_completo}</p>
                  </div>
                  <div className="text-right flex-shrink-0">
                    <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${t.tipo === "ENTREGA" ? "bg-blue-100 text-blue-700" : "bg-emerald-100 text-emerald-700"}`}>
                      {t.tipo === "ENTREGA" ? "Entrega" : "Devolución"}
                    </span>
                    <p className="text-xs text-slate-400 mt-1">{formatTimeAgo(t.fecha_hora)}</p>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>

        {/* Users by Role */}
        <div className="bg-white rounded-2xl shadow-sm border border-slate-100 overflow-hidden">
          <div className="p-6 border-b border-slate-100 flex items-center justify-between">
            <div>
              <h2 className="text-base font-semibold text-slate-800">Usuarios por Rol</h2>
              <p className="text-sm text-slate-500 mt-1">Distribución de usuarios activos</p>
            </div>
            <a href="/dashboard/usuarios" className="text-sm text-blue-600 hover:text-blue-700 font-medium">
              Ver todos →
            </a>
          </div>
          <div className="p-6 space-y-4">
            {Object.entries(usuariosPorRol).map(([rol, count]) => (
              <div key={rol} className="flex items-center gap-4">
                <div className={`w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0 ${getRolBgColor(rol)}`}>
                  <span className="text-sm font-bold">{ROL_LABELS[rol as keyof typeof ROL_LABELS]?.charAt(0) || "?"}</span>
                </div>
                <div className="flex-1">
                  <p className="font-medium text-slate-800">{ROL_LABELS[rol as keyof typeof ROL_LABELS] || rol}</p>
                  <div className="mt-1 h-2 bg-slate-100 rounded-full overflow-hidden">
                    <div className={`h-full rounded-full ${getRolBarColor(rol)}`} style={{ width: `${(count / totalUsuarios) * 100}%` }} />
                  </div>
                </div>
                <div className="text-right flex-shrink-0">
                  <p className="text-lg font-bold text-slate-800">{count}</p>
                  <p className="text-xs text-slate-400">{Math.round((count / totalUsuarios) * 100) || 0}%</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

// Helper functions
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

function getEstadoBgColor(estado: EstadoHerramienta): string {
  const colors: Record<EstadoHerramienta, string> = {
    DISPONIBLE: "bg-emerald-500",
    PRESTADA: "bg-blue-500",
    MANTENIMIENTO: "bg-amber-500",
    DANADA: "bg-red-500",
    PERDIDA: "bg-slate-500",
  };
  return colors[estado];
}

function getRolBgColor(rol: string): string {
  const colors: Record<string, string> = {
    ADMIN: "bg-purple-100 text-purple-700",
    ENCARGADO: "bg-blue-100 text-blue-700",
    EMPLEADO: "bg-slate-100 text-slate-700",
    CLIENTE: "bg-orange-100 text-orange-700",
  };
  return colors[rol] || "bg-slate-100 text-slate-700";
}

function getRolBarColor(rol: string): string {
  const colors: Record<string, string> = {
    ADMIN: "bg-purple-500",
    ENCARGADO: "bg-blue-500",
    EMPLEADO: "bg-slate-500",
    CLIENTE: "bg-orange-500",
  };
  return colors[rol] || "bg-slate-500";
}

function getCategoriaColor(index: number): string {
  const colors = ["#3b82f6", "#22c55e", "#f59e0b", "#ef4444", "#8b5cf6", "#06b6d4"];
  return colors[index % colors.length];
}

function formatTimeAgo(date: Date): string {
  const now = new Date();
  const diffMs = now.getTime() - new Date(date).getTime();
  const diffMins = Math.floor(diffMs / 60000);
  const diffHours = Math.floor(diffMins / 60);
  const diffDays = Math.floor(diffHours / 24);

  if (diffMins < 1) return "Ahora";
  if (diffMins < 60) return `Hace ${diffMins}m`;
  if (diffHours < 24) return `Hace ${diffHours}h`;
  if (diffDays === 1) return "Ayer";
  if (diffDays < 7) return `Hace ${diffDays}d`;
  return new Intl.DateTimeFormat("es-CO", { day: "2-digit", month: "2-digit" }).format(new Date(date));
}