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
