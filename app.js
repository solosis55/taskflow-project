console.log("JS conectado");

// ═══════════════════════════════════════════════════════════════════
// REFERENCIAS AL DOM
// ═══════════════════════════════════════════════════════════════════
// Resumen: nodos principales de la interfaz usados en toda la app.

const form = document.querySelector("#task-form");
const input = document.querySelector("#nueva-tarea");
const taskList = document.querySelector("#task-list");
const busquedaInput = document.querySelector("#busqueda-input");
// Botones de acciones masivas sobre tareas principales.
const completeAllBtn = document.querySelector("#complete-all-btn");
const clearCompletedBtn = document.querySelector("#clear-completed-btn");

// ═══════════════════════════════════════════════════════════════════
// ESTADO Y PERSISTENCIA (localStorage)
// ═══════════════════════════════════════════════════════════════════
// Resumen: origen de datos (`tareas`) y guardado/carga persistente.

let tareas = [];

// Guarda el estado completo de tareas/subtareas en LocalStorage.
// Se llama tras cualquier cambio de datos (crear, editar, ordenar, borrar, etc.).
function guardarTareas() {
  localStorage.setItem("tareas", JSON.stringify(tareas));
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
    taskList.appendChild(crearTarea(t.text, t.priority, subtasks, Boolean(t.done)));
  });
}

// ═══════════════════════════════════════════════════════════════════
// FUNCIONES DE TAREAS
// ═══════════════════════════════════════════════════════════════════
// Resumen: creacion de UI, conversion DOM->estado y utilidades.

const ETIQUETAS_PRIORIDAD = { high: "Alta", medium: "Media", low: "Baja" };

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
function crearTarea(texto, prioridad = "high", subtasks = [], done = false) {
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
  taskCheck.checked = done;
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
    const subtasks = Array.from(item.querySelectorAll(".subtask-item")).map(sub => ({
      text: sub.querySelector(".subtask-text").textContent,
      done: sub.querySelector(".subtask-check").checked
    }));

    // Persistimos tambien `done` para mantener estado de completada al recargar.
    tareas.push({ text: texto, priority: prioridad, subtasks, done });
  });
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
    reconstruirArray();
    guardarTareas();
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

// ═══════════════════════════════════════════════════════════════════
// EVENTOS DE TAREAS (agregar, eliminar, búsqueda, subtareas, prioridad)
// ═══════════════════════════════════════════════════════════════════
// Resumen: interacciones principales del usuario sobre la lista.

// Alta de tarea principal desde el formulario superior.
form.addEventListener("submit", (e) => {
  e.preventDefault();
  const texto = input.value.trim();
  if (!texto) return;

  const nueva = { text: texto, priority: "high", subtasks: [], done: false };
  tareas.push(nueva);
  taskList.appendChild(crearTarea(nueva.text, nueva.priority, nueva.subtasks, nueva.done));
  guardarTareas();
  input.value = "";
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
      reconstruirArray();
      guardarTareas();
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
      reconstruirArray();
      guardarTareas();
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

    reconstruirArray();
    guardarTareas();
    cerrarMenusPrioridad();
  }
});

// Doble clic sobre textos para habilitar edición inline.
taskList.addEventListener("dblclick", (e) => {
  const taskText = e.target.closest(".task-text");
  if (taskText) {
    activarEdicionInline(taskText, () => {
      reconstruirArray();
      guardarTareas();
    });
    return;
  }

  const subtaskText = e.target.closest(".subtask-text");
  if (subtaskText) {
    activarEdicionInline(subtaskText, () => {
      reconstruirArray();
      guardarTareas();
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
    reconstruirArray();
    guardarTareas();
    return;
  }

  if (!e.target.classList.contains("subtask-check")) return;

  const subtask = e.target.closest(".subtask-item");
  if (subtask) {
    subtask.classList.toggle("done", e.target.checked);
    reconstruirArray();
    guardarTareas();
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

    reconstruirArray();
    guardarTareas();
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

    reconstruirArray();
    guardarTareas();
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
    reconstruirArray();
    guardarTareas();
    return;
  }

  if (e.target.classList.contains("subtask-item")) {
    e.target.classList.remove("dragging-subtask");
    reconstruirArray();
    guardarTareas();
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
  const busqueda = busquedaInput.value.toLowerCase().trim();

  taskList.querySelectorAll(".task-card").forEach(tarea => {
    const textoPrincipal = tarea.querySelector(".task-text").textContent.toLowerCase();
    const textoSubtareas = Array.from(tarea.querySelectorAll(".subtask-text"))
      .map(s => s.textContent.toLowerCase())
      .join(" ");
    const coincide = textoPrincipal.includes(busqueda) || textoSubtareas.includes(busqueda);
    tarea.style.display = coincide ? "" : "none";
  });
});

document.addEventListener("click", cerrarMenusPrioridad);

// ═══════════════════════════════════════════════════════════════════
// UI: Modo oscuro + Sidebar (inicialización en DOMContentLoaded)
// ═══════════════════════════════════════════════════════════════════
// Resumen: preferencias visuales globales y estado del layout.

document.addEventListener("DOMContentLoaded", () => {
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
