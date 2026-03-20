// BACKEND - ARCHIVO PRINCIPAL
// Aquí se enciende el servidor.
// También se conectan:
// - los middlewares
// - las rutas
// - el manejo de errores
//
// Camino de una petición (muy simple):
// navegador -> ruta -> controller -> service -> respuesta

const express = require("express"); // Framework para crear API con Node.js.
const cors = require("cors"); // Permite peticiones entre frontend y backend.
const { PORT } = require("./config/env"); // Trae el puerto configurado.
const taskRoutes = require("./routes/task.routes"); // Importa rutas de tareas.

const app = express(); // Crea la aplicación principal de Express.

// Middlewares generales:
// - cors(): permite que el frontend hable con este backend.
// - express.json(): permite leer JSON del body.
app.use(cors());
app.use(express.json());

// Todas las rutas de tareas empiezan por /api/v1/tasks
app.use("/api/v1/tasks", taskRoutes); // Monta rutas bajo prefijo /api/v1/tasks.

// Manejo global de errores:
// si algo falla en rutas/controller/service, termina aquí.
app.use((err, req, res, next) => { // Captura errores enviados con next(error).
  let statusCode = 500; // Código por defecto si no reconocemos el error.
  let message = "Error interno del servidor"; // Mensaje por defecto.
  
  if (err.message === "NOT_FOUND") { // Error típico cuando no existe una tarea.
    statusCode = 404; // HTTP 404 = no encontrado.
    message = "Recurso no encontrado"; // Mensaje amigable para cliente.
  } else if (err.message === "VALIDATION_ERROR") { // Error por datos incompletos/incorrectos.
    statusCode = 400; // HTTP 400 = petición inválida.
    message = "Datos inválidos"; // Texto de error para frontend.
  }

  console.error(err); // Muestra detalle técnico en consola del backend.

  res.status(statusCode).json({ // Respuesta final de error al cliente.
    error: message // Campo estándar que consume el frontend.
  }); // Enviamos JSON para mantener formato consistente.
});

// Ruta rápida para comprobar que el backend está vivo.
app.get("/", (req, res) => { // Ruta de prueba rápida del servidor.
  res.send("API funcionando 🚀"); // Respuesta simple para comprobar estado.
});

// Arranca el servidor en el puerto indicado.
app.listen(PORT, () => { // Inicia el servidor HTTP en el puerto configurado.
  console.log(`Servidor corriendo en http://localhost:${PORT}`); // Log de arranque correcto.
});

