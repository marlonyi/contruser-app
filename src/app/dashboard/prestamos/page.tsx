"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { Button } from "@/components/ui/Button";
import { EstadoBadge, TransactionBadge } from "@/components/ui/Badge";
import { formatDateTime } from "@/lib/utils";

interface Transaccion {
  id: number;
  tipo: "ENTREGA" | "DEVOLUCION";
  fecha_hora: string;
  observaciones: string | null;
  herramienta: { nombre: string; codigo_qr: string };
  usuario_responsable: { nombre_completo: string };
  encargado: { nombre_completo: string };
}

export default function PrestamosPage() {
  const [transacciones, setTransacciones] = useState<Transaccion[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [filter, setFilter] = useState<"todos" | "ENTREGA" | "DEVOLUCION">("todos");

  useEffect(() => {
    const fetchTransacciones = async () => {
      try {
        setLoading(true);
        const res = await fetch("/api/transacciones");
        if (!res.ok) throw new Error("Error al cargar transacciones");
        const data = await res.json();
        setTransacciones(data);
        setError(null);
      } catch {
        setError("No se pudieron cargar las transacciones");
      } finally {
        setLoading(false);
      }
    };

    fetchTransacciones();
  }, []);

  const transaccionesFiltradas = transacciones.filter((t) => {
    if (filter === "todos") return true;
    return t.tipo === filter;
  });

  const stats = {
    total: transacciones.length,
    entregas: transacciones.filter((t) => t.tipo === "ENTREGA").length,
    devoluciones: transacciones.filter((t) => t.tipo === "DEVOLUCION").length,
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-8">
        <div>
          <h1 className="text-2xl font-bold text-slate-800">Préstamos y Devoluciones</h1>
          <p className="text-slate-500 mt-1">Historial de transacciones de herramientas</p>
        </div>
        <Link href="/dashboard/prestamos/nuevo">
          <Button>
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
            </svg>
            Nueva Transacción
          </Button>
        </Link>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-3 gap-4 mb-8">
        <div className="bg-white rounded-xl border border-slate-100 p-4 text-center">
          <p className="text-sm text-slate-500">Total</p>
          <p className="text-2xl font-bold text-slate-800">{stats.total}</p>
        </div>
        <div className="bg-blue-50 rounded-xl border border-blue-100 p-4 text-center">
          <p className="text-sm text-blue-600">Entregas</p>
          <p className="text-2xl font-bold text-blue-700">{stats.entregas}</p>
        </div>
        <div className="bg-emerald-50 rounded-xl border border-emerald-100 p-4 text-center">
          <p className="text-sm text-emerald-600">Devoluciones</p>
          <p className="text-2xl font-bold text-emerald-700">{stats.devoluciones}</p>
        </div>
      </div>

      {/* Filters */}
      <div className="flex flex-wrap gap-2 mb-6">
        {(["todos", "ENTREGA", "DEVOLUCION"] as const).map((f) => (
          <button
            key={f}
            onClick={() => setFilter(f)}
            className={`px-4 py-2 text-sm font-medium rounded-xl transition-all ${
              filter === f
                ? f === "ENTREGA"
                  ? "bg-blue-600 text-white shadow-lg shadow-blue-500/25"
                  : f === "DEVOLUCION"
                  ? "bg-emerald-600 text-white shadow-lg shadow-emerald-500/25"
                  : "bg-slate-800 text-white shadow-lg"
                : "bg-white text-slate-600 border border-slate-200 hover:bg-slate-50"
            }`}
          >
            {f === "todos" ? "Todos" : f === "ENTREGA" ? "Entregas" : "Devoluciones"}
          </button>
        ))}
      </div>

      {error && (
        <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-xl text-red-700 text-sm flex items-center gap-3">
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
          {error}
        </div>
      )}

      {/* Transactions List */}
      {transaccionesFiltradas.length === 0 ? (
        <div className="bg-white rounded-2xl shadow-sm border border-slate-100 py-16 text-center">
          <div className="w-16 h-16 bg-slate-100 rounded-2xl flex items-center justify-center mx-auto mb-4">
            <svg className="w-8 h-8 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M8 7h12m0 0l-4-4m4 4l-4 4m0 6H4m0 0l4 4m-4-4l4-4" />
            </svg>
          </div>
          <h3 className="text-lg font-semibold text-slate-800 mb-1">No hay transacciones</h3>
          <p className="text-slate-500 mb-6">
            {filter === "todos"
              ? "Registra tu primera transacción"
              : filter === "ENTREGA"
              ? "No hay entregas registradas"
              : "No hay devoluciones registradas"}
          </p>
          <Link href="/dashboard/prestamos/nuevo">
            <Button>
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
              </svg>
              Nueva Transacción
            </Button>
          </Link>
        </div>
      ) : (
        <div className="space-y-3">
          {transaccionesFiltradas.map((t) => (
            <div
              key={t.id}
              className="bg-white rounded-xl border border-slate-100 p-4 hover:shadow-md transition-all"
            >
              <div className="flex items-start justify-between gap-4">
                <div className="flex items-start gap-4">
                  <div className={`w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0 ${
                    t.tipo === "ENTREGA" ? "bg-blue-100" : "bg-emerald-100"
                  }`}>
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
                    <div className="flex items-center gap-2 mb-1">
                      <h3 className="font-semibold text-slate-800 truncate">{t.herramienta.nombre}</h3>
                      <TransactionBadge tipo={t.tipo} />
                    </div>
                    <p className="text-sm text-slate-500 font-mono">{t.herramienta.codigo_qr}</p>
                    <div className="mt-2 flex flex-wrap items-center gap-x-4 gap-y-1 text-sm text-slate-600">
                      <span className="flex items-center gap-1">
                        <svg className="w-4 h-4 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                        </svg>
                        {t.usuario_responsable.nombre_completo}
                      </span>
                      <span className="flex items-center gap-1">
                        <svg className="w-4 h-4 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                        </svg>
                        {formatDateTime(t.fecha_hora)}
                      </span>
                    </div>
                    {t.observaciones && (
                      <p className="mt-2 text-sm text-slate-500 bg-slate-50 px-3 py-1.5 rounded-lg">
                        {t.observaciones}
                      </p>
                    )}
                  </div>
                </div>
                <div className="text-right flex-shrink-0">
                  <p className="text-xs text-slate-400">Encargado</p>
                  <p className="text-sm font-medium text-slate-700">{t.encargado.nombre_completo}</p>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}