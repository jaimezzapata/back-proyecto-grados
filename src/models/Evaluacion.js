import { DataTypes } from 'sequelize';
import { sequelize } from '../config/database.js';

const Evaluacion = sequelize.define('Evaluacion', {
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
  parametro_ia_id: {
    type: DataTypes.UUID,
    allowNull: true,
    references: {
      model: 'parametros_ia_evaluaciones',
      key: 'id',
    },
  },
  titulo: {
    type: DataTypes.STRING(200),
    allowNull: false,
  },
  descripcion: {
    type: DataTypes.TEXT,
    allowNull: true,
  },
  estado: {
    type: DataTypes.STRING(30),
    defaultValue: 'BORRADOR', // BORRADOR, GENERADO_IA, EN_REVISION, APROBADO, ARCHIVADO
  }
}, {
  tableName: 'evaluaciones',
  timestamps: true,
  createdAt: 'created_at',
  updatedAt: 'updated_at',
});

export default Evaluacion;
