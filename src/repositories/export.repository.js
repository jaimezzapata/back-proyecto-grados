import { ExportacionHistorial, Evaluacion, Asignatura } from '../models/index.js';

class ExportRepository {

  async recordExport(data) {
    return await ExportacionHistorial.create(data);
  }

  async findHistoryByExam(evaluacionId) {
    return await ExportacionHistorial.findAll({
      where: { evaluacion_id: evaluacionId },
      order: [['created_at', 'DESC']]
    });
  }

  async findHistoryByDocente(docenteId) {
    return await ExportacionHistorial.findAll({
      where: { docente_id: docenteId },
      include: [
        {
          model: Evaluacion,
          as: 'evaluacion',
          attributes: ['id', 'titulo'],
          include: [{ model: Asignatura, as: 'asignatura', attributes: ['id', 'codigo', 'nombre'] }]
        }
      ],
      order: [['created_at', 'DESC']]
    });
  }
}

export default new ExportRepository();
