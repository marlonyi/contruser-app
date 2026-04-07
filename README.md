# Contruser — Sistema de Gestión de Inventario de Herramientas

Aplicación web para gestionar el inventario, préstamos, devoluciones y mantenimientos de herramientas en empresas de construcción.

---

## Stack Tecnológico

| Capa | Tecnología |
|---|---|
| Framework | Next.js 16.2.2 (App Router, Turbopack) |
| Lenguaje | TypeScript 5 |
| Estilos | Tailwind CSS 4 |
| ORM | Prisma 7.4.2 (output personalizado) |
| Base de datos | PostgreSQL |
| Driver | @prisma/adapter-pg + pg |
| Validación | Zod 4 |
| Formularios | react-hook-form 7 |
| Hashing | bcryptjs |
| QR | qrcode |
| Documentación API | Swagger/OpenAPI (swagger-jsdoc + swagger-ui-react) |

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
npm run db:generate
```

> Los tipos se generan en `src/generated/prisma/` (comportamiento de Prisma 7).

### 4. Ejecutar migraciones

```bash
npm run db:migrate
```

### 5. Poblar la base de datos con datos de prueba

```bash
npm run db:seed
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
│   ├── schema.prisma              # Modelos de base de datos
│   ├── seed.ts                   # Datos iniciales de prueba
│   └── migrations/               # Historial de migraciones
│
├── src/
│   ├── app/                      # App Router (Next.js 16)
│   │   ├── (auth)/               # Grupo de rutas de autenticación
│   │   │   └── login/
│   │   │       └── page.tsx      # Página de inicio de sesión
│   │   │
│   │   ├── dashboard/            # Panel principal (protegido)
│   │   │   ├── layout.tsx       # Layout con Sidebar
│   │   │   ├── page.tsx         # Dashboard con estadísticas
│   │   │   ├── herramientas/    # Gestión de herramientas
│   │   │   │   ├── page.tsx     # Listado de herramientas
│   │   │   │   ├── nueva/
│   │   │   │   │   └── page.tsx # Crear herramienta
│   │   │   │   └── [id]/
│   │   │   │       ├── page.tsx       # Detalle de herramienta
│   │   │   │       └── editar/
│   │   │   │           └── page.tsx   # Editar herramienta
│   │   │   ├── prestamos/       # Préstamos y devoluciones
│   │   │   │   ├── page.tsx     # Historial de transacciones
│   │   │   │   └── nuevo/
│   │   │   │       └── page.tsx # Registrar préstamo/devolución
│   │   │   ├── mantenimientos/  # Mantenimientos
│   │   │   │   └── page.tsx     # Listado de mantenimientos
│   │   │   ├── usuarios/        # Gestión de usuarios
│   │   │   │   └── page.tsx     # Listado y CRUD de usuarios
│   │   │   ├── categorias/      # Categorías de herramientas
│   │   │   │   └── page.tsx     # Listado y CRUD de categorías
│   │   │   └── reportes/        # Reportes y documentos
│   │   │       └── page.tsx     # Generación de reportes
│   │   │
│   │   ├── swagger/             # Documentación API (Swagger UI)
│   │   │   └── page.tsx         # Interfaz visual de Swagger
│   │   │
│   │   ├── api/                 # API Routes (REST)
│   │   │   ├── auth/
│   │   │   │   ├── login/
│   │   │   │   │   └── route.ts # POST - Autenticación
│   │   │   │   └── logout/
│   │   │   │       └── route.ts # GET - Cerrar sesión
│   │   │   ├── docs/
│   │   │   │   └── route.ts     # GET - Especificación OpenAPI JSON
│   │   │   ├── herramientas/
│   │   │   │   ├── route.ts     # GET, POST - Listar, crear
│   │   │   │   └── [id]/
│   │   │   │       └── route.ts # GET, PUT, DELETE - CRUD individual
│   │   │   ├── usuarios/
│   │   │   │   ├── route.ts     # GET, POST - Listar, crear
│   │   │   │   └── [id]/
│   │   │   │       └── route.ts # GET, PUT, DELETE - CRUD individual
│   │   │   ├── categorias/
│   │   │   │   ├── route.ts     # GET, POST - Listar, crear
│   │   │   │   └── [id]/
│   │   │   │       └── route.ts # GET, PUT, DELETE - CRUD individual
│   │   │   ├── transacciones/
│   │   │   │   └── route.ts     # GET, POST - Listar, crear transacciones
│   │   │   └── mantenimientos/
│   │   │       └── route.ts     # GET, POST - Listar, crear mantenimientos
│   │   │
│   │   ├── layout.tsx           # Layout raíz
│   │   ├── globals.css          # Estilos globales (Tailwind)
│   │   └── page.tsx             # Página inicio → redirige a /dashboard
│   │
│   ├── components/              # Componentes React
│   │   ├── ui/                  # Componentes de interfaz
│   │   │   ├── Sidebar.tsx      # Barra lateral de navegación
│   │   │   ├── ClientOnly.tsx   # Renderizado solo en cliente
│   │   │   ├── ConfirmDialog.tsx # Diálogo de confirmación
│   │   │   ├── DataTable.tsx    # Tabla con ordenamiento/filtrado
│   │   │   ├── DateRangePicker.tsx # Selector de rango de fechas
│   │   │   └── DonutChart.tsx   # Gráfico de dona (estadísticas)
│   │   └── qr/                  # Componentes de QR
│   │       └── QRCode.tsx       # Generador de código QR
│   │
│   ├── generated/prisma/        # Cliente Prisma generado (no editar)
│   │   └── client.ts            # Exports: PrismaClient, enums, types
│   │
│   ├── lib/                     # Utilidades y configuración
│   │   ├── prisma.ts            # Singleton del cliente Prisma
│   │   ├── swagger.ts           # Configuración de OpenAPI/Swagger
│   │   └── utils.ts             # Helpers, formatters, mapas de etiquetas
│   │
│   ├── proxy.ts                 # Proxy de autenticación (middleware)
│   │
│   └── types/                   # Tipos TypeScript globales
│       └── index.ts             # DTOs y tipos compartidos
│
├── public/                      # Archivos estáticos
│
├── prisma.config.ts             # Configuración Prisma 7
├── next.config.ts               # Configuración Next.js
├── tsconfig.json                # Configuración TypeScript
├── package.json                 # Dependencias y scripts
└── .env                         # Variables de entorno
```

---

## Arquitectura de la Aplicación

### Tipo de Arquitectura: Monolito Modular

El proyecto sigue una arquitectura **monolítica modular** con Next.js App Router:

1. **Frontend y Backend en un solo proyecto**: Next.js maneja tanto las páginas (SSR/CSR) como las API Routes.

2. **App Router**: Utiliza el sistema de rutas basado en directorios de Next.js 16:
   - `page.tsx` - Páginas (rutas)
   - `layout.tsx` - Layouts anidados
   - `route.ts` - API endpoints
   - `(grupo)/` - Route groups (sin afectar URL)

3. **Separación por Dominios**:
   - `herramientas/` - Gestión de herramientas
   - `usuarios/` - Gestión de usuarios
   - `transacciones/` - Préstamos y devoluciones
   - `mantenimientos/` - Mantenimientos
   - `categorias/` - Categorías

4. **Autenticación**: Middleware personalizado con cookies HTTP-only.

---

## API REST Endpoints

| Método | Endpoint | Descripción |
|--------|----------|-------------|
| POST | `/api/auth/login` | Autenticar usuario |
| GET | `/api/auth/logout` | Cerrar sesión |
| GET | `/api/docs` | Especificación OpenAPI (Swagger) |
| GET | `/api/herramientas` | Listar herramientas |
| POST | `/api/herramientas` | Crear herramienta |
| GET | `/api/herramientas/:id` | Obtener herramienta |
| PUT | `/api/herramientas/:id` | Actualizar herramienta |
| DELETE | `/api/herramientas/:id` | Eliminar herramienta |
| GET | `/api/usuarios` | Listar usuarios |
| POST | `/api/usuarios` | Crear usuario |
| GET | `/api/usuarios/:id` | Obtener usuario |
| PUT | `/api/usuarios/:id` | Actualizar usuario |
| DELETE | `/api/usuarios/:id` | Eliminar usuario |
| GET | `/api/categorias` | Listar categorías |
| POST | `/api/categorias` | Crear categoría |
| GET | `/api/categorias/:id` | Obtener categoría |
| PUT | `/api/categorias/:id` | Actualizar categoría |
| DELETE | `/api/categorias/:id` | Eliminar categoría |
| GET | `/api/transacciones` | Listar transacciones |
| POST | `/api/transacciones` | Registrar transacción |
| GET | `/api/mantenimientos` | Listar mantenimientos |
| POST | `/api/mantenimientos` | Registrar mantenimiento |

---

## Documentación API (Swagger)

La documentación interactiva está disponible en:

```
http://localhost:3000/swagger
```

Incluye:
- Todos los endpoints documentados
- Schemas de request/response
- Ejemplos de uso
- Códigos de respuesta

### Rutas públicas (sin autenticación)

- `/login` - Página de login
- `/swagger` - Documentación API
- `/api/docs` - Especificación OpenAPI JSON
- `/api/auth/*` - Endpoints de autenticación

---

## Modelos de Base de Datos

### Usuario
| Campo | Tipo | Descripción |
|-------|------|-------------|
| id | Int | ID único |
| nombre_completo | String | Nombre completo |
| documento | String | Número de documento (único) |
| email | String | Email (único) |
| password | String | Hash bcrypt |
| rol | Enum | ADMIN, ENCARGADO, EMPLEADO, CLIENTE |
| estado | Enum | ACTIVO, INACTIVO |
| telefono | String? | Teléfono opcional |
| direccion | String? | Dirección opcional |

### Categoria
| Campo | Tipo | Descripción |
|-------|------|-------------|
| id | Int | ID único |
| nombre | String | Nombre (único) |
| descripcion | String? | Descripción opcional |

### Herramienta
| Campo | Tipo | Descripción |
|-------|------|-------------|
| id | Int | ID único |
| nombre | String | Nombre |
| marca | String? | Marca |
| modelo | String? | Modelo |
| codigo_qr | String | Código QR único |
| estado_actual | Enum | DISPONIBLE, PRESTADA, MANTENIMIENTO, DANADA, PERDIDA |
| fecha_compra | DateTime? | Fecha de compra |
| valor_compra | Float? | Valor de compra |
| categoria_id | Int | FK a Categoria |

### Transaccion
| Campo | Tipo | Descripción |
|-------|------|-------------|
| id | Int | ID único |
| tipo | Enum | ENTREGA, DEVOLUCION |
| herramienta_id | Int | FK a Herramienta |
| usuario_responsable_id | Int | FK a Usuario (quien recibe/devuelve) |
| encargado_id | Int | FK a Usuario (quien registra) |
| estado_herramienta_momento | Enum | Estado al momento de la transacción |
| observaciones | String? | Notas adicionales |
| fecha_hora | DateTime | Fecha y hora |

### Mantenimiento
| Campo | Tipo | Descripción |
|-------|------|-------------|
| id | Int | ID único |
| tipo | Enum | PREVENTIVO, CORRECTIVO |
| herramienta_id | Int | FK a Herramienta |
| tecnico_id | Int | FK a Usuario |
| fecha_inicio | DateTime | Fecha inicio |
| fecha_fin | DateTime? | Fecha fin (null si en proceso) |
| costo | Float? | Costo del mantenimiento |
| observaciones | String? | Notas adicionales |

---

## Estados de Herramienta

| Estado | Descripción |
|---|---|
| `DISPONIBLE` | Lista para préstamo |
| `PRESTADA` | Actualmente entregada a un usuario |
| `MANTENIMIENTO` | En proceso de mantenimiento |
| `DANADA` | Con daños, fuera de servicio |
| `PERDIDA` | Extraviada |

---

## Comandos Disponibles

```bash
# Desarrollo
npm run dev                    # Iniciar servidor de desarrollo
npm run build                  # Compilar para producción
npm run start                  # Iniciar servidor de producción
npm run lint                   # Ejecutar ESLint

# Base de datos (Prisma)
npm run db:generate            # Generar cliente Prisma
npm run db:migrate             # Ejecutar migraciones
npm run db:seed                # Poblar con datos de prueba
npm run db:studio              # Abrir Prisma Studio (UI visual)
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

---

## Proxy de Autenticación

El archivo `src/proxy.ts` (anteriormente `middleware.ts`) maneja la protección de rutas:

- Verifica la cookie `contruser_session`
- Redirige a `/login` si no hay sesión
- Permite rutas públicas: `/login`, `/swagger`, `/api/docs`, `/api/auth/*`
- Redirige a `/dashboard` si ya hay sesión y accede a `/login`

---

## Componentes Reutilizables

| Componente | Ubicación | Descripción |
|------------|-----------|-------------|
| `Sidebar` | `components/ui/Sidebar.tsx` | Navegación lateral |
| `ClientOnly` | `components/ui/ClientOnly.tsx` | Renderizado solo en cliente |
| `ConfirmDialog` | `components/ui/ConfirmDialog.tsx` | Diálogo de confirmación |
| `DataTable` | `components/ui/DataTable.tsx` | Tabla con ordenamiento/filtrado |
| `DateRangePicker` | `components/ui/DateRangePicker.tsx` | Selector de rango de fechas |
| `DonutChart` | `components/ui/DonutChart.tsx` | Gráfico de dona para estadísticas |
| `QRCode` | `components/qr/QRCode.tsx` | Generador de código QR |

---

## Validación de Datos

Todos los endpoints usan **Zod** para validación:

```typescript
const HerramientaSchema = z.object({
  nombre: z.string().min(2),
  marca: z.string().optional(),
  modelo: z.string().optional(),
  fecha_compra: z.string().optional(),
  valor_compra: z.number().positive().optional(),
  categoria_id: z.number().int().positive(),
});
```

Errores de validación retornan HTTP 400 con detalles:

```json
{
  "error": "Datos inválidos",
  "details": [
    { "path": ["nombre"], "message": "String must contain at least 2 character(s)" }
  ]
}
```

---

## Reglas de Negocio

1. **Transacciones**:
   - Solo ADMIN o ENCARGADO pueden registrar transacciones
   - Una herramienta PRESTADA solo puede pasar a DISPONIBLE, DANADA o PERDIDA
   - Una herramienta en MANTENIMIENTO solo puede pasar a DISPONIBLE

2. **Eliminación**:
   - No se puede eliminar un usuario con transacciones o mantenimientos asociados
   - No se puede eliminar una herramienta con historial
   - No se puede eliminar una categoría con herramientas asociadas

3. **Mantenimientos**:
   - No se puede enviar a mantenimiento una herramienta PRESTADA o PERDIDA
   - Al crear un mantenimiento, la herramienta cambia a estado MANTENIMIENTO