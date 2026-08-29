(function () {
  "use strict";

  const JST_OFFSET = 9 * 60 * 60 * 1000;
  const STOP_DURATION = 10 * 60 * 1000;
  const SPECIAL_TIME = "04:44:44";
  const ARRIVAL_TIMES = [
    "00:00:00",
    "01:11:11",
    "02:22:22",
    "03:33:33",
    "04:44:44",
    "05:55:55",
    "10:10:10",
    "11:11:11",
    "12:00:00",
    "12:12:12",
    "13:11:11",
    "13:13:13",
    "14:14:14",
    "14:22:22",
    "15:15:15",
    "15:33:33",
    "16:16:16",
    "16:44:44",
    "17:17:17",
    "17:55:55",
    "18:18:18",
    "19:19:19",
    "20:20:20",
    "21:21:21",
    "22:10:10",
    "22:22:22",
    "23:11:11",
    "23:23:23"
  ];

  const clockFormatter = new Intl.DateTimeFormat("ja-JP", {
    timeZone: "Asia/Tokyo",
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
    hourCycle: "h23"
  });

  function secondsFromTime(value) {
    const [hour, minute, second] = value.split(":").map(Number);
    return hour * 3600 + minute * 60 + second;
  }

  function jstDayStart(timestamp) {
    const shifted = new Date(timestamp + JST_OFFSET);
    return Date.UTC(
      shifted.getUTCFullYear(),
      shifted.getUTCMonth(),
      shifted.getUTCDate()
    ) - JST_OFFSET;
  }

  function servicesFor(timestamp) {
    const dayStart = jstDayStart(timestamp);
    return ARRIVAL_TIMES.map((time) => {
      const arrival = dayStart + secondsFromTime(time) * 1000;
      return { time, arrival, departure: arrival + STOP_DURATION, special: time === SPECIAL_TIME };
    });
  }

  function activeServices(timestamp) {
    return servicesFor(timestamp).filter((service) => timestamp >= service.arrival && timestamp < service.departure);
  }

  function previewMode() {
    const value = new URLSearchParams(window.location.search).get("preview");
    return value === "arrival" || value === "444" ? value : null;
  }

  function simulatedServices(timestamp, mode) {
    if (!mode) return activeServices(timestamp);
    const time = mode === "444" ? SPECIAL_TIME : "13:13:13";
    return [{
      time,
      arrival: timestamp - 2 * 60 * 1000,
      departure: timestamp + 8 * 60 * 1000,
      special: mode === "444",
      preview: true
    }];
  }

  function formatRemaining(milliseconds) {
    const seconds = Math.max(0, Math.ceil(milliseconds / 1000));
    const minutePart = String(Math.floor(seconds / 60)).padStart(2, "0");
    const secondPart = String(seconds % 60).padStart(2, "0");
    return `${minutePart}:${secondPart}`;
  }

  function renderTimetable(active) {
    const list = document.getElementById("timetable");
    if (list.childElementCount) {
      Array.from(list.children).forEach((item) => {
        item.classList.toggle("is-current", active.some((service) => service.time === item.dataset.time));
      });
      return;
    }

    ARRIVAL_TIMES.forEach((time) => {
      const item = document.createElement("li");
      item.dataset.time = time;
      item.classList.toggle("is-current", active.some((service) => service.time === time));

      const timeElement = document.createElement("time");
      timeElement.dateTime = time;
      timeElement.textContent = time;

      const label = document.createElement("span");
      label.textContent = "帰還";

      item.append(timeElement, label);
      list.append(item);
    });
  }

  function renderPreview(mode) {
    const notice = document.getElementById("preview-notice");
    notice.hidden = !mode || mode === "444";
    if (mode) {
      document.getElementById("preview-label").textContent = mode === "444"
        ? "04:44:44 特別運行"
        : "通常到着・停車中";
    }
  }

  function renderClosed() {
    document.body.dataset.service = "closed";
    document.body.classList.remove("is-corrupted");
    document.getElementById("corrupted-service").hidden = true;
    document.getElementById("active-service").hidden = true;
    document.getElementById("closed-notice").hidden = false;
    document.getElementById("departure-display").hidden = true;
    document.getElementById("service-code").textContent = "NO TRAIN IN STATION";
    document.getElementById("service-title").textContent = "現在、帰還列車は停車しておりません";
    document.getElementById("service-message").textContent = "次回の運行時刻は案内されません。";
    document.title = "江縫栄駅｜帰還列車運行案内";
  }

  function renderOpen(active, timestamp) {
    const departure = Math.max(...active.map((service) => service.departure));
    const isConnection = active.length > 1;

    document.body.dataset.service = "open";
    document.body.classList.remove("is-corrupted");
    document.getElementById("corrupted-service").hidden = true;
    document.getElementById("closed-notice").hidden = true;
    document.getElementById("active-service").hidden = false;
    document.getElementById("departure-display").hidden = false;
    document.getElementById("service-code").textContent = isConnection ? "CONNECTION SERVICE" : "NOW BOARDING";
    document.getElementById("service-title").textContent = "帰還列車が停車しています";
    document.getElementById("service-message").textContent = isConnection
      ? "後続列車との接続を行っています。"
      : "発車時刻までにご乗車ください。";
    document.getElementById("departure-countdown").textContent = formatRemaining(departure - timestamp);
    document.getElementById("arrival-time").textContent = active.map((service) => service.time).join(" / ");
    document.getElementById("connection-badge").hidden = !isConnection;
    document.getElementById("connection-message").hidden = !isConnection;
    renderTimetable(active);
    document.title = "帰還列車 停車中｜江縫栄駅";
  }

  function renderCorrupted() {
    document.body.dataset.service = "corrupted";
    document.body.classList.add("is-corrupted");
    document.getElementById("active-service").hidden = true;
    document.getElementById("closed-notice").hidden = true;
    document.getElementById("corrupted-service").hidden = false;
    document.title = "豎溽ｸｫ譬?ｧ?";
  }

  function start() {
    const mode = previewMode();
    renderPreview(mode);

    function tick() {
      const now = Date.now();
      const clock = document.getElementById("station-clock");
      const actualTime = clockFormatter.format(now);
      clock.dateTime = new Date(now).toISOString();
      clock.textContent = `${actualTime} JST`;

      const active = simulatedServices(now, mode);
      if (active.some((service) => service.special)) {
        renderCorrupted();
      } else if (active.length) {
        renderOpen(active, now);
      } else {
        renderClosed();
      }
    }

    tick();
    window.setInterval(tick, 250);
  }

  const api = {
    ARRIVAL_TIMES,
    SPECIAL_TIME,
    STOP_DURATION,
    activeServices,
    jstDayStart,
    secondsFromTime,
    servicesFor
  };

  if (typeof module === "object" && module.exports) module.exports = api;
  if (typeof window !== "undefined") window.EnueiStation = api;
  if (typeof document !== "undefined") start();
})();
