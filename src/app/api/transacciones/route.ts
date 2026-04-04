import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { Prisma, EstadoHerramienta } from "@/generated/prisma/client";
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
    const fechaDesde = searchParams.get("fecha_desde");
    const fechaHasta = searchParams.get("fecha_hasta");

    const transacciones = await prisma.transaccion.findMany({
      where: {
        ...(tipo && { tipo: tipo as never }),
        ...(herramientaId && { herramienta_id: Number(herramientaId) }),
        ...(usuarioId && { usuario_responsable_id: Number(usuarioId) }),
        ...(fechaDesde && { fecha_hora: { gte: new Date(fechaDesde) } }),
        ...(fechaHasta && { fecha_hora: { lte: new Date(fechaHasta) } }),
      },
      include: {
        herramienta: { select: { id: true, nombre: true, codigo_qr: true, estado_actual: true } },
        usuario_responsable: { select: { id: true, nombre_completo: true, documento: true } },
        encargado: { select: { id: true, nombre_completo: true } },
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

    // Validar existencia de entidades
    const [herramienta, responsable, encargado] = await Promise.all([
      prisma.herramienta.findUnique({ where: { id: data.herramienta_id } }),
      prisma.usuario.findUnique({ where: { id: data.usuario_responsable_id } }),
      prisma.usuario.findUnique({ where: { id: data.encargado_id } }),
    ]);

    if (!herramienta) {
      return NextResponse.json({ error: "Herramienta no encontrada" }, { status: 400 });
    }
    if (!responsable) {
      return NextResponse.json({ error: "Usuario responsable no encontrado" }, { status: 400 });
    }
    if (!encargado) {
      return NextResponse.json({ error: "Encargado no encontrado" }, { status: 400 });
    }

    // Validar que el encargado tenga rol adecuado
    if (encargado.rol !== "ADMIN" && encargado.rol !== "ENCARGADO") {
      return NextResponse.json(
        { error: "Solo administradores o encargados pueden registrar transacciones" },
        { status: 403 }
      );
    }

    // Validar que el usuario responsable esté activo
    if (responsable.estado !== "ACTIVO") {
      return NextResponse.json(
        { error: "No se pueden asignar herramientas a usuarios inactivos" },
        { status: 400 }
      );
    }

    // Validaciones según tipo de transacción
    const estadoActual = herramienta.estado_actual as EstadoHerramienta;

    if (data.tipo === "ENTREGA") {
      // Solo se pueden prestar herramientas DISPONIBLES
      if (estadoActual !== "DISPONIBLE") {
        return NextResponse.json(
          { error: `No se puede prestar una herramienta en estado "${estadoActual}". Solo las herramientas DISPONIBLES pueden ser prestadas.` },
          { status: 400 }
        );
      }
    } else if (data.tipo === "DEVOLUCION") {
      // Solo se pueden devolver herramientas PRESTADAS
      if (estadoActual !== "PRESTADA") {
        return NextResponse.json(
          { error: `No se puede devolver una herramienta en estado "${estadoActual}". Solo las herramientas PRESTADAS pueden ser devueltas.` },
          { status: 400 }
        );
      }

      // Verificar que el usuario tenga la herramienta prestada actualmente
      const ultimaEntrega = await prisma.transaccion.findFirst({
        where: {
          herramienta_id: data.herramienta_id,
          usuario_responsable_id: data.usuario_responsable_id,
          tipo: "ENTREGA",
        },
        orderBy: { fecha_hora: "desc" },
      });

      const ultimaDevolucion = await prisma.transaccion.findFirst({
        where: {
          herramienta_id: data.herramienta_id,
          usuario_responsable_id: data.usuario_responsable_id,
          tipo: "DEVOLUCION",
        },
        orderBy: { fecha_hora: "desc" },
      });

      // Si hay una entrega más reciente que la última devolución (o no hay devolución), está bien
      const tienePrestamoActivo =
        ultimaEntrega &&
        (!ultimaDevolucion || ultimaEntrega.fecha_hora > ultimaDevolucion.fecha_hora);

      if (!tienePrestamoActivo) {
        return NextResponse.json(
          { error: "El usuario no tiene esta herramienta prestada actualmente" },
          { status: 400 }
        );
      }
    }

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
      const nuevoEstado = data.tipo === "ENTREGA" ? "PRESTADA" : "DISPONIBLE";
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
