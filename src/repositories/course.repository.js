import { ProgramaAcademico, Asignatura, DocenteAsignatura, Usuario } from '../models/index.js';

class CourseRepository {

  // Programas Académicos
  async findAllProgramas() {
    return await ProgramaAcademico.findAll({
      order: [['nombre', 'ASC']]
    });
  }

  async findProgramaById(id) {
    return await ProgramaAcademico.findByPk(id, {
      include: [{ model: Asignatura, as: 'asignaturas' }]
    });
  }

  async findProgramaByCodigo(codigo) {
    return await ProgramaAcademico.findOne({ where: { codigo } });
  }

  async createPrograma(data) {
    return await ProgramaAcademico.create(data);
  }

  async updatePrograma(id, data) {
    const programa = await ProgramaAcademico.findByPk(id);
    if (!programa) return null;
    return await programa.update(data);
  }

  // Asignaturas
  async findAllAsignaturas(filters = {}) {
    return await Asignatura.findAll({
      where: filters,
      include: [{ model: ProgramaAcademico, as: 'programa', attributes: ['id', 'codigo', 'nombre'] }],
      order: [['nombre', 'ASC']]
    });
  }

  async findAsignaturaById(id) {
    return await Asignatura.findByPk(id, {
      include: [{ model: ProgramaAcademico, as: 'programa' }]
    });
  }

  async findAsignaturaByCodigo(codigo) {
    return await Asignatura.findOne({ where: { codigo } });
  }

  async createAsignatura(data) {
    return await Asignatura.create(data);
  }

  // Asignaciones Docente - Asignatura
  async findAsignaturasByDocente(docenteId, periodoAcademico = null) {
    const where = { docente_id: docenteId };
    if (periodoAcademico) {
      where.periodo_academico = periodoAcademico;
    }

    return await DocenteAsignatura.findAll({
      where,
      include: [
        {
          model: Asignatura,
          as: 'asignatura',
          include: [{ model: ProgramaAcademico, as: 'programa', attributes: ['id', 'codigo', 'nombre'] }]
        }
      ],
      order: [['created_at', 'DESC']]
    });
  }

  async asignarDocente(docenteId, asignaturaId, periodoAcademico, grupo = '01', sede = 'Medellín', modalidad = 'Regular', jornada = 'Mañana') {
    return await DocenteAsignatura.findOrCreate({
      where: {
        docente_id: docenteId,
        asignatura_id: asignaturaId,
        periodo_academico: periodoAcademico,
        grupo,
        sede,
        modalidad,
        jornada
      },
      defaults: {
        docente_id: docenteId,
        asignatura_id: asignaturaId,
        periodo_academico: periodoAcademico,
        grupo,
        sede,
        modalidad,
        jornada
      }
    });
  }

  async findAsignacionById(id) {
    return await DocenteAsignatura.findByPk(id, {
      include: [
        {
          model: Asignatura,
          as: 'asignatura',
          include: [{ model: ProgramaAcademico, as: 'programa', attributes: ['id', 'codigo', 'nombre'] }]
        }
      ]
    });
  }

  async updateAsignacion(id, docenteId, data) {
    const asignacion = await DocenteAsignatura.findOne({
      where: { id, docente_id: docenteId }
    });
    if (!asignacion) return null;
    return await asignacion.update(data);
  }

  async deleteAsignacion(id, docenteId) {
    const asignacion = await DocenteAsignatura.findOne({
      where: { id, docente_id: docenteId }
    });
    if (!asignacion) return false;
    await asignacion.destroy();
    return true;
  }

  async updateAsignatura(id, data) {
    const asignatura = await Asignatura.findByPk(id);
    if (!asignatura) return null;
    return await asignatura.update(data);
  }
}

export default new CourseRepository();
