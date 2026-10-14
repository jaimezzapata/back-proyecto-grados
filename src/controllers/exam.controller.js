import examService from '../services/exam.service.js';
import { successResponse } from '../helpers/response.helper.js';

class ExamController {

  async generate(req, res, next) {
    try {
      const docenteId = req.user.id;
      const result = await examService.generateExam(docenteId, req.body);
      return successResponse(res, result, 'Evaluación generada exitosamente por el motor de IA', 201);
    } catch (error) {
      next(error);
    }
  }

  async getMisEvaluaciones(req, res, next) {
    try {
      const docenteId = req.user.id;
      const { asignatura_id, estado } = req.query;
      const filters = {};
      if (asignatura_id) filters.asignatura_id = asignatura_id;
      if (estado) filters.estado = estado;

      const evaluaciones = await examService.getMisEvaluaciones(docenteId, filters);
      return successResponse(res, evaluaciones, 'Evaluaciones recuperadas correctamente');
    } catch (error) {
      next(error);
    }
  }

  async getById(req, res, next) {
    try {
      const docenteId = req.user.id;
      const { id } = req.params;
      const evaluacion = await examService.getEvaluacionById(id, docenteId);
      return successResponse(res, evaluacion, 'Evaluación y preguntas recuperadas correctamente');
    } catch (error) {
      next(error);
    }
  }

  async updateStatus(req, res, next) {
    try {
      const docenteId = req.user.id;
      const { id } = req.params;
      const { estado } = req.body;

      const actualizada = await examService.updateEstadoEvaluacion(id, docenteId, estado);
      return successResponse(res, actualizada, 'Estado de la evaluación actualizado');
    } catch (error) {
      next(error);
    }
  }

  async delete(req, res, next) {
    try {
      const docenteId = req.user.id;
      const { id } = req.params;
      await examService.deleteEvaluacion(id, docenteId);
      return successResponse(res, null, 'Evaluación eliminada exitosamente');
    } catch (error) {
      next(error);
    }
  }

  // ==========================================
  // Endpoints Human-in-the-Loop (Edición Docente)
  // ==========================================

  async updateQuestion(req, res, next) {
    try {
      const docenteId = req.user.id;
      const { id, questionId } = req.params;
      const preguntaActualizada = await examService.updateQuestion(id, questionId, docenteId, req.body);
      return successResponse(res, preguntaActualizada, 'Pregunta actualizada exitosamente');
    } catch (error) {
      next(error);
    }
  }

  async deleteQuestion(req, res, next) {
    try {
      const docenteId = req.user.id;
      const { id, questionId } = req.params;
      await examService.deleteQuestion(id, questionId, docenteId);
      return successResponse(res, null, 'Pregunta eliminada de la evaluación exitosamente');
    } catch (error) {
      next(error);
    }
  }

  async addQuestion(req, res, next) {
    try {
      const docenteId = req.user.id;
      const { id } = req.params;
      const nuevaPregunta = await examService.addQuestion(id, docenteId, req.body);
      return successResponse(res, nuevaPregunta, 'Pregunta agregada a la evaluación exitosamente', 201);
    } catch (error) {
      next(error);
    }
  }

  async updateOption(req, res, next) {
    try {
      const docenteId = req.user.id;
      const { id, questionId, optionId } = req.params;
      const opcionActualizada = await examService.updateOption(id, questionId, optionId, docenteId, req.body);
      return successResponse(res, opcionActualizada, 'Opción de respuesta actualizada exitosamente');
    } catch (error) {
      next(error);
    }
  }

  async approve(req, res, next) {
    try {
      const docenteId = req.user.id;
      const { id } = req.params;
      const resultado = await examService.approveExam(id, docenteId, req.body);
      return successResponse(res, resultado, resultado.mensaje, 201);
    } catch (error) {
      next(error);
    }
  }

  async getVersions(req, res, next) {
    try {
      const docenteId = req.user.id;
      const { id } = req.params;
      const versiones = await examService.getExamVersions(id, docenteId);
      return successResponse(res, versiones, 'Historial de versiones recuperado exitosamente');
    } catch (error) {
      next(error);
    }
  }
}

export default new ExamController();
