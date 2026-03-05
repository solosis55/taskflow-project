console.log("JS conectado");

const form = document.querySelector("#task-form"); // Seleccionamos el formulario
const input = document.querySelector("#nueva-tarea"); // Seleccionamos el campo de entrada para la nueva tarea
const taskList = document.querySelector("#task-list"); // Seleccionamos la lista donde se mostrarán las tareas


//Array y funciones para guardar y cargar tareas en localStorage
let tareas = []; // Array para almacenar las tareas

function guardarTareas() {
    localStorage.setItem("tareas", JSON.stringify(tareas)); // Guardamos el array de tareas en localStorage como un string
}

function reconstruirArray() {
    tareas = []; // Limpiamos el array de tareas
    const items = taskList.querySelectorAll(".task-text"); // Seleccionamos todos los elementos de texto de las tareas en el DOM
    items.forEach(item => {
        tareas.push(item.textContent); // Agregamos el texto de cada tarea al array de tareas
    });
}

//  4-Cargar tareas desde localStorage al iniciar la aplicación

  const tareasGuardadas = localStorage.getItem("tareas"); // Obtenemos las tareas guardadas en localStorage, si existen
  if (tareasGuardadas) {  // Verificamos si hay tareas guardadas

    tareas = JSON.parse(tareasGuardadas); // Convertimos el string de tareas guardadas a un array
    taskList.innerHTML = ""; // Limpiamos la lista de tareas en el DOM antes de cargar las tareas guardadas
    tareas.forEach(texto => {

        const tarea = crearTarea(texto); // Creamos un elemento de tarea para cada texto guardado
        taskList.appendChild(tarea); // Agregamos la tarea a la lista en el DOM
    });

    }; 

// 1- Función para crear una nueva tarea 
function crearTarea(texto) {
    const li = document.createElement("li"); // Creamos un nuevo elemento de lista
    li.classList.add("tarea"); // Le damos la clase "tarea"

    li.innerHTML = `
        <label class="tarea-row">
                <input class="check" type="checkbox">
                <span class="task-text"></span>
                <span class="prioridad alta">Alta</span>
                </label>
                <button class="delete-task">🗑</button>`; //agregamos propiedades para el CSS 

    
    li.querySelector(".task-text").textContent = texto; // Establecemos el texto de la tarea

    return li; // Devolvemos el elemento de lista creado

    
}
 // 2- Evento de enviar formulario para agregar una nueva tarea
form.addEventListener("submit", function(event) {
        event.preventDefault(); // Evitamos que el formulario se envíe de forma tradicional
        const texto = input.value.trim(); // Obtenemos el texto ingresado y eliminamos espacios en blanco
        if (texto !== "") { // Verificamos que el texto no esté vacío
            const nuevaTarea = crearTarea(texto); // Creamos una nueva tarea con el texto ingresado

            tareas.push(texto); // Agregamos el texto de la nueva tarea al array de tareas
            guardarTareas(); // Guardamos el array de tareas actualizado en localStorage
             
            taskList.appendChild(nuevaTarea); // Agregamos la nueva tarea a la lista
            input.value = ""; // Limpiamos el campo de entrada
        }
    });

// 3- Evento de clic para eliminar tareas
taskList.addEventListener("click", function(event) {

    if (event.target.classList.contains("delete-task")) { // Verificamos si el elemento clickeado es el botón de eliminar
        const tarea = event.target.closest(".tarea"); // Encontramos la tarea más cercana al botón
        if (tarea) {
            
            tarea.remove(); // Eliminamos la tarea de la lista

            reconstruirArray(); // Reconstruimos el array de tareas a partir de las tareas que quedan en el DOM
            guardarTareas(); // Guardamos el array de tareas actualizado en localStorage
        }
    }
});




    

      








   
 



