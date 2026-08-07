/* =========================================================
   MÓDULO DE GENERACIÓN DE PDF
   pdf/pdf.js

   Genera el PDF real de la proforma usando jsPDF + jspdf-autotable
   (cargados vía CDN en index.html). Selecciona una plantilla según
   la empresa activa; hoy todas comparten un mismo layout base con
   los colores de marca del cliente, pero cada plantilla queda
   separada para poder personalizarse de forma independiente en
   el futuro (logos con posiciones distintas, textos legales por
   cliente, etc.) sin tocar las demás.
   ========================================================= */

/* =========================================================
   1. UTILIDADES DE COLOR / IMAGEN
   ========================================================= */

/**
 * Convierte un color hexadecimal (#RRGGBB) a un array [r,g,b]
 * que jsPDF puede usar directamente en setFillColor/setTextColor.
 * @param {string} hex
 * @returns {[number, number, number]}
 */
function hexARgb(hex) {
  const limpio = hex.replace("#", "");
  const bigint = parseInt(limpio, 16);
  return [(bigint >> 16) & 255, (bigint >> 8) & 255, bigint & 255];
}

/**
 * Carga una imagen desde una ruta (por ejemplo "logos/kfc.png") y la
 * convierte a un dataURL PNG mediante un canvas, para poder
 * incrustarla en el PDF. Es asíncrona porque la imagen se carga de
 * cero (no depende de que ya esté pintada en el DOM), por lo que
 * el resultado es correcto incluso al reimprimir una proforma del
 * historial para una empresa distinta a la que está abierta en el
 * formulario. Si la imagen no existe o el navegador bloquea el
 * canvas, se resuelve con null y el PDF se genera igual, sin esa
 * imagen.
 * @param {string} ruta
 * @returns {Promise<string|null>}
 */
function imagenADataURL(ruta) {
  return new Promise((resolve) => {
    if (!ruta) {
      resolve(null);
      return;
    }

    const img = new Image();

    img.onload = () => {
      try {
        const canvas = document.createElement("canvas");
        canvas.width = img.naturalWidth;
        canvas.height = img.naturalHeight;

        const contexto = canvas.getContext("2d");
        contexto.drawImage(img, 0, 0);

        resolve(canvas.toDataURL("image/png"));
      } catch (error) {
        console.warn("No se pudo incrustar la imagen '" + ruta + "' en el PDF (se omitirá):", error);
        resolve(null);
      }
    };

    img.onerror = () => {
      console.warn("No se pudo cargar la imagen '" + ruta + "' para el PDF (se omitirá).");
      resolve(null);
    };

    img.src = ruta;
  });
}

/* =========================================================
   2. RECOPILACIÓN DE DATOS
   ========================================================= */

/**
 * Recopila del DOM y del estado global toda la información
 * necesaria para construir el PDF de la proforma actualmente
 * abierta en el formulario.
 * @returns {object} datosProforma
 */
function recopilarDatosProforma() {
  const empresa = empresas[estado.empresaActual];
  const subtotal = estado.recorridos.reduce((acumulado, recorrido) => acumulado + recorrido.costo, 0);

  return {
    empresa: {
      clave: estado.empresaActual,
      nombre: empresa.nombre,
      logo: empresa.logo,
      colorPrincipal: empresa.colorPrincipal,
      colorSecundario: empresa.colorSecundario
    },
    nombreTransportista: estado.configuracion.nombreTransportista,
    datosGenerales: {
      fecha: dom.inputFecha.value,
      numeroProforma: dom.inputNumeroProforma.value.trim(),
      sucursal: dom.inputSucursal.value.trim(),
      observaciones: dom.inputObservaciones.value.trim()
    },
    recorridos: estado.recorridos.map((recorrido) => ({
      hora: recorrido.hora,
      personas: recorrido.personas,
      vueltas: recorrido.vueltas,
      costo: recorrido.costo
    })),
    subtotal: subtotal,
    total: subtotal
  };
}

/**
 * Convierte una proforma ya guardada en el historial al mismo
 * formato de datos que usa recopilarDatosProforma(), para poder
 * reutilizar exactamente el mismo generador de PDF.
 * @param {object} proformaGuardada
 * @returns {object} datosProforma
 */
function adaptarProformaGuardada(proformaGuardada) {
  const empresa = empresas[proformaGuardada.empresaClave];

  return {
    empresa: {
      clave: proformaGuardada.empresaClave,
      nombre: proformaGuardada.empresaNombre,
      logo: empresa ? empresa.logo : "logos/generica.png",
      colorPrincipal: empresa ? empresa.colorPrincipal : "#64646E",
      colorSecundario: empresa ? empresa.colorSecundario : "#18181B"
    },
    nombreTransportista: estado.configuracion.nombreTransportista,
    datosGenerales: {
      fecha: proformaGuardada.fecha,
      numeroProforma: proformaGuardada.numeroProforma,
      sucursal: proformaGuardada.sucursal,
      observaciones: proformaGuardada.observaciones
    },
    recorridos: proformaGuardada.recorridos,
    subtotal: proformaGuardada.subtotal,
    total: proformaGuardada.total
  };
}

/* =========================================================
   3. PUNTOS DE ENTRADA
   ========================================================= */

/**
 * Genera el PDF de la proforma actualmente abierta en el formulario.
 * Valida que existan datos mínimos, arma el objeto de datos y
 * despacha a la plantilla correspondiente según la empresa activa.
 */
function generarPDF() {
  const datos = recopilarDatosProforma();

  if (datos.recorridos.length === 0) {
    mostrarToast("Agrega al menos un recorrido antes de generar el PDF", "danger");
    return;
  }

  if (!datos.datosGenerales.numeroProforma) {
    dom.inputNumeroProforma.value = sugerirNumeroProforma();
    datos.datosGenerales.numeroProforma = dom.inputNumeroProforma.value;
  }

  despacharPlantilla(datos);
}

/**
 * Genera el PDF de una proforma ya guardada en el historial,
 * sin necesidad de cargarla primero en el formulario.
 * @param {string} id
 */
function generarPDFDesdeHistorial(id) {
  const proformaGuardada = estado.historial.find((p) => p.id === id);
  if (!proformaGuardada) return;

  const datos = adaptarProformaGuardada(proformaGuardada);
  despacharPlantilla(datos);
}

/**
 * Selecciona la plantilla de PDF correspondiente según la empresa
 * y la ejecuta. Todas las plantillas comparten la función base
 * construirDocumentoPDF(), pero quedan separadas por empresa para
 * poder personalizarse de forma independiente más adelante.
 * @param {object} datos
 */
function despacharPlantilla(datos) {
  switch (datos.empresa.clave) {
    case "mcdonalds":
      plantillaPDF_mcdonalds(datos);
      break;
    case "kfc":
      plantillaPDF_kfc(datos);
      break;
    case "subway":
      plantillaPDF_subway(datos);
      break;
    case "pizzahut":
      plantillaPDF_pizzahut(datos);
      break;
    default:
      plantillaPDF_generica(datos);
      break;
  }
}

/* =========================================================
   4. PLANTILLAS POR EMPRESA
   Cada plantilla recibe el objeto "datos" completo y hoy delega
   en el mismo layout base (construirDocumentoPDF), aplicando los
   colores propios de cada cliente. Este es el punto exacto donde
   personalizar el diseño particular de cada empresa a futuro.
   ========================================================= */

function plantillaPDF_mcdonalds(datos) {
  construirDocumentoPDF(datos);
}

function plantillaPDF_kfc(datos) {
  construirDocumentoPDF(datos);
}

function plantillaPDF_subway(datos) {
  construirDocumentoPDF(datos);
}

function plantillaPDF_pizzahut(datos) {
  construirDocumentoPDF(datos);
}

function plantillaPDF_generica(datos) {
  construirDocumentoPDF(datos);
}

/* =========================================================
   5. LAYOUT BASE DEL DOCUMENTO
   ========================================================= */

/**
 * Construye el documento PDF final con jsPDF + autoTable y
 * dispara la descarga en el navegador. Es asíncrona porque primero
 * carga los logos (transportista y cliente) desde sus archivos.
 * @param {object} datos
 */
async function construirDocumentoPDF(datos) {
  mostrarToast("Generando PDF...", "neutral");

  const [logoTransportistaURL, logoClienteURL] = await Promise.all([
    imagenADataURL("logos/empresa.png"),
    imagenADataURL(datos.empresa.logo)
  ]);

  const { jsPDF } = window.jspdf;
  const doc = new jsPDF({ unit: "mm", format: "a4" });

  const anchoPagina = doc.internal.pageSize.getWidth();
  const margen = 14;
  const [r, g, b] = hexARgb(datos.empresa.colorPrincipal);

  // ---------- Encabezado de color ----------
  doc.setFillColor(r, g, b);
  doc.rect(0, 0, anchoPagina, 30, "F");

  // Logo de la transportista
  if (logoTransportistaURL) {
    try { doc.addImage(logoTransportistaURL, "PNG", margen, 7, 16, 16); } catch (e) { /* se omite si falla */ }
  }

  doc.setTextColor(255, 255, 255);
  doc.setFont("helvetica", "bold");
  doc.setFontSize(13);
  doc.text(datos.nombreTransportista, logoTransportistaURL ? margen + 20 : margen, 14);
  doc.setFont("helvetica", "normal");
  doc.setFontSize(9);
  doc.text("Transporte de Personal", logoTransportistaURL ? margen + 20 : margen, 20);

  // Logo del cliente (empresa) arriba a la derecha
  if (logoClienteURL) {
    try { doc.addImage(logoClienteURL, "PNG", anchoPagina - margen - 16, 6, 18, 18); } catch (e) { /* se omite si falla */ }
  }

  // ---------- Título ----------
  let y = 42;
  doc.setTextColor(r, g, b);
  doc.setFont("helvetica", "bold");
  doc.setFontSize(18);
  doc.text(datos.empresa.nombre, margen, y);

  doc.setTextColor(110, 110, 120);
  doc.setFont("helvetica", "normal");
  doc.setFontSize(10.5);
  y += 6;
  doc.text("Proforma de Servicio de Transporte", margen, y);

  // ---------- Metadatos (fecha / número / sucursal) ----------
  y += 10;
  const anchoColumna = (anchoPagina - margen * 2) / 3;
  const metadatos = [
    ["Fecha", formatearFecha(datos.datosGenerales.fecha)],
    ["N° Proforma", datos.datosGenerales.numeroProforma || "—"],
    ["Sucursal", datos.datosGenerales.sucursal || "—"]
  ];

  metadatos.forEach((par, indice) => {
    const x = margen + indice * anchoColumna;
    doc.setFillColor(247, 247, 248);
    doc.roundedRect(x, y, anchoColumna - 4, 16, 2, 2, "F");

    doc.setTextColor(160, 160, 168);
    doc.setFontSize(8);
    doc.setFont("helvetica", "bold");
    doc.text(par[0].toUpperCase(), x + 4, y + 6);

    doc.setTextColor(30, 30, 34);
    doc.setFontSize(10.5);
    doc.setFont("helvetica", "normal");
    doc.text(String(par[1]), x + 4, y + 12);
  });

  // ---------- Tabla de recorridos ----------
  y += 24;

  const filasTabla = datos.recorridos.map((recorrido) => [
    formatearHora(recorrido.hora),
    String(recorrido.personas),
    String(recorrido.vueltas),
    formatearMoneda(recorrido.costo)
  ]);

  doc.autoTable({
    startY: y,
    head: [["Hora", "Personas", "Vueltas", "Costo"]],
    body: filasTabla,
    margin: { left: margen, right: margen },
    styles: { font: "helvetica", fontSize: 9.5, cellPadding: 4, textColor: [40, 40, 46] },
    headStyles: { fillColor: [r, g, b], textColor: [255, 255, 255], fontStyle: "bold" },
    alternateRowStyles: { fillColor: [250, 250, 251] }
  });

  let yDespuesTabla = doc.lastAutoTable.finalY + 8;

  // ---------- Total ----------
  const anchoCajaTotal = 70;
  doc.setFillColor(247, 247, 248);
  doc.roundedRect(anchoPagina - margen - anchoCajaTotal, yDespuesTabla, anchoCajaTotal, 14, 2, 2, "F");

  doc.setTextColor(90, 90, 98);
  doc.setFontSize(10);
  doc.setFont("helvetica", "bold");
  doc.text("TOTAL", anchoPagina - margen - anchoCajaTotal + 6, yDespuesTabla + 9);

  doc.setTextColor(r, g, b);
  doc.setFontSize(13);
  doc.text(formatearMoneda(datos.total), anchoPagina - margen - 6, yDespuesTabla + 9, { align: "right" });

  yDespuesTabla += 24;

  // ---------- Observaciones ----------
  if (datos.datosGenerales.observaciones) {
    doc.setTextColor(160, 160, 168);
    doc.setFontSize(8);
    doc.setFont("helvetica", "bold");
    doc.text("OBSERVACIONES", margen, yDespuesTabla);

    doc.setTextColor(70, 70, 78);
    doc.setFontSize(9.5);
    doc.setFont("helvetica", "normal");
    const lineasObservaciones = doc.splitTextToSize(datos.datosGenerales.observaciones, anchoPagina - margen * 2);
    doc.text(lineasObservaciones, margen, yDespuesTabla + 6);
  }

  // ---------- Pie de página ----------
  const altoPagina = doc.internal.pageSize.getHeight();
  doc.setTextColor(180, 180, 186);
  doc.setFontSize(8);
  doc.text(
    `Generado el ${new Date().toLocaleDateString("es-ES")} · ${datos.nombreTransportista}`,
    margen,
    altoPagina - 10
  );

  const nombreArchivo = `Proforma_${datos.datosGenerales.numeroProforma || "sin-numero"}_${datos.empresa.nombre.replace(/\s+/g, "-")}.pdf`;
  doc.save(nombreArchivo);
}