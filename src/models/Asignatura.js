import { DataTypes } from 'sequelize';
import { sequelize } from '../config/database.js';

const Asignatura = sequelize.define('Asignatura', {
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true,
  },
  programa_id: {
    type: DataTypes.INTEGER,
    allowNull: false,
    references: {
      model: 'programas_academicos',
      key: 'id',
    },
  },
  codigo: {
    type: DataTypes.STRING(20),
    allowNull: false,
    unique: true,
  },
  nombre: {
    type: DataTypes.STRING(150),
    allowNull: false,
  },
  semestre: {
    type: DataTypes.INTEGER,
    allowNull: true,
  }
}, {
  tableName: 'asignaturas',
  timestamps: true,
  createdAt: 'created_at',
  updatedAt: 'updated_at',
});

export default Asignatura;
