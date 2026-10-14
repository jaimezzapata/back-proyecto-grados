import examRepository from '../repositories/exam.repository.js';
import materialRepository from '../repositories/material.repository.js';
import courseRepository from '../repositories/course.repository.js';
import aiRouterService from './ai/aiRouter.service.js';

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
      throw new Error('La asignatura especificada no existe');
    }

    // 2. Obtener contenido fuente
    let contenidoFuente = '';

    if (material_id) {
      const material = await materialRepository.findById(material_id);
      if (!material) {
        throw new Error('El material de clase especificado no existe');
      }
      if (material.docente_id !== docenteId) {
        throw new Error('No tiene permisos para utilizar este material');
      }
      if (!material.contenido_extraido || material.contenido_extraido.trim().length === 0) {
        throw new Error('El material seleccionado no contiene texto procesado válido');
      }
      contenidoFuente = material.contenido_extraido;
    } else if (texto_manual && texto_manual.trim().length > 0) {
      contenidoFuente = texto_manual.trim();
    } else {
      throw new Error('Debe proporcionar un material_id o un texto_manual como fuente para el examen');
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
      throw new Error('Evaluación no encontrada');
    }

    if (evaluacion.docente_id !== docenteId) {
      throw new Error('No tiene autorización para ver esta evaluación');
    }

    return evaluacion;
  }

  async updateEstadoEvaluacion(id, docenteId, estado) {
    const evaluacion = await examRepository.findById(id);
    if (!evaluacion) {
      throw new Error('Evaluación no encontrada');
    }

    if (evaluacion.docente_id !== docenteId) {
      throw new Error('No tiene autorización para modificar esta evaluación');
    }

    return await examRepository.update(id, { estado });
  }

  async deleteEvaluacion(id, docenteId) {
    const evaluacion = await examRepository.findById(id);
    if (!evaluacion) {
      throw new Error('Evaluación no encontrada');
    }

    if (evaluacion.docente_id !== docenteId) {
      throw new Error('No tiene autorización para eliminar esta evaluación');
    }

    await examRepository.delete(id);
    return true;
  }
}

export default new ExamService();
