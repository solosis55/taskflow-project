// FRONTEND FILTERS
// Este módulo está orientado a reglas de visualización:
// - filtrado por texto
// - filtrado por fecha
// - conteo de tareas por día para calendario
//
// No realiza peticiones HTTP ni persistencia; su única responsabilidad
// es transformar/filtrar lo que ya está renderizado en el DOM.

// Convierte YYYY-MM-DD a formato legible en español.
function formatDateLong(dateString) {
  if (!dateString) return ""; // Si no hay fecha, no mostramos nada.
  const [year, month, day] = dateString.split("-"); // Separa YYYY-MM-DD.
  if (!year || !month || !day) return dateString; // Si viene mal formada, devuelve original.
  const date = new Date(Number(year), Number(month) - 1, Number(day)); // Crea objeto Date.
  return date.toLocaleDateString("es-ES", {
    day: "numeric", // Día en número.
    month: "long", // Mes en texto largo.
    year: "numeric" // Año en número.
  });
}

window.TaskflowFilters = { // API pública de utilidades de filtrado.
  // Agrupa tareas por dueDate para mostrar indicadores en calendario.
  getCountsByDate(tasks) {
    return tasks.reduce((acc, task) => { // Recorre cada tarea.
      if (!task.dueDate) return acc; // Ignora tareas sin fecha.
      acc[task.dueDate] = (acc[task.dueDate] || 0) + 1; // Suma contador por fecha.
      return acc; // Acumulador actualizado.
    }, {}); // Objeto final: { "YYYY-MM-DD": cantidad }.
  },

  // Filtra tarjetas por texto (tarea + subtareas) y por fecha seleccionada.
  applyTaskFilters({ taskList, busquedaValue, selectedDateFilter }) {
    const busqueda = (busquedaValue || "").toLowerCase().trim(); // Normaliza texto de búsqueda.

    taskList.querySelectorAll(".task-card").forEach((taskCard) => { // Evalúa cada tarjeta.
      const textoPrincipal = taskCard.querySelector(".task-text").textContent.toLowerCase(); // Texto de tarea.
      const textoSubtareas = Array.from(taskCard.querySelectorAll(".subtask-text"))
        .map(s => s.textContent.toLowerCase()) // Texto de cada subtarea.
        .join(" "); // Une subtareas en un solo string.
      const dueDate = taskCard.querySelector(".task-date-input-card")?.value || ""; // Fecha de la tarjeta.
      const coincideTexto = textoPrincipal.includes(busqueda) || textoSubtareas.includes(busqueda); // Match por texto.
      const coincideFecha = !selectedDateFilter || dueDate === selectedDateFilter; // Match por fecha.

      taskCard.style.display = coincideTexto && coincideFecha ? "" : "none"; // Muestra u oculta según reglas.
    });
  },

  // Muestra/oculta y actualiza la barra de filtro de fecha activa.
  updateDateFilterBar({ dateFilterBar, dateFilterText, selectedDateFilter }) {
    if (!dateFilterBar || !dateFilterText) return; // Evita errores si falta nodo.

    if (!selectedDateFilter) {
      dateFilterBar.hidden = true; // Oculta barra si no hay filtro activo.
      dateFilterBar.classList.add("view-hidden"); // Refuerza ocultación con clase.
      return;
    }

    dateFilterBar.hidden = false; // Muestra barra al tener filtro activo.
    dateFilterText.textContent = `Filtrando por fecha: ${formatDateLong(selectedDateFilter)}`; // Texto humano.
    dateFilterBar.classList.remove("view-hidden"); // Quita clase de ocultación.
  }
};
