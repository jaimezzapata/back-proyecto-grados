import dotenv from 'dotenv';

dotenv.config();

/**
 * Catálogo de características del sistema y sus flags por defecto.
 * Permite prender o apagar funcionalidades según variables de entorno o nivel de suscripción.
 */
export const FEATURES = {
  AUTH_SECURITY: 'AUTH_SECURITY',               // Núcleo MVP 1 (Siempre activo)
  ACADEMIC_CONTEXT: 'ACADEMIC_CONTEXT',         // Núcleo MVP 1 (Siempre activo)
  MATERIAL_INGESTION: 'MATERIAL_INGESTION',     // MVP 1
  AI_GENERATION: 'AI_GENERATION',               // MVP 1
  EXAM_EDITOR: 'EXAM_EDITOR',                   // MVP 1
  EXPORT_DOCS: 'EXPORT_DOCS',                   // MVP 1
  RUBRICS: 'RUBRICS',                           // MVP 2
  FORMATIVE_FEEDBACK: 'FORMATIVE_FEEDBACK',     // MVP 2
  ANTI_FRAUD: 'ANTI_FRAUD',                     // MVP 3
  AUDIT_LOGS: 'AUDIT_LOGS',                     // MVP 3
};

const parseBoolean = (value, defaultValue = true) => {
  if (value === undefined || value === null) return defaultValue;
  return value === 'true' || value === '1' || value === true;
};

// Configuración de estado inicial por variables de entorno
export const getFeaturesState = () => {
  return {
    [FEATURES.AUTH_SECURITY]: true,
    [FEATURES.ACADEMIC_CONTEXT]: true,
    [FEATURES.MATERIAL_INGESTION]: parseBoolean(process.env.FEATURE_MATERIAL_INGESTION, true),
    [FEATURES.AI_GENERATION]: parseBoolean(process.env.FEATURE_AI_GENERATION, true),
    [FEATURES.EXAM_EDITOR]: parseBoolean(process.env.FEATURE_EXAM_EDITOR, true),
    [FEATURES.EXPORT_DOCS]: parseBoolean(process.env.FEATURE_EXPORT_DOCS, true),
    [FEATURES.RUBRICS]: parseBoolean(process.env.FEATURE_RUBRICS, true),
    [FEATURES.FORMATIVE_FEEDBACK]: parseBoolean(process.env.FEATURE_FORMATIVE_FEEDBACK, true),
    [FEATURES.ANTI_FRAUD]: parseBoolean(process.env.FEATURE_ANTI_FRAUD, false), // MVP 3
    [FEATURES.AUDIT_LOGS]: parseBoolean(process.env.FEATURE_AUDIT_LOGS, false),   // MVP 3
  };
};

/**
 * Verifica si una funcionalidad está activa globalmente o para un plan
 */
export const isFeatureEnabled = (featureKey) => {
  const state = getFeaturesState();
  return Boolean(state[featureKey]);
};
