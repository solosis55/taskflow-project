// BACKEND - SERVICE DE TAREAS
// Este archivo hace el trabajo "real" de datos:
// - crear, actualizar, borrar, listar
// - leer/escribir en tasks.json
//
// Antes las tareas vivían en localStorage (frontend).
// Ahora viven aquí, en backend, dentro de src/data/tasks.json.
//
// Idea importante:
// - `tasks` = datos en memoria (rápidos)
// - `tasks.json` = datos guardados en disco (persisten al reiniciar)

const { randomUUID } = require("node:crypto"); // Genera IDs únicos para tareas/subtareas.
const fs = require("node:fs"); // Permite leer y escribir archivos.
const path = require("node:path"); // Ayuda a construir rutas de archivos.

const DATA_DIR = path.join(__dirname, "..", "data"); // Carpeta donde vive el archivo de datos.
const TASKS_FILE = path.join(DATA_DIR, "tasks.json"); // Archivo JSON persistente de tareas.
let diskStorageEnabled = true; // Si falla en entornos read-only (ej: Vercel), hacemos fallback a memoria.

// Prepara carpeta y archivo de datos si no existen.
const ensureStorage = () => { // Asegura que carpeta/archivo existan.
  try {
    if (!fs.existsSync(DATA_DIR)) { // Si no existe la carpeta data...
      fs.mkdirSync(DATA_DIR, { recursive: true }); // ...la crea (incluyendo carpetas padre).
    }

    if (!fs.existsSync(TASKS_FILE)) { // Si no existe tasks.json...
      // Primera ejecución: arranca con array vacío.
      fs.writeFileSync(TASKS_FILE, "[]", "utf-8"); // ...lo crea con JSON válido vacío.
    }
  } catch (_error) {
    // En serverless/read-only no podemos escribir disco; seguimos en memoria.
    diskStorageEnabled = false;
  }
};

// Lee el archivo y lo convierte a array.
const loadTasksFromDisk = () => { // Carga tareas persistidas del archivo.
  if (!diskStorageEnabled) return [];
  try { // Intenta leer y parsear sin romper servidor.
    const raw = fs.readFileSync(TASKS_FILE, "utf-8"); // Lee texto del archivo.
    const parsed = JSON.parse(raw); // Convierte texto JSON a objeto/array.
    return Array.isArray(parsed) ? parsed : []; // Acepta solo arrays; si no, devuelve vacío.
  } catch (_error) { // Si falla lectura o JSON...
    // Si falla lectura/JSON, devolvemos vacío para no romper el servidor.
    return []; // Backend sigue funcionando aunque archivo esté dañado.
  }
};

// Guarda en disco el array actual de tareas.
const saveTasksToDisk = () => { // Guarda estado actual en tasks.json.
  if (!diskStorageEnabled) return; // En read-only solo mantenemos estado en memoria.
  try {
    fs.writeFileSync(TASKS_FILE, JSON.stringify(tasks, null, 2), "utf-8"); // Serializa con sangría legible.
  } catch (_error) {
    // Si el entorno pasa a read-only, degradamos a memoria sin romper requests.
    diskStorageEnabled = false;
  }
};

ensureStorage(); // Ejecuta preparación de almacenamiento al cargar el módulo.

// Normaliza prioridad a valores permitidos.
const normalizePriority = (priority) => { // Acepta solo prioridades válidas.
  const allowed = ["high", "medium", "low"]; // Lista blanca de valores permitidos.
  return allowed.includes(priority) ? priority : "high"; // Si llega valor raro, usa "high".
};

// Normaliza fecha a formato YYYY-MM-DD o vacío.
const normalizeDueDate = (dueDate) => { // Normaliza fecha de vencimiento.
  if (typeof dueDate !== "string") return ""; // Si no es texto, se descarta.
  const trimmed = dueDate.trim(); // Quita espacios extra.
  if (!trimmed) return ""; // Si queda vacío, devolvemos vacío.
  const validDatePattern = /^\d{4}-\d{2}-\d{2}$/; // Formato esperado: YYYY-MM-DD.
  return validDatePattern.test(trimmed) ? trimmed : ""; // Si no cumple formato, se limpia.
};

const normalizeSubtasks = (subtasks) => { // Limpia y estandariza subtareas.
  // Normaliza subtareas para que siempre tengan
  // id, text y done con formato consistente.
  if (!Array.isArray(subtasks)) return []; // Si no llega array, devolvemos array vacío.
  return subtasks // Recorre cada subtarea recibida.
    .map((sub) => ({ // Normaliza forma de cada elemento.
      id: typeof sub?.id === "string" && sub.id.trim() ? sub.id.trim() : randomUUID(), // Conserva id o crea uno nuevo.
      text: typeof sub?.text === "string" ? sub.text.trim() : "", // Limpia texto.
      done: Boolean(sub?.done) // Fuerza valor booleano.
    }))
    .filter((sub) => sub.text.length > 0); // Quita subtareas sin texto.
};

// Normaliza una tarea completa (incluye defaults).
const normalizeTask = (task, fallbackPosition = 0) => { // Limpia una tarea completa.
  const position = Number.isInteger(task?.position) ? task.position : fallbackPosition; // Usa posición existente o fallback.
  return {
    id: typeof task?.id === "string" && task.id.trim() ? task.id.trim() : randomUUID(), // ID válido o nuevo.
    title: typeof task?.title === "string" ? task.title.trim() : "", // Título limpio.
    completed: Boolean(task?.completed), // Estado completado normalizado.
    priority: normalizePriority(task?.priority), // Prioridad válida.
    dueDate: normalizeDueDate(task?.dueDate), // Fecha válida o vacía.
    subtasks: normalizeSubtasks(task?.subtasks), // Subtareas normalizadas.
    position // Orden de la tarea.
  };
};

// Carga tareas al iniciar y corrige formatos antiguos.
const hydrateFromDisk = () => // Construye estado inicial desde disco.
  loadTasksFromDisk() // Lee tareas crudas del JSON.
    .map((task, index) => normalizeTask(task, index)) // Normaliza cada tarea.
    .filter((task) => task.title.length > 0); // Descarta tareas sin título.

let tasks = hydrateFromDisk(); // Estado en memoria usado por el service.

// Devuelve tareas ordenadas por posición.
const obtenerTodas = () => { // Lista tareas para responder al frontend.
  return [...tasks].sort((a, b) => a.position - b.position); // Devuelve copia ordenada por position.
};

// Crea tarea nueva.
const crearTarea = (data) => { // Crea y persiste una tarea nueva.
  const nuevaTarea = { // Objeto final con campos normalizados.
    id: randomUUID(), // ID único generado en backend.
    title: data.title, // Título recibido (validado en controller).
    completed: false, // Toda tarea inicia como pendiente.
    priority: normalizePriority(data.priority), // Normaliza prioridad recibida.
    dueDate: normalizeDueDate(data.dueDate), // Normaliza fecha recibida.
    subtasks: normalizeSubtasks(data.subtasks), // Normaliza subtareas iniciales.
    position: tasks.length // La nueva va al final del orden actual.
  };

  tasks.push(nuevaTarea); // Actualiza memoria.
  saveTasksToDisk(); // Guarda también en disco.
  return nuevaTarea; // Devuelve al controller la nueva tarea.
};

// Elimina tarea por id.
const eliminarTarea = (id) => { // Borra tarea por id.
  const index = tasks.findIndex((task) => task.id === id); // Busca índice de la tarea.

  if (index === -1) { // Si no la encuentra...
    throw new Error("NOT_FOUND"); // ...lanza error controlado.
  }

  tasks.splice(index, 1); // Elimina de memoria.
  saveTasksToDisk(); // Persiste eliminación en disco.
};

// Actualiza una tarea existente por id.
const actualizarTarea = (id, data) => { // Actualiza una tarea existente.
  const index = tasks.findIndex((task) => task.id === id); // Encuentra tarea objetivo.

  if (index === -1) { // Si no existe id...
    throw new Error("NOT_FOUND"); // ...devuelve error de no encontrado.
  }

  const current = tasks[index]; // Estado actual.
  const updated = { ...current }; // Copia para modificar sin romper referencia original.

  if (typeof data.title === "string") { // Si llega nuevo título...
    const title = data.title.trim(); // Limpia espacios.
    if (!title) throw new Error("VALIDATION_ERROR"); // Evita título vacío.
    updated.title = title; // Aplica título.
  }

  if (typeof data.completed === "boolean") { // Si llega estado completed...
    updated.completed = data.completed; // ...lo actualiza.
  }

  if (typeof data.priority !== "undefined") { // Si llega prioridad...
    updated.priority = normalizePriority(data.priority); // ...la normaliza.
  }

  if (typeof data.dueDate !== "undefined") { // Si llega fecha...
    updated.dueDate = normalizeDueDate(data.dueDate); // ...la normaliza.
  }

  if (typeof data.subtasks !== "undefined") { // Si llegan subtareas...
    updated.subtasks = normalizeSubtasks(data.subtasks); // ...las normaliza completas.
  }

  if (typeof data.position !== "undefined") { // Si llega posición...
    const parsed = Number.parseInt(String(data.position), 10); // Intenta convertir a entero.
    if (Number.isInteger(parsed) && parsed >= 0) { // Acepta solo enteros >= 0.
      updated.position = parsed; // Guarda nueva posición.
    }
  }

  tasks[index] = updated; // Reemplaza tarea en memoria.
  saveTasksToDisk(); // Persiste cambios en disco.
  return updated; // Devuelve tarea actualizada.
};

// Reemplaza TODO el estado con lo que envía el frontend.
// Sirve para guardar orden, subtareas y cambios en lote.
const sincronizarTareas = (nextTasks) => { // Reemplaza el estado completo con snapshot cliente.
  if (!Array.isArray(nextTasks)) { // Protege si payload no es array.
    throw new Error("VALIDATION_ERROR"); // Error de formato inválido.
  }

  const normalized = nextTasks // Trabaja sobre snapshot recibido.
    .map((task, index) => normalizeTask(task, index)) // Normaliza cada tarea.
    .filter((task) => task.title.length > 0) // Quita tareas sin título.
    .map((task, index) => ({ ...task, position: index })); // Recalcula orden secuencial.

  tasks = normalized; // Reemplaza memoria completa.
  saveTasksToDisk(); // Persiste snapshot final.
  return obtenerTodas(); // Devuelve estado final ordenado.
};

module.exports = { // Exporta funciones públicas del service.
  obtenerTodas, // Leer todas.
  crearTarea, // Crear una.
  eliminarTarea, // Borrar por id.
  actualizarTarea, // Actualizar parcial por id.
  sincronizarTareas // Reemplazo masivo (sync completa).
};