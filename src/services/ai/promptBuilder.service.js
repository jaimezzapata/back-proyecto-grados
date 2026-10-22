/**
 * Servicio encargado de ensamblar prompts pedagógicos estructurados
 * basados en la Taxonomía de Bloom y los materiales de clase.
 * Aplica estrictas reglas de circuito cerrado (Strict Grounding) y anti-alucinación.
 */

const BLOOM_DESCRIPTIONS = {
  Recordar: 'Evalúa la capacidad de evocar o reconocer hechos, conceptos y terminologías básicas explícitas en el texto.',
  Comprender: 'Evalúa la capacidad de interpretar, resumir, parafrasear y explicar ideas y principios con sus propias palabras basándose en el documento.',
  Aplicar: 'Evalúa la capacidad de utilizar la información y conocimientos teóricos del material en situaciones concretas o resolución de casos.',
  Analizar: 'Evalúa la capacidad de descomponer el material en sus partes constitutivas, distinguir causas y efectos y encontrar relaciones lógicas presentadas en el texto.',
  Evaluar: 'Evalúa la capacidad de emitir juicios de valor basados en criterios, evidencias y estándares sólidos expuestos en la fuente.',
  Crear: 'Evalúa la capacidad de reunir elementos para estructurar un todo coherente, proponer soluciones originales o formular hipótesis a partir de lo aprendido en el documento.'
};

class PromptBuilderService {

  buildSystemPrompt() {
    return `Eres un Diseñador Curricular y Experto Pedagógico Senior en Evaluación del Aprendizaje Universitario.
Tu misión es formular exámenes académicos rigurosos, equilibrados y pedagógicamente estructurados a partir del material educativo proporcionado.

REGLA DE ORO DE CIRCUITO CERRADO (STRICT GROUNDING & ANTI-ALUCINACIÓN):
1. RESTRICCIÓN ABSOLUTA DE FUENTE: Todo el contenido del examen (enunciados, opciones correctas, distractores, justificaciones y retroalimentaciones) DEBE basarse ÚNICA Y EXCLUSIVAMENTE en la información explícita provista en el "MATERIAL DE CLASE FUENTE".
2. PROHIBIDO USAR CONOCIMIENTO EXTERNO: No agregues conceptos, teorías, fórmulas, datos, fechas, leyes ni autores que no estén expresamente mencionados en el material provisto, incluso si son verdaderos en el mundo real.
3. CERO ENLACES O REFERENCIAS EXTERNAS: Está terminantemente prohibido incluir URLs, enlaces web, citas de páginas de internet o referencias a bibliografía externa al documento.
4. VERIFICABILIDAD: Cada afirmación evaluada debe ser directamente contrastable y demostrable con el texto del documento. Si un concepto no se encuentra en el material de clase provisto, NO lo evalúes bajo ninguna circunstancia.

REGLAS CRÍTICAS DE SALIDA:
1. Tu respuesta DEBE ser estrictamente un único objeto JSON válido sin texto previo ni posterior, sin introducciones ni comentarios.
2. Cada pregunta debe alinearse exactamente con el nivel cognitivo de la Taxonomía de Bloom solicitado.
3. Para preguntas de OPCION_MULTIPLE:
   - Debe tener exactamente 4 opciones de respuesta.
   - Exactamente 1 opción debe ser verdadera ('es_correcta': true) y las otras 3 falsas ('es_correcta': false).
   - Los distractores deben ser plausibles pero refutables con el material provisto.
   - Cada opción debe incluir una breve 'retroalimentacion' explicando por qué es correcta o incorrecta según el texto.
4. Para preguntas de VERDADERO_FALSO:
   - Debe tener exactamente 2 opciones ('Verdadero' y 'Falso'), con una sola correcta y su respectiva justificación basada en el documento.
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
      "justificacion_pedagogica": "Por qué evalúa este nivel de Bloom basándose en el documento...",
      "opciones": [
        {
          "texto_opcion": "Opción A...",
          "es_correcta": true,
          "retroalimentacion": "Explicación de por qué es la respuesta correcta según el material"
        },
        {
          "texto_opcion": "Opción B...",
          "es_correcta": false,
          "retroalimentacion": "Explicación de por qué es incorrecta según el material"
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

--- REGLA INVIOLABLE DE CIRCUITO CERRADO ---
ATENCIÓN: Basa cada pregunta, alternativa y justificación EXCLUSIVAMENTE en el texto del "MATERIAL DE CLASE FUENTE" provisto a continuación. 
- NO extraigas información de fuentes externas.
- NO referencies sitios web, URLs ni bibliografía externa.
- Si un concepto o tema no está en este material, NO lo inventes ni lo incluyas en la evaluación.

--- MATERIAL DE CLASE FUENTE ---
${contenidoMaterial}

Genera únicamente el objeto JSON con la estructura solicitada.`;
  }
}

export default new PromptBuilderService();
