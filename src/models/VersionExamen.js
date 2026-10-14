import { DataTypes } from 'sequelize';
import { sequelize } from '../config/database.js';

const VersionExamen = sequelize.define('VersionExamen', {
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
  numero_version: {
    type: DataTypes.STRING(20),
    allowNull: false, // Ej: 'A', 'B', '1.0'
  },
  snapshot_json: {
    type: DataTypes.JSON,
    allowNull: false,
  },
  aprobado_por: {
    type: DataTypes.UUID,
    allowNull: true,
    references: {
      model: 'usuarios',
      key: 'id',
    },
  }
}, {
  tableName: 'versiones_examenes',
  timestamps: true,
  createdAt: 'created_at',
  updatedAt: false,
});

export default VersionExamen;
