// ═══════════════════════════════════════════════════════════════════
// STORAGE MODULE
// ═══════════════════════════════════════════════════════════════════
// Acceso encapsulado a localStorage para datos de tareas.

const STORAGE_KEY_TASKS = "tareas";

window.TaskflowStorage = {
  // Persistencia completa del array de tareas.
  saveTasks(tasks) {
    localStorage.setItem(STORAGE_KEY_TASKS, JSON.stringify(tasks));
  },

  // Carga segura: devuelve [] si no hay datos o si JSON falla.
  loadTasks() {
    const raw = localStorage.getItem(STORAGE_KEY_TASKS);
    if (!raw) return [];

    try {
      const parsed = JSON.parse(raw);
      return Array.isArray(parsed) ? parsed : [];
    } catch (_error) {
      return [];
    }
  }
};
