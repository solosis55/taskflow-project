// FRONTEND BOOTSTRAP (ORQUESTADOR PRINCIPAL)
// Este archivo coordina toda la aplicación cliente:
// - carga inicial desde API
// - sincronización de cambios del DOM hacia backend
// - conexión entre módulos (`tasks`, `filters`, `calendar`, `dom`)
// - estado de red en UI (loading/success/error)
//
// Contexto de migración (LocalStorage -> Persistencia API):
// 1) Las tareas ya NO se guardan en localStorage.
// 2) La fuente de verdad ahora es backend (GET/POST/PATCH/PUT sync).
// 3) Se mantiene localStorage solo para preferencia UI de modo oscuro.
//
// MENTALIDAD "ULTRA PRINCIPIANTE":
// - `tasks.js` detecta acciones del usuario.
// - `bootstrap.js` decide cómo persistirlas.
// - `js/api-client.js` hace las peticiones reales al backend.
import { getTasks, createTask, updateTask, deleteTask, syncTasks } from "./api-client.js";
console.log("JS conectado"); // Verificación rápida de carga del script.

// ─── Dependencias DOM ─────────────────────────────────────────────
const {
  form,
  taskList,
  networkStatus,
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
let tareas = []; // Estado principal en frontend (copia de lo renderizado).
let selectedDateFilter = ""; // Fecha activa para filtrar tareas.
let refreshCalendarView = () => {}; // Función asignada más tarde para refrescar calendario.
let networkSuccessTimer = null; // Timer para ocultar mensajes de éxito.
let syncTimer = null; // Temporizador para agrupar cambios seguidos.
let syncInFlight = false; // Indica si hay sync HTTP en curso.
let hasPendingSync = false; // Marca si quedó otra sync pendiente.
// Única persistencia local conservada en frontend: preferencia visual.
const DARK_MODE_KEY = "taskflow.darkmode";

// Convierte el formato del backend (title/completed/...)
// al formato que usa la interfaz (text/done/...).
function mapApiTaskToUi(task) {
  return {
    id: task?.id,
    text: task?.title || "",
    priority: task?.priority || "high",
    subtasks: Array.isArray(task?.subtasks)
      ? task.subtasks.map((sub) => ({
        id: sub?.id,
        text: sub?.text || "",
        done: Boolean(sub?.done)
      }))
      : [],
    done: Boolean(task?.completed),
    dueDate: typeof task?.dueDate === "string" ? task.dueDate : ""
  };
}

// Convierte el formato del DOM/UI al formato que espera el backend.
// Se usa sobre todo cuando guardamos todo de una vez (PUT /sync).
function mapUiTaskToApi(task, index) {
  return {
    id: task?.id,
    title: task?.text || "",
    completed: Boolean(task?.done),
    priority: task?.priority || "high",
    dueDate: typeof task?.dueDate === "string" ? task.dueDate : "",
    position: index,
    subtasks: Array.isArray(task?.subtasks)
      ? task.subtasks
        .filter((sub) => typeof sub?.text === "string" && sub.text.trim().length > 0)
        .map((sub) => ({
          id: sub?.id,
          text: sub.text.trim(),
          done: Boolean(sub?.done)
        }))
      : []
  };
}

function updateNetworkStatus(type, message) {
  if (!networkStatus) return; // Sale si no existe el banner en DOM.

  if (!message) {
    networkStatus.textContent = ""; // Limpia texto.
    networkStatus.className = "network-status is-hidden"; // Oculta banner.
    return;
  }

  networkStatus.textContent = message; // Mensaje visible para usuario.
  networkStatus.className = `network-status network-status-${type}`; // Clase según estado.
}

// Muestra un aviso "cargando..." en pantalla.
function showLoading(message) {
  if (networkSuccessTimer) {
    window.clearTimeout(networkSuccessTimer);
    networkSuccessTimer = null;
  }
  updateNetworkStatus("loading", message);
}

// Muestra error visible para el usuario.
function showError(message) {
  if (networkSuccessTimer) {
    window.clearTimeout(networkSuccessTimer);
    networkSuccessTimer = null;
  }
  updateNetworkStatus("error", message);
}

// Muestra éxito visible y luego lo oculta automáticamente.
function showSuccess(message, { autoHideMs = 1800 } = {}) {
  if (networkSuccessTimer) {
    window.clearTimeout(networkSuccessTimer);
  }
  updateNetworkStatus("success", message);
  networkSuccessTimer = window.setTimeout(() => {
    updateNetworkStatus("", "");
    networkSuccessTimer = null;
  }, autoHideMs);
}

// Desactiva/re-activa controles mientras hay una operación crítica.
// Así evitamos dobles clics y estados inconsistentes.
function setGlobalRequestBusy(isBusy) {
  const submitBtn = form?.querySelector('button[type="submit"]');
  if (submitBtn) submitBtn.disabled = isBusy; // Bloquea botón principal.
  if (input) input.disabled = isBusy; // Bloquea input de título.
  if (taskDateInput) taskDateInput.disabled = isBusy; // Bloquea input fecha.
  if (completeAllBtn) completeAllBtn.disabled = isBusy; // Bloquea acción masiva.
  if (clearCompletedBtn) clearCompletedBtn.disabled = isBusy; // Bloquea acción masiva.
  if (busquedaInput) busquedaInput.disabled = isBusy; // Bloquea búsqueda.
  if (taskList) taskList.classList.toggle("network-busy", isBusy); // Cambia estilo visual de "ocupado".
}

// ─── Persistencia y sincronización de estado ──────────────────────
// Importante:
// - `guardarTareas` ya no escribe localStorage.
// - la persistencia real sucede vía API (syncTasks / updateTask / createTask).

function guardarTareas() {
  // Mantiene actualizado calendario tras cambios locales del DOM.
  // Persistencia remota ocurre en `persistFromDom` -> `scheduleSyncWithApi`.
  refreshCalendarView(); // Redibuja calendario cuando cambian tareas.
}

async function cargarTareasIniciales() {
  // Flujo de arranque:
  // 1) mostramos loading
  // 2) pedimos tareas al backend
  // 3) renderizamos en UI
  // 4) mostramos éxito/error
  showLoading("Cargando tareas...");
  setGlobalRequestBusy(true);
  try {
    // Carga inicial 100% desde backend (antes: localStorage).
    const tareasApi = await getTasks();
    const listado = Array.isArray(tareasApi) ? tareasApi : []; // Asegura array válido.
    tareas = listado.map(mapApiTaskToUi); // Convierte formato API -> UI.
    if (!taskList) return; // Sale si no hay lista en DOM.
    window.TaskflowTasks?.renderTasks(taskList, tareas); // Render inicial.
    showSuccess("Tareas cargadas correctamente.");
  } catch (error) {
    console.error("Error cargando tareas desde API:", error);
    // Si falla backend, renderiza vacío para ser transparente
    // (sin fallback a almacenamiento local de tareas).
    tareas = [];
    if (!taskList) return; // Evita error si no existe contenedor.
    window.TaskflowTasks?.renderTasks(taskList, tareas); // Render vacío ante error.
    showError("No se pudo cargar desde la API. Revisa el servidor e intenta de nuevo.");
  } finally {
    setGlobalRequestBusy(false);
  }
}

// ─── Filtros y métricas para calendario/lista ─────────────────────

function obtenerConteoTareasPorFecha() {
  return window.TaskflowFilters?.getCountsByDate(tareas) || {};
}

function aplicarFiltrosTareas() {
  window.TaskflowFilters?.applyTaskFilters({
    taskList,
    busquedaValue: busquedaInput?.value || "",
    selectedDateFilter // Fecha seleccionada para filtrado.
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
  // Lee el estado actual del DOM y lo guarda en variable `tareas`.
  // Importante: aquí capturamos también el ORDEN en pantalla.
  tareas = window.TaskflowTasks?.collectTasksFromDom(taskList) || [];
}

function persistFromDom({ applyFilters = false } = {}) {
  // Reconstruye una "foto actual" del DOM (orden, subtareas y texto editado).
  reconstruirArray();
  guardarTareas();
  if (applyFilters) aplicarFiltrosTareas(); // Reaplica filtros si cambió fecha/texto.
  // Programa guardado en backend con pequeña espera para agrupar cambios.
  scheduleSyncWithApi();
}

// Sincroniza estado completo cliente -> servidor.
// Se usa para persistir cambios estructurales que no siempre pasan por PATCH
// unitario (por ejemplo, drag&drop o cambios masivos de subtareas).
async function syncDomStateToApi() {
  if (syncInFlight) { // Si ya hay sync en curso...
    hasPendingSync = true; // ...marcamos otra para después.
    return;
  }

  syncInFlight = true;
  // Foto final que mandamos al backend.
  const payload = tareas.map((task, index) => mapUiTaskToApi(task, index));
  try {
    await syncTasks(payload); // Envía el estado completo actual al backend.
  } catch (error) {
    console.error("Error sincronizando tareas con API:", error);
    showError("No se pudo guardar algunos cambios.");
  } finally {
    syncInFlight = false;
    if (hasPendingSync) {
      hasPendingSync = false; // Limpia marca pendiente.
      scheduleSyncWithApi({ immediate: true }); // Lanza sync inmediata restante.
    }
  }
}

function scheduleSyncWithApi({ immediate = false } = {}) {
  // Evita mandar muchas peticiones seguidas por cambios muy rápidos.
  if (syncTimer) window.clearTimeout(syncTimer); // Reinicia la espera anterior.
  const delay = immediate ? 0 : 350; // Delay corto para agrupar cambios seguidos.
  syncTimer = window.setTimeout(() => {
    syncTimer = null; // Limpia referencia del timer.
    syncDomStateToApi(); // Ejecuta sync real.
  }, delay);
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
  onCreateTask: async ({ title, priority, dueDate }) => {
    showLoading("Guardando tarea...");
    try {
      // Crea y persiste inmediatamente en backend (POST).
      const created = await createTask({ title, priority, dueDate }); // POST nueva tarea.
      showSuccess("Tarea creada.");
      return mapApiTaskToUi(created);
    } catch (error) {
      showError("No se pudo crear la tarea.");
      throw error;
    }
  },
  onUpdateTask: async (id, payload, { silent = false } = {}) => {
    if (!silent) showLoading("Actualizando tarea...");
    try {
      // Persistencia incremental por campo/cambio puntual (PATCH).
      const updated = await updateTask(id, payload); // PATCH por id.
      if (!silent) showSuccess("Tarea actualizada.");
      return mapApiTaskToUi(updated);
    } catch (error) {
      if (!silent) showError("No se pudo actualizar la tarea.");
      throw error;
    }
  },
  onDeleteTask: async (id, { silent = false } = {}) => {
    if (!silent) showLoading("Eliminando tarea...");
    try {
      await deleteTask(id); // DELETE por id.
      if (!silent) showSuccess("Tarea eliminada.");
    } catch (error) {
      if (!silent) showError("No se pudo eliminar la tarea.");
      throw error;
    }
  },
  onNetworkLoading: showLoading,
  onNetworkSuccess: showSuccess,
  onNetworkError: showError,
  onPersist: persistFromDom,
  onSyncNow: () => scheduleSyncWithApi({ immediate: true }),
  onApplyFilters: aplicarFiltrosTareas
});

// ─── Inicialización UI global ─────────────────────────────────────

document.addEventListener("DOMContentLoaded", () => {
  let currentView = "tasks"; // Vista inicial por defecto.
  let calendarDate = new Date(); // Mes inicial del calendario.
  selectedDateFilter = ""; // Filtro fecha inicial vacío.
  let setView = () => {}; // Se asigna después con implementación real.

  // Callback de día seleccionado en calendario.
  const handleCalendarDaySelect = (pickedDate) => {
    setDateFilter(pickedDate, { clearSearch: true });
    setView("tasks");
  };

  // Aplica/cancela filtro por fecha.
  const setDateFilter = (dateString, { clearSearch = false } = {}) => {
    selectedDateFilter = dateString || "";
    if (clearSearch && busquedaInput) busquedaInput.value = ""; // Limpia búsqueda al seleccionar fecha.
    actualizarBarraFiltroFecha();
    aplicarFiltrosTareas();
    renderCalendar(calendarDate, handleCalendarDaySelect);
  };

  // Alterna entre vista de tareas y vista de calendario.
  setView = (view) => {
    if (!tasksView || !calendarView) return; // Sale si faltan nodos de vistas.
    const showCalendar = view === "calendar";
    tasksView.classList.toggle("view-hidden", showCalendar);
    calendarView.classList.toggle("view-hidden", !showCalendar);
    currentView = showCalendar ? "calendar" : "tasks";

    sidebarViewItems.forEach(item => { // Marca item activo en sidebar.
      const isActive = item.dataset.view === currentView;
      item.classList.toggle("active", isActive);
    });

    if (showCalendar) renderCalendar(calendarDate, handleCalendarDaySelect); // Render solo si vista calendario.
  };

  // Re-render global de calendario tras cambios de tareas.
  refreshCalendarView = () => renderCalendar(calendarDate, handleCalendarDaySelect); // Callback global de refresh.

  // Navegación lateral por vistas.
  sidebarViewItems.forEach(item => {
    item.addEventListener("click", (e) => {
      e.preventDefault();
      setView(item.dataset.view || "tasks"); // Cambia vista según data-view.
    });
  });

  // Navegación entre meses del calendario.
  if (calendarPrevBtn) {
    calendarPrevBtn.addEventListener("click", () => {
      calendarDate = new Date(calendarDate.getFullYear(), calendarDate.getMonth() - 1, 1); // Mes anterior.
      refreshCalendarView();
    });
  }

  if (calendarNextBtn) {
    calendarNextBtn.addEventListener("click", () => {
      calendarDate = new Date(calendarDate.getFullYear(), calendarDate.getMonth() + 1, 1); // Mes siguiente.
      refreshCalendarView();
    });
  }

  // Limpia filtro por fecha manualmente.
  if (clearDateFilterBtn) {
    clearDateFilterBtn.addEventListener("click", () => setDateFilter(""));
  }

  // Estado inicial visual (arranca en vista tareas + filtros limpios).
  setView(currentView); // Pinta vista inicial.
  actualizarBarraFiltroFecha(); // Refresca barra de filtro.
  aplicarFiltrosTareas(); // Aplica filtro actual al iniciar.

  // Modo oscuro (con persistencia local deliberada).
  // Esta es la única parte que sigue usando localStorage porque es preferencia
  // de presentación, no dato de negocio de tareas.
  const darkToggle = document.querySelector("#dark-toggle");
  if (darkToggle) {
    const isDarkSaved = localStorage.getItem(DARK_MODE_KEY) === "true"; // Lee preferencia guardada.
    if (isDarkSaved) {
      document.documentElement.classList.add("dark"); // Activa tema oscuro.
      darkToggle.textContent = "☀️";
    } else {
      darkToggle.textContent = "🌙"; // Ícono modo oscuro no activo.
    }

    darkToggle.addEventListener("click", () => {
      document.documentElement.classList.toggle("dark"); // Alterna clase dark.
      const isDarkActive = document.documentElement.classList.contains("dark");
      localStorage.setItem(DARK_MODE_KEY, String(isDarkActive)); // Persiste preferencia visual.
      darkToggle.textContent = isDarkActive ? "☀️" : "🌙"; // Cambia icono según estado.
    });
  }

  // Sidebar contraído/expandido (sin persistencia local).
  const menuToggle = document.querySelector(".menu-toggle");
  const sidebar = document.querySelector(".sidebar");
  if (menuToggle && sidebar) {
    menuToggle.addEventListener("click", () => {
      sidebar.classList.toggle("closed"); // Muestra/oculta sidebar.
    });
  }
});

// ─── Arranque inicial ─────────────────────────────────────────────

cargarTareasIniciales(); // Dispara carga inicial desde backend.
