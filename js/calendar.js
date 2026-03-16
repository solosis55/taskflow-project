// ═══════════════════════════════════════════════════════════════════
// CALENDAR MODULE
// ═══════════════════════════════════════════════════════════════════
// Renderiza la rejilla mensual y notifica selección de día.

window.renderTaskflowCalendar = function renderTaskflowCalendar({
  date,
  calendarMonthLabel,
  calendarDays,
  selectedDateFilter,
  onDaySelect = null,
  countsByDate = {}
}) {
  if (!calendarMonthLabel || !calendarDays) return;

  // Datos base del mes objetivo.
  const year = date.getFullYear();
  const month = date.getMonth();
  const firstDay = new Date(year, month, 1);
  const lastDay = new Date(year, month + 1, 0);
  const totalDays = lastDay.getDate();
  const firstWeekday = (firstDay.getDay() + 6) % 7; // domingo=0 -> lunes=0
  const today = new Date();

  // Cabecera del calendario (mes + año).
  calendarMonthLabel.textContent = date.toLocaleDateString("es-ES", {
    month: "long",
    year: "numeric"
  });

  // Limpia render previo.
  calendarDays.innerHTML = "";

  // Celdas vacías para alinear el primer día al índice correcto.
  for (let i = 0; i < firstWeekday; i += 1) {
    const emptyCell = document.createElement("div");
    emptyCell.className = "calendar-day empty";
    calendarDays.appendChild(emptyCell);
  }

  // Render de cada día del mes.
  for (let day = 1; day <= totalDays; day += 1) {
    const dayCell = document.createElement("button");
    dayCell.type = "button";
    dayCell.className = "calendar-day";
    const dateKey = `${year}-${String(month + 1).padStart(2, "0")}-${String(day).padStart(2, "0")}`;
    dayCell.dataset.date = dateKey;
    dayCell.innerHTML = `<span class="calendar-day-number">${day}</span>`;

    const isToday =
      today.getFullYear() === year &&
      today.getMonth() === month &&
      today.getDate() === day;

    if (isToday) {
      dayCell.classList.add("today");
    }

    if (selectedDateFilter && selectedDateFilter === dateKey) {
      dayCell.classList.add("selected");
    }

    // Badge de tareas para la fecha (si hay).
    const totalTareas = countsByDate[dateKey] || 0;
    if (totalTareas > 0) {
      const countBadge = document.createElement("span");
      countBadge.className = "calendar-task-count";
      countBadge.textContent = String(totalTareas);
      dayCell.appendChild(countBadge);
    }

    if (typeof onDaySelect === "function") {
      dayCell.addEventListener("click", () => onDaySelect(dateKey));
    }

    // Inserta la celda en la rejilla.
    calendarDays.appendChild(dayCell);
  }
};
