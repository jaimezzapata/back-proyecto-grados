import { DataTypes } from 'sequelize';
import { sequelize } from '../config/database.js';

const MaterialClase = sequelize.define('MaterialClase', {
  id: {
    type: DataTypes.UUID,
    defaultValue: DataTypes.UUIDV4,
    primaryKey: true,
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
  titulo: {
    type: DataTypes.STRING(200),
    allowNull: false,
  },
  archivo_url: {
    type: DataTypes.TEXT,
    allowNull: true,
  },
  formato: {
    type: DataTypes.STRING(20),
    allowNull: false, // pdf, docx, txt
  },
  contenido_extraido: {
    type: DataTypes.TEXT('long'),
    allowNull: true,
  },
  estado_procesamiento: {
    type: DataTypes.STRING(30),
    defaultValue: 'PENDIENTE', // PENDIENTE, PROCESADO, ERROR
  }
}, {
  tableName: 'materiales_clases',
  timestamps: true,
  createdAt: 'created_at',
  updatedAt: 'updated_at',
});

export default MaterialClase;
