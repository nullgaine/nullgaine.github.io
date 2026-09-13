(() => {
  const stops = Array.from(document.querySelectorAll(".schedule-stop[data-weekday]"));
  const period = document.getElementById("schedule-period");
  if (!stops.length) return;

  const now = new Date();
  const start = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  start.setDate(start.getDate() - start.getDay());

  const monthNames = ["JAN", "FEB", "MAR", "APR", "MAY", "JUN", "JUL", "AUG", "SEP", "OCT", "NOV", "DEC"];
  const isoDate = (date) => {
    const y = date.getFullYear();
    const m = String(date.getMonth() + 1).padStart(2, "0");
    const d = String(date.getDate()).padStart(2, "0");
    return `${y}-${m}-${d}`;
  };

  stops.forEach((stop) => {
    const weekday = Number(stop.dataset.weekday);
    const date = new Date(start);
    date.setDate(start.getDate() + weekday);

    const time = stop.querySelector("time");
    time.dateTime = isoDate(date);
    time.querySelector("b").textContent = monthNames[date.getMonth()];
    time.querySelector("strong").textContent = String(date.getDate()).padStart(2, "0");

    if (weekday === now.getDay()) stop.classList.add("is-today");
  });

  const end = new Date(start);
  end.setDate(start.getDate() + 6);
  const format = (date) => `${date.getFullYear()}.${String(date.getMonth() + 1).padStart(2, "0")}.${String(date.getDate()).padStart(2, "0")}`;
  period.textContent = `${format(start)} — ${format(end)}`;
})();
