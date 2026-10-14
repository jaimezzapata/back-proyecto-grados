import {
  Document,
  Packer,
  Paragraph,
  TextRun,
  Table,
  TableRow,
  TableCell,
  WidthType,
  BorderStyle,
  AlignmentType,
  ShadingType
} from 'docx';
import PDFDocument from 'pdfkit';

/**
 * Generador de Exámenes en Formato Word (.docx)
 * @param {Object} examData Datos de la evaluación con preguntas y opciones
 * @param {String} tipoVersion 'ESTUDIANTE' o 'DOCENTE_SOLUCIONARIO'
 * @returns {Promise<Buffer>} Buffer del archivo .docx
 */
export async function generateDocx(examData, tipoVersion = 'ESTUDIANTE') {
  const isDocente = tipoVersion === 'DOCENTE_SOLUCIONARIO';
  const asignaturaNombre = examData.asignatura?.nombre || 'Evaluación General';
  const asignaturaCodigo = examData.asignatura?.codigo || '';
  const totalPuntos = examData.preguntas?.reduce((acc, p) => acc + (p.puntaje || 0), 0) || 0;

  const docChildren = [];

  // 1. Encabezado Institucional
  docChildren.push(
    new Paragraph({
      alignment: AlignmentType.CENTER,
      spacing: { after: 100 },
      children: [
        new TextRun({
          text: isDocente ? 'GUÍA DEL DOCENTE Y SOLUCIONARIO PEDAGÓGICO' : 'INSTITUCIÓN EDUCATIVA - EVALUACIÓN ACADÉMICA',
          bold: true,
          size: 26,
          color: isDocente ? '1A365D' : '2D3748'
        })
      ]
    }),
    new Paragraph({
      alignment: AlignmentType.CENTER,
      spacing: { after: 200 },
      children: [
        new TextRun({
          text: `${asignaturaNombre.toUpperCase()} ${asignaturaCodigo ? `(${asignaturaCodigo})` : ''}`,
          bold: true,
          size: 22,
          color: '4A5568'
        })
      ]
    }),
    new Paragraph({
      alignment: AlignmentType.CENTER,
      spacing: { after: 300 },
      children: [
        new TextRun({
          text: examData.titulo || 'Evaluación de Aprendizaje',
          italics: true,
          size: 20,
          color: '718096'
        })
      ]
    })
  );

  // 2. Ficha de Identificación / Metadata
  if (!isDocente) {
    // Versión Estudiante: Ficha para completar datos
    const borderNone = { style: BorderStyle.NONE, size: 0, color: 'auto' };
    docChildren.push(
      new Table({
        width: { size: 100, type: WidthType.PERCENTAGE },
        borders: {
          top: borderNone,
          bottom: borderNone,
          left: borderNone,
          right: borderNone,
          insideHorizontal: borderNone,
          insideVertical: borderNone
        },
        rows: [
          new TableRow({
            children: [
              new TableCell({
                children: [
                  new Paragraph({
                    children: [new TextRun({ text: 'Nombre del Estudiante: ____________________________________________________', size: 19 })]
                  })
                ]
              }),
              new TableCell({
                children: [
                  new Paragraph({
                    children: [new TextRun({ text: 'Fecha: __________________', size: 19 })]
                  })
                ]
              })
            ]
          }),
          new TableRow({
            children: [
              new TableCell({
                children: [
                  new Paragraph({
                    children: [new TextRun({ text: 'Documento / ID: __________________________________   Grupo: ___________', size: 19 })]
                  })
                ]
              }),
              new TableCell({
                children: [
                  new Paragraph({
                    children: [new TextRun({ text: `Calificación: _____ / ${totalPuntos} pts`, bold: true, size: 19 })]
                  })
                ]
              })
            ]
          })
        ]
      }),
      new Paragraph({
        spacing: { before: 200, after: 250 },
        children: [
          new TextRun({
            text: 'Instrucciones: Lea detenidamente cada una de las preguntas antes de responder. Seleccione una única alternativa correcta para las preguntas de opción múltiple. Verifique sus respuestas antes de entregar.',
            italics: true,
            size: 18,
            color: '4A5568'
          })
        ]
      })
    );
  } else {
    // Versión Docente: Resumen Pedagógico y Matriz de Respuestas
    docChildren.push(
      new Paragraph({
        spacing: { before: 150, after: 150 },
        children: [
          new TextRun({ text: '📊 Resumen de la Evaluación:', bold: true, size: 20 }),
          new TextRun({ text: `  Total de Preguntas: ${examData.preguntas?.length || 0}  |  Puntaje Total: ${totalPuntos} pts`, size: 19 })
        ]
      })
    );

    // Matriz de respuestas rápidas (Tabla)
    const tableRows = [
      new TableRow({
        children: [
          new TableCell({ children: [new Paragraph({ children: [new TextRun({ text: '#', bold: true, size: 18 })] })] }),
          new TableCell({ children: [new Paragraph({ children: [new TextRun({ text: 'Respuesta Correcta', bold: true, size: 18 })] })] }),
          new TableCell({ children: [new Paragraph({ children: [new TextRun({ text: 'Nivel Bloom', bold: true, size: 18 })] })] }),
          new TableCell({ children: [new Paragraph({ children: [new TextRun({ text: 'Puntos', bold: true, size: 18 })] })] })
        ]
      })
    ];

    examData.preguntas?.forEach((p, idx) => {
      const letraLetras = ['A', 'B', 'C', 'D', 'E', 'F'];
      const correctaIdx = p.opciones?.findIndex(o => o.es_correcta);
      const clave = correctaIdx !== -1 && correctaIdx !== undefined ? letraLetras[correctaIdx] : 'Abierta / N/A';

      tableRows.push(
        new TableRow({
          children: [
            new TableCell({ children: [new Paragraph({ children: [new TextRun({ text: `${p.orden || idx + 1}`, size: 18 })] })] }),
            new TableCell({ children: [new Paragraph({ children: [new TextRun({ text: `Opción ${clave}`, bold: true, size: 18, color: '2B6CB0' })] })] }),
            new TableCell({ children: [new Paragraph({ children: [new TextRun({ text: `${p.nivel_bloom || 'General'}`, size: 18 })] })] }),
            new TableCell({ children: [new Paragraph({ children: [new TextRun({ text: `${p.puntaje || 1} pts`, size: 18 })] })] })
          ]
        })
      );
    });

    docChildren.push(
      new Table({
        width: { size: 100, type: WidthType.PERCENTAGE },
        rows: tableRows
      }),
      new Paragraph({ spacing: { after: 300 } })
    );
  }

  // 3. Preguntas y Opciones
  const letras = ['A', 'B', 'C', 'D', 'E', 'F'];

  examData.preguntas?.forEach((p, pIndex) => {
    const orden = p.orden || pIndex + 1;
    const puntaje = p.puntaje || 1;

    // Enunciado de la pregunta
    const questionChildren = [
      new TextRun({
        text: `${orden}. `,
        bold: true,
        size: 21,
        color: isDocente ? '2B6CB0' : '000000'
      }),
      new TextRun({
        text: `${p.enunciado} `,
        bold: true,
        size: 21
      }),
      new TextRun({
        text: `(${puntaje} ${puntaje === 1 ? 'punto' : 'puntos'})`,
        italics: true,
        size: 19,
        color: '718096'
      })
    ];

    if (isDocente && p.nivel_bloom) {
      questionChildren.push(
        new TextRun({
          text: ` [Bloom: ${p.nivel_bloom}]`,
          bold: true,
          size: 18,
          color: '975A16'
        })
      );
    }

    docChildren.push(
      new Paragraph({
        spacing: { before: 200, after: 100 },
        children: questionChildren
      })
    );

    // Si es docente y hay justificación pedagógica
    if (isDocente && p.justificacion_pedagogica) {
      docChildren.push(
        new Paragraph({
          spacing: { after: 100 },
          indent: { left: 360 },
          children: [
            new TextRun({ text: '🎯 Justificación Pedagógica: ', bold: true, size: 18, color: '2D3748' }),
            new TextRun({ text: p.justificacion_pedagogica, italics: true, size: 18, color: '4A5568' })
          ]
        })
      );
    }

    // Opciones de respuesta
    p.opciones?.forEach((opt, optIndex) => {
      const letra = letras[optIndex] || `${optIndex + 1}`;
      const esCorrecta = Boolean(opt.es_correcta);

      const optChildren = [];

      if (!isDocente) {
        // Estudiante: casilla para marcar y texto normal
        optChildren.push(
          new TextRun({ text: `(   ) ${letra}. `, bold: true, size: 20 }),
          new TextRun({ text: opt.texto_opcion, size: 20 })
        );
      } else {
        // Docente: marcar claramente si es correcta
        if (esCorrecta) {
          optChildren.push(
            new TextRun({ text: `[ ✓ ] ${letra}. `, bold: true, size: 20, color: '22543D' }),
            new TextRun({ text: `${opt.texto_opcion}  (CORRECTA)`, bold: true, size: 20, color: '22543D' })
          );
        } else {
          optChildren.push(
            new TextRun({ text: `[    ] ${letra}. `, size: 20, color: '718096' }),
            new TextRun({ text: opt.texto_opcion, size: 20, color: '4A5568' })
          );
        }
      }

      docChildren.push(
        new Paragraph({
          spacing: { before: 50, after: 50 },
          indent: { left: 400 },
          children: optChildren
        })
      );

      // Si es docente y tiene retroalimentación
      if (isDocente && opt.retroalimentacion) {
        docChildren.push(
          new Paragraph({
            spacing: { after: 80 },
            indent: { left: 600 },
            children: [
              new TextRun({ text: 'Retroalimentación: ', italics: true, bold: true, size: 17, color: esCorrecta ? '276749' : '9B2C2C' }),
              new TextRun({ text: opt.retroalimentacion, italics: true, size: 17, color: '718096' })
            ]
          })
        );
      }
    });

    // Separador visual suave
    docChildren.push(new Paragraph({ spacing: { after: 150 } }));
  });

  const doc = new Document({
    sections: [
      {
        properties: {
          page: {
            margin: {
              top: 1440, // 1 pulgada (72 pt * 20 = 1440 dxa)
              right: 1440,
              bottom: 1440,
              left: 1440
            }
          }
        },
        children: docChildren
      }
    ]
  });

  return await Packer.toBuffer(doc);
}

/**
 * Generador de Exámenes en Formato PDF
 * @param {Object} examData Datos de la evaluación
 * @param {String} tipoVersion 'ESTUDIANTE' o 'DOCENTE_SOLUCIONARIO'
 * @returns {Promise<Buffer>} Buffer del archivo PDF generado
 */
export async function generatePdf(examData, tipoVersion = 'ESTUDIANTE') {
  return new Promise((resolve, reject) => {
    try {
      const isDocente = tipoVersion === 'DOCENTE_SOLUCIONARIO';
      const asignaturaNombre = examData.asignatura?.nombre || 'Evaluación Académica';
      const asignaturaCodigo = examData.asignatura?.codigo || '';
      const totalPuntos = examData.preguntas?.reduce((acc, p) => acc + (p.puntaje || 0), 0) || 0;

      const doc = new PDFDocument({
        size: 'LETTER',
        margins: { top: 40, bottom: 45, left: 45, right: 45 },
        bufferPages: true
      });

      const buffers = [];
      doc.on('data', chunk => buffers.push(chunk));
      doc.on('end', () => resolve(Buffer.concat(buffers)));
      doc.on('error', err => reject(err));

      // 1. Franja Superior Decorativa
      const bannerColor = isDocente ? '#1A365D' : '#2B6CB0';
      doc.rect(45, 40, 522, 6).fill(bannerColor);
      doc.moveDown(0.8);

      // 2. Encabezado Institucional
      doc.font('Helvetica-Bold')
        .fontSize(14)
        .fillColor(bannerColor)
        .text(isDocente ? 'GUÍA DEL DOCENTE Y SOLUCIONARIO PEDAGÓGICO' : 'INSTITUCIÓN EDUCATIVA - EVALUACIÓN ACADÉMICA', { align: 'center' });

      doc.font('Helvetica-Bold')
        .fontSize(12)
        .fillColor('#2D3748')
        .text(`${asignaturaNombre.toUpperCase()} ${asignaturaCodigo ? `(${asignaturaCodigo})` : ''}`, { align: 'center' });

      doc.font('Helvetica-Oblique')
        .fontSize(10)
        .fillColor('#718096')
        .text(examData.titulo || 'Evaluación de Aprendizaje', { align: 'center' });

      doc.moveDown(0.5);

      // 3. Ficha de Datos
      if (!isDocente) {
        // Recuadro Estudiante
        const yStart = doc.y;
        doc.rect(45, yStart, 522, 60).strokeColor('#CBD5E0').lineWidth(1).stroke();

        doc.font('Helvetica').fontSize(9).fillColor('#1A202C');
        doc.text('Estudiante: ____________________________________________________', 55, yStart + 8);
        doc.text('Fecha: ___________________', 410, yStart + 8);

        doc.text('Documento / ID: __________________________   Grupo: _______________', 55, yStart + 24);
        doc.font('Helvetica-Bold').text(`Calificación: ______ / ${totalPuntos} pts`, 410, yStart + 24);

        doc.font('Helvetica-Oblique').fontSize(8).fillColor('#4A5568');
        doc.text('Instrucciones: Lea atentamente cada enunciado. Marque una única opción de respuesta. Evite tachones.', 55, yStart + 44);

        doc.y = yStart + 70;
      } else {
        // Recuadro Docente
        const yStart = doc.y;
        doc.rect(45, yStart, 522, 28).fillColor('#EDF2F7').fill();
        doc.font('Helvetica-Bold').fontSize(9).fillColor('#2D3748');
        doc.text(`Total de Preguntas: ${examData.preguntas?.length || 0}   |   Puntaje Total: ${totalPuntos} pts   |   Generado con Supervisión Docente`, 55, yStart + 9);
        doc.y = yStart + 38;
      }

      // 4. Preguntas y Opciones
      const letras = ['A', 'B', 'C', 'D', 'E', 'F'];

      examData.preguntas?.forEach((p, idx) => {
        // Control de salto de página inteligente
        if (doc.y > 680) {
          doc.addPage();
        }

        const orden = p.orden || idx + 1;
        const puntaje = p.puntaje || 1;

        doc.font('Helvetica-Bold').fontSize(10).fillColor('#1A202C');
        doc.text(`${orden}. `, { continued: true });
        doc.font('Helvetica-Bold').text(p.enunciado, { continued: true });
        doc.font('Helvetica-Oblique').fontSize(9).fillColor('#718096').text(`  (${puntaje} ${puntaje === 1 ? 'pto' : 'pts'})`);

        if (isDocente) {
          doc.font('Helvetica-Bold').fontSize(8).fillColor('#975A16').text(`   [Nivel Bloom: ${p.nivel_bloom || 'General'}]`);
          if (p.justificacion_pedagogica) {
            doc.font('Helvetica-Oblique').fontSize(8).fillColor('#4A5568').text(`   Justificación: ${p.justificacion_pedagogica}`);
          }
        }

        doc.moveDown(0.3);

        // Opciones
        p.opciones?.forEach((opt, optIdx) => {
          const letra = letras[optIdx] || `${optIdx + 1}`;
          const esCorrecta = Boolean(opt.es_correcta);

          if (!isDocente) {
            doc.font('Helvetica').fontSize(9).fillColor('#2D3748');
            doc.text(`     (   )  ${letra}.  ${opt.texto_opcion}`);
          } else {
            if (esCorrecta) {
              doc.font('Helvetica-Bold').fontSize(9).fillColor('#22543D');
              doc.text(`     [ ✓ ]  ${letra}.  ${opt.texto_opcion}  (CORRECTA)`);
            } else {
              doc.font('Helvetica').fontSize(9).fillColor('#4A5568');
              doc.text(`     [    ]  ${letra}.  ${opt.texto_opcion}`);
            }

            if (opt.retroalimentacion) {
              doc.font('Helvetica-Oblique').fontSize(8).fillColor(esCorrecta ? '#276749' : '#718096');
              doc.text(`            ↳ ${opt.retroalimentacion}`);
            }
          }
          doc.moveDown(0.2);
        });

        doc.moveDown(0.6);
      });

      // 5. Pie de Página con Numeración (Página X de Y)
      const range = doc.bufferedPageRange();
      for (let i = range.start; i < range.start + range.count; i++) {
        doc.switchToPage(i);
        doc.font('Helvetica').fontSize(8).fillColor('#A0AEC0');
        doc.text(
          `Evaluación Académica - Página ${i + 1} de ${range.count}`,
          45,
          745,
          { align: 'center', width: 522 }
        );
      }

      doc.end();
    } catch (err) {
      reject(err);
    }
  });
}
