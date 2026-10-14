import userRepository from '../repositories/user.repository.js';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';

class AuthService {
  async register(userData) {
    const existingUser = await userRepository.findByEmail(userData.correo_institucional);
    if (existingUser) {
      throw new Error('El correo institucional ya está registrado');
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
      throw new Error('Credenciales incorrectas');
    }

    const isMatch = await bcrypt.compare(password, user.password_hash);
    if (!isMatch) {
      throw new Error('Credenciales incorrectas');
    }

    if (!user.estado) {
      throw new Error('Usuario inactivo');
    }

    const payload = {
      id: user.id,
      rol: user.rol.nombre_rol,
      nombres: user.nombres
    };

    const token = jwt.sign(payload, process.env.JWT_SECRET, {
      expiresIn: process.env.JWT_EXPIRES_IN
    });

    return {
      token,
      user: payload
    };
  }
}

export default new AuthService();
