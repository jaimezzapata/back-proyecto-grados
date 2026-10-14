import { DataTypes } from 'sequelize';
import { sequelize } from '../config/database.js';

const OpcionRespuesta = sequelize.define('OpcionRespuesta', {
  id: {
    type: DataTypes.UUID,
    defaultValue: DataTypes.UUIDV4,
    primaryKey: true,
  },
  pregunta_id: {
    type: DataTypes.UUID,
    allowNull: false,
    references: {
      model: 'preguntas',
      key: 'id',
    },
  },
  texto_opcion: {
    type: DataTypes.TEXT,
    allowNull: false,
  },
  es_correcta: {
    type: DataTypes.BOOLEAN,
    defaultValue: false,
  },
  retroalimentacion: {
    type: DataTypes.TEXT,
    allowNull: true,
  },
  orden: {
    type: DataTypes.INTEGER,
    defaultValue: 1,
  }
}, {
  tableName: 'opciones_respuestas',
  timestamps: true,
  createdAt: 'created_at',
  updatedAt: 'updated_at',
});

export default OpcionRespuesta;
