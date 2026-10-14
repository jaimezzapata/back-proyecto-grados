import fs from 'fs';
import path from 'path';
import pdfParse from 'pdf-parse/lib/pdf-parse.js';
import mammoth from 'mammoth';

/**
 * Sanitiza y limpia el texto plano extraído de un archivo.
 */
export const sanitizeExtractedText = (rawText) => {
  if (!rawText) return '';
  return rawText
    .replace(/\r\n/g, '\n')
    .replace(/[\x00-\x08\x0B\x0C\x0E-\x1F\x7F]/g, '') // Caracteres no imprimibles de control
    .replace(/[ \t]+/g, ' ') // Espacios múltiples a un solo espacio
    .replace(/\n{3,}/g, '\n\n') // Reducir saltos de línea consecutivos
    .trim();
};

/**
 * Extrae texto de un archivo soportado (.pdf, .docx, .txt)
 * @param {string} filePath Ruta absoluta o relativa del archivo
 * @returns {Promise<string>} Texto extraído y sanitizado
 */
export const extractTextFromFile = async (filePath) => {
  const ext = path.extname(filePath).toLowerCase();

  if (!fs.existsSync(filePath)) {
    throw new Error('El archivo no existe en el sistema.');
  }

  let text = '';

  switch (ext) {
    case '.pdf': {
      const dataBuffer = fs.readFileSync(filePath);
      const pdfData = await pdfParse(dataBuffer);
      text = pdfData.text;
      break;
    }
    case '.docx':
    case '.doc': {
      const docData = await mammoth.extractRawText({ path: filePath });
      text = docData.value;
      break;
    }
    case '.txt': {
      text = fs.readFileSync(filePath, 'utf-8');
      break;
    }
    default:
      throw new Error(`El formato ${ext} no es soportado para extracción de texto.`);
  }

  return sanitizeExtractedText(text);
};
