import { DataTypes } from 'sequelize';
import { sequelize } from '../config/database.js';

const LogAuditoriaSeguridad = sequelize.define('LogAuditoriaSeguridad', {
  id: {
    type: DataTypes.UUID,
    defaultValue: DataTypes.UUIDV4,
    primaryKey: true,
  },
  usuario_id: {
    type: DataTypes.UUID,
    allowNull: true,
    references: {
      model: 'usuarios',
      key: 'id',
    },
  },
  accion: {
    type: DataTypes.STRING(100),
    allowNull: false,
  },
  ip_origen: {
    type: DataTypes.STRING(45),
    allowNull: true,
  },
  detalles: {
    type: DataTypes.JSON,
    allowNull: true,
  }
}, {
  tableName: 'logs_auditoria_seguridad',
  timestamps: true,
  createdAt: 'created_at',
  updatedAt: false,
});

export default LogAuditoriaSeguridad;
