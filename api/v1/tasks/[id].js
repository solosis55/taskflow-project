const taskService = require("../../../backend/src/services/task.service");
const { parseJsonBody } = require("../../_lib/parse-json-body");

module.exports = async (req, res) => {
  const id = req.query?.id;

  if (!id || typeof id !== "string") {
    return res.status(400).json({ error: "Datos invalidos" });
  }

  if (req.method === "PATCH") {
    try {
      const body = await parseJsonBody(req);
      const updated = taskService.actualizarTarea(id, body);
      return res.status(200).json(updated);
    } catch (error) {
      if (error?.message === "NOT_FOUND") {
        return res.status(404).json({ error: "Recurso no encontrado" });
      }
      if (error?.message === "VALIDATION_ERROR") {
        return res.status(400).json({ error: "Datos invalidos" });
      }
      return res.status(500).json({ error: "Error interno del servidor" });
    }
  }

  if (req.method === "DELETE") {
    try {
      taskService.eliminarTarea(id);
      return res.status(204).send();
    } catch (error) {
      if (error?.message === "NOT_FOUND") {
        return res.status(404).json({ error: "Recurso no encontrado" });
      }
      return res.status(500).json({ error: "Error interno del servidor" });
    }
  }

  return res.status(405).json({ error: "Metodo no permitido" });
};
