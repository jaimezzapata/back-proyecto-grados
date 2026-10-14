import swaggerJSDoc from 'swagger-jsdoc';

const options = {
  definition: {
    openapi: '3.0.0',
    info: {
      title: 'Sistema de Creación y Gestión de Evaluaciones Académicas con IA',
      version: '1.0.0',
      description: `API RESTful desarrollada para la generación, gestión y supervisión docente (Human-in-the-Loop) de evaluaciones académicas estructuradas con Inteligencia Artificial.
      
### Arquitectura y Características:
- **Arquitectura N-Capas Estricta** (Routers -> Middlewares -> Controllers -> Services -> Repositories -> Models).
- **Control de Acceso Basado en Roles (RBAC)** mediante tokens JWT Bearer.
- **Conmutación Modular (Feature Flags)** para habilitar o degradar elegantemente funcionalidades por fase (MVP) o plan de suscripción.`,
      contact: {
        name: 'Jaime Alberto Zapata Valencia',
        email: 'soporte@cesde.edu.co'
      }
    },
    servers: [
      {
        url: `http://localhost:${process.env.PORT || 3000}`,
        description: 'Servidor de Desarrollo Local'
      }
    ],
    components: {
      securitySchemes: {
        bearerAuth: {
          type: 'http',
          scheme: 'bearer',
          bearerFormat: 'JWT',
          description: 'Ingresa el token JWT en el formato: Bearer <tu_token>'
        }
      },
      schemas: {
        ApiResponse: {
          type: 'object',
          properties: {
            success: { type: 'boolean', example: true },
            data: { type: 'object' },
            message: { type: 'string', example: 'Operación realizada con éxito' }
          }
        },
        ApiError: {
          type: 'object',
          properties: {
            success: { type: 'boolean', example: false },
            error: { type: 'string', example: 'Descripción del error' },
            details: { type: 'object', nullable: true },
            code: { type: 'string', example: 'FEATURE_DISABLED', nullable: true }
          }
        },
        RegisterInput: {
          type: 'object',
          required: ['nombres', 'apellidos', 'correo_institucional', 'password'],
          properties: {
            nombres: { type: 'string', example: 'Jaime Alberto' },
            apellidos: { type: 'string', example: 'Zapata Valencia' },
            correo_institucional: { type: 'string', format: 'email', example: 'jzapata@cesde.edu.co' },
            password: { type: 'string', format: 'password', example: 'Segura1234*' }
          }
        },
        LoginInput: {
          type: 'object',
          required: ['email', 'password'],
          properties: {
            email: { type: 'string', format: 'email', example: 'jzapata@cesde.edu.co' },
            password: { type: 'string', format: 'password', example: 'Segura1234*' }
          }
        },
        VincularAsignaturaInput: {
          type: 'object',
          required: ['asignatura_id', 'periodo_academico'],
          properties: {
            asignatura_id: { type: 'integer', example: 1 },
            periodo_academico: { type: 'string', example: '2026-1' },
            grupo: { type: 'string', example: '01' }
          }
        },
        CreateProgramaInput: {
          type: 'object',
          required: ['codigo', 'nombre'],
          properties: {
            codigo: { type: 'string', example: 'ING-SW' },
            nombre: { type: 'string', example: 'Ingeniería de Software' }
          }
        },
        CreateAsignaturaInput: {
          type: 'object',
          required: ['programa_id', 'codigo', 'nombre'],
          properties: {
            programa_id: { type: 'integer', example: 1 },
            codigo: { type: 'string', example: 'ISW-401' },
            nombre: { type: 'string', example: 'Arquitectura de Software' },
            semestre: { type: 'integer', example: 4 }
          }
        }
      }
    }
  },
  apis: ['./src/routers/*.js', './src/app.js']
};

export const swaggerSpec = swaggerJSDoc(options);
