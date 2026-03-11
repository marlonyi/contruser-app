import { PrismaClient } from "../src/generated/prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";
import bcrypt from "bcryptjs";
import "dotenv/config";

const adapter = new PrismaPg({ connectionString: process.env.DATABASE_URL! });
const prisma = new PrismaClient({ adapter });

async function main() {
  console.log("🌱 Iniciando seed de la base de datos...");

  // Categorías
  const categorias = await Promise.all([
    prisma.categoria.upsert({
      where: { nombre: "Herramientas Eléctricas" },
      update: {},
      create: { nombre: "Herramientas Eléctricas", descripcion: "Taladros, pulidoras, sierras eléctricas" },
    }),
    prisma.categoria.upsert({
      where: { nombre: "Herramientas Manuales" },
      update: {},
      create: { nombre: "Herramientas Manuales", descripcion: "Martillos, destornilladores, llaves" },
    }),
    prisma.categoria.upsert({
      where: { nombre: "Instrumentos de Medición" },
      update: {},
      create: { nombre: "Instrumentos de Medición", descripcion: "Metros, niveles, calibradores" },
    }),
    prisma.categoria.upsert({
      where: { nombre: "Equipos de Seguridad" },
      update: {},
      create: { nombre: "Equipos de Seguridad", descripcion: "Arneses, cascos, gafas" },
    }),
  ]);
  console.log(`✅ ${categorias.length} categorías creadas`);

  // Usuario administrador
  const adminPassword = await bcrypt.hash("admin123", 12);
  const admin = await prisma.usuario.upsert({
    where: { email: "admin@contruser.com" },
    update: {},
    create: {
      nombre_completo: "Administrador del Sistema",
      documento: "1000000001",
      email: "admin@contruser.com",
      password: adminPassword,
      telefono: "3001234567",
      rol: "ADMIN",
    },
  });

  const encargadoPassword = await bcrypt.hash("encargado123", 12);
  const encargado = await prisma.usuario.upsert({
    where: { email: "almacen@contruser.com" },
    update: {},
    create: {
      nombre_completo: "Carlos Encargado Almacén",
      documento: "1000000002",
      email: "almacen@contruser.com",
      password: encargadoPassword,
      telefono: "3009876543",
      rol: "ENCARGADO",
    },
  });

  const empleadoPassword = await bcrypt.hash("empleado123", 12);
  const empleado = await prisma.usuario.upsert({
    where: { email: "tecnico@contruser.com" },
    update: {},
    create: {
      nombre_completo: "Juan Técnico Pérez",
      documento: "1000000003",
      email: "tecnico@contruser.com",
      password: empleadoPassword,
      rol: "EMPLEADO",
    },
  });
  console.log(`✅ Usuarios creados: ${[admin, encargado, empleado].map((u) => u.email).join(", ")}`);

  // Herramientas de ejemplo
  const herramientasData = [
    { nombre: "Taladro Percutor", marca: "Bosch", modelo: "GBH 2-26", categoria_id: categorias[0].id, valor_compra: 450000 },
    { nombre: "Pulidora Angular", marca: "Dewalt", modelo: "DWE402", categoria_id: categorias[0].id, valor_compra: 320000 },
    { nombre: "Martillo Carpintero", marca: "Stanley", modelo: "51-013", categoria_id: categorias[1].id, valor_compra: 45000 },
    { nombre: "Juego de Llaves", marca: "Bahco", modelo: "SL25", categoria_id: categorias[1].id, valor_compra: 180000 },
    { nombre: "Metro Láser", marca: "Leica", modelo: "DISTO D2", categoria_id: categorias[2].id, valor_compra: 680000 },
    { nombre: "Nivel Digital", marca: "Stanley", modelo: "STHT77498", categoria_id: categorias[2].id, valor_compra: 95000 },
  ];

  for (const data of herramientasData) {
    const existing = await prisma.herramienta.findFirst({ where: { nombre: data.nombre } });
    if (!existing) {
      const h = await prisma.herramienta.create({
        data: { ...data, codigo_qr: "TEMP", fecha_compra: new Date("2024-01-15") },
      });
      await prisma.herramienta.update({
        where: { id: h.id },
        data: { codigo_qr: `CONTRUSER-TOOL-${h.id}-${Date.now()}` },
      });
    }
  }
  console.log(`✅ ${herramientasData.length} herramientas creadas`);
  console.log("\n🎉 Seed completado exitosamente!");
  console.log("\nCredenciales de acceso:");
  console.log("  Admin:    admin@contruser.com   / admin123");
  console.log("  Almacén:  almacen@contruser.com / encargado123");
  console.log("  Técnico:  tecnico@contruser.com / empleado123");
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => {
    prisma.$disconnect();
  });
