"use client";

import { useState, useEffect, useCallback } from "react";
import { Button } from "@/components/ui/Button";
import { Modal } from "@/components/ui/Modal";
import { ConfirmDialog } from "@/components/ui/ConfirmDialog";
import { RoleBadge } from "@/components/ui/Badge";
import { ROL_LABELS } from "@/lib/utils";
import type { Rol, EstadoUsuario } from "@/generated/prisma/client";

interface Usuario {
  id: number;
  nombre_completo: string;
  documento: string;
  email: string;
  telefono: string | null;
  direccion: string | null;
  rol: Rol;
  estado: EstadoUsuario;
  createdAt: string;
  _count?: {
    transaccionesComoResponsable: number;
    mantenimientos: number;
  };
}

const initialForm = {
  nombre_completo: "",
  documento: "",
  email: "",
  password: "",
  telefono: "",
  direccion: "",
  rol: "EMPLEADO" as Rol,
};

export default function UsuariosPage() {
  const [usuarios, setUsuarios] = useState<Usuario[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Modal states
  const [showModal, setShowModal] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [editingUsuario, setEditingUsuario] = useState<Usuario | null>(null);
  const [deletingUsuario, setDeletingUsuario] = useState<Usuario | null>(null);

  // Form state
  const [form, setForm] = useState(initialForm);
  const [formLoading, setFormLoading] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);

  const fetchUsuarios = useCallback(async () => {
    try {
      setLoading(true);
      const res = await fetch("/api/usuarios");
      if (!res.ok) throw new Error("Error al cargar usuarios");
      const data = await res.json();
      setUsuarios(data);
      setError(null);
    } catch {
      setError("No se pudieron cargar los usuarios");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchUsuarios();
  }, [fetchUsuarios]);

  const handleOpenModal = (usuario?: Usuario) => {
    if (usuario) {
      setEditingUsuario(usuario);
      setForm({
        nombre_completo: usuario.nombre_completo,
        documento: usuario.documento,
        email: usuario.email,
        password: "",
        telefono: usuario.telefono || "",
        direccion: usuario.direccion || "",
        rol: usuario.rol,
      });
    } else {
      setEditingUsuario(null);
      setForm(initialForm);
    }
    setFormError(null);
    setShowModal(true);
  };

  const handleCloseModal = () => {
    setShowModal(false);
    setEditingUsuario(null);
    setForm(initialForm);
    setFormError(null);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormLoading(true);
    setFormError(null);

    try {
      const url = editingUsuario ? `/api/usuarios/${editingUsuario.id}` : "/api/usuarios";
      const method = editingUsuario ? "PUT" : "POST";

      const payload: Record<string, unknown> = {
        nombre_completo: form.nombre_completo,
        documento: form.documento,
        email: form.email,
        telefono: form.telefono || null,
        direccion: form.direccion || null,
        rol: form.rol,
      };

      if (form.password) {
        payload.password = form.password;
      }

      if (!editingUsuario && !form.password) {
        setFormError("La contraseña es requerida para nuevos usuarios");
        setFormLoading(false);
        return;
      }

      const res = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || "Error al guardar usuario");
      }

      await fetchUsuarios();
      handleCloseModal();
    } catch (err) {
      setFormError(err instanceof Error ? err.message : "Error desconocido");
    } finally {
      setFormLoading(false);
    }
  };

  const handleDelete = async () => {
    if (!deletingUsuario) return;

    setFormLoading(true);
    try {
      const res = await fetch(`/api/usuarios/${deletingUsuario.id}`, { method: "DELETE" });
      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || "Error al eliminar usuario");
      }

      await fetchUsuarios();
      setShowDeleteModal(false);
      setDeletingUsuario(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Error al eliminar");
    } finally {
      setFormLoading(false);
    }
  };

  const handleToggleEstado = async (usuario: Usuario) => {
    try {
      const nuevoEstado = usuario.estado === "ACTIVO" ? "INACTIVO" : "ACTIVO";
      const res = await fetch(`/api/usuarios/${usuario.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ estado: nuevoEstado }),
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || "Error al actualizar estado");
      }

      await fetchUsuarios();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Error al actualizar estado");
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  const stats = {
    total: usuarios.length,
    activos: usuarios.filter(u => u.estado === "ACTIVO").length,
    admins: usuarios.filter(u => u.rol === "ADMIN").length,
  };

  return (
    <div className="min-h-screen">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-8">
        <div>
          <h1 className="text-2xl font-bold text-slate-800">Usuarios</h1>
          <p className="text-slate-500 mt-1">Gestiona los usuarios del sistema</p>
        </div>
        <Button onClick={() => handleOpenModal()}>
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
          </svg>
          Nuevo Usuario
        </Button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-8">
        <div className="bg-white rounded-xl border border-slate-100 p-4">
          <p className="text-sm text-slate-500">Total</p>
          <p className="text-2xl font-bold text-slate-800">{stats.total}</p>
        </div>
        <div className="bg-emerald-50 rounded-xl border border-emerald-100 p-4">
          <p className="text-sm text-emerald-600">Activos</p>
          <p className="text-2xl font-bold text-emerald-700">{stats.activos}</p>
        </div>
        <div className="bg-purple-50 rounded-xl border border-purple-100 p-4">
          <p className="text-sm text-purple-600">Administradores</p>
          <p className="text-2xl font-bold text-purple-700">{stats.admins}</p>
        </div>
        <div className="bg-red-50 rounded-xl border border-red-100 p-4">
          <p className="text-sm text-red-600">Inactivos</p>
          <p className="text-2xl font-bold text-red-700">{stats.total - stats.activos}</p>
        </div>
      </div>

      {error && (
        <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-xl text-red-700 text-sm flex items-center gap-3">
          <svg className="w-5 h-5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
          {error}
        </div>
      )}

      {/* Users Grid */}
      {usuarios.length === 0 ? (
        <div className="bg-white rounded-2xl shadow-sm border border-slate-100 py-16 text-center">
          <div className="w-16 h-16 bg-slate-100 rounded-2xl flex items-center justify-center mx-auto mb-4">
            <svg className="w-8 h-8 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0z" />
            </svg>
          </div>
          <h3 className="text-lg font-semibold text-slate-800 mb-1">No hay usuarios</h3>
          <p className="text-slate-500 mb-6">Comienza agregando usuarios al sistema</p>
          <Button onClick={() => handleOpenModal()}>
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
            </svg>
            Agregar Usuario
          </Button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
          {usuarios.map((u) => (
            <div
              key={u.id}
              className={`bg-white rounded-xl border shadow-sm overflow-hidden transition-all hover:shadow-md ${
                u.estado === "INACTIVO" ? "opacity-60" : ""
              }`}
            >
              <div className="p-5">
                <div className="flex items-start justify-between mb-3">
                  <div className="flex items-center gap-3">
                    <div className={`w-12 h-12 rounded-xl flex items-center justify-center text-white font-bold text-lg ${
                      u.rol === "ADMIN" ? "bg-gradient-to-br from-purple-500 to-purple-600" :
                      u.rol === "ENCARGADO" ? "bg-gradient-to-br from-blue-500 to-blue-600" :
                      u.rol === "EMPLEADO" ? "bg-gradient-to-br from-slate-500 to-slate-600" :
                      "bg-gradient-to-br from-orange-500 to-orange-600"
                    }`}>
                      {u.nombre_completo.split(" ").map(n => n[0]).slice(0, 2).join("")}
                    </div>
                    <div>
                      <h3 className="font-semibold text-slate-800">{u.nombre_completo}</h3>
                      <p className="text-sm text-slate-400 font-mono">{u.documento}</p>
                    </div>
                  </div>
                  <RoleBadge rol={u.rol} />
                </div>

                <div className="space-y-2 text-sm">
                  <div className="flex items-center gap-2 text-slate-600">
                    <svg className="w-4 h-4 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                    </svg>
                    <span className="truncate">{u.email}</span>
                  </div>
                  {u.telefono && (
                    <div className="flex items-center gap-2 text-slate-600">
                      <svg className="w-4 h-4 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" />
                      </svg>
                      <span>{u.telefono}</span>
                    </div>
                  )}
                </div>
              </div>

              <div className="px-5 py-3 bg-slate-50 border-t border-slate-100 flex items-center justify-between">
                <button
                  onClick={() => handleToggleEstado(u)}
                  className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-medium transition-colors ${
                    u.estado === "ACTIVO"
                      ? "bg-emerald-100 text-emerald-700 hover:bg-emerald-200"
                      : "bg-red-100 text-red-700 hover:bg-red-200"
                  }`}
                >
                  <span className={`w-1.5 h-1.5 rounded-full ${u.estado === "ACTIVO" ? "bg-emerald-500" : "bg-red-500"}`} />
                  {u.estado === "ACTIVO" ? "Activo" : "Inactivo"}
                </button>
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => handleOpenModal(u)}
                    className="p-2 text-slate-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                  >
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                    </svg>
                  </button>
                  <button
                    onClick={() => {
                      setDeletingUsuario(u);
                      setShowDeleteModal(true);
                    }}
                    className="p-2 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                  >
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                    </svg>
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Create/Edit Modal */}
      <Modal
        open={showModal}
        onClose={handleCloseModal}
        title={editingUsuario ? "Editar Usuario" : "Nuevo Usuario"}
        size="lg"
      >
        <form onSubmit={handleSubmit} className="space-y-5">
          {formError && (
            <div className="p-4 bg-red-50 border border-red-200 rounded-xl text-red-700 text-sm flex items-center gap-3">
              <svg className="w-5 h-5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              {formError}
            </div>
          )}

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="sm:col-span-2">
              <label className="block text-sm font-medium text-slate-700 mb-2">
                Nombre completo <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                value={form.nombre_completo}
                onChange={(e) => setForm({ ...form, nombre_completo: e.target.value })}
                className="w-full px-4 py-3 border-2 border-slate-200 rounded-xl text-slate-800 placeholder-slate-400 focus:outline-none focus:border-blue-500 focus:ring-4 focus:ring-blue-500/10 transition-all"
                placeholder="Juan Pérez"
                required
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-700 mb-2">
                Documento <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                value={form.documento}
                onChange={(e) => setForm({ ...form, documento: e.target.value })}
                className="w-full px-4 py-3 border-2 border-slate-200 rounded-xl text-slate-800 placeholder-slate-400 focus:outline-none focus:border-blue-500 focus:ring-4 focus:ring-blue-500/10 transition-all"
                placeholder="12345678"
                required
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-700 mb-2">
                Email <span className="text-red-500">*</span>
              </label>
              <input
                type="email"
                value={form.email}
                onChange={(e) => setForm({ ...form, email: e.target.value })}
                className="w-full px-4 py-3 border-2 border-slate-200 rounded-xl text-slate-800 placeholder-slate-400 focus:outline-none focus:border-blue-500 focus:ring-4 focus:ring-blue-500/10 transition-all"
                placeholder="usuario@email.com"
                required
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-700 mb-2">
                Contraseña {editingUsuario && <span className="text-slate-400">(dejar vacío para mantener)</span>}
                {!editingUsuario && <span className="text-red-500">*</span>}
              </label>
              <input
                type="password"
                value={form.password}
                onChange={(e) => setForm({ ...form, password: e.target.value })}
                className="w-full px-4 py-3 border-2 border-slate-200 rounded-xl text-slate-800 placeholder-slate-400 focus:outline-none focus:border-blue-500 focus:ring-4 focus:ring-blue-500/10 transition-all"
                placeholder="••••••••"
                required={!editingUsuario}
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-700 mb-2">
                Teléfono
              </label>
              <input
                type="text"
                value={form.telefono}
                onChange={(e) => setForm({ ...form, telefono: e.target.value })}
                className="w-full px-4 py-3 border-2 border-slate-200 rounded-xl text-slate-800 placeholder-slate-400 focus:outline-none focus:border-blue-500 focus:ring-4 focus:ring-blue-500/10 transition-all"
                placeholder="+57 300 123 4567"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-700 mb-2">
                Rol <span className="text-red-500">*</span>
              </label>
              <select
                value={form.rol}
                onChange={(e) => setForm({ ...form, rol: e.target.value as Rol })}
                className="w-full px-4 py-3 border-2 border-slate-200 rounded-xl text-slate-800 focus:outline-none focus:border-blue-500 focus:ring-4 focus:ring-blue-500/10 transition-all"
                required
              >
                <option value="ADMIN">Administrador</option>
                <option value="ENCARGADO">Encargado de Almacén</option>
                <option value="EMPLEADO">Empleado / Técnico</option>
                <option value="CLIENTE">Cliente</option>
              </select>
            </div>

            <div className="sm:col-span-2">
              <label className="block text-sm font-medium text-slate-700 mb-2">
                Dirección
              </label>
              <input
                type="text"
                value={form.direccion}
                onChange={(e) => setForm({ ...form, direccion: e.target.value })}
                className="w-full px-4 py-3 border-2 border-slate-200 rounded-xl text-slate-800 placeholder-slate-400 focus:outline-none focus:border-blue-500 focus:ring-4 focus:ring-blue-500/10 transition-all"
                placeholder="Calle 123 # 45-67"
              />
            </div>
          </div>

          <div className="flex justify-end gap-3 pt-4 border-t border-slate-100">
            <Button variant="secondary" type="button" onClick={handleCloseModal}>
              Cancelar
            </Button>
            <Button type="submit" disabled={formLoading}>
              {formLoading ? "Guardando..." : editingUsuario ? "Guardar Cambios" : "Crear Usuario"}
            </Button>
          </div>
        </form>
      </Modal>

      {/* Delete Confirmation */}
      <ConfirmDialog
        open={showDeleteModal}
        onClose={() => {
          setShowDeleteModal(false);
          setDeletingUsuario(null);
        }}
        onConfirm={handleDelete}
        title="Eliminar Usuario"
        message={`¿Está seguro de eliminar al usuario "${deletingUsuario?.nombre_completo}"? Esta acción no se puede deshacer.`}
        confirmLabel="Eliminar"
        variant="danger"
        loading={formLoading}
      />
    </div>
  );
}