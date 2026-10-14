import { sequelize } from '../config/database.js';

// Modelos
import Rol from './Rol.js';
import Usuario from './Usuario.js';
import SesionToken from './SesionToken.js';
import LogAuditoriaSeguridad from './LogAuditoriaSeguridad.js';
import ProgramaAcademico from './ProgramaAcademico.js';
import Asignatura from './Asignatura.js';
import DocenteAsignatura from './DocenteAsignatura.js';
import MaterialClase from './MaterialClase.js';
import ParametroIAEvaluacion from './ParametroIAEvaluacion.js';
import Evaluacion from './Evaluacion.js';
import Pregunta from './Pregunta.js';
import OpcionRespuesta from './OpcionRespuesta.js';
import Rubrica from './Rubrica.js';
import CriterioRubrica from './CriterioRubrica.js';
import NivelCriterio from './NivelCriterio.js';
import VersionExamen from './VersionExamen.js';
import TokenAccesoExamen from './TokenAccesoExamen.js';
import ExportacionHistorial from './ExportacionHistorial.js';

// ==========================================
// RELACIONES
// ==========================================

// 1. Roles y Usuarios
Rol.hasMany(Usuario, { foreignKey: 'rol_id', as: 'usuarios' });
Usuario.belongsTo(Rol, { foreignKey: 'rol_id', as: 'rol' });

// 2. Sesiones y Auditoría
Usuario.hasMany(SesionToken, { foreignKey: 'usuario_id', as: 'sesiones' });
SesionToken.belongsTo(Usuario, { foreignKey: 'usuario_id', as: 'usuario' });

Usuario.hasMany(LogAuditoriaSeguridad, { foreignKey: 'usuario_id', as: 'logs' });
LogAuditoriaSeguridad.belongsTo(Usuario, { foreignKey: 'usuario_id', as: 'usuario' });

// 3. Contexto Académico
ProgramaAcademico.hasMany(Asignatura, { foreignKey: 'programa_id', as: 'asignaturas' });
Asignatura.belongsTo(ProgramaAcademico, { foreignKey: 'programa_id', as: 'programa' });

Usuario.hasMany(DocenteAsignatura, { foreignKey: 'docente_id', as: 'asignaciones' });
DocenteAsignatura.belongsTo(Usuario, { foreignKey: 'docente_id', as: 'docente' });

Asignatura.hasMany(DocenteAsignatura, { foreignKey: 'asignatura_id', as: 'docentes_asignados' });
DocenteAsignatura.belongsTo(Asignatura, { foreignKey: 'asignatura_id', as: 'asignatura' });

Usuario.belongsToMany(Asignatura, {
  through: DocenteAsignatura,
  foreignKey: 'docente_id',
  otherKey: 'asignatura_id',
  as: 'asignaturas'
});
Asignatura.belongsToMany(Usuario, {
  through: DocenteAsignatura,
  foreignKey: 'asignatura_id',
  otherKey: 'docente_id',
  as: 'docentes'
});

// 4. Ingesta de Material
Usuario.hasMany(MaterialClase, { foreignKey: 'docente_id', as: 'materiales' });
MaterialClase.belongsTo(Usuario, { foreignKey: 'docente_id', as: 'docente' });

Asignatura.hasMany(MaterialClase, { foreignKey: 'asignatura_id', as: 'materiales' });
MaterialClase.belongsTo(Asignatura, { foreignKey: 'asignatura_id', as: 'asignatura' });

// 5. Evaluaciones y Parámetros IA
ParametroIAEvaluacion.hasMany(Evaluacion, { foreignKey: 'parametro_ia_id', as: 'evaluaciones' });
Evaluacion.belongsTo(ParametroIAEvaluacion, { foreignKey: 'parametro_ia_id', as: 'parametro_ia' });

Usuario.hasMany(Evaluacion, { foreignKey: 'docente_id', as: 'evaluaciones' });
Evaluacion.belongsTo(Usuario, { foreignKey: 'docente_id', as: 'docente' });

Asignatura.hasMany(Evaluacion, { foreignKey: 'asignatura_id', as: 'evaluaciones' });
Evaluacion.belongsTo(Asignatura, { foreignKey: 'asignatura_id', as: 'asignatura' });

// 6. Preguntas y Opciones
Evaluacion.hasMany(Pregunta, { foreignKey: 'evaluacion_id', as: 'preguntas' });
Pregunta.belongsTo(Evaluacion, { foreignKey: 'evaluacion_id', as: 'evaluacion' });

Pregunta.hasMany(OpcionRespuesta, { foreignKey: 'pregunta_id', as: 'opciones' });
OpcionRespuesta.belongsTo(Pregunta, { foreignKey: 'pregunta_id', as: 'pregunta' });

// 7. Rúbricas Pedagógicas
Evaluacion.hasOne(Rubrica, { foreignKey: 'evaluacion_id', as: 'rubrica' });
Rubrica.belongsTo(Evaluacion, { foreignKey: 'evaluacion_id', as: 'evaluacion' });

Rubrica.hasMany(CriterioRubrica, { foreignKey: 'rubrica_id', as: 'criterios' });
CriterioRubrica.belongsTo(Rubrica, { foreignKey: 'rubrica_id', as: 'rubrica' });

CriterioRubrica.hasMany(NivelCriterio, { foreignKey: 'criterio_id', as: 'niveles' });
NivelCriterio.belongsTo(CriterioRubrica, { foreignKey: 'criterio_id', as: 'criterio' });

// 8. Versionamiento y Control de Acceso
Evaluacion.hasMany(VersionExamen, { foreignKey: 'evaluacion_id', as: 'versiones' });
VersionExamen.belongsTo(Evaluacion, { foreignKey: 'evaluacion_id', as: 'evaluacion' });

Usuario.hasMany(VersionExamen, { foreignKey: 'aprobado_por', as: 'versiones_aprobadas' });
VersionExamen.belongsTo(Usuario, { foreignKey: 'aprobado_por', as: 'aprobador' });

VersionExamen.hasMany(TokenAccesoExamen, { foreignKey: 'version_examen_id', as: 'tokens' });
TokenAccesoExamen.belongsTo(VersionExamen, { foreignKey: 'version_examen_id', as: 'version_examen' });

// 9. Historial de Exportaciones
Evaluacion.hasMany(ExportacionHistorial, { foreignKey: 'evaluacion_id', as: 'exportaciones' });
ExportacionHistorial.belongsTo(Evaluacion, { foreignKey: 'evaluacion_id', as: 'evaluacion' });

Usuario.hasMany(ExportacionHistorial, { foreignKey: 'docente_id', as: 'exportaciones_descargadas' });
ExportacionHistorial.belongsTo(Usuario, { foreignKey: 'docente_id', as: 'docente' });

// Sincronización y seeds iniciales
export const syncDB = async () => {
  try {
    await sequelize.sync({ alter: true });
    console.log('Base de datos sincronizada correctamente.');

    // Semillas iniciales indispensables
    await Rol.findOrCreate({
      where: { nombre_rol: 'ADMINISTRADOR' },
      defaults: { descripcion: 'Administrador del sistema con acceso total' }
    });

    await Rol.findOrCreate({
      where: { nombre_rol: 'DOCENTE' },
      defaults: { descripcion: 'Docente creador y evaluador de exámenes' }
    });

  } catch (error) {
    console.error('Error al sincronizar la base de datos:', error);
    throw error;
  }
};

export {
  sequelize,
  Rol,
  Usuario,
  SesionToken,
  LogAuditoriaSeguridad,
  ProgramaAcademico,
  Asignatura,
  DocenteAsignatura,
  MaterialClase,
  ParametroIAEvaluacion,
  Evaluacion,
  Pregunta,
  OpcionRespuesta,
  Rubrica,
  CriterioRubrica,
  NivelCriterio,
  VersionExamen,
  TokenAccesoExamen,
  ExportacionHistorial,
};
