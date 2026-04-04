"use client";

import { useState, useEffect, useCallback } from "react";
import { Button } from "@/components/ui/Button";
import { Modal } from "@/components/ui/Modal";
import { ConfirmDialog } from "@/components/ui/ConfirmDialog";
import { MaintenanceBadge } from "@/components/ui/Badge";
import { formatCurrency, formatDateTime } from "@/lib/utils";
import type { TipoMantenimiento } from "@/generated/prisma/client";

interface Herramienta {
  id: number;
  nombre: string;
  codigo_qr: string;
  estado_actual: string;
}

interface Usuario {
  id: number;
  nombre_completo: string;
}

interface Mantenimiento {
  id: number;
  tipo: TipoMantenimiento;
  fecha_inicio: string;
  fecha_fin: string | null;
  costo: number | null;
  observaciones: string | null;
  herramienta: Herramienta;
  tecnico: Usuario;
}

const initialForm = {
  tipo: "PREVENTIVO" as TipoMantenimiento,
  fecha_inicio: "",
  fecha_fin: "",
  costo: "",
  observaciones: "",
  herramienta_id: "",
  tecnico_id: "",
};

export default function MantenimientosPage() {
  const [mantenimientos, setMantenimientos] = useState<Mantenimiento[]>([]);
  const [herramientas, setHerramientas] = useState<Herramienta[]>([]);
  const [tecnicos, setTecnicos] = useState<Usuario[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [filter, setFilter] = useState<"todos" | "activos" | "finalizados">("todos");

  // Modal states
  const [showModal, setShowModal] = useState(false);
  const [showFinishModal, setShowFinishModal] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [editingMantenimiento, setEditingMantenimiento] = useState<Mantenimiento | null>(null);
  const [finishingMantenimiento, setFinishingMantenimiento] = useState<Mantenimiento | null>(null);
  const [deletingMantenimiento, setDeletingMantenimiento] = useState<Mantenimiento | null>(null);

  // Form state
  const [form, setForm] = useState(initialForm);
  const [formLoading, setFormLoading] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);

  // Finish form state
  const [finishForm, setFinishForm] = useState({ fecha_fin: "", costo: "", observaciones: "" });
  const [finishLoading, setFinishLoading] = useState(false);
  const [finishError, setFinishError] = useState<string | null>(null);

  const fetchData = useCallback(async () => {
    try {
      setLoading(true);
      const [mantRes, herrRes, usrRes] = await Promise.all([
        fetch(`/api/mantenimientos${filter === "activos" ? "?activos=true" : ""}`),
        fetch("/api/herramientas"),
        fetch("/api/usuarios"),
      ]);

      if (!mantRes.ok) throw new Error("Error al cargar mantenimientos");
      if (!herrRes.ok) throw new Error("Error al cargar herramientas");
      if (!usrRes.ok) throw new Error("Error al cargar usuarios");

      const mantData = await mantRes.json();
      const herrData = await herrRes.json();
      const usrData = await usrRes.json();

      const herramientasDisponibles = herrData.filter(
        (h: Herramienta) => h.estado_actual === "DISPONIBLE" || h.estado_actual === "DANADA"
      );

      const tecnicosDisponibles = usrData.filter(
        (u: Usuario & { rol: string }) => u.rol === "EMPLEADO" || u.rol === "ENCARGADO" || u.rol === "ADMIN"
      );

      setMantenimientos(mantData);
      setHerramientas(herramientasDisponibles);
      setTecnicos(tecnicosDisponibles);
      setError(null);
    } catch {
      setError("No se pudieron cargar los datos");
    } finally {
      setLoading(false);
    }
  }, [filter]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const handleOpenModal = (mantenimiento?: Mantenimiento) => {
    if (mantenimiento) {
      setEditingMantenimiento(mantenimiento);
      setForm({
        tipo: mantenimiento.tipo,
        fecha_inicio: mantenimiento.fecha_inicio.split("T")[0],
        fecha_fin: mantenimiento.fecha_fin?.split("T")[0] || "",
        costo: mantenimiento.costo ? String(mantenimiento.costo) : "",
        observaciones: mantenimiento.observaciones || "",
        herramienta_id: String(mantenimiento.herramienta.id),
        tecnico_id: String(mantenimiento.tecnico.id),
      });
    } else {
      setEditingMantenimiento(null);
      setForm({
        ...initialForm,
        fecha_inicio: new Date().toISOString().split("T")[0],
      });
    }
    setFormError(null);
    setShowModal(true);
  };

  const handleCloseModal = () => {
    setShowModal(false);
    setEditingMantenimiento(null);
    setForm(initialForm);
    setFormError(null);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormLoading(true);
    setFormError(null);

    try {
      const payload = {
        tipo: form.tipo,
        fecha_inicio: form.fecha_inicio,
        fecha_fin: form.fecha_fin || null,
        costo: form.costo ? parseFloat(form.costo) : null,
        observaciones: form.observaciones || null,
        herramienta_id: parseInt(form.herramienta_id),
        tecnico_id: parseInt(form.tecnico_id),
      };

      const res = await fetch("/api/mantenimientos", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || "Error al crear mantenimiento");
      }

      await fetchData();
      handleCloseModal();
    } catch (err) {
      setFormError(err instanceof Error ? err.message : "Error desconocido");
    } finally {
      setFormLoading(false);
    }
  };

  const handleOpenFinishModal = (mantenimiento: Mantenimiento) => {
    setFinishingMantenimiento(mantenimiento);
    setFinishForm({
      fecha_fin: new Date().toISOString().split("T")[0],
      costo: mantenimiento.costo ? String(mantenimiento.costo) : "",
      observaciones: mantenimiento.observaciones || "",
    });
    setFinishError(null);
    setShowFinishModal(true);
  };

  const handleFinish = async () => {
    if (!finishingMantenimiento) return;

    setFinishLoading(true);
    setFinishError(null);

    try {
      const res = await fetch(`/api/mantenimientos/${finishingMantenimiento.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          fecha_fin: finishForm.fecha_fin,
          costo: finishForm.costo ? parseFloat(finishForm.costo) : null,
          observaciones: finishForm.observaciones || null,
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || "Error al finalizar mantenimiento");
      }

      await fetchData();
      setShowFinishModal(false);
      setFinishingMantenimiento(null);
    } catch (err) {
      setFinishError(err instanceof Error ? err.message : "Error desconocido");
    } finally {
      setFinishLoading(false);
    }
  };

  const handleDelete = async () => {
    if (!deletingMantenimiento) return;

    setFormLoading(true);
    try {
      const res = await fetch(`/api/mantenimientos/${deletingMantenimiento.id}`, { method: "DELETE" });
      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || "Error al eliminar mantenimiento");
      }

      await fetchData();
      setShowDeleteModal(false);
      setDeletingMantenimiento(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Error al eliminar");
    } finally {
      setFormLoading(false);
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
    total: mantenimientos.length,
    activos: mantenimientos.filter((m) => !m.fecha_fin).length,
    finalizados: mantenimientos.filter((m) => m.fecha_fin).length,
  };

  return (
    <div className="min-h-screen">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-8">
        <div>
          <h1 className="text-2xl font-bold text-slate-800">Mantenimientos</h1>
          <p className="text-slate-500 mt-1">Gestión de mantenimientos preventivos y correctivos</p>
        </div>
        <Button onClick={() => handleOpenModal()}>
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
          </svg>
          Nuevo Mantenimiento
        </Button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-3 gap-4 mb-8">
        <div className="bg-white rounded-xl border border-slate-100 p-4 text-center">
          <p className="text-sm text-slate-500">Total</p>
          <p className="text-2xl font-bold text-slate-800">{stats.total}</p>
        </div>
        <div className="bg-amber-50 rounded-xl border border-amber-100 p-4 text-center">
          <p className="text-sm text-amber-600">Activos</p>
          <p className="text-2xl font-bold text-amber-700">{stats.activos}</p>
        </div>
        <div className="bg-emerald-50 rounded-xl border border-emerald-100 p-4 text-center">
          <p className="text-sm text-emerald-600">Finalizados</p>
          <p className="text-2xl font-bold text-emerald-700">{stats.finalizados}</p>
        </div>
      </div>

      {/* Filters */}
      <div className="flex flex-wrap gap-2 mb-6">
        {(["todos", "activos", "finalizados"] as const).map((f) => (
          <button
            key={f}
            onClick={() => setFilter(f)}
            className={`px-4 py-2 text-sm font-medium rounded-xl transition-all ${
              filter === f
                ? f === "activos"
                  ? "bg-amber-600 text-white shadow-lg shadow-amber-500/25"
                  : f === "finalizados"
                  ? "bg-emerald-600 text-white shadow-lg shadow-emerald-500/25"
                  : "bg-slate-800 text-white shadow-lg"
                : "bg-white text-slate-600 border border-slate-200 hover:bg-slate-50"
            }`}
          >
            {f === "todos" ? "Todos" : f === "activos" ? "En curso" : "Finalizados"}
          </button>
        ))}
      </div>

      {error && (
        <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-xl text-red-700 text-sm flex items-center gap-3">
          <svg className="w-5 h-5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
          {error}
        </div>
      )}

      {/* Maintenance List */}
      {mantenimientos.length === 0 ? (
        <div className="bg-white rounded-2xl shadow-sm border border-slate-100 py-16 text-center">
          <div className="w-16 h-16 bg-amber-100 rounded-2xl flex items-center justify-center mx-auto mb-4">
            <svg className="w-8 h-8 text-amber-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
            </svg>
          </div>
          <h3 className="text-lg font-semibold text-slate-800 mb-1">No hay mantenimientos</h3>
          <p className="text-slate-500 mb-6">
            {filter === "activos"
              ? "No hay mantenimientos en curso"
              : "Registra el primer mantenimiento"}
          </p>
          <Button onClick={() => handleOpenModal()}>
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
            </svg>
            Nuevo Mantenimiento
          </Button>
        </div>
      ) : (
        <div className="space-y-4">
          {mantenimientos.map((m) => (
            <div
              key={m.id}
              className={`bg-white rounded-xl border shadow-sm overflow-hidden transition-all ${
                m.fecha_fin ? "border-slate-100" : "border-amber-200 shadow-amber-100/50"
              }`}
            >
              <div className="p-5">
                <div className="flex items-start justify-between gap-4">
                  <div className="flex items-start gap-4">
                    <div className={`w-12 h-12 rounded-xl flex items-center justify-center ${
                      m.fecha_fin ? "bg-emerald-100" : "bg-amber-100"
                    }`}>
                      {m.fecha_fin ? (
                        <svg className="w-6 h-6 text-emerald-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                        </svg>
                      ) : (
                        <svg className="w-6 h-6 text-amber-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                        </svg>
                      )}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1">
                        <h3 className="font-semibold text-slate-800">{m.herramienta.nombre}</h3>
                        <MaintenanceBadge tipo={m.tipo} />
                        <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${
                          m.fecha_fin ? "bg-emerald-100 text-emerald-700" : "bg-amber-100 text-amber-700"
                        }`}>
                          {m.fecha_fin ? "Finalizado" : "En curso"}
                        </span>
                      </div>
                      <p className="text-sm text-slate-400 font-mono">{m.herramienta.codigo_qr}</p>
                      <div className="mt-2 flex flex-wrap items-center gap-x-4 gap-y-1 text-sm text-slate-600">
                        <span className="flex items-center gap-1">
                          <svg className="w-4 h-4 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                          </svg>
                          {m.tecnico.nombre_completo}
                        </span>
                        <span className="flex items-center gap-1">
                          <svg className="w-4 h-4 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                          </svg>
                          {formatDateTime(m.fecha_inicio)}
                        </span>
                        {m.costo && (
                          <span className="flex items-center gap-1">
                            <svg className="w-4 h-4 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                            </svg>
                            {formatCurrency(m.costo)}
                          </span>
                        )}
                      </div>
                      {m.observaciones && (
                        <p className="mt-2 text-sm text-slate-500 bg-slate-50 px-3 py-1.5 rounded-lg">
                          {m.observaciones}
                        </p>
                      )}
                    </div>
                  </div>

                  {!m.fecha_fin && (
                    <div className="flex items-center gap-2">
                      <Button size="sm" variant="success" onClick={() => handleOpenFinishModal(m)}>
                        Finalizar
                      </Button>
                      <button
                        onClick={() => {
                          setDeletingMantenimiento(m);
                          setShowDeleteModal(true);
                        }}
                        className="p-2 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                      >
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                        </svg>
                      </button>
                    </div>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Create Modal */}
      <Modal open={showModal} onClose={handleCloseModal} title="Nuevo Mantenimiento" size="lg">
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
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-2">Herramienta *</label>
              <select
                value={form.herramienta_id}
                onChange={(e) => setForm({ ...form, herramienta_id: e.target.value })}
                className="w-full px-4 py-3 border-2 border-slate-200 rounded-xl text-slate-800 focus:outline-none focus:border-blue-500 focus:ring-4 focus:ring-blue-500/10 transition-all"
                required
              >
                <option value="">Selecciona una herramienta</option>
                {herramientas.map((h) => (
                  <option key={h.id} value={h.id}>
                    {h.nombre} ({h.estado_actual === "DISPONIBLE" ? "Disponible" : "Dañada"})
                  </option>
                ))}
              </select>
              {herramientas.length === 0 && (
                <p className="mt-1.5 text-sm text-amber-600">No hay herramientas disponibles</p>
              )}
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-700 mb-2">Técnico Responsable *</label>
              <select
                value={form.tecnico_id}
                onChange={(e) => setForm({ ...form, tecnico_id: e.target.value })}
                className="w-full px-4 py-3 border-2 border-slate-200 rounded-xl text-slate-800 focus:outline-none focus:border-blue-500 focus:ring-4 focus:ring-blue-500/10 transition-all"
                required
              >
                <option value="">Selecciona un técnico</option>
                {tecnicos.map((t) => (
                  <option key={t.id} value={t.id}>
                    {t.nombre_completo}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-700 mb-2">Tipo *</label>
              <select
                value={form.tipo}
                onChange={(e) => setForm({ ...form, tipo: e.target.value as TipoMantenimiento })}
                className="w-full px-4 py-3 border-2 border-slate-200 rounded-xl text-slate-800 focus:outline-none focus:border-blue-500 focus:ring-4 focus:ring-blue-500/10 transition-all"
                required
              >
                <option value="PREVENTIVO">Preventivo</option>
                <option value="CORRECTIVO">Correctivo</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-700 mb-2">Fecha de Inicio *</label>
              <input
                type="date"
                value={form.fecha_inicio}
                onChange={(e) => setForm({ ...form, fecha_inicio: e.target.value })}
                className="w-full px-4 py-3 border-2 border-slate-200 rounded-xl text-slate-800 focus:outline-none focus:border-blue-500 focus:ring-4 focus:ring-blue-500/10 transition-all"
                required
              />
            </div>

            <div className="sm:col-span-2">
              <label className="block text-sm font-medium text-slate-700 mb-2">Observaciones</label>
              <textarea
                value={form.observaciones}
                onChange={(e) => setForm({ ...form, observaciones: e.target.value })}
                className="w-full px-4 py-3 border-2 border-slate-200 rounded-xl text-slate-800 placeholder-slate-400 focus:outline-none focus:border-blue-500 focus:ring-4 focus:ring-blue-500/10 transition-all resize-none"
                rows={3}
                placeholder="Descripción del mantenimiento..."
              />
            </div>
          </div>

          <div className="flex justify-end gap-3 pt-4 border-t border-slate-100">
            <Button variant="secondary" type="button" onClick={handleCloseModal}>
              Cancelar
            </Button>
            <Button type="submit" disabled={formLoading || herramientas.length === 0}>
              {formLoading ? "Creando..." : "Crear Mantenimiento"}
            </Button>
          </div>
        </form>
      </Modal>

      {/* Finish Modal */}
      <Modal open={showFinishModal} onClose={() => { setShowFinishModal(false); setFinishingMantenimiento(null); }} title="Finalizar Mantenimiento" size="md">
        {finishError && (
          <div className="mb-4 p-4 bg-red-50 border border-red-200 rounded-xl text-red-700 text-sm">
            {finishError}
          </div>
        )}

        <div className="space-y-5">
          <div className="p-4 bg-slate-50 rounded-xl">
            <p className="text-sm text-slate-600">
              <span className="font-medium">Herramienta:</span> {finishingMantenimiento?.herramienta.nombre}
            </p>
            <p className="text-sm text-slate-600 mt-1">
              <span className="font-medium">Técnico:</span> {finishingMantenimiento?.tecnico.nombre_completo}
            </p>
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-700 mb-2">Fecha de Finalización *</label>
            <input
              type="date"
              value={finishForm.fecha_fin}
              onChange={(e) => setFinishForm({ ...finishForm, fecha_fin: e.target.value })}
              className="w-full px-4 py-3 border-2 border-slate-200 rounded-xl text-slate-800 focus:outline-none focus:border-blue-500 focus:ring-4 focus:ring-blue-500/10 transition-all"
              required
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-700 mb-2">Costo del Mantenimiento</label>
            <div className="relative">
              <span className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 font-medium">$</span>
              <input
                type="number"
                step="0.01"
                value={finishForm.costo}
                onChange={(e) => setFinishForm({ ...finishForm, costo: e.target.value })}
                className="w-full pl-8 pr-4 py-3 border-2 border-slate-200 rounded-xl text-slate-800 placeholder-slate-400 focus:outline-none focus:border-blue-500 focus:ring-4 focus:ring-blue-500/10 transition-all"
                placeholder="0.00"
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-700 mb-2">Observaciones Finales</label>
            <textarea
              value={finishForm.observaciones}
              onChange={(e) => setFinishForm({ ...finishForm, observaciones: e.target.value })}
              className="w-full px-4 py-3 border-2 border-slate-200 rounded-xl text-slate-800 placeholder-slate-400 focus:outline-none focus:border-blue-500 focus:ring-4 focus:ring-blue-500/10 transition-all resize-none"
              rows={3}
              placeholder="Trabajo realizado, repuestos cambiados, etc."
            />
          </div>

          <div className="flex justify-end gap-3 pt-4 border-t border-slate-100">
            <Button variant="secondary" onClick={() => { setShowFinishModal(false); setFinishingMantenimiento(null); }}>
              Cancelar
            </Button>
            <Button onClick={handleFinish} disabled={finishLoading}>
              {finishLoading ? "Finalizando..." : "Finalizar Mantenimiento"}
            </Button>
          </div>
        </div>
      </Modal>

      {/* Delete Confirmation */}
      <ConfirmDialog
        open={showDeleteModal}
        onClose={() => { setShowDeleteModal(false); setDeletingMantenimiento(null); }}
        onConfirm={handleDelete}
        title="Cancelar Mantenimiento"
        message={`¿Está seguro de cancelar el mantenimiento de "${deletingMantenimiento?.herramienta.nombre}"? La herramienta volverá a estar disponible.`}
        confirmLabel="Cancelar Mantenimiento"
        variant="danger"
        loading={formLoading}
      />
    </div>
  );
}