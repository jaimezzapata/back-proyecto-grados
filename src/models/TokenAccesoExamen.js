import { DataTypes } from 'sequelize';
import { sequelize } from '../config/database.js';

const TokenAccesoExamen = sequelize.define('TokenAccesoExamen', {
  id: {
    type: DataTypes.UUID,
    defaultValue: DataTypes.UUIDV4,
    primaryKey: true,
  },
  version_examen_id: {
    type: DataTypes.UUID,
    allowNull: false,
    references: {
      model: 'versiones_examenes',
      key: 'id',
    },
  },
  token: {
    type: DataTypes.STRING(100),
    allowNull: false,
    unique: true,
  },
  fecha_expiracion: {
    type: DataTypes.DATE,
    allowNull: false,
  },
  activo: {
    type: DataTypes.BOOLEAN,
    defaultValue: true,
  }
}, {
  tableName: 'tokens_acceso_examenes',
  timestamps: true,
  createdAt: 'created_at',
  updatedAt: false,
});

export default TokenAccesoExamen;
