const taskService = require("../../../backend/src/services/task.service");
const { parseJsonBody } = require("../../_lib/parse-json-body");

function getTaskId(req) {
  let id = req.query?.id;
  if (Array.isArray(id)) id = id[0];
  if (typeof id === "string" && id.trim().length > 0) {
    return id.trim();
  }

  const pathOnly = String(req.url || "").split("?")[0];
  const prefix = "/api/v1/tasks/";
  if (pathOnly.startsWith(prefix)) {
    const rest = pathOnly.slice(prefix.length);
    if (rest && rest !== "sync") {
      try {
        return decodeURIComponent(rest).trim();
      } catch (_error) {
        return rest.trim();
      }
    }
  }

  return null;
}

module.exports = async (req, res) => {
  const id = getTaskId(req);

  if (!id) {
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
      return res.status(204).end();
    } catch (error) {
      if (error?.message === "NOT_FOUND") {
        return res.status(404).json({ error: "Recurso no encontrado" });
      }
      return res.status(500).json({ error: "Error interno del servidor" });
    }
  }

  return res.status(405).json({ error: "Metodo no permitido" });
};
