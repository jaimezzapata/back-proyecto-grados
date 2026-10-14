import { z } from 'zod';

const OpcionSchema = z.object({
  texto_opcion: z.string().min(1, 'La opción no puede estar vacía'),
  es_correcta: z.boolean().default(false),
  retroalimentacion: z.string().optional().default('')
});

const PreguntaSchema = z.object({
  enunciado: z.string().min(5, 'El enunciado debe tener al menos 5 caracteres'),
  tipo_pregunta: z.enum(['OPCION_MULTIPLE', 'VERDADERO_FALSO', 'ABIERTA', 'MIXTA']).default('OPCION_MULTIPLE'),
  nivel_bloom: z.string().optional().default('Comprender'),
  puntaje: z.coerce.number().default(1.0),
  justificacion_pedagogica: z.string().optional().default(''),
  opciones: z.array(OpcionSchema).optional().default([])
});

const EvaluacionGeneradaSchema = z.object({
  titulo_sugerido: z.string().optional().default('Evaluación Generada por IA'),
  descripcion: z.string().optional().default(''),
  preguntas: z.array(PreguntaSchema).min(1, 'Debe incluir al menos una pregunta')
});

class AIParserService {

  cleanRawOutput(rawText) {
    if (!rawText) return '';
    let text = rawText.trim();

    // Eliminar bloques de markdown como ```json o ``` si el modelo los incluyó
    if (text.startsWith('```json')) {
      text = text.replace(/^```json\s*/i, '').replace(/\s*```$/i, '');
    } else if (text.startsWith('```')) {
      text = text.replace(/^```\s*/, '').replace(/\s*```$/, '');
    }

    // Buscar el primer { y el último } para aislar el JSON
    const firstBrace = text.indexOf('{');
    const lastBrace = text.lastIndexOf('}');
    if (firstBrace !== -1 && lastBrace !== -1 && lastBrace > firstBrace) {
      text = text.substring(firstBrace, lastBrace + 1);
    }

    return text.trim();
  }

  parseAndValidate(rawText) {
    const cleaned = this.cleanRawOutput(rawText);

    let parsedJson;
    try {
      parsedJson = JSON.parse(cleaned);
    } catch (parseError) {
      console.error('Error al parsear JSON del LLM:', parseError.message);
      throw new Error(`La respuesta de la IA no contiene un formato JSON válido: ${parseError.message}`);
    }

    const validationResult = EvaluacionGeneradaSchema.safeParse(parsedJson);
    if (!validationResult.success) {
      const errorDetails = validationResult.error.errors.map(e => `${e.path.join('.')}: ${e.message}`).join(', ');
      console.error('Error de validación del esquema del examen:', errorDetails);
      throw new Error(`El examen generado por la IA no cumple con la estructura esperada: ${errorDetails}`);
    }

    return validationResult.data;
  }
}

export default new AIParserService();
