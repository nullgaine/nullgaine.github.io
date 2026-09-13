(() => {
  const SOURCE_HOUR = 15;
  const SOURCE_MINUTE = 30;
  const SOURCE_UTC_OFFSET = 9;
  const SOURCE_TIME_ZONE = "Asia/Tokyo";
  const stops = Array.from(document.querySelectorAll(".schedule-stop[data-weekday]"));
  const period = document.getElementById("schedule-period");
  const clockTime = document.querySelector(".schedule-clock strong");
  const clockZone = document.querySelector(".schedule-clock small");
  const route = document.getElementById("schedule-route");
  const train = route?.querySelector(".schedule-train");
  if (!stops.length) return;

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
  const sourceWeekFor = (date) => {
    const tokyoDate = partsOf(tokyoDateFormatter, date);
    const tokyoCalendarDate = new Date(Date.UTC(
      Number(tokyoDate.year),
      Number(tokyoDate.month) - 1,
      Number(tokyoDate.day)
    ));
    tokyoCalendarDate.setUTCDate(tokyoCalendarDate.getUTCDate() - tokyoCalendarDate.getUTCDay());
    return tokyoCalendarDate;
  };
  const sourceSlot = (weekStart, weekday) => new Date(Date.UTC(
    weekStart.getUTCFullYear(),
    weekStart.getUTCMonth(),
    weekStart.getUTCDate() + weekday,
    SOURCE_HOUR - SOURCE_UTC_OFFSET,
    SOURCE_MINUTE
  ));

  let currentTrainStop = null;
  let renderedDayKey = "";

  const setTrainPosition = (targetStop, animate) => {
    if (!train || !route || !targetStop) return;
    const station = targetStop.querySelector(".schedule-station");
    if (!station) return;

    const routeRect = route.getBoundingClientRect();
    const stationRect = station.getBoundingClientRect();
    const targetTop = stationRect.top - routeRect.top + stationRect.height / 2;

    if (!animate) train.classList.add("is-setting-position");
    train.style.top = `${targetTop}px`;
    train.classList.add("is-positioned");

    if (!animate) {
      requestAnimationFrame(() => requestAnimationFrame(() => {
        train.classList.remove("is-setting-position");
      }));
    }
  };

  const renderSchedule = (now, animateTrain = false) => {
    const todayKey = localDateKey(now);
    let sourceWeekStart = sourceWeekFor(now);
    let slots = stops.map((stop) => sourceSlot(sourceWeekStart, Number(stop.dataset.weekday)));

    const firstLocalDate = localDateKey(slots[0]);
    const lastLocalDate = localDateKey(slots[slots.length - 1]);
    if (todayKey < firstLocalDate) sourceWeekStart.setUTCDate(sourceWeekStart.getUTCDate() - 7);
    if (todayKey > lastLocalDate) sourceWeekStart.setUTCDate(sourceWeekStart.getUTCDate() + 7);
    slots = stops.map((stop) => sourceSlot(sourceWeekStart, Number(stop.dataset.weekday)));

    stops.forEach((stop, index) => {
      const slot = slots[index];
      const dateParts = localDateParts(slot);
      const localTime = localTimeFormatter.format(slot);

      stop.classList.remove("is-today");
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
    }

    currentTrainStop = stops.find((stop) => stop.classList.contains("is-today")) || stops[stops.length - 1];
    renderedDayKey = todayKey;
    requestAnimationFrame(() => setTrainPosition(currentTrainStop, animateTrain));
  };

  let dayChangeTimer;
  const scheduleNextDayChange = () => {
    clearTimeout(dayChangeTimer);
    const now = new Date();
    const nextDay = new Date(now);
    nextDay.setHours(24, 0, 1, 0);
    dayChangeTimer = setTimeout(() => {
      renderSchedule(new Date(), true);
      scheduleNextDayChange();
    }, Math.max(1000, nextDay.getTime() - now.getTime()));
  };

  renderSchedule(new Date());
  scheduleNextDayChange();

  window.addEventListener("resize", () => {
    requestAnimationFrame(() => setTrainPosition(currentTrainStop, false));
  }, { passive: true });

  document.addEventListener("visibilitychange", () => {
    if (!document.hidden) {
      const now = new Date();
      if (localDateKey(now) !== renderedDayKey) renderSchedule(now, true);
      scheduleNextDayChange();
    }
  });

  if (document.fonts?.ready) {
    document.fonts.ready.then(() => setTrainPosition(currentTrainStop, false));
  }
})();
