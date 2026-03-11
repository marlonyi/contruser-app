import { prisma } from "@/lib/prisma";
import { StatCard } from "@/components/ui/StatCard";
import { EstadoHerramienta } from "@/generated/prisma/client";

export const dynamic = "force-dynamic";

async function getStats() {
  const [herramientas, usuarios, transaccionesHoy] = await Promise.all([
    prisma.herramienta.groupBy({
      by: ["estado_actual"],
      _count: { id: true },
    }),
    prisma.usuario.count({ where: { estado: "ACTIVO" } }),
    prisma.transaccion.count({
      where: {
        fecha_hora: { gte: new Date(new Date().setHours(0, 0, 0, 0)) },
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

  return { counts, totalHerramientas, usuarios, transaccionesHoy };
}

export default async function DashboardPage() {
  const { counts, totalHerramientas, usuarios, transaccionesHoy } = await getStats();

  return (
    <div>
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-slate-800">Dashboard</h1>
        <p className="text-slate-500 mt-1">Resumen general del inventario</p>
      </div>

      {/* Tarjetas principales */}
      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-5 mb-8">
        <StatCard
          title="Total Herramientas"
          value={totalHerramientas}
          color="bg-slate-700"
          icon={
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
            </svg>
          }
        />
        <StatCard
          title="Disponibles"
          value={counts.DISPONIBLE}
          color="bg-green-500"
          icon={
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          }
        />
        <StatCard
          title="Prestadas"
          value={counts.PRESTADA}
          color="bg-blue-500"
          icon={
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                d="M8 7h12m0 0l-4-4m4 4l-4 4m0 6H4m0 0l4 4m-4-4l4-4" />
            </svg>
          }
        />
        <StatCard
          title="En Mantenimiento"
          value={counts.MANTENIMIENTO}
          color="bg-yellow-500"
          icon={
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
            </svg>
          }
        />
        <StatCard
          title="Dañadas"
          value={counts.DANADA}
          color="bg-red-500"
          icon={
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
            </svg>
          }
        />
        <StatCard
          title="Usuarios Activos"
          value={usuarios}
          color="bg-indigo-500"
          subtitle={`${transaccionesHoy} transacciones hoy`}
          icon={
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0z" />
            </svg>
          }
        />
      </div>

      {/* Últimas transacciones */}
      <RecentTransactions />
    </div>
  );
}

async function RecentTransactions() {
  const transacciones = await prisma.transaccion.findMany({
    take: 8,
    orderBy: { fecha_hora: "desc" },
    include: {
      herramienta: { select: { nombre: true, codigo_qr: true } },
      usuario_responsable: { select: { nombre_completo: true } },
    },
  });

  return (
    <div className="bg-white rounded-2xl shadow-sm border border-slate-100">
      <div className="p-6 border-b border-slate-100">
        <h2 className="text-lg font-semibold text-slate-800">Últimas Transacciones</h2>
      </div>
      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-slate-100">
              <th className="text-left px-6 py-3 text-slate-500 font-medium">Herramienta</th>
              <th className="text-left px-6 py-3 text-slate-500 font-medium">Tipo</th>
              <th className="text-left px-6 py-3 text-slate-500 font-medium">Responsable</th>
              <th className="text-left px-6 py-3 text-slate-500 font-medium">Fecha</th>
            </tr>
          </thead>
          <tbody>
            {transacciones.length === 0 ? (
              <tr>
                <td colSpan={4} className="text-center py-8 text-slate-400">
                  No hay transacciones registradas
                </td>
              </tr>
            ) : (
              transacciones.map((t) => (
                <tr key={t.id} className="border-b border-slate-50 hover:bg-slate-50 transition">
                  <td className="px-6 py-3 font-medium text-slate-800">{t.herramienta.nombre}</td>
                  <td className="px-6 py-3">
                    <span
                      className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                        t.tipo === "ENTREGA"
                          ? "bg-blue-100 text-blue-800"
                          : "bg-green-100 text-green-800"
                      }`}
                    >
                      {t.tipo === "ENTREGA" ? "Entrega" : "Devolución"}
                    </span>
                  </td>
                  <td className="px-6 py-3 text-slate-600">{t.usuario_responsable.nombre_completo}</td>
                  <td className="px-6 py-3 text-slate-500">
                    {new Intl.DateTimeFormat("es-CO", {
                      day: "2-digit",
                      month: "2-digit",
                      year: "numeric",
                      hour: "2-digit",
                      minute: "2-digit",
                    }).format(new Date(t.fecha_hora))}
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
