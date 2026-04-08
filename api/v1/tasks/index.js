const taskService = require("../../../backend/src/services/task.service");
const { parseJsonBody } = require("../../_lib/parse-json-body");

module.exports = async (req, res) => {
  if (req.method === "GET") {
    const tasks = taskService.obtenerTodas();
    return res.status(200).json(tasks);
  }

  if (req.method === "POST") {
    const body = await parseJsonBody(req);
    const title = typeof body.title === "string" ? body.title.trim() : "";

    if (!title) {
      return res.status(400).json({ error: "Datos invalidos" });
    }

    try {
      const nuevaTarea = taskService.crearTarea({
        title,
        priority: body.priority,
        dueDate: body.dueDate,
        subtasks: body.subtasks
      });
      return res.status(201).json(nuevaTarea);
    } catch (_error) {
      return res.status(500).json({ error: "Error interno del servidor" });
    }
  }

  return res.status(405).json({ error: "Metodo no permitido" });
};
