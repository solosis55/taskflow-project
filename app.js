console.log("JS conectado");

// ═══════════════════════════════════════════════════════════════════
// REFERENCIAS AL DOM
// ═══════════════════════════════════════════════════════════════════

const form = document.querySelector("#task-form");
const input = document.querySelector("#nueva-tarea");
const taskList = document.querySelector("#task-list");
const busquedaInput = document.querySelector("#busqueda-input");

// ═══════════════════════════════════════════════════════════════════
// ESTADO Y PERSISTENCIA (localStorage)
// ═══════════════════════════════════════════════════════════════════

let tareas = [];

function guardarTareas() {
  localStorage.setItem("tareas", JSON.stringify(tareas));
}

function cargarTareasGuardadas() {
  const guardadas = localStorage.getItem("tareas");
  if (!guardadas) return;

  tareas = JSON.parse(guardadas);
  taskList.innerHTML = "";
  tareas.forEach(t => {
    const subtasks = Array.isArray(t.subtasks) ? t.subtasks : [];
    taskList.appendChild(crearTarea(t.text, t.priority, subtasks));
  });
}

// ═══════════════════════════════════════════════════════════════════
// FUNCIONES DE TAREAS
// ═══════════════════════════════════════════════════════════════════

const ETIQUETAS_PRIORIDAD = { high: "Alta", medium: "Media", low: "Baja" };

function crearSubtaskItem(texto, done = false) {
  const item = document.createElement("li");
  item.className = "subtask-item";
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

  return item;
}

function crearTarea(texto, prioridad = "high", subtasks = []) {
  const li = document.createElement("li");
  li.className = "task-card";
  li.innerHTML = `
    <div class="task-card-top">
      <label class="task-row">
        <input type="checkbox" class="w-4 h-4">
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
  const subtaskList = li.querySelector(".subtask-list");
  subtasks.forEach(sub => {
    if (sub?.text) {
      subtaskList.appendChild(crearSubtaskItem(sub.text, Boolean(sub.done)));
    }
  });

  return li;
}

function obtenerPrioridadDeBadge(badge) {
  if (badge.classList.contains("medium")) return "medium";
  if (badge.classList.contains("low")) return "low";
  return "high";
}

function reconstruirArray() {
  tareas = [];
  taskList.querySelectorAll(".task-card").forEach(item => {
    const texto = item.querySelector(".task-text").textContent;
    const prioridad = obtenerPrioridadDeBadge(item.querySelector(".priority"));
    const subtasks = Array.from(item.querySelectorAll(".subtask-item")).map(sub => ({
      text: sub.querySelector(".subtask-text").textContent,
      done: sub.querySelector(".subtask-check").checked
    }));

    tareas.push({ text: texto, priority: prioridad, subtasks });
  });
}

function cerrarMenusPrioridad() {
  document.querySelectorAll(".priority-menu").forEach(m => m.remove());
  document.querySelectorAll(".task-card.menu-open").forEach(t => t.classList.remove("menu-open"));
}

// ═══════════════════════════════════════════════════════════════════
// EVENTOS DE TAREAS (agregar, eliminar, búsqueda, subtareas, prioridad)
// ═══════════════════════════════════════════════════════════════════

form.addEventListener("submit", (e) => {
  e.preventDefault();
  const texto = input.value.trim();
  if (!texto) return;

  const nueva = { text: texto, priority: "high", subtasks: [] };
  tareas.push(nueva);
  taskList.appendChild(crearTarea(nueva.text, nueva.priority, nueva.subtasks));
  guardarTareas();
  input.value = "";
});

taskList.addEventListener("click", (e) => {
  // Eliminar tarea principal
  if (e.target.classList.contains("delete-task")) {
    const tarea = e.target.closest(".task-card");
    if (tarea) {
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
    if (subtask) {
      subtask.remove();
      reconstruirArray();
      guardarTareas();
    }
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

taskList.addEventListener("keydown", (e) => {
  if (e.key !== "Enter" || !e.target.classList.contains("subtask-input")) return;

  e.preventDefault();
  const tarea = e.target.closest(".task-card");
  const boton = tarea?.querySelector(".add-subtask");
  if (boton) {
    boton.click();
  }
});

taskList.addEventListener("change", (e) => {
  if (!e.target.classList.contains("subtask-check")) return;

  const subtask = e.target.closest(".subtask-item");
  if (subtask) {
    subtask.classList.toggle("done", e.target.checked);
    reconstruirArray();
    guardarTareas();
  }
});

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

  // Sidebar: persistir estado abierto/cerrado
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

cargarTareasGuardadas();
