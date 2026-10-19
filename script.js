/* =========================================================
   SISTEMA DE PROFORMAS - TRANSPORTE DE PERSONAL
   script.js
   ========================================================= */

/* =========================================================
   1. DATOS DE EMPRESAS (valores base / de fábrica)
   "empresas" es global y mutable: se personaliza, guarda y
   sincroniza (localStorage + Firebase) desde Configuración.
   ========================================================= */
const EMPRESAS_BASE = {
  mcdonalds: { nombre: "McDonald's", logo: "logos/mcdonalds.png", colorPrincipal: "#DA291C", colorSecundario: "#FFC72C", precioBase: 35, precioVueltaAdicional: 20, moneda: "USD" },
  kfc: { nombre: "KFC", logo: "logos/kfc.png", colorPrincipal: "#C8102E", colorSecundario: "#FFFFFF", precioBase: 35, precioVueltaAdicional: 20, moneda: "USD" },
  subway: { nombre: "Subway", logo: "logos/subway.png", colorPrincipal: "#006E44", colorSecundario: "#FFC72C", precioBase: 35, precioVueltaAdicional: 20, moneda: "USD" },
  pizzahut: { nombre: "Pizza Hut", logo: "logos/pizzahut.png", colorPrincipal: "#D3121A", colorSecundario: "#1E1E1E", precioBase: 40, precioVueltaAdicional: 20, moneda: "USD" },
  otra: { nombre: "Otra Empresa", logo: "logos/generica.png", colorPrincipal: "#64646E", colorSecundario: "#18181B", precioBase: 35, precioVueltaAdicional: 20, moneda: "USD" }
};

let empresas = JSON.parse(JSON.stringify(EMPRESAS_BASE));

const SIMBOLOS_MONEDA = { USD: "$", NIO: "C$", MXN: "$", EUR: "€", HNL: "L" };

/* =========================================================
   2. ALMACENAMIENTO PERSISTENTE (localStorage)
   ========================================================= */
const CLAVE_HISTORIAL = "transroute_historial";
const CLAVE_CONFIGURACION = "transroute_configuracion";
const CLAVE_EMPRESAS = "transroute_empresas";

/* =========================================================
   3. ESTADO GLOBAL DE LA APLICACIÓN
   ========================================================= */
const estado = {
  empresaActual: "mcdonalds",
  recorridos: [],            // { id, hora, personas, vueltas, costo }
  idEdicionActual: null,     // id del recorrido en edición (null = ninguno)
  contadorId: 1,
  vistaActual: "nueva",      // "nueva" | "historial" | "configuracion"
  proformaIdEnEdicion: null, // id de la proforma del historial que se está sobrescribiendo (null = nueva)
  historial: [],             // proformas guardadas
  filtroHistorial: {         // filtros de la vista Historial
    busqueda: "",
    empresa: "",
    orden: "recientes"
  },
  configuracion: {
    precioDefecto: 35,
    precioVueltaAdicionalDefecto: 20,
    monedaDefecto: "USD",
    nombreTransportista: "TransRoute S.A.",
    telefonoTransportista: "",
    emailTransportista: "",
    direccionTransportista: "",
    condicionesPago: "",
    validezOfertaDias: 15,
    idioma: "es",
    tema: "claro",           // "claro" | "oscuro" | "auto"
    colorAcento: "#6366f1",
    densidad: "comoda",      // "comoda" | "compacta"
    sincronizacionNube: true
  }
};
window.estado = estado; // usado por i18n.js para saber el idioma activo

let firebaseListo = false;
let appIniciada = false;
let sincronizandoDesdeNube = false;

window.addEventListener("firebase-listo", () => {
  firebaseListo = true;
  if (appIniciada) conectarFirebase();
});

/* =========================================================
   4. REFERENCIAS AL DOM
   ========================================================= */
const dom = {
  selectEmpresa: document.getElementById("selectEmpresa"),
  empresaLogoPreview: document.getElementById("empresaLogoPreview"),
  empresaNombrePreview: document.getElementById("empresaNombrePreview"),
  empresaPreview: document.getElementById("empresaPreview"),

  inputFecha: document.getElementById("inputFecha"),
  inputNumeroProforma: document.getElementById("inputNumeroProforma"),
  inputSucursal: document.getElementById("inputSucursal"),
  inputObservaciones: document.getElementById("inputObservaciones"),
  inputPrecioVuelta: document.getElementById("inputPrecioVuelta"),
  inputPrecioAdicional: document.getElementById("inputPrecioAdicional"),
  inputDescuento: document.getElementById("inputDescuento"),
  inputImpuesto: document.getElementById("inputImpuesto"),

  inputHoraSalida: document.getElementById("inputHoraSalida"),
  inputPersonas: document.getElementById("inputPersonas"),
  inputVueltas: document.getElementById("inputVueltas"),
  btnAgregarRecorrido: document.getElementById("btnAgregarRecorrido"),

  tablaRecorridosBody: document.getElementById("tablaRecorridosBody"),
  filaVacia: document.getElementById("filaVacia"),
  badgeCantidadRecorridos: document.getElementById("badgeCantidadRecorridos"),

  subtotalValor: document.getElementById("subtotalValor"),
  filaDescuentoTotales: document.getElementById("filaDescuentoTotales"),
  descuentoValor: document.getElementById("descuentoValor"),
  filaImpuestoTotales: document.getElementById("filaImpuestoTotales"),
  impuestoValor: document.getElementById("impuestoValor"),
  totalValor: document.getElementById("totalValor"),

  templateFilaEdicion: document.getElementById("templateFilaEdicion"),
  templateEmpresaCard: document.getElementById("templateEmpresaCard"),

  btnGenerarPDF: document.getElementById("btnGenerarPDF"),
  btnGuardarProforma: document.getElementById("btnGuardarProforma"),
  btnNuevaProforma: document.getElementById("btnNuevaProforma"),

  // Navegación / vistas
  navItems: document.querySelectorAll(".nav-item[data-vista]"),
  tituloVista: document.getElementById("tituloVista"),
  subtituloVista: document.getElementById("subtituloVista"),
  accionesNuevaProforma: document.getElementById("accionesNuevaProforma"),
  vistaNueva: document.getElementById("vistaNueva"),
  vistaHistorial: document.getElementById("vistaHistorial"),
  vistaConfiguracion: document.getElementById("vistaConfiguracion"),
  navBadgeHistorial: document.getElementById("navBadgeHistorial"),

  // Historial
  tablaHistorialBody: document.getElementById("tablaHistorialBody"),
  badgeHistorialTotal: document.getElementById("badgeHistorialTotal"),

  // Configuración — apariencia
  segmentoTema: document.getElementById("segmentoTema"),
  segmentoDensidad: document.getElementById("segmentoDensidad"),
  inputColorAcento: document.getElementById("inputColorAcento"),
  valorColorAcento: document.getElementById("valorColorAcento"),

  // Configuración — idioma
  selectIdioma: document.getElementById("selectIdioma"),

  // Configuración — precios y empresas
  selectMonedaDefecto: document.getElementById("selectMonedaDefecto"),
  inputPrecioDefecto: document.getElementById("inputPrecioDefecto"),
  inputPrecioAdicionalDefecto: document.getElementById("inputPrecioAdicionalDefecto"),
  listaEmpresasConfig: document.getElementById("listaEmpresasConfig"),
  btnMostrarFormEmpresa: document.getElementById("btnMostrarFormEmpresa"),
  formNuevaEmpresa: document.getElementById("formNuevaEmpresa"),
  nuevaEmpresaNombre: document.getElementById("nuevaEmpresaNombre"),
  nuevaEmpresaLogo: document.getElementById("nuevaEmpresaLogo"),
  nuevaEmpresaMoneda: document.getElementById("nuevaEmpresaMoneda"),
  nuevaEmpresaColorPrincipal: document.getElementById("nuevaEmpresaColorPrincipal"),
  nuevaEmpresaColorSecundario: document.getElementById("nuevaEmpresaColorSecundario"),
  nuevaEmpresaPrecioBase: document.getElementById("nuevaEmpresaPrecioBase"),
  nuevaEmpresaPrecioAdicional: document.getElementById("nuevaEmpresaPrecioAdicional"),
  btnGuardarNuevaEmpresa: document.getElementById("btnGuardarNuevaEmpresa"),

  // Configuración — transportista
  inputNombreTransportista: document.getElementById("inputNombreTransportista"),
  btnVaciarHistorial: document.getElementById("btnVaciarHistorial"),

  // Configuración — nube
  checkNube: document.getElementById("checkNube"),
  badgeEstadoNube: document.getElementById("badgeEstadoNube"),
  pildoraNube: document.getElementById("pildoraNube"),
  puntoNube: document.getElementById("puntoNube"),
  textoNube: document.getElementById("textoNube"),

  toast: document.getElementById("toast"),

  // Vista previa
  previewDocHeader: document.getElementById("previewDocHeader"),
  previewLogoCliente: document.getElementById("previewLogoCliente"),
  previewEmpresaNombre: document.getElementById("previewEmpresaNombre"),
  previewFecha: document.getElementById("previewFecha"),
  previewNumero: document.getElementById("previewNumero"),
  previewSucursal: document.getElementById("previewSucursal"),
  previewTablaBody: document.getElementById("previewTablaBody"),
  previewTotal: document.getElementById("previewTotal"),
  previewObservaciones: document.getElementById("previewObservaciones"),
  previewLogoEmpresa: document.getElementById("previewLogoEmpresa"),
  previewNombreTransportista: document.getElementById("previewNombreTransportista"),
  brandLogoMaster: document.getElementById("brandLogoMaster"),

  // Historial — toolbar
  inputBuscarHistorial: document.getElementById("inputBuscarHistorial"),
  filtroEmpresaHistorial: document.getElementById("filtroEmpresaHistorial"),
  ordenHistorial: document.getElementById("ordenHistorial"),
  btnExportarCSV: document.getElementById("btnExportarCSV"),

  // Reportes
  vistaReportes: document.getElementById("vistaReportes"),
  statTotalMes: document.getElementById("statTotalMes"),
  statProformasMes: document.getElementById("statProformasMes"),
  statInfoMes: document.getElementById("statInfoMes"),
  statInfoProformas: document.getElementById("statInfoProformas"),
  statInfoPromedio: document.getElementById("statInfoPromedio"),
  statPromedio: document.getElementById("statPromedio"),
  statTotalHistorico: document.getElementById("statTotalHistorico"),
  statInfoHistorico: document.getElementById("statInfoHistorico"),
  graficaMeses: document.getElementById("graficaMeses"),
  graficaEmpresas: document.getElementById("graficaEmpresas"),
  btnExportarCSVReportes: document.getElementById("btnExportarCSVReportes"),

  // Configuración — transportista (datos ampliados)
  inputTelefonoTransportista: document.getElementById("inputTelefonoTransportista"),
  inputEmailTransportista: document.getElementById("inputEmailTransportista"),
  inputDireccionTransportista: document.getElementById("inputDireccionTransportista"),
  inputCondicionesTransportista: document.getElementById("inputCondicionesTransportista"),
  inputValidezTransportista: document.getElementById("inputValidezTransportista"),

  // Número de proforma sugerido
  btnSugerirNumero: document.getElementById("btnSugerirNumero"),

  // Modal de confirmación
  modalOverlay: document.getElementById("modalOverlay"),
  modalMensaje: document.getElementById("modalMensaje"),
  btnModalCancelar: document.getElementById("btnModalCancelar"),
  btnModalConfirmar: document.getElementById("btnModalConfirmar")
};

/* =========================================================
   5. UTILIDADES
   ========================================================= */

/**
 * Formatea un número como moneda, según el código de moneda dado
 * (o la moneda por defecto configurada si no se especifica).
 * @param {number} valor
 * @param {string} [moneda]
 * @returns {string}
 */
function formatearMoneda(valor, moneda) {
  const codigo = moneda || (estado.configuracion && estado.configuracion.monedaDefecto) || "USD";
  const simbolo = SIMBOLOS_MONEDA[codigo] || "$";
  return simbolo + Number(valor || 0).toFixed(2);
}

/**
 * Formatea una hora en formato 24h (HH:MM) a un formato de 12h legible.
 * @param {string} hora24 - Ej: "14:30"
 * @returns {string} Ej: "2:30 PM"
 */
function formatearHora(hora24) {
  if (!hora24) return "--:--";
  const [horaStr, minutoStr] = hora24.split(":");
  let hora = parseInt(horaStr, 10);
  const minuto = minutoStr;
  const sufijo = hora >= 12 ? "PM" : "AM";
  hora = hora % 12;
  if (hora === 0) hora = 12;
  return `${hora}:${minuto} ${sufijo}`;
}

/**
 * Formatea una fecha ISO (YYYY-MM-DD) a formato legible en español o inglés.
 * @param {string} fechaISO
 * @returns {string}
 */
function formatearFecha(fechaISO) {
  if (!fechaISO) return "—";
  const [anio, mes, dia] = fechaISO.split("-");
  const mesesEs = ["Enero", "Febrero", "Marzo", "Abril", "Mayo", "Junio", "Julio", "Agosto", "Septiembre", "Octubre", "Noviembre", "Diciembre"];
  const mesesEn = ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"];
  const idioma = estado.configuracion.idioma === "en" ? "en" : "es";
  const meses = idioma === "en" ? mesesEn : mesesEs;

  if (idioma === "en") {
    return `${meses[parseInt(mes, 10) - 1]} ${parseInt(dia, 10)}, ${anio}`;
  }
  return `${parseInt(dia, 10)} de ${meses[parseInt(mes, 10) - 1]}, ${anio}`;
}

/**
 * Devuelve el objeto de la empresa actualmente seleccionada,
 * con una empresa "otra" de respaldo si algo faltara.
 * @returns {object}
 */
function empresaActiva() {
  return empresas[estado.empresaActual] || empresas.otra || Object.values(empresas)[0];
}

/**
 * Escapa caracteres HTML peligrosos en un texto para poder
 * inyectarlo de forma segura dentro de innerHTML.
 * @param {*} texto
 * @returns {string}
 */
function escaparHTML(texto) {
  return String(texto == null ? "" : texto).replace(/[&<>"']/g, (caracter) => ({
    "&": "&amp;",
    "<": "&lt;",
    ">": "&gt;",
    '"': "&quot;",
    "'": "&#39;"
  })[caracter]);
}

/**
 * Devuelve una versión de la función que solo se ejecuta una vez
 * que han pasado "espera" ms sin nuevas llamadas (útil para el
 * autoguardado y campos que cambian con frecuencia).
 * @param {Function} funcion
 * @param {number} espera
 * @returns {Function}
 */
function debounce(funcion, espera) {
  let temporizador = null;
  return function (...argumentos) {
    clearTimeout(temporizador);
    temporizador = setTimeout(() => funcion.apply(this, argumentos), espera);
  };
}

/**
 * Marca visualmente un campo como inválido (borde rojo) y lo avisa
 * con un toast, sustituyendo los alert() nativos.
 * @param {HTMLElement} input
 * @param {string} mensaje
 */
function marcarInputInvalido(input, mensaje) {
  if (!input) return;
  input.classList.add("input-error");
  input.focus();
  setTimeout(() => input.classList.remove("input-error"), 1800);
  mostrarToast(mensaje, "danger");
}

/* =========================================================
   MODAL DE CONFIRMACIÓN (reemplaza a confirm())
   ========================================================= */
let callbackModalPendiente = null;

function mostrarConfirmacion(mensaje, alConfirmar) {
  if (!dom.modalOverlay) {
    // Respaldo por si el modal no está en el DOM
    if (confirm(mensaje)) alConfirmar();
    return;
  }

  callbackModalPendiente = alConfirmar;
  dom.modalMensaje.textContent = mensaje;
  dom.modalOverlay.hidden = false;
}

function cerrarModal() {
  if (!dom.modalOverlay) return;
  dom.modalOverlay.hidden = true;
  callbackModalPendiente = null;
}

function confirmarModal() {
  const alConfirmar = callbackModalPendiente;
  cerrarModal();
  if (alConfirmar) alConfirmar();
}

/* =========================================================
   6. LÓGICA DE NEGOCIO - CÁLCULO DE COSTOS
   ========================================================= */

/**
 * Calcula el costo de un recorrido según las reglas de negocio.
 *  - Si vueltas == 1  -> costo = precioBase (configurable por empresa)
 *  - Si vueltas >= 2  -> costo = vueltas * precioVueltaAdicional
 * La cantidad de personas NO afecta el costo. Válido para 1-14 personas.
 * @param {number} vueltas
 * @param {number} precioBase
 * @param {number} precioVueltaAdicional
 * @returns {number}
 */
function calcularCosto(vueltas, precioBase, precioVueltaAdicional) {
  const numVueltas = Number(vueltas);

  if (numVueltas <= 1) {
    return precioBase;
  }

  return numVueltas * precioVueltaAdicional;
}

/**
 * Calcula subtotal, descuento, impuesto y total a partir de los
 * recorridos actuales y los porcentajes de descuento/impuesto
 * indicados en el formulario.
 * @returns {{subtotal:number, descuento:number, impuesto:number, total:number}}
 */
function calcularTotales() {
  const subtotal = estado.recorridos.reduce((acumulado, recorrido) => acumulado + recorrido.costo, 0);
  const porcentajeDescuento = parseFloat(dom.inputDescuento.value) || 0;
  const porcentajeImpuesto = parseFloat(dom.inputImpuesto.value) || 0;

  const descuento = subtotal * (porcentajeDescuento / 100);
  const baseConDescuento = subtotal - descuento;
  const impuesto = baseConDescuento * (porcentajeImpuesto / 100);
  const total = baseConDescuento + impuesto;

  return { subtotal, descuento, impuesto, total };
}

/* =========================================================
   7. CAMBIO DE EMPRESA
   ========================================================= */

/**
 * Actualiza toda la interfaz (logo, nombre, colores, precios) según
 * la empresa seleccionada en el formulario.
 */
function cambiarEmpresa() {
  const claveEmpresa = dom.selectEmpresa.value;
  const empresa = empresas[claveEmpresa];

  if (!empresa) return;

  estado.empresaActual = claveEmpresa;

  // Actualizar chip del selector
  dom.empresaLogoPreview.src = empresa.logo;
  dom.empresaLogoPreview.alt = "Logo " + empresa.nombre;
  dom.empresaNombrePreview.textContent = empresa.nombre;

  const tagMoneda = dom.empresaPreview.querySelector(".empresa-preview-moneda") || (() => {
    const span = document.createElement("span");
    span.className = "empresa-preview-moneda";
    dom.empresaPreview.querySelector("div").appendChild(span);
    return span;
  })();
  tagMoneda.textContent = `${t("empresa_preview_tag")} · ${empresa.moneda || estado.configuracion.monedaDefecto}`;

  // Precargar precios propios de la empresa (personalización por cliente)
  dom.inputPrecioVuelta.value = empresa.precioBase;
  dom.inputPrecioAdicional.value = empresa.precioVueltaAdicional;

  // Actualizar colores dinámicos vía variables CSS
  document.documentElement.style.setProperty("--empresa-primary", empresa.colorPrincipal);
  document.documentElement.style.setProperty("--empresa-secondary", empresa.colorSecundario);

  recalcularTodosLosCostos();
  actualizarVistaPrevia();
}

/**
 * Reconstruye las <option> del selector de empresa a partir del
 * objeto "empresas" (útil tras agregar/eliminar/editar empresas).
 */
function renderizarSelectEmpresa() {
  const valorPrevio = dom.selectEmpresa.value;
  dom.selectEmpresa.innerHTML = "";

  Object.keys(empresas).forEach((clave) => {
    const opcion = document.createElement("option");
    opcion.value = clave;
    opcion.textContent = clave === "otra" ? t("opt_otra") : empresas[clave].nombre;
    dom.selectEmpresa.appendChild(opcion);
  });

  if (empresas[valorPrevio]) {
    dom.selectEmpresa.value = valorPrevio;
  }
}

/* =========================================================
   8. GESTIÓN DE RECORRIDOS (CRUD EN MEMORIA)
   ========================================================= */

function validarDatosRecorrido(hora, personas, vueltas) {
  if (!hora) return { input: dom.inputHoraSalida, mensaje: t("err_hora") };
  if (!personas || personas < 1 || personas > 14) return { input: dom.inputPersonas, mensaje: t("err_personas") };
  if (!vueltas || vueltas < 1) return { input: dom.inputVueltas, mensaje: t("err_vueltas") };
  return null;
}

function agregarRecorrido() {
  const hora = dom.inputHoraSalida.value;
  const personas = parseInt(dom.inputPersonas.value, 10);
  const vueltas = parseInt(dom.inputVueltas.value, 10);

  const error = validarDatosRecorrido(hora, personas, vueltas);
  if (error) {
    marcarInputInvalido(error.input, error.mensaje);
    return;
  }

  const precioBase = parseFloat(dom.inputPrecioVuelta.value) || 0;
  const precioAdicional = parseFloat(dom.inputPrecioAdicional.value) || 0;
  const costo = calcularCosto(vueltas, precioBase, precioAdicional);

  const nuevoRecorrido = {
    id: estado.contadorId++,
    hora: hora,
    personas: personas,
    vueltas: vueltas,
    costo: costo
  };

  estado.recorridos.push(nuevoRecorrido);

  // Limpiar formulario de recorrido para el siguiente ingreso
  dom.inputHoraSalida.value = "";
  dom.inputPersonas.value = 1;
  dom.inputVueltas.value = 1;
  dom.inputHoraSalida.focus();

  actualizarTabla();
  actualizarTotal();
  actualizarVistaPrevia();
  guardarBorrador();
}

function duplicarRecorrido(id) {
  const original = estado.recorridos.find((recorrido) => recorrido.id === id);
  if (!original) return;

  const copia = { ...original, id: estado.contadorId++ };
  const indice = estado.recorridos.indexOf(original);
  estado.recorridos.splice(indice + 1, 0, copia);

  actualizarTabla();
  actualizarTotal();
  actualizarVistaPrevia();
  guardarBorrador();
  mostrarToast(t("toast_recorrido_duplicado"), "success");
}

function eliminarRecorrido(id) {
  estado.recorridos = estado.recorridos.filter((recorrido) => recorrido.id !== id);

  if (estado.idEdicionActual === id) {
    estado.idEdicionActual = null;
  }

  actualizarTabla();
  actualizarTotal();
  actualizarVistaPrevia();
  guardarBorrador();
}

function editarRecorrido(id) {
  estado.idEdicionActual = id;
  actualizarTabla();
}

function guardarEdicionRecorrido(id) {
  const fila = dom.tablaRecorridosBody.querySelector(`tr[data-id="${id}"]`);
  if (!fila) return;

  const nuevaHora = fila.querySelector(".edit-hora").value;
  const nuevasPersonas = parseInt(fila.querySelector(".edit-personas").value, 10);
  const nuevasVueltas = parseInt(fila.querySelector(".edit-vueltas").value, 10);

  if (!nuevaHora) {
    marcarInputInvalido(fila.querySelector(".edit-hora"), t("err_hora"));
    return;
  }

  if (!nuevasPersonas || nuevasPersonas < 1 || nuevasPersonas > 14) {
    marcarInputInvalido(fila.querySelector(".edit-personas"), t("err_personas"));
    return;
  }

  if (!nuevasVueltas || nuevasVueltas < 1) {
    marcarInputInvalido(fila.querySelector(".edit-vueltas"), t("err_vueltas"));
    return;
  }

  const recorrido = estado.recorridos.find((r) => r.id === id);
  if (!recorrido) return;

  const precioBase = parseFloat(dom.inputPrecioVuelta.value) || 0;
  const precioAdicional = parseFloat(dom.inputPrecioAdicional.value) || 0;

  recorrido.hora = nuevaHora;
  recorrido.personas = nuevasPersonas;
  recorrido.vueltas = nuevasVueltas;
  recorrido.costo = calcularCosto(nuevasVueltas, precioBase, precioAdicional);

  estado.idEdicionActual = null;

  actualizarTabla();
  actualizarTotal();
  actualizarVistaPrevia();
  guardarBorrador();
}

function cancelarEdicionRecorrido() {
  estado.idEdicionActual = null;
  actualizarTabla();
}

/**
 * Recalcula el costo de todos los recorridos existentes cuando cambia
 * el precio base o el precio por vuelta adicional (propios o de la
 * empresa seleccionada), manteniendo consistencia.
 */
function recalcularTodosLosCostos() {
  const precioBase = parseFloat(dom.inputPrecioVuelta.value) || 0;
  const precioAdicional = parseFloat(dom.inputPrecioAdicional.value) || 0;

  estado.recorridos.forEach((recorrido) => {
    recorrido.costo = calcularCosto(recorrido.vueltas, precioBase, precioAdicional);
  });

  actualizarTabla();
  actualizarTotal();
  actualizarVistaPrevia();
}

/* =========================================================
   9. RENDERIZADO DE TABLA
   ========================================================= */

function actualizarTabla() {
  dom.tablaRecorridosBody.innerHTML = "";

  if (estado.recorridos.length === 0) {
    const filaVacia = document.createElement("tr");
    filaVacia.className = "empty-row";
    filaVacia.innerHTML = `<td colspan="5">${t("empty_recorridos")}</td>`;
    dom.tablaRecorridosBody.appendChild(filaVacia);
    dom.badgeCantidadRecorridos.textContent = "0";
    return;
  }

  const moneda = (empresaActiva() && empresaActiva().moneda) || estado.configuracion.monedaDefecto;

  estado.recorridos.forEach((recorrido) => {
    if (estado.idEdicionActual === recorrido.id) {
      dom.tablaRecorridosBody.appendChild(crearFilaEdicion(recorrido, moneda));
    } else {
      dom.tablaRecorridosBody.appendChild(crearFilaLectura(recorrido, moneda));
    }
  });

  dom.badgeCantidadRecorridos.textContent = String(estado.recorridos.length);
}

function crearFilaLectura(recorrido, moneda) {
  const fila = document.createElement("tr");
  fila.dataset.id = recorrido.id;

  const precioBase = parseFloat(dom.inputPrecioVuelta.value) || 0;
  const precioAdicional = parseFloat(dom.inputPrecioAdicional.value) || 0;
  const desglose = recorrido.vueltas <= 1
    ? `${t("label_precio_base")}: ${formatearMoneda(precioBase, moneda)}`
    : `${recorrido.vueltas} vueltas × ${formatearMoneda(precioAdicional, moneda)}`;

  fila.innerHTML = `
    <td>${formatearHora(recorrido.hora)}</td>
    <td>${recorrido.personas}</td>
    <td>${recorrido.vueltas}</td>
    <td title="${escaparHTML(desglose)}">${formatearMoneda(recorrido.costo, moneda)}</td>
    <td class="th-actions">
      <button class="icon-btn btn-duplicar" title="Duplicar" aria-label="Duplicar recorrido">
        <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="9" y="9" width="13" height="13" rx="2"></rect><path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"></path></svg>
      </button>
      <button class="icon-btn btn-editar" title="Editar" aria-label="Editar recorrido">
        <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"></path><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"></path></svg>
      </button>
      <button class="icon-btn icon-btn-danger btn-eliminar" title="Eliminar" aria-label="Eliminar recorrido">
        <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polyline points="3 6 5 6 21 6"></polyline><path d="M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6"></path><path d="M10 11v6"></path><path d="M14 11v6"></path><path d="M9 6V4a1 1 0 0 1 1-1h4a1 1 0 0 1 1 1v2"></path></svg>
      </button>
    </td>
  `;

  fila.querySelector(".btn-duplicar").addEventListener("click", () => duplicarRecorrido(recorrido.id));
  fila.querySelector(".btn-editar").addEventListener("click", () => editarRecorrido(recorrido.id));
  fila.querySelector(".btn-eliminar").addEventListener("click", () => eliminarRecorrido(recorrido.id));

  return fila;
}

function crearFilaEdicion(recorrido, moneda) {
  const contenido = dom.templateFilaEdicion.content.cloneNode(true);
  const fila = contenido.querySelector("tr");
  fila.dataset.id = recorrido.id;

  const inputHora = fila.querySelector(".edit-hora");
  const inputPersonas = fila.querySelector(".edit-personas");
  const inputVueltas = fila.querySelector(".edit-vueltas");
  const celdaCosto = fila.querySelector(".edit-costo");

  inputHora.value = recorrido.hora;
  inputPersonas.value = recorrido.personas;
  inputVueltas.value = recorrido.vueltas;
  celdaCosto.textContent = formatearMoneda(recorrido.costo, moneda);

  inputVueltas.addEventListener("input", () => {
    const precioBase = parseFloat(dom.inputPrecioVuelta.value) || 0;
    const precioAdicional = parseFloat(dom.inputPrecioAdicional.value) || 0;
    const vueltasTemp = parseInt(inputVueltas.value, 10) || 0;
    celdaCosto.textContent = formatearMoneda(calcularCosto(vueltasTemp, precioBase, precioAdicional), moneda);
  });

  fila.querySelector(".btn-guardar-edicion").addEventListener("click", () => guardarEdicionRecorrido(recorrido.id));
  fila.querySelector(".btn-cancelar-edicion").addEventListener("click", cancelarEdicionRecorrido);

  return fila;
}

/* =========================================================
   10. TOTALES
   ========================================================= */

function actualizarTotal() {
  const moneda = (empresaActiva() && empresaActiva().moneda) || estado.configuracion.monedaDefecto;
  const { subtotal, descuento, impuesto, total } = calcularTotales();

  dom.subtotalValor.textContent = formatearMoneda(subtotal, moneda);

  dom.filaDescuentoTotales.hidden = descuento <= 0;
  dom.descuentoValor.textContent = "-" + formatearMoneda(descuento, moneda);

  dom.filaImpuestoTotales.hidden = impuesto <= 0;
  dom.impuestoValor.textContent = "+" + formatearMoneda(impuesto, moneda);

  dom.totalValor.textContent = formatearMoneda(total, moneda);
}

/* =========================================================
   11. VISTA PREVIA DE LA PROFORMA
   ========================================================= */

function actualizarVistaPrevia() {
  const empresa = empresaActiva();
  const moneda = empresa.moneda || estado.configuracion.monedaDefecto;

  dom.previewNombreTransportista.textContent = estado.configuracion.nombreTransportista;
  dom.previewLogoCliente.src = empresa.logo;
  dom.previewLogoCliente.alt = "Logo " + empresa.nombre;
  dom.previewEmpresaNombre.textContent = empresa.nombre;

  dom.previewFecha.textContent = formatearFecha(dom.inputFecha.value);
  dom.previewNumero.textContent = dom.inputNumeroProforma.value.trim() || "—";
  dom.previewSucursal.textContent = dom.inputSucursal.value.trim() || "—";
  dom.previewObservaciones.textContent = dom.inputObservaciones.value.trim() || "—";

  dom.previewTablaBody.innerHTML = "";

  if (estado.recorridos.length === 0) {
    dom.previewTablaBody.innerHTML = `<tr class="empty-row"><td colspan="4">${t("empty_recorridos")}</td></tr>`;
  } else {
    estado.recorridos.forEach((recorrido) => {
      const fila = document.createElement("tr");
      fila.innerHTML = `
        <td>${formatearHora(recorrido.hora)}</td>
        <td>${recorrido.personas}</td>
        <td>${recorrido.vueltas}</td>
        <td>${formatearMoneda(recorrido.costo, moneda)}</td>
      `;
      dom.previewTablaBody.appendChild(fila);
    });
  }

  const { total } = calcularTotales();
  dom.previewTotal.textContent = formatearMoneda(total, moneda);
}

/* =========================================================
   12. NOTIFICACIONES (TOAST)
   ========================================================= */
let toastTimeoutId = null;

function mostrarToast(mensaje, tipo) {
  if (!dom.toast) return;

  dom.toast.textContent = mensaje;
  dom.toast.classList.remove("toast-success", "toast-danger");

  if (tipo === "success") dom.toast.classList.add("toast-success");
  if (tipo === "danger") dom.toast.classList.add("toast-danger");

  dom.toast.classList.add("visible");

  clearTimeout(toastTimeoutId);
  toastTimeoutId = setTimeout(() => {
    dom.toast.classList.remove("visible");
  }, 2800);
}

/* =========================================================
   13. APARIENCIA (TEMA / COLOR DE ACENTO / DENSIDAD)
   ========================================================= */

/**
 * Aplica el tema claro/oscuro/automático al documento y resalta
 * el botón correspondiente en el segmento de Configuración.
 * @param {"claro"|"oscuro"|"auto"} tema
 */
function aplicarTema(tema) {
  let temaResuelto = tema;
  if (tema === "auto") {
    temaResuelto = (window.matchMedia && window.matchMedia("(prefers-color-scheme: dark)").matches) ? "oscuro" : "claro";
  }
  document.documentElement.setAttribute("data-tema", temaResuelto);

  if (dom.segmentoTema) {
    dom.segmentoTema.querySelectorAll(".segmento-btn").forEach((boton) => {
      boton.classList.toggle("activo", boton.dataset.tema === tema);
    });
  }
}

/**
 * Aplica el color de acento elegido a la variable CSS --secondary,
 * usada en botones, focos y elementos destacados de la interfaz.
 * @param {string} colorHex
 */
function aplicarColorAcento(colorHex) {
  document.documentElement.style.setProperty("--secondary", colorHex);
  if (dom.inputColorAcento) dom.inputColorAcento.value = colorHex;
  if (dom.valorColorAcento) dom.valorColorAcento.textContent = colorHex.toUpperCase();
}

/**
 * Aplica la densidad de la interfaz (cómoda / compacta).
 * @param {"comoda"|"compacta"} densidad
 */
function aplicarDensidad(densidad) {
  document.documentElement.setAttribute("data-densidad", densidad);
  if (dom.segmentoDensidad) {
    dom.segmentoDensidad.querySelectorAll(".segmento-btn").forEach((boton) => {
      boton.classList.toggle("activo", boton.dataset.densidad === densidad);
    });
  }
}

/**
 * Aplica de una vez tema, color de acento, densidad e idioma según
 * la configuración actual en memoria. Se usa tanto al iniciar como
 * al recibir cambios sincronizados desde otro dispositivo.
 */
function aplicarConfiguracionCompleta() {
  aplicarTema(estado.configuracion.tema);
  aplicarColorAcento(estado.configuracion.colorAcento);
  aplicarDensidad(estado.configuracion.densidad);
  if (dom.selectIdioma) dom.selectIdioma.value = estado.configuracion.idioma;
  aplicarIdiomaEnDOM();
  renderizarSelectEmpresa();
}

/* =========================================================
   14. CONFIGURACIÓN PERSISTENTE
   ========================================================= */

function cargarConfiguracion() {
  try {
    const guardada = JSON.parse(localStorage.getItem(CLAVE_CONFIGURACION));
    if (guardada) {
      estado.configuracion = Object.assign({}, estado.configuracion, guardada);
    }
  } catch (error) {
    console.warn("No se pudo leer la configuración guardada:", error);
  }

  dom.inputNombreTransportista.value = estado.configuracion.nombreTransportista;
  dom.selectMonedaDefecto.value = estado.configuracion.monedaDefecto;
  dom.inputPrecioDefecto.value = estado.configuracion.precioDefecto;
  dom.inputPrecioAdicionalDefecto.value = estado.configuracion.precioVueltaAdicionalDefecto;
  dom.checkNube.checked = estado.configuracion.sincronizacionNube !== false;
}

/**
 * Persiste solo en localStorage (usado también al recibir cambios
 * desde Firebase, para no reenviarlos de vuelta a la nube).
 */
function persistirConfiguracionLocal() {
  localStorage.setItem(CLAVE_CONFIGURACION, JSON.stringify(estado.configuracion));
}

/**
 * Lee el formulario de Configuración, actualiza el estado, persiste
 * localmente y sincroniza con Firebase (si está disponible y activo).
 */
function guardarConfiguracion() {
  estado.configuracion.nombreTransportista = dom.inputNombreTransportista.value.trim() || "TransRoute S.A.";
  estado.configuracion.monedaDefecto = dom.selectMonedaDefecto.value;
  estado.configuracion.precioDefecto = parseFloat(dom.inputPrecioDefecto.value) || 0;
  estado.configuracion.precioVueltaAdicionalDefecto = parseFloat(dom.inputPrecioAdicionalDefecto.value) || 0;

  persistirConfiguracionLocal();
  if (!sincronizandoDesdeNube && nubeActiva()) {
    window.FirebaseSync.guardarConfiguracion(estado.configuracion);
  }

  actualizarVistaPrevia();
  mostrarToast(t("btn_guardar") + " ✓", "success");
}

/**
 * Cambia y persiste una sola preferencia de apariencia/idioma sin
 * necesidad de pasar por el resto del formulario de Configuración.
 * @param {string} clave
 * @param {*} valor
 */
function actualizarPreferencia(clave, valor) {
  estado.configuracion[clave] = valor;
  persistirConfiguracionLocal();
  if (!sincronizandoDesdeNube && nubeActiva()) {
    window.FirebaseSync.guardarConfiguracion(estado.configuracion);
  }
}

/* =========================================================
   15. GESTIÓN DE EMPRESAS (PRECIOS, COLORES, MONEDA)
   ========================================================= */

function cargarEmpresas() {
  try {
    const guardado = JSON.parse(localStorage.getItem(CLAVE_EMPRESAS));
    if (guardado && Object.keys(guardado).length > 0) {
      empresas = guardado;
    }
  } catch (error) {
    console.warn("No se pudo leer las empresas guardadas:", error);
  }
}

function persistirEmpresasLocal() {
  localStorage.setItem(CLAVE_EMPRESAS, JSON.stringify(empresas));
}

function persistirEmpresas() {
  persistirEmpresasLocal();
  if (!sincronizandoDesdeNube && nubeActiva()) {
    window.FirebaseSync.guardarEmpresas(empresas);
  }
}

/**
 * Genera una clave única y legible (slug) a partir del nombre de
 * una nueva empresa, evitando colisiones con empresas existentes.
 * @param {string} nombre
 * @returns {string}
 */
function generarClaveEmpresa(nombre) {
  let base = nombre
    .toLowerCase()
    .normalize("NFD").replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9]+/g, "_")
    .replace(/^_+|_+$/g, "") || "empresa";

  let clave = base;
  let contador = 1;
  while (empresas[clave]) {
    clave = `${base}_${contador++}`;
  }
  return clave;
}

/**
 * Renderiza la lista de tarjetas editables de empresas dentro de
 * Configuración, a partir de la plantilla #templateEmpresaCard.
 */
function renderizarListaEmpresasConfig() {
  dom.listaEmpresasConfig.innerHTML = "";

  Object.keys(empresas).forEach((clave) => {
    const empresa = empresas[clave];
    const nodo = dom.templateEmpresaCard.content.cloneNode(true);
    const tarjeta = nodo.querySelector(".empresa-card");
    tarjeta.dataset.clave = clave;

    const logoImg = tarjeta.querySelector(".empresa-card-logo");
    const inputNombre = tarjeta.querySelector(".empresa-card-nombre");
    const btnEliminar = tarjeta.querySelector(".empresa-card-eliminar");
    const inputLogoRuta = tarjeta.querySelector(".empresa-card-logo-ruta");
    const inputColorPrincipal = tarjeta.querySelector(".empresa-card-color-principal");
    const inputColorSecundario = tarjeta.querySelector(".empresa-card-color-secundario");
    const inputPrecioBase = tarjeta.querySelector(".empresa-card-precio-base");
    const inputPrecioAdicional = tarjeta.querySelector(".empresa-card-precio-adicional");
    const selectMoneda = tarjeta.querySelector(".empresa-card-moneda");

    logoImg.src = empresa.logo;
    logoImg.alt = empresa.nombre;
    inputNombre.value = empresa.nombre;
    inputLogoRuta.value = empresa.logo;
    inputColorPrincipal.value = empresa.colorPrincipal;
    inputColorSecundario.value = empresa.colorSecundario;
    inputPrecioBase.value = empresa.precioBase;
    inputPrecioAdicional.value = empresa.precioVueltaAdicional;
    selectMoneda.value = empresa.moneda || "USD";

    // La empresa "otra" es el respaldo genérico del sistema y no
    // se puede eliminar ni renombrar, para que siempre exista al
    // menos una opción disponible.
    if (clave === "otra") {
      btnEliminar.hidden = true;
      inputNombre.disabled = true;
    }

    const guardarCambio = () => {
      empresa.nombre = inputNombre.value.trim() || empresa.nombre;
      empresa.logo = inputLogoRuta.value.trim() || empresa.logo;
      empresa.colorPrincipal = inputColorPrincipal.value;
      empresa.colorSecundario = inputColorSecundario.value;
      empresa.precioBase = parseFloat(inputPrecioBase.value) || 0;
      empresa.precioVueltaAdicional = parseFloat(inputPrecioAdicional.value) || 0;
      empresa.moneda = selectMoneda.value;

      logoImg.src = empresa.logo;
      persistirEmpresas();
      renderizarSelectEmpresa();

      if (estado.empresaActual === clave) {
        cambiarEmpresa();
      }
      mostrarToast(t("btn_guardar_empresa") + " ✓", "success");
    };

    [inputNombre, inputLogoRuta, inputColorPrincipal, inputColorSecundario, inputPrecioBase, inputPrecioAdicional, selectMoneda]
      .forEach((campo) => campo.addEventListener("change", guardarCambio));

    btnEliminar.addEventListener("click", () => eliminarEmpresa(clave));

    dom.listaEmpresasConfig.appendChild(tarjeta);
  });
}

/**
 * Elimina una empresa personalizada (nunca la de respaldo "otra"),
 * previa confirmación, y reubica el formulario si era la activa.
 * @param {string} clave
 */
function eliminarEmpresa(clave) {
  if (clave === "otra") return;

  mostrarConfirmacion(t("modal_eliminar_empresa"), () => {
    delete empresas[clave];
    persistirEmpresas();
    renderizarListaEmpresasConfig();
    renderizarSelectEmpresa();

    if (estado.empresaActual === clave) {
      dom.selectEmpresa.value = "otra";
      cambiarEmpresa();
    }

    mostrarToast(t("btn_eliminar_empresa") + " ✓", "success");
  });
}

/**
 * Crea una nueva empresa personalizada a partir del formulario
 * "Agregar empresa" en Configuración.
 */
function agregarEmpresaPersonalizada() {
  const nombre = dom.nuevaEmpresaNombre.value.trim();

  if (!nombre) {
    marcarInputInvalido(dom.nuevaEmpresaNombre,
      estado.configuracion.idioma === "en" ? "The company name is required." : "El nombre de la empresa es obligatorio.");
    return;
  }

  const clave = generarClaveEmpresa(nombre);

  empresas[clave] = {
    nombre: nombre,
    logo: dom.nuevaEmpresaLogo.value.trim() || "logos/generica.png",
    colorPrincipal: dom.nuevaEmpresaColorPrincipal.value,
    colorSecundario: dom.nuevaEmpresaColorSecundario.value,
    precioBase: parseFloat(dom.nuevaEmpresaPrecioBase.value) || 0,
    precioVueltaAdicional: parseFloat(dom.nuevaEmpresaPrecioAdicional.value) || 0,
    moneda: dom.nuevaEmpresaMoneda.value
  };

  persistirEmpresas();
  renderizarListaEmpresasConfig();
  renderizarSelectEmpresa();

  // Limpiar y ocultar el formulario
  dom.nuevaEmpresaNombre.value = "";
  dom.nuevaEmpresaLogo.value = "";
  dom.nuevaEmpresaColorPrincipal.value = "#64646E";
  dom.nuevaEmpresaColorSecundario.value = "#18181B";
  dom.nuevaEmpresaPrecioBase.value = 35;
  dom.nuevaEmpresaPrecioAdicional.value = 20;
  dom.formNuevaEmpresa.hidden = true;

  mostrarToast(t("btn_agregar_empresa") + " ✓", "success");
}

/* =========================================================
   16. HISTORIAL PERSISTENTE (CRUD SOBRE LOCALSTORAGE + NUBE)
   ========================================================= */

function cargarHistorial() {
  try {
    const guardado = JSON.parse(localStorage.getItem(CLAVE_HISTORIAL));
    estado.historial = Array.isArray(guardado) ? guardado : [];
  } catch (error) {
    console.warn("No se pudo leer el historial guardado:", error);
    estado.historial = [];
  }

  actualizarBadgeHistorial();
}

function persistirHistorialLocal() {
  localStorage.setItem(CLAVE_HISTORIAL, JSON.stringify(estado.historial));
  actualizarBadgeHistorial();
}

function persistirHistorial() {
  persistirHistorialLocal();
  if (!sincronizandoDesdeNube && nubeActiva()) {
    window.FirebaseSync.guardarHistorial(estado.historial);
  }
}

function actualizarBadgeHistorial() {
  const cantidad = estado.historial.length;
  dom.navBadgeHistorial.textContent = String(cantidad);
  dom.navBadgeHistorial.hidden = cantidad === 0;
  dom.badgeHistorialTotal.textContent = String(cantidad);
}

function sugerirNumeroProforma() {
  // Busca el mayor número existente con formato PF-#### (o cualquier
  // sufijo numérico) para sugerir el siguiente sin colisiones,
  // incluso tras eliminaciones.
  let maximo = 0;
  estado.historial.forEach((proforma) => {
    const coincidencia = /\d+/g.exec(String(proforma.numeroProforma || ""));
    if (coincidencia) {
      const numero = parseInt(coincidencia[0], 10);
      if (numero > maximo) maximo = numero;
    }
  });
  return "PF-" + String(maximo + 1).padStart(4, "0");
}

function guardarProforma() {
  if (estado.recorridos.length === 0) {
    mostrarToast(t("toast_guardar_obligatorio"), "danger");
    return;
  }

  if (!dom.inputNumeroProforma.value.trim()) {
    dom.inputNumeroProforma.value = sugerirNumeroProforma();
  }

  const empresa = empresaActiva();
  const { subtotal, descuento, impuesto, total } = calcularTotales();

  // Si se está sobrescribiendo una proforma existente, conserva su
  // estado comercial (borrador/enviada/...); si es nueva, arranca
  // como borrador.
  const existente = estado.proformaIdEnEdicion
    ? estado.historial.find((p) => p.id === estado.proformaIdEnEdicion)
    : null;

  const proforma = {
    id: estado.proformaIdEnEdicion || ("prf_" + Date.now()),
    empresaClave: estado.empresaActual,
    empresaNombre: empresa.nombre,
    fecha: dom.inputFecha.value,
    numeroProforma: dom.inputNumeroProforma.value.trim(),
    sucursal: dom.inputSucursal.value.trim(),
    observaciones: dom.inputObservaciones.value.trim(),
    estado: (existente && existente.estado) || "borrador",
    precioBase: parseFloat(dom.inputPrecioVuelta.value) || 0,
    precioVueltaAdicional: parseFloat(dom.inputPrecioAdicional.value) || 0,
    descuentoPorcentaje: parseFloat(dom.inputDescuento.value) || 0,
    impuestoPorcentaje: parseFloat(dom.inputImpuesto.value) || 0,
    moneda: empresa.moneda || estado.configuracion.monedaDefecto,
    recorridos: estado.recorridos.map((r) => ({ hora: r.hora, personas: r.personas, vueltas: r.vueltas, costo: r.costo })),
    subtotal: subtotal,
    descuento: descuento,
    impuesto: impuesto,
    total: total,
    guardadaEn: new Date().toISOString()
  };

  const indiceExistente = estado.historial.findIndex((p) => p.id === proforma.id);

  if (indiceExistente >= 0) {
    estado.historial[indiceExistente] = proforma;
  } else {
    estado.historial.unshift(proforma);
  }

  estado.proformaIdEnEdicion = proforma.id;

  persistirHistorial();
  limpiarBorrador();
  renderizarHistorial();
  renderizarReportes();
  mostrarToast(t("toast_guardada"), "success");
}

function eliminarProformaHistorial(id) {
  mostrarConfirmacion(t("modal_eliminar_proforma"), () => {
    estado.historial = estado.historial.filter((p) => p.id !== id);
    persistirHistorial();
    renderizarReportes();
    renderizarHistorial();
    mostrarToast(t("toast_eliminada"), "success");
  });
}

function vaciarHistorial() {
  if (estado.historial.length === 0) {
    mostrarToast(t("toast_historial_vacio"), "danger");
    return;
  }

  mostrarConfirmacion(t("modal_vaciar"), () => {
    estado.historial = [];
    persistirHistorial();
    renderizarReportes();
    renderizarHistorial();
    mostrarToast(t("toast_historial_vaciado"), "success");
  });
}

/**
 * Carga una proforma del historial como plantilla para una NUEVA
 * proforma (sin id vinculado), con el siguiente número disponible y
 * la fecha de hoy. No pisa la proforma original.
 * @param {string} id
 */
function duplicarProforma(id) {
  const proforma = estado.historial.find((p) => p.id === id);
  if (!proforma) return;

  estado.proformaIdEnEdicion = null;
  estado.empresaActual = proforma.empresaClave;
  estado.recorridos = proforma.recorridos.map((r) => ({ id: estado.contadorId++, ...r }));

  renderizarSelectEmpresa();
  if (empresas[proforma.empresaClave]) {
    dom.selectEmpresa.value = proforma.empresaClave;
  }
  dom.inputFecha.value = hoyISO();
  dom.inputNumeroProforma.value = sugerirNumeroProforma();
  dom.inputSucursal.value = proforma.sucursal;
  dom.inputObservaciones.value = proforma.observaciones;
  dom.inputDescuento.value = proforma.descuentoPorcentaje || 0;
  dom.inputImpuesto.value = proforma.impuestoPorcentaje || 0;

  cambiarEmpresa();
  actualizarTabla();
  actualizarTotal();
  actualizarVistaPrevia();
  guardarBorrador();
  cambiarVista("nueva");
  mostrarToast(t("toast_duplicada"), "success");
}

function cargarProformaEnFormulario(id) {
  const proforma = estado.historial.find((p) => p.id === id);
  if (!proforma) return;

  estado.proformaIdEnEdicion = proforma.id;
  estado.empresaActual = proforma.empresaClave;
  estado.recorridos = proforma.recorridos.map((r) => ({ id: estado.contadorId++, ...r }));

  renderizarSelectEmpresa();
  if (empresas[proforma.empresaClave]) {
    dom.selectEmpresa.value = proforma.empresaClave;
  }
  dom.inputFecha.value = proforma.fecha;
  dom.inputNumeroProforma.value = proforma.numeroProforma;
  dom.inputSucursal.value = proforma.sucursal;
  dom.inputObservaciones.value = proforma.observaciones;
  dom.inputPrecioVuelta.value = proforma.precioBase;
  dom.inputPrecioAdicional.value = proforma.precioVueltaAdicional || 0;
  dom.inputDescuento.value = proforma.descuentoPorcentaje || 0;
  dom.inputImpuesto.value = proforma.impuestoPorcentaje || 0;

  cambiarEmpresa();
  actualizarTabla();
  actualizarTotal();
  actualizarVistaPrevia();
  cambiarVista("nueva");
  mostrarToast(t("toast_cargada"), "success");
}

/**
 * Cambia el estado comercial de una proforma guardada
 * ("borrador" | "enviada" | "aprobada" | "rechazada").
 * @param {string} id
 * @param {string} nuevoEstado
 */
function cambiarEstadoProforma(id, nuevoEstado) {
  const proforma = estado.historial.find((p) => p.id === id);
  if (!proforma) return;
  proforma.estado = nuevoEstado;
  persistirHistorial();
}

/* ============================================================================
   AUTOGUARDADO DE BORRADOR
   Guarda el estado del formulario en localStorage (con debounce) para
   restaurarlo si el usuario cierra la pestaña sin guardar.
   ============================================================================ */

let borradorEnRestauracion = false;

function capturarBorrador() {
  if (borradorEnRestauracion) return;
  if (!estado.recorridos.length && !dom.inputSucursal.value.trim() && !dom.inputObservaciones.value.trim()) {
    return; // No hay nada que valga la pena autoguardar
  }

  const borrador = {
    empresaActual: dom.selectEmpresa.value,
    recorridos: estado.recorridos,
    contadorId: estado.contadorId,
    fecha: dom.inputFecha.value,
    numeroProforma: dom.inputNumeroProforma.value.trim(),
    sucursal: dom.inputSucursal.value.trim(),
    observaciones: dom.inputObservaciones.value.trim(),
    precioBase: dom.inputPrecioVuelta.value,
    precioAdicional: dom.inputPrecioAdicional.value,
    descuento: dom.inputDescuento.value,
    impuesto: dom.inputImpuesto.value,
    proformaIdEnEdicion: estado.proformaIdEnEdicion,
    guardadoEn: new Date().toISOString()
  };

  try {
    localStorage.setItem(CLAVE_BORRADOR, JSON.stringify(borrador));
  } catch (error) {
    console.warn("No se pudo autoguardar el borrador:", error);
  }
}

let borradorTimerId = null;

function guardarBorrador() {
  clearTimeout(borradorTimerId);
  borradorTimerId = setTimeout(capturarBorrador, 400);
}

function limpiarBorrador() {
  borradorEnRestauracion = true;
  clearTimeout(borradorTimerId); // descarta autoguardados pendientes
  try { localStorage.removeItem(CLAVE_BORRADOR); } catch (error) { /* sin problema */ }
  borradorEnRestauracion = false;
}

function restaurarBorrador() {
  try {
    const borrador = JSON.parse(localStorage.getItem(CLAVE_BORRADOR));
    if (!borrador || !borrador.recorridos || borrador.recorridos.length === 0) {
      return false;
    }

    borradorEnRestauracion = true;

    estado.recorridos = borrador.recorridos;
    estado.contadorId = borrador.contadorId || (borrador.recorridos.length + 1);
    estado.proformaIdEnEdicion = borrador.proformaIdEnEdicion || null;

    if (borrador.empresaActual && empresas[borrador.empresaActual]) {
      estado.empresaActual = borrador.empresaActual;
    }

    renderizarSelectEmpresa();
    if (empresas[borrador.empresaActual]) {
      dom.selectEmpresa.value = borrador.empresaActual;
    }

    if (borrador.fecha) dom.inputFecha.value = borrador.fecha;
    if (borrador.numeroProforma) dom.inputNumeroProforma.value = borrador.numeroProforma;
    if (borrador.sucursal) dom.inputSucursal.value = borrador.sucursal;
    if (borrador.observaciones) dom.inputObservaciones.value = borrador.observaciones;
    if (borrador.precioBase != null) dom.inputPrecioVuelta.value = borrador.precioBase;
    if (borrador.precioAdicional != null) dom.inputPrecioAdicional.value = borrador.precioAdicional;
    if (borrador.descuento != null) dom.inputDescuento.value = borrador.descuento;
    if (borrador.impuesto != null) dom.inputImpuesto.value = borrador.impuesto;

    borradorEnRestauracion = false;
    mostrarToast(t("toast_borrador_restaurado"), "success");
    return true;
  } catch (error) {
    console.warn("No se pudo restaurar el borrador:", error);
    borradorEnRestauracion = false;
    return false;
  }
}

/* ============================================================================
   EXPORTACIÓN CSV (historial completo)
   ============================================================================ */

function exportarHistorialCSV() {
  if (estado.historial.length === 0) {
    mostrarToast(t("toast_historial_vacio"), "danger");
    return;
  }

  const celda = (valor) => '"' + String(valor == null ? "" : valor).replace(/"/g, '""') + '"';
  const encabezados = ["Fecha", "N° Proforma", "Empresa", "Sucursal", "Moneda", "Subtotal", "Descuento", "Impuesto", "Total", "Estado", "Recorridos"];
  const lineas = [encabezados.map(celda).join(";")];

  estado.historial.forEach((proforma) => {
    lineas.push([
      proforma.fecha || "",
      proforma.numeroProforma || "",
      proforma.empresaNombre || "",
      proforma.sucursal || "",
      proforma.moneda || "",
      Number(proforma.subtotal || 0).toFixed(2),
      Number(proforma.descuento || 0).toFixed(2),
      Number(proforma.impuesto || 0).toFixed(2),
      Number(proforma.total || 0).toFixed(2),
      t("estado_" + (proforma.estado || "borrador")),
      (proforma.recorridos ? proforma.recorridos.length : 0)
    ].map(celda).join(";"));
  });

  // BOM para que Excel respete la codificación UTF-8
  const contenido = "\uFEFF" + lineas.join("\r\n");
  const archivo = new Blob([contenido], { type: "text/csv;charset=utf-8;" });
  const url = URL.createObjectURL(archivo);
  const enlace = document.createElement("a");
  enlace.href = url;
  enlace.download = "proformas_" + hoyISO() + ".csv";
  document.body.appendChild(enlace);
  enlace.click();
  document.body.removeChild(enlace);
  URL.revokeObjectURL(url);

  mostrarToast(t("toast_csv_exportado"), "success");
}

/* ============================================================================
   REPORTES / DASHBOARD
   Agregaciones sobre el historial para la vista de Reportes.
   ============================================================================ */

function hoyISO() {
  const hoy = new Date();
  const anio = hoy.getFullYear();
  const mes = String(hoy.getMonth() + 1).padStart(2, "0");
  const dia = String(hoy.getDate()).padStart(2, "0");
  return `${anio}-${mes}-${dia}`;
}

function obtenerMonedaProforma(proforma) {
  const empresa = empresas[proforma.empresaClave];
  return proforma.moneda || (empresa && empresa.moneda) || estado.configuracion.monedaDefecto;
}

/**
 * Agrega el historial por mes (YYYY-MM) y por cliente, separado por
 * moneda para no mezclar totales de monedas distintas en las gráficas.
 */
function agregarHistorialParaReportes() {
  const porMesPorMoneda = {};     // { USD: { "2025-01": total }, ... }
  const porEmpresaPorMoneda = {}; // { USD: { "McDonald's": total }, ... }

  estado.historial.forEach((proforma) => {
    const moneda = obtenerMonedaProforma(proforma);
    const mes = String(proforma.fecha || "").slice(0, 7) || "—";
    const empresa = proforma.empresaNombre || "—";

    porMesPorMoneda[moneda] = porMesPorMoneda[moneda] || {};
    porMesPorMoneda[moneda][mes] = (porMesPorMoneda[moneda][mes] || 0) + Number(proforma.total || 0);

    porEmpresaPorMoneda[moneda] = porEmpresaPorMoneda[moneda] || {};
    porEmpresaPorMoneda[moneda][empresa] = (porEmpresaPorMoneda[moneda][empresa] || 0) + Number(proforma.total || 0);
  });

  return { porMesPorMoneda, porEmpresaPorMoneda };
}

/**
 * Devuelve el nombre legible del mes a partir de una clave YYYY-MM.
 * @param {string} claveMes
 * @returns {string}
 */
function nombreMes(claveMes) {
  if (!claveMes || claveMes.length < 7) return "";
  const [anio, mes] = claveMes.split("-");
  const esEn = estado.configuracion.idioma === "en";
  const mesesEs = ["Enero", "Febrero", "Marzo", "Abril", "Mayo", "Junio", "Julio", "Agosto", "Septiembre", "Octubre", "Noviembre", "Diciembre"];
  const mesesEn = ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"];
  const nombre = (esEn ? mesesEn : mesesEs)[parseInt(mes, 10) - 1] || "";
  return `${nombre} ${anio}`;
}

/**
 * Elimina el símbolo de moneda de un monto formateado (para que las
 * barras no repitan "$" en cada intervalo vertical).
 * @param {number} total
 * @param {string} moneda
 * @returns {string}
 */
function abreviarMonto(total, moneda) {
  const completo = formatearMoneda(total, moneda);
  if (Math.abs(total) >= 1000) {
    const simbolo = completo.replace(/[\d.,\s]+$/, "").trim();
    return simbolo + (total / 1000).toFixed(1) + "k";
  }
  return completo;
}

function renderizarReportes() {
  if (!dom.vistaReportes || !dom.graficaMeses) return;

  // ---------- Tarjetas de resumen (basadas en la moneda más usada) ----------
  const conteoMonedas = {};
  estado.historial.forEach((proforma) => {
    const moneda = obtenerMonedaProforma(proforma);
    conteoMonedas[moneda] = (conteoMonedas[moneda] || 0) + 1;
  });
  const monedaPrincipal = Object.keys(conteoMonedas).sort((a, b) => conteoMonedas[b] - conteoMonedas[a])[0]
    || estado.configuracion.monedaDefecto;

  const mesActual = hoyISO().slice(0, 7);
  const delMesActual = estado.historial.filter((p) => String(p.fecha || "").slice(0, 7) === mesActual);
  const totalMes = delMesActual.reduce((acc, p) => acc + Number(p.total || 0), 0);
  const todosTotales = estado.historial.reduce((acc, p) => acc + Number(p.total || 0), 0);
  const promedio = estado.historial.length ? todosTotales / estado.historial.length : 0;

  dom.statTotalMes.textContent = formatearMoneda(totalMes, monedaPrincipal);
  dom.statProformasMes.textContent = String(delMesActual.length);
  dom.statPromedio.textContent = formatearMoneda(promedio, monedaPrincipal);
  dom.statTotalHistorico.textContent = formatearMoneda(todosTotales, monedaPrincipal);

  dom.statInfoMes.textContent = nombreMes(mesActual) || "—";
  dom.statInfoProformas.textContent = `${delMesActual.length} / ${estado.historial.length}`;
  dom.statInfoPromedio.textContent = `${monedaPrincipal} · ${estado.historial.length} proformas`;
  dom.statInfoHistorico.textContent = `${estado.historial.length} proformas`;

  // ---------- Gráfica vertical: últimos 6 meses ----------
  dom.graficaMeses.innerHTML = "";
  const { porMesPorMoneda } = agregarHistorialParaReportes();
  const mesesMap = porMesPorMoneda[monedaPrincipal] || {};

  // Construye la lista de los últimos 6 meses (incluye el actual)
  const mesesLista = [];
  const fechaBase = new Date();
  for (let indice = 5; indice >= 0; indice--) {
    const fecha = new Date(fechaBase.getFullYear(), fechaBase.getMonth() - indice, 1);
    const clave = `${fecha.getFullYear()}-${String(fecha.getMonth() + 1).padStart(2, "0")}`;
    mesesLista.push({ clave, total: Number(mesesMap[clave] || 0) });
  }

  const maximoMes = Math.max(...mesesLista.map((m) => m.total), 0);
  if (maximoMes === 0) {
    dom.graficaMeses.innerHTML = `<span style="color:var(--text-muted);font-size:12px">${t("empty_reportes")}</span>`;
  } else {
    mesesLista.forEach(({ clave, total }) => {
      const grupo = document.createElement("div");
      grupo.className = "barra-grupo";
      const altura = Math.max(3, Math.round((total / maximoMes) * 140));
      const etiquetaMes = nombreMes(clave).split(" ")[0] || clave;
      grupo.innerHTML = `
        <span class="barra-valor">${total > 0 ? escaparHTML(abreviarMonto(total, monedaPrincipal)) : ""}</span>
        <div class="barra-bar" style="height:${altura}px" title="${escaparHTML(nombreMes(clave) + ": " + formatearMoneda(total, monedaPrincipal))}"></div>
        <span class="barra-etiqueta">${escaparHTML(etiquetaMes)}</span>
      `;
      dom.graficaMeses.appendChild(grupo);
    });
  }

  // ---------- Gráfica horizontal: por cliente ----------
  dom.graficaEmpresas.innerHTML = "";
  if (dom.graficaEmpresas) {
    const { porEmpresaPorMoneda } = agregarHistorialParaReportes();
    const empresasMap = porEmpresaPorMoneda[monedaPrincipal] || {};
    const empresasOrdenadas = Object.entries(empresasMap).sort((a, b) => b[1] - a[1]).slice(0, 6);

    if (empresasOrdenadas.length === 0) {
      dom.graficaEmpresas.innerHTML = `<span style="color:var(--text-muted);font-size:12px">${t("empty_reportes")}</span>`;
    } else {
      const maximoEmpresa = empresasOrdenadas[0][1];
      empresasOrdenadas.forEach(([nombreEmpresa, total]) => {
        // Intenta usar el color de marca de la empresa cliente
        let color = "var(--secondary)";
        Object.keys(empresas).forEach((clave) => {
          if (empresas[clave].nombre === nombreEmpresa && empresas[clave].colorPrincipal) {
            color = empresas[clave].colorPrincipal;
          }
        });

        const fila = document.createElement("div");
        fila.className = "barra-horizontal";
        fila.innerHTML = `
          <span class="barra-etiqueta" title="${escaparHTML(nombreEmpresa)}">${escaparHTML(nombreEmpresa)}</span>
          <span class="barra-pista">
            <span class="barra-bar" style="background:${escaparHTML(color)}; width:${Math.max(3, Math.round((total / maximoEmpresa) * 100))}%"></span>
          </span>
          <span class="barra-valor">${escaparHTML(formatearMoneda(total, monedaPrincipal))}</span>
        `;
        dom.graficaEmpresas.appendChild(fila);
      });
    }
  }
}

/**
 * Aplica búsqueda, filtro de empresa y orden seleccionados en la
 * toolbar a una copia del historial.
 * @returns {Array}
 */
function filtrarHistorial() {
  const busqueda = ((dom.inputBuscarHistorial && dom.inputBuscarHistorial.value) || "").toLowerCase().trim();
  const empresa = dom.filtroEmpresaHistorial ? dom.filtroEmpresaHistorial.value : "";
  const orden = dom.ordenHistorial ? dom.ordenHistorial.value : "recientes";

  let lista = estado.historial.filter((proforma) => {
    if (busqueda) {
      const paraBuscar = [
        proforma.empresaNombre,
        proforma.sucursal,
        proforma.numeroProforma
      ].join(" ").toLowerCase();
      if (!paraBuscar.includes(busqueda)) return false;
    }
    if (empresa && proforma.empresaClave !== empresa) return false;
    return true;
  });

  if (orden === "antiguos") {
    lista = [...lista].reverse();
  } else if (orden === "mayor") {
    lista = [...lista].sort((a, b) => Number(b.total || 0) - Number(a.total || 0));
  } else if (orden === "menor") {
    lista = [...lista].sort((a, b) => Number(a.total || 0) - Number(b.total || 0));
  }
  // "recientes" conserva el orden natural (más nuevas primero)

  return lista;
}

function renderizarHistorial() {
  dom.tablaHistorialBody.innerHTML = "";

  // Reconstruye el filtro de empresas según las proformas guardadas
  if (dom.filtroEmpresaHistorial) {
    const seleccion = dom.filtroEmpresaHistorial.value;
    const clavesUnicas = [...new Set(estado.historial.map((p) => p.empresaClave))].filter(Boolean);
    dom.filtroEmpresaHistorial.innerHTML = `<option value="">${t("label_filtrar_empresa")}</option>`;
    clavesUnicas.forEach((clave) => {
      const opcion = document.createElement("option");
      opcion.value = clave;
      opcion.textContent = (empresas[clave] && empresas[clave].nombre) || clave;
      dom.filtroEmpresaHistorial.appendChild(opcion);
    });
    if (clavesUnicas.includes(seleccion)) dom.filtroEmpresaHistorial.value = seleccion;
  }

  const lista = filtrarHistorial();

  if (lista.length === 0) {
    const textoVacio = estado.historial.length === 0 ? t("empty_historial") : t("empty_historial_filtro");
    dom.tablaHistorialBody.innerHTML = `<tr class="empty-row" id="filaVaciaHistorial"><td colspan="7">${escaparHTML(textoVacio)}</td></tr>`;
    return;
  }

  lista.forEach((proforma) => {
    const estadoClave = proforma.estado || "borrador";
    const fila = document.createElement("tr");
    fila.innerHTML = `
      <td>${formatearFecha(proforma.fecha)}</td>
      <td>${escaparHTML(proforma.numeroProforma || "—")}</td>
      <td>${escaparHTML(proforma.empresaNombre)}</td>
      <td>${escaparHTML(proforma.sucursal || "—")}</td>
      <td>${formatearMoneda(proforma.total, proforma.moneda)}</td>
      <td>
        <select class="estado-select estado-${escaparHTML(estadoClave)}" data-id="${escaparHTML(proforma.id)}" title="Cambiar estado">
          <option value="borrador" ${estadoClave === "borrador" ? "selected" : ""}>${t("estado_borrador")}</option>
          <option value="enviada" ${estadoClave === "enviada" ? "selected" : ""}>${t("estado_enviada")}</option>
          <option value="aprobada" ${estadoClave === "aprobada" ? "selected" : ""}>${t("estado_aprobada")}</option>
          <option value="rechazada" ${estadoClave === "rechazada" ? "selected" : ""}>${t("estado_rechazada")}</option>
        </select>
      </td>
      <td class="th-actions">
        <button class="icon-btn btn-hist-abrir" title="Abrir en el formulario">
          <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"></path><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"></path></svg>
        </button>
        <button class="icon-btn btn-hist-duplicar" title="Duplicar como nueva">
          <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="9" y="9" width="13" height="13" rx="2"></rect><path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"></path></svg>
        </button>
        <button class="icon-btn btn-hist-pdf" title="Generar PDF">
          <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"></path><polyline points="14 2 14 8 20 8"></polyline></svg>
        </button>
        <button class="icon-btn icon-btn-danger btn-hist-eliminar" title="Eliminar">
          <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polyline points="3 6 5 6 21 6"></polyline><path d="M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6"></path></svg>
        </button>
      </td>
    `;

    fila.querySelector(".btn-hist-abrir").addEventListener("click", () => cargarProformaEnFormulario(proforma.id));
    fila.querySelector(".btn-hist-duplicar").addEventListener("click", () => duplicarProforma(proforma.id));
    fila.querySelector(".btn-hist-pdf").addEventListener("click", () => generarPDFDesdeHistorial(proforma.id));
    fila.querySelector(".btn-hist-eliminar").addEventListener("click", () => eliminarProformaHistorial(proforma.id));

    fila.querySelector(".estado-select").addEventListener("change", (evento) => {
      const nuevoEstado = evento.target.value;
      cambiarEstadoProforma(proforma.id, nuevoEstado);
      evento.target.className = "estado-select estado-" + nuevoEstado;
    });

    dom.tablaHistorialBody.appendChild(fila);
  });
}

/* =========================================================
   17. NAVEGACIÓN ENTRE VISTAS
   ========================================================= */

function textosVista(nombreVista) {
  const claves = {
    nueva: { titulo: "nav_nueva", subtitulo: null },
    historial: { titulo: "nav_historial", subtitulo: null },
    reportes: { titulo: "nav_reportes", subtitulo: null },
    configuracion: { titulo: "nav_config", subtitulo: null }
  };

  const SUBTITULOS = {
    nueva: { es: "Genera una proforma de transporte de personal en segundos.", en: "Generate a staff transportation quote in seconds." },
    historial: { es: "Consulta, reimprime o elimina proformas guardadas anteriormente.", en: "Review, reprint or delete previously saved quotes." },
    reportes: { es: "Métricas de facturación por mes y por cliente a partir del historial.", en: "Invoicing metrics per month and per client based on your history." },
    configuracion: { es: "Ajusta los valores por defecto, la apariencia y el idioma del sistema.", en: "Adjust default values, appearance and language." }
  };

  const idioma = estado.configuracion.idioma === "en" ? "en" : "es";
  return {
    titulo: t(claves[nombreVista].titulo),
    subtitulo: SUBTITULOS[nombreVista][idioma]
  };
}

function cambiarVista(nombreVista) {
  estado.vistaActual = nombreVista;

  dom.vistaNueva.hidden = nombreVista !== "nueva";
  dom.vistaHistorial.hidden = nombreVista !== "historial";
  dom.vistaReportes.hidden = nombreVista !== "reportes";
  dom.vistaConfiguracion.hidden = nombreVista !== "configuracion";
  dom.accionesNuevaProforma.hidden = nombreVista !== "nueva";

  const textos = textosVista(nombreVista);
  dom.tituloVista.textContent = textos.titulo;
  dom.subtituloVista.textContent = textos.subtitulo;

  dom.navItems.forEach((item) => {
    item.classList.toggle("active", item.dataset.vista === nombreVista);
  });

  if (nombreVista === "historial") {
    renderizarHistorial();
  }
  if (nombreVista === "reportes") {
    renderizarReportes();
  }
  if (nombreVista === "configuracion") {
    renderizarListaEmpresasConfig();
  }
}

/* =========================================================
   18. RESET DEL FORMULARIO ("NUEVA PROFORMA")
   ========================================================= */

function iniciarProformaNueva() {
  estado.recorridos = [];
  estado.idEdicionActual = null;
  estado.proformaIdEnEdicion = null;

  limpiarBorrador();

  renderizarSelectEmpresa();
  dom.selectEmpresa.value = Object.keys(empresas)[0] || "otra";
  dom.inputSucursal.value = "";
  dom.inputObservaciones.value = "";
  dom.inputNumeroProforma.value = sugerirNumeroProforma();
  dom.inputDescuento.value = 0;
  dom.inputImpuesto.value = 0;
  dom.inputHoraSalida.value = "";
  dom.inputPersonas.value = 1;
  dom.inputVueltas.value = 1;

  inicializarFechaPorDefecto();
  cambiarEmpresa();
  actualizarTabla();
  actualizarTotal();
  actualizarVistaPrevia();
  cambiarVista("nueva");
  mostrarToast(t("toast_form_nueva"), "success");
}

/* =========================================================
   19. SINCRONIZACIÓN CON FIREBASE
   ========================================================= */

function nubeActiva() {
  return estado.configuracion.sincronizacionNube !== false && firebaseListo && window.FirebaseSync && window.FirebaseSync.disponible;
}

/**
 * Actualiza los indicadores visuales de estado de la nube (la
 * pastilla del sidebar y la insignia en Configuración).
 * @param {"conectado"|"desconectado"|"inactivo"} estadoTexto
 */
function actualizarPildoraNube(estadoTexto) {
  const claves = {
    conectado: "estado_nube_conectado",
    desconectado: "estado_nube_desconectado",
    inactivo: "estado_nube_inactivo"
  };

  if (dom.textoNube) dom.textoNube.textContent = t(claves[estadoTexto]);
  if (dom.badgeEstadoNube) dom.badgeEstadoNube.textContent = t(claves[estadoTexto]);
  if (dom.puntoNube) {
    dom.puntoNube.classList.remove("cloud-dot-on", "cloud-dot-off");
    dom.puntoNube.classList.add(estadoTexto === "conectado" ? "cloud-dot-on" : "cloud-dot-off");
  }
}

/**
 * Establece la conexión con Firebase Realtime Database: en la
 * primera carga, la nube gana si ya tiene datos (para compartir
 * entre dispositivos); si no, sube lo que haya en este equipo.
 * Luego se suscribe a cambios en tiempo real.
 */
async function conectarFirebase() {
  if (!window.FirebaseSync || !window.FirebaseSync.disponible) {
    actualizarPildoraNube("desconectado");
    return;
  }

  if (!estado.configuracion.sincronizacionNube) {
    actualizarPildoraNube("inactivo");
    return;
  }

  actualizarPildoraNube("conectado");

  const remoto = await window.FirebaseSync.leerTodo();

  if (remoto) {
    if (remoto.configuracion) {
      estado.configuracion = Object.assign({}, estado.configuracion, remoto.configuracion);
      persistirConfiguracionLocal();
    } else {
      window.FirebaseSync.guardarConfiguracion(estado.configuracion);
    }

    if (remoto.empresas) {
      empresas = remoto.empresas;
      persistirEmpresasLocal();
    } else {
      window.FirebaseSync.guardarEmpresas(empresas);
    }

    if (remoto.historial) {
      estado.historial = Array.isArray(remoto.historial) ? remoto.historial : Object.values(remoto.historial);
      persistirHistorialLocal();
    } else {
      window.FirebaseSync.guardarHistorial(estado.historial);
    }

    aplicarConfiguracionCompleta();
    cargarConfiguracion();
    cambiarEmpresa();
    actualizarTabla();
    actualizarTotal();
    actualizarVistaPrevia();
    if (estado.vistaActual === "historial") renderizarHistorial();
    if (estado.vistaActual === "configuracion") renderizarListaEmpresasConfig();
  }

  window.FirebaseSync.escucharConfiguracion((datos) => {
    if (!datos) return;
    sincronizandoDesdeNube = true;
    estado.configuracion = Object.assign({}, estado.configuracion, datos);
    persistirConfiguracionLocal();
    cargarConfiguracion();
    aplicarConfiguracionCompleta();
    actualizarVistaPrevia();
    sincronizandoDesdeNube = false;
  });

  window.FirebaseSync.escucharEmpresas((datos) => {
    if (!datos) return;
    sincronizandoDesdeNube = true;
    empresas = datos;
    persistirEmpresasLocal();
    renderizarSelectEmpresa();
    if (empresas[estado.empresaActual]) cambiarEmpresa();
    if (estado.vistaActual === "configuracion") renderizarListaEmpresasConfig();
    sincronizandoDesdeNube = false;
  });

  window.FirebaseSync.escucharHistorial((datos) => {
    if (!datos) return;
    sincronizandoDesdeNube = true;
    estado.historial = Array.isArray(datos) ? datos : Object.values(datos);
    persistirHistorialLocal();
    if (estado.vistaActual === "historial") renderizarHistorial();
    sincronizandoDesdeNube = false;
  });
}

/**
 * Activa o desactiva la sincronización con la nube según la
 * casilla de Configuración.
 */
function alternarSincronizacionNube() {
  const activo = dom.checkNube.checked;
  actualizarPreferencia("sincronizacionNube", activo);

  if (activo) {
    conectarFirebase();
  } else {
    if (window.FirebaseSync && window.FirebaseSync.disponible) {
      window.FirebaseSync.detenerEscucha("configuracion");
      window.FirebaseSync.detenerEscucha("empresas");
      window.FirebaseSync.detenerEscucha("historial");
    }
    actualizarPildoraNube("inactivo");
  }
}

/* =========================================================
   20. INICIALIZACIÓN Y EVENTOS
   ========================================================= */

function inicializarFechaPorDefecto() {
  const hoy = new Date();
  const anio = hoy.getFullYear();
  const mes = String(hoy.getMonth() + 1).padStart(2, "0");
  const dia = String(hoy.getDate()).padStart(2, "0");
  dom.inputFecha.value = `${anio}-${mes}-${dia}`;
}

function registrarEventos() {
  dom.selectEmpresa.addEventListener("change", cambiarEmpresa);

  dom.inputFecha.addEventListener("input", actualizarVistaPrevia);
  dom.inputNumeroProforma.addEventListener("input", actualizarVistaPrevia);
  dom.inputSucursal.addEventListener("input", actualizarVistaPrevia);
  dom.inputObservaciones.addEventListener("input", actualizarVistaPrevia);

  dom.inputPrecioVuelta.addEventListener("input", recalcularTodosLosCostos);
  dom.inputPrecioAdicional.addEventListener("input", recalcularTodosLosCostos);
  dom.inputDescuento.addEventListener("input", () => { actualizarTotal(); actualizarVistaPrevia(); });
  dom.inputImpuesto.addEventListener("input", () => { actualizarTotal(); actualizarVistaPrevia(); });

  // ---------- Autoguardado del borrador ----------
  [dom.inputFecha, dom.inputNumeroProforma, dom.inputSucursal, dom.inputObservaciones,
   dom.inputPrecioVuelta, dom.inputPrecioAdicional, dom.inputDescuento, dom.inputImpuesto]
    .forEach((campo) => campo.addEventListener("input", guardarBorrador));

  dom.btnAgregarRecorrido.addEventListener("click", agregarRecorrido);

  [dom.inputHoraSalida, dom.inputPersonas, dom.inputVueltas].forEach((campo) => {
    campo.addEventListener("keydown", (evento) => {
      if (evento.key === "Enter") {
        evento.preventDefault();
        agregarRecorrido();
      }
    });
  });

  // ---------- Steppers de personas (delegado: cubre form y fila en edición) ----------
  document.addEventListener("click", (evento) => {
    const boton = evento.target.closest(".stepper-btn");
    if (!boton) return;
    const stepper = boton.closest(".stepper");
    const input = stepper ? stepper.querySelector("input[type=number]") : null;
    if (!input) return;

    const paso = parseInt(boton.dataset.stepper, 10) || 1;
    const minimo = parseInt(input.min, 10) || 1;
    const maximo = parseInt(input.max, 10) || Infinity;
    const nuevo = (parseInt(input.value, 10) || minimo) + paso;
    input.value = Math.min(maximo, Math.max(minimo, nuevo));
    input.dispatchEvent(new Event("input", { bubbles: true }));
    input.dispatchEvent(new Event("change", { bubbles: true }));
  });

  // ---------- Modal de confirmación ----------
  dom.btnModalCancelar.addEventListener("click", cerrarModal);
  dom.btnModalConfirmar.addEventListener("click", confirmarModal);
  dom.modalOverlay.addEventListener("click", (evento) => {
    if (evento.target === dom.modalOverlay) cerrarModal();
  });

  // ---------- Atajos de teclado: Ctrl+S guardar, Ctrl+P generar PDF ----------
  document.addEventListener("keydown", (evento) => {
    if ((evento.ctrlKey || evento.metaKey) && evento.key.toLowerCase() === "s") {
      evento.preventDefault();
      guardarProforma();
    }
    if ((evento.ctrlKey || evento.metaKey) && evento.key.toLowerCase() === "p") {
      evento.preventDefault();
      generarPDF();
    }
    if (evento.key === "Escape" && dom.modalOverlay && !dom.modalOverlay.hidden) {
      cerrarModal();
    }
  });

  // ---------- Advertir al cerrar la pestaña con recorridos no guardados ----------
  window.addEventListener("beforeunload", (evento) => {
    capturarBorrador(); // guarda el borrador de inmediato, sin esperar el debounce
    if (estado.recorridos.length > 0) {
      evento.preventDefault();
      evento.returnValue = "";
    }
  });

  // ---------- Número de proforma sugerido ----------
  dom.btnSugerirNumero.addEventListener("click", () => {
    dom.inputNumeroProforma.value = sugerirNumeroProforma();
    dom.inputNumeroProforma.dispatchEvent(new Event("input", { bubbles: true }));
    mostrarToast(t("toast_confirma_cambios"), "success");
  });

  dom.btnGenerarPDF.addEventListener("click", generarPDF);
  dom.btnGuardarProforma.addEventListener("click", guardarProforma);
  dom.btnNuevaProforma.addEventListener("click", () => {
    if (estado.recorridos.length > 0) {
      mostrarConfirmacion(t("modal_descartar"), iniciarProformaNueva);
      return;
    }
    iniciarProformaNueva();
  });

  dom.navItems.forEach((item) => {
    item.addEventListener("click", (evento) => {
      evento.preventDefault();
      cambiarVista(item.dataset.vista);
    });
  });

  // ---------- Configuración: precios por defecto / transportista ----------
  dom.selectMonedaDefecto.addEventListener("change", guardarConfiguracion);
  dom.inputPrecioDefecto.addEventListener("change", guardarConfiguracion);
  dom.inputPrecioAdicionalDefecto.addEventListener("change", guardarConfiguracion);
  dom.inputNombreTransportista.addEventListener("change", guardarConfiguracion);
  dom.inputTelefonoTransportista.addEventListener("change", guardarConfiguracion);
  dom.inputEmailTransportista.addEventListener("change", guardarConfiguracion);
  dom.inputDireccionTransportista.addEventListener("change", guardarConfiguracion);
  dom.inputCondicionesTransportista.addEventListener("change", guardarConfiguracion);
  dom.inputValidezTransportista.addEventListener("change", guardarConfiguracion);
  dom.btnVaciarHistorial.addEventListener("click", vaciarHistorial);

  // ---------- Historial: toolbar (búsqueda / filtro / orden) y export ----------
  dom.inputBuscarHistorial.addEventListener("input", renderizarHistorial);
  dom.filtroEmpresaHistorial.addEventListener("change", renderizarHistorial);
  dom.ordenHistorial.addEventListener("change", renderizarHistorial);
  dom.btnExportarCSV.addEventListener("click", exportarHistorialCSV);
  dom.btnExportarCSVReportes.addEventListener("click", exportarHistorialCSV);

  // ---------- Configuración: apariencia ----------
  dom.segmentoTema.addEventListener("click", (evento) => {
    const boton = evento.target.closest(".segmento-btn");
    if (!boton) return;
    actualizarPreferencia("tema", boton.dataset.tema);
    aplicarTema(boton.dataset.tema);
  });

  dom.segmentoDensidad.addEventListener("click", (evento) => {
    const boton = evento.target.closest(".segmento-btn");
    if (!boton) return;
    actualizarPreferencia("densidad", boton.dataset.densidad);
    aplicarDensidad(boton.dataset.densidad);
  });

  dom.inputColorAcento.addEventListener("input", () => {
    aplicarColorAcento(dom.inputColorAcento.value);
  });
  dom.inputColorAcento.addEventListener("change", () => {
    actualizarPreferencia("colorAcento", dom.inputColorAcento.value);
  });

  // ---------- Configuración: idioma ----------
  dom.selectIdioma.addEventListener("change", () => {
    actualizarPreferencia("idioma", dom.selectIdioma.value);
    aplicarIdiomaEnDOM();
    renderizarSelectEmpresa();
    cambiarVista(estado.vistaActual);
    actualizarTabla();
    actualizarTotal();
    actualizarVistaPrevia();
    actualizarPildoraNube(nubeActiva() ? "conectado" : (estado.configuracion.sincronizacionNube ? "desconectado" : "inactivo"));
  });

  // ---------- Configuración: empresas ----------
  dom.btnMostrarFormEmpresa.addEventListener("click", () => {
    dom.formNuevaEmpresa.hidden = !dom.formNuevaEmpresa.hidden;
  });
  dom.btnGuardarNuevaEmpresa.addEventListener("click", agregarEmpresaPersonalizada);

  // ---------- Configuración: nube ----------
  dom.checkNube.addEventListener("change", alternarSincronizacionNube);

  // Tema automático: reaccionar a cambios del sistema operativo
  if (window.matchMedia) {
    window.matchMedia("(prefers-color-scheme: dark)").addEventListener("change", () => {
      if (estado.configuracion.tema === "auto") aplicarTema("auto");
    });
  }
}

function inicializarApp() {
  cargarConfiguracion();
  cargarEmpresas();
  cargarHistorial();
  inicializarFechaPorDefecto();
  registrarEventos();

  aplicarConfiguracionCompleta();

  if (!dom.inputNumeroProforma.value.trim()) {
    dom.inputNumeroProforma.value = sugerirNumeroProforma();
  }

  dom.selectEmpresa.value = Object.keys(empresas)[0] || "otra";
  cambiarEmpresa();
  actualizarTabla();
  actualizarTotal();
  actualizarVistaPrevia();
  renderizarReportes();

  // Restaurar el borrador autoguardado (si existe) al final, para que
  // sus valores ganen sobre los de fábrica de la empresa seleccionada.
  restaurarBorrador();
  actualizarTabla();
  actualizarTotal();
  actualizarVistaPrevia();

  cambiarVista("nueva");

  appIniciada = true;
  if (window.FirebaseSync) firebaseListo = true;
  if (firebaseListo) {
    conectarFirebase();
  } else {
    actualizarPildoraNube("desconectado");
  }
}

document.addEventListener("DOMContentLoaded", inicializarApp);
