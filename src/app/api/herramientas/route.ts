import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { z } from "zod";
import { generateQRCode } from "@/lib/utils";

const HerramientaSchema = z.object({
  nombre: z.string().min(2),
  marca: z.string().optional(),
  modelo: z.string().optional(),
  fecha_compra: z.string().optional(),
  valor_compra: z.number().positive().optional(),
  categoria_id: z.number().int().positive(),
});

/**
 * @openapi
 * /herramientas:
 *   get:
 *     tags:
 *       - Herramientas
 *     summary: Listar herramientas
 *     description: Obtiene todas las herramientas con filtros opcionales
 *     parameters:
 *       - in: query
 *         name: estado
 *         schema:
 *           type: string
 *           enum: [DISPONIBLE, PRESTADA, MANTENIMIENTO, DANADA, PERDIDA]
 *         description: Filtrar por estado
 *       - in: query
 *         name: categoria_id
 *         schema:
 *           type: integer
 *         description: Filtrar por ID de categoría
 *     responses:
 *       200:
 *         description: Lista de herramientas
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 $ref: '#/components/schemas/Herramienta'
 */
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const estado = searchParams.get("estado");
    const categoriaId = searchParams.get("categoria_id");

    const herramientas = await prisma.herramienta.findMany({
      where: {
        ...(estado && { estado_actual: estado as never }),
        ...(categoriaId && { categoria_id: Number(categoriaId) }),
      },
      include: { categoria: true },
      orderBy: { createdAt: "desc" },
    });

    return NextResponse.json(herramientas);
  } catch {
    return NextResponse.json({ error: "Error al obtener herramientas" }, { status: 500 });
  }
}

/**
 * @openapi
 * /herramientas:
 *   post:
 *     tags:
 *       - Herramientas
 *     summary: Crear herramienta
 *     description: Crea una nueva herramienta con código QR automático
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - nombre
 *               - categoria_id
 *             properties:
 *               nombre:
 *                 type: string
 *                 minLength: 2
 *               marca:
 *                 type: string
 *               modelo:
 *                 type: string
 *               fecha_compra:
 *                 type: string
 *                 format: date
 *               valor_compra:
 *                 type: number
 *               categoria_id:
 *                 type: integer
 *           examples:
 *             nueva:
 *               value:
 *                 nombre: Taladro Percutor
 *                 marca: Bosch
 *                 modelo: GSB 16 RE
 *                 categoria_id: 1
 *     responses:
 *       201:
 *         description: Herramienta creada
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Herramienta'
 *       400:
 *         description: Datos inválidos
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const data = HerramientaSchema.parse(body);

    // Generamos un ID temporal para crear el QR único
    const herramienta = await prisma.herramienta.create({
      data: {
        ...data,
        codigo_qr: "TEMP",
        fecha_compra: data.fecha_compra ? new Date(data.fecha_compra) : undefined,
      },
      include: { categoria: true },
    });

    // Actualizar el QR con el ID real
    const herramientaConQR = await prisma.herramienta.update({
      where: { id: herramienta.id },
      data: { codigo_qr: generateQRCode(herramienta.id) },
      include: { categoria: true },
    });

    return NextResponse.json(herramientaConQR, { status: 201 });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: "Datos inválidos", details: error.issues }, { status: 400 });
    }
    return NextResponse.json({ error: "Error al crear herramienta" }, { status: 500 });
  }
}
