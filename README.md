# Contruser — Sistema de Gestión de Inventario de Herramientas

Aplicación web para gestionar el inventario, préstamos, devoluciones y mantenimientos de herramientas en empresas de construcción.

---

## Stack Tecnológico

| Capa | Tecnología |
|---|---|
| Framework | Next.js 16 (App Router, Turbopack) |
| Lenguaje | TypeScript |
| Estilos | Tailwind CSS 4 |
| ORM | Prisma 7 (output personalizado) |
| Base de datos | PostgreSQL |
| Driver | @prisma/adapter-pg + pg |
| Validación | Zod 4 |
| Hashing | bcryptjs |
| QR | qrcode |

---

## Requisitos Previos

- Node.js 20+
- PostgreSQL corriendo localmente
- Base de datos `contruser` creada

```sql
CREATE DATABASE contruser;
```

---

## Instalación y Puesta en Marcha

### 1. Instalar dependencias

```bash
cd contruser-app
npm install
```

### 2. Configurar variables de entorno

El archivo `.env` ya existe con la configuración local:

```env
DATABASE_URL="postgresql://postgres:12345@localhost:5432/contruser?schema=public"
NEXTAUTH_SECRET="contruser-secret-key-2024"
NEXTAUTH_URL="http://localhost:3000"
```

Ajusta `postgres:12345` si tu usuario/contraseña de PostgreSQL es diferente.

### 3. Generar el cliente Prisma

```bash
npx prisma generate
```

> Los tipos se generan en `src/generated/prisma/` (comportamiento de Prisma 7).

### 4. Ejecutar migraciones

```bash
npx prisma migrate dev --name init
```

### 5. Poblar la base de datos con datos de prueba

```bash
npx ts-node prisma/seed.ts
```

### 6. Iniciar el servidor de desarrollo

```bash
npm run dev
```

Acceder en: **http://localhost:3000**

---

## Credenciales de Acceso (datos de seed)

| Rol | Email | Contraseña |
|---|---|---|
| Administrador | `admin@contruser.com` | `admin123` |
| Encargado de Almacén | `almacen@contruser.com` | `encargado123` |
| Empleado / Técnico | `tecnico@contruser.com` | `empleado123` |

---

## Roles de Usuario

### ADMIN — Administrador del Sistema
- Acceso completo a todas las secciones
- Gestión de usuarios (crear, editar, activar/desactivar)
- Visualización de todos los reportes
- Configuración del sistema

### ENCARGADO — Encargado de Almacén
- Registrar entregas y devoluciones de herramientas
- Registrar y gestionar mantenimientos
- Ver inventario completo y estado de herramientas
- Generar reportes de Paz y Salvo

### EMPLEADO — Empleado / Técnico
- Ver herramientas disponibles
- Ver su historial de préstamos
- Consultar estado de herramientas asignadas

### CLIENTE
- Acceso de solo lectura a herramientas disponibles

---

## Estructura del Proyecto

```
contruser-app/
├── prisma/
│   ├── schema.prisma          # Modelos de base de datos
│   ├── seed.ts                # Datos iniciales de prueba
│   └── migrations/            # Historial de migraciones
├── src/
│   ├── app/
│   │   ├── (auth)/login/      # Página de inicio de sesión
│   │   ├── dashboard/         # Panel principal
│   │   │   ├── page.tsx       # Dashboard con estadísticas
│   │   │   ├── herramientas/  # Inventario de herramientas
│   │   │   ├── prestamos/     # Préstamos y devoluciones
│   │   │   ├── usuarios/      # Gestión de usuarios
│   │   │   └── reportes/      # Reportes y Paz y Salvo
│   │   └── api/               # API Routes (REST)
│   │       ├── auth/          # Login / Logout
│   │       ├── herramientas/  # CRUD herramientas
│   │       ├── transacciones/ # Entregas y devoluciones
│   │       ├── usuarios/      # CRUD usuarios
│   │       ├── categorias/    # CRUD categorías
│   │       └── mantenimientos/# CRUD mantenimientos
│   ├── components/ui/         # Componentes reutilizables
│   ├── generated/prisma/      # Cliente Prisma generado (no editar)
│   ├── lib/
│   │   ├── prisma.ts          # Singleton del cliente Prisma
│   │   └── utils.ts           # Formatters y mapas de etiquetas
│   └── types/index.ts         # DTOs y tipos globales
├── prisma.config.ts            # Configuración Prisma 7
├── next.config.ts              # Configuración Next.js
└── .env                        # Variables de entorno
```

---

## Modelos de Base de Datos

### Estados de Herramienta

| Estado | Descripción |
|---|---|
| `DISPONIBLE` | Lista para préstamo |
| `PRESTADA` | Actualmente entregada a un usuario |
| `MANTENIMIENTO` | En proceso de mantenimiento |
| `DANADA` | Con daños, fuera de servicio |
| `PERDIDA` | Extraviada |

### Tipos de Transacción

- `ENTREGA` — Se presta una herramienta a un usuario
- `DEVOLUCION` — El usuario regresa la herramienta

### Tipos de Mantenimiento

- `PREVENTIVO` — Mantenimiento programado de rutina
- `CORRECTIVO` — Reparación por daño o falla

---

## Comandos Útiles

```bash
# Desarrollo
npm run dev                          # Iniciar servidor dev

# Prisma
npx prisma generate                  # Regenerar cliente Prisma
npx prisma migrate dev --name <name> # Nueva migración
npx prisma studio                    # Interfaz visual de la BD
npx ts-node prisma/seed.ts           # Repoblar datos de prueba

# TypeScript
./node_modules/.bin/tsc --noEmit     # Verificar tipos sin compilar
```

---

## Notas Importantes de Prisma 7

Prisma 7 usa un output personalizado en lugar de `@prisma/client` para los tipos generados. Todos los imports deben usar:

```typescript
// Correcto
import { PrismaClient, EstadoHerramienta, Rol } from "@/generated/prisma/client";

// Incorrecto
import { PrismaClient } from "@prisma/client";
```

El cliente requiere el adaptador de conexión para PostgreSQL:

```typescript
import { PrismaPg } from "@prisma/adapter-pg";
const adapter = new PrismaPg({ connectionString: process.env.DATABASE_URL! });
const prisma = new PrismaClient({ adapter });
```
