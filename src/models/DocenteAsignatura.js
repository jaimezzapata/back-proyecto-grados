import { DataTypes } from 'sequelize';
import { sequelize } from '../config/database.js';

const DocenteAsignatura = sequelize.define('DocenteAsignatura', {
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true,
  },
  docente_id: {
    type: DataTypes.UUID,
    allowNull: false,
    references: {
      model: 'usuarios',
      key: 'id',
    },
  },
  asignatura_id: {
    type: DataTypes.INTEGER,
    allowNull: false,
    references: {
      model: 'asignaturas',
      key: 'id',
    },
  },
  periodo_academico: {
    type: DataTypes.STRING(20),
    allowNull: false,
  },
  grupo: {
    type: DataTypes.STRING(20),
    allowNull: true,
  }
}, {
  tableName: 'docentes_asignaturas',
  timestamps: true,
  createdAt: 'created_at',
  updatedAt: 'updated_at',
});

export default DocenteAsignatura;
