import { prisma } from "@/lib/prisma";
import { Badge } from "@/components/ui/Badge";
import { ROL_LABELS } from "@/lib/utils";

export const dynamic = "force-dynamic";

const ROL_COLORS: Record<string, string> = {
  ADMIN: "bg-purple-100 text-purple-800",
  ENCARGADO: "bg-blue-100 text-blue-800",
  EMPLEADO: "bg-slate-100 text-slate-700",
  CLIENTE: "bg-orange-100 text-orange-800",
};

export default async function UsuariosPage() {
  const usuarios = await prisma.usuario.findMany({
    orderBy: { nombre_completo: "asc" },
    include: {
      _count: {
        select: { transaccionesComoResponsable: true },
      },
    },
  });

  return (
    <div>
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-2xl font-bold text-slate-800">Usuarios</h1>
          <p className="text-slate-500 mt-1">{usuarios.length} usuarios registrados</p>
        </div>
        <a
          href="/dashboard/usuarios/nuevo"
          className="inline-flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white font-medium px-4 py-2.5 rounded-lg text-sm transition"
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
          </svg>
          Nuevo Usuario
        </a>
      </div>

      <div className="bg-white rounded-2xl shadow-sm border border-slate-100 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-slate-100 bg-slate-50">
                <th className="text-left px-6 py-3 text-slate-500 font-medium">Nombre</th>
                <th className="text-left px-6 py-3 text-slate-500 font-medium">Documento</th>
                <th className="text-left px-6 py-3 text-slate-500 font-medium">Email</th>
                <th className="text-left px-6 py-3 text-slate-500 font-medium">Teléfono</th>
                <th className="text-left px-6 py-3 text-slate-500 font-medium">Rol</th>
                <th className="text-left px-6 py-3 text-slate-500 font-medium">Estado</th>
                <th className="text-left px-6 py-3 text-slate-500 font-medium">Transacciones</th>
              </tr>
            </thead>
            <tbody>
              {usuarios.length === 0 ? (
                <tr>
                  <td colSpan={7} className="text-center py-12 text-slate-400">
                    No hay usuarios registrados
                  </td>
                </tr>
              ) : (
                usuarios.map((u) => (
                  <tr key={u.id} className="border-b border-slate-50 hover:bg-slate-50 transition">
                    <td className="px-6 py-3 font-medium text-slate-800">{u.nombre_completo}</td>
                    <td className="px-6 py-3 text-slate-600 font-mono text-xs">{u.documento}</td>
                    <td className="px-6 py-3 text-slate-600">{u.email}</td>
                    <td className="px-6 py-3 text-slate-600">{u.telefono || "—"}</td>
                    <td className="px-6 py-3">
                      <Badge label={ROL_LABELS[u.rol]} color={ROL_COLORS[u.rol]} />
                    </td>
                    <td className="px-6 py-3">
                      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                        u.estado === "ACTIVO"
                          ? "bg-green-100 text-green-800"
                          : "bg-red-100 text-red-800"
                      }`}>
                        {u.estado === "ACTIVO" ? "Activo" : "Inactivo"}
                      </span>
                    </td>
                    <td className="px-6 py-3 text-slate-600 text-center">
                      {u._count.transaccionesComoResponsable}
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
