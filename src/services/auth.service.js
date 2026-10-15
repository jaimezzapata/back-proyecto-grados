import userRepository from '../repositories/user.repository.js';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { ConflictError, UnauthorizedError, ForbiddenError } from '../helpers/errors.js';

class AuthService {
  async register(userData) {
    const existingUser = await userRepository.findByEmail(userData.correo_institucional);
    if (existingUser) {
      throw new ConflictError(
        `El correo institucional '${userData.correo_institucional}' ya se encuentra registrado. Utilice otro correo o inicie sesión.`,
        { correo: userData.correo_institucional }
      );
    }

    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(userData.password, salt);

    const newUserParams = {
      nombres: userData.nombres,
      apellidos: userData.apellidos,
      correo_institucional: userData.correo_institucional,
      password_hash: hashedPassword
    };

    const user = await userRepository.create(newUserParams);
    
    return {
      id: user.id,
      nombres: user.nombres,
      apellidos: user.apellidos,
      correo_institucional: user.correo_institucional
    };
  }

  async login(email, password) {
    const user = await userRepository.findByEmail(email);
    if (!user) {
      throw new UnauthorizedError('Credenciales incorrectas: verifique su correo institucional y contraseña.');
    }

    const isMatch = await bcrypt.compare(password, user.password_hash);
    if (!isMatch) {
      throw new UnauthorizedError('Credenciales incorrectas: verifique su correo institucional y contraseña.');
    }

    if (!user.estado) {
      throw new ForbiddenError(
        'Su cuenta de usuario se encuentra inactiva. Comuníquese con la coordinación académica o el administrador del sistema.',
        { usuario_id: user.id, estado: false }
      );
    }

    const payload = {
      id: user.id,
      rol: user.rol.nombre_rol,
      nombres: user.nombres,
      apellidos: user.apellidos,
      correo_institucional: user.correo_institucional
    };

    const token = jwt.sign(payload, process.env.JWT_SECRET, {
      expiresIn: process.env.JWT_EXPIRES_IN || '24h'
    });

    return {
      token,
      user: payload
    };
  }
}

export default new AuthService();
