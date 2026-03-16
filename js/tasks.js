// ═══════════════════════════════════════════════════════════════════
// TASKS MODULE
// ═══════════════════════════════════════════════════════════════════
// Gestiona render, lectura de estado DOM y eventos de tareas/subtareas.

const ETIQUETAS_PRIORIDAD = { high: "Alta", medium: "Media", low: "Baja" };

// ─── Factories de UI ───────────────────────────────────────────────

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

  if (done) item.classList.add("done");

  if (animate) {
    item.classList.add("subtask-enter");
    window.requestAnimationFrame(() => item.classList.remove("subtask-enter"));
  }

  return item;
}

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
  subtasks.forEach((sub) => {
    if (sub?.text) {
      subtaskList.appendChild(crearSubtaskItem(sub.text, Boolean(sub.done), false));
    }
  });

  return li;
}

// ─── Estado <-> DOM ───────────────────────────────────────────────

function obtenerPrioridadDeBadge(badge) {
  if (badge.classList.contains("medium")) return "medium";
  if (badge.classList.contains("low")) return "low";
  return "high";
}

function collectTasksFromDom(taskList) {
  const tareas = [];
  taskList.querySelectorAll(".task-card").forEach((item) => {
    const texto = item.querySelector(".task-text").textContent;
    const prioridad = obtenerPrioridadDeBadge(item.querySelector(".priority"));
    const done = item.querySelector(".task-check").checked;
    const dueDate = item.querySelector(".task-date-input-card")?.value || "";
    const subtasks = Array.from(item.querySelectorAll(".subtask-item")).map(sub => ({
      text: sub.querySelector(".subtask-text").textContent,
      done: sub.querySelector(".subtask-check").checked
    }));

    item.dataset.dueDate = dueDate;
    tareas.push({ text: texto, priority: prioridad, subtasks, done, dueDate });
  });
  return tareas;
}

function renderTasks(taskList, tareas) {
  taskList.innerHTML = "";
  tareas.forEach((t) => {
    const subtasks = Array.isArray(t.subtasks) ? t.subtasks : [];
    const dueDate = typeof t.dueDate === "string" ? t.dueDate : "";
    taskList.appendChild(crearTarea(t.text, t.priority, subtasks, Boolean(t.done), dueDate));
  });
}

// ─── Utilidades visuales e interacción ────────────────────────────

function syncTaskDoneVisual(taskCard, isDone) {
  if (!taskCard) return;
  taskCard.classList.toggle("done", isDone);
}

function cerrarMenusPrioridad() {
  document.querySelectorAll(".priority-menu").forEach(m => m.remove());
  document.querySelectorAll(".task-card.menu-open").forEach(t => t.classList.remove("menu-open"));
}

// Quita subtarea con transición y persiste al finalizar.
function eliminarSubtaskConAnimacion(subtask, onPersist) {
  if (!subtask) return;

  subtask.classList.add("removing");
  subtask.draggable = false;

  const finalize = () => {
    if (!subtask.isConnected) return;
    subtask.remove();
    onPersist();
  };

  subtask.addEventListener("transitionend", finalize, { once: true });
  window.setTimeout(finalize, 250);
}

// Edición inline reutilizable para texto de tarea y subtarea.
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
    if (guardarCambios && textoFinal !== valorOriginal) onSave(textoFinal);
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

// Utilidad DnD para calcular punto de inserción según cursor.
function getDragAfterElement(container, selector, y, draggingClass) {
  const elements = [...container.querySelectorAll(`${selector}:not(.${draggingClass})`)];
  return elements.reduce(
    (closest, child) => {
      const box = child.getBoundingClientRect();
      const offset = y - box.top - box.height / 2;
      if (offset < 0 && offset > closest.offset) return { offset, element: child };
      return closest;
    },
    { offset: Number.NEGATIVE_INFINITY, element: null }
  ).element;
}

// ─── Binding de eventos ───────────────────────────────────────────

function bindTaskEvents({
  form,
  input,
  taskDateInput,
  taskList,
  busquedaInput,
  completeAllBtn,
  clearCompletedBtn,
  onPersist,
  onApplyFilters
}) {
  if (!form || !taskList) return;

  // Alta de tarea principal.
  form.addEventListener("submit", (e) => {
    e.preventDefault();
    const texto = input.value.trim();
    if (!texto) return;
    const dueDate = taskDateInput?.value || "";

    taskList.appendChild(crearTarea(texto, "high", [], false, dueDate));
    onPersist({ applyFilters: true });
    input.value = "";
    if (taskDateInput) taskDateInput.value = "";
  });

  // Delegación de click para acciones de tarea/subtarea/prioridad.
  taskList.addEventListener("click", (e) => {
    if (e.target.classList.contains("delete-task")) {
      const tarea = e.target.closest(".task-card");
      if (tarea) {
        const confirmado = window.confirm("Estas seguro que quieres borrar la tarea?");
        if (!confirmado) return;
        tarea.remove();
        onPersist();
      }
      return;
    }

    if (e.target.classList.contains("add-subtask")) {
      const tarea = e.target.closest(".task-card");
      const inputSub = tarea?.querySelector(".subtask-input");
      const listSub = tarea?.querySelector(".subtask-list");
      const textoSub = inputSub?.value.trim();
      if (textoSub && listSub) {
        listSub.appendChild(crearSubtaskItem(textoSub, false));
        inputSub.value = "";
        onPersist();
      }
      return;
    }

    if (e.target.classList.contains("delete-subtask")) {
      const subtask = e.target.closest(".subtask-item");
      eliminarSubtaskConAnimacion(subtask, () => onPersist());
      return;
    }

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
      onPersist();
      cerrarMenusPrioridad();
    }
  });

  // Doble click para edición inline de textos.
  taskList.addEventListener("dblclick", (e) => {
    const taskText = e.target.closest(".task-text");
    if (taskText) {
      activarEdicionInline(taskText, () => onPersist());
      return;
    }

    const subtaskText = e.target.closest(".subtask-text");
    if (subtaskText) activarEdicionInline(subtaskText, () => onPersist());
  });

  // Enter en input de subtarea = clic en botón agregar.
  taskList.addEventListener("keydown", (e) => {
    if (e.key !== "Enter" || !e.target.classList.contains("subtask-input")) return;
    e.preventDefault();
    const tarea = e.target.closest(".task-card");
    const boton = tarea?.querySelector(".add-subtask");
    if (boton) boton.click();
  });

  // Cambios de checkboxes y de fecha de tarea.
  taskList.addEventListener("change", (e) => {
    if (e.target.classList.contains("task-check")) {
      const taskCard = e.target.closest(".task-card");
      syncTaskDoneVisual(taskCard, e.target.checked);
      onPersist();
      return;
    }

    if (e.target.classList.contains("task-date-input-card")) {
      const taskCard = e.target.closest(".task-card");
      if (taskCard) taskCard.dataset.dueDate = e.target.value || "";
      onPersist({ applyFilters: true });
      return;
    }

    if (!e.target.classList.contains("subtask-check")) return;
    const subtask = e.target.closest(".subtask-item");
    if (subtask) {
      subtask.classList.toggle("done", e.target.checked);
      onPersist();
    }
  });

  // Acción masiva: completar todas.
  if (completeAllBtn) {
    completeAllBtn.addEventListener("click", () => {
      taskList.querySelectorAll(".task-card").forEach(card => {
        const check = card.querySelector(".task-check");
        if (check) check.checked = true;
        syncTaskDoneVisual(card, true);
      });
      onPersist();
    });
  }

  // Acción masiva: borrar completadas.
  if (clearCompletedBtn) {
    clearCompletedBtn.addEventListener("click", () => {
      taskList.querySelectorAll(".task-card").forEach(card => {
        const check = card.querySelector(".task-check");
        if (check?.checked) card.remove();
      });
      onPersist();
    });
  }

  // Inicio drag para tareas y subtareas.
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

  // Fin drag: persistir nuevo orden.
  taskList.addEventListener("dragend", (e) => {
    if (e.target.classList.contains("task-card")) {
      e.target.classList.remove("dragging-task");
      onPersist();
      return;
    }
    if (e.target.classList.contains("subtask-item")) {
      e.target.classList.remove("dragging-subtask");
      onPersist();
    }
  });

  // Reordenamiento dinámico durante el drag.
  taskList.addEventListener("dragover", (e) => {
    const draggingTask = taskList.querySelector(".dragging-task");
    if (draggingTask) {
      e.preventDefault();
      const afterElement = getDragAfterElement(taskList, ".task-card", e.clientY, "dragging-task");
      if (afterElement === null) taskList.appendChild(draggingTask);
      else taskList.insertBefore(draggingTask, afterElement);
      return;
    }

    const draggingSubtask = taskList.querySelector(".dragging-subtask");
    if (!draggingSubtask) return;
    const targetList = e.target.closest(".subtask-list");
    if (!targetList) return;

    e.preventDefault();
    const afterElement = getDragAfterElement(targetList, ".subtask-item", e.clientY, "dragging-subtask");
    if (afterElement === null) targetList.appendChild(draggingSubtask);
    else targetList.insertBefore(draggingSubtask, afterElement);
  });

  // Filtro de texto en tiempo real.
  if (busquedaInput) {
    busquedaInput.addEventListener("input", () => onApplyFilters());
  }

  // Cierre de menús de prioridad al clicar fuera.
  document.addEventListener("click", cerrarMenusPrioridad);
}

// ─── API pública del módulo ───────────────────────────────────────

window.TaskflowTasks = {
  renderTasks,
  collectTasksFromDom,
  bindTaskEvents
};
