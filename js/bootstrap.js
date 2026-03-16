// ═══════════════════════════════════════════════════════════════════
// BOOTSTRAP MODULE
// ═══════════════════════════════════════════════════════════════════
// Punto de entrada: conecta módulos y arranca la aplicación.

console.log("JS conectado");

// ─── Dependencias DOM ─────────────────────────────────────────────
const {
  form,
  taskList,
  busquedaInput,
  completeAllBtn,
  clearCompletedBtn,
  dateFilterBar,
  dateFilterText,
  clearDateFilterBtn,
  tasksView,
  calendarView,
  calendarMonthLabel,
  calendarDays,
  calendarPrevBtn,
  calendarNextBtn,
  sidebarViewItems,
  input,
  taskDateInput
} = window.AppDom || {};

// ─── Estado global de ejecución ───────────────────────────────────
let tareas = [];
let selectedDateFilter = "";
let refreshCalendarView = () => {};

// ─── Persistencia y sincronización de estado ──────────────────────

function guardarTareas() {
  window.TaskflowStorage?.saveTasks(tareas);
  refreshCalendarView();
}

function cargarTareasGuardadas() {
  tareas = window.TaskflowStorage?.loadTasks() || [];
  if (!taskList) return;
  window.TaskflowTasks?.renderTasks(taskList, tareas);
}

// ─── Filtros y métricas para calendario/lista ─────────────────────

function obtenerConteoTareasPorFecha() {
  return window.TaskflowFilters?.getCountsByDate(tareas) || {};
}

function aplicarFiltrosTareas() {
  window.TaskflowFilters?.applyTaskFilters({
    taskList,
    busquedaValue: busquedaInput?.value || "",
    selectedDateFilter
  });
}

function actualizarBarraFiltroFecha() {
  window.TaskflowFilters?.updateDateFilterBar({
    dateFilterBar,
    dateFilterText,
    selectedDateFilter
  });
}

// ─── Fuente de verdad desde DOM ───────────────────────────────────

function reconstruirArray() {
  tareas = window.TaskflowTasks?.collectTasksFromDom(taskList) || [];
}

function persistFromDom({ applyFilters = false } = {}) {
  reconstruirArray();
  guardarTareas();
  if (applyFilters) aplicarFiltrosTareas();
}

// ─── Render de calendario ─────────────────────────────────────────

function renderCalendar(date, onDaySelect = null) {
  window.renderTaskflowCalendar?.({
    date,
    calendarMonthLabel,
    calendarDays,
    selectedDateFilter,
    onDaySelect,
    countsByDate: obtenerConteoTareasPorFecha()
  });
}

// ─── Registro de eventos de tareas ────────────────────────────────

window.TaskflowTasks?.bindTaskEvents({
  form,
  input,
  taskDateInput,
  taskList,
  busquedaInput,
  completeAllBtn,
  clearCompletedBtn,
  onPersist: persistFromDom,
  onApplyFilters: aplicarFiltrosTareas
});

// ─── Inicialización UI global ─────────────────────────────────────

document.addEventListener("DOMContentLoaded", () => {
  let currentView = localStorage.getItem("currentView") || "tasks";
  let calendarDate = new Date();
  selectedDateFilter = "";
  let setView = () => {};

  // Callback de día seleccionado en calendario.
  const handleCalendarDaySelect = (pickedDate) => {
    setDateFilter(pickedDate, { clearSearch: true });
    setView("tasks");
  };

  // Aplica/cancela filtro por fecha.
  const setDateFilter = (dateString, { clearSearch = false } = {}) => {
    selectedDateFilter = dateString || "";
    if (clearSearch && busquedaInput) busquedaInput.value = "";
    actualizarBarraFiltroFecha();
    aplicarFiltrosTareas();
    renderCalendar(calendarDate, handleCalendarDaySelect);
  };

  // Alterna entre vista de tareas y vista de calendario.
  setView = (view) => {
    if (!tasksView || !calendarView) return;
    const showCalendar = view === "calendar";
    tasksView.classList.toggle("view-hidden", showCalendar);
    calendarView.classList.toggle("view-hidden", !showCalendar);
    currentView = showCalendar ? "calendar" : "tasks";
    localStorage.setItem("currentView", currentView);

    sidebarViewItems.forEach(item => {
      const isActive = item.dataset.view === currentView;
      item.classList.toggle("active", isActive);
    });

    if (showCalendar) renderCalendar(calendarDate, handleCalendarDaySelect);
  };

  // Re-render global de calendario tras cambios de tareas.
  refreshCalendarView = () => renderCalendar(calendarDate, handleCalendarDaySelect);

  // Navegación lateral por vistas.
  sidebarViewItems.forEach(item => {
    item.addEventListener("click", (e) => {
      e.preventDefault();
      setView(item.dataset.view || "tasks");
    });
  });

  // Navegación entre meses del calendario.
  if (calendarPrevBtn) {
    calendarPrevBtn.addEventListener("click", () => {
      calendarDate = new Date(calendarDate.getFullYear(), calendarDate.getMonth() - 1, 1);
      refreshCalendarView();
    });
  }

  if (calendarNextBtn) {
    calendarNextBtn.addEventListener("click", () => {
      calendarDate = new Date(calendarDate.getFullYear(), calendarDate.getMonth() + 1, 1);
      refreshCalendarView();
    });
  }

  // Limpia filtro por fecha manualmente.
  if (clearDateFilterBtn) {
    clearDateFilterBtn.addEventListener("click", () => setDateFilter(""));
  }

  // Estado inicial visual.
  setView(currentView);
  actualizarBarraFiltroFecha();
  aplicarFiltrosTareas();

  // Modo oscuro (persistente).
  const darkToggle = document.querySelector("#dark-toggle");
  if (darkToggle) {
    const darkActivo = localStorage.getItem("darkmode") === "true";
    if (darkActivo) {
      document.documentElement.classList.add("dark");
      darkToggle.textContent = "☀️";
    }

    darkToggle.addEventListener("click", () => {
      document.documentElement.classList.toggle("dark");
      localStorage.setItem("darkmode", document.documentElement.classList.contains("dark"));
      darkToggle.textContent = document.documentElement.classList.contains("dark") ? "☀️" : "🌙";
    });
  }

  // Sidebar contraído/expandido (persistente).
  const menuToggle = document.querySelector(".menu-toggle");
  const sidebar = document.querySelector(".sidebar");
  if (menuToggle && sidebar) {
    const saved = localStorage.getItem("sidebarClosed");
    if (saved !== null) sidebar.classList.toggle("closed", saved === "true");

    menuToggle.addEventListener("click", () => {
      sidebar.classList.toggle("closed");
      localStorage.setItem("sidebarClosed", sidebar.classList.contains("closed"));
    });
  }
});

// ─── Arranque inicial ─────────────────────────────────────────────

cargarTareasGuardadas();
