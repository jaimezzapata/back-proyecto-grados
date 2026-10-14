import { DataTypes } from 'sequelize';
import { sequelize } from '../config/database.js';

const Rubrica = sequelize.define('Rubrica', {
  id: {
    type: DataTypes.UUID,
    defaultValue: DataTypes.UUIDV4,
    primaryKey: true,
  },
  evaluacion_id: {
    type: DataTypes.UUID,
    allowNull: false,
    references: {
      model: 'evaluaciones',
      key: 'id',
    },
  },
  titulo: {
    type: DataTypes.STRING(150),
    allowNull: false,
  },
  descripcion: {
    type: DataTypes.TEXT,
    allowNull: true,
  }
}, {
  tableName: 'rubricas',
  timestamps: true,
  createdAt: 'created_at',
  updatedAt: 'updated_at',
});

export default Rubrica;
