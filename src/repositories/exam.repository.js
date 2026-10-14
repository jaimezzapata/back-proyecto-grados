import {
  sequelize,
  Evaluacion,
  ParametroIAEvaluacion,
  Pregunta,
  OpcionRespuesta,
  Asignatura,
  Usuario,
  Rubrica,
  VersionExamen
} from '../models/index.js';

class ExamRepository {

  async createEvaluationWithQuestions(evaluationData, paramData, questionsData) {
    const transaction = await sequelize.transaction();

    try {
      // 1. Guardar parámetros de IA
      const parametroIA = await ParametroIAEvaluacion.create(paramData, { transaction });

      // 2. Guardar cabecera de la evaluación
      const evaluacion = await Evaluacion.create({
        ...evaluationData,
        parametro_ia_id: parametroIA.id
      }, { transaction });

      // 3. Guardar preguntas y sus opciones
      for (let i = 0; i < questionsData.length; i++) {
        const q = questionsData[i];
        const pregunta = await Pregunta.create({
          evaluacion_id: evaluacion.id,
          enunciado: q.enunciado,
          tipo_pregunta: q.tipo_pregunta || 'OPCION_MULTIPLE',
          nivel_bloom: q.nivel_bloom,
          puntaje: q.puntaje || 1.0,
          justificacion_pedagogica: q.justificacion_pedagogica,
          orden: i + 1
        }, { transaction });

        if (q.opciones && Array.isArray(q.opciones)) {
          for (let j = 0; j < q.opciones.length; j++) {
            const opt = q.opciones[j];
            await OpcionRespuesta.create({
              pregunta_id: pregunta.id,
              texto_opcion: opt.texto_opcion,
              es_correcta: Boolean(opt.es_correcta),
              retroalimentacion: opt.retroalimentacion || null,
              orden: j + 1
            }, { transaction });
          }
        }
      }

      await transaction.commit();

      // Devolver evaluación completa con sus asociaciones
      return await this.findById(evaluacion.id);

    } catch (error) {
      await transaction.rollback();
      throw error;
    }
  }

  async findById(id) {
    return await Evaluacion.findByPk(id, {
      include: [
        {
          model: ParametroIAEvaluacion,
          as: 'parametro_ia'
        },
        {
          model: Asignatura,
          as: 'asignatura',
          attributes: ['id', 'codigo', 'nombre']
        },
        {
          model: Pregunta,
          as: 'preguntas',
          include: [
            {
              model: OpcionRespuesta,
              as: 'opciones'
            }
          ]
        },
        {
          model: Rubrica,
          as: 'rubrica'
        }
      ],
      order: [
        [{ model: Pregunta, as: 'preguntas' }, 'orden', 'ASC'],
        [{ model: Pregunta, as: 'preguntas' }, { model: OpcionRespuesta, as: 'opciones' }, 'orden', 'ASC']
      ]
    });
  }

  async findByDocente(docenteId, filters = {}) {
    return await Evaluacion.findAll({
      where: { docente_id: docenteId, ...filters },
      include: [
        { model: Asignatura, as: 'asignatura', attributes: ['id', 'codigo', 'nombre'] },
        { model: ParametroIAEvaluacion, as: 'parametro_ia' }
      ],
      order: [['created_at', 'DESC']]
    });
  }

  async update(id, data) {
    const evaluacion = await Evaluacion.findByPk(id);
    if (!evaluacion) return null;
    return await evaluacion.update(data);
  }

  async delete(id) {
    const evaluacion = await Evaluacion.findByPk(id);
    if (!evaluacion) return null;
    await evaluacion.destroy();
    return true;
  }

  // ==========================================
  // Métodos Human-in-the-Loop (Preguntas)
  // ==========================================

  async findQuestionById(questionId) {
    return await Pregunta.findByPk(questionId, {
      include: [
        {
          model: OpcionRespuesta,
          as: 'opciones'
        },
        {
          model: Evaluacion,
          as: 'evaluacion'
        }
      ],
      order: [[{ model: OpcionRespuesta, as: 'opciones' }, 'orden', 'ASC']]
    });
  }

  async updateQuestion(questionId, data) {
    const pregunta = await Pregunta.findByPk(questionId);
    if (!pregunta) return null;
    return await pregunta.update(data);
  }

  async deleteQuestion(questionId) {
    const transaction = await sequelize.transaction();
    try {
      await OpcionRespuesta.destroy({ where: { pregunta_id: questionId }, transaction });
      const deletedCount = await Pregunta.destroy({ where: { id: questionId }, transaction });
      await transaction.commit();
      return deletedCount > 0;
    } catch (error) {
      await transaction.rollback();
      throw error;
    }
  }

  async addQuestionToExam(evaluacionId, questionData, optionsData = []) {
    const transaction = await sequelize.transaction();
    try {
      // Calcular el siguiente orden
      const maxOrden = await Pregunta.max('orden', { where: { evaluacion_id: evaluacionId }, transaction }) || 0;

      const nuevaPregunta = await Pregunta.create({
        evaluacion_id: evaluacionId,
        enunciado: questionData.enunciado,
        tipo_pregunta: questionData.tipo_pregunta || 'OPCION_MULTIPLE',
        nivel_bloom: questionData.nivel_bloom || 'Comprender',
        puntaje: questionData.puntaje || 1.0,
        justificacion_pedagogica: questionData.justificacion_pedagogica || null,
        orden: maxOrden + 1
      }, { transaction });

      if (optionsData && optionsData.length > 0) {
        for (let i = 0; i < optionsData.length; i++) {
          const opt = optionsData[i];
          await OpcionRespuesta.create({
            pregunta_id: nuevaPregunta.id,
            texto_opcion: opt.texto_opcion,
            es_correcta: Boolean(opt.es_correcta),
            retroalimentacion: opt.retroalimentacion || null,
            orden: i + 1
          }, { transaction });
        }
      }

      await transaction.commit();
      return await this.findQuestionById(nuevaPregunta.id);
    } catch (error) {
      await transaction.rollback();
      throw error;
    }
  }

  // ==========================================
  // Métodos Human-in-the-Loop (Opciones)
  // ==========================================

  async findOptionById(optionId) {
    return await OpcionRespuesta.findByPk(optionId, {
      include: [
        {
          model: Pregunta,
          as: 'pregunta',
          include: [{ model: Evaluacion, as: 'evaluacion' }]
        }
      ]
    });
  }

  async updateOption(optionId, data) {
    const opcion = await OpcionRespuesta.findByPk(optionId);
    if (!opcion) return null;
    return await opcion.update(data);
  }

  async setSingleCorrectOption(preguntaId, correctOptionId) {
    const transaction = await sequelize.transaction();
    try {
      // Desmarcar todas las opciones de la pregunta
      await OpcionRespuesta.update(
        { es_correcta: false },
        { where: { pregunta_id: preguntaId }, transaction }
      );

      // Marcar la seleccionada como correcta
      await OpcionRespuesta.update(
        { es_correcta: true },
        { where: { id: correctOptionId }, transaction }
      );

      await transaction.commit();
      return await OpcionRespuesta.findByPk(correctOptionId);
    } catch (error) {
      await transaction.rollback();
      throw error;
    }
  }

  // ==========================================
  // Versionamiento y Aprobación
  // ==========================================

  async countExamVersions(evaluacionId) {
    return await VersionExamen.count({ where: { evaluacion_id: evaluacionId } });
  }

  async createExamVersion(evaluacionId, versionTag, snapshotJson, aprobadoPor) {
    const transaction = await sequelize.transaction();
    try {
      // 1. Crear el registro de la versión congelada
      const nuevaVersion = await VersionExamen.create({
        evaluacion_id: evaluacionId,
        numero_version: versionTag,
        snapshot_json: snapshotJson,
        aprobado_por: aprobadoPor
      }, { transaction });

      // 2. Actualizar estado de la evaluación a APROBADO
      await Evaluacion.update(
        { estado: 'APROBADO' },
        { where: { id: evaluacionId }, transaction }
      );

      await transaction.commit();
      return nuevaVersion;
    } catch (error) {
      await transaction.rollback();
      throw error;
    }
  }

  async findExamVersions(evaluacionId) {
    return await VersionExamen.findAll({
      where: { evaluacion_id: evaluacionId },
      include: [
        {
          model: Usuario,
          as: 'aprobador',
          attributes: ['id', 'nombres', 'apellidos', 'correo_institucional']
        }
      ],
      order: [['created_at', 'DESC']]
    });
  }
}

export default new ExamRepository();
