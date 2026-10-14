import path from 'path';
import fs from 'fs';
import materialRepository from '../repositories/material.repository.js';
import courseRepository from '../repositories/course.repository.js';
import { extractTextFromFile } from '../helpers/textExtractor.js';

class MaterialService {

  async uploadAndProcessMaterial(docenteId, file, body) {
    if (!file) {
      throw new Error('Debe adjuntar un archivo válido (.pdf, .docx, .txt)');
    }

    const { asignatura_id, titulo } = body;
    if (!asignatura_id) {
      throw new Error('El ID de la asignatura es requerido');
    }

    const asignatura = await courseRepository.findAsignaturaById(asignatura_id);
    if (!asignatura) {
      throw new Error('La asignatura especificada no existe');
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
      throw new Error('Material no encontrado');
    }

    if (material.docente_id !== docenteId) {
      throw new Error('No tiene autorización para acceder a este material');
    }

    return material;
  }

  async deleteMaterial(id, docenteId) {
    const material = await materialRepository.findById(id);
    if (!material) {
      throw new Error('Material no encontrado');
    }

    if (material.docente_id !== docenteId) {
      throw new Error('No tiene autorización para eliminar este material');
    }

    // Intentar remover el archivo físico del disco
    if (material.archivo_url && fs.existsSync(material.archivo_url)) {
      try {
        fs.unlinkSync(material.archivo_url);
      } catch (err) {
        console.warn('No se pudo eliminar el archivo físico:', err.message);
      }
    }

    await materialRepository.delete(id);
    return true;
  }
}

export default new MaterialService();
