import examRepository from '../repositories/exam.repository.js';
import exportRepository from '../repositories/export.repository.js';
import { generateDocx, generatePdf } from '../helpers/exportGenerator.js';
import { BadRequestError, NotFoundError, ForbiddenError } from '../helpers/errors.js';

class ExportService {

  async exportExam(evaluacionId, docenteId, formato = 'PDF', tipoVersion = 'ESTUDIANTE') {
    const formatoNorm = formato.toUpperCase();
    const versionNorm = tipoVersion.toUpperCase();

    // 1. Validar formato
    if (!['PDF', 'WORD', 'DOCX'].includes(formatoNorm)) {
      throw new BadRequestError(
        `Formato de exportación no soportado: '${formato}'. Los formatos permitidos son 'PDF' y 'WORD' (o 'DOCX').`,
        { formato_solicitado: formato }
      );
    }

    // 2. Validar tipo de versión
    if (!['ESTUDIANTE', 'DOCENTE_SOLUCIONARIO', 'DOCENTE'].includes(versionNorm)) {
      throw new BadRequestError(
        `Tipo de versión no válida: '${tipoVersion}'. Los tipos permitidos son 'ESTUDIANTE' y 'DOCENTE_SOLUCIONARIO'.`,
        { tipo_solicitado: tipoVersion }
      );
    }

    const versionFinal = (versionNorm === 'DOCENTE' || versionNorm === 'DOCENTE_SOLUCIONARIO')
      ? 'DOCENTE_SOLUCIONARIO'
      : 'ESTUDIANTE';

    // 3. Buscar evaluación completa y verificar pertenencia
    const evaluacion = await examRepository.findById(evaluacionId);
    if (!evaluacion) {
      throw new NotFoundError('Evaluación', evaluacionId);
    }

    if (evaluacion.docente_id !== docenteId) {
      throw new ForbiddenError(
        'Acceso denegado: no tiene permisos para exportar una evaluación creada por otro docente.',
        { evaluacion_id: evaluacionId }
      );
    }

    if (!evaluacion.preguntas || evaluacion.preguntas.length === 0) {
      throw new BadRequestError(
        'La evaluación no contiene preguntas. Debe generar o agregar preguntas antes de exportar el documento.',
        { evaluacion_id: evaluacionId }
      );
    }

    // 4. Generar Buffer según el formato
    let buffer;
    let extension;
    let contentType;

    if (formatoNorm === 'PDF') {
      buffer = await generatePdf(evaluacion, versionFinal);
      extension = 'pdf';
      contentType = 'application/pdf';
    } else {
      buffer = await generateDocx(evaluacion, versionFinal);
      extension = 'docx';
      contentType = 'application/vnd.openxmlformats-officedocument.wordprocessingml.document';
    }

    // 5. Construir nombre de archivo amigable
    const safeTitle = (evaluacion.titulo || 'examen')
      .toLowerCase()
      .replace(/[^a-z0-9]/gi, '_')
      .substring(0, 30);
    const versionSuffix = versionFinal === 'DOCENTE_SOLUCIONARIO' ? 'docente_solucionario' : 'estudiante';
    const filename = `${safeTitle}_${versionSuffix}.${extension}`;

    // 6. Registrar en el historial de exportaciones para auditoría
    await exportRepository.recordExport({
      evaluacion_id: evaluacionId,
      docente_id: docenteId,
      formato: formatoNorm === 'PDF' ? 'PDF' : 'DOCX',
      tipo_version: versionFinal,
      archivo_url: filename
    });

    return {
      buffer,
      filename,
      contentType
    };
  }

  async getHistoryByExam(evaluacionId, docenteId) {
    const evaluacion = await examRepository.findById(evaluacionId);
    if (!evaluacion) {
      throw new NotFoundError('Evaluación', evaluacionId);
    }
    if (evaluacion.docente_id !== docenteId) {
      throw new ForbiddenError('Acceso denegado a esta evaluación', { evaluacion_id: evaluacionId });
    }
    return await exportRepository.findHistoryByExam(evaluacionId);
  }

  async getMyExportHistory(docenteId) {
    return await exportRepository.findHistoryByDocente(docenteId);
  }
}

export default new ExportService();
