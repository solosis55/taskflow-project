// ═══════════════════════════════════════════════════════════════════
// FILTERS MODULE
// ═══════════════════════════════════════════════════════════════════
// Utilidades de filtrado visual y conteo por fecha.

// Convierte YYYY-MM-DD a formato legible en español.
function formatDateLong(dateString) {
  if (!dateString) return "";
  const [year, month, day] = dateString.split("-");
  if (!year || !month || !day) return dateString;
  const date = new Date(Number(year), Number(month) - 1, Number(day));
  return date.toLocaleDateString("es-ES", {
    day: "numeric",
    month: "long",
    year: "numeric"
  });
}

window.TaskflowFilters = {
  // Agrupa tareas por dueDate para mostrar indicadores en calendario.
  getCountsByDate(tasks) {
    return tasks.reduce((acc, task) => {
      if (!task.dueDate) return acc;
      acc[task.dueDate] = (acc[task.dueDate] || 0) + 1;
      return acc;
    }, {});
  },

  // Filtra tarjetas por texto (tarea + subtareas) y por fecha seleccionada.
  applyTaskFilters({ taskList, busquedaValue, selectedDateFilter }) {
    const busqueda = (busquedaValue || "").toLowerCase().trim();

    taskList.querySelectorAll(".task-card").forEach((taskCard) => {
      const textoPrincipal = taskCard.querySelector(".task-text").textContent.toLowerCase();
      const textoSubtareas = Array.from(taskCard.querySelectorAll(".subtask-text"))
        .map(s => s.textContent.toLowerCase())
        .join(" ");
      const dueDate = taskCard.querySelector(".task-date-input-card")?.value || "";
      const coincideTexto = textoPrincipal.includes(busqueda) || textoSubtareas.includes(busqueda);
      const coincideFecha = !selectedDateFilter || dueDate === selectedDateFilter;

      taskCard.style.display = coincideTexto && coincideFecha ? "" : "none";
    });
  },

  // Muestra/oculta y actualiza la barra de filtro de fecha activa.
  updateDateFilterBar({ dateFilterBar, dateFilterText, selectedDateFilter }) {
    if (!dateFilterBar || !dateFilterText) return;

    if (!selectedDateFilter) {
      dateFilterBar.hidden = true;
      dateFilterBar.classList.add("view-hidden");
      return;
    }

    dateFilterBar.hidden = false;
    dateFilterText.textContent = `Filtrando por fecha: ${formatDateLong(selectedDateFilter)}`;
    dateFilterBar.classList.remove("view-hidden");
  }
};
