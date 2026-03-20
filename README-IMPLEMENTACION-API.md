# Implementacion API y Migracion de Persistencia

Este documento explica, paso a paso, la implementacion que se realizo para:

- crear el backend de tareas,
- conectar el frontend con la API,
- quitar la persistencia de tareas en `localStorage`,
- y pasar a persistencia real en backend.

> Este README es adicional al `README.md` principal del proyecto.

---

## 1) Objetivo de la implementacion

El proyecto inicio como una app frontend con persistencia local en navegador.
La migracion tuvo tres objetivos principales:

1. Exponer una API REST en Node.js/Express.
2. Consumir esa API desde frontend con `fetch`.
3. Mover la persistencia de tareas desde `localStorage` hacia backend.

---

## 2) Herramientas y elementos utilizados

En esta implementacion se usaron herramientas del ecosistema JavaScript para construir y probar una API REST.

- **Node.js**
  - Entorno de ejecucion de JavaScript fuera del navegador.
  - Se uso para levantar el backend y ejecutar Express.

- **Express**
  - Framework de Node.js para crear servidores web y APIs de forma simple.
  - Se uso para definir rutas, middlewares y respuestas HTTP.

- **dotenv**
  - Libreria que carga variables de entorno desde un archivo `.env`.
  - Se uso para centralizar configuraciones como `PORT`.

- **cors**
  - Middleware de Express que habilita peticiones entre origenes distintos (Cross-Origin Resource Sharing).
  - Se uso para permitir que el frontend llame al backend sin bloqueo del navegador.

- **nodemon**
  - Herramienta de desarrollo que reinicia el servidor automaticamente al detectar cambios.
  - Se configuro para ignorar `backend/src/data/tasks.json` y evitar bucles de reinicio.

- **Postman**
  - Cliente para probar APIs manualmente.
  - Se uso para validar endpoints (`GET`, `POST`, `PATCH`, `PUT`, `DELETE`) con body JSON.

- **fetch**
  - API nativa del navegador para hacer peticiones HTTP desde frontend.
  - Se uso en `api/client.js` para consumir la API del backend.

---

## 3) Glosario rapido (definiciones clave)

- **API (Application Programming Interface)**
  - Es un "contrato" que define como un sistema se comunica con otro.
  - En este proyecto, el frontend consume la API del backend.

- **API REST**
  - Estilo de diseno de APIs basado en recursos y metodos HTTP.
  - Ejemplo: recurso `tasks` con metodos `GET`, `POST`, `PATCH`, `DELETE`.

- **Endpoint**
  - URL concreta de la API para una accion.
  - Ejemplo: `GET /api/v1/tasks`.

- **HTTP**
  - Protocolo de comunicacion cliente-servidor en web.
  - Usa metodos como `GET`, `POST`, `PATCH`, `PUT`, `DELETE`.

- **JSON (JavaScript Object Notation)**
  - Formato de texto para intercambiar datos de forma estructurada.
  - Se usa en request y response entre frontend y backend.

- **Request / Response**
  - `Request`: peticion que envia el cliente.
  - `Response`: respuesta que devuelve el servidor.

- **Middleware**
  - Funcion intermedia que procesa peticiones antes de llegar a la ruta final.
  - Ejemplos usados: `express.json()` y `cors()`.

- **Persistencia**
  - Guardar datos de forma que sobrevivan a recargas o reinicios.
  - Se paso de `localStorage` a `backend/src/data/tasks.json`.

- **localStorage**
  - Almacenamiento local del navegador (solo lado cliente).
  - Se elimino para tareas; se mantuvo para preferencia de modo oscuro.

- **CRUD**
  - Siglas de Create, Read, Update, Delete.
  - Operaciones basicas que soporta la API de tareas.

---

## 4) Orden de carpetas y archivos creados

A continuacion, el orden logico de creacion y para que sirve cada archivo.

### Paso 1 - Base del backend

1. `backend/package.json`  
   Crea el proyecto backend, scripts (`npm run dev`) y dependencias.

2. `backend/package-lock.json`  
   Bloquea versiones instaladas por npm.

3. `backend/src/index.js`  
   Punto de entrada del servidor Express.

4. `backend/src/config/env.js`  
   Configuracion de variables de entorno (como `PORT`).

5. `backend/src/routes/task.routes.js`  
   Define rutas REST de tareas.

6. `backend/src/controllers/task.controller.js`  
   Recibe requests HTTP y delega al service.

7. `backend/src/services/task.service.js`  
   Logica de negocio y acceso a datos.

### Paso 2 - Cliente API en frontend

8. `api/client.js`  
   Funciones para llamar al backend (`get`, `post`, `patch`, `delete`, `sync`).

### Paso 3 - Persistencia en disco del backend

9. `backend/src/data/tasks.json`  
   Archivo de datos persistentes (fuente de verdad en backend).

---

## 5) Archivos existentes que se modificaron

### Frontend

- `index.html`
  - Se dejo `bootstrap.js` como modulo (`type="module"`).
  - Se elimino carga de `js/storage.js`.
  - Se agrego `#network-status` para mensajes de red.

- `js/bootstrap.js`
  - Se convirtio en orquestador principal de API.
  - Carga inicial desde backend.
  - Sincronizacion de estado de DOM hacia backend.
  - Manejo de estados visuales de red (loading/success/error).
  - Se mantuvo `localStorage` solo para preferencia de modo oscuro.

- `js/tasks.js`
  - Conexion de eventos UI con persistencia API.
  - Soporte de `id` por tarea y `subtaskId` por subtarea.
  - Persistencia de:
    - creacion/eliminacion,
    - prioridad,
    - fecha,
    - texto inline,
    - orden drag&drop,
    - subtareas.

- `js/dom.js`
  - Se agrego referencia a `networkStatus`.

- `js/filters.js` y `js/calendar.js`
  - Ajustes para convivir con nuevo flujo de datos.

- `js/storage.js`
  - Se elimino del proyecto (ya no persistimos tareas en local).

- `app.js`
  - Quedo como archivo legado, sin inicializacion principal.

### Backend

- `backend/src/index.js`
  - Registro de middlewares, rutas y manejo global de errores.

- `backend/src/routes/task.routes.js`
  - Nuevas rutas para `PATCH` y `PUT /sync`.

- `backend/src/controllers/task.controller.js`
  - Validaciones basicas y delegacion completa al service.

- `backend/src/services/task.service.js`
  - Paso de memoria volatil a persistencia con `tasks.json`.
  - Normalizacion de campos y sincronizacion masiva.

- `backend/package.json`
  - Ajuste de `nodemon` para ignorar `src/data/tasks.json` y evitar reinicios en bucle.

- `.vscode/settings.json`
  - Config de Live Server para ignorar cambios en `backend/src/data/**`.

---

## 6) Evolucion funcional (que se implemento en cada fase)

## Fase A - API minima de tareas

Se implementaron endpoints basicos:

- `GET /api/v1/tasks`
- `POST /api/v1/tasks`
- `DELETE /api/v1/tasks/:id`

Al principio, los datos estaban en memoria (`let tasks = []`).

## Fase B - Conexion frontend con API

Se agrego `api/client.js` y se conecto frontend para:

- cargar tareas al iniciar,
- crear tarea desde formulario,
- eliminar tarea individual y completadas.

## Fase C - Persistencia real en backend

Se migro de memoria a disco:

- lectura/escritura de `backend/src/data/tasks.json`,
- funciones de carga y guardado seguras,
- ids robustos (`randomUUID`).

## Fase D - Eliminacion de localStorage de tareas

Se elimino la persistencia local de tareas:

- borrado de `js/storage.js`,
- eliminacion de su `<script>` en `index.html`,
- quitado fallback de tareas en `localStorage`.

> Nota: por decision funcional, **modo oscuro** si sigue usando `localStorage`
> porque es preferencia visual del usuario, no dato de negocio.

## Fase E - Estados de red en UI

Se incorporo feedback visual:

- banner de estado `#network-status`,
- mensajes de carga/exito/error,
- bloqueo temporal de controles durante operaciones criticas.

## Fase F - Modelo de datos ampliado

Se agregaron y persistieron campos:

- `priority`
- `dueDate`
- `subtasks`
- `position` (orden)

Tambien se agregaron operaciones:

- `PATCH /api/v1/tasks/:id` (actualizacion puntual)
- `PUT /api/v1/tasks/sync` (sincronizacion completa)

## Fase G - Persistencia avanzada de interacciones UI

Se aseguro persistencia para:

- orden de tareas (drag&drop),
- orden de subtareas,
- edicion inline de texto,
- check/uncheck de tareas y subtareas,
- cambios masivos.

---

## 7) Contrato final de la API

### GET `/api/v1/tasks`
Devuelve todas las tareas.

### POST `/api/v1/tasks`
Crea una tarea.

Body ejemplo:

```json
{
  "title": "Nueva tarea",
  "priority": "high",
  "dueDate": "2026-03-20",
  "subtasks": []
}
```

### PATCH `/api/v1/tasks/:id`
Actualiza campos puntuales.

Body ejemplo:

```json
{
  "title": "Titulo actualizado",
  "completed": true,
  "priority": "medium",
  "dueDate": "2026-03-22"
}
```

### PUT `/api/v1/tasks/sync`
Sincroniza estado completo (incluye orden y subtareas).

Body ejemplo:

```json
{
  "tasks": [
    {
      "id": "abc",
      "title": "Tarea 1",
      "completed": false,
      "priority": "high",
      "dueDate": "",
      "position": 0,
      "subtasks": [
        { "id": "s1", "text": "Sub 1", "done": false }
      ]
    }
  ]
}
```

### DELETE `/api/v1/tasks/:id`
Elimina una tarea por id.

---

## 8) Arquitectura final resumida

```text
Frontend (UI DOM)
  -> tasks.js (eventos UI)
  -> bootstrap.js (orquestacion + sync)
  -> api/client.js (HTTP fetch)
  -> Backend API Express
       -> routes
       -> controller
       -> service
       -> tasks.json (persistencia)
```

---

## 9) Checklist de validacion final

- [ ] Crear tarea y recargar pagina: sigue existiendo.
- [ ] Reiniciar backend y recargar: sigue existiendo.
- [ ] Cambiar prioridad y fecha, recargar: se mantienen.
- [ ] Editar texto inline, recargar: se mantiene.
- [ ] Reordenar tareas/subtareas, recargar: orden persistido.
- [ ] Borrar tarea/completadas: desaparecen y no reaparecen.
- [ ] Modo oscuro: se mantiene por `localStorage` (preferencia UI).

---

## 10) Ejemplos de interaccion y comprobacion con Postman

Esta seccion sirve para probar la API manualmente y verificar que todo funciona.

### 10.1 Preparacion en Postman

1. Arranca el backend:
   - `cd backend`
   - `npm run dev`
2. Crea una coleccion en Postman (por ejemplo: `Taskflow API`).
3. Crea una variable de coleccion:
   - `baseUrl = http://localhost:3000/api/v1`
4. En requests con body, usa:
   - `Body -> raw -> JSON`
   - Header `Content-Type: application/json` (Postman suele ponerlo automaticamente).

### 10.2 Flujo recomendado de pruebas (CRUD + sync)

#### 1) Healthcheck (opcional)

- **Metodo:** `GET`
- **URL:** `http://localhost:3000/health`
- **Esperado:** estado `200` y mensaje de servicio activo.

#### 2) Listar tareas iniciales

- **Metodo:** `GET`
- **URL:** `{{baseUrl}}/tasks`
- **Esperado:**
  - estado `200`,
  - respuesta JSON con `data` (array de tareas).

#### 3) Crear tarea

- **Metodo:** `POST`
- **URL:** `{{baseUrl}}/tasks`
- **Body:**

```json
{
  "title": "Probar API desde Postman",
  "priority": "high",
  "dueDate": "2026-03-25",
  "subtasks": [
    { "id": "s-post-1", "text": "Validar POST", "done": false }
  ]
}
```

- **Esperado:**
  - estado `201`,
  - respuesta con la tarea creada y su `id`.
- **Comprobacion extra:** copia ese `id` para pruebas siguientes.

#### 4) Editar parcialmente una tarea (PATCH)

- **Metodo:** `PATCH`
- **URL:** `{{baseUrl}}/tasks/<TASK_ID>`
- **Body:**

```json
{
  "title": "Titulo actualizado desde Postman",
  "completed": true,
  "priority": "medium",
  "dueDate": "2026-03-28"
}
```

- **Esperado:**
  - estado `200`,
  - campos actualizados en la respuesta.

#### 5) Sincronizacion completa de lista (PUT /sync)

- **Metodo:** `PUT`
- **URL:** `{{baseUrl}}/tasks/sync`
- **Body:**

```json
{
  "tasks": [
    {
      "id": "sync-1",
      "title": "Tarea sincronizada 1",
      "completed": false,
      "priority": "low",
      "dueDate": "",
      "position": 0,
      "subtasks": []
    },
    {
      "id": "sync-2",
      "title": "Tarea sincronizada 2",
      "completed": true,
      "priority": "high",
      "dueDate": "2026-03-30",
      "position": 1,
      "subtasks": [
        { "id": "sub-sync-1", "text": "Sub sincronizada", "done": false }
      ]
    }
  ]
}
```

- **Esperado:**
  - estado `200`,
  - la lista completa queda reemplazada por el array enviado.
- **Comprobacion extra:** haz luego `GET {{baseUrl}}/tasks` y confirma que solo existen esas tareas.

#### 6) Eliminar tarea

- **Metodo:** `DELETE`
- **URL:** `{{baseUrl}}/tasks/<TASK_ID>`
- **Esperado:**
  - estado `200` o `204` (segun implementacion de respuesta),
  - la tarea deja de aparecer en `GET /tasks`.

### 10.3 Casos de error recomendados (validacion)

1. **POST sin title**
   - Envia `{ "priority": "low" }`.
   - Esperado: error `400` con mensaje de validacion.

2. **PATCH con id inexistente**
   - Usa un id inventado.
   - Esperado: error `404` (o el codigo configurado en el backend).

3. **DELETE con id inexistente**
   - Esperado: error controlado (normalmente `404`).

### 10.4 Verificacion final de persistencia

1. Crea o edita tareas desde Postman.
2. Reinicia backend (`Ctrl + C` y `npm run dev`).
3. Repite `GET {{baseUrl}}/tasks`.
4. Verifica que los datos siguen ahi (persistencia en `tasks.json`).

