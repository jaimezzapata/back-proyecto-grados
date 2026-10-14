import { DataTypes } from 'sequelize';
import { sequelize } from '../config/database.js';

const SesionToken = sequelize.define('SesionToken', {
  id: {
    type: DataTypes.UUID,
    defaultValue: DataTypes.UUIDV4,
    primaryKey: true,
  },
  usuario_id: {
    type: DataTypes.UUID,
    allowNull: false,
    references: {
      model: 'usuarios',
      key: 'id',
    },
  },
  token: {
    type: DataTypes.TEXT,
    allowNull: false,
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
  tableName: 'sesiones_tokens',
  timestamps: true,
  createdAt: 'created_at',
  updatedAt: false,
});

export default SesionToken;
