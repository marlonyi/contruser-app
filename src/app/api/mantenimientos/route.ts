import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { Prisma, EstadoHerramienta } from "@/generated/prisma/client";
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

/**
 * @openapi
 * /mantenimientos:
 *   get:
 *     tags:
 *       - Mantenimientos
 *     summary: Listar mantenimientos
 *     parameters:
 *       - in: query
 *         name: herramienta_id
 *         schema:
 *           type: integer
 *       - in: query
 *         name: tipo
 *         schema:
 *           type: string
 *           enum: [PREVENTIVO, CORRECTIVO]
 *       - in: query
 *         name: activos
 *         schema:
 *           type: boolean
 *         description: Filtrar mantenimientos activos (sin fecha_fin)
 *     responses:
 *       200:
 *         description: Lista de mantenimientos
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 $ref: '#/components/schemas/Mantenimiento'
 */
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const herramientaId = searchParams.get("herramienta_id");
    const tipo = searchParams.get("tipo");
    const activos = searchParams.get("activos");

    const mantenimientos = await prisma.mantenimiento.findMany({
      where: {
        ...(herramientaId && { herramienta_id: Number(herramientaId) }),
        ...(tipo && { tipo: tipo as never }),
        ...(activos === "true" && { fecha_fin: null }),
      },
      include: {
        herramienta: { select: { id: true, nombre: true, codigo_qr: true, estado_actual: true } },
        tecnico: { select: { id: true, nombre_completo: true } },
      },
      orderBy: { fecha_inicio: "desc" },
    });
    return NextResponse.json(mantenimientos);
  } catch {
    return NextResponse.json({ error: "Error al obtener mantenimientos" }, { status: 500 });
  }
}

/**
 * @openapi
 * /mantenimientos:
 *   post:
 *     tags:
 *       - Mantenimientos
 *     summary: Registrar mantenimiento
 *     description: Crea un registro de mantenimiento y marca la herramienta en estado MANTENIMIENTO
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - tipo
 *               - fecha_inicio
 *               - herramienta_id
 *               - tecnico_id
 *             properties:
 *               tipo:
 *                 type: string
 *                 enum: [PREVENTIVO, CORRECTIVO]
 *               fecha_inicio:
 *                 type: string
 *                 format: date-time
 *               fecha_fin:
 *                 type: string
 *                 format: date-time
 *               costo:
 *                 type: number
 *               observaciones:
 *                 type: string
 *               herramienta_id:
 *                 type: integer
 *               tecnico_id:
 *                 type: integer
 *     responses:
 *       201:
 *         description: Mantenimiento registrado
 *       400:
 *         description: Datos inválidos o herramienta no disponible
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const data = MantenimientoSchema.parse(body);

    // Validar existencia de herramienta y tecnico
    const [herramienta, tecnico] = await Promise.all([
      prisma.herramienta.findUnique({ where: { id: data.herramienta_id } }),
      prisma.usuario.findUnique({ where: { id: data.tecnico_id } }),
    ]);

    if (!herramienta) {
      return NextResponse.json({ error: "Herramienta no encontrada" }, { status: 400 });
    }

    if (!tecnico) {
      return NextResponse.json({ error: "Técnico no encontrado" }, { status: 400 });
    }

    // Validar que el tecnico esté activo
    if (tecnico.estado !== "ACTIVO") {
      return NextResponse.json(
        { error: "No se pueden asignar mantenimientos a usuarios inactivos" },
        { status: 400 }
      );
    }

    const estadoActual = herramienta.estado_actual as EstadoHerramienta;

    // Validar que la herramienta no esté en mantenimiento ya
    if (estadoActual === "MANTENIMIENTO") {
      return NextResponse.json(
        { error: "La herramienta ya se encuentra en mantenimiento" },
        { status: 400 }
      );
    }

    // Validar que la herramienta esté disponible o dañada para mantenimiento
    if (estadoActual === "PRESTADA") {
      return NextResponse.json(
        { error: "No se puede enviar a mantenimiento una herramienta prestada. Debe devolverse primero." },
        { status: 400 }
      );
    }

    // Validar que la herramienta no esté perdida
    if (estadoActual === "PERDIDA") {
      return NextResponse.json(
        { error: "No se puede enviar a mantenimiento una herramienta marcada como perdida" },
        { status: 400 }
      );
    }

    // Validar fechas
    const fechaInicio = new Date(data.fecha_inicio);
    const fechaFin = data.fecha_fin ? new Date(data.fecha_fin) : null;

    if (fechaFin && fechaFin < fechaInicio) {
      return NextResponse.json(
        { error: "La fecha de fin no puede ser anterior a la fecha de inicio" },
        { status: 400 }
      );
    }

    const result = await prisma.$transaction(async (tx: Prisma.TransactionClient) => {
      const mantenimiento = await tx.mantenimiento.create({
        data: {
          tipo: data.tipo,
          fecha_inicio: fechaInicio,
          fecha_fin: fechaFin,
          costo: data.costo,
          observaciones: data.observaciones,
          herramienta_id: data.herramienta_id,
          tecnico_id: data.tecnico_id,
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
