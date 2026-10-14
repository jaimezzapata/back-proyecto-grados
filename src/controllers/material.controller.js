import materialService from '../services/material.service.js';
import { successResponse, errorResponse } from '../helpers/response.helper.js';

class MaterialController {

  async upload(req, res) {
    try {
      const docenteId = req.user.id;
      const material = await materialService.uploadAndProcessMaterial(docenteId, req.file, req.body);
      return successResponse(res, material, 'Material de clase subido y procesado exitosamente', 201);
    } catch (error) {
      return errorResponse(res, error.message, 400);
    }
  }

  async getMisMateriales(req, res) {
    try {
      const docenteId = req.user.id;
      const { asignatura_id } = req.query;
      const filters = {};
      if (asignatura_id) filters.asignatura_id = asignatura_id;

      const materiales = await materialService.getMaterialesDocente(docenteId, filters);
      return successResponse(res, materiales, 'Materiales de clase recuperados exitosamente');
    } catch (error) {
      return errorResponse(res, error.message, 500);
    }
  }

  async getMaterialById(req, res) {
    try {
      const docenteId = req.user.id;
      const { id } = req.params;
      const material = await materialService.getMaterialById(id, docenteId);
      return successResponse(res, material, 'Material recuperado correctamente');
    } catch (error) {
      const status = error.message.includes('autorización') ? 403 : 404;
      return errorResponse(res, error.message, status);
    }
  }

  async deleteMaterial(req, res) {
    try {
      const docenteId = req.user.id;
      const { id } = req.params;
      await materialService.deleteMaterial(id, docenteId);
      return successResponse(res, null, 'Material eliminado exitosamente');
    } catch (error) {
      const status = error.message.includes('autorización') ? 403 : 404;
      return errorResponse(res, error.message, status);
    }
  }
}

export default new MaterialController();
