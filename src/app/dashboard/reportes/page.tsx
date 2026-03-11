import { prisma } from "@/lib/prisma";
import { EstadoBadge } from "@/components/ui/Badge";

export const dynamic = "force-dynamic";

export default async function ReportesPage() {
  const [herramientasPorEstado, herramientasPorCategoria, usuariosConHerramientas] =
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
      // Usuarios que tienen herramientas prestadas actualmente
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
    ]);

  const categorias = await prisma.categoria.findMany();
  const categoriaMap = Object.fromEntries(categorias.map((c) => [c.id, c.nombre]));

  return (
    <div>
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-slate-800">Reportes</h1>
        <p className="text-slate-500 mt-1">Resumen de inventario y generación de documentos</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
        {/* Herramientas por estado */}
        <div className="bg-white rounded-2xl shadow-sm border border-slate-100 p-6">
          <h2 className="text-base font-semibold text-slate-700 mb-4">Herramientas por Estado</h2>
          <div className="space-y-3">
            {herramientasPorEstado.map((g) => (
              <div key={g.estado_actual} className="flex items-center justify-between">
                <EstadoBadge estado={g.estado_actual} />
                <span className="font-bold text-slate-800 text-lg">{g._count.id}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Por categoría */}
        <div className="bg-white rounded-2xl shadow-sm border border-slate-100 p-6">
          <h2 className="text-base font-semibold text-slate-700 mb-4">Herramientas por Categoría</h2>
          <div className="space-y-3">
            {herramientasPorCategoria.map((g) => (
              <div key={g.categoria_id} className="flex items-center justify-between">
                <span className="text-sm text-slate-600">
                  {categoriaMap[g.categoria_id] ?? "Sin categoría"}
                </span>
                <span className="font-bold text-slate-800">{g._count.id}</span>
              </div>
            ))}
            {herramientasPorCategoria.length === 0 && (
              <p className="text-slate-400 text-sm text-center py-4">Sin datos</p>
            )}
          </div>
        </div>
      </div>

      {/* Paz y Salvo */}
      <div className="bg-white rounded-2xl shadow-sm border border-slate-100">
        <div className="p-6 border-b border-slate-100 flex items-center justify-between">
          <div>
            <h2 className="text-base font-semibold text-slate-700">Herramientas Pendientes por Usuario</h2>
            <p className="text-sm text-slate-400 mt-0.5">
              Usuarios con herramientas actualmente prestadas (sin devolución)
            </p>
          </div>
        </div>

        {usuariosConHerramientas.length === 0 ? (
          <div className="py-12 text-center">
            <div className="w-12 h-12 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-3">
              <svg className="w-6 h-6 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
            <p className="text-slate-600 font-medium">Todos los usuarios están en paz y salvo</p>
            <p className="text-slate-400 text-sm mt-1">No hay herramientas pendientes de devolución</p>
          </div>
        ) : (
          <div className="divide-y divide-slate-50">
            {usuariosConHerramientas.map((u) => (
              <div key={u.id} className="p-6">
                <div className="flex items-start justify-between">
                  <div>
                    <p className="font-semibold text-slate-800">{u.nombre_completo}</p>
                    <p className="text-sm text-slate-400 font-mono">{u.documento}</p>
                  </div>
                  <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-red-100 text-red-800">
                    {u.transaccionesComoResponsable.length} herramienta(s) pendiente(s)
                  </span>
                </div>
                <ul className="mt-3 space-y-1">
                  {u.transaccionesComoResponsable.map((t) => (
                    <li key={t.id} className="flex items-center gap-2 text-sm text-slate-600">
                      <svg className="w-4 h-4 text-red-400 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                          d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                      </svg>
                      {t.herramienta.nombre}
                      <span className="text-xs text-slate-400 font-mono">{t.herramienta.codigo_qr}</span>
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
