import { z } from 'zod';
import { errorResponse } from '../helpers/response.helper.js';

export const registerSchema = z.object({
  body: z.object({
    nombres: z.string({ required_error: 'Los nombres son requeridos' }).min(2, 'Mínimo 2 caracteres'),
    apellidos: z.string({ required_error: 'Los apellidos son requeridos' }).min(2, 'Mínimo 2 caracteres'),
    correo_institucional: z
      .string({ required_error: 'El correo es requerido' })
      .email('Debe ser un correo válido')
      .refine((val) => val.endsWith('@cesde.edu.co'), {
        message: 'Debe ser un correo institucional (@cesde.edu.co)',
      }),
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
    grupo: z.string().optional().default('01')
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
