// FRONTEND DOM REGISTRY
// Este archivo centraliza selectores de elementos HTML para evitar
// repetir `querySelector` en múltiples módulos.
// Está orientado a desacoplar:
// - lógica de UI (`tasks.js`, `calendar.js`, `filters.js`)
// - orquestación (`bootstrap.js`)
//
// Nota de arquitectura:
// no contiene lógica de negocio ni persistencia; solo referencias DOM.

window.AppDom = { // Objeto global con referencias del DOM para otros módulos.
  // Formulario principal de tareas
  form: document.querySelector("#task-form"), // Form principal.
  input: document.querySelector("#nueva-tarea"), // Input de título de tarea.
  taskDateInput: document.querySelector("#fecha-tarea"), // Input de fecha inicial.

  // Lista y controles de tareas
  taskList: document.querySelector("#task-list"), // Lista UL donde se pintan tareas.
  networkStatus: document.querySelector("#network-status"), // Banner de estado de red.
  busquedaInput: document.querySelector("#busqueda-input"), // Input de búsqueda.
  completeAllBtn: document.querySelector("#complete-all-btn"), // Botón "completar todas".
  clearCompletedBtn: document.querySelector("#clear-completed-btn"), // Botón "borrar completadas".

  // Filtro por fecha
  dateFilterBar: document.querySelector("#date-filter-bar"), // Barra visual de filtro por fecha.
  dateFilterText: document.querySelector("#date-filter-text"), // Texto descriptivo del filtro.
  clearDateFilterBtn: document.querySelector("#clear-date-filter-btn"), // Botón para quitar filtro.

  // Contenedores de vistas
  tasksView: document.querySelector("#tasks-view"), // Sección vista lista.
  calendarView: document.querySelector("#calendar-view"), // Sección vista calendario.

  // Controles y superficie de calendario
  calendarMonthLabel: document.querySelector("#calendar-month-label"), // Título mes/año.
  calendarDays: document.querySelector("#calendar-days"), // Rejilla de días.
  calendarPrevBtn: document.querySelector("#calendar-prev"), // Botón mes anterior.
  calendarNextBtn: document.querySelector("#calendar-next"), // Botón mes siguiente.

  // Navegación lateral por vistas
  sidebarViewItems: document.querySelectorAll(".sidebar-item[data-view]") // Links de cambio de vista.
};
