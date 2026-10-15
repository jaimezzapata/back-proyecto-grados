import courseService from '../services/course.service.js';
import { successResponse } from '../helpers/response.helper.js';

class CourseController {

  async getProgramas(req, res, next) {
    try {
      const programas = await courseService.getProgramas();
      return successResponse(res, programas, 'Programas académicos obtenidos correctamente');
    } catch (error) {
      next(error);
    }
  }

  async getAsignaturas(req, res, next) {
    try {
      const { programa_id } = req.query;
      const asignaturas = await courseService.getAsignaturas(programa_id);
      return successResponse(res, asignaturas, 'Asignaturas obtenidas correctamente');
    } catch (error) {
      next(error);
    }
  }

  async getAsignaturaById(req, res, next) {
    try {
      const { id } = req.params;
      const asignatura = await courseService.getAsignaturaById(id);
      return successResponse(res, asignatura, 'Detalle de asignatura obtenido');
    } catch (error) {
      next(error);
    }
  }

  async getMisAsignaturas(req, res, next) {
    try {
      const docenteId = req.user.id;
      const { periodo } = req.query;
      const misAsignaturas = await courseService.getAsignaturasDocente(docenteId, periodo);
      return successResponse(res, misAsignaturas, 'Asignaturas del docente obtenidas correctamente');
    } catch (error) {
      next(error);
    }
  }

  async vincularAsignatura(req, res, next) {
    try {
      const docenteId = req.user.id;
      const resultado = await courseService.vincularDocenteAsignatura(docenteId, req.body);
      return successResponse(res, resultado, 'Asignatura asignada al docente exitosamente', 201);
    } catch (error) {
      next(error);
    }
  }

  async createPrograma(req, res, next) {
    try {
      const nuevoPrograma = await courseService.createPrograma(req.body);
      return successResponse(res, nuevoPrograma, 'Programa creado exitosamente', 201);
    } catch (error) {
      next(error);
    }
  }

  async createAsignatura(req, res, next) {
    try {
      const nuevaAsignatura = await courseService.createAsignatura(req.body);
      return successResponse(res, nuevaAsignatura, 'Asignatura creada exitosamente', 201);
    } catch (error) {
      next(error);
    }
  }

  async updateMisAsignatura(req, res, next) {
    try {
      const docenteId = req.user.id;
      const { id } = req.params;
      const updated = await courseService.updateAsignacionDocente(docenteId, id, req.body);
      return successResponse(res, updated, 'Asignatura y configuración de grupo actualizadas correctamente');
    } catch (error) {
      next(error);
    }
  }

  async deleteMisAsignatura(req, res, next) {
    try {
      const docenteId = req.user.id;
      const { id } = req.params;
      const resultado = await courseService.desvincularDocenteAsignatura(docenteId, id);
      return successResponse(res, resultado, 'Asignatura desvinculada exitosamente');
    } catch (error) {
      next(error);
    }
  }

  async updateAsignatura(req, res, next) {
    try {
      const { id } = req.params;
      const updated = await courseService.updateAsignatura(id, req.body);
      return successResponse(res, updated, 'Asignatura actualizada exitosamente');
    } catch (error) {
      next(error);
    }
  }
}

export default new CourseController();
