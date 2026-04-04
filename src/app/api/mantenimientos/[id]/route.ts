import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { z } from "zod";

const MantenimientoUpdateSchema = z.object({
  fecha_fin: z.string().optional().nullable(),
  costo: z.number().nonnegative().optional().nullable(),
  observaciones: z.string().optional().nullable(),
});

interface RouteParams {
  params: Promise<{ id: string }>;
}

export async function GET(request: NextRequest, { params }: RouteParams) {
  try {
    const { id } = await params;
    const mantenimiento = await prisma.mantenimiento.findUnique({
      where: { id: Number(id) },
      include: {
        herramienta: { select: { id: true, nombre: true, codigo_qr: true, estado_actual: true } },
        tecnico: { select: { id: true, nombre_completo: true } },
      },
    });

    if (!mantenimiento) {
      return NextResponse.json({ error: "Mantenimiento no encontrado" }, { status: 404 });
    }

    return NextResponse.json(mantenimiento);
  } catch {
    return NextResponse.json({ error: "Error al obtener mantenimiento" }, { status: 500 });
  }
}

export async function PUT(request: NextRequest, { params }: RouteParams) {
  try {
    const { id } = await params;
    const body = await request.json();
    const data = MantenimientoUpdateSchema.parse(body);

    const existente = await prisma.mantenimiento.findUnique({
      where: { id: Number(id) },
      include: { herramienta: true },
    });

    if (!existente) {
      return NextResponse.json({ error: "Mantenimiento no encontrado" }, { status: 404 });
    }

    // Si se está finalizando el mantenimiento (añadiendo fecha_fin)
    if (data.fecha_fin && !existente.fecha_fin) {
      const fechaFin = new Date(data.fecha_fin);

      if (fechaFin < existente.fecha_inicio) {
        return NextResponse.json(
          { error: "La fecha de fin no puede ser anterior a la fecha de inicio" },
          { status: 400 }
        );
      }

      const result = await prisma.$transaction(async (tx) => {
        const mantenimiento = await tx.mantenimiento.update({
          where: { id: Number(id) },
          data: {
            fecha_fin: fechaFin,
            costo: data.costo,
            observaciones: data.observaciones,
          },
          include: {
            herramienta: true,
            tecnico: true,
          },
        });

        // Actualizar estado de la herramienta a DISPONIBLE
        await tx.herramienta.update({
          where: { id: existente.herramienta_id },
          data: { estado_actual: "DISPONIBLE" },
        });

        return mantenimiento;
      });

      return NextResponse.json(result);
    }

    // Solo actualizar campos sin cambiar estado
    const actualizado = await prisma.mantenimiento.update({
      where: { id: Number(id) },
      data: {
        costo: data.costo,
        observaciones: data.observaciones,
      },
      include: {
        herramienta: true,
        tecnico: true,
      },
    });

    return NextResponse.json(actualizado);
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: "Datos inválidos", details: error.issues }, { status: 400 });
    }
    return NextResponse.json({ error: "Error al actualizar mantenimiento" }, { status: 500 });
  }
}

export async function DELETE(request: NextRequest, { params }: RouteParams) {
  try {
    const { id } = await params;

    const mantenimiento = await prisma.mantenimiento.findUnique({
      where: { id: Number(id) },
    });

    if (!mantenimiento) {
      return NextResponse.json({ error: "Mantenimiento no encontrado" }, { status: 404 });
    }

    // Solo permitir eliminar si no tiene fecha_fin (está en curso)
    if (mantenimiento.fecha_fin) {
      return NextResponse.json(
        { error: "No se puede eliminar un mantenimiento finalizado" },
        { status: 400 }
      );
    }

    // Eliminar y actualizar estado de la herramienta
    await prisma.$transaction(async (tx) => {
      await tx.mantenimiento.delete({ where: { id: Number(id) } });

      // Devolver la herramienta a DISPONIBLE
      await tx.herramienta.update({
        where: { id: mantenimiento.herramienta_id },
        data: { estado_actual: "DISPONIBLE" },
      });
    });

    return NextResponse.json({ message: "Mantenimiento eliminado correctamente" });
  } catch {
    return NextResponse.json({ error: "Error al eliminar mantenimiento" }, { status: 500 });
  }
}