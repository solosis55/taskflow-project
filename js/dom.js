// ═══════════════════════════════════════════════════════════════════
// DOM MODULE
// ═══════════════════════════════════════════════════════════════════
// Centraliza referencias de la UI para compartirlas entre módulos.

window.AppDom = {
  // Formulario principal de tareas
  form: document.querySelector("#task-form"),
  input: document.querySelector("#nueva-tarea"),
  taskDateInput: document.querySelector("#fecha-tarea"),

  // Lista y controles de tareas
  taskList: document.querySelector("#task-list"),
  busquedaInput: document.querySelector("#busqueda-input"),
  completeAllBtn: document.querySelector("#complete-all-btn"),
  clearCompletedBtn: document.querySelector("#clear-completed-btn"),

  // Filtro por fecha
  dateFilterBar: document.querySelector("#date-filter-bar"),
  dateFilterText: document.querySelector("#date-filter-text"),
  clearDateFilterBtn: document.querySelector("#clear-date-filter-btn"),

  // Contenedores de vistas
  tasksView: document.querySelector("#tasks-view"),
  calendarView: document.querySelector("#calendar-view"),

  // Controles y superficie de calendario
  calendarMonthLabel: document.querySelector("#calendar-month-label"),
  calendarDays: document.querySelector("#calendar-days"),
  calendarPrevBtn: document.querySelector("#calendar-prev"),
  calendarNextBtn: document.querySelector("#calendar-next"),

  // Navegación lateral por vistas
  sidebarViewItems: document.querySelectorAll(".sidebar-item[data-view]")
};
