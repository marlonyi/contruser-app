import swaggerJsdoc from "swagger-jsdoc";

const swaggerDefinition = {
  openapi: "3.0.0",
  info: {
    title: "Contruser API",
    version: "1.0.0",
    description: "API para gestión de herramientas y equipos de construcción",
  },
  servers: [
    {
      url: "/api",
      description: "API Server",
    },
  ],
  components: {
    securitySchemes: {
      cookieAuth: {
        type: "apiKey",
        in: "cookie",
        name: "session",
      },
    },
    schemas: {
      Error: {
        type: "object",
        properties: {
          error: {
            type: "string",
          },
          details: {
            type: "array",
            items: {
              type: "object",
            },
          },
        },
      },
      Categoria: {
        type: "object",
        properties: {
          id: { type: "integer" },
          nombre: { type: "string" },
          descripcion: { type: "string", nullable: true },
          createdAt: { type: "string", format: "date-time" },
          updatedAt: { type: "string", format: "date-time" },
        },
      },
      Usuario: {
        type: "object",
        properties: {
          id: { type: "integer" },
          nombre: { type: "string" },
          email: { type: "string", format: "email" },
          rol: {
            type: "string",
            enum: ["ADMIN", "ENCARGADO", "EMPLEADO", "CLIENTE"],
          },
          estado: {
            type: "string",
            enum: ["ACTIVO", "INACTIVO"],
          },
          telefono: { type: "string", nullable: true },
          createdAt: { type: "string", format: "date-time" },
          updatedAt: { type: "string", format: "date-time" },
        },
      },
      Herramienta: {
        type: "object",
        properties: {
          id: { type: "integer" },
          nombre: { type: "string" },
          marca: { type: "string", nullable: true },
          modelo: { type: "string", nullable: true },
          codigo_qr: { type: "string" },
          estado_actual: {
            type: "string",
            enum: ["DISPONIBLE", "PRESTADA", "MANTENIMIENTO", "DANADA", "PERDIDA"],
          },
          fecha_compra: { type: "string", format: "date", nullable: true },
          valor_compra: { type: "number", nullable: true },
          categoria_id: { type: "integer" },
          categoria: { $ref: "#/components/schemas/Categoria" },
          createdAt: { type: "string", format: "date-time" },
          updatedAt: { type: "string", format: "date-time" },
        },
      },
      Transaccion: {
        type: "object",
        properties: {
          id: { type: "integer" },
          herramienta_id: { type: "integer" },
          usuario_origen_id: { type: "integer", nullable: true },
          usuario_destino_id: { type: "integer" },
          tipo: {
            type: "string",
            enum: ["PRESTAMO", "DEVOLUCION"],
          },
          fecha_transaccion: { type: "string", format: "date-time" },
          observaciones: { type: "string", nullable: true },
          herramienta: { $ref: "#/components/schemas/Herramienta" },
          usuario_origen: { $ref: "#/components/schemas/Usuario", nullable: true },
          usuario_destino: { $ref: "#/components/schemas/Usuario" },
        },
      },
      Mantenimiento: {
        type: "object",
        properties: {
          id: { type: "integer" },
          herramienta_id: { type: "integer" },
          tipo: {
            type: "string",
            enum: ["PREVENTIVO", "CORRECTIVO", "LIMPIEZA", "CALIBRACION"],
          },
          descripcion: { type: "string" },
          costo: { type: "number", nullable: true },
          fecha_inicio: { type: "string", format: "date-time" },
          fecha_fin: { type: "string", format: "date-time", nullable: true },
          estado: {
            type: "string",
            enum: ["PENDIENTE", "EN_PROCESO", "COMPLETADO"],
          },
          herramienta: { $ref: "#/components/schemas/Herramienta" },
        },
      },
    },
  },
};

const options = {
  swaggerDefinition,
  apis: [
    "./src/app/api/auth/**/*.ts",
    "./src/app/api/herramientas/**/*.ts",
    "./src/app/api/usuarios/**/*.ts",
    "./src/app/api/categorias/**/*.ts",
    "./src/app/api/transacciones/**/*.ts",
    "./src/app/api/mantenimientos/**/*.ts",
  ],
};

export const swaggerSpec = swaggerJsdoc(options);