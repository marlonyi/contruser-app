-- CreateEnum
CREATE TYPE "Rol" AS ENUM ('ADMIN', 'ENCARGADO', 'EMPLEADO', 'CLIENTE');

-- CreateEnum
CREATE TYPE "EstadoUsuario" AS ENUM ('ACTIVO', 'INACTIVO');

-- CreateEnum
CREATE TYPE "EstadoHerramienta" AS ENUM ('DISPONIBLE', 'PRESTADA', 'MANTENIMIENTO', 'DANADA', 'PERDIDA');

-- CreateEnum
CREATE TYPE "TipoTransaccion" AS ENUM ('ENTREGA', 'DEVOLUCION');

-- CreateEnum
CREATE TYPE "TipoMantenimiento" AS ENUM ('PREVENTIVO', 'CORRECTIVO');

-- CreateTable
CREATE TABLE "Usuario" (
    "id" SERIAL NOT NULL,
    "nombre_completo" TEXT NOT NULL,
    "documento" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "password" TEXT NOT NULL,
    "telefono" TEXT,
    "direccion" TEXT,
    "rol" "Rol" NOT NULL DEFAULT 'EMPLEADO',
    "estado" "EstadoUsuario" NOT NULL DEFAULT 'ACTIVO',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Usuario_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Categoria" (
    "id" SERIAL NOT NULL,
    "nombre" TEXT NOT NULL,
    "descripcion" TEXT,

    CONSTRAINT "Categoria_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Herramienta" (
    "id" SERIAL NOT NULL,
    "codigo_qr" TEXT NOT NULL,
    "nombre" TEXT NOT NULL,
    "marca" TEXT,
    "modelo" TEXT,
    "fecha_compra" TIMESTAMP(3),
    "valor_compra" DECIMAL(12,2),
    "estado_actual" "EstadoHerramienta" NOT NULL DEFAULT 'DISPONIBLE',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "categoria_id" INTEGER NOT NULL,

    CONSTRAINT "Herramienta_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Transaccion" (
    "id" SERIAL NOT NULL,
    "tipo" "TipoTransaccion" NOT NULL,
    "fecha_hora" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "observaciones" TEXT,
    "estado_herramienta_momento" "EstadoHerramienta" NOT NULL,
    "herramienta_id" INTEGER NOT NULL,
    "usuario_responsable_id" INTEGER NOT NULL,
    "encargado_id" INTEGER NOT NULL,

    CONSTRAINT "Transaccion_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Mantenimiento" (
    "id" SERIAL NOT NULL,
    "tipo" "TipoMantenimiento" NOT NULL,
    "fecha_inicio" TIMESTAMP(3) NOT NULL,
    "fecha_fin" TIMESTAMP(3),
    "costo" DECIMAL(12,2),
    "observaciones" TEXT,
    "herramienta_id" INTEGER NOT NULL,
    "tecnico_id" INTEGER NOT NULL,

    CONSTRAINT "Mantenimiento_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "Usuario_documento_key" ON "Usuario"("documento");

-- CreateIndex
CREATE UNIQUE INDEX "Usuario_email_key" ON "Usuario"("email");

-- CreateIndex
CREATE UNIQUE INDEX "Categoria_nombre_key" ON "Categoria"("nombre");

-- CreateIndex
CREATE UNIQUE INDEX "Herramienta_codigo_qr_key" ON "Herramienta"("codigo_qr");

-- AddForeignKey
ALTER TABLE "Herramienta" ADD CONSTRAINT "Herramienta_categoria_id_fkey" FOREIGN KEY ("categoria_id") REFERENCES "Categoria"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Transaccion" ADD CONSTRAINT "Transaccion_herramienta_id_fkey" FOREIGN KEY ("herramienta_id") REFERENCES "Herramienta"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Transaccion" ADD CONSTRAINT "Transaccion_usuario_responsable_id_fkey" FOREIGN KEY ("usuario_responsable_id") REFERENCES "Usuario"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Transaccion" ADD CONSTRAINT "Transaccion_encargado_id_fkey" FOREIGN KEY ("encargado_id") REFERENCES "Usuario"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Mantenimiento" ADD CONSTRAINT "Mantenimiento_herramienta_id_fkey" FOREIGN KEY ("herramienta_id") REFERENCES "Herramienta"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Mantenimiento" ADD CONSTRAINT "Mantenimiento_tecnico_id_fkey" FOREIGN KEY ("tecnico_id") REFERENCES "Usuario"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
