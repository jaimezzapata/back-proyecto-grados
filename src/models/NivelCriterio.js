import { DataTypes } from 'sequelize';
import { sequelize } from '../config/database.js';

const NivelCriterio = sequelize.define('NivelCriterio', {
  id: {
    type: DataTypes.UUID,
    defaultValue: DataTypes.UUIDV4,
    primaryKey: true,
  },
  criterio_id: {
    type: DataTypes.UUID,
    allowNull: false,
    references: {
      model: 'criterios_rubricas',
      key: 'id',
    },
  },
  nombre_nivel: {
    type: DataTypes.STRING(100),
    allowNull: false, // Ej: Sobresaliente, Bueno, Aceptable, Insuficiente
  },
  puntaje: {
    type: DataTypes.FLOAT,
    allowNull: false,
  },
  descripcion: {
    type: DataTypes.TEXT,
    allowNull: true,
  }
}, {
  tableName: 'niveles_criterios',
  timestamps: true,
  createdAt: 'created_at',
  updatedAt: 'updated_at',
});

export default NivelCriterio;
