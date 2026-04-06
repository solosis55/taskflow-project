# Backend API: herramientas clave

Este documento resume cuatro herramientas muy usadas en proyectos backend: **Axios**, **Postman**, **Sentry** y **Swagger**, y explica por que se utilizan en el dia a dia.

## Axios

Axios es una libreria de JavaScript para hacer peticiones HTTP (GET, POST, PUT, DELETE, etc.) desde el cliente o desde servicios intermedios.

### Por que se usa

- Simplifica el consumo de APIs con una sintaxis clara.
- Permite configurar cabeceras, tokens y base URL facilmente.
- Maneja respuestas y errores de forma consistente.
- Soporta interceptores para logica comun (autenticacion, refresco de token, manejo global de errores).

## Postman

Postman es una herramienta para probar, depurar y documentar APIs sin necesidad de construir primero una interfaz frontend.

### Por que se usa

- Facilita probar endpoints rapidamente.
- Permite guardar colecciones de requests reutilizables.
- Ayuda a validar autenticacion, parametros, body y codigos de respuesta.
- Sirve para compartir pruebas de API entre miembros del equipo.

## Sentry

Sentry es una plataforma de monitoreo de errores en tiempo real para aplicaciones backend y frontend.

### Por que se usa

- Captura excepciones y fallos automaticamente en produccion.
- Muestra trazas, contexto y datos utiles para diagnosticar problemas.
- Permite priorizar incidencias por impacto y frecuencia.
- Reduce el tiempo de deteccion y resolucion de bugs.

## Swagger

Swagger (OpenAPI) es un estandar y conjunto de herramientas para describir, visualizar y probar APIs REST.

### Por que se usa

- Genera documentacion interactiva de endpoints.
- Aclara contratos de API (rutas, parametros, respuestas y modelos).
- Facilita la integracion entre frontend, backend y terceros.
- Mejora la mantenibilidad y evita malentendidos entre equipos.

## Como se complementan

En un flujo tipico:

- **Swagger** define y documenta la API.
- **Postman** prueba y valida los endpoints.
- **Axios** consume la API desde aplicaciones y servicios.
- **Sentry** vigila errores y alertas en ejecucion.

Juntas, estas herramientas mejoran la calidad, trazabilidad y velocidad de desarrollo de una API backend.
