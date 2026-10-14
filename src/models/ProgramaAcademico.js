import { DataTypes } from 'sequelize';
import { sequelize } from '../config/database.js';

const ProgramaAcademico = sequelize.define('ProgramaAcademico', {
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true,
  },
  codigo: {
    type: DataTypes.STRING(20),
    allowNull: false,
    unique: true,
  },
  nombre: {
    type: DataTypes.STRING(150),
    allowNull: false,
  }
}, {
  tableName: 'programas_academicos',
  timestamps: true,
  createdAt: 'created_at',
  updatedAt: 'updated_at',
});

export default ProgramaAcademico;
