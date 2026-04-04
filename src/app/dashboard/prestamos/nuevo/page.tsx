"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { Button } from "@/components/ui/Button";
import { TransactionBadge } from "@/components/ui/Badge";
import { formatDateTime } from "@/lib/utils";

interface Herramienta {
  id: number;
  nombre: string;
  codigo_qr: string;
  estado_actual: string;
}

interface Usuario {
  id: number;
  nombre_completo: string;
  documento: string;
  rol: string;
  estado: string;
}

export default function PrestamosPage() {
  const [herramientas, setHerramientas] = useState<Herramienta[]>([]);
  const [usuarios, setUsuarios] = useState<Usuario[]>([]);
  const [encargados, setEncargados] = useState<Usuario[]>([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  const [tipo, setTipo] = useState<"ENTREGA" | "DEVOLUCION">("ENTREGA");
  const [herramientaId, setHerramientaId] = useState("");
  const [responsableId, setResponsableId] = useState("");
  const [encargadoId, setEncargadoId] = useState("");
  const [observaciones, setObservaciones] = useState("");
  const [estadoMomento, setEstadoMomento] = useState<string>("DISPONIBLE");

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [herrRes, usrRes] = await Promise.all([
          fetch("/api/herramientas"),
          fetch("/api/usuarios"),
        ]);

        if (!herrRes.ok) throw new Error("Error al cargar herramientas");
        if (!usrRes.ok) throw new Error("Error al cargar usuarios");

        const herrData = await herrRes.json();
        const usrData = await usrRes.json();

        setHerramientas(herrData);
        setUsuarios(usrData.filter((u: Usuario) => u.estado === "ACTIVO"));
        setEncargados(usrData.filter((u: Usuario) => u.rol === "ADMIN" || u.rol === "ENCARGADO"));
        setLoading(false);
      } catch {
        setError("Error al cargar los datos");
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  const herramientasFiltradas = herramientas.filter((h) => {
    if (tipo === "ENTREGA") return h.estado_actual === "DISPONIBLE";
    return h.estado_actual === "PRESTADA";
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    setError(null);
    setSuccess(null);

    try {
      const payload = {
        tipo,
        herramienta_id: parseInt(herramientaId),
        usuario_responsable_id: parseInt(responsableId),
        encargado_id: parseInt(encargadoId),
        estado_herramienta_momento: tipo === "DEVOLUCION" ? estadoMomento : "DISPONIBLE",
        observaciones: observaciones || null,
      };

      const res = await fetch("/api/transacciones", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || "Error al registrar transacción");
      }

      setSuccess(tipo === "ENTREGA" ? "Herramienta entregada correctamente" : "Herramienta devuelta correctamente");

      // Reset form
      setHerramientaId("");
      setResponsableId("");
      setObservaciones("");
      setEstadoMomento("DISPONIBLE");

      // Refresh data
      const herrRes = await fetch("/api/herramientas");
      const herrData = await herrRes.json();
      setHerramientas(herrData);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Error desconocido");
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="max-w-3xl mx-auto min-h-screen">
      {/* Header */}
      <div className="mb-8">
        <Link
          href="/dashboard/prestamos"
          className="inline-flex items-center gap-2 text-sm text-slate-500 hover:text-slate-700 mb-4 transition-colors"
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
          </svg>
          Volver a préstamos
        </Link>
        <h1 className="text-2xl font-bold text-slate-800">Registrar Transacción</h1>
        <p className="text-slate-500 mt-1">Registra una entrega o devolución de herramienta</p>
      </div>

      {/* Form Card */}
      <div className="bg-white rounded-2xl shadow-sm border border-slate-100 overflow-hidden">
        <div className="p-6 border-b border-slate-100 bg-gradient-to-r from-slate-50 to-white">
          <div className="flex items-center gap-3">
            <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${tipo === "ENTREGA" ? "bg-blue-100" : "bg-emerald-100"}`}>
              {tipo === "ENTREGA" ? (
                <svg className="w-5 h-5 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7h12m0 0l-4-4m4 4l-4 4m0 6H4m0 0l4 4m-4-4l4-4" />
                </svg>
              ) : (
                <svg className="w-5 h-5 text-emerald-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              )}
            </div>
            <div>
              <h2 className="font-semibold text-slate-800">Tipo de Transacción</h2>
              <p className="text-sm text-slate-500">Selecciona la acción a realizar</p>
            </div>
          </div>
        </div>

        {/* Success Message */}
        {success && (
          <div className="mx-6 mt-6 p-4 bg-emerald-50 border border-emerald-200 rounded-xl text-emerald-700 text-sm flex items-center gap-3">
            <svg className="w-5 h-5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            {success}
          </div>
        )}

        {/* Error Message */}
        {error && (
          <div className="mx-6 mt-6 p-4 bg-red-50 border border-red-200 rounded-xl text-red-700 text-sm flex items-center gap-3">
            <svg className="w-5 h-5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="p-6 space-y-6">
          {/* Transaction Type */}
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-3">Tipo de Transacción</label>
            <div className="grid grid-cols-2 gap-4">
              <button
                type="button"
                onClick={() => { setTipo("ENTREGA"); setHerramientaId(""); }}
                className={`p-4 rounded-xl border-2 transition-all ${
                  tipo === "ENTREGA"
                    ? "border-blue-500 bg-blue-50"
                    : "border-slate-200 hover:border-slate-300"
                }`}
              >
                <div className="flex items-center gap-3">
                  <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${
                    tipo === "ENTREGA" ? "bg-blue-500 text-white" : "bg-slate-100 text-slate-500"
                  }`}>
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7h12m0 0l-4-4m4 4l-4 4m0 6H4m0 0l4 4m-4-4l4-4" />
                    </svg>
                  </div>
                  <div className="text-left">
                    <p className={`font-medium ${tipo === "ENTREGA" ? "text-blue-700" : "text-slate-700"}`}>
                      Entrega
                    </p>
                    <p className="text-sm text-slate-500">Prestar herramienta</p>
                  </div>
                </div>
              </button>
              <button
                type="button"
                onClick={() => { setTipo("DEVOLUCION"); setHerramientaId(""); }}
                className={`p-4 rounded-xl border-2 transition-all ${
                  tipo === "DEVOLUCION"
                    ? "border-emerald-500 bg-emerald-50"
                    : "border-slate-200 hover:border-slate-300"
                }`}
              >
                <div className="flex items-center gap-3">
                  <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${
                    tipo === "DEVOLUCION" ? "bg-emerald-500 text-white" : "bg-slate-100 text-slate-500"
                  }`}>
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                  </div>
                  <div className="text-left">
                    <p className={`font-medium ${tipo === "DEVOLUCION" ? "text-emerald-700" : "text-slate-700"}`}>
                      Devolución
                    </p>
                    <p className="text-sm text-slate-500">Recibir herramienta</p>
                  </div>
                </div>
              </button>
            </div>
          </div>

          {/* Tool Selection */}
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-2">
              Herramienta <span className="text-red-500">*</span>
            </label>
            <select
              value={herramientaId}
              onChange={(e) => setHerramientaId(e.target.value)}
              className="w-full px-4 py-3 border-2 border-slate-200 rounded-xl text-slate-800 focus:outline-none focus:border-blue-500 focus:ring-4 focus:ring-blue-500/10 transition-all"
              required
            >
              <option value="">Selecciona una herramienta</option>
              {herramientasFiltradas.map((h) => (
                <option key={h.id} value={h.id}>
                  {h.nombre} ({h.codigo_qr})
                </option>
              ))}
            </select>
            {herramientasFiltradas.length === 0 && (
              <p className="mt-2 text-sm text-amber-600 flex items-center gap-2">
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                </svg>
                {tipo === "ENTREGA" ? "No hay herramientas disponibles" : "No hay herramientas prestadas"}
              </p>
            )}
          </div>

          {/* User Selection */}
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-2">
              {tipo === "ENTREGA" ? "Entregar a" : "Recibir de"} <span className="text-red-500">*</span>
            </label>
            <select
              value={responsableId}
              onChange={(e) => setResponsableId(e.target.value)}
              className="w-full px-4 py-3 border-2 border-slate-200 rounded-xl text-slate-800 focus:outline-none focus:border-blue-500 focus:ring-4 focus:ring-blue-500/10 transition-all"
              required
            >
              <option value="">Selecciona un usuario</option>
              {usuarios.map((u) => (
                <option key={u.id} value={u.id}>
                  {u.nombre_completo} - {u.documento}
                </option>
              ))}
            </select>
          </div>

          {/* Encargado */}
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-2">
              Encargado del Registro <span className="text-red-500">*</span>
            </label>
            <select
              value={encargadoId}
              onChange={(e) => setEncargadoId(e.target.value)}
              className="w-full px-4 py-3 border-2 border-slate-200 rounded-xl text-slate-800 focus:outline-none focus:border-blue-500 focus:ring-4 focus:ring-blue-500/10 transition-all"
              required
            >
              <option value="">Selecciona un encargado</option>
              {encargados.map((u) => (
                <option key={u.id} value={u.id}>
                  {u.nombre_completo}
                </option>
              ))}
            </select>
            <p className="mt-1.5 text-xs text-slate-400">Solo administradores y encargados pueden registrar transacciones</p>
          </div>

          {/* Estado al devolver (only for returns) */}
          {tipo === "DEVOLUCION" && (
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-2">
                Estado de la herramienta al devolver <span className="text-red-500">*</span>
              </label>
              <select
                value={estadoMomento}
                onChange={(e) => setEstadoMomento(e.target.value)}
                className="w-full px-4 py-3 border-2 border-slate-200 rounded-xl text-slate-800 focus:outline-none focus:border-blue-500 focus:ring-4 focus:ring-blue-500/10 transition-all"
                required
              >
                <option value="DISPONIBLE">Disponible (en buen estado)</option>
                <option value="DANADA">Dañada (requiere mantenimiento)</option>
                <option value="PERDIDA">Perdida (no devuelta)</option>
              </select>
              {estadoMomento === "DANADA" && (
                <p className="mt-2 text-sm text-amber-600">La herramienta será enviada a mantenimiento automáticamente</p>
              )}
            </div>
          )}

          {/* Observaciones */}
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-2">
              Observaciones
            </label>
            <textarea
              value={observaciones}
              onChange={(e) => setObservaciones(e.target.value)}
              className="w-full px-4 py-3 border-2 border-slate-200 rounded-xl text-slate-800 placeholder-slate-400 focus:outline-none focus:border-blue-500 focus:ring-4 focus:ring-blue-500/10 transition-all resize-none"
              rows={3}
              placeholder="Notas adicionales sobre la transacción..."
            />
          </div>

          {/* Submit */}
          <div className="flex justify-end gap-3 pt-4 border-t border-slate-100">
            <Link
              href="/dashboard/prestamos"
              className="px-6 py-3 text-sm font-medium text-slate-700 bg-slate-100 hover:bg-slate-200 rounded-xl text-center transition-colors"
            >
              Cancelar
            </Link>
            <Button
              type="submit"
              disabled={submitting || herramientasFiltradas.length === 0}
              size="lg"
              variant={tipo === "ENTREGA" ? "primary" : "success"}
            >
              {submitting ? (
                <>
                  <svg className="animate-spin w-5 h-5" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                  </svg>
                  Procesando...
                </>
              ) : (
                <>
                  {tipo === "ENTREGA" ? "Registrar Entrega" : "Registrar Devolución"}
                </>
              )}
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}