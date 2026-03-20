// BACKEND - CONFIGURACIÓN
// Este archivo centraliza variables de entorno del backend.
// Objetivo: evitar repetir process.env en varios archivos.

require("dotenv").config(); // Carga variables del archivo .env a process.env.

const PORT = process.env.PORT || "3000"; // Usa PORT del entorno o 3000 por defecto.

module.exports = { // Exporta valores para poder importarlos en otros archivos.
  PORT // Comparte el puerto configurado con el resto del backend.
};