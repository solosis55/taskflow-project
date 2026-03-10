Cursor Workflow

Atajos de teclado más usados en Cursor

Ctrl + L → Abrir el chat de IA de Cursor.

Ctrl + K → Editar o modificar el código seleccionado con ayuda de la IA.

Ctrl + I → Abrir Composer para generar cambios en varios archivos.

Ctrl + ` → Abrir la terminal integrada.

Ejemplos donde Cursor mejoró el código

Mejora de código 1: ha mejorado el sidebar , guardando su estado a la hora de refrescar la pagina.

Mejora de código 2: Ha limpiado , reordenado y comentado todos los archivos para una mejor vista y entendimiento

Mejora de código 3 : Ha pasado el movimiento del sidebar alojado en el index al JS automaticamente

Mejora de código 4 : Modo oscuro
Anterior
if(localStorage.getItem("darkmode) === "true) document.documentElement.classList.add("dark)
Nuevo
 if (darkToggle) {
    const darkActivo = localStorage.getItem("darkmode") === "true";

    if (darkActivo) {
      document.documentElement.classList.add("dark");
      darkToggle.textContent = "☀️";
      

Instalacioón de MCP de Github en Cursor

1️⃣ Crear la carpeta de configuración

En la raíz de tu proyecto crea:

.cursor

Dentro crea el archivo:

.cursor/mcp.json

2️⃣ Añadir la configuración del servidor GitHub

Dentro de mcp.json escribe:

{
  "mcpServers": {
    "github": {
      "command": "npx",
      "args": [ "-y"" , @modelcontextprotocol/server-github"
      ],
      "env": {
        "GITHUB_PERSONAL_ACCESS_TOKEN": "TU_TOKEN_GITHUB"
      }
    }
  }
}

3️⃣ Crear un token de GitHub

Ve a GitHub

Abre:

Settings
Developer settings
Personal access tokens
Tokens (classic)

Pulsa Generate new token

Activa permisos como:

repo
read:user
read:org

Copia el token.

4️⃣ Poner el token en el archivo

Reemplaza:

TU_TOKEN_GITHUB

por tu token real.

Ejemplo:

"GITHUB_PERSONAL_ACCESS_TOKEN": "ghp_xxxxxxxxxxxxx"
5️⃣ Reiniciar Cursor

Cierra y vuelve a abrir Cursor para que cargue el servidor MCP.

6️⃣ Probar que funciona

En el chat de Cursor prueba cosas como:

List my GitHub repositories
Show information about this repository
Read the README of this repository
Show the latest commits in this repository
Analyze the structure of this repository

Utilizar servidores MCP permite que la IA del IDE acceda a recursos , apps , bases de datos... externas , facilitando mucho enlazar herramientas entre si

En proyectos concretos , puede ser util en :

-Acceso a datos en tiempo real
-Desarrollar IA que tengan que tomar acciones en distintos sitios
-Enlazar una arquitectura modular
-Automatización