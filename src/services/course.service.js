import courseRepository from '../repositories/course.repository.js';

class CourseService {

  async getProgramas() {
    return await courseRepository.findAllProgramas();
  }

  async getAsignaturas(programaId = null) {
    const filters = {};
    if (programaId) {
      filters.programa_id = programaId;
    }
    return await courseRepository.findAllAsignaturas(filters);
  }

  async getAsignaturaById(id) {
    const asignatura = await courseRepository.findAsignaturaById(id);
    if (!asignatura) {
      throw new Error('Asignatura no encontrada');
    }
    return asignatura;
  }

  async getAsignaturasDocente(docenteId, periodo = null) {
    return await courseRepository.findAsignaturasByDocente(docenteId, periodo);
  }

  async vincularDocenteAsignatura(docenteId, data) {
    const { asignatura_id, periodo_academico, grupo } = data;
    
    // Validar que la asignatura exista
    const asignatura = await courseRepository.findAsignaturaById(asignatura_id);
    if (!asignatura) {
      throw new Error('La asignatura indicada no existe');
    }

    const [asignacion, created] = await courseRepository.asignarDocente(
      docenteId,
      asignatura_id,
      periodo_academico,
      grupo || '01'
    );

    return { asignacion, created };
  }

  async createPrograma(data) {
    return await courseRepository.createPrograma(data);
  }

  async createAsignatura(data) {
    const existing = await courseRepository.findAsignaturaByCodigo(data.codigo);
    if (existing) {
      throw new Error(`Ya existe una asignatura con el código ${data.codigo}`);
    }
    return await courseRepository.createAsignatura(data);
  }
}

export default new CourseService();
