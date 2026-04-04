import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { z } from "zod";
import bcrypt from "bcryptjs";

const UsuarioUpdateSchema = z.object({
  nombre_completo: z.string().min(3).optional(),
  documento: z.string().min(5).optional(),
  email: z.string().email().optional(),
  password: z.string().min(6).optional(),
  telefono: z.string().optional().nullable(),
  direccion: z.string().optional().nullable(),
  rol: z.enum(["ADMIN", "ENCARGADO", "EMPLEADO", "CLIENTE"]).optional(),
  estado: z.enum(["ACTIVO", "INACTIVO"]).optional(),
});

interface RouteParams {
  params: Promise<{ id: string }>;
}

export async function GET(request: NextRequest, { params }: RouteParams) {
  try {
    const { id } = await params;
    const usuario = await prisma.usuario.findUnique({
      where: { id: Number(id) },
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
        updatedAt: true,
        _count: {
          select: {
            transaccionesComoResponsable: true,
            mantenimientos: true,
          },
        },
      },
    });

    if (!usuario) {
      return NextResponse.json({ error: "Usuario no encontrado" }, { status: 404 });
    }

    return NextResponse.json(usuario);
  } catch {
    return NextResponse.json({ error: "Error al obtener usuario" }, { status: 500 });
  }
}

export async function PUT(request: NextRequest, { params }: RouteParams) {
  try {
    const { id } = await params;
    const body = await request.json();
    const data = UsuarioUpdateSchema.parse(body);

    const existente = await prisma.usuario.findUnique({
      where: { id: Number(id) },
    });

    if (!existente) {
      return NextResponse.json({ error: "Usuario no encontrado" }, { status: 404 });
    }

    // Validar duplicados de email o documento si se están actualizando
    if (data.email || data.documento) {
      const duplicado = await prisma.usuario.findFirst({
        where: {
          OR: [
            ...(data.email ? [{ email: data.email }] : []),
            ...(data.documento ? [{ documento: data.documento }] : []),
          ],
          NOT: { id: Number(id) },
        },
      });

      if (duplicado) {
        return NextResponse.json(
          { error: "Ya existe otro usuario con ese email o documento" },
          { status: 409 }
        );
      }
    }

    // Preparar datos para actualización
    const updateData: Record<string, unknown> = { ...data };

    // Hashear password si se proporciona
    if (data.password) {
      updateData.password = await bcrypt.hash(data.password, 12);
    }

    const usuario = await prisma.usuario.update({
      where: { id: Number(id) },
      data: updateData,
      select: {
        id: true,
        nombre_completo: true,
        documento: true,
        email: true,
        telefono: true,
        direccion: true,
        rol: true,
        estado: true,
      },
    });

    return NextResponse.json(usuario);
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: "Datos inválidos", details: error.issues }, { status: 400 });
    }
    return NextResponse.json({ error: "Error al actualizar usuario" }, { status: 500 });
  }
}

export async function DELETE(request: NextRequest, { params }: RouteParams) {
  try {
    const { id } = await params;

    const usuario = await prisma.usuario.findUnique({
      where: { id: Number(id) },
      include: {
        _count: {
          select: {
            transaccionesComoResponsable: true,
            mantenimientos: true,
            transaccionesComoEncargado: true,
          },
        },
      },
    });

    if (!usuario) {
      return NextResponse.json({ error: "Usuario no encontrado" }, { status: 404 });
    }

    // No eliminar si tiene registros asociados
    const tieneRegistros =
      usuario._count.transaccionesComoResponsable > 0 ||
      usuario._count.mantenimientos > 0 ||
      usuario._count.transaccionesComoEncargado > 0;

    if (tieneRegistros) {
      return NextResponse.json(
        { error: "No se puede eliminar un usuario con registros asociados (transacciones o mantenimientos). Considere inactivarlo en su lugar." },
        { status: 400 }
      );
    }

    await prisma.usuario.delete({ where: { id: Number(id) } });

    return NextResponse.json({ message: "Usuario eliminado correctamente" });
  } catch {
    return NextResponse.json({ error: "Error al eliminar usuario" }, { status: 500 });
  }
}