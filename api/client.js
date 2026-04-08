// FRONTEND API CLIENT
// Este módulo concentra toda la comunicación HTTP con el backend.
// Objetivo: sustituir la persistencia local de tareas (localStorage)
// por persistencia real del lado servidor (archivo/DB detrás de la API).
//
// GLOSARIO RÁPIDO (para principiantes):
// - Request: petición que enviamos al servidor.
// - Response: respuesta que devuelve el servidor.
// - Body: datos que enviamos en la petición.
// - Ruta de API: URL de una acción (ej: /tasks, /tasks/:id).

const API_URL = "/api/v1/tasks"; // URL relativa para local y Vercel en el mismo dominio.

// Intenta parsear JSON sin romper cuando el backend responde vacío
// (por ejemplo, DELETE 204) o con cuerpo no JSON.
const parseJsonSafely = async (response) => {
  const text = await response.text(); // Lee el body como texto plano.
  if (!text) return null; // Si no hay body, devolvemos null.
  try {
    return JSON.parse(text); // Convierte texto a objeto JSON.
  } catch (_error) {
    return null; // Si falla parseo, evitamos romper flujo.
  }
};

// GET: trae el estado completo de tareas desde backend.
// Antes (en versiones locales), este estado venía de localStorage;
// ahora la "fuente de verdad" es la API.
export const getTasks = async () => {
  // 1) Enviar petición al backend.
  const response = await fetch(API_URL); // Llama la ruta GET /tasks.
  // 2) Intentar convertir respuesta a objeto JS.
  const data = await parseJsonSafely(response); // Parsea JSON de forma segura.
  // 3) Si backend responde error, lanzamos excepción.
  if (!response.ok) throw new Error("GET_TASKS_ERROR"); // Error controlado para UI.
  // 4) Devolver datos al resto del frontend.
  return data; // Lista de tareas para render.
};

// POST: crea una tarea persistente en backend.
// Incluye metadatos relevantes de dominio:
// - priority
// - dueDate
// - subtasks
export const createTask = async ({ title, priority = "high", dueDate = "", subtasks = [] }) => {
  // Enviamos body JSON porque backend usa express.json().
  const response = await fetch(API_URL, {
    method: "POST", // Método HTTP para crear recurso.
    headers: {
      "Content-Type": "application/json" // Indicamos que body va en JSON.
    },
    body: JSON.stringify({ title, priority, dueDate, subtasks }) // Datos de la nueva tarea.
  });
  const data = await parseJsonSafely(response); // Lee respuesta de tarea creada.
  if (!response.ok) throw new Error("CREATE_TASK_ERROR"); // Si falla, notificamos error.
  return data; // Devuelve tarea nueva al frontend.
};

// PATCH: actualiza parcialmente una tarea persistida.
// Se usa para cambios puntuales: título inline, fecha, prioridad,
// completado, etc.
export const updateTask = async (id, payload) => {
  // PATCH significa: "actualiza solo estos campos", no toda la tarea.
  const response = await fetch(`${API_URL}/${id}`, {
    method: "PATCH", // Método para actualización parcial.
    headers: {
      "Content-Type": "application/json" // Body en formato JSON.
    },
    body: JSON.stringify(payload) // Datos que queremos cambiar.
  });
  const data = await parseJsonSafely(response); // Lee tarea actualizada.
  if (!response.ok) throw new Error("UPDATE_TASK_ERROR"); // Error controlado.
  return data; // Devuelve cambios aplicados.
};

// DELETE: elimina una tarea en backend.
export const deleteTask = async (id) => {
  const response = await fetch(`${API_URL}/${id}`, {
    method: "DELETE" // Método para borrar recurso.
  });
  if (!response.ok) throw new Error("DELETE_TASK_ERROR"); // Error si backend no pudo borrar.
};

// PUT /sync: guarda de una vez el estado completo de tareas
// en el orden actual del DOM (incluye subtareas).
// Esta operación soporta persistencia de:
// - orden drag&drop
// - texto inline
// - estructura de subtareas
export const syncTasks = async (tasks) => {
  // PUT /sync recibe el estado completo actual del cliente.
  // Es útil cuando hay cambios de estructura (orden/subtareas masivas).
  const response = await fetch(`${API_URL}/sync`, {
    method: "PUT", // Método para reemplazo/sync completo.
    headers: {
      "Content-Type": "application/json" // Datos completos en JSON.
    },
    body: JSON.stringify({ tasks }) // Estado total actual de tareas.
  });
  const data = await parseJsonSafely(response); // Lee estado sincronizado.
  if (!response.ok) throw new Error("SYNC_TASKS_ERROR"); // Error si sync falla.
  return data; // Devuelve estado final que quedó guardado en backend.
};