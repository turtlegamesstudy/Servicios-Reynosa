/* =========================================================
   INTERNACIONALIZACIÓN (ES / EN)
   i18n.js
   Diccionario simple + aplicador de traducciones al DOM.
   Se apoya en atributos data-i18n / data-i18n-placeholder /
   data-i18n-title colocados en index.html.
   ========================================================= */

const DICCIONARIO_IDIOMAS = {
  nav_nueva:            { es: "Nueva Proforma", en: "New Quote" },
  nav_historial:        { es: "Historial", en: "History" },
  nav_config:           { es: "Configuración", en: "Settings" },
  brand_subtitle:       { es: "Sistema de Proformas", en: "Quote System" },

  btn_nueva:            { es: "Nueva", en: "New" },
  btn_guardar:          { es: "Guardar", en: "Save" },
  btn_generar_pdf:      { es: "Generar PDF", en: "Generate PDF" },

  card_empresa_cliente: { es: "Empresa Cliente", en: "Client Company" },
  label_empresa:        { es: "Empresa", en: "Company" },
  opt_otra:             { es: "Otra", en: "Other" },
  empresa_preview_tag:  { es: "Cliente seleccionado", en: "Selected client" },

  card_datos_generales: { es: "Datos Generales", en: "General Details" },
  label_fecha:          { es: "Fecha", en: "Date" },
  label_numero_proforma:{ es: "Número de Proforma", en: "Quote Number" },
  label_sucursal:       { es: "Sucursal", en: "Branch" },
  label_precio_base:    { es: "Precio por 1 vuelta", en: "Price per 1 trip" },
  label_precio_adicional:{ es: "Precio por vuelta adicional", en: "Price per extra trip" },
  label_descuento:      { es: "Descuento (%)", en: "Discount (%)" },
  label_impuesto:       { es: "Impuesto (%)", en: "Tax (%)" },
  label_observaciones:  { es: "Observaciones", en: "Notes" },
  placeholder_sucursal: { es: "Ej. Sucursal Centro", en: "E.g. Downtown Branch" },
  placeholder_numero:   { es: "Ej. PF-0001", en: "E.g. PF-0001" },
  placeholder_obs:      { es: "Notas adicionales sobre la proforma...", en: "Additional notes about the quote..." },

  card_agregar_recorrido:{ es: "Agregar Recorrido", en: "Add Trip" },
  label_hora_salida:    { es: "Hora de salida", en: "Departure time" },
  label_personas:       { es: "Cantidad de personas", en: "Number of people" },
  label_vueltas:        { es: "Cantidad de vueltas", en: "Number of trips" },
  btn_agregar_recorrido:{ es: "Agregar recorrido", en: "Add trip" },

  card_recorridos:      { es: "Recorridos", en: "Trips" },
  th_hora:              { es: "Hora", en: "Time" },
  th_personas:          { es: "Personas", en: "People" },
  th_vueltas:           { es: "Vueltas", en: "Trips" },
  th_costo:             { es: "Costo", en: "Cost" },
  th_acciones:          { es: "Acciones", en: "Actions" },
  th_empresa:           { es: "Empresa", en: "Company" },
  th_total:             { es: "Total", en: "Total" },
  th_fecha:             { es: "Fecha", en: "Date" },
  th_numero_proforma:   { es: "N° Proforma", en: "Quote #" },
  empty_recorridos:     { es: "Aún no se han agregado recorridos.", en: "No trips added yet." },

  label_subtotal:       { es: "Subtotal", en: "Subtotal" },
  label_total:          { es: "Total", en: "Total" },

  card_vista_previa:    { es: "Vista Previa", en: "Preview" },
  tag_en_vivo:          { es: "En vivo", en: "Live" },
  preview_titulo_doc:   { es: "Proforma de Servicio de Transporte", en: "Transportation Service Quote" },
  preview_transporte:   { es: "Transporte de Personal", en: "Staff Transportation" },

  card_historial_titulo:{ es: "Proformas guardadas", en: "Saved Quotes" },
  empty_historial:      { es: "Todavía no has guardado ninguna proforma.", en: "You haven't saved any quotes yet." },
  empty_historial_filtro: { es: "Ninguna proforma coincide con la búsqueda o filtros.", en: "No quotes match the search or filters." },

  card_apariencia:      { es: "Apariencia", en: "Appearance" },
  label_tema:           { es: "Tema", en: "Theme" },
  opt_tema_claro:       { es: "Claro", en: "Light" },
  opt_tema_oscuro:      { es: "Oscuro", en: "Dark" },
  opt_tema_auto:        { es: "Automático", en: "Auto" },
  label_color_acento:   { es: "Color de acento", en: "Accent color" },
  label_densidad:       { es: "Densidad de la interfaz", en: "Interface density" },
  opt_densidad_comoda:  { es: "Cómoda", en: "Comfortable" },
  opt_densidad_compacta:{ es: "Compacta", en: "Compact" },
  hint_apariencia:      { es: "Estas preferencias se guardan en este equipo y se aplican de inmediato.", en: "These preferences are saved on this device and apply instantly." },

  card_idioma:          { es: "Idioma", en: "Language" },
  label_idioma:         { es: "Idioma de la aplicación", en: "Application language" },
  hint_idioma:          { es: "Cambia el idioma de toda la interfaz.", en: "Changes the language of the entire interface." },

  card_precios_empresas:{ es: "Precios y Empresas", en: "Pricing & Companies" },
  hint_precios_empresas:{ es: "Personaliza el precio base, el precio por vuelta adicional, la moneda y los colores de cada empresa cliente.", en: "Customize the base price, extra-trip price, currency and colors for each client company." },
  label_moneda_defecto: { es: "Moneda por defecto", en: "Default currency" },
  label_precio_defecto: { es: "Precio base por defecto", en: "Default base price" },
  label_precio_adicional_defecto: { es: "Precio adicional por defecto", en: "Default extra-trip price" },
  btn_agregar_empresa:  { es: "Agregar empresa", en: "Add company" },
  label_nombre_empresa: { es: "Nombre", en: "Name" },
  label_logo_empresa:   { es: "Logo (ruta o URL)", en: "Logo (path or URL)" },
  label_color_principal:{ es: "Color principal", en: "Primary color" },
  label_color_secundario:{ es: "Color secundario", en: "Secondary color" },
  label_moneda:         { es: "Moneda", en: "Currency" },
  btn_eliminar_empresa: { es: "Eliminar", en: "Delete" },
  btn_guardar_empresa:  { es: "Guardar cambios", en: "Save changes" },

  card_transportista:   { es: "Datos de la empresa transportista", en: "Carrier company details" },
  label_nombre_transportista:{ es: "Nombre de la empresa", en: "Company name" },

  card_nube:            { es: "Sincronización en la nube", en: "Cloud sync" },
  label_activar_nube:   { es: "Sincronizar con Firebase", en: "Sync with Firebase" },
  hint_nube:            { es: "Cuando está activo, tu historial, empresas y configuración se guardan también en la nube y se comparten entre dispositivos.", en: "When enabled, your history, companies and settings are also saved to the cloud and shared across devices." },
  estado_nube_conectado:{ es: "Conectado", en: "Connected" },
  estado_nube_desconectado:{ es: "Sin conexión", en: "Offline" },
  estado_nube_inactivo: { es: "Sincronización desactivada", en: "Sync disabled" },

  card_historial_config:{ es: "Historial", en: "History" },
  hint_vaciar_historial:{ es: "Elimina de forma permanente todas las proformas guardadas en este equipo y en la nube.", en: "Permanently deletes every saved quote on this device and in the cloud." },
  btn_vaciar_historial: { es: "Vaciar historial", en: "Clear history" },

  /* ---------- Reportes / Dashboard ---------- */
  card_resumen:         { es: "Resumen general", en: "Overview" },
  stat_total_mes:       { es: "Facturado este mes", en: "Billed this month" },
  stat_proformas_mes:   { es: "Proformas este mes", en: "Quotes this month" },
  stat_promedio:        { es: "Ticket promedio", en: "Average quote" },
  stat_total_historico: { es: "Total histórico", en: "All-time total" },
  chart_por_mes:        { es: "Facturado por mes (últimos 6)", en: "Billed per month (last 6)" },
  chart_por_empresa:    { es: "Facturado por cliente (histórico)", en: "Billed per client (all-time)" },
  btn_export_csv:       { es: "Exportar CSV", en: "Export CSV" },
  empty_reportes:       { es: "Aún no hay datos suficientes. Guarda algunas proformas para ver reportes.", en: "Not enough data yet. Save some quotes to see reports." },
  toast_csv_exportado:  { es: "CSV exportado", en: "CSV exported" },
  hint_reportes:        { es: "Resumen basado en el historial de proformas guardadas.", en: "Summary based on the saved quote history." },

  /* ---------- Toolbar historial ---------- */
  placeholder_buscar:   { es: "Buscar por empresa, sucursal o número…", en: "Search by company, branch or number…" },
  label_filtrar_empresa:{ es: "Todas las empresas", en: "All companies" },
  label_ordenar:        { es: "Ordenar", en: "Sort" },
  orden_recientes:      { es: "Más recientes", en: "Newest first" },
  orden_antiguos:       { es: "Más antiguas", en: "Oldest first" },
  orden_mayor:          { es: "Mayor total", en: "Highest total" },
  orden_menor:          { es: "Menor total", en: "Lowest total" },
  th_estado:            { es: "Estado", en: "Status" },

  /* ---------- Estados de proforma ---------- */
  estado_borrador:      { es: "Borrador", en: "Draft" },
  estado_enviada:       { es: "Enviada", en: "Sent" },
  estado_aprobada:      { es: "Aprobada", en: "Approved" },
  estado_rechazada:     { es: "Rechazada", en: "Rejected" },

  /* ---------- Acciones / modal ---------- */
  btn_duplicar:         { es: "Duplicar", en: "Duplicate" },
  btn_ver:              { es: "Abrir en el formulario", en: "Open in form" },
  modal_titulo:         { es: "Confirmar acción", en: "Confirm action" },
  modal_cancelar:       { es: "Cancelar", en: "Cancel" },
  modal_confirmar:      { es: "Confirmar", en: "Confirm" },
  modal_eliminar_proforma: { es: "¿Eliminar esta proforma del historial? Esta acción no se puede deshacer.", en: "Delete this quote from history? This cannot be undone." },
  modal_vaciar:         { es: "¿Vaciar todo el historial de proformas? Esta acción no se puede deshacer.", en: "Clear the entire quote history? This cannot be undone." },
  modal_eliminar_empresa:  { es: "¿Eliminar esta empresa? Esta acción no se puede deshacer.", en: "Delete this company? This cannot be undone." },
  modal_descartar:      { es: "¿Descartar el formulario actual y empezar una proforma nueva?", en: "Discard the current form and start a new quote?" },

  /* ---------- Validación ---------- */
  err_hora:             { es: "Debes indicar la hora de salida.", en: "You must enter a departure time." },
  err_personas:         { es: "La cantidad de personas debe estar entre 1 y 14.", en: "Number of people must be between 1 and 14." },
  err_vueltas:          { es: "La cantidad de vueltas debe ser al menos 1.", en: "Number of trips must be at least 1." },

  /* ---------- Toasts ---------- */
  toast_guardada:       { es: "Proforma guardada correctamente", en: "Quote saved successfully" },
  toast_eliminada:      { es: "Proforma eliminada", en: "Quote deleted" },
  toast_historial_vacio:{ es: "El historial ya está vacío", en: "History is already empty" },
  toast_historial_vaciado: { es: "Historial vaciado", en: "History cleared" },
  toast_cargada:        { es: "Proforma cargada en el formulario", en: "Quote loaded into the form" },
  toast_form_nueva:     { es: "Formulario listo para una nueva proforma", en: "Form ready for a new quote" },
  toast_duplicada:      { es: "Proforma duplicada como nueva", en: "Quote duplicated as new" },
  toast_recorrido_duplicado: { es: "Recorrido duplicado", en: "Trip duplicated" },
  toast_guardar_obligatorio: { es: "Agrega al menos un recorrido antes de guardar", en: "Add at least one trip before saving" },
  toast_pdf_obligatorio:{ es: "Agrega al menos un recorrido antes de generar el PDF", en: "Add at least one trip before generating the PDF" },
  toast_borrador_restaurado: { es: "Se restauró tu borrador sin guardar", en: "Your unsaved draft was restored" },
  toast_confirma_cambios: { es: "Cambios guardados", en: "Changes saved" },

  /* ---------- Datos transportista ---------- */
  label_telefono:       { es: "Teléfono", en: "Phone" },
  label_email:          { es: "Correo electrónico", en: "Email" },
  label_direccion:      { es: "Dirección", en: "Address" },
  label_condiciones_pago: { es: "Condiciones de pago", en: "Payment terms" },
  placeholder_condiciones_pago: { es: "Ej. 50% anticipo, 50% al finalizar el mes", en: "E.g. 50% upfront, 50% at end of month" },
  label_validez:        { es: "Validez de la oferta (días)", en: "Quote validity (days)" },

  /* ---------- Autoguardado ---------- */
  tag_borrador:         { es: "Borrador autoguardado", en: "Draft autosaved" },
  hint_borrador:        { es: "El formulario se guarda automáticamente en este equipo mientras lo completas.", en: "The form is automatically saved on this device as you fill it in." }
};

/**
 * Devuelve el texto traducido para una clave según el idioma activo.
 * @param {string} clave
 * @returns {string}
 */
function t(clave) {
  const idioma = (window.estado && estado.configuracion && estado.configuracion.idioma) || "es";
  const entrada = DICCIONARIO_IDIOMAS[clave];
  if (!entrada) return clave;
  return entrada[idioma] || entrada.es;
}

/**
 * Recorre el DOM aplicando las traducciones a todos los elementos
 * marcados con data-i18n, data-i18n-placeholder y data-i18n-title.
 */
function aplicarIdiomaEnDOM() {
  document.querySelectorAll("[data-i18n]").forEach((el) => {
    el.textContent = t(el.getAttribute("data-i18n"));
  });
  document.querySelectorAll("[data-i18n-placeholder]").forEach((el) => {
    el.setAttribute("placeholder", t(el.getAttribute("data-i18n-placeholder")));
  });
  document.querySelectorAll("[data-i18n-title]").forEach((el) => {
    el.setAttribute("title", t(el.getAttribute("data-i18n-title")));
  });
  document.documentElement.lang = (window.estado && estado.configuracion.idioma) || "es";
}
