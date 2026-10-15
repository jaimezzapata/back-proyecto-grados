import { z } from 'zod';
import { errorResponse } from '../helpers/response.helper.js';

export const registerSchema = z.object({
  body: z.object({
    nombres: z.string({ required_error: 'Los nombres son requeridos' }).min(2, 'Mínimo 2 caracteres'),
    apellidos: z.string({ required_error: 'Los apellidos son requeridos' }).min(2, 'Mínimo 2 caracteres'),
    correo_institucional: z
      .string({ required_error: 'El correo es requerido' })
      .email('Debe ser un correo válido'),
    password: z
      .string({ required_error: 'La contraseña es requerida' })
      .min(8, 'La contraseña debe tener mínimo 8 caracteres')
      .regex(/^(?=.*[A-Za-z])(?=.*\d).*$/, 'La contraseña debe contener al menos una letra y un número'),
  })
});

export const loginSchema = z.object({
  body: z.object({
    email: z
      .string({ required_error: 'El correo es requerido' })
      .email('Debe ser un correo válido'),
    password: z.string({ required_error: 'La contraseña es requerida' })
  })
});

export const vincularAsignaturaSchema = z.object({
  body: z.object({
    asignatura_id: z.coerce.number({ required_error: 'El ID de la asignatura es requerido' }).positive(),
    periodo_academico: z.string({ required_error: 'El periodo académico es requerido' }).min(2),
    grupo: z.string().optional().default('01'),
    sede: z.string().optional().default('Medellín'),
    modalidad: z.string().optional().default('Regular'),
    jornada: z.string().optional().default('Mañana')
  })
});

export const createProgramaSchema = z.object({
  body: z.object({
    codigo: z.string({ required_error: 'El código del programa es requerido' }).min(2),
    nombre: z.string({ required_error: 'El nombre del programa es requerido' }).min(3)
  })
});

export const createAsignaturaSchema = z.object({
  body: z.object({
    programa_id: z.coerce.number({ required_error: 'El ID del programa es requerido' }).positive(),
    codigo: z.string({ required_error: 'El código de la asignatura es requerido' }).min(2),
    nombre: z.string({ required_error: 'El nombre de la asignatura es requerido' }).min(3),
    semestre: z.coerce.number().optional()
  })
});

export const updateDocenteAsignaturaSchema = z.object({
  body: z.object({
    asignatura_id: z.coerce.number().positive().optional(),
    periodo_academico: z.string().min(2).optional(),
    grupo: z.string().min(1).optional(),
    sede: z.string().min(1).optional(),
    modalidad: z.string().min(1).optional(),
    jornada: z.string().min(1).optional(),
    nombre_asignatura: z.string().min(2).optional(),
    codigo_asignatura: z.string().min(2).optional()
  })
});

export const updateAsignaturaSchema = z.object({
  body: z.object({
    programa_id: z.coerce.number().positive().optional(),
    codigo: z.string().min(2).optional(),
    nombre: z.string().min(3).optional(),
    semestre: z.coerce.number().optional()
  })
});

export const generateExamSchema = z.object({
  body: z.object({
    asignatura_id: z.coerce.number({ required_error: 'El ID de la asignatura es requerido' }).positive(),
    material_id: z.string().uuid().optional(),
    texto_manual: z.string().optional(),
    nivel_bloom: z.enum(['Recordar', 'Comprender', 'Aplicar', 'Analizar', 'Evaluar', 'Crear']).optional().default('Comprender'),
    cantidad_preguntas: z.coerce.number().min(1).max(30).optional().default(5),
    tipo_preguntas: z.enum(['OPCION_MULTIPLE', 'VERDADERO_FALSO', 'ABIERTA', 'MIXTA']).optional().default('OPCION_MULTIPLE'),
    tema_especifico: z.string().optional(),
    instrucciones_adicionales: z.string().optional(),
    titulo_personalizado: z.string().optional()
  })
});

export const updateQuestionSchema = z.object({
  body: z.object({
    enunciado: z.string().min(5, 'El enunciado debe tener al menos 5 caracteres').optional(),
    tipo_pregunta: z.enum(['OPCION_MULTIPLE', 'VERDADERO_FALSO', 'ABIERTA', 'MIXTA']).optional(),
    nivel_bloom: z.enum(['Recordar', 'Comprender', 'Aplicar', 'Analizar', 'Evaluar', 'Crear']).optional(),
    puntaje: z.coerce.number().positive('El puntaje debe ser mayor a 0').optional(),
    justificacion_pedagogica: z.string().optional(),
    orden: z.coerce.number().int().positive().optional()
  })
});

export const updateOptionSchema = z.object({
  body: z.object({
    texto_opcion: z.string().min(1, 'El texto de la opción no puede estar vacío').optional(),
    es_correcta: z.boolean().optional(),
    retroalimentacion: z.string().optional(),
    marcar_como_unica_correcta: z.boolean().optional(),
    orden: z.coerce.number().int().positive().optional()
  })
});

export const addQuestionSchema = z.object({
  body: z.object({
    enunciado: z.string({ required_error: 'El enunciado de la pregunta es obligatorio' }).min(5, 'El enunciado debe tener al menos 5 caracteres'),
    tipo_pregunta: z.enum(['OPCION_MULTIPLE', 'VERDADERO_FALSO', 'ABIERTA', 'MIXTA']).optional().default('OPCION_MULTIPLE'),
    nivel_bloom: z.enum(['Recordar', 'Comprender', 'Aplicar', 'Analizar', 'Evaluar', 'Crear']).optional().default('Comprender'),
    puntaje: z.coerce.number().positive('El puntaje debe ser un valor positivo').optional().default(1.0),
    justificacion_pedagogica: z.string().optional(),
    opciones: z.array(z.object({
      texto_opcion: z.string({ required_error: 'El texto de la opción es obligatorio' }).min(1, 'La opción no puede estar vacía'),
      es_correcta: z.boolean().optional().default(false),
      retroalimentacion: z.string().optional()
    })).optional().default([])
  })
});

export const approveExamSchema = z.object({
  body: z.object({
    numero_version: z.string().min(1).max(20).optional(),
    comentarios: z.string().optional()
  }).optional().default({})
});

export const validateSchema = (schema) => (req, res, next) => {
  try {
    schema.parse({
      body: req.body,
      query: req.query,
      params: req.params,
    });
    next();
  } catch (error) {
    next(error);
  }
};
