/* =========================================================
   SINCRONIZACIÓN CON FIREBASE REALTIME DATABASE
   firebase-sync.js  (módulo ES — cargado con type="module")

   Expone window.FirebaseSync con métodos simples de lectura /
   escritura / escucha en tiempo real para que script.js (script
   clásico, no-módulo) pueda usarlo sin tener que convertirse en
   módulo. Todo es "best effort": si Firebase falla (sin red,
   bloqueado por el navegador, reglas de la base de datos, etc.)
   la app sigue funcionando 100% con localStorage y solo se
   pierde la sincronización entre dispositivos.
   ========================================================= */

import { initializeApp } from "https://www.gstatic.com/firebasejs/12.17.1/firebase-app.js";
import {
  getDatabase,
  ref,
  set,
  get,
  onValue,
  off
} from "https://www.gstatic.com/firebasejs/12.17.1/firebase-database.js";

const firebaseConfig = {
  apiKey: "AIzaSyBoSRZOUoeLwq4DwOa7BRDN4JTq1I2DOAM",
  authDomain: "servicios-reynosa.firebaseapp.com",
  databaseURL: "https://servicios-reynosa-default-rtdb.firebaseio.com",
  projectId: "servicios-reynosa",
  storageBucket: "servicios-reynosa.firebasestorage.app",
  messagingSenderId: "20165869785",
  appId: "1:20165869785:web:79cef7bfda53dfe35f3ec8",
  measurementId: "G-RR62JL7Q2L"
};

let db = null;
let disponible = false;

try {
  const app = initializeApp(firebaseConfig);
  db = getDatabase(app);
  disponible = true;

  // Analytics es opcional y suele fallar si hay bloqueadores de
  // anuncios/rastreo activos; nunca debe romper la app.
  import("https://www.gstatic.com/firebasejs/12.17.1/firebase-analytics.js")
    .then(({ getAnalytics }) => { try { getAnalytics(app); } catch (e) { /* se ignora */ } })
    .catch(() => { /* se ignora, no es crítico */ });
} catch (error) {
  console.warn("Firebase no se pudo inicializar, la app seguirá funcionando solo con almacenamiento local:", error);
  disponible = false;
}

/**
 * Envuelve una operación de Firebase para que nunca lance un error
 * hacia afuera: en caso de falla resuelve como "false" y avisa por
 * consola, dejando que la app siga usando localStorage sin cortes.
 */
async function operacionSegura(promesa) {
  try {
    await promesa;
    return true;
  } catch (error) {
    console.warn("No se pudo sincronizar con Firebase (se sigue guardando localmente):", error);
    return false;
  }
}

window.FirebaseSync = {
  disponible,

  guardarConfiguracion(config) {
    if (!disponible) return Promise.resolve(false);
    return operacionSegura(set(ref(db, "configuracion"), config));
  },

  guardarEmpresas(empresas) {
    if (!disponible) return Promise.resolve(false);
    return operacionSegura(set(ref(db, "empresas"), empresas));
  },

  guardarHistorial(historial) {
    if (!disponible) return Promise.resolve(false);
    return operacionSegura(set(ref(db, "historial"), historial));
  },

  async leerTodo() {
    if (!disponible) return null;
    try {
      const [snapConfig, snapEmpresas, snapHistorial] = await Promise.all([
        get(ref(db, "configuracion")),
        get(ref(db, "empresas")),
        get(ref(db, "historial"))
      ]);
      return {
        configuracion: snapConfig.exists() ? snapConfig.val() : null,
        empresas: snapEmpresas.exists() ? snapEmpresas.val() : null,
        historial: snapHistorial.exists() ? snapHistorial.val() : null
      };
    } catch (error) {
      console.warn("No se pudo leer datos iniciales de Firebase:", error);
      return null;
    }
  },

  escucharConfiguracion(cb) {
    if (!disponible) return;
    onValue(ref(db, "configuracion"), (snap) => cb(snap.exists() ? snap.val() : null));
  },

  escucharEmpresas(cb) {
    if (!disponible) return;
    onValue(ref(db, "empresas"), (snap) => cb(snap.exists() ? snap.val() : null));
  },

  escucharHistorial(cb) {
    if (!disponible) return;
    onValue(ref(db, "historial"), (snap) => cb(snap.exists() ? snap.val() : null));
  },

  detenerEscucha(camino) {
    if (!disponible) return;
    off(ref(db, camino));
  }
};

window.dispatchEvent(new CustomEvent("firebase-listo", { detail: { disponible } }));
