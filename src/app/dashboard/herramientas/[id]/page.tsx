import { prisma } from "@/lib/prisma";
import { notFound } from "next/navigation";
import { EstadoBadge } from "@/components/ui/Badge";
import { formatCurrency, formatDate, formatDateTime } from "@/lib/utils";
import { QRGenerator } from "@/components/qr/QRGenerator";

export const dynamic = "force-dynamic";

interface Props {
  params: Promise<{ id: string }>;
}

export default async function HerramientaDetallePage({ params }: Props) {
  const { id } = await params;
  const herramienta = await prisma.herramienta.findUnique({
    where: { id: Number(id) },
    include: {
      categoria: true,
      transacciones: {
        orderBy: { fecha_hora: "desc" },
        include: {
          usuario_responsable: { select: { nombre_completo: true, documento: true } },
          encargado: { select: { nombre_completo: true } },
        },
      },
      mantenimientos: {
        orderBy: { fecha_inicio: "desc" },
        include: {
          tecnico: { select: { nombre_completo: true } },
        },
      },
    },
  });

  if (!herramienta) notFound();

  return (
    <div>
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-slate-800">{herramienta.nombre}</h1>
        <p className="text-slate-500 mt-1">Detalle e historial completo</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8">
        {/* Info principal */}
        <div className="lg:col-span-2 bg-white rounded-2xl shadow-sm border border-slate-100 p-6">
          <h2 className="text-base font-semibold text-slate-700 mb-4">Información General</h2>
          <dl className="grid grid-cols-2 gap-4 text-sm">
            <div>
              <dt className="text-slate-400 font-medium">Estado</dt>
              <dd className="mt-1"><EstadoBadge estado={herramienta.estado_actual} /></dd>
            </div>
            <div>
              <dt className="text-slate-400 font-medium">Categoría</dt>
              <dd className="mt-1 text-slate-700">{herramienta.categoria.nombre}</dd>
            </div>
            <div>
              <dt className="text-slate-400 font-medium">Marca</dt>
              <dd className="mt-1 text-slate-700">{herramienta.marca || "—"}</dd>
            </div>
            <div>
              <dt className="text-slate-400 font-medium">Modelo</dt>
              <dd className="mt-1 text-slate-700">{herramienta.modelo || "—"}</dd>
            </div>
            <div>
              <dt className="text-slate-400 font-medium">Fecha de Compra</dt>
              <dd className="mt-1 text-slate-700">{formatDate(herramienta.fecha_compra)}</dd>
            </div>
            <div>
              <dt className="text-slate-400 font-medium">Valor de Compra</dt>
              <dd className="mt-1 text-slate-700">{formatCurrency(herramienta.valor_compra ? Number(herramienta.valor_compra) : null)}</dd>
            </div>
          </dl>
        </div>

        {/* QR */}
        <div className="bg-white rounded-2xl shadow-sm border border-slate-100 p-6 flex flex-col items-center justify-center">
          <h2 className="text-base font-semibold text-slate-700 mb-4">Código QR</h2>
          <QRGenerator value={herramienta.codigo_qr} size={160} />
        </div>
      </div>

      {/* Historial de transacciones */}
      <div className="bg-white rounded-2xl shadow-sm border border-slate-100 mb-6">
        <div className="p-6 border-b border-slate-100">
          <h2 className="text-base font-semibold text-slate-700">Historial de Transacciones</h2>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-slate-100 bg-slate-50">
                <th className="text-left px-6 py-3 text-slate-500 font-medium">Tipo</th>
                <th className="text-left px-6 py-3 text-slate-500 font-medium">Responsable</th>
                <th className="text-left px-6 py-3 text-slate-500 font-medium">Encargado</th>
                <th className="text-left px-6 py-3 text-slate-500 font-medium">Estado al momento</th>
                <th className="text-left px-6 py-3 text-slate-500 font-medium">Fecha</th>
                <th className="text-left px-6 py-3 text-slate-500 font-medium">Observaciones</th>
              </tr>
            </thead>
            <tbody>
              {herramienta.transacciones.length === 0 ? (
                <tr><td colSpan={6} className="text-center py-6 text-slate-400">Sin transacciones</td></tr>
              ) : (
                herramienta.transacciones.map((t) => (
                  <tr key={t.id} className="border-b border-slate-50 hover:bg-slate-50">
                    <td className="px-6 py-3">
                      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                        t.tipo === "ENTREGA" ? "bg-blue-100 text-blue-800" : "bg-green-100 text-green-800"
                      }`}>
                        {t.tipo === "ENTREGA" ? "Entrega" : "Devolución"}
                      </span>
                    </td>
                    <td className="px-6 py-3 text-slate-700">{t.usuario_responsable.nombre_completo}</td>
                    <td className="px-6 py-3 text-slate-600">{t.encargado.nombre_completo}</td>
                    <td className="px-6 py-3"><EstadoBadge estado={t.estado_herramienta_momento} /></td>
                    <td className="px-6 py-3 text-slate-500">{formatDateTime(t.fecha_hora)}</td>
                    <td className="px-6 py-3 text-slate-500">{t.observaciones || "—"}</td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Historial de mantenimientos */}
      <div className="bg-white rounded-2xl shadow-sm border border-slate-100">
        <div className="p-6 border-b border-slate-100">
          <h2 className="text-base font-semibold text-slate-700">Historial de Mantenimientos</h2>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-slate-100 bg-slate-50">
                <th className="text-left px-6 py-3 text-slate-500 font-medium">Tipo</th>
                <th className="text-left px-6 py-3 text-slate-500 font-medium">Técnico</th>
                <th className="text-left px-6 py-3 text-slate-500 font-medium">Inicio</th>
                <th className="text-left px-6 py-3 text-slate-500 font-medium">Fin</th>
                <th className="text-left px-6 py-3 text-slate-500 font-medium">Costo</th>
                <th className="text-left px-6 py-3 text-slate-500 font-medium">Observaciones</th>
              </tr>
            </thead>
            <tbody>
              {herramienta.mantenimientos.length === 0 ? (
                <tr><td colSpan={6} className="text-center py-6 text-slate-400">Sin mantenimientos</td></tr>
              ) : (
                herramienta.mantenimientos.map((m) => (
                  <tr key={m.id} className="border-b border-slate-50 hover:bg-slate-50">
                    <td className="px-6 py-3">
                      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                        m.tipo === "PREVENTIVO" ? "bg-yellow-100 text-yellow-800" : "bg-red-100 text-red-800"
                      }`}>
                        {m.tipo === "PREVENTIVO" ? "Preventivo" : "Correctivo"}
                      </span>
                    </td>
                    <td className="px-6 py-3 text-slate-700">{m.tecnico.nombre_completo}</td>
                    <td className="px-6 py-3 text-slate-500">{formatDate(m.fecha_inicio)}</td>
                    <td className="px-6 py-3 text-slate-500">{formatDate(m.fecha_fin)}</td>
                    <td className="px-6 py-3 text-slate-600">{formatCurrency(m.costo ? Number(m.costo) : null)}</td>
                    <td className="px-6 py-3 text-slate-500">{m.observaciones || "—"}</td>
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
