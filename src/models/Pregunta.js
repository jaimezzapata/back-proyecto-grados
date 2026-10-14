import { DataTypes } from 'sequelize';
import { sequelize } from '../config/database.js';

const Pregunta = sequelize.define('Pregunta', {
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
  enunciado: {
    type: DataTypes.TEXT,
    allowNull: false,
  },
  tipo_pregunta: {
    type: DataTypes.STRING(50),
    allowNull: false, // OPCION_MULTIPLE, VERDADERO_FALSO, ABIERTA
  },
  nivel_bloom: {
    type: DataTypes.STRING(50),
    allowNull: true,
  },
  puntaje: {
    type: DataTypes.FLOAT,
    defaultValue: 1.0,
  },
  justificacion_pedagogica: {
    type: DataTypes.TEXT,
    allowNull: true,
  },
  orden: {
    type: DataTypes.INTEGER,
    defaultValue: 1,
  }
}, {
  tableName: 'preguntas',
  timestamps: true,
  createdAt: 'created_at',
  updatedAt: 'updated_at',
});

export default Pregunta;
