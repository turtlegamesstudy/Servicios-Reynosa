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
  btn_vaciar_historial: { es: "Vaciar historial", en: "Clear history" }
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
