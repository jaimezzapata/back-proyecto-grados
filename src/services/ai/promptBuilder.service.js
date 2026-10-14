/**
 * Servicio encargado de ensamblar prompts pedagógicos estructurados
 * basados en la Taxonomía de Bloom y los materiales de clase.
 */

const BLOOM_DESCRIPTIONS = {
  Recordar: 'Evalúa la capacidad de evocar o reconocer hechos, conceptos y terminologías básicas.',
  Comprender: 'Evalúa la capacidad de interpretar, resumir, parafrasear y explicar ideas y principios con sus propias palabras.',
  Aplicar: 'Evalúa la capacidad de utilizar la información y conocimientos teóricos en situaciones concretas o resolución de casos.',
  Analizar: 'Evalúa la capacidad de descomponer el material en sus partes constitutivas, distinguir causas y efectos y encontrar relaciones lógicas.',
  Evaluar: 'Evalúa la capacidad de emitir juicios de valor basados en criterios, evidencias y estándares sólidos.',
  Crear: 'Evalúa la capacidad de reunir elementos para estructurar un todo coherente, proponer soluciones originales o formular hipótesis.'
};

class PromptBuilderService {

  buildSystemPrompt() {
    return `Eres un Diseñador Curricular y Experto Pedagógico Senior en Evaluación del Aprendizaje Universitario.
Tu misión es formular exámenes académicos rigurosos, equilibrados y pedagógicamente estructurados a partir del material educativo proporcionado.

REGLAS CRÍTICAS DE SALIDA:
1. Tu respuesta DEBE ser estrictamente un único objeto JSON válido sin texto previo ni posterior, sin introducciones ni comentarios.
2. Cada pregunta debe alinearse exactamente con el nivel cognitivo de la Taxonomía de Bloom solicitado.
3. Para preguntas de OPCION_MULTIPLE:
   - Debe tener exactamente 4 opciones de respuesta.
   - Exactamente 1 opción debe ser verdadera ('es_correcta': true) y las otras 3 falsas ('es_correcta': false).
   - Los distractores deben ser plausibles y abordar concepciones erróneas comunes.
   - Cada opción debe incluir una breve 'retroalimentacion' explicando por qué es correcta o incorrecta.
4. Para preguntas de VERDADERO_FALSO:
   - Debe tener exactamente 2 opciones ('Verdadero' y 'Falso'), con una sola correcta y su respectiva justificación.
5. Cada pregunta debe incluir una 'justificacion_pedagogica' de por qué dicha pregunta evalúa el nivel de Bloom seleccionado.

ESQUEMA JSON OBLIGATORIO:
{
  "titulo_sugerido": "Título descriptivo del examen",
  "descripcion": "Breve descripción del alcance temático",
  "preguntas": [
    {
      "enunciado": "Texto claro y preciso de la pregunta",
      "tipo_pregunta": "OPCION_MULTIPLE",
      "nivel_bloom": "Nivel cognitivo evaluado",
      "puntaje": 1.0,
      "justificacion_pedagogica": "Por qué evalúa este nivel de Bloom...",
      "opciones": [
        {
          "texto_opcion": "Opción A...",
          "es_correcta": true,
          "retroalimentacion": "Explicación de por qué es la respuesta correcta"
        },
        {
          "texto_opcion": "Opción B...",
          "es_correcta": false,
          "retroalimentacion": "Explicación de por qué es incorrecta"
        }
      ]
    }
  ]
}`;
  }

  buildUserPrompt({
    contenidoMaterial,
    nivelBloom = 'Comprender',
    cantidadPreguntas = 5,
    tipoPreguntas = 'OPCION_MULTIPLE',
    temaEspecifico = null,
    instruccionesAdicionales = ''
  }) {
    const descripcionBloom = BLOOM_DESCRIPTIONS[nivelBloom] || BLOOM_DESCRIPTIONS.Comprender;

    return `Genera una evaluación académica con las siguientes características:

--- PARÁMETROS PEDAGÓGICOS ---
- Nivel de la Taxonomía de Bloom: ${nivelBloom} (${descripcionBloom})
- Cantidad de preguntas requeridas: ${cantidadPreguntas}
- Tipo de preguntas: ${tipoPreguntas}
${temaEspecifico ? `- Enfoque temático prioritario: ${temaEspecifico}` : ''}
${instruccionesAdicionales ? `- Instrucciones complementarias del docente: ${instruccionesAdicionales}` : ''}

--- MATERIAL DE CLASE FUENTE ---
${contenidoMaterial}

Genera únicamente el objeto JSON con la estructura solicitada.`;
  }
}

export default new PromptBuilderService();
