import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { Prisma } from "@/generated/prisma/client";
import { z } from "zod";

const TransaccionSchema = z.object({
  tipo: z.enum(["ENTREGA", "DEVOLUCION"]),
  herramienta_id: z.number().int().positive(),
  usuario_responsable_id: z.number().int().positive(),
  encargado_id: z.number().int().positive(),
  estado_herramienta_momento: z.enum(["DISPONIBLE", "PRESTADA", "MANTENIMIENTO", "DANADA", "PERDIDA"]),
  observaciones: z.string().optional(),
});

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const tipo = searchParams.get("tipo");
    const herramientaId = searchParams.get("herramienta_id");
    const usuarioId = searchParams.get("usuario_id");

    const transacciones = await prisma.transaccion.findMany({
      where: {
        ...(tipo && { tipo: tipo as never }),
        ...(herramientaId && { herramienta_id: Number(herramientaId) }),
        ...(usuarioId && { usuario_responsable_id: Number(usuarioId) }),
      },
      include: {
        herramienta: { select: { nombre: true, codigo_qr: true, estado_actual: true } },
        usuario_responsable: { select: { nombre_completo: true, documento: true } },
        encargado: { select: { nombre_completo: true } },
      },
      orderBy: { fecha_hora: "desc" },
    });

    return NextResponse.json(transacciones);
  } catch {
    return NextResponse.json({ error: "Error al obtener transacciones" }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const data = TransaccionSchema.parse(body);

    // Ejecutar en transacción atómica
    const result = await prisma.$transaction(async (tx: Prisma.TransactionClient) => {
      const transaccion = await tx.transaccion.create({
        data,
        include: {
          herramienta: true,
          usuario_responsable: true,
          encargado: true,
        },
      });

      // Actualizar estado de la herramienta
      const nuevoEstado =
        data.tipo === "ENTREGA" ? "PRESTADA" : "DISPONIBLE";
      await tx.herramienta.update({
        where: { id: data.herramienta_id },
        data: { estado_actual: nuevoEstado },
      });

      return transaccion;
    });

    return NextResponse.json(result, { status: 201 });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: "Datos inválidos", details: error.issues }, { status: 400 });
    }
    return NextResponse.json({ error: "Error al registrar transacción" }, { status: 500 });
  }
}
