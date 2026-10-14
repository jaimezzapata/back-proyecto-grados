import courseService from '../services/course.service.js';
import { successResponse, errorResponse } from '../helpers/response.helper.js';

class CourseController {

  async getProgramas(req, res) {
    try {
      const programas = await courseService.getProgramas();
      return successResponse(res, programas, 'Programas académicos obtenidos correctamente');
    } catch (error) {
      return errorResponse(res, error.message, 500);
    }
  }

  async getAsignaturas(req, res) {
    try {
      const { programa_id } = req.query;
      const asignaturas = await courseService.getAsignaturas(programa_id);
      return successResponse(res, asignaturas, 'Asignaturas obtenidas correctamente');
    } catch (error) {
      return errorResponse(res, error.message, 500);
    }
  }

  async getAsignaturaById(req, res) {
    try {
      const { id } = req.params;
      const asignatura = await courseService.getAsignaturaById(id);
      return successResponse(res, asignatura, 'Detalle de asignatura obtenido');
    } catch (error) {
      return errorResponse(res, error.message, 404);
    }
  }

  async getMisAsignaturas(req, res) {
    try {
      const docenteId = req.user.id;
      const { periodo } = req.query;
      const misAsignaturas = await courseService.getAsignaturasDocente(docenteId, periodo);
      return successResponse(res, misAsignaturas, 'Asignaturas del docente obtenidas correctamente');
    } catch (error) {
      return errorResponse(res, error.message, 500);
    }
  }

  async vincularAsignatura(req, res) {
    try {
      const docenteId = req.user.id;
      const resultado = await courseService.vincularDocenteAsignatura(docenteId, req.body);
      return successResponse(res, resultado, 'Asignatura asignada al docente exitosamente', 201);
    } catch (error) {
      return errorResponse(res, error.message, 400);
    }
  }

  async createPrograma(req, res) {
    try {
      const nuevoPrograma = await courseService.createPrograma(req.body);
      return successResponse(res, nuevoPrograma, 'Programa creado exitosamente', 201);
    } catch (error) {
      return errorResponse(res, error.message, 400);
    }
  }

  async createAsignatura(req, res) {
    try {
      const nuevaAsignatura = await courseService.createAsignatura(req.body);
      return successResponse(res, nuevaAsignatura, 'Asignatura creada exitosamente', 201);
    } catch (error) {
      return errorResponse(res, error.message, 400);
    }
  }
}

export default new CourseController();
