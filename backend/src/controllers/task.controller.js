// BACKEND - CONTROLLER DE TAREAS
// Este archivo recibe peticiones HTTP y decide qué hacer.
// No guarda datos por sí solo.
// Le pide al service que haga el trabajo real.
//
// Resumen:
// - request entra aquí
// - se valida lo básico
// - se llama al service
// - se devuelve respuesta

const taskService = require("../services/task.service"); // Importa la capa que maneja datos y persistencia.

// GET /api/v1/tasks
const obtenerTodas = (req, res) => { // Define la función para listar tareas.
  // req = datos que llegan.
  // res = lo que respondemos.
  const tasks = taskService.obtenerTodas(); // Pide al service todas las tareas guardadas.
  res.json(tasks); // Devuelve las tareas en formato JSON al frontend.
};

// POST /api/v1/tasks
// Crea una tarea nueva.
const crearTarea = (req, res, next) => { // Define la función para crear una tarea.
  const title = typeof req.body?.title === "string" ? req.body.title.trim() : ""; // Lee y limpia el título.
  const priority = req.body?.priority; // Lee prioridad opcional del body.
  const dueDate = req.body?.dueDate; // Lee fecha opcional del body.

  if (!title) {
    // Si falta título, mandamos error controlado.
    return next(new Error("VALIDATION_ERROR")); // Envía error 400 al manejador global.
  }

  try { // Intenta crear la tarea sin romper el servidor.
    const nuevaTarea = taskService.crearTarea({ title, priority, dueDate }); // Delega creación al service.
    res.status(201).json(nuevaTarea); // Responde 201 (creado) con la nueva tarea.
  } catch (error) { // Si el service falla...
    next(error); // ...pasa el error al middleware global.
  }
};

// PATCH /api/v1/tasks/:id
// Actualiza solo los campos que llegan.
const actualizarTarea = (req, res, next) => { // Define la función para actualizar parcialmente.
  const { id } = req.params; // Toma el id desde la URL.

  try { // Intenta actualizar en backend.
    // req.body puede traer solo 1 campo o varios.
    const actualizada = taskService.actualizarTarea(id, req.body || {}); // Aplica cambios con datos recibidos.
    res.json(actualizada); // Devuelve la tarea ya actualizada.
  } catch (error) { // Si no existe id o hay error de validación...
    next(error); // ...delegamos manejo al middleware de errores.
  }
};

// PUT /api/v1/tasks/sync
// Guarda el estado completo que manda el frontend.
// Útil cuando cambian muchas cosas a la vez.
const sincronizarTareas = (req, res, next) => { // Define sincronización completa.
  try { // Intenta reemplazar estado completo.
    // Espera un array en req.body.tasks.
    const tasks = taskService.sincronizarTareas(req.body?.tasks); // Guarda el snapshot completo en el service.
    res.json(tasks); // Devuelve el estado final sincronizado.
  } catch (error) { // Si body no tiene formato válido o falla algo...
    next(error); // ...manda error al middleware central.
  }
};

// DELETE /api/v1/tasks/:id
const eliminarTarea = (req, res, next) => { // Define eliminación por id.
  const { id } = req.params; // Lee el id desde la URL.

  try { // Intenta eliminar en backend.
    taskService.eliminarTarea(id); // Pide al service borrar la tarea.
    // 204 = correcto, sin contenido.
    res.status(204).send(); // Responde éxito sin cuerpo.
  } catch (error) { // Si no encuentra la tarea o falla algo...
    next(error); // ...manda el error al middleware.
  }
};

module.exports = { // Exporta funciones para que las rutas puedan usarlas.
  obtenerTodas, // Endpoint GET /
  crearTarea, // Endpoint POST /
  eliminarTarea, // Endpoint DELETE /:id
  actualizarTarea, // Endpoint PATCH /:id
  sincronizarTareas // Endpoint PUT /sync
};