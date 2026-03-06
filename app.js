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

    tareas = [];

    const items = taskList.querySelectorAll("li");

    items.forEach(item => {

        const texto = item.querySelector(".task-text").textContent;

        const badge = item.querySelector(".priority");

        let prioridad = "high";

        if (badge.classList.contains("medium")) prioridad = "medium";
        if (badge.classList.contains("low")) prioridad = "low";

        tareas.push({
            text: texto,
            priority: prioridad
        });

    });

}



//  4-Cargar tareas desde localStorage al iniciar la aplicación

  const tareasGuardadas = localStorage.getItem("tareas"); // Obtenemos las tareas guardadas en localStorage, si existen
  if (tareasGuardadas) {  // Verificamos si hay tareas guardadas

    tareas = JSON.parse(tareasGuardadas); // Convertimos el string de tareas guardadas a un array
    taskList.innerHTML = ""; // Limpiamos la lista de tareas en el DOM antes de cargar las tareas guardadas
    tareas.forEach(tarea => {

        const li = crearTarea(tarea.text, tarea.priority); // Creamos un elemento de lista para cada tarea guardada utilizando la función crearTarea, pasando el texto y la prioridad de cada tarea como argumentos  
        taskList.appendChild(li); // Agregamos cada tarea guardada al DOM utilizando la función crearTarea para crear el elemento de lista correspondiente
    });

    }; 

// 1- Función para crear una nueva tarea 
function crearTarea(texto, prioridad="high") {
    const li = document.createElement("li"); // Creamos un nuevo elemento de lista
    li.className ="tarea flex items-center justify-between bg-white p-4 rounded-lg shadow"; // Le damos la clase "tarea" y otras clases para el estilo con Tailwind CSS
    li.innerHTML = `
     <label class="flex items-center gap-3 flex-1">
     <input type="checkbox" class="w-4 h-4">
     <span class="task-text flex-1">${texto}</span>
     
     
     </label>
     <span class="priority ${prioridad} px-2 py-1 text-sm rounded">${prioridad === "high" ? "Alta" : prioridad === "medium" ? "Media" : "Baja"}
</span>
     <button class="delete-task ml-3 text-gray-500 hover:text-red-500 transition"> 🗑</button>
     `; //agregamos propiedades para el CSS 

    
    li.querySelector(".task-text").textContent = texto; // Establecemos el texto de la tarea

    return li; // Devolvemos el elemento de lista creado

    
}
 // 2- Evento de enviar formulario para agregar una nueva tarea
form.addEventListener("submit", function(event) {
        event.preventDefault(); // Evitamos que el formulario se envíe de forma tradicional
        const texto = input.value.trim(); // Obtenemos el texto ingresado y eliminamos espacios en blanco
        if (texto !== "") { // Verificamos que el texto no esté vacío
            const nuevaTarea = crearTarea(texto); // Creamos una nueva tarea con el texto ingresado

            tareas.push({
                text: texto,
                priority: "high"}); // Agregamos el texto de la nueva tarea al array de tareas
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

const busquedaInput =document.querySelector("#busqueda-input"); // Seleccionamos el campo de entrada para la búsqueda de tareas
busquedaInput.addEventListener("input", () => { // Agregamos un evento de entrada al campo de búsqueda

    const busqueda = busquedaInput.value.toLowerCase().trim(); // Obtenemos el texto de búsqueda, lo convertimos a minúsculas y eliminamos espacios en blanco
    const tareasDOM = taskList.querySelectorAll(".tarea"); // Seleccionamos todas las tareas en el DOM

    tareasDOM.forEach(tarea => { // Iteramos sobre cada tarea en el DOM

        const textoTarea = tarea.querySelector(".task-text").textContent.toLowerCase(); // Obtenemos el texto de la tarea y lo convertimos a minúsculas
        const coincide = textoTarea.includes(busqueda); // Verificamos si el texto de la tarea incluye el texto de búsqueda
        tarea.style.display = coincide ? "" : "none"; // Mostramos u ocultamos la tarea según si coincide con la búsqueda
    });
});


// Funcion para crear un menu en prioridad y elegir la prioridad

taskList.addEventListener("click", function(event) { // Agregamos un evento de clic a la lista de tareas para manejar los clics en el elemento de prioridad y en las opciones del menú de prioridad

  // CLICK EN PRIORIDAD → abrir menú
if (event.target.classList.contains("priority")) { // Verificamos si el elemento clickeado es el elemento de prioridad

    event.stopPropagation(); // Detenemos la propagación del evento para evitar que el clic se propague al documento y cierre el menú inmediatamente después de abrirlo

    const prioridad = event.target; // Obtenemos el elemento de prioridad clickeado
    const tarea = prioridad.closest(".tarea"); // Encontramos la tarea más cercana al elemento de prioridad clickeado para poder asociar el menú de prioridad a esa tarea específica

    // cerrar cualquier menu abierto
    document.querySelectorAll(".priority-menu").forEach(menu =>  { // Seleccionamos todos los menús de prioridad abiertos en el DOM
        menu.remove();
    });

    document.querySelectorAll(".tarea.menu-open").forEach(t => { // Seleccionamos todas las tareas que tienen la clase "menu-open" (es decir, las tareas que están mostrando el menú de prioridad)
        t.classList.remove("menu-open");
    });

    // subir la tarjeta activa
    tarea.classList.add("menu-open"); // Agregamos la clase "menu-open" a la tarea clickeada para que quede por encima de las otras tareas en el z-index y el menú se muestre correctamente

    const menu = document.createElement("div"); // Creamos un nuevo elemento div que servirá como el menú de opciones de prioridad
    menu.classList.add("priority-menu"); // Le damos la clase "priority-menu" al nuevo div para poder estilizarlo con CSS y diferenciarlo de otros elementos en el DOM

    menu.innerHTML = `
        <div class="priority-option high">Alta</div>
        <div class="priority-option medium">Media</div>
        <div class="priority-option low">Baja</div>`;

    prioridad.appendChild(menu); // Agregamos el menú de opciones de prioridad como hijo del elemento de prioridad clickeado para que se muestre justo debajo de él en el DOM
}



// CLICK EN OPCION DEL MENU
if (event.target.classList.contains("priority-option")) { // Verificamos si el elemento clickeado es una opción de prioridad

    const opcion = event.target; // Obtenemos la opción de prioridad clickeada
    const prioridad = opcion.closest(".priority"); // Encontramos el elemento de prioridad más cercano a la opción clickeada
    const tarea = opcion.closest(".tarea"); // Encontramos la tarea más cercana a la opción clickeada

    let nivel = "";
    if (opcion.classList.contains("high")) {
      nivel = "high";}
    else if (opcion.classList.contains("medium")) {
    nivel = "medium";  
    } else {
    nivel = "low";} // Obtenemos el nivel de prioridad seleccionado (baja, media o alta) y lo convertimos a minúsculas

    prioridad.classList.remove("high","medium","low"); // Eliminamos cualquier clase de prioridad existente para actualizarla con la nueva selección
    prioridad.classList.add(nivel); // Agregamos la clase correspondiente al nivel de prioridad seleccionado (baja, media o alta)

    prioridad.textContent = opcion.textContent; // Actualizamos el texto del elemento de prioridad para reflejar la selección realizada por el usuario
    reconstruirArray();
    guardarTareas();


    // cerrar menu
    opcion.parentElement.remove(); // Eliminamos el menú de opciones de prioridad del DOM para cerrarlo después de que se haya seleccionado una opción
    tarea.classList.remove("menu-open"); // Quitamos la clase "menu-open" de la tarea para que vuelva a su posición normal en el z-index
}

});

document.addEventListener("click", function() { // Agregamos un evento de clic al documento para cerrar el menú de prioridad cuando se haga clic fuera de él

    document.querySelectorAll(".priority-menu").forEach(menu => {  // Seleccionamos todos los menús de prioridad abiertos en el DOM
        menu.remove();
    });

    document.querySelectorAll(".tarea.menu-open").forEach(t => { // Seleccionamos todas las tareas que tienen la clase "menu-open" (es decir, las tareas que están mostrando el menú de prioridad)
        t.classList.remove("menu-open");
    });
});



// DARK MODE

document.addEventListener("DOMContentLoaded", () => {

    const darkToggle = document.querySelector("#dark-toggle");

    if (!darkToggle) return;

    // aplicar modo guardado
    if (localStorage.getItem("darkmode") === "true") {
        document.documentElement.classList.add("dark");
    }

    darkToggle.addEventListener("click", () => {

        document.documentElement.classList.toggle("dark");

        const activo = document.documentElement.classList.contains("dark");

        localStorage.setItem("darkmode", activo);

    });

});





 





    

      








   
 
