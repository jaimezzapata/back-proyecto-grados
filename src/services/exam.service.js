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

  // ==========================================
  // Métodos Human-in-the-Loop (Edición Docente)
  // ==========================================

  async updateQuestion(examId, questionId, docenteId, data) {
    // 1. Validar que la evaluación exista y pertenezca al docente
    const evaluacion = await this.getEvaluacionById(examId, docenteId);

    // 2. Validar que la pregunta exista y corresponda a este examen
    const pregunta = await examRepository.findQuestionById(questionId);
    if (!pregunta || pregunta.evaluacion_id !== examId) {
      throw new NotFoundError('Pregunta de la evaluación', questionId);
    }

    // 3. Actualizar
    await examRepository.updateQuestion(questionId, data);
    return await examRepository.findQuestionById(questionId);
  }

  async deleteQuestion(examId, questionId, docenteId) {
    // 1. Validar pertenencia del examen
    const evaluacion = await this.getEvaluacionById(examId, docenteId);

    // 2. Validar que la pregunta exista y pertenezca al examen
    const pregunta = await examRepository.findQuestionById(questionId);
    if (!pregunta || pregunta.evaluacion_id !== examId) {
      throw new NotFoundError('Pregunta de la evaluación', questionId);
    }

    // 3. Regla pedagógica: No permitir dejar una evaluación sin preguntas
    if (evaluacion.preguntas && evaluacion.preguntas.length <= 1) {
      throw new BadRequestError(
        'No es posible eliminar la única pregunta de la evaluación. La evaluación debe contener al menos una pregunta.',
        { evaluacion_id: examId, total_preguntas: evaluacion.preguntas.length }
      );
    }

    await examRepository.deleteQuestion(questionId);
    return true;
  }

  async addQuestion(examId, docenteId, body) {
    // 1. Validar pertenencia del examen
    await this.getEvaluacionById(examId, docenteId);

    const { opciones, ...questionData } = body;
    return await examRepository.addQuestionToExam(examId, questionData, opciones);
  }

  async updateOption(examId, questionId, optionId, docenteId, data) {
    // 1. Validar pertenencia del examen
    await this.getEvaluacionById(examId, docenteId);

    // 2. Validar que la opción exista
    const opcion = await examRepository.findOptionById(optionId);
    if (!opcion || opcion.pregunta_id !== questionId) {
      throw new NotFoundError('Opción de respuesta', optionId);
    }

    // 3. Si se solicita marcar como única respuesta correcta
    if (data.marcar_como_unica_correcta || (data.es_correcta === true && opcion.pregunta?.tipo_pregunta === 'OPCION_MULTIPLE')) {
      await examRepository.setSingleCorrectOption(questionId, optionId);
      const { marcar_como_unica_correcta, ...restoData } = data;
      if (Object.keys(restoData).length > 0) {
        await examRepository.updateOption(optionId, restoData);
      }
      return await examRepository.findOptionById(optionId);
    }

    // Actualización normal
    await examRepository.updateOption(optionId, data);
    return await examRepository.findOptionById(optionId);
  }

  // ==========================================
  // Aprobación y Congelamiento (Freeze Snapshot)
  // ==========================================

  async approveExam(examId, docenteId, body = {}) {
    // 1. Obtener la evaluación completa
    const evaluacion = await this.getEvaluacionById(examId, docenteId);

    // 2. Validaciones pedagógicas previas a la aprobación definitiva
    if (!evaluacion.preguntas || evaluacion.preguntas.length === 0) {
      throw new BadRequestError(
        'No se puede aprobar una evaluación sin preguntas formuladas. Agregue preguntas antes de aprobar.',
        { evaluacion_id: examId }
      );
    }

    // Validar que cada pregunta de opción múltiple tenga al menos una alternativa correcta
    for (const p of evaluacion.preguntas) {
      if (p.tipo_pregunta === 'OPCION_MULTIPLE' || p.tipo_pregunta === 'VERDADERO_FALSO') {
        const tieneCorrecta = p.opciones && p.opciones.some(o => o.es_correcta);
        if (!tieneCorrecta) {
          throw new BadRequestError(
            `La pregunta #${p.orden} ("${p.enunciado.substring(0, 50)}...") no tiene ninguna opción marcada como correcta. Debe seleccionar la respuesta correcta antes de aprobar.`,
            { pregunta_id: p.id, orden: p.orden }
          );
        }
      }
    }

    // 3. Determinar número o etiqueta de versión
    const countVersiones = await examRepository.countExamVersions(examId);
    const versionTag = body.numero_version || `v${countVersiones + 1}.0`;

    // 4. Crear Snapshot inmutable del examen
    const snapshotJson = {
      version: versionTag,
      fecha_aprobacion: new Date().toISOString(),
      evaluacion_id: evaluacion.id,
      titulo: evaluacion.titulo,
      descripcion: evaluacion.descripcion,
      asignatura: evaluacion.asignatura ? {
        id: evaluacion.asignatura.id,
        codigo: evaluacion.asignatura.codigo,
        nombre: evaluacion.asignatura.nombre
      } : null,
      total_preguntas: evaluacion.preguntas.length,
      puntaje_total: evaluacion.preguntas.reduce((acc, p) => acc + (p.puntaje || 0), 0),
      preguntas: evaluacion.preguntas.map(p => ({
        id: p.id,
        orden: p.orden,
        enunciado: p.enunciado,
        tipo_pregunta: p.tipo_pregunta,
        nivel_bloom: p.nivel_bloom,
        puntaje: p.puntaje,
        justificacion_pedagogica: p.justificacion_pedagogica,
        opciones: p.opciones ? p.opciones.map(o => ({
          id: o.id,
          orden: o.orden,
          texto_opcion: o.texto_opcion,
          es_correcta: o.es_correcta,
          retroalimentacion: o.retroalimentacion
        })) : []
      })),
      comentarios_docente: body.comentarios || 'Versión aprobada y congelada por el docente'
    };

    // 5. Persistir en la tabla versiones_examenes y actualizar estado a APROBADO
    const nuevaVersion = await examRepository.createExamVersion(
      examId,
      versionTag,
      snapshotJson,
      docenteId
    );

    return {
      version: nuevaVersion,
      evaluacion_estado: 'APROBADO',
      mensaje: `La evaluación ha sido aprobada exitosamente y congelada como la versión ${versionTag}.`
    };
  }

  async getExamVersions(examId, docenteId) {
    await this.getEvaluacionById(examId, docenteId);
    return await examRepository.findExamVersions(examId);
  }
}

export default new ExamService();
