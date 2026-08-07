/* =========================================================
   SISTEMA DE PROFORMAS - TRANSPORTE DE PERSONAL
   script.js
   ========================================================= */

/* =========================================================
   1. DATOS DE EMPRESAS
   ========================================================= */
const empresas = {
  mcdonalds: {
    nombre: "McDonald's",
    logo: "logos/mcdonalds.png",
    colorPrincipal: "#DA291C",
    colorSecundario: "#FFC72C"
  },
  kfc: {
    nombre: "KFC",
    logo: "logos/kfc.png",
    colorPrincipal: "#C8102E",
    colorSecundario: "#FFFFFF"
  },
  subway: {
    nombre: "Subway",
    logo: "logos/subway.png",
    colorPrincipal: "#006E44",
    colorSecundario: "#FFC72C"
  },
  pizzahut: {
    nombre: "Pizza Hut",
    logo: "logos/pizzahut.png",
    colorPrincipal: "#D3121A",
    colorSecundario: "#1E1E1E"
  },
  otra: {
    nombre: "Otra Empresa",
    logo: "logos/generica.png",
    colorPrincipal: "#64646E",
    colorSecundario: "#18181B"
  }
};

/* =========================================================
   2. ALMACENAMIENTO PERSISTENTE (localStorage)
   ========================================================= */
const CLAVE_HISTORIAL = "transroute_historial";
const CLAVE_CONFIGURACION = "transroute_configuracion";

/* =========================================================
   3. ESTADO GLOBAL DE LA APLICACIÓN
   ========================================================= */
const estado = {
  empresaActual: "mcdonalds",
  precioBase: 35,          // Precio configurable para 1 vuelta (35 o 40 USD)
  precioVueltaAdicional: 20, // Precio fijo por vuelta cuando vueltas >= 2
  recorridos: [],           // { id, hora, personas, vueltas, costo }
  idEdicionActual: null,    // id del recorrido en edición (null = ninguno)
  contadorId: 1,
  vistaActual: "nueva",     // "nueva" | "historial" | "configuracion"
  proformaIdEnEdicion: null, // id de la proforma del historial que se está sobrescribiendo (null = nueva)
  historial: [],             // proformas guardadas
  configuracion: {
    precioDefecto: 35,
    nombreTransportista: "TransRoute S.A."
  }
};

/* =========================================================
   3. REFERENCIAS AL DOM
   ========================================================= */
const dom = {
  selectEmpresa: document.getElementById("selectEmpresa"),
  empresaLogoPreview: document.getElementById("empresaLogoPreview"),
  empresaNombrePreview: document.getElementById("empresaNombrePreview"),

  inputFecha: document.getElementById("inputFecha"),
  inputNumeroProforma: document.getElementById("inputNumeroProforma"),
  inputSucursal: document.getElementById("inputSucursal"),
  inputObservaciones: document.getElementById("inputObservaciones"),
  selectPrecioVuelta: document.getElementById("selectPrecioVuelta"),

  inputHoraSalida: document.getElementById("inputHoraSalida"),
  inputPersonas: document.getElementById("inputPersonas"),
  inputVueltas: document.getElementById("inputVueltas"),
  btnAgregarRecorrido: document.getElementById("btnAgregarRecorrido"),

  tablaRecorridosBody: document.getElementById("tablaRecorridosBody"),
  filaVacia: document.getElementById("filaVacia"),
  badgeCantidadRecorridos: document.getElementById("badgeCantidadRecorridos"),

  subtotalValor: document.getElementById("subtotalValor"),
  totalValor: document.getElementById("totalValor"),

  templateFilaEdicion: document.getElementById("templateFilaEdicion"),

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

  // Configuración
  selectPrecioDefecto: document.getElementById("selectPrecioDefecto"),
  inputNombreTransportista: document.getElementById("inputNombreTransportista"),
  btnVaciarHistorial: document.getElementById("btnVaciarHistorial"),

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
   4. UTILIDADES
   ========================================================= */

/**
 * Formatea un número como moneda en dólares.
 * @param {number} valor
 * @returns {string}
 */
function formatearMoneda(valor) {
  return "$" + Number(valor).toFixed(2);
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
 * Formatea una fecha ISO (YYYY-MM-DD) a formato legible en español.
 * @param {string} fechaISO
 * @returns {string}
 */
function formatearFecha(fechaISO) {
  if (!fechaISO) return "—";
  const [anio, mes, dia] = fechaISO.split("-");
  const meses = [
    "Enero", "Febrero", "Marzo", "Abril", "Mayo", "Junio",
    "Julio", "Agosto", "Septiembre", "Octubre", "Noviembre", "Diciembre"
  ];
  return `${parseInt(dia, 10)} de ${meses[parseInt(mes, 10) - 1]}, ${anio}`;
}

/* =========================================================
   5. LÓGICA DE NEGOCIO - CÁLCULO DE COSTOS
   ========================================================= */

/**
 * Calcula el costo de un recorrido según las reglas de negocio.
 *
 * Regla exacta:
 *  - Si vueltas == 1  -> costo = precioBase (35 o 40 USD, configurable)
 *  - Si vueltas >= 2  -> costo = vueltas * precioVueltaAdicional (20 USD c/u)
 *
 * Ejemplos (precioVueltaAdicional = 20):
 *  1 vuelta  -> 35 (o 40 según configuración)
 *  3 vueltas -> 3 * 20 = 60
 *  5 vueltas -> 5 * 20 = 100
 *
 * La cantidad de personas NO afecta el costo. Válido para 1-14 personas.
 *
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

/* =========================================================
   6. CAMBIO DE EMPRESA
   ========================================================= */

/**
 * Actualiza toda la interfaz (logo, nombre, colores) según la empresa
 * seleccionada en el formulario.
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

  // Actualizar colores dinámicos vía variables CSS
  document.documentElement.style.setProperty("--empresa-primary", empresa.colorPrincipal);
  document.documentElement.style.setProperty("--empresa-secondary", empresa.colorSecundario);

  actualizarVistaPrevia();
}

/* =========================================================
   7. GESTIÓN DE RECORRIDOS (CRUD EN MEMORIA)
   ========================================================= */

/**
 * Lee los valores del formulario "Agregar Recorrido", valida,
 * calcula el costo y agrega el recorrido al estado.
 */
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

  const precioBase = parseInt(dom.selectPrecioVuelta.value, 10);
  const costo = calcularCosto(vueltas, precioBase, estado.precioVueltaAdicional);

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

/**
 * Elimina un recorrido del estado según su id y refresca la UI.
 * @param {number} id
 */
function eliminarRecorrido(id) {
  estado.recorridos = estado.recorridos.filter((recorrido) => recorrido.id !== id);

  if (estado.idEdicionActual === id) {
    estado.idEdicionActual = null;
  }

  actualizarTabla();
  actualizarTotal();
  actualizarVistaPrevia();
}

/**
 * Activa el modo edición para un recorrido específico, reemplazando
 * su fila en la tabla por una fila editable.
 * @param {number} id
 */
function editarRecorrido(id) {
  estado.idEdicionActual = id;
  actualizarTabla();
}

/**
 * Guarda los cambios realizados en la fila de edición activa,
 * recalcula el costo y vuelve al modo lectura.
 * @param {number} id
 */
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

  const precioBase = parseInt(dom.selectPrecioVuelta.value, 10);

  recorrido.hora = nuevaHora;
  recorrido.personas = nuevasPersonas;
  recorrido.vueltas = nuevasVueltas;
  recorrido.costo = calcularCosto(nuevasVueltas, precioBase, estado.precioVueltaAdicional);

  estado.idEdicionActual = null;

  actualizarTabla();
  actualizarTotal();
  actualizarVistaPrevia();
}

/**
 * Cancela la edición activa sin guardar cambios.
 */
function cancelarEdicionRecorrido() {
  estado.idEdicionActual = null;
  actualizarTabla();
}

/**
 * Recalcula el costo de todos los recorridos existentes cuando cambia
 * el precio base configurable (35 / 40 USD), manteniendo consistencia.
 */
function recalcularTodosLosCostos() {
  const precioBase = parseInt(dom.selectPrecioVuelta.value, 10);

  estado.recorridos.forEach((recorrido) => {
    recorrido.costo = calcularCosto(recorrido.vueltas, precioBase, estado.precioVueltaAdicional);
  });

  actualizarTabla();
  actualizarTotal();
  actualizarVistaPrevia();
}

/* =========================================================
   8. RENDERIZADO DE TABLA
   ========================================================= */

/**
 * Construye y renderiza el contenido de la tabla de recorridos
 * a partir del estado actual. Maneja tanto filas normales como
 * la fila en modo edición.
 */
function actualizarTabla() {
  dom.tablaRecorridosBody.innerHTML = "";

  if (estado.recorridos.length === 0) {
    const filaVacia = document.createElement("tr");
    filaVacia.className = "empty-row";
    filaVacia.innerHTML = `<td colspan="5">Aún no se han agregado recorridos.</td>`;
    dom.tablaRecorridosBody.appendChild(filaVacia);
    dom.badgeCantidadRecorridos.textContent = "0";
    return;
  }

  estado.recorridos.forEach((recorrido) => {
    if (estado.idEdicionActual === recorrido.id) {
      dom.tablaRecorridosBody.appendChild(crearFilaEdicion(recorrido));
    } else {
      dom.tablaRecorridosBody.appendChild(crearFilaLectura(recorrido));
    }
  });

  dom.badgeCantidadRecorridos.textContent = String(estado.recorridos.length);
}

/**
 * Crea una fila <tr> en modo lectura para un recorrido.
 * @param {{id:number, hora:string, personas:number, vueltas:number, costo:number}} recorrido
 * @returns {HTMLTableRowElement}
 */
function crearFilaLectura(recorrido) {
  const fila = document.createElement("tr");
  fila.dataset.id = recorrido.id;

  fila.innerHTML = `
    <td>${formatearHora(recorrido.hora)}</td>
    <td>${recorrido.personas}</td>
    <td>${recorrido.vueltas}</td>
    <td>${formatearMoneda(recorrido.costo)}</td>
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

/**
 * Crea una fila <tr> en modo edición para un recorrido, a partir
 * de la plantilla <template id="templateFilaEdicion">.
 * @param {{id:number, hora:string, personas:number, vueltas:number, costo:number}} recorrido
 * @returns {HTMLTableRowElement}
 */
function crearFilaEdicion(recorrido) {
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
  celdaCosto.textContent = formatearMoneda(recorrido.costo);

  // Recalcular el costo en vivo mientras se edita el número de vueltas
  inputVueltas.addEventListener("input", () => {
    const precioBase = parseInt(dom.selectPrecioVuelta.value, 10);
    const vueltasTemp = parseInt(inputVueltas.value, 10) || 0;
    celdaCosto.textContent = formatearMoneda(calcularCosto(vueltasTemp, precioBase, estado.precioVueltaAdicional));
  });

  fila.querySelector(".btn-guardar-edicion").addEventListener("click", () => guardarEdicionRecorrido(recorrido.id));
  fila.querySelector(".btn-cancelar-edicion").addEventListener("click", cancelarEdicionRecorrido);

  return fila;
}

/* =========================================================
   9. TOTALES
   ========================================================= */

/**
 * Calcula el subtotal y total a partir de los recorridos actuales
 * y actualiza los elementos correspondientes en el DOM.
 * (Subtotal y Total son iguales por ahora; se separan para permitir
 * agregar impuestos/descuentos en el futuro sin romper la estructura).
 */
function actualizarTotal() {
  const subtotal = estado.recorridos.reduce((acumulado, recorrido) => acumulado + recorrido.costo, 0);
  const total = subtotal; // Punto de extensión: aquí se podrían aplicar impuestos o descuentos.

  dom.subtotalValor.textContent = formatearMoneda(subtotal);
  dom.totalValor.textContent = formatearMoneda(total);
}

/* =========================================================
   10. VISTA PREVIA DE LA PROFORMA
   ========================================================= */

/**
 * Sincroniza la vista previa del documento con el estado actual
 * del formulario: empresa, datos generales, tabla y total.
 */
function actualizarVistaPrevia() {
  const empresa = empresas[estado.empresaActual];

  dom.previewNombreTransportista.textContent = estado.configuracion.nombreTransportista;
  dom.previewLogoCliente.src = empresa.logo;
  dom.previewLogoCliente.alt = "Logo " + empresa.nombre;
  dom.previewEmpresaNombre.textContent = empresa.nombre;

  dom.previewFecha.textContent = formatearFecha(dom.inputFecha.value);
  dom.previewNumero.textContent = dom.inputNumeroProforma.value.trim() || "—";
  dom.previewSucursal.textContent = dom.inputSucursal.value.trim() || "—";
  dom.previewObservaciones.textContent = dom.inputObservaciones.value.trim() || "—";

  // Tabla de la vista previa
  dom.previewTablaBody.innerHTML = "";

  if (estado.recorridos.length === 0) {
    dom.previewTablaBody.innerHTML = `<tr class="empty-row"><td colspan="4">Sin recorridos aún.</td></tr>`;
  } else {
    estado.recorridos.forEach((recorrido) => {
      const fila = document.createElement("tr");
      fila.innerHTML = `
        <td>${formatearHora(recorrido.hora)}</td>
        <td>${recorrido.personas}</td>
        <td>${recorrido.vueltas}</td>
        <td>${formatearMoneda(recorrido.costo)}</td>
      `;
      dom.previewTablaBody.appendChild(fila);
    });
  }

  const total = estado.recorridos.reduce((acumulado, recorrido) => acumulado + recorrido.costo, 0);
  dom.previewTotal.textContent = formatearMoneda(total);
}

/* =========================================================
   11. NOTIFICACIONES (TOAST)
   ========================================================= */
let toastTimeoutId = null;

/**
 * Muestra un mensaje breve flotante en la esquina inferior derecha.
 * @param {string} mensaje
 * @param {"success"|"danger"|"neutral"} tipo
 */
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
   12. CONFIGURACIÓN PERSISTENTE
   ========================================================= */

/**
 * Carga la configuración guardada en localStorage (si existe) y la
 * aplica al estado y al formulario correspondiente.
 */
function cargarConfiguracion() {
  try {
    const guardada = JSON.parse(localStorage.getItem(CLAVE_CONFIGURACION));
    if (guardada) {
      estado.configuracion = Object.assign({}, estado.configuracion, guardada);
    }
  } catch (error) {
    console.warn("No se pudo leer la configuración guardada:", error);
  }

  dom.selectPrecioDefecto.value = String(estado.configuracion.precioDefecto);
  dom.inputNombreTransportista.value = estado.configuracion.nombreTransportista;
  dom.selectPrecioVuelta.value = String(estado.configuracion.precioDefecto);
}

/**
 * Persiste la configuración actual del formulario de Configuración
 * en localStorage y actualiza el estado en memoria.
 */
function guardarConfiguracion() {
  estado.configuracion.precioDefecto = parseInt(dom.selectPrecioDefecto.value, 10);
  estado.configuracion.nombreTransportista = dom.inputNombreTransportista.value.trim() || "TransRoute S.A.";

  localStorage.setItem(CLAVE_CONFIGURACION, JSON.stringify(estado.configuracion));

  actualizarVistaPrevia();
  mostrarToast("Configuración guardada", "success");
}

/* =========================================================
   13. HISTORIAL PERSISTENTE (CRUD SOBRE LOCALSTORAGE)
   ========================================================= */

/**
 * Lee el historial de proformas guardadas desde localStorage y
 * lo carga en el estado en memoria.
 */
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

/**
 * Escribe el historial en memoria hacia localStorage.
 */
function persistirHistorial() {
  localStorage.setItem(CLAVE_HISTORIAL, JSON.stringify(estado.historial));
  actualizarBadgeHistorial();
}

/**
 * Actualiza el contador de proformas guardadas junto al ítem
 * de navegación "Historial".
 */
function actualizarBadgeHistorial() {
  const cantidad = estado.historial.length;
  dom.navBadgeHistorial.textContent = String(cantidad);
  dom.navBadgeHistorial.hidden = cantidad === 0;
  dom.badgeHistorialTotal.textContent = String(cantidad);
}

/**
 * Genera el próximo número de proforma sugerido (PF-0001, PF-0002...)
 * a partir de la cantidad de proformas guardadas hasta ahora.
 * @returns {string}
 */
function sugerirNumeroProforma() {
  const siguiente = estado.historial.length + 1;
  return "PF-" + String(siguiente).padStart(4, "0");
}

/**
 * Toma el estado actual del formulario (empresa, datos generales,
 * recorridos y totales) y lo guarda como una nueva entrada del
 * historial, o sobrescribe la entrada en edición si corresponde.
 */
function guardarProforma() {
  if (estado.recorridos.length === 0) {
    mostrarToast("Agrega al menos un recorrido antes de guardar", "danger");
    return;
  }

  if (!dom.inputNumeroProforma.value.trim()) {
    dom.inputNumeroProforma.value = sugerirNumeroProforma();
  }

  const empresa = empresas[estado.empresaActual];
  const subtotal = estado.recorridos.reduce((acc, r) => acc + r.costo, 0);

  const proforma = {
    id: estado.proformaIdEnEdicion || ("prf_" + Date.now()),
    empresaClave: estado.empresaActual,
    empresaNombre: empresa.nombre,
    fecha: dom.inputFecha.value,
    numeroProforma: dom.inputNumeroProforma.value.trim(),
    sucursal: dom.inputSucursal.value.trim(),
    observaciones: dom.inputObservaciones.value.trim(),
    precioBase: parseInt(dom.selectPrecioVuelta.value, 10),
    recorridos: estado.recorridos.map((r) => ({ hora: r.hora, personas: r.personas, vueltas: r.vueltas, costo: r.costo })),
    subtotal: subtotal,
    total: subtotal,
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
  mostrarToast("Proforma guardada correctamente", "success");
}

/**
 * Elimina una proforma del historial por su id, previa confirmación.
 * @param {string} id
 */
function eliminarProformaHistorial(id) {
  const confirmado = confirm("¿Eliminar esta proforma del historial? Esta acción no se puede deshacer.");
  if (!confirmado) return;

  estado.historial = estado.historial.filter((p) => p.id !== id);
  persistirHistorial();
  renderizarHistorial();
  mostrarToast("Proforma eliminada", "success");
}

/**
 * Vacía por completo el historial de proformas, previa confirmación.
 */
function vaciarHistorial() {
  if (estado.historial.length === 0) {
    mostrarToast("El historial ya está vacío", "danger");
    return;
  }

  const confirmado = confirm("¿Vaciar todo el historial de proformas? Esta acción no se puede deshacer.");
  if (!confirmado) return;

  estado.historial = [];
  persistirHistorial();
  renderizarHistorial();
  mostrarToast("Historial vaciado", "success");
}

/**
 * Carga una proforma guardada de vuelta en el formulario "Nueva
 * Proforma" para poder consultarla o seguir editándola, y cambia
 * a esa vista.
 * @param {string} id
 */
function cargarProformaEnFormulario(id) {
  const proforma = estado.historial.find((p) => p.id === id);
  if (!proforma) return;

  estado.proformaIdEnEdicion = proforma.id;
  estado.empresaActual = proforma.empresaClave;
  estado.recorridos = proforma.recorridos.map((r) => ({ id: estado.contadorId++, ...r }));

  dom.selectEmpresa.value = proforma.empresaClave;
  dom.inputFecha.value = proforma.fecha;
  dom.inputNumeroProforma.value = proforma.numeroProforma;
  dom.inputSucursal.value = proforma.sucursal;
  dom.inputObservaciones.value = proforma.observaciones;
  dom.selectPrecioVuelta.value = String(proforma.precioBase);

  cambiarEmpresa();
  actualizarTabla();
  actualizarTotal();
  actualizarVistaPrevia();
  cambiarVista("nueva");
  mostrarToast("Proforma cargada en el formulario", "success");
}

/**
 * Construye y renderiza la tabla del historial a partir del
 * estado en memoria.
 */
function renderizarHistorial() {
  dom.tablaHistorialBody.innerHTML = "";

  if (estado.historial.length === 0) {
    dom.tablaHistorialBody.innerHTML = `<tr class="empty-row" id="filaVaciaHistorial"><td colspan="6">Todavía no has guardado ninguna proforma.</td></tr>`;
    return;
  }

  estado.historial.forEach((proforma) => {
    const fila = document.createElement("tr");
    fila.innerHTML = `
      <td>${formatearFecha(proforma.fecha)}</td>
      <td>${proforma.numeroProforma || "—"}</td>
      <td>${proforma.empresaNombre}</td>
      <td>${proforma.sucursal || "—"}</td>
      <td>${formatearMoneda(proforma.total)}</td>
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
   14. NAVEGACIÓN ENTRE VISTAS
   ========================================================= */

const TITULOS_VISTA = {
  nueva: { titulo: "Nueva Proforma", subtitulo: "Genera una proforma de transporte de personal en segundos." },
  historial: { titulo: "Historial", subtitulo: "Consulta, reimprime o elimina proformas guardadas anteriormente." },
  configuracion: { titulo: "Configuración", subtitulo: "Ajusta los valores por defecto del sistema." }
};

/**
 * Cambia la vista activa (Nueva Proforma / Historial / Configuración),
 * actualizando el título, el resaltado del menú lateral y qué
 * bloque de contenido es visible.
 * @param {"nueva"|"historial"|"configuracion"} nombreVista
 */
function cambiarVista(nombreVista) {
  estado.vistaActual = nombreVista;

  dom.vistaNueva.hidden = nombreVista !== "nueva";
  dom.vistaHistorial.hidden = nombreVista !== "historial";
  dom.vistaConfiguracion.hidden = nombreVista !== "configuracion";
  dom.accionesNuevaProforma.hidden = nombreVista !== "nueva";

  dom.tituloVista.textContent = TITULOS_VISTA[nombreVista].titulo;
  dom.subtituloVista.textContent = TITULOS_VISTA[nombreVista].subtitulo;

  dom.navItems.forEach((item) => {
    item.classList.toggle("active", item.dataset.vista === nombreVista);
  });

  if (nombreVista === "historial") {
    renderizarHistorial();
  }
}

/* =========================================================
   15. RESET DEL FORMULARIO ("NUEVA PROFORMA")
   ========================================================= */

/**
 * Limpia por completo el formulario para iniciar una proforma
 * desde cero, sin afectar el historial ya guardado.
 */
function iniciarProformaNueva() {
  estado.recorridos = [];
  estado.idEdicionActual = null;
  estado.proformaIdEnEdicion = null;

  dom.selectEmpresa.value = "mcdonalds";
  dom.inputSucursal.value = "";
  dom.inputObservaciones.value = "";
  dom.inputNumeroProforma.value = sugerirNumeroProforma();
  dom.selectPrecioVuelta.value = String(estado.configuracion.precioDefecto);
  dom.inputHoraSalida.value = "";
  dom.inputPersonas.value = 1;
  dom.inputVueltas.value = 1;

  inicializarFechaPorDefecto();
  cambiarEmpresa();
  actualizarTabla();
  actualizarTotal();
  actualizarVistaPrevia();
  cambiarVista("nueva");
  mostrarToast("Formulario listo para una nueva proforma", "success");
}

/* =========================================================
   16. INICIALIZACIÓN Y EVENTOS
   ========================================================= */

/**
 * Establece la fecha actual por defecto en el campo de fecha.
 */
function inicializarFechaPorDefecto() {
  const hoy = new Date();
  const anio = hoy.getFullYear();
  const mes = String(hoy.getMonth() + 1).padStart(2, "0");
  const dia = String(hoy.getDate()).padStart(2, "0");
  dom.inputFecha.value = `${anio}-${mes}-${dia}`;
}

/**
 * Registra todos los listeners de eventos de la aplicación.
 */
function registrarEventos() {
  dom.selectEmpresa.addEventListener("change", cambiarEmpresa);

  dom.inputFecha.addEventListener("input", actualizarVistaPrevia);
  dom.inputNumeroProforma.addEventListener("input", actualizarVistaPrevia);
  dom.inputSucursal.addEventListener("input", actualizarVistaPrevia);
  dom.inputObservaciones.addEventListener("input", actualizarVistaPrevia);

  dom.selectPrecioVuelta.addEventListener("change", recalcularTodosLosCostos);

  dom.btnAgregarRecorrido.addEventListener("click", agregarRecorrido);

  // Permitir agregar recorrido presionando Enter dentro del mini-formulario
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
      const confirmado = confirm("¿Descartar el formulario actual y empezar una proforma nueva?");
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

  dom.selectPrecioDefecto.addEventListener("change", guardarConfiguracion);
  dom.inputNombreTransportista.addEventListener("change", guardarConfiguracion);
  dom.btnVaciarHistorial.addEventListener("click", vaciarHistorial);
}

/**
 * Punto de entrada de la aplicación.
 */
function inicializarApp() {
  cargarConfiguracion();
  cargarHistorial();
  inicializarFechaPorDefecto();
  registrarEventos();

  dom.selectPrecioVuelta.value = String(estado.configuracion.precioDefecto);

  if (!dom.inputNumeroProforma.value.trim()) {
    dom.inputNumeroProforma.value = sugerirNumeroProforma();
  }

  cambiarEmpresa();     // Aplica empresa por defecto (McDonald's)
  actualizarTabla();
  actualizarTotal();
  actualizarVistaPrevia();
  cambiarVista("nueva");
}

document.addEventListener("DOMContentLoaded", inicializarApp);