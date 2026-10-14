import { Usuario, Rol } from '../models/index.js';

class UserRepository {
  
  async findByEmail(email) {
    return await Usuario.findOne({ 
      where: { correo_institucional: email },
      include: [{ model: Rol, as: 'rol' }]
    });
  }

  async findById(id) {
    return await Usuario.findByPk(id, {
      include: [{ model: Rol, as: 'rol' }]
    });
  }

  async create(userData) {
    if (!userData.rol_id) {
      const rolDocente = await Rol.findOne({ where: { nombre_rol: 'DOCENTE' } });
      userData.rol_id = rolDocente.id;
    }
    
    return await Usuario.create(userData);
  }
}

export default new UserRepository();
