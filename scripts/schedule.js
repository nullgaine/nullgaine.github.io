(() => {
  const SOURCE_HOUR = 15;
  const SOURCE_MINUTE = 30;
  const SOURCE_UTC_OFFSET = 9;
  const SOURCE_TIME_ZONE = "Asia/Tokyo";
  const stops = Array.from(document.querySelectorAll(".schedule-stop[data-weekday]"));
  const period = document.getElementById("schedule-period");
  const clockTime = document.querySelector(".schedule-clock strong");
  const clockZone = document.querySelector(".schedule-clock small");
  if (!stops.length) return;

  const now = new Date();
  const viewerTimeZone = Intl.DateTimeFormat().resolvedOptions().timeZone || "Etc/UTC";
  const partsOf = (formatter, date) => Object.fromEntries(
    formatter.formatToParts(date)
      .filter(({ type }) => type !== "literal")
      .map(({ type, value }) => [type, value])
  );

  const tokyoDateFormatter = new Intl.DateTimeFormat("en-US", {
    timeZone: SOURCE_TIME_ZONE,
    year: "numeric",
    month: "numeric",
    day: "numeric"
  });
  const tokyoToday = partsOf(tokyoDateFormatter, now);
  const tokyoTodayUtc = new Date(Date.UTC(
    Number(tokyoToday.year),
    Number(tokyoToday.month) - 1,
    Number(tokyoToday.day)
  ));
  const sourceWeekStart = new Date(tokyoTodayUtc);
  sourceWeekStart.setUTCDate(sourceWeekStart.getUTCDate() - sourceWeekStart.getUTCDay());

  const monthNames = ["JAN", "FEB", "MAR", "APR", "MAY", "JUN", "JUL", "AUG", "SEP", "OCT", "NOV", "DEC"];
  const localDateFormatter = new Intl.DateTimeFormat("en-US", {
    year: "numeric",
    month: "numeric",
    day: "numeric"
  });
  const englishWeekdayFormatter = new Intl.DateTimeFormat("en-US", { weekday: "long" });
  const japaneseWeekdayFormatter = new Intl.DateTimeFormat("ja-JP", { weekday: "long" });
  const localTimeFormatter = new Intl.DateTimeFormat("en-GB", {
    hour: "2-digit",
    minute: "2-digit",
    hour12: false
  });
  const zoneFormatter = new Intl.DateTimeFormat("en-US", { timeZoneName: "short" });

  const localDateParts = (date) => partsOf(localDateFormatter, date);
  const localDateKey = (date) => {
    const parts = localDateParts(date);
    return `${parts.year}-${String(parts.month).padStart(2, "0")}-${String(parts.day).padStart(2, "0")}`;
  };
  const localPeriodDate = (date) => {
    const parts = localDateParts(date);
    return `${parts.year}.${String(parts.month).padStart(2, "0")}.${String(parts.day).padStart(2, "0")}`;
  };
  const sourceSlot = (weekday) => new Date(Date.UTC(
    sourceWeekStart.getUTCFullYear(),
    sourceWeekStart.getUTCMonth(),
    sourceWeekStart.getUTCDate() + weekday,
    SOURCE_HOUR - SOURCE_UTC_OFFSET,
    SOURCE_MINUTE
  ));

  const todayKey = localDateKey(now);
  const slots = stops.map((stop) => {
    const weekday = Number(stop.dataset.weekday);
    const slot = sourceSlot(weekday);
    const dateParts = localDateParts(slot);
    const localTime = localTimeFormatter.format(slot);

    const time = stop.querySelector("time");
    time.dateTime = slot.toISOString();
    time.querySelector("b").textContent = monthNames[Number(dateParts.month) - 1];
    time.querySelector("strong").textContent = String(dateParts.day).padStart(2, "0");

    const weekdayLabel = stop.querySelector(".schedule-service span");
    weekdayLabel.textContent = `${englishWeekdayFormatter.format(slot).toUpperCase()} / ${japaneseWeekdayFormatter.format(slot)}`;

    if (stop.classList.contains("is-stream")) {
      const serviceTime = stop.querySelector(".schedule-service p");
      serviceTime.textContent = `${localTime} START`;
      serviceTime.title = "15:30 JST";
    }

    if (localDateKey(slot) === todayKey) stop.classList.add("is-today");
    return slot;
  });

  const streamSlots = stops
    .map((stop, index) => stop.classList.contains("is-stream") ? slots[index] : null)
    .filter(Boolean);
  const representativeSlot = streamSlots[0] || slots[0];
  const zoneName = partsOf(zoneFormatter, representativeSlot).timeZoneName || viewerTimeZone;

  if (clockTime) clockTime.textContent = localTimeFormatter.format(representativeSlot);
  if (clockZone) clockZone.textContent = `YOUR STANDARD TIME · ${zoneName}`;

  if (period) {
    period.textContent = `${localPeriodDate(slots[0])} — ${localPeriodDate(slots[slots.length - 1])}`;
    period.title = `15:30 JST / ${viewerTimeZone}`;
  };
})();
