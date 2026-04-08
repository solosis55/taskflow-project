const taskService = require("../../../backend/src/services/task.service");
const { parseJsonBody } = require("../../_lib/parse-json-body");

module.exports = async (req, res) => {
  if (req.method !== "PUT") {
    return res.status(405).json({ error: "Metodo no permitido" });
  }

  try {
    const body = await parseJsonBody(req);
    const tasks = taskService.sincronizarTareas(body.tasks);
    return res.status(200).json(tasks);
  } catch (error) {
    if (error?.message === "VALIDATION_ERROR") {
      return res.status(400).json({ error: "Datos invalidos" });
    }
    return res.status(500).json({ error: "Error interno del servidor" });
  }
};
