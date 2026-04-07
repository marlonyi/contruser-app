import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { z } from "zod";

const CategoriaUpdateSchema = z.object({
  nombre: z.string().min(2).optional(),
  descripcion: z.string().optional().nullable(),
});

interface RouteParams {
  params: Promise<{ id: string }>;
}

/**
 * @openapi
 * /categorias/{id}:
 *   get:
 *     tags:
 *       - Categorías
 *     summary: Obtener categoría por ID
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *     responses:
 *       200:
 *         description: Detalles de la categoría
 *       404:
 *         description: Categoría no encontrada
 */
export async function GET(request: NextRequest, { params }: RouteParams) {
  try {
    const { id } = await params;
    const categoria = await prisma.categoria.findUnique({
      where: { id: Number(id) },
      include: {
        _count: { select: { herramientas: true } },
      },
    });

    if (!categoria) {
      return NextResponse.json({ error: "Categoría no encontrada" }, { status: 404 });
    }

    return NextResponse.json(categoria);
  } catch {
    return NextResponse.json({ error: "Error al obtener categoría" }, { status: 500 });
  }
}

/**
 * @openapi
 * /categorias/{id}:
 *   put:
 *     tags:
 *       - Categorías
 *     summary: Actualizar categoría
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
 *               descripcion:
 *                 type: string
 *     responses:
 *       200:
 *         description: Categoría actualizada
 *       400:
 *         description: Datos inválidos
 *       404:
 *         description: Categoría no encontrada
 *       409:
 *         description: Nombre duplicado
 */
export async function PUT(request: NextRequest, { params }: RouteParams) {
  try {
    const { id } = await params;
    const body = await request.json();
    const data = CategoriaUpdateSchema.parse(body);

    const existente = await prisma.categoria.findUnique({
      where: { id: Number(id) },
    });

    if (!existente) {
      return NextResponse.json({ error: "Categoría no encontrada" }, { status: 404 });
    }

    // Verificar nombre duplicado si se está actualizando
    if (data.nombre && data.nombre !== existente.nombre) {
      const duplicado = await prisma.categoria.findFirst({
        where: {
          nombre: data.nombre,
          NOT: { id: Number(id) },
        },
      });

      if (duplicado) {
        return NextResponse.json(
          { error: "Ya existe una categoría con ese nombre" },
          { status: 409 }
        );
      }
    }

    const categoria = await prisma.categoria.update({
      where: { id: Number(id) },
      data,
      include: { _count: { select: { herramientas: true } } },
    });

    return NextResponse.json(categoria);
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: "Datos inválidos", details: error.issues }, { status: 400 });
    }
    return NextResponse.json({ error: "Error al actualizar categoría" }, { status: 500 });
  }
}

/**
 * @openapi
 * /categorias/{id}:
 *   delete:
 *     tags:
 *       - Categorías
 *     summary: Eliminar categoría
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *     responses:
 *       200:
 *         description: Categoría eliminada
 *       400:
 *         description: No se puede eliminar (tiene herramientas)
 *       404:
 *         description: Categoría no encontrada
 */
export async function DELETE(request: NextRequest, { params }: RouteParams) {
  try {
    const { id } = await params;

    const categoria = await prisma.categoria.findUnique({
      where: { id: Number(id) },
      include: {
        _count: { select: { herramientas: true } },
      },
    });

    if (!categoria) {
      return NextResponse.json({ error: "Categoría no encontrada" }, { status: 404 });
    }

    // No eliminar si tiene herramientas asociadas
    if (categoria._count.herramientas > 0) {
      return NextResponse.json(
        { error: "No se puede eliminar una categoría que tiene herramientas asociadas" },
        { status: 400 }
      );
    }

    await prisma.categoria.delete({ where: { id: Number(id) } });

    return NextResponse.json({ message: "Categoría eliminada correctamente" });
  } catch {
    return NextResponse.json({ error: "Error al eliminar categoría" }, { status: 500 });
  }
}