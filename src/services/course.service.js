import courseRepository from '../repositories/course.repository.js';
import { NotFoundError, ConflictError } from '../helpers/errors.js';

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
      throw new NotFoundError('Asignatura', id);
    }
    return asignatura;
  }

  async getAsignaturasDocente(docenteId, periodo = null) {
    return await courseRepository.findAsignaturasByDocente(docenteId, periodo);
  }

  async vincularDocenteAsignatura(docenteId, data) {
    const { asignatura_id, periodo_academico, grupo, sede, modalidad, jornada } = data;
    
    // Validar que la asignatura exista
    const asignatura = await courseRepository.findAsignaturaById(asignatura_id);
    if (!asignatura) {
      throw new NotFoundError('Asignatura', asignatura_id);
    }

    const [asignacion, created] = await courseRepository.asignarDocente(
      docenteId,
      asignatura_id,
      periodo_academico,
      grupo || '01',
      sede || 'Medellín',
      modalidad || 'Regular',
      jornada || 'Mañana'
    );

    return { asignacion, created };
  }

  async createPrograma(data) {
    return await courseRepository.createPrograma(data);
  }

  async createAsignatura(data) {
    const existing = await courseRepository.findAsignaturaByCodigo(data.codigo);
    if (existing) {
      throw new ConflictError(
        `Ya existe una asignatura registrada con el código '${data.codigo}'. Ingrese un código único.`,
        { codigo: data.codigo }
      );
    }
    return await courseRepository.createAsignatura(data);
  }

  async updateAsignacionDocente(docenteId, asignacionId, data) {
    const asignacion = await courseRepository.findAsignacionById(asignacionId);
    if (!asignacion || asignacion.docente_id !== docenteId) {
      throw new NotFoundError('Asignación de curso', asignacionId);
    }

    // Si se envía una asignatura distinta, validar su existencia
    if (data.asignatura_id && Number(data.asignatura_id) !== asignacion.asignatura_id) {
      const nuevaAsignatura = await courseRepository.findAsignaturaById(data.asignatura_id);
      if (!nuevaAsignatura) {
        throw new NotFoundError('Asignatura', data.asignatura_id);
      }
    }

    // Si se desea modificar el nombre o código de la asignatura vinculada
    if (data.nombre_asignatura || data.codigo_asignatura) {
      const updateData = {};
      if (data.nombre_asignatura) updateData.nombre = data.nombre_asignatura.trim();
      if (data.codigo_asignatura) {
        const codigoTrim = data.codigo_asignatura.trim().toUpperCase();
        if (codigoTrim !== asignacion.asignatura.codigo) {
          const existingCode = await courseRepository.findAsignaturaByCodigo(codigoTrim);
          if (existingCode && existingCode.id !== asignacion.asignatura_id) {
            throw new ConflictError(`El código '${codigoTrim}' ya está en uso por otra asignatura.`);
          }
        }
        updateData.codigo = codigoTrim;
      }
      await courseRepository.updateAsignatura(asignacion.asignatura_id, updateData);
    }

    const fieldsToUpdate = {};
    if (data.asignatura_id) fieldsToUpdate.asignatura_id = Number(data.asignatura_id);
    if (data.periodo_academico) fieldsToUpdate.periodo_academico = data.periodo_academico.trim();
    if (data.grupo) fieldsToUpdate.grupo = data.grupo.trim();
    if (data.sede) fieldsToUpdate.sede = data.sede.trim();
    if (data.modalidad) fieldsToUpdate.modalidad = data.modalidad.trim();
    if (data.jornada) fieldsToUpdate.jornada = data.jornada.trim();

    await courseRepository.updateAsignacion(asignacionId, docenteId, fieldsToUpdate);
    return await courseRepository.findAsignacionById(asignacionId);
  }

  async desvincularDocenteAsignatura(docenteId, asignacionId) {
    const asignacion = await courseRepository.findAsignacionById(asignacionId);
    if (!asignacion || asignacion.docente_id !== docenteId) {
      throw new NotFoundError('Asignación de curso', asignacionId);
    }

    await courseRepository.deleteAsignacion(asignacionId, docenteId);
    return { success: true, message: 'Asignatura desvinculada exitosamente' };
  }

  async updateAsignatura(id, data) {
    const existing = await courseRepository.findAsignaturaById(id);
    if (!existing) {
      throw new NotFoundError('Asignatura', id);
    }

    if (data.codigo && data.codigo !== existing.codigo) {
      const withCode = await courseRepository.findAsignaturaByCodigo(data.codigo);
      if (withCode && withCode.id !== Number(id)) {
        throw new ConflictError(`El código '${data.codigo}' ya está en uso por otra asignatura.`);
      }
    }

    return await courseRepository.updateAsignatura(id, data);
  }
}

export default new CourseService();
