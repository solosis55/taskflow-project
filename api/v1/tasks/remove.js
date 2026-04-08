const taskService = require("../../../backend/src/services/task.service");
const { parseJsonBody } = require("../../_lib/parse-json-body");

module.exports = async (req, res) => {
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Metodo no permitido" });
  }

  const body = await parseJsonBody(req);
  const id = typeof body.id === "string" ? body.id.trim() : "";

  if (!id) {
    return res.status(400).json({ error: "Datos invalidos" });
  }

  try {
    taskService.eliminarTarea(id);
    return res.status(204).end();
  } catch (error) {
    if (error?.message === "NOT_FOUND") {
      return res.status(404).json({ error: "Recurso no encontrado" });
    }
    return res.status(500).json({ error: "Error interno del servidor" });
  }
};
