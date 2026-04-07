import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { z } from "zod";
import { EstadoHerramienta } from "@/generated/prisma/client";

const HerramientaUpdateSchema = z.object({
  nombre: z.string().min(2).optional(),
  marca: z.string().optional().nullable(),
  modelo: z.string().optional().nullable(),
  fecha_compra: z.string().optional().nullable(),
  valor_compra: z.number().positive().optional().nullable(),
  categoria_id: z.number().int().positive().optional(),
  estado_actual: z.enum(["DISPONIBLE", "PRESTADA", "MANTENIMIENTO", "DANADA", "PERDIDA"]).optional(),
});

interface RouteParams {
  params: Promise<{ id: string }>;
}

/**
 * @openapi
 * /herramientas/{id}:
 *   get:
 *     tags:
 *       - Herramientas
 *     summary: Obtener herramienta por ID
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *     responses:
 *       200:
 *         description: Detalles de la herramienta
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Herramienta'
 *       404:
 *         description: Herramienta no encontrada
 */
export async function GET(request: NextRequest, { params }: RouteParams) {
  try {
    const { id } = await params;
    const herramienta = await prisma.herramienta.findUnique({
      where: { id: Number(id) },
      include: {
        categoria: true,
        transacciones: {
          orderBy: { fecha_hora: "desc" },
          take: 10,
          include: {
            usuario_responsable: { select: { nombre_completo: true, documento: true } },
            encargado: { select: { nombre_completo: true } },
          },
        },
        mantenimientos: {
          orderBy: { fecha_inicio: "desc" },
          take: 5,
          include: { tecnico: { select: { nombre_completo: true } } },
        },
      },
    });

    if (!herramienta) {
      return NextResponse.json({ error: "Herramienta no encontrada" }, { status: 404 });
    }

    return NextResponse.json(herramienta);
  } catch {
    return NextResponse.json({ error: "Error al obtener herramienta" }, { status: 500 });
  }
}

/**
 * @openapi
 * /herramientas/{id}:
 *   put:
 *     tags:
 *       - Herramientas
 *     summary: Actualizar herramienta
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               nombre:
 *                 type: string
 *               marca:
 *                 type: string
 *               modelo:
 *                 type: string
 *               fecha_compra:
 *                 type: string
 *               valor_compra:
 *                 type: number
 *               categoria_id:
 *                 type: integer
 *               estado_actual:
 *                 type: string
 *                 enum: [DISPONIBLE, PRESTADA, MANTENIMIENTO, DANADA, PERDIDA]
 *     responses:
 *       200:
 *         description: Herramienta actualizada
 *       400:
 *         description: Datos inválidos o transición de estado no permitida
 *       404:
 *         description: Herramienta no encontrada
 */
export async function PUT(request: NextRequest, { params }: RouteParams) {
  try {
    const { id } = await params;
    const body = await request.json();
    const data = HerramientaUpdateSchema.parse(body);

    const existente = await prisma.herramienta.findUnique({
      where: { id: Number(id) },
    });

    if (!existente) {
      return NextResponse.json({ error: "Herramienta no encontrada" }, { status: 404 });
    }

    // Validar transiciones de estado válidas
    if (data.estado_actual) {
      const estadoActual = existente.estado_actual as EstadoHerramienta;
      const nuevoEstado = data.estado_actual as EstadoHerramienta;

      // Una herramienta prestada solo puede ser devuelta (DISPONIBLE), pasar a DAÑADA o PERDIDA
      if (estadoActual === "PRESTADA" && !["DISPONIBLE", "DANADA", "PERDIDA"].includes(nuevoEstado)) {
        return NextResponse.json(
          { error: "Una herramienta prestada solo puede ser devuelta, marcada como dañada o perdida" },
          { status: 400 }
        );
      }

      // Una herramienta en mantenimiento solo puede pasar a DISPONIBLE
      if (estadoActual === "MANTENIMIENTO" && nuevoEstado !== "DISPONIBLE") {
        return NextResponse.json(
          { error: "Una herramienta en mantenimiento solo puede pasar a disponible" },
          { status: 400 }
        );
      }
    }

    // Validar categoría si se proporciona
    if (data.categoria_id) {
      const categoria = await prisma.categoria.findUnique({
        where: { id: data.categoria_id },
      });
      if (!categoria) {
        return NextResponse.json({ error: "Categoría no encontrada" }, { status: 400 });
      }
    }

    const actualizada = await prisma.herramienta.update({
      where: { id: Number(id) },
      data: {
        ...data,
        fecha_compra: data.fecha_compra ? new Date(data.fecha_compra) : data.fecha_compra === null ? null : undefined,
      },
      include: { categoria: true },
    });

    return NextResponse.json(actualizada);
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: "Datos inválidos", details: error.issues }, { status: 400 });
    }
    return NextResponse.json({ error: "Error al actualizar herramienta" }, { status: 500 });
  }
}

/**
 * @openapi
 * /herramientas/{id}:
 *   delete:
 *     tags:
 *       - Herramientas
 *     summary: Eliminar herramienta
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *     responses:
 *       200:
 *         description: Herramienta eliminada
 *       400:
 *         description: No se puede eliminar (tiene historial)
 *       404:
 *         description: Herramienta no encontrada
 */
export async function DELETE(request: NextRequest, { params }: RouteParams) {
  try {
    const { id } = await params;

    const herramienta = await prisma.herramienta.findUnique({
      where: { id: Number(id) },
      include: {
        _count: { select: { transacciones: true, mantenimientos: true } },
      },
    });

    if (!herramienta) {
      return NextResponse.json({ error: "Herramienta no encontrada" }, { status: 404 });
    }

    // No eliminar si tiene transacciones o mantenimientos (regla de negocio)
    if (herramienta._count.transacciones > 0 || herramienta._count.mantenimientos > 0) {
      return NextResponse.json(
        { error: "No se puede eliminar una herramienta con historial de transacciones o mantenimientos. Considere cambiar su estado a PERDIDA en su lugar." },
        { status: 400 }
      );
    }

    await prisma.herramienta.delete({ where: { id: Number(id) } });

    return NextResponse.json({ message: "Herramienta eliminada correctamente" });
  } catch {
    return NextResponse.json({ error: "Error al eliminar herramienta" }, { status: 500 });
  }
}