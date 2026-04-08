// BACKEND - RUTAS DE TAREAS
// Este archivo dice:
// "si llega esta URL con este método, usa esta función".
// No guarda datos. Solo redirige al controller.
//
// Regla general:
// - router.<método>(ruta, handler)
// - método = GET/POST/PATCH/PUT/DELETE
// - handler = función del controller
//
// Piensa en esto como un mapa:
// cada ruta lleva a una acción distinta.

const express = require("express"); // Importa Express para crear rutas.
// router guarda rutas y luego se "enchufa" en index.js.
const router = express.Router(); // Crea contenedor de rutas de tareas.

// Importamos funciones que ejecutan cada acción.
const taskController = require("../controllers/task.controller"); // Trae handlers del controller.

// Endpoints disponibles:
// GET    /           -> listar tareas
// POST   /           -> crear tarea
// PUT    /sync       -> sincronizar estado completo (orden/subtareas)
// PATCH  /:id        -> actualización parcial
// DELETE /:id        -> eliminar tarea

// GET /api/v1/tasks
// Devuelve la lista completa.
router.get("/", taskController.obtenerTodas); // Lista todas las tareas.

// POST /api/v1/tasks
// Crea una tarea nueva con datos del body.
router.post("/", taskController.crearTarea); // Crea una tarea nueva.

// PUT /api/v1/tasks/sync
// Guarda todo de una vez (orden, subtareas, etc).
router.put("/sync", taskController.sincronizarTareas); // Sincroniza estado completo (orden + subtareas).

// POST /api/v1/tasks/remove
// Mismo borrado que DELETE /:id pero con id en el body (Vercel / proxies suelen ir mejor así).
router.post("/remove", (req, res, next) => {
  const id = typeof req.body?.id === "string" ? req.body.id.trim() : "";
  if (!id) return next(new Error("VALIDATION_ERROR"));
  req.params = { id };
  taskController.eliminarTarea(req, res, next);
});

// PATCH /api/v1/tasks/:id
// :id es el identificador de la tarea (cambia en cada URL).
// Actualiza solo algunos campos.
router.patch("/:id", taskController.actualizarTarea); // Actualiza campos de una tarea por id.

// DELETE /api/v1/tasks/:id
// Borra una tarea por id.
router.delete("/:id", taskController.eliminarTarea); // Elimina tarea por id.

// Exportamos el router para usarlo en index.js.
module.exports = router; // Exporta rutas para usarlas en index.js.