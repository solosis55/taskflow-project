console.log("JS conectado");

// ═══════════════════════════════════════════════════════════════════
// REFERENCIAS AL DOM
// ═══════════════════════════════════════════════════════════════════
// Resumen: nodos principales de la interfaz usados en toda la app.

const form = document.querySelector("#task-form");
const input = document.querySelector("#nueva-tarea");
const taskDateInput = document.querySelector("#fecha-tarea");
const taskList = document.querySelector("#task-list");
const busquedaInput = document.querySelector("#busqueda-input");
// Botones de acciones masivas sobre tareas principales.
const completeAllBtn = document.querySelector("#complete-all-btn");
const clearCompletedBtn = document.querySelector("#clear-completed-btn");
const dateFilterBar = document.querySelector("#date-filter-bar");
const dateFilterText = document.querySelector("#date-filter-text");
const clearDateFilterBtn = document.querySelector("#clear-date-filter-btn");
const tasksView = document.querySelector("#tasks-view");
const calendarView = document.querySelector("#calendar-view");
const calendarMonthLabel = document.querySelector("#calendar-month-label");
const calendarDays = document.querySelector("#calendar-days");
const calendarPrevBtn = document.querySelector("#calendar-prev");
const calendarNextBtn = document.querySelector("#calendar-next");
const sidebarViewItems = document.querySelectorAll(".sidebar-item[data-view]");

// ═══════════════════════════════════════════════════════════════════
// ESTADO Y PERSISTENCIA (localStorage)
// ═══════════════════════════════════════════════════════════════════
// Resumen: origen de datos (`tareas`) y guardado/carga persistente.

let tareas = [];
let selectedDateFilter = "";
let refreshCalendarView = () => {};

// Guarda el estado completo de tareas/subtareas en LocalStorage.
// Se llama tras cualquier cambio de datos (crear, editar, ordenar, borrar, etc.).
function guardarTareas() {
  localStorage.setItem("tareas", JSON.stringify(tareas));
  refreshCalendarView();
}

// Reconstruye el DOM de tareas desde LocalStorage al iniciar la app.
// Si una tarea antigua no tiene subtasks, usa [] para mantener compatibilidad.
function cargarTareasGuardadas() {
  const guardadas = localStorage.getItem("tareas");
  if (!guardadas) return;

  tareas = JSON.parse(guardadas);
  taskList.innerHTML = "";
  tareas.forEach(t => {
    const subtasks = Array.isArray(t.subtasks) ? t.subtasks : [];
    const dueDate = typeof t.dueDate === "string" ? t.dueDate : "";
    taskList.appendChild(crearTarea(t.text, t.priority, subtasks, Boolean(t.done), dueDate));
  });
}

// ═══════════════════════════════════════════════════════════════════
// FUNCIONES DE TAREAS
// ═══════════════════════════════════════════════════════════════════
// Resumen: creacion de UI, conversion DOM->estado y utilidades.

const ETIQUETAS_PRIORIDAD = { high: "Alta", medium: "Media", low: "Baja" };

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

function obtenerConteoTareasPorFecha() {
  return tareas.reduce((acc, tarea) => {
    if (!tarea.dueDate) return acc;
    acc[tarea.dueDate] = (acc[tarea.dueDate] || 0) + 1;
    return acc;
  }, {});
}

function aplicarFiltrosTareas() {
  const busqueda = busquedaInput.value.toLowerCase().trim();

  taskList.querySelectorAll(".task-card").forEach(tarea => {
    const textoPrincipal = tarea.querySelector(".task-text").textContent.toLowerCase();
    const textoSubtareas = Array.from(tarea.querySelectorAll(".subtask-text"))
      .map(s => s.textContent.toLowerCase())
      .join(" ");
    const dueDate = tarea.querySelector(".task-date-input-card")?.value || "";
    const coincideTexto = textoPrincipal.includes(busqueda) || textoSubtareas.includes(busqueda);
    const coincideFecha = !selectedDateFilter || dueDate === selectedDateFilter;
    tarea.style.display = coincideTexto && coincideFecha ? "" : "none";
  });
}

function actualizarBarraFiltroFecha() {
  if (!dateFilterBar || !dateFilterText) return;
  if (!selectedDateFilter) {
    dateFilterBar.classList.add("view-hidden");
    return;
  }

  dateFilterText.textContent = `Filtrando por fecha: ${formatDateLong(selectedDateFilter)}`;
  dateFilterBar.classList.remove("view-hidden");
}

// Crea un <li> de micro tarea.
// - done: marca visual de completada.
// - animate: activa animacion de entrada cuando se agrega en runtime.
function crearSubtaskItem(texto, done = false, animate = true) {
  const item = document.createElement("li");
  item.className = "subtask-item";
  item.draggable = true;
  item.innerHTML = `
    <label class="subtask-row">
      <input type="checkbox" class="subtask-check">
      <span class="subtask-text"></span>
    </label>
    <button class="delete-subtask" type="button" aria-label="Eliminar micro tarea">✕</button>
  `;

  const textNode = item.querySelector(".subtask-text");
  const checkNode = item.querySelector(".subtask-check");
  textNode.textContent = texto;
  checkNode.checked = done;

  if (done) {
    item.classList.add("done");
  }

  if (animate) {
    item.classList.add("subtask-enter");
    window.requestAnimationFrame(() => {
      item.classList.remove("subtask-enter");
    });
  }

  return item;
}

// Crea una tarjeta de tarea completa (cabecera + acciones + bloque de subtareas).
// Recibe datos ya normalizados para renderizarla en el DOM.
// done: indica si la tarea principal esta completada (checkbox marcado).
function crearTarea(texto, prioridad = "high", subtasks = [], done = false, dueDate = "") {
  const li = document.createElement("li");
  li.className = "task-card";
  li.draggable = true;
  li.innerHTML = `
    <div class="task-card-top">
      <label class="task-row">
        <input type="checkbox" class="w-4 h-4 task-check">
        <span class="task-text flex-1"></span>
      </label>
      <div class="task-actions">
        <input type="date" class="task-date-input-card" aria-label="Fecha de tarea">
        <span class="priority ${prioridad} px-2 py-1 text-sm rounded">${ETIQUETAS_PRIORIDAD[prioridad]}</span>
        <button class="delete-task" type="button" aria-label="Eliminar tarea">🗑</button>
      </div>
    </div>

    <div class="subtasks">
      <div class="subtask-form">
        <input type="text" class="subtask-input" placeholder="Agregar micro tarea...">
        <button class="add-subtask" type="button">Agregar</button>
      </div>
      <ul class="subtask-list"></ul>
    </div>
  `;

  li.querySelector(".task-text").textContent = texto;
  const taskCheck = li.querySelector(".task-check");
  const taskDateControl = li.querySelector(".task-date-input-card");
  const normalizedDueDate = typeof dueDate === "string" ? dueDate : "";
  taskDateControl.value = normalizedDueDate;
  taskCheck.checked = done;
  li.dataset.dueDate = normalizedDueDate;
  li.classList.toggle("done", done);

  const subtaskList = li.querySelector(".subtask-list");
  subtasks.forEach(sub => {
    if (sub?.text) {
      subtaskList.appendChild(crearSubtaskItem(sub.text, Boolean(sub.done), false));
    }
  });

  return li;
}

// Traduce la clase CSS del badge a un valor de negocio ("high|medium|low").
function obtenerPrioridadDeBadge(badge) {
  if (badge.classList.contains("medium")) return "medium";
  if (badge.classList.contains("low")) return "low";
  return "high";
}

// Fuente de verdad del estado:
// Lee el DOM actual y reconstruye el array `tareas` con su estructura persistible.
function reconstruirArray() {
  tareas = [];
  taskList.querySelectorAll(".task-card").forEach(item => {
    const texto = item.querySelector(".task-text").textContent;
    const prioridad = obtenerPrioridadDeBadge(item.querySelector(".priority"));
    const done = item.querySelector(".task-check").checked;
    const dueDate = item.querySelector(".task-date-input-card")?.value || "";
    const subtasks = Array.from(item.querySelectorAll(".subtask-item")).map(sub => ({
      text: sub.querySelector(".subtask-text").textContent,
      done: sub.querySelector(".subtask-check").checked
    }));

    // Persistimos tambien `done` para mantener estado de completada al recargar.
    item.dataset.dueDate = dueDate;
    tareas.push({ text: texto, priority: prioridad, subtasks, done, dueDate });
  });
}

// Reutilizable: sincroniza estado desde DOM y persiste en localStorage.
function persistFromDom({ applyFilters = false } = {}) {
  reconstruirArray();
  guardarTareas();
  if (applyFilters) aplicarFiltrosTareas();
}

// Sincroniza solo la parte visual de "tarea completada" (clase CSS),
// separando presentacion de persistencia.
function syncTaskDoneVisual(taskCard, isDone) {
  if (!taskCard) return;
  taskCard.classList.toggle("done", isDone);
}

// Cierra todos los menús emergentes de prioridad para evitar solapamientos.
function cerrarMenusPrioridad() {
  document.querySelectorAll(".priority-menu").forEach(m => m.remove());
  document.querySelectorAll(".task-card.menu-open").forEach(t => t.classList.remove("menu-open"));
}

// Elimina una subtask con transición visual y, al finalizar, persiste el nuevo estado.
function eliminarSubtaskConAnimacion(subtask) {
  if (!subtask) return;

  subtask.classList.add("removing");
  subtask.draggable = false;

  const finalize = () => {
    if (!subtask.isConnected) return;
    subtask.remove();
    persistFromDom();
  };

  subtask.addEventListener("transitionend", finalize, { once: true });
  window.setTimeout(finalize, 250);
}

// Convierte un texto (<span>) en un input temporal para edición inline.
// Reglas UX:
// - Enter: guardar
// - Escape: cancelar
// - Blur: guardar
// Además desactiva draggable temporalmente para evitar conflicto con drag&drop.
function activarEdicionInline(textNode, onSave) {
  if (!textNode || textNode.classList.contains("editing")) return;

  const valorOriginal = textNode.textContent.trim();
  const parentTask = textNode.closest(".task-card");
  const parentSubtask = textNode.closest(".subtask-item");
  const targetDraggable = parentSubtask || parentTask;

  const inputEdit = document.createElement("input");
  inputEdit.type = "text";
  inputEdit.className = textNode.classList.contains("task-text")
    ? "inline-edit-input task-edit-input"
    : "inline-edit-input subtask-edit-input";
  inputEdit.value = valorOriginal;

  textNode.classList.add("editing");
  textNode.replaceWith(inputEdit);
  if (targetDraggable) targetDraggable.draggable = false;

  inputEdit.focus();
  inputEdit.select();

  let finalizado = false;

  const finalizarEdicion = (guardarCambios) => {
    if (finalizado) return;
    finalizado = true;

    const nuevoValor = guardarCambios ? inputEdit.value.trim() : valorOriginal;
    const textoFinal = nuevoValor || valorOriginal;

    const newTextNode = document.createElement("span");
    newTextNode.className = textNode.className.replace(" editing", "");
    newTextNode.textContent = textoFinal;
    inputEdit.replaceWith(newTextNode);

    if (targetDraggable) targetDraggable.draggable = true;

    if (guardarCambios && textoFinal !== valorOriginal) {
      onSave(textoFinal);
    }
  };

  inputEdit.addEventListener("keydown", (e) => {
    if (e.key === "Enter") {
      e.preventDefault();
      finalizarEdicion(true);
      return;
    }

    if (e.key === "Escape") {
      e.preventDefault();
      finalizarEdicion(false);
    }
  });

  inputEdit.addEventListener("blur", () => finalizarEdicion(true));
}

// Dado un contenedor y la posición vertical del cursor, calcula
// el elemento de referencia donde insertar el item arrastrado.
// Se usa tanto para reordenar task-card como subtask-item.
function getDragAfterElement(container, selector, y, draggingClass) {
  const elements = [...container.querySelectorAll(`${selector}:not(.${draggingClass})`)];

  return elements.reduce(
    (closest, child) => {
      const box = child.getBoundingClientRect();
      const offset = y - box.top - box.height / 2;

      if (offset < 0 && offset > closest.offset) {
        return { offset, element: child };
      }

      return closest;
    },
    { offset: Number.NEGATIVE_INFINITY, element: null }
  ).element;
}

// Renderiza una cuadrícula mensual simple (lunes-domingo) para la vista calendario.
function renderCalendar(date, onDaySelect = null) {
  if (!calendarMonthLabel || !calendarDays) return;

  const year = date.getFullYear();
  const month = date.getMonth();
  const firstDay = new Date(year, month, 1);
  const lastDay = new Date(year, month + 1, 0);
  const totalDays = lastDay.getDate();
  const firstWeekday = (firstDay.getDay() + 6) % 7; // Convierte domingo=0 a lunes=0.
  const today = new Date();
  const conteos = obtenerConteoTareasPorFecha();

  calendarMonthLabel.textContent = date.toLocaleDateString("es-ES", {
    month: "long",
    year: "numeric"
  });

  calendarDays.innerHTML = "";

  for (let i = 0; i < firstWeekday; i += 1) {
    const emptyCell = document.createElement("div");
    emptyCell.className = "calendar-day empty";
    calendarDays.appendChild(emptyCell);
  }

  for (let day = 1; day <= totalDays; day += 1) {
    const dayCell = document.createElement("button");
    dayCell.type = "button";
    dayCell.className = "calendar-day";
    const dateKey = `${year}-${String(month + 1).padStart(2, "0")}-${String(day).padStart(2, "0")}`;
    dayCell.dataset.date = dateKey;
    dayCell.innerHTML = `<span class="calendar-day-number">${day}</span>`;

    const isToday =
      today.getFullYear() === year &&
      today.getMonth() === month &&
      today.getDate() === day;

    if (isToday) {
      dayCell.classList.add("today");
    }

    if (selectedDateFilter && selectedDateFilter === dateKey) {
      dayCell.classList.add("selected");
    }

    const totalTareas = conteos[dateKey] || 0;
    if (totalTareas > 0) {
      const countBadge = document.createElement("span");
      countBadge.className = "calendar-task-count";
      countBadge.textContent = String(totalTareas);
      dayCell.appendChild(countBadge);
    }

    if (typeof onDaySelect === "function") {
      dayCell.addEventListener("click", () => onDaySelect(dateKey));
    }

    calendarDays.appendChild(dayCell);
  }
}

// ═══════════════════════════════════════════════════════════════════
// EVENTOS DE TAREAS (agregar, eliminar, búsqueda, subtareas, prioridad)
// ═══════════════════════════════════════════════════════════════════
// Resumen: interacciones principales del usuario sobre la lista.

// Alta de tarea principal desde el formulario superior.
form.addEventListener("submit", (e) => {
  e.preventDefault();
  const texto = input.value.trim();
  if (!texto) return;
  const dueDate = taskDateInput?.value || "";

  const nueva = { text: texto, priority: "high", subtasks: [], done: false, dueDate };
  tareas.push(nueva);
  taskList.appendChild(crearTarea(nueva.text, nueva.priority, nueva.subtasks, nueva.done, nueva.dueDate));
  guardarTareas();
  input.value = "";
  if (taskDateInput) taskDateInput.value = "";
  aplicarFiltrosTareas();
});

// Delegación de clicks dentro de #task-list:
// maneja borrar tarea, agregar/borrar subtask y menú de prioridad.
taskList.addEventListener("click", (e) => {
  // Eliminar tarea principal
  if (e.target.classList.contains("delete-task")) {
    const tarea = e.target.closest(".task-card");
    if (tarea) {
      const confirmado = window.confirm("Estas seguro que quieres borrar la tarea?");
      if (!confirmado) return;
      tarea.remove();
      persistFromDom();
    }
    return;
  }

  // Agregar micro tarea
  if (e.target.classList.contains("add-subtask")) {
    const tarea = e.target.closest(".task-card");
    const inputSub = tarea?.querySelector(".subtask-input");
    const listSub = tarea?.querySelector(".subtask-list");
    const textoSub = inputSub?.value.trim();

    if (textoSub && listSub) {
      listSub.appendChild(crearSubtaskItem(textoSub, false));
      inputSub.value = "";
      persistFromDom();
    }
    return;
  }

  // Eliminar micro tarea
  if (e.target.classList.contains("delete-subtask")) {
    const subtask = e.target.closest(".subtask-item");
    eliminarSubtaskConAnimacion(subtask);
    return;
  }

  // Abrir menú de prioridad
  if (e.target.classList.contains("priority")) {
    e.stopPropagation();
    const prioridad = e.target;
    const tarea = prioridad.closest(".task-card");

    cerrarMenusPrioridad();
    tarea.classList.add("menu-open");

    const menu = document.createElement("div");
    menu.className = "priority-menu";
    menu.innerHTML = `
      <div class="priority-option high">Alta</div>
      <div class="priority-option medium">Media</div>
      <div class="priority-option low">Baja</div>
    `;

    prioridad.appendChild(menu);
    return;
  }

  // Seleccionar prioridad
  if (e.target.classList.contains("priority-option")) {
    const opcion = e.target;
    const prioridad = opcion.closest(".priority");
    const nivel = opcion.classList.contains("high")
      ? "high"
      : opcion.classList.contains("medium")
        ? "medium"
        : "low";

    prioridad.classList.remove("high", "medium", "low");
    prioridad.classList.add(nivel);
    prioridad.textContent = opcion.textContent;

    persistFromDom();
    cerrarMenusPrioridad();
  }
});

// Doble clic sobre textos para habilitar edición inline.
taskList.addEventListener("dblclick", (e) => {
  const taskText = e.target.closest(".task-text");
  if (taskText) {
    activarEdicionInline(taskText, () => {
      persistFromDom();
    });
    return;
  }

  const subtaskText = e.target.closest(".subtask-text");
  if (subtaskText) {
    activarEdicionInline(subtaskText, () => {
      persistFromDom();
    });
  }
});

// Enter en input de subtarea equivale a pulsar botón "Agregar".
taskList.addEventListener("keydown", (e) => {
  if (e.key !== "Enter" || !e.target.classList.contains("subtask-input")) return;

  e.preventDefault();
  const tarea = e.target.closest(".task-card");
  const boton = tarea?.querySelector(".add-subtask");
  if (boton) {
    boton.click();
  }
});

// Cambio en checkbox de subtask: actualiza estilo done y persiste.
taskList.addEventListener("change", (e) => {
  // Feature nueva: checkbox de tarea principal
  // -> actualiza estilo completada + persistencia en localStorage.
  if (e.target.classList.contains("task-check")) {
    const taskCard = e.target.closest(".task-card");
    syncTaskDoneVisual(taskCard, e.target.checked);
    persistFromDom();
    return;
  }

  if (e.target.classList.contains("task-date-input-card")) {
    const taskCard = e.target.closest(".task-card");
    if (taskCard) {
      taskCard.dataset.dueDate = e.target.value || "";
    }
    persistFromDom({ applyFilters: true });
    return;
  }

  if (!e.target.classList.contains("subtask-check")) return;

  const subtask = e.target.closest(".subtask-item");
  if (subtask) {
    subtask.classList.toggle("done", e.target.checked);
    persistFromDom();
  }
});

// Feature nueva: marcar todas las tareas principales como completadas.
// Recorre todas las tarjetas, marca su checkbox y guarda estado final.
if (completeAllBtn) {
  completeAllBtn.addEventListener("click", () => {
    taskList.querySelectorAll(".task-card").forEach(card => {
      const check = card.querySelector(".task-check");
      if (check) check.checked = true;
      syncTaskDoneVisual(card, true);
    });

    persistFromDom();
  });
}

// Feature nueva: eliminar solo tareas principales completadas.
// Usa el checkbox de cada task-card como criterio de borrado.
if (clearCompletedBtn) {
  clearCompletedBtn.addEventListener("click", () => {
    taskList.querySelectorAll(".task-card").forEach(card => {
      const check = card.querySelector(".task-check");
      if (check?.checked) card.remove();
    });

    persistFromDom();
  });
}

// Arrastrar y reordenar tarjetas/subtarjetas
// Resumen: drag&drop para cambiar orden y persistir al finalizar.
taskList.addEventListener("dragstart", (e) => {
  if (e.target.classList.contains("task-card")) {
    e.target.classList.add("dragging-task");
    e.dataTransfer.effectAllowed = "move";
    cerrarMenusPrioridad();
    return;
  }

  if (e.target.classList.contains("subtask-item")) {
    e.target.classList.add("dragging-subtask");
    e.dataTransfer.effectAllowed = "move";
  }
});

taskList.addEventListener("dragend", (e) => {
  if (e.target.classList.contains("task-card")) {
    e.target.classList.remove("dragging-task");
    persistFromDom();
    return;
  }

  if (e.target.classList.contains("subtask-item")) {
    e.target.classList.remove("dragging-subtask");
    persistFromDom();
  }
});

// Reordena dinámicamente según la posición del cursor durante el drag.
taskList.addEventListener("dragover", (e) => {
  const draggingTask = taskList.querySelector(".dragging-task");
  if (draggingTask) {
    e.preventDefault();
    const afterElement = getDragAfterElement(taskList, ".task-card", e.clientY, "dragging-task");
    if (afterElement === null) {
      taskList.appendChild(draggingTask);
    } else {
      taskList.insertBefore(draggingTask, afterElement);
    }
    return;
  }

  const draggingSubtask = taskList.querySelector(".dragging-subtask");
  if (!draggingSubtask) return;

  const targetList = e.target.closest(".subtask-list");
  if (!targetList) return;

  e.preventDefault();
  const afterElement = getDragAfterElement(targetList, ".subtask-item", e.clientY, "dragging-subtask");
  if (afterElement === null) {
    targetList.appendChild(draggingSubtask);
  } else {
    targetList.insertBefore(draggingSubtask, afterElement);
  }
});

// Filtro en tiempo real: busca coincidencias en tarea principal y subtareas.
busquedaInput.addEventListener("input", () => {
  aplicarFiltrosTareas();
});

document.addEventListener("click", cerrarMenusPrioridad);

// ═══════════════════════════════════════════════════════════════════
// UI: Modo oscuro + Sidebar (inicialización en DOMContentLoaded)
// ═══════════════════════════════════════════════════════════════════
// Resumen: preferencias visuales globales y estado del layout.

document.addEventListener("DOMContentLoaded", () => {
  // Navegación de vistas: tareas <-> calendario.
  let currentView = localStorage.getItem("currentView") || "tasks";
  let calendarDate = new Date();
  const savedDateFilter = localStorage.getItem("selectedDateFilter") || "";
  selectedDateFilter = savedDateFilter;
  let setView = () => {};

  const handleCalendarDaySelect = (pickedDate) => {
    setDateFilter(pickedDate);
    setView("tasks");
  };

  const setDateFilter = (dateString) => {
    selectedDateFilter = dateString || "";
    localStorage.setItem("selectedDateFilter", selectedDateFilter);
    actualizarBarraFiltroFecha();
    aplicarFiltrosTareas();
    renderCalendar(calendarDate, handleCalendarDaySelect);
  };

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

  refreshCalendarView = () => {
    renderCalendar(calendarDate, handleCalendarDaySelect);
  };

  sidebarViewItems.forEach(item => {
    item.addEventListener("click", (e) => {
      e.preventDefault();
      setView(item.dataset.view || "tasks");
    });
  });

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

  if (clearDateFilterBtn) {
    clearDateFilterBtn.addEventListener("click", () => {
      setDateFilter("");
    });
  }

  setView(currentView);
  actualizarBarraFiltroFecha();
  aplicarFiltrosTareas();

  // Modo oscuro
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

  // Sidebar: restaura y persiste estado abierto/cerrado entre recargas.
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

// ═══════════════════════════════════════════════════════════════════
// CARGA INICIAL
// ═══════════════════════════════════════════════════════════════════
// Resumen: primer render desde LocalStorage al abrir la app.

cargarTareasGuardadas();
