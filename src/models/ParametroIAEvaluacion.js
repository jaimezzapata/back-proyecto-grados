import { DataTypes } from 'sequelize';
import { sequelize } from '../config/database.js';

const ParametroIAEvaluacion = sequelize.define('ParametroIAEvaluacion', {
  id: {
    type: DataTypes.UUID,
    defaultValue: DataTypes.UUIDV4,
    primaryKey: true,
  },
  nivel_bloom: {
    type: DataTypes.STRING(50),
    allowNull: false, // Recordar, Comprender, Aplicar, Analizar, Evaluar, Crear
  },
  cantidad_preguntas: {
    type: DataTypes.INTEGER,
    allowNull: false,
    defaultValue: 5,
  },
  tipo_preguntas: {
    type: DataTypes.STRING(50),
    allowNull: false, // OPCION_MULTIPLE, VERDADERO_FALSO, ABIERTA, MIXTA
  },
  modelo_ia: {
    type: DataTypes.STRING(50),
    defaultValue: 'gpt-4o-mini',
  },
  temperatura: {
    type: DataTypes.FLOAT,
    defaultValue: 0.3,
  },
  configuracion_adicional: {
    type: DataTypes.JSON,
    allowNull: true,
  }
}, {
  tableName: 'parametros_ia_evaluaciones',
  timestamps: true,
  createdAt: 'created_at',
  updatedAt: 'updated_at',
});

export default ParametroIAEvaluacion;
