import { isFeatureEnabled } from '../config/features.js';

/**
 * Middleware para proteger endpoints basados en Feature Flags o planes de suscripción.
 * Si la funcionalidad está apagada, responde con 403 Forbidden y un código de error controlado.
 */
export const requireFeature = (featureKey) => {
  return (req, res, next) => {
    if (!isFeatureEnabled(featureKey)) {
      return res.status(403).json({
        success: false,
        error: `La funcionalidad '${featureKey}' no está habilitada en este entorno o plan de suscripción.`,
        code: 'FEATURE_DISABLED',
        details: { feature: featureKey }
      });
    }
    next();
  };
};
