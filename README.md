# TaskFlow

TaskFlow es una app web de gestion de tareas hecha con HTML, CSS y JavaScript.
Permite crear tareas y micro tareas (subtasks), ordenarlas con drag & drop y guardar todo en `localStorage`.

## Demo

[https://taskflow-project-five-cyan.vercel.app](https://taskflow-project-five-cyan.vercel.app)

## Que puedes hacer en el proyecto

- Crear y eliminar tareas principales.
- Editar el texto de tareas y subtareas con doble clic.
- Agregar, marcar y eliminar subtareas.
- Cambiar prioridad de cada tarea (Alta, Media, Baja).
- Reordenar tareas y subtareas arrastrando.
- Buscar por texto en tareas y subtareas.
- Guardar el estado al recargar:
  - tareas/subtareas
  - prioridad
  - orden
  - tema oscuro
  - sidebar abierto/cerrado

## Casos de uso

- Planificar un proyecto pequeño con tareas principales y pasos concretos.
- Organizar trabajo diario (tarea = objetivo, subtareas = acciones).
- Preparar listas por prioridad y reordenarlas en tiempo real.
- Llevar seguimiento personal sin backend ni registro.

## Tecnologias

- HTML5
- CSS + Tailwind (archivo fuente `input.css`, salida `styles.css`)
- JavaScript vanilla (DOM + event delegation)
- LocalStorage API
- PostCSS + Autoprefixer

## Estructura principal

```text
taskflow-project/
├── index.html
├── app.js
├── input.css
├── styles.css
├── postcss.config.js
└── docs/
   └── ai/
```

## Instalacion y ejecucion

### Opcion rapida
1. Clona el repositorio.
2. Abre `index.html` en tu navegador.

### Opcion recomendada (con compilacion CSS)
1. Instala dependencias:

```bash
npm install
```

2. Compila estilos desde `input.css` a `styles.css`:

```bash
npx tailwindcss -i input.css -o styles.css --watch
```

3. Abre `index.html` (o usa Live Server).

## Documentacion de funciones (`app.js`)

### Persistencia y estado

- `guardarTareas()`
  - Guarda el array `tareas` en `localStorage`.

- `cargarTareasGuardadas()`
  - Carga tareas desde `localStorage`, limpia el DOM y vuelve a renderizar.
  - Mantiene compatibilidad con tareas antiguas sin `subtasks`.

- `reconstruirArray()`
  - Reconstruye `tareas` leyendo el DOM actual.
  - Se usa despues de editar, mover, borrar o cambiar prioridad.

### Creacion y render

- `crearTarea(texto, prioridad, subtasks)`
  - Crea una tarjeta completa de tarea con su bloque de subtareas.

- `crearSubtaskItem(texto, done, animate)`
  - Crea una subtarea individual.
  - Puede activar animacion de entrada.

- `obtenerPrioridadDeBadge(badge)`
  - Convierte clases CSS (`high/medium/low`) a valor de prioridad.

### Interacciones UI

- `cerrarMenusPrioridad()`
  - Cierra cualquier menu de prioridad abierto.

- `activarEdicionInline(textNode, onSave)`
  - Habilita edicion en linea (doble clic).
  - Enter guarda, Escape cancela, blur guarda.

- `eliminarSubtaskConAnimacion(subtask)`
  - Aplica animacion de salida y luego elimina del DOM.
  - Actualiza y guarda estado al finalizar.

### Drag & drop

- `getDragAfterElement(container, selector, y, draggingClass)`
  - Calcula donde insertar el elemento arrastrado segun la posicion vertical del cursor.
  - Se usa para reordenar tareas y subtareas.

## Eventos principales

- `submit` del formulario: crea tarea nueva.
- `click` delegado en `taskList`: borrar, agregar subtarea, cambiar prioridad.
- `dblclick` en textos: editar tarea/subtarea.
- `keydown`: Enter en input de subtarea para agregar.
- `change`: marcar subtarea completada.
- `dragstart/dragover/dragend`: ordenar tareas y subtareas.
- `DOMContentLoaded`: inicializa modo oscuro y estado del sidebar.

## Notas

- Si editas `input.css`, recuerda recompilar `styles.css`.
- El proyecto no usa backend: todos los datos viven en el navegador.

## Autor

Proyecto desarrollado por Cristian Chica.