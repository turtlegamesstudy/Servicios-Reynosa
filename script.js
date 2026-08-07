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
  configuracion: {
    precioDefecto: 35,
    precioVueltaAdicionalDefecto: 20,
    monedaDefecto: "USD",
    nombreTransportista: "TransRoute S.A.",
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
  brandLogoMaster: document.getElementById("brandLogoMaster")
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

function agregarRecorrido() {
  const hora = dom.inputHoraSalida.value;
  const personas = parseInt(dom.inputPersonas.value, 10);
  const vueltas = parseInt(dom.inputVueltas.value, 10);

  if (!hora) {
    alert("Debes indicar la hora de salida.");
    return;
  }

  if (!personas || personas < 1 || personas > 14) {
    alert("La cantidad de personas debe estar entre 1 y 14.");
    return;
  }

  if (!vueltas || vueltas < 1) {
    alert("La cantidad de vueltas debe ser al menos 1.");
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
}

function eliminarRecorrido(id) {
  estado.recorridos = estado.recorridos.filter((recorrido) => recorrido.id !== id);

  if (estado.idEdicionActual === id) {
    estado.idEdicionActual = null;
  }

  actualizarTabla();
  actualizarTotal();
  actualizarVistaPrevia();
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
    alert("La hora de salida es obligatoria.");
    return;
  }

  if (!nuevasPersonas || nuevasPersonas < 1 || nuevasPersonas > 14) {
    alert("La cantidad de personas debe estar entre 1 y 14.");
    return;
  }

  if (!nuevasVueltas || nuevasVueltas < 1) {
    alert("La cantidad de vueltas debe ser al menos 1.");
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

  fila.innerHTML = `
    <td>${formatearHora(recorrido.hora)}</td>
    <td>${recorrido.personas}</td>
    <td>${recorrido.vueltas}</td>
    <td>${formatearMoneda(recorrido.costo, moneda)}</td>
    <td class="th-actions">
      <button class="icon-btn btn-editar" title="Editar" aria-label="Editar recorrido">
        <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"></path><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"></path></svg>
      </button>
      <button class="icon-btn icon-btn-danger btn-eliminar" title="Eliminar" aria-label="Eliminar recorrido">
        <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polyline points="3 6 5 6 21 6"></polyline><path d="M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6"></path><path d="M10 11v6"></path><path d="M14 11v6"></path><path d="M9 6V4a1 1 0 0 1 1-1h4a1 1 0 0 1 1 1v2"></path></svg>
      </button>
    </td>
  `;

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

  const confirmado = confirm(estado.configuracion.idioma === "en"
    ? "Delete this company? This cannot be undone."
    : "¿Eliminar esta empresa? Esta acción no se puede deshacer.");
  if (!confirmado) return;

  delete empresas[clave];
  persistirEmpresas();
  renderizarListaEmpresasConfig();
  renderizarSelectEmpresa();

  if (estado.empresaActual === clave) {
    dom.selectEmpresa.value = "otra";
    cambiarEmpresa();
  }

  mostrarToast(t("btn_eliminar_empresa") + " ✓", "success");
}

/**
 * Crea una nueva empresa personalizada a partir del formulario
 * "Agregar empresa" en Configuración.
 */
function agregarEmpresaPersonalizada() {
  const nombre = dom.nuevaEmpresaNombre.value.trim();

  if (!nombre) {
    alert(estado.configuracion.idioma === "en" ? "The company name is required." : "El nombre de la empresa es obligatorio.");
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
  const siguiente = estado.historial.length + 1;
  return "PF-" + String(siguiente).padStart(4, "0");
}

function guardarProforma() {
  if (estado.recorridos.length === 0) {
    mostrarToast(estado.configuracion.idioma === "en" ? "Add at least one trip before saving" : "Agrega al menos un recorrido antes de guardar", "danger");
    return;
  }

  if (!dom.inputNumeroProforma.value.trim()) {
    dom.inputNumeroProforma.value = sugerirNumeroProforma();
  }

  const empresa = empresaActiva();
  const { subtotal, descuento, impuesto, total } = calcularTotales();

  const proforma = {
    id: estado.proformaIdEnEdicion || ("prf_" + Date.now()),
    empresaClave: estado.empresaActual,
    empresaNombre: empresa.nombre,
    fecha: dom.inputFecha.value,
    numeroProforma: dom.inputNumeroProforma.value.trim(),
    sucursal: dom.inputSucursal.value.trim(),
    observaciones: dom.inputObservaciones.value.trim(),
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
  renderizarHistorial();
  mostrarToast(estado.configuracion.idioma === "en" ? "Quote saved successfully" : "Proforma guardada correctamente", "success");
}

function eliminarProformaHistorial(id) {
  const confirmado = confirm(estado.configuracion.idioma === "en"
    ? "Delete this quote from history? This cannot be undone."
    : "¿Eliminar esta proforma del historial? Esta acción no se puede deshacer.");
  if (!confirmado) return;

  estado.historial = estado.historial.filter((p) => p.id !== id);
  persistirHistorial();
  renderizarHistorial();
  mostrarToast(estado.configuracion.idioma === "en" ? "Quote deleted" : "Proforma eliminada", "success");
}

function vaciarHistorial() {
  if (estado.historial.length === 0) {
    mostrarToast(estado.configuracion.idioma === "en" ? "History is already empty" : "El historial ya está vacío", "danger");
    return;
  }

  const confirmado = confirm(estado.configuracion.idioma === "en"
    ? "Clear the entire quote history? This cannot be undone."
    : "¿Vaciar todo el historial de proformas? Esta acción no se puede deshacer.");
  if (!confirmado) return;

  estado.historial = [];
  persistirHistorial();
  renderizarHistorial();
  mostrarToast(estado.configuracion.idioma === "en" ? "History cleared" : "Historial vaciado", "success");
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
  mostrarToast(estado.configuracion.idioma === "en" ? "Quote loaded into the form" : "Proforma cargada en el formulario", "success");
}

function renderizarHistorial() {
  dom.tablaHistorialBody.innerHTML = "";

  if (estado.historial.length === 0) {
    dom.tablaHistorialBody.innerHTML = `<tr class="empty-row" id="filaVaciaHistorial"><td colspan="6">${t("empty_historial")}</td></tr>`;
    return;
  }

  estado.historial.forEach((proforma) => {
    const fila = document.createElement("tr");
    fila.innerHTML = `
      <td>${formatearFecha(proforma.fecha)}</td>
      <td>${proforma.numeroProforma || "—"}</td>
      <td>${proforma.empresaNombre}</td>
      <td>${proforma.sucursal || "—"}</td>
      <td>${formatearMoneda(proforma.total, proforma.moneda)}</td>
      <td class="th-actions">
        <button class="icon-btn btn-hist-abrir" title="Abrir en el formulario">
          <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"></path><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"></path></svg>
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
    fila.querySelector(".btn-hist-pdf").addEventListener("click", () => generarPDFDesdeHistorial(proforma.id));
    fila.querySelector(".btn-hist-eliminar").addEventListener("click", () => eliminarProformaHistorial(proforma.id));

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
    configuracion: { titulo: "nav_config", subtitulo: null }
  };

  const SUBTITULOS = {
    nueva: { es: "Genera una proforma de transporte de personal en segundos.", en: "Generate a staff transportation quote in seconds." },
    historial: { es: "Consulta, reimprime o elimina proformas guardadas anteriormente.", en: "Review, reprint or delete previously saved quotes." },
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
  mostrarToast(estado.configuracion.idioma === "en" ? "Form ready for a new quote" : "Formulario listo para una nueva proforma", "success");
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

  dom.btnAgregarRecorrido.addEventListener("click", agregarRecorrido);

  [dom.inputHoraSalida, dom.inputPersonas, dom.inputVueltas].forEach((campo) => {
    campo.addEventListener("keydown", (evento) => {
      if (evento.key === "Enter") {
        evento.preventDefault();
        agregarRecorrido();
      }
    });
  });

  dom.btnGenerarPDF.addEventListener("click", generarPDF);
  dom.btnGuardarProforma.addEventListener("click", guardarProforma);
  dom.btnNuevaProforma.addEventListener("click", () => {
    if (estado.recorridos.length > 0) {
      const confirmado = confirm(estado.configuracion.idioma === "en"
        ? "Discard the current form and start a new quote?"
        : "¿Descartar el formulario actual y empezar una proforma nueva?");
      if (!confirmado) return;
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
  dom.btnVaciarHistorial.addEventListener("click", vaciarHistorial);

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
