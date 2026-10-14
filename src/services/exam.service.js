import examRepository from '../repositories/exam.repository.js';
import materialRepository from '../repositories/material.repository.js';
import courseRepository from '../repositories/course.repository.js';
import aiRouterService from './ai/aiRouter.service.js';
import { BadRequestError, NotFoundError, ForbiddenError } from '../helpers/errors.js';

class ExamService {

  async generateExam(docenteId, body) {
    const {
      asignatura_id,
      material_id,
      texto_manual,
      nivel_bloom = 'Comprender',
      cantidad_preguntas = 5,
      tipo_preguntas = 'OPCION_MULTIPLE',
      tema_especifico,
      instrucciones_adicionales,
      titulo_personalizado
    } = body;

    // 1. Validar Asignatura
    const asignatura = await courseRepository.findAsignaturaById(asignatura_id);
    if (!asignatura) {
      throw new NotFoundError('Asignatura', asignatura_id);
    }

    // 2. Obtener contenido fuente
    let contenidoFuente = '';

    if (material_id) {
      const material = await materialRepository.findById(material_id);
      if (!material) {
        throw new NotFoundError('Material de clase', material_id);
      }
      if (material.docente_id !== docenteId) {
        throw new ForbiddenError(
          'Acceso denegado: el material de clase seleccionado pertenece a otro docente y no puede ser usado para este examen.',
          { material_id }
        );
      }
      if (!material.contenido_extraido || material.contenido_extraido.trim().length === 0) {
        throw new BadRequestError(
          'El material de clase seleccionado no contiene texto procesable o está vacío. Suba un documento con contenido textual.',
          { material_id }
        );
      }
      contenidoFuente = material.contenido_extraido;
    } else if (texto_manual && texto_manual.trim().length > 0) {
      contenidoFuente = texto_manual.trim();
    } else {
      throw new BadRequestError(
        'Debe proporcionar una fuente de información para generar el examen: elija un material_id o ingrese un texto_manual.'
      );
    }

    // 3. Orquestación automática con IA (AIRouter selecciona el mejor proveedor disponible)
    const aiResult = await aiRouterService.generateExam({
      contenidoMaterial: contenidoFuente,
      nivelBloom: nivel_bloom,
      cantidadPreguntas: cantidad_preguntas,
      tipoPreguntas: tipo_preguntas,
      temaEspecifico: tema_especifico,
      instruccionesAdicionales: instrucciones_adicionales
    });

    // 4. Preparar datos para persistencia
    const paramData = {
      nivel_bloom,
      cantidad_preguntas,
      tipo_preguntas,
      modelo_ia: aiResult.metadata.modelo_utilizado,
      temperatura: 0.3,
      configuracion_adicional: aiResult.metadata
    };

    const evaluationData = {
      docente_id: docenteId,
      asignatura_id: Number(asignatura_id),
      titulo: titulo_personalizado || aiResult.titulo_sugerido || `Evaluación de ${asignatura.nombre}`,
      descripcion: aiResult.descripcion || `Evaluación basada en Taxonomía de Bloom (${nivel_bloom})`,
      estado: 'GENERADO_IA'
    };

    // 5. Persistir en base de datos con transacción
    const nuevaEvaluacion = await examRepository.createEvaluationWithQuestions(
      evaluationData,
      paramData,
      aiResult.preguntas
    );

    return {
      evaluacion: nuevaEvaluacion,
      metadata_ia: aiResult.metadata
    };
  }

  async getMisEvaluaciones(docenteId, filters = {}) {
    return await examRepository.findByDocente(docenteId, filters);
  }

  async getEvaluacionById(id, docenteId) {
    const evaluacion = await examRepository.findById(id);
    if (!evaluacion) {
      throw new NotFoundError('Evaluación', id);
    }

    if (evaluacion.docente_id !== docenteId) {
      throw new ForbiddenError(
        'Acceso denegado: no tiene permisos para consultar una evaluación creada por otro docente.',
        { evaluacion_id: id }
      );
    }

    return evaluacion;
  }

  async updateEstadoEvaluacion(id, docenteId, estado) {
    const evaluacion = await examRepository.findById(id);
    if (!evaluacion) {
      throw new NotFoundError('Evaluación', id);
    }

    if (evaluacion.docente_id !== docenteId) {
      throw new ForbiddenError(
        'Acceso denegado: no tiene permisos para actualizar el estado de una evaluación creada por otro docente.',
        { evaluacion_id: id }
      );
    }

    return await examRepository.update(id, { estado });
  }

  async deleteEvaluacion(id, docenteId) {
    const evaluacion = await examRepository.findById(id);
    if (!evaluacion) {
      throw new NotFoundError('Evaluación', id);
    }

    if (evaluacion.docente_id !== docenteId) {
      throw new ForbiddenError(
        'Acceso denegado: no tiene permisos para eliminar una evaluación creada por otro docente.',
        { evaluacion_id: id }
      );
    }

    await examRepository.delete(id);
    return true;
  }
}

export default new ExamService();
