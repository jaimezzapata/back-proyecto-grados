import {
  sequelize,
  Evaluacion,
  ParametroIAEvaluacion,
  Pregunta,
  OpcionRespuesta,
  Asignatura,
  Usuario,
  Rubrica
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
}

export default new ExamRepository();
