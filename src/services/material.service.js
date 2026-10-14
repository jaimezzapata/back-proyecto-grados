import path from 'path';
import fs from 'fs';
import materialRepository from '../repositories/material.repository.js';
import courseRepository from '../repositories/course.repository.js';
import { extractTextFromFile } from '../helpers/textExtractor.js';
import { BadRequestError, NotFoundError, ForbiddenError } from '../helpers/errors.js';

class MaterialService {

  async uploadAndProcessMaterial(docenteId, file, body) {
    if (!file) {
      throw new BadRequestError('Debe adjuntar un archivo válido en formato PDF, Word (DOCX) o TXT.');
    }

    const { asignatura_id, titulo } = body;
    if (!asignatura_id) {
      throw new BadRequestError('El ID de la asignatura (asignatura_id) es obligatorio.');
    }

    const asignatura = await courseRepository.findAsignaturaById(asignatura_id);
    if (!asignatura) {
      throw new NotFoundError('Asignatura', asignatura_id);
    }

    const ext = path.extname(file.originalname).toLowerCase().replace('.', '');
    const finalTitle = titulo || path.basename(file.originalname, path.extname(file.originalname));

    let contenidoExtraido = '';
    let estadoProcesamiento = 'PROCESADO';

    try {
      contenidoExtraido = await extractTextFromFile(file.path);
      if (!contenidoExtraido || contenidoExtraido.trim().length === 0) {
        estadoProcesamiento = 'ADVERTENCIA_VACIO';
      }
    } catch (extractError) {
      console.error('Error al extraer texto del archivo:', extractError);
      estadoProcesamiento = 'ERROR';
    }

    const materialData = {
      docente_id: docenteId,
      asignatura_id: Number(asignatura_id),
      titulo: finalTitle,
      archivo_url: file.path.replace(/\\/g, '/'),
      formato: ext,
      contenido_extraido: contenidoExtraido,
      estado_procesamiento: estadoProcesamiento
    };

    const material = await materialRepository.create(materialData);
    return material;
  }

  async getMaterialesDocente(docenteId, filters = {}) {
    return await materialRepository.findByDocente(docenteId, filters);
  }

  async getMaterialById(id, docenteId) {
    const material = await materialRepository.findById(id);
    if (!material) {
      throw new NotFoundError('Material de clase', id);
    }

    if (material.docente_id !== docenteId) {
      throw new ForbiddenError(
        'Acceso denegado: este material de clase pertenece a otro docente y no puede ser consultado.',
        { material_id: id }
      );
    }

    return material;
  }

  async deleteMaterial(id, docenteId) {
    const material = await materialRepository.findById(id);
    if (!material) {
      throw new NotFoundError('Material de clase', id);
    }

    if (material.docente_id !== docenteId) {
      throw new ForbiddenError(
        'Acceso denegado: no tiene permisos para eliminar un material de clase que pertenece a otro docente.',
        { material_id: id }
      );
    }

    // Intentar remover el archivo físico del disco
    if (material.archivo_url && fs.existsSync(material.archivo_url)) {
      try {
        fs.unlinkSync(material.archivo_url);
      } catch (err) {
        console.warn('No se pudo eliminar el archivo físico del disco:', err.message);
      }
    }

    await materialRepository.delete(id);
    return true;
  }
}

export default new MaterialService();
