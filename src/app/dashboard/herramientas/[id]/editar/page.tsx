"use client";

import { useState, useEffect, use } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Button } from "@/components/ui/Button";
import { EstadoBadge } from "@/components/ui/Badge";
import { ESTADO_HERRAMIENTA_LABELS } from "@/lib/utils";
import type { EstadoHerramienta } from "@/generated/prisma/client";

interface Categoria {
  id: number;
  nombre: string;
}

interface Herramienta {
  id: number;
  codigo_qr: string;
  nombre: string;
  marca: string | null;
  modelo: string | null;
  fecha_compra: string | null;
  valor_compra: number | null;
  estado_actual: EstadoHerramienta;
  categoria_id: number;
  categoria: { id: number; nombre: string };
}

interface Props {
  params: Promise<{ id: string }>;
}

const ESTADOS = Object.entries(ESTADO_HERRAMIENTA_LABELS);

export default function EditarHerramientaPage({ params }: Props) {
  const resolvedParams = use(params);
  const router = useRouter();
  const [herramienta, setHerramienta] = useState<Herramienta | null>(null);
  const [categorias, setCategorias] = useState<Categoria[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [form, setForm] = useState({
    nombre: "",
    marca: "",
    modelo: "",
    fecha_compra: "",
    valor_compra: "",
    categoria_id: "",
    estado_actual: "",
  });

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [herrRes, catRes] = await Promise.all([
          fetch(`/api/herramientas/${resolvedParams.id}`),
          fetch("/api/categorias"),
        ]);

        if (!herrRes.ok) {
          if (herrRes.status === 404) {
            setError("Herramienta no encontrada");
            return;
          }
          throw new Error("Error al cargar herramienta");
        }

        if (!catRes.ok) throw new Error("Error al cargar categorias");

        const herrData = await herrRes.json();
        const catData = await catRes.json();

        setHerramienta(herrData);
        setCategorias(catData);

        setForm({
          nombre: herrData.nombre,
          marca: herrData.marca || "",
          modelo: herrData.modelo || "",
          fecha_compra: herrData.fecha_compra ? herrData.fecha_compra.split("T")[0] : "",
          valor_compra: herrData.valor_compra ? String(herrData.valor_compra) : "",
          categoria_id: String(herrData.categoria_id),
          estado_actual: herrData.estado_actual,
        });
      } catch {
        setError("Error al cargar los datos");
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [resolvedParams.id]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setError(null);

    try {
      const payload = {
        nombre: form.nombre,
        marca: form.marca || null,
        modelo: form.modelo || null,
        fecha_compra: form.fecha_compra || null,
        valor_compra: form.valor_compra ? parseFloat(form.valor_compra) : null,
        categoria_id: parseInt(form.categoria_id),
        estado_actual: form.estado_actual,
      };

      const res = await fetch(`/api/herramientas/${resolvedParams.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || "Error al actualizar herramienta");
      }

      router.push("/dashboard/herramientas");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Error desconocido");
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  if (!herramienta) {
    return (
      <div className="text-center py-12">
        <p className="text-slate-500">{error || "Herramienta no encontrada"}</p>
        <Link href="/dashboard/herramientas" className="text-blue-600 hover:underline mt-2 inline-block">
          Volver a herramientas
        </Link>
      </div>
    );
  }

  return (
    <div className="max-w-2xl mx-auto">
      <div className="mb-8">
        <Link
          href="/dashboard/herramientas"
          className="inline-flex items-center gap-1 text-sm text-slate-500 hover:text-slate-700 mb-4"
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
          </svg>
          Volver a herramientas
        </Link>
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-slate-800">{herramienta.nombre}</h1>
            <p className="text-slate-400 text-sm font-mono mt-1">{herramienta.codigo_qr}</p>
          </div>
          <EstadoBadge estado={herramienta.estado_actual} />
        </div>
      </div>

      {error && (
        <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg text-red-700 text-sm">
          {error}
        </div>
      )}

      <div className="bg-white rounded-2xl shadow-sm border border-slate-100 p-6">
        <form onSubmit={handleSubmit} className="space-y-5">
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">
              Nombre *
            </label>
            <input
              type="text"
              value={form.nombre}
              onChange={(e) => setForm({ ...form, nombre: e.target.value })}
              className="w-full px-3 py-2 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              required
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">
                Marca
              </label>
              <input
                type="text"
                value={form.marca}
                onChange={(e) => setForm({ ...form, marca: e.target.value })}
                className="w-full px-3 py-2 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">
                Modelo
              </label>
              <input
                type="text"
                value={form.modelo}
                onChange={(e) => setForm({ ...form, modelo: e.target.value })}
                className="w-full px-3 py-2 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">
                Fecha de Compra
              </label>
              <input
                type="date"
                value={form.fecha_compra}
                onChange={(e) => setForm({ ...form, fecha_compra: e.target.value })}
                className="w-full px-3 py-2 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">
                Valor de Compra
              </label>
              <div className="relative">
                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400">$</span>
                <input
                  type="number"
                  step="0.01"
                  value={form.valor_compra}
                  onChange={(e) => setForm({ ...form, valor_compra: e.target.value })}
                  className="w-full pl-7 pr-3 py-2 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">
                Categoria *
              </label>
              <select
                value={form.categoria_id}
                onChange={(e) => setForm({ ...form, categoria_id: e.target.value })}
                className="w-full px-3 py-2 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                required
              >
                {categorias.map((cat) => (
                  <option key={cat.id} value={cat.id}>
                    {cat.nombre}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">
                Estado *
              </label>
              <select
                value={form.estado_actual}
                onChange={(e) => setForm({ ...form, estado_actual: e.target.value })}
                className="w-full px-3 py-2 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                required
              >
                {ESTADOS.map(([value, label]) => (
                  <option key={value} value={value}>
                    {label}
                  </option>
                ))}
              </select>
              {herramienta.estado_actual === "PRESTADA" && form.estado_actual !== herramienta.estado_actual && (
                <p className="mt-1 text-xs text-amber-600">
                  Nota: Cambiar el estado de una herramienta prestada puede causar inconsistencias en los registros.
                </p>
              )}
            </div>
          </div>

          <div className="flex justify-end gap-3 pt-4 border-t border-slate-100">
            <Link
              href="/dashboard/herramientas"
              className="px-4 py-2 text-sm font-medium text-slate-700 bg-slate-100 hover:bg-slate-200 rounded-lg transition"
            >
              Cancelar
            </Link>
            <Button type="submit" disabled={saving}>
              {saving ? "Guardando..." : "Guardar Cambios"}
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}