// FRONTEND TASKS (UI + INTERACCIÓN)
// Este módulo está orientado al ciclo completo de interacción de tareas:
// - crear/renderizar tarjetas y subtareas
// - eventos de usuario (click, dblclick, change, drag&drop)
// - lectura de estado actual desde DOM
//
// Contexto de persistencia:
// - Este archivo NO usa localStorage para tareas.
// - Cada cambio relevante se comunica al orquestador (`bootstrap.js`) vía
//   callbacks (`onPersist`, `onUpdateTask`, `onSyncNow`) para guardarlo
//   en backend.
//
// GLOSARIO (modo principiante):
// - Callback: función que este módulo recibe para "avisar" a otro módulo.
// - onPersist: "Hubo cambios en el DOM, reconstruye y sincroniza".
// - onUpdateTask: "Actualiza un campo puntual en backend (PATCH)".
// - onSyncNow: "Guarda ahora mismo, sin esperar".

const ETIQUETAS_PRIORIDAD = { high: "Alta", medium: "Media", low: "Baja" }; // Mapa nivel->texto visible.
// Genera ID temporal para subtareas creadas en cliente antes de sincronizar.
const createLocalId = () => (window.crypto?.randomUUID?.() || `local-${Date.now()}-${Math.random()}`);

// ─── Factories de UI ───────────────────────────────────────────────

function crearSubtaskItem(texto, done = false, animate = true, id = "") {
  // Cada subtarea existe como <li> dentro de la tarjeta de tarea.
  // Guardamos ID en data-subtask-id para poder guardar subtareas en backend.
  const item = document.createElement("li");
  item.className = "subtask-item";
  item.draggable = true;
  if (id) item.dataset.subtaskId = id;
  item.innerHTML = `
    <label class="subtask-row">
      <input type="checkbox" class="subtask-check">
      <span class="subtask-text"></span>
    </label>
    <button class="delete-subtask" type="button" aria-label="Eliminar micro tarea">✕</button>
  `;

  const textNode = item.querySelector(".subtask-text"); // Nodo del texto de subtarea.
  const checkNode = item.querySelector(".subtask-check"); // Checkbox de subtarea.
  textNode.textContent = texto; // Pinta texto visible.
  checkNode.checked = done; // Marca estado completado.

  if (done) item.classList.add("done");

  if (animate) {
    item.classList.add("subtask-enter");
    window.requestAnimationFrame(() => item.classList.remove("subtask-enter"));
  }

  return item;
}

function crearTarea(texto, prioridad = "high", subtasks = [], done = false, dueDate = "", id = "") {
  // Esta función solo construye HTML y estado visual de la tarjeta.
  // Persistencia ocurre fuera (eventos + callbacks).
  const li = document.createElement("li");
  li.className = "task-card";
  li.draggable = true;
  if (id) li.dataset.id = id;
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
  const taskCheck = li.querySelector(".task-check"); // Checkbox principal de tarea.
  const taskDateControl = li.querySelector(".task-date-input-card"); // Input fecha en tarjeta.
  const normalizedDueDate = typeof dueDate === "string" ? dueDate : ""; // Sanitiza fecha entrante.
  taskDateControl.value = normalizedDueDate; // Asigna fecha al input.
  taskCheck.checked = done; // Asigna estado completado.
  li.dataset.dueDate = normalizedDueDate;
  li.classList.toggle("done", done);

  const subtaskList = li.querySelector(".subtask-list");
  subtasks.forEach((sub) => {
    if (sub?.text) {
      subtaskList.appendChild(crearSubtaskItem(sub.text, Boolean(sub.done), false, sub.id || ""));
    }
  });

  return li;
}

// ─── Estado <-> DOM ───────────────────────────────────────────────

function obtenerPrioridadDeBadge(badge) {
  if (badge.classList.contains("medium")) return "medium"; // Detecta clase media.
  if (badge.classList.contains("low")) return "low"; // Detecta clase baja.
  return "high"; // Si no coincide, asume alta.
}

function collectTasksFromDom(taskList) {
  // Convierte lo que se ve en pantalla en un objeto de datos.
  // Ese objeto se usa para guardar el estado completo en backend.
  const tareas = [];
  taskList.querySelectorAll(".task-card").forEach((item) => {
    const id = item.dataset.id || "";
    const texto = item.querySelector(".task-text").textContent;
    const prioridad = obtenerPrioridadDeBadge(item.querySelector(".priority"));
    const done = item.querySelector(".task-check").checked;
    const dueDate = item.querySelector(".task-date-input-card")?.value || "";
    const subtasks = Array.from(item.querySelectorAll(".subtask-item")).map(sub => ({
      id: sub.dataset.subtaskId || "",
      text: sub.querySelector(".subtask-text").textContent,
      done: sub.querySelector(".subtask-check").checked
    }));

    item.dataset.dueDate = dueDate;
    tareas.push({ id, text: texto, priority: prioridad, subtasks, done, dueDate });
  });
  return tareas;
}

function renderTasks(taskList, tareas) {
  taskList.innerHTML = ""; // Limpia lista antes de render completo.
  tareas.forEach((t) => {
    const subtasks = Array.isArray(t.subtasks) ? t.subtasks : [];
    const dueDate = typeof t.dueDate === "string" ? t.dueDate : "";
    taskList.appendChild(crearTarea(t.text, t.priority, subtasks, Boolean(t.done), dueDate, t.id || "")); // Inserta tarjeta en DOM.
  });
}

// ─── Utilidades visuales e interacción ────────────────────────────

function syncTaskDoneVisual(taskCard, isDone) {
  if (!taskCard) return; // Evita error si no encuentra tarjeta.
  taskCard.classList.toggle("done", isDone); // Aplica estilo visual completado.
}

function cerrarMenusPrioridad() {
  document.querySelectorAll(".priority-menu").forEach(m => m.remove()); // Cierra menús abiertos.
  document.querySelectorAll(".task-card.menu-open").forEach(t => t.classList.remove("menu-open")); // Limpia clase visual.
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
    // Si hubo cambio real, notificamos al exterior para persistir.
    if (guardarCambios && textoFinal !== valorOriginal) onSave(textoFinal, newTextNode);
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
  onCreateTask,
  onUpdateTask,
  onDeleteTask,
  onNetworkLoading,
  onNetworkSuccess,
  onNetworkError,
  onSyncNow,
  onPersist,
  onApplyFilters
}) {
  if (!form || !taskList) return; // Sale si no hay elementos mínimos para operar.

  // Alta de tarea principal.
  // 1) leer input
  // 2) crear en API (POST)
  // 3) renderizar en DOM
  // 4) sincronizar estado general
  form.addEventListener("submit", async (e) => {
    e.preventDefault(); // Evita recarga del formulario.
    const texto = input.value.trim(); // Lee texto sin espacios extra.
    if (!texto) return; // No crea tareas vacías.
    const dueDate = taskDateInput?.value || "";
    const submitBtn = form.querySelector('button[type="submit"]');
    const originalSubmitLabel = submitBtn?.textContent || "Agregar";

    if (onCreateTask) {
      if (submitBtn) {
        submitBtn.disabled = true; // Bloquea doble envío.
        submitBtn.textContent = "Guardando..."; // Feedback visual.
      }
      try {
        // Alta principal: persiste primero en API y luego renderiza en UI.
        const created = await onCreateTask({
          title: texto,
          priority: "high",
          dueDate
        });
        if (created) {
          const subtasks = Array.isArray(created.subtasks) ? created.subtasks : [];
          const priority = created.priority || "high";
          const createdDueDate = typeof created.dueDate === "string" ? created.dueDate : dueDate;
          taskList.appendChild(
            crearTarea(created.text || texto, priority, subtasks, Boolean(created.done), createdDueDate, created.id || "")
          );
          // onPersist reconstruye estado local y agenda guardado en backend.
          onPersist({ applyFilters: true });
          input.value = ""; // Limpia campo de texto tras alta.
          if (taskDateInput) taskDateInput.value = ""; // Limpia fecha inicial.
          return;
        }
      } catch (error) {
        console.error("Error creando tarea en API:", error);
        return;
      } finally {
        if (submitBtn) {
          submitBtn.disabled = false; // Reactiva botón.
          submitBtn.textContent = originalSubmitLabel; // Restaura etiqueta original.
        }
      }
    }

    // Fallback legacy/local visual.
    // En flujo actual normal no debería usarse si API está operativa.
    taskList.appendChild(crearTarea(texto, "high", [], false, dueDate));
    onPersist({ applyFilters: true });
    input.value = ""; // Limpia input de título.
    if (taskDateInput) taskDateInput.value = ""; // Limpia input de fecha.
  });

  // Delegación de click para acciones de tarea/subtarea/prioridad.
  // Patrón delegación reduce listeners por tarjeta y simplifica re-render.
  taskList.addEventListener("click", async (e) => {
    // Evita que click sobre texto active checkbox por efecto del <label>.
    // Esto es clave para que doble click de edición inline funcione bien.
    const clickedText = e.target.closest(".task-text, .subtask-text");
    if (clickedText) {
      e.preventDefault();
      return;
    }

    if (e.target.classList.contains("delete-task")) {
      const tarea = e.target.closest(".task-card");
      if (tarea) {
        const confirmado = window.confirm("Estas seguro que quieres borrar la tarea?"); // Confirmación antes de borrar.
        if (!confirmado) return;
        const taskId = tarea.dataset.id || "";
        const deleteBtn = e.target;
        if (taskId && onDeleteTask) {
          deleteBtn.disabled = true;
          try {
            await onDeleteTask(taskId);
          } catch (error) {
            console.error("Error eliminando tarea en API:", error);
            return;
          } finally {
            deleteBtn.disabled = false;
          }
        }
        tarea.remove(); // Quita tarjeta del DOM.
        // Después de borrar, vuelve a guardar el estado actualizado.
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
        listSub.appendChild(crearSubtaskItem(textoSub, false, true, createLocalId()));
        inputSub.value = ""; // Limpia input de subtarea.
        // Persistencia de microtareas va por sincronización global.
        onPersist();
      }
      return;
    }

    if (e.target.classList.contains("delete-subtask")) {
      const subtask = e.target.closest(".subtask-item");
      // Al terminar la animación, guarda cambios.
      eliminarSubtaskConAnimacion(subtask, () => onPersist());
      return;
    }

    if (e.target.classList.contains("priority")) {
      e.stopPropagation();
      const prioridad = e.target;
      const tarea = prioridad.closest(".task-card");
      cerrarMenusPrioridad(); // Cierra otros menús antes de abrir nuevo.
      tarea.classList.add("menu-open");

      const menu = document.createElement("div"); // Crea menú contextual de prioridad.
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
      const taskCard = prioridad?.closest(".task-card");
      const taskId = taskCard?.dataset.id || "";
      const nivel = opcion.classList.contains("high")
        ? "high"
        : opcion.classList.contains("medium")
          ? "medium"
          : "low";

      prioridad.classList.remove("high", "medium", "low"); // Limpia nivel previo.
      prioridad.classList.add(nivel);
      prioridad.textContent = opcion.textContent; // Actualiza etiqueta visible.
      // Guarda estado local + sincronización estructural.
      onPersist();
      cerrarMenusPrioridad();

      if (taskId && onUpdateTask) {
        // Persistencia incremental (PATCH) para feedback rápido.
        try {
          await onUpdateTask(taskId, { priority: nivel }, { silent: true });
          if (onNetworkSuccess) onNetworkSuccess("Prioridad actualizada.");
        } catch (error) {
          console.error("Error actualizando prioridad en API:", error);
          if (onNetworkError) onNetworkError("No se pudo guardar la prioridad.");
        }
      }
    }
  });

  // Doble click para edición inline de textos.
  // Flujo tarea:
  // - editar en DOM
  // - PATCH para título puntual
  // - guardado completo de seguridad
  //
  // Flujo subtarea:
  // - editar en DOM
  // - guardado completo (las subtareas se guardan en bloque)
  taskList.addEventListener("dblclick", (e) => {
    e.preventDefault();
    const target = e.target instanceof Element ? e.target : e.target?.parentElement;
    if (!target) return;

    const taskText = target.closest(".task-text");
    if (taskText) {
      activarEdicionInline(taskText, (nuevoTexto, textNode) => {
        // Actualiza estado local y agenda guardado.
        onPersist();
        const taskCard = textNode?.closest(".task-card");
        const taskId = taskCard?.dataset.id || "";
        if (taskId && onUpdateTask) {
          // Persistencia puntual de título en API.
          onUpdateTask(taskId, { title: nuevoTexto }, { silent: true }).catch((error) => {
            console.error("Error guardando edición inline en API:", error);
            if (onNetworkError) onNetworkError("No se pudo guardar el texto editado.");
          });
        }
        // Forzamos guardado inmediato para evitar desajustes.
        if (onSyncNow) onSyncNow();
      });
      return;
    }

    const subtaskText = target.closest(".subtask-text");
    if (subtaskText) {
      activarEdicionInline(subtaskText, () => {
        // Las subtareas se guardan en backend con guardado completo.
        onPersist();
        if (onSyncNow) onSyncNow();
      });
    }
  });

  // Enter en input de subtarea = clic en botón agregar.
  taskList.addEventListener("keydown", (e) => {
    if (e.key !== "Enter" || !e.target.classList.contains("subtask-input")) return;
    e.preventDefault();
    const tarea = e.target.closest(".task-card");
    const boton = tarea?.querySelector(".add-subtask");
    if (boton) boton.click(); // Reusa lógica de click agregar subtarea.
  });

  // Cambios de checkboxes y de fecha de tarea.
  // Estrategia híbrida:
  // - onPersist para guardar estructura completa
  // - PATCH puntual cuando existe endpoint específico
  taskList.addEventListener("change", async (e) => {
    if (e.target.classList.contains("task-check")) {
      const taskCard = e.target.closest(".task-card");
      syncTaskDoneVisual(taskCard, e.target.checked);
      onPersist();

      const taskId = taskCard?.dataset.id || "";
      if (taskId && onUpdateTask) {
        // Persistencia incremental de estado completed.
        try {
          await onUpdateTask(taskId, { completed: e.target.checked }, { silent: true });
        } catch (error) {
          console.error("Error actualizando completado en API:", error);
          if (onNetworkError) onNetworkError("No se pudo guardar el estado de completado.");
        }
      }
      return;
    }

    if (e.target.classList.contains("task-date-input-card")) {
      const taskCard = e.target.closest(".task-card");
      const taskId = taskCard?.dataset.id || "";
      if (taskCard) taskCard.dataset.dueDate = e.target.value || ""; // Actualiza fecha en data atributo.
      onPersist({ applyFilters: true });

      if (taskId && onUpdateTask) {
        // Persistencia incremental de fecha.
        try {
          await onUpdateTask(taskId, { dueDate: e.target.value || "" }, { silent: true });
          if (onNetworkSuccess) onNetworkSuccess("Fecha guardada.");
        } catch (error) {
          console.error("Error actualizando fecha en API:", error);
          if (onNetworkError) onNetworkError("No se pudo guardar la fecha.");
        }
      }
      return;
    }

    if (!e.target.classList.contains("subtask-check")) return;
    const subtask = e.target.closest(".subtask-item");
    if (subtask) {
        subtask.classList.toggle("done", e.target.checked); // Marca visual de subtarea completada.
      // Guarda cambio de "hecha/no hecha" de subtarea.
      onPersist();
    }
  });

  // Acción masiva: completar todas.
  if (completeAllBtn) {
    completeAllBtn.addEventListener("click", () => {
      taskList.querySelectorAll(".task-card").forEach(card => {
        const check = card.querySelector(".task-check");
        if (check) check.checked = true; // Marca checkbox de cada tarjeta.
        syncTaskDoneVisual(card, true);
      });
      // Persistencia masiva de estado.
      onPersist();
    });
  }

  // Acción masiva: borrar completadas.
  if (clearCompletedBtn) {
    clearCompletedBtn.addEventListener("click", async () => {
      const originalLabel = clearCompletedBtn.textContent;
      clearCompletedBtn.disabled = true; // Evita clicks repetidos durante proceso.
      clearCompletedBtn.textContent = "Eliminando..."; // Feedback de acción en curso.
      if (onNetworkLoading) onNetworkLoading("Eliminando tareas completadas...");

      let huboError = false;
      const cards = Array.from(taskList.querySelectorAll(".task-card"));
      for (const card of cards) {
        const check = card.querySelector(".task-check");
        if (!check?.checked) continue;

        const taskId = card.dataset.id || "";
        if (taskId && onDeleteTask) {
          try {
            await onDeleteTask(taskId, { silent: true });
          } catch (error) {
            console.error("Error eliminando tarea completada en API:", error);
            huboError = true;
            continue;
          }
        }

        card.remove();
      }
      // Persistencia masiva tras borrado.
      onPersist();

      clearCompletedBtn.disabled = false; // Reactiva botón.
      clearCompletedBtn.textContent = originalLabel; // Restaura texto original.

      if (huboError) {
        if (onNetworkError) onNetworkError("Algunas tareas no se pudieron eliminar.");
      } else if (onNetworkSuccess) {
        onNetworkSuccess("Tareas completadas eliminadas.");
      }
    });
  }

  // Inicio drag para tareas y subtareas.
  // Solo marca estado visual; persistencia se hace en dragend.
  taskList.addEventListener("dragstart", (e) => {
    if (e.target.classList.contains("task-card")) {
      e.target.classList.add("dragging-task");
      e.dataTransfer.effectAllowed = "move"; // Indica modo mover en DnD.
      cerrarMenusPrioridad();
      return;
    }
    if (e.target.classList.contains("subtask-item")) {
      e.target.classList.add("dragging-subtask");
      e.dataTransfer.effectAllowed = "move"; // Indica modo mover en DnD.
    }
  });

  // Fin drag: persistir nuevo orden (tareas y subtareas).
  // El orden se guarda porque onPersist lee el orden actual del DOM.
  taskList.addEventListener("dragend", (e) => {
    if (e.target.classList.contains("task-card")) {
      e.target.classList.remove("dragging-task");
      // Guarda nuevo orden de tareas en backend.
      onPersist();
      return;
    }
    if (e.target.classList.contains("subtask-item")) {
      e.target.classList.remove("dragging-subtask");
      // Persistencia de orden de microtareas.
      onPersist();
    }
  });

  // Reordenamiento dinámico durante el drag.
  taskList.addEventListener("dragover", (e) => {
    const draggingTask = taskList.querySelector(".dragging-task");
    if (draggingTask) {
      e.preventDefault(); // Habilita drop dentro de taskList.
      const afterElement = getDragAfterElement(taskList, ".task-card", e.clientY, "dragging-task");
      if (afterElement === null) taskList.appendChild(draggingTask); // Si no hay siguiente, lo manda al final.
      else taskList.insertBefore(draggingTask, afterElement); // Inserta antes del elemento calculado.
      return;
    }

    const draggingSubtask = taskList.querySelector(".dragging-subtask");
    if (!draggingSubtask) return;
    const targetList = e.target.closest(".subtask-list");
    if (!targetList) return;

    e.preventDefault(); // Habilita drop en lista de subtareas.
    const afterElement = getDragAfterElement(targetList, ".subtask-item", e.clientY, "dragging-subtask");
    if (afterElement === null) targetList.appendChild(draggingSubtask); // Coloca al final de subtareas.
    else targetList.insertBefore(draggingSubtask, afterElement); // Inserta en posición calculada.
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
  renderTasks, // Render completo de lista.
  collectTasksFromDom, // Convierte DOM actual a objeto de datos.
  bindTaskEvents // Registro de listeners de interacción.
};
