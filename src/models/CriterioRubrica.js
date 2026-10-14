import { DataTypes } from 'sequelize';
import { sequelize } from '../config/database.js';

const CriterioRubrica = sequelize.define('CriterioRubrica', {
  id: {
    type: DataTypes.UUID,
    defaultValue: DataTypes.UUIDV4,
    primaryKey: true,
  },
  rubrica_id: {
    type: DataTypes.UUID,
    allowNull: false,
    references: {
      model: 'rubricas',
      key: 'id',
    },
  },
  nombre_criterio: {
    type: DataTypes.STRING(150),
    allowNull: false,
  },
  ponderacion: {
    type: DataTypes.FLOAT,
    allowNull: false, // Porcentaje o puntos ej. 25.0
  }
}, {
  tableName: 'criterios_rubricas',
  timestamps: true,
  createdAt: 'created_at',
  updatedAt: 'updated_at',
});

export default CriterioRubrica;
