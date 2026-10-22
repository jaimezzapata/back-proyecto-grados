import OpenAI from 'openai';
import dotenv from 'dotenv';
import promptBuilderService from './promptBuilder.service.js';
import aiParserService from './aiParser.service.js';

dotenv.config();

class AIRouterService {

  constructor() {
    this.ollamaUrl = process.env.OLLAMA_BASE_URL || 'http://localhost:11434';
  }

  /**
   * Verifica de forma rápida y no bloqueante si el servicio de Ollama está activo en localhost
   */
  async isOllamaAvailable() {
    try {
      const response = await fetch(`${this.ollamaUrl}/api/tags`, {
        signal: AbortSignal.timeout(600) // 600 ms máximo
      });
      if (!response.ok) return false;
      const data = await response.json();
      const targetModel = process.env.OLLAMA_MODEL || 'llama3.1:8b';
      const modelPrefix = targetModel.split(':')[0];
      const hasModel = data.models?.some(m => m.name === targetModel || m.name.startsWith(modelPrefix));
      return Boolean(hasModel);
    } catch {
      return false;
    }
  }

  /**
   * Obtiene la lista de proveedores candidatos en orden de prioridad
   * según las variables de entorno configuradas y el estado del sistema.
   */
  async resolveCandidateChain(textLength) {
    const chain = [];
    const isLargeDocument = textLength > 40000;

    // 1. Si el documento es masivo (>40K caracteres), Gemini tiene prioridad por su ventana de contexto de 1M tokens
    if (isLargeDocument && process.env.GEMINI_API_KEY) {
      chain.push({
        name: 'Google Gemini',
        client: new OpenAI({
          baseURL: 'https://generativelanguage.googleapis.com/v1beta/openai/',
          apiKey: process.env.GEMINI_API_KEY
        }),
        model: process.env.GEMINI_MODEL || 'gemini-3.5-flash-lite',
        temperature: 0.3
      });
    }

    // 2. Revisar si Ollama está corriendo en la máquina local
    const ollamaAlive = await this.isOllamaAvailable();
    if (ollamaAlive) {
      chain.push({
        name: 'Ollama Local',
        client: new OpenAI({
          baseURL: `${this.ollamaUrl}/v1`,
          apiKey: 'ollama'
        }),
        model: process.env.OLLAMA_MODEL || 'llama3.1:8b',
        temperature: 0.3
      });
    }

    // 3. Groq Cloud (Gratuito, ultra veloz)
    if (process.env.GROQ_API_KEY) {
      chain.push({
        name: 'Groq Cloud',
        client: new OpenAI({
          baseURL: 'https://api.groq.com/openai/v1',
          apiKey: process.env.GROQ_API_KEY
        }),
        model: process.env.GROQ_MODEL || 'openai/gpt-oss-120b',
        temperature: 0.3
      });
    }

    // 4. Google Gemini (si no se agregó primero por ser documento normal)
    if (!isLargeDocument && process.env.GEMINI_API_KEY) {
      chain.push({
        name: 'Google Gemini',
        client: new OpenAI({
          baseURL: 'https://generativelanguage.googleapis.com/v1beta/openai/',
          apiKey: process.env.GEMINI_API_KEY
        }),
        model: process.env.GEMINI_MODEL || 'gemini-3.5-flash-lite',
        temperature: 0.3
      });
    }

    // 5. DeepSeek (Respaldo alternativo de bajo costo)
    if (process.env.DEEPSEEK_API_KEY) {
      chain.push({
        name: 'DeepSeek',
        client: new OpenAI({
          baseURL: 'https://api.deepseek.com',
          apiKey: process.env.DEEPSEEK_API_KEY
        }),
        model: 'deepseek-chat',
        temperature: 0.3
      });
    }

    // 6. OpenAI oficial (Respaldo final)
    if (process.env.OPENAI_API_KEY) {
      chain.push({
        name: 'OpenAI',
        client: new OpenAI({
          apiKey: process.env.OPENAI_API_KEY
        }),
        model: process.env.OPENAI_MODEL || 'gpt-4o-mini',
        temperature: 0.3
      });
    }

    return chain;
  }

  /**
   * Orquesta la generación del examen recorriendo la cadena de proveedores
   * de forma automática con conmutación inteligente ante errores.
   */
  async generateExam(examParams) {
    const systemPrompt = promptBuilderService.buildSystemPrompt();
    const userPrompt = promptBuilderService.buildUserPrompt(examParams);
    const textLength = userPrompt.length;

    const candidates = await this.resolveCandidateChain(textLength);

    if (candidates.length === 0) {
      throw new Error(
        'No hay ningún proveedor de IA disponible o configurado. Configura GROQ_API_KEY, GEMINI_API_KEY, DEEPSEEK_API_KEY, OPENAI_API_KEY en tu .env o inicia Ollama en localhost:11434.'
      );
    }

    const errors = [];
    const startTime = Date.now();

    for (const provider of candidates) {
      try {
        console.log(`[AI Router] Intentando generación con proveedor: ${provider.name} (${provider.model})...`);

        const requestPayload = {
          model: provider.model,
          messages: [
            { role: 'system', content: systemPrompt },
            { role: 'user', content: userPrompt }
          ],
          temperature: provider.temperature
        };

        // Solicitar formato JSON si el proveedor lo soporta
        if (provider.name !== 'Ollama Local') {
          requestPayload.response_format = { type: 'json_object' };
        }

        const completion = await provider.client.chat.completions.create(requestPayload);
        const rawContent = completion.choices[0]?.message?.content;

        if (!rawContent) {
          throw new Error('El modelo devolvió una respuesta vacía');
        }

        // Parsear y validar el JSON devuelto
        const validatedExam = aiParserService.parseAndValidate(rawContent);
        const durationMs = Date.now() - startTime;

        console.log(`[AI Router] ¡Éxito! Examen generado por ${provider.name} en ${durationMs}ms`);

        return {
          ...validatedExam,
          metadata: {
            proveedor_utilizado: provider.name,
            modelo_utilizado: provider.model,
            tiempo_generacion_ms: durationMs,
            total_preguntas_generadas: validatedExam.preguntas.length
          }
        };

      } catch (providerError) {
        console.warn(
          `[AI Router] Falló ${provider.name} (${provider.model}): ${providerError.message}. Conmutando al siguiente proveedor...`
        );
        errors.push({
          proveedor: provider.name,
          error: providerError.message
        });
      }
    }

    // Si todos los candidatos fallaron
    const errorDetails = errors.map(e => `${e.proveedor}: ${e.error}`).join(' | ');
    throw new Error(`Todos los proveedores de IA fallaron al generar el examen: ${errorDetails}`);
  }
}

export default new AIRouterService();
