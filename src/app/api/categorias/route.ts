import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { z } from "zod";

const CategoriaSchema = z.object({
  nombre: z.string().min(2, "El nombre debe tener al menos 2 caracteres"),
  descripcion: z.string().optional(),
});

export async function GET() {
  try {
    const categorias = await prisma.categoria.findMany({
      orderBy: { nombre: "asc" },
      include: { _count: { select: { herramientas: true } } },
    });
    return NextResponse.json(categorias);
  } catch {
    return NextResponse.json({ error: "Error al obtener categorías" }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const data = CategoriaSchema.parse(body);

    // Verificar si ya existe una categoría con el mismo nombre
    const existente = await prisma.categoria.findFirst({
      where: { nombre: data.nombre },
    });

    if (existente) {
      return NextResponse.json(
        { error: "Ya existe una categoría con ese nombre" },
        { status: 409 }
      );
    }

    const categoria = await prisma.categoria.create({
      data,
      include: { _count: { select: { herramientas: true } } },
    });
    return NextResponse.json(categoria, { status: 201 });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: "Datos inválidos", details: error.issues }, { status: 400 });
    }
    return NextResponse.json({ error: "Error al crear categoría" }, { status: 500 });
  }
}
