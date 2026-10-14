import { DataTypes } from 'sequelize';
import { sequelize } from '../config/database.js';

const ExportacionHistorial = sequelize.define('ExportacionHistorial', {
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
  docente_id: {
    type: DataTypes.UUID,
    allowNull: false,
    references: {
      model: 'usuarios',
      key: 'id',
    },
  },
  formato: {
    type: DataTypes.STRING(20),
    allowNull: false, // PDF, DOCX
  },
  tipo_version: {
    type: DataTypes.STRING(50),
    allowNull: false, // ESTUDIANTE, DOCENTE_SOLUCIONARIO
  },
  archivo_url: {
    type: DataTypes.TEXT,
    allowNull: true,
  }
}, {
  tableName: 'exportaciones_historial',
  timestamps: true,
  createdAt: 'created_at',
  updatedAt: false,
});

export default ExportacionHistorial;
