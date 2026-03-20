// FRONTEND CALENDAR RENDERER
// Este módulo está orientado al render del calendario mensual.
// Responsabilidades:
// - dibujar celdas del mes activo
// - resaltar día actual/filtro seleccionado
// - mostrar badges de cantidad de tareas por fecha
// - notificar selección de día al módulo orquestador

window.renderTaskflowCalendar = function renderTaskflowCalendar({ // Función global para dibujar calendario.
  date,
  calendarMonthLabel,
  calendarDays,
  selectedDateFilter,
  onDaySelect = null,
  countsByDate = {}
}) {
  if (!calendarMonthLabel || !calendarDays) return; // Sale si faltan nodos de calendario.

  // Datos base del mes objetivo.
  const year = date.getFullYear(); // Año mostrado.
  const month = date.getMonth(); // Mes mostrado (0-11).
  const firstDay = new Date(year, month, 1); // Primer día del mes.
  const lastDay = new Date(year, month + 1, 0); // Último día del mes.
  const totalDays = lastDay.getDate(); // Cantidad total de días.
  const firstWeekday = (firstDay.getDay() + 6) % 7; // Convierte semana a base lunes.
  const today = new Date(); // Fecha actual real.

  // Cabecera del calendario (mes + año).
  calendarMonthLabel.textContent = date.toLocaleDateString("es-ES", { // Texto tipo "marzo 2026".
    month: "long",
    year: "numeric"
  });

  // Limpia render previo.
  calendarDays.innerHTML = ""; // Limpia render anterior antes de dibujar.

  // Celdas vacías para alinear el primer día al índice correcto.
  for (let i = 0; i < firstWeekday; i += 1) {
    const emptyCell = document.createElement("div"); // Crea celda vacía.
    emptyCell.className = "calendar-day empty"; // Clase visual de relleno.
    calendarDays.appendChild(emptyCell); // Inserta celda vacía en rejilla.
  }

  // Render de cada día del mes.
  for (let day = 1; day <= totalDays; day += 1) {
    const dayCell = document.createElement("button"); // Crea botón para el día.
    dayCell.type = "button"; // Evita submit accidental.
    dayCell.className = "calendar-day"; // Clase base de celda.
    const dateKey = `${year}-${String(month + 1).padStart(2, "0")}-${String(day).padStart(2, "0")}`; // Clave YYYY-MM-DD.
    dayCell.dataset.date = dateKey; // Guarda fecha en data attribute.
    dayCell.innerHTML = `<span class="calendar-day-number">${day}</span>`; // Muestra número de día.

    const isToday =
      today.getFullYear() === year &&
      today.getMonth() === month &&
      today.getDate() === day;

    if (isToday) {
      dayCell.classList.add("today"); // Resalta día actual.
    }

    if (selectedDateFilter && selectedDateFilter === dateKey) {
      dayCell.classList.add("selected"); // Resalta día filtrado.
    }

    // Badge de tareas para la fecha (si hay).
    const totalTareas = countsByDate[dateKey] || 0; // Cuenta tareas para ese día.
    if (totalTareas > 0) {
      const countBadge = document.createElement("span"); // Crea badge numérico.
      countBadge.className = "calendar-task-count"; // Clase visual del badge.
      countBadge.textContent = String(totalTareas); // Número de tareas.
      dayCell.appendChild(countBadge); // Añade badge a la celda.
    }

    if (typeof onDaySelect === "function") {
      dayCell.addEventListener("click", () => onDaySelect(dateKey)); // Notifica clic con la fecha seleccionada.
    }

    // Inserta la celda en la rejilla.
    calendarDays.appendChild(dayCell); // Dibuja celda final en calendario.
  }
};
