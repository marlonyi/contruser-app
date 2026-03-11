import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { Prisma } from "@/generated/prisma/client";
import { z } from "zod";

const MantenimientoSchema = z.object({
  tipo: z.enum(["PREVENTIVO", "CORRECTIVO"]),
  fecha_inicio: z.string(),
  fecha_fin: z.string().optional(),
  costo: z.number().nonnegative().optional(),
  observaciones: z.string().optional(),
  herramienta_id: z.number().int().positive(),
  tecnico_id: z.number().int().positive(),
});

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const herramientaId = searchParams.get("herramienta_id");

    const mantenimientos = await prisma.mantenimiento.findMany({
      where: { ...(herramientaId && { herramienta_id: Number(herramientaId) }) },
      include: {
        herramienta: { select: { nombre: true, codigo_qr: true } },
        tecnico: { select: { nombre_completo: true } },
      },
      orderBy: { fecha_inicio: "desc" },
    });
    return NextResponse.json(mantenimientos);
  } catch {
    return NextResponse.json({ error: "Error al obtener mantenimientos" }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const data = MantenimientoSchema.parse(body);

    const result = await prisma.$transaction(async (tx: Prisma.TransactionClient) => {
      const mantenimiento = await tx.mantenimiento.create({
        data: {
          ...data,
          fecha_inicio: new Date(data.fecha_inicio),
          fecha_fin: data.fecha_fin ? new Date(data.fecha_fin) : undefined,
        },
        include: {
          herramienta: true,
          tecnico: true,
        },
      });

      // Marcar herramienta en mantenimiento
      await tx.herramienta.update({
        where: { id: data.herramienta_id },
        data: { estado_actual: "MANTENIMIENTO" },
      });

      return mantenimiento;
    });

    return NextResponse.json(result, { status: 201 });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: "Datos inválidos", details: error.issues }, { status: 400 });
    }
    return NextResponse.json({ error: "Error al registrar mantenimiento" }, { status: 500 });
  }
}
