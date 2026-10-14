import examService from '../services/exam.service.js';
import { successResponse, errorResponse } from '../helpers/response.helper.js';

class ExamController {

  async generate(req, res) {
    try {
      const docenteId = req.user.id;
      const result = await examService.generateExam(docenteId, req.body);
      return successResponse(res, result, 'Evaluación generada exitosamente por el motor de IA', 201);
    } catch (error) {
      console.error('Error al generar examen:', error);
      return errorResponse(res, error.message, 400);
    }
  }

  async getMisEvaluaciones(req, res) {
    try {
      const docenteId = req.user.id;
      const { asignatura_id, estado } = req.query;
      const filters = {};
      if (asignatura_id) filters.asignatura_id = asignatura_id;
      if (estado) filters.estado = estado;

      const evaluaciones = await examService.getMisEvaluaciones(docenteId, filters);
      return successResponse(res, evaluaciones, 'Evaluaciones recuperadas correctamente');
    } catch (error) {
      return errorResponse(res, error.message, 500);
    }
  }

  async getById(req, res) {
    try {
      const docenteId = req.user.id;
      const { id } = req.params;
      const evaluacion = await examService.getEvaluacionById(id, docenteId);
      return successResponse(res, evaluacion, 'Evaluación y preguntas recuperadas correctamente');
    } catch (error) {
      const status = error.message.includes('autorización') ? 403 : 404;
      return errorResponse(res, error.message, status);
    }
  }

  async updateStatus(req, res) {
    try {
      const docenteId = req.user.id;
      const { id } = req.params;
      const { estado } = req.body;

      if (!estado) {
        return errorResponse(res, 'El campo estado es requerido', 400);
      }

      const actualizada = await examService.updateEstadoEvaluacion(id, docenteId, estado);
      return successResponse(res, actualizada, 'Estado de la evaluación actualizado');
    } catch (error) {
      const status = error.message.includes('autorización') ? 403 : 400;
      return errorResponse(res, error.message, status);
    }
  }

  async delete(req, res) {
    try {
      const docenteId = req.user.id;
      const { id } = req.params;
      await examService.deleteEvaluacion(id, docenteId);
      return successResponse(res, null, 'Evaluación eliminada exitosamente');
    } catch (error) {
      const status = error.message.includes('autorización') ? 403 : 404;
      return errorResponse(res, error.message, status);
    }
  }
}

export default new ExamController();
