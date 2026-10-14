import { MaterialClase, Asignatura, Usuario } from '../models/index.js';

class MaterialRepository {

  async create(data) {
    return await MaterialClase.create(data);
  }

  async findById(id) {
    return await MaterialClase.findByPk(id, {
      include: [
        { model: Asignatura, as: 'asignatura', attributes: ['id', 'codigo', 'nombre'] },
        { model: Usuario, as: 'docente', attributes: ['id', 'nombres', 'apellidos', 'correo_institucional'] }
      ]
    });
  }

  async findByDocente(docenteId, filters = {}) {
    const where = { docente_id: docenteId, ...filters };
    return await MaterialClase.findAll({
      where,
      include: [
        { model: Asignatura, as: 'asignatura', attributes: ['id', 'codigo', 'nombre'] }
      ],
      order: [['created_at', 'DESC']]
    });
  }

  async findByAsignatura(asignaturaId) {
    return await MaterialClase.findAll({
      where: { asignatura_id: asignaturaId },
      include: [
        { model: Usuario, as: 'docente', attributes: ['id', 'nombres', 'apellidos'] }
      ],
      order: [['created_at', 'DESC']]
    });
  }

  async update(id, data) {
    const material = await MaterialClase.findByPk(id);
    if (!material) return null;
    return await material.update(data);
  }

  async delete(id) {
    const material = await MaterialClase.findByPk(id);
    if (!material) return null;
    await material.destroy();
    return true;
  }
}

export default new MaterialRepository();
