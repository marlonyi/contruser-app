import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { z } from "zod";
import bcrypt from "bcryptjs";

const UsuarioSchema = z.object({
  nombre_completo: z.string().min(3),
  documento: z.string().min(5),
  email: z.string().email(),
  password: z.string().min(6),
  telefono: z.string().optional(),
  direccion: z.string().optional(),
  rol: z.enum(["ADMIN", "ENCARGADO", "EMPLEADO", "CLIENTE"]).default("EMPLEADO"),
});

export async function GET() {
  try {
    const usuarios = await prisma.usuario.findMany({
      select: {
        id: true,
        nombre_completo: true,
        documento: true,
        email: true,
        telefono: true,
        direccion: true,
        rol: true,
        estado: true,
        createdAt: true,
      },
      orderBy: { nombre_completo: "asc" },
    });
    return NextResponse.json(usuarios);
  } catch {
    return NextResponse.json({ error: "Error al obtener usuarios" }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const data = UsuarioSchema.parse(body);

    const existe = await prisma.usuario.findFirst({
      where: { OR: [{ email: data.email }, { documento: data.documento }] },
    });
    if (existe) {
      return NextResponse.json(
        { error: "Ya existe un usuario con ese email o documento" },
        { status: 409 }
      );
    }

    const hashedPassword = await bcrypt.hash(data.password, 12);

    const usuario = await prisma.usuario.create({
      data: { ...data, password: hashedPassword },
      select: {
        id: true,
        nombre_completo: true,
        documento: true,
        email: true,
        rol: true,
        estado: true,
      },
    });

    return NextResponse.json(usuario, { status: 201 });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: "Datos inválidos", details: error.issues }, { status: 400 });
    }
    return NextResponse.json({ error: "Error al crear usuario" }, { status: 500 });
  }
}
