import exportService from '../services/export.service.js';
import { successResponse } from '../helpers/response.helper.js';

class ExportController {

  async exportPdf(req, res, next) {
    try {
      const docenteId = req.user.id;
      const { id } = req.params;
      const { tipo = 'ESTUDIANTE' } = req.query;

      const { buffer, filename, contentType } = await exportService.exportExam(id, docenteId, 'PDF', tipo);

      res.setHeader('Content-Type', contentType);
      res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
      res.setHeader('Content-Length', buffer.length);
      return res.end(buffer);
    } catch (error) {
      next(error);
    }
  }

  async exportWord(req, res, next) {
    try {
      const docenteId = req.user.id;
      const { id } = req.params;
      const { tipo = 'ESTUDIANTE' } = req.query;

      const { buffer, filename, contentType } = await exportService.exportExam(id, docenteId, 'WORD', tipo);

      res.setHeader('Content-Type', contentType);
      res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
      res.setHeader('Content-Length', buffer.length);
      return res.end(buffer);
    } catch (error) {
      next(error);
    }
  }

  async getExamHistory(req, res, next) {
    try {
      const docenteId = req.user.id;
      const { id } = req.params;
      const historial = await exportService.getHistoryByExam(id, docenteId);
      return successResponse(res, historial, 'Historial de exportaciones del examen obtenido exitosamente');
    } catch (error) {
      next(error);
    }
  }

  async getMyHistory(req, res, next) {
    try {
      const docenteId = req.user.id;
      const historial = await exportService.getMyExportHistory(docenteId);
      return successResponse(res, historial, 'Historial general de exportaciones del docente obtenido exitosamente');
    } catch (error) {
      next(error);
    }
  }
}

export default new ExportController();
