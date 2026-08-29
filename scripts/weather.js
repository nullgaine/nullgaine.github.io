(function (root, factory) {
  const api = factory();
  if (typeof module === "object" && module.exports) module.exports = api;
  if (root) root.EnueiWeather = api;
  if (typeof document !== "undefined") api.start();
})(typeof window !== "undefined" ? window : globalThis, function () {
  "use strict";

  const JST_OFFSET = 9 * 60 * 60 * 1000;
  const SLOT_HOURS = 4;
  const SLOT_LENGTH = SLOT_HOURS * 60 * 60 * 1000;

  const CONDITIONS = {
    clear: {
      name: "霽れ",
      code: "CLEAR",
      summary: "視界良好。市内の移動に問題はありません。",
      safety: "平常",
      precipitation: [0, 10]
    },
    cloudy: {
      name: "曇り",
      code: "CLOUDY",
      summary: "雲の多い空模様です。現在、異常気象情報はありません。",
      safety: "平常",
      precipitation: [10, 30]
    },
    rain: {
      name: "雨",
      code: "RAIN",
      summary: "雨具をお持ちください。足元と視界にご注意ください。",
      safety: "平常",
      precipitation: [70, 100]
    },
    snow: {
      name: "雪",
      code: "SNOW / WINTER ONLY",
      summary: "降雪が予想されます。路面の凍結にご注意ください。",
      safety: "注意",
      precipitation: [60, 90]
    },
    blank: {
      name: "空白",
      code: "OBSERVATION: [          ]",
      summary: "",
      safety: "判定なし",
      precipitation: null
    },
    distortion: {
      name: "歪み",
      code: "SPATIAL DISTORTION",
      summary: "局地的な空間歪曲が観測されています。屋内へ移動してください。",
      safety: "屋内安全",
      precipitation: null
    },
    visit: {
      name: "來訪",
      code: "VISITATION DETECTED",
      summary: "來客者が観測されています。警告事項を確認してください。",
      safety: "屋内安全",
      precipitation: null
    }
  };

  const MONTH_BASE_TEMPERATURES = [5, 7, 11, 16, 21, 24, 29, 30, 25, 19, 13, 8];

  const BROKEN_FORECASTS = [
    { name: "驕√￡繧�", code: "????????" },
    { name: "蛹ｿ繧後ｋ", code: "????????" },
    { name: "昊", code: "Y2FlbG█zdGlz" },
    { name: "甦", code: "█29udHJhZ███dGlvbg" },
    { name: "煇", code: "DO NOT LOOK" }
  ];

  const BLOCKED_CLOCK_VALUE = "██:13:91";

  const GLITCH_CHARACTERS = "!<>-_\\/[]{}—=+*^?#_█▒░";
  const forecastNoiseHandles = new Set();
  const ambientNoiseHandles = new Set();
  let forecastNoiseGeneration = 0;
  let ambientNoiseGeneration = 0;

  function hash(value) {
    let result = 2166136261;
    for (let index = 0; index < value.length; index += 1) {
      result ^= value.charCodeAt(index);
      result = Math.imul(result, 16777619);
    }
    return result >>> 0;
  }

  function jstParts(timestamp) {
    const shifted = new Date(timestamp + JST_OFFSET);
    return {
      year: shifted.getUTCFullYear(),
      month: shifted.getUTCMonth() + 1,
      day: shifted.getUTCDate(),
      hour: shifted.getUTCHours()
    };
  }

  function pad(value) {
    return String(value).padStart(2, "0");
  }

  function randomImpossibleTime() {
    if (Math.random() < 0.1) return BLOCKED_CLOCK_VALUE;

    let hour;
    let minute;
    let second;

    do {
      hour = Math.floor(Math.random() * 100);
      minute = Math.floor(Math.random() * 100);
      second = Math.floor(Math.random() * 100);
    } while (hour < 24 && minute < 60 && second < 60);

    return `${pad(hour)}:${pad(minute)}:${pad(second)}`;
  }

  function slotFor(timestamp) {
    const parts = jstParts(timestamp);
    const slotHour = Math.floor(parts.hour / SLOT_HOURS) * SLOT_HOURS;
    const start = Date.UTC(parts.year, parts.month - 1, parts.day, slotHour) - JST_OFFSET;
    return {
      start,
      end: start + SLOT_LENGTH,
      year: parts.year,
      month: parts.month,
      day: parts.day,
      hour: slotHour,
      key: `${parts.year}-${pad(parts.month)}-${pad(parts.day)}-${pad(slotHour)}`
    };
  }

  function chooseWeather(roll, month) {
    const winter = month === 1 || month === 2;

    if (winter) {
      if (roll < 32) return "clear";
      if (roll < 60) return "cloudy";
      if (roll < 77) return "rain";
      if (roll < 79) return "snow";
      if (roll < 86) return "blank";
      if (roll < 96) return "distortion";
      return "visit";
    }

    if (roll < 34) return "clear";
    if (roll < 62) return "cloudy";
    if (roll < 80) return "rain";
    if (roll < 87) return "blank";
    if (roll < 96) return "distortion";
    return "visit";
  }

  function readingFor(slot, forcedKey) {
    const roll = hash(`${slot.key}:weather`) % 100;
    const key = forcedKey && CONDITIONS[forcedKey] ? forcedKey : chooseWeather(roll, slot.month);
    const condition = CONDITIONS[key];
    const abnormal = key === "blank" || key === "distortion" || key === "visit";
    const hourAdjustment = { 0: -2, 4: -2, 8: 0, 12: 3, 16: 2, 20: 0 }[slot.hour] || 0;
    const weatherAdjustment = { cloudy: -1, rain: -2, snow: -3 }[key] || 0;
    const summer = slot.month >= 6 && slot.month <= 8;
    const variationRange = summer ? 8 : 5;
    const variation = (hash(`${slot.key}:temperature`) % variationRange) - 2;
    const temperature = abnormal
      ? null
      : MONTH_BASE_TEMPERATURES[slot.month - 1] + hourAdjustment + weatherAdjustment + variation;
    const precipitation = condition.precipitation
      ? condition.precipitation[0] + (hash(`${slot.key}:precipitation`) % (condition.precipitation[1] - condition.precipitation[0] + 1))
      : null;

    return { slot, key, condition, temperature, precipitation, roll };
  }

  function previewKeyFromSearch(search) {
    const value = new URLSearchParams(search || "").get("preview") || "";
    const aliases = {
      clear: "clear",
      cloudy: "cloudy",
      rain: "rain",
      snow: "snow",
      blank: "blank",
      distortion: "distortion",
      visit: "visit",
      "霽れ": "clear",
      "曇り": "cloudy",
      "雨": "rain",
      "雪": "snow",
      "空白": "blank",
      "歪み": "distortion",
      "來訪": "visit"
    };
    return aliases[value] || null;
  }

  const dateFormatter = new Intl.DateTimeFormat("ja-JP", {
    timeZone: "Asia/Tokyo",
    year: "numeric",
    month: "long",
    day: "numeric",
    weekday: "short"
  });

  const clockFormatter = new Intl.DateTimeFormat("ja-JP", {
    timeZone: "Asia/Tokyo",
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
    hour12: false
  });

  const shortDateFormatter = new Intl.DateTimeFormat("ja-JP", {
    timeZone: "Asia/Tokyo",
    month: "numeric",
    day: "numeric",
    weekday: "short"
  });

  function timeLabel(timestamp) {
    const parts = jstParts(timestamp);
    return `${pad(parts.hour)}:00`;
  }

  function periodLabel(slot) {
    return `${timeLabel(slot.start)}–${timeLabel(slot.end)}`;
  }

  function valueOrDash(value, suffix) {
    return value === null ? "--" : `${value}${suffix || ""}`;
  }

  function forecastCard(reading, index, brokenForecast) {
    const article = document.createElement("article");
    article.className = "forecast-card";
    article.dataset.weather = reading.key;

    if (brokenForecast) {
      article.classList.add("is-corrupted");
      article.dataset.corruption = String(index);
    }

    const date = document.createElement("time");
    date.dateTime = new Date(reading.slot.start).toISOString();
    date.textContent = `${index === 0 ? "現在 / " : ""}${shortDateFormatter.format(reading.slot.start)} ${periodLabel(reading.slot)}`;

    const code = document.createElement("span");
    code.className = "forecast-code";
    code.textContent = brokenForecast ? brokenForecast.code : reading.condition.code;

    const title = document.createElement("h3");
    title.textContent = brokenForecast ? brokenForecast.name : reading.condition.name;

    const details = document.createElement("dl");
    details.innerHTML = `
      <div><dt>気温</dt><dd>${brokenForecast ? "--" : valueOrDash(reading.temperature, "℃")}</dd></div>
      <div><dt>降水</dt><dd>${brokenForecast ? "--" : valueOrDash(reading.precipitation, "%")}</dd></div>
    `;

    article.append(date, code, title, details);
    return article;
  }

  function scrambledText(value) {
    const characters = Array.from(value);
    const eligibleIndexes = characters
      .map((character, index) => (/\s/.test(character) ? -1 : index))
      .filter((index) => index >= 0);

    if (!eligibleIndexes.length) return value;

    const replacements = new Set(eligibleIndexes.filter(() => Math.random() > 0.82));
    if (!replacements.size) {
      replacements.add(eligibleIndexes[Math.floor(Math.random() * eligibleIndexes.length)]);
    }

    return characters.map((character, index) => {
      if (!replacements.has(index)) return character;
      return GLITCH_CHARACTERS[Math.floor(Math.random() * GLITCH_CHARACTERS.length)];
    }).join("");
  }

  function noiseTimeout(callback, delay) {
    const handle = window.setTimeout(() => {
      forecastNoiseHandles.delete(handle);
      callback();
    }, delay);
    forecastNoiseHandles.add(handle);
    return handle;
  }

  function stopForecastNoise() {
    forecastNoiseGeneration += 1;
    forecastNoiseHandles.forEach((handle) => {
      window.clearTimeout(handle);
      window.clearInterval(handle);
    });
    forecastNoiseHandles.clear();
  }

  function startForecastNoise(grid) {
    const reduceMotion = window.matchMedia && window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    if (reduceMotion) return;

    const generation = forecastNoiseGeneration;
    const targets = grid.querySelectorAll(
      ".forecast-card.is-corrupted time, .forecast-card.is-corrupted .forecast-code, .forecast-card.is-corrupted h3"
    );

    targets.forEach((element, index) => {
      const originalText = element.textContent;

      function runCycle() {
        if (generation !== forecastNoiseGeneration || !element.isConnected) return;

        element.classList.add("is-noising");
        element.textContent = scrambledText(originalText);

        const interval = window.setInterval(() => {
          if (generation !== forecastNoiseGeneration || !element.isConnected) return;
          element.textContent = scrambledText(originalText);
        }, 70);
        forecastNoiseHandles.add(interval);

        noiseTimeout(() => {
          window.clearInterval(interval);
          forecastNoiseHandles.delete(interval);
          element.textContent = originalText;
          element.classList.remove("is-noising");

          if (generation === forecastNoiseGeneration && element.isConnected) {
            noiseTimeout(runCycle, 2000 + Math.random() * 5000);
          }
        }, 220 + Math.random() * 280);
      }

      noiseTimeout(runCycle, 250 + index * 90 + Math.random() * 1700);
    });
  }

  function ambientNoiseTimeout(callback, delay) {
    const handle = window.setTimeout(() => {
      ambientNoiseHandles.delete(handle);
      callback();
    }, delay);
    ambientNoiseHandles.add(handle);
    return handle;
  }

  function stopAmbientNoise() {
    ambientNoiseGeneration += 1;
    ambientNoiseHandles.forEach((handle) => {
      window.clearTimeout(handle);
      window.clearInterval(handle);
    });
    ambientNoiseHandles.clear();

    document.body.classList.remove("is-ambient-noise");
    document.querySelectorAll(".is-ambient-text-noise").forEach((element) => {
      if (element.dataset.ambientOriginal !== undefined) {
        element.textContent = element.dataset.ambientOriginal;
        delete element.dataset.ambientOriginal;
      }
      element.classList.remove("is-ambient-text-noise");
    });
  }

  function startAmbientNoise() {
    stopAmbientNoise();
    const reduceMotion = window.matchMedia && window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    if (reduceMotion) return;

    const generation = ambientNoiseGeneration;
    const targetSelector = [
      ".city-mark span",
      ".city-mark strong",
      ".city-service span",
      ".city-service strong",
      ".service-label",
      "#current-date",
      ".current-heading h1",
      "#current-period",
      ".section-heading p",
      ".section-heading h2",
      ".section-heading > span",
      ".weather-notice strong",
      ".city-footer span"
    ].join(", ");

    function scheduleNext(delay) {
      ambientNoiseTimeout(runAmbientNoise, delay);
    }

    function runAmbientNoise() {
      if (generation !== ambientNoiseGeneration) return;
      if (document.hidden) {
        scheduleNext(5000);
        return;
      }

      const targets = Array.from(document.querySelectorAll(targetSelector)).filter((element) => {
        if (!element.textContent.trim() || element.closest("[hidden]")) return false;
        const bounds = element.getBoundingClientRect();
        return bounds.bottom > 0 && bounds.top < window.innerHeight;
      });

      if (!targets.length) {
        scheduleNext(5000);
        return;
      }

      const target = targets[Math.floor(Math.random() * targets.length)];
      const originalText = target.textContent;
      target.dataset.ambientOriginal = originalText;
      target.classList.add("is-ambient-text-noise");
      target.textContent = scrambledText(originalText);

      document.body.style.setProperty("--ambient-noise-y", `${8 + Math.floor(Math.random() * 84)}vh`);
      document.body.classList.add("is-ambient-noise");

      const interval = window.setInterval(() => {
        if (generation !== ambientNoiseGeneration || !target.isConnected) return;
        target.textContent = scrambledText(originalText);
      }, 60);
      ambientNoiseHandles.add(interval);

      ambientNoiseTimeout(() => {
        window.clearInterval(interval);
        ambientNoiseHandles.delete(interval);
        target.textContent = originalText;
        delete target.dataset.ambientOriginal;
        target.classList.remove("is-ambient-text-noise");
        document.body.classList.remove("is-ambient-noise");

        if (generation === ambientNoiseGeneration) {
          scheduleNext(14000 + Math.random() * 18000);
        }
      }, 160 + Math.random() * 170);
    }

    scheduleNext(2500 + Math.random() * 4000);
  }

  function renderAlert(reading) {
    const alert = document.getElementById("weather-alert");
    const visitGuidance = document.getElementById("visit-guidance");
    const title = document.getElementById("alert-title");
    const code = document.getElementById("alert-code");
    const dangerous = reading.key === "distortion" || reading.key === "visit";

    alert.hidden = !dangerous;
    visitGuidance.hidden = reading.key !== "visit";

    if (reading.key === "visit") {
      code.textContent = "VISITATION WARNING / SEEK SHELTER";
      title.textContent = "來訪警報";
    } else if (reading.key === "distortion") {
      code.textContent = "SPATIAL DISTORTION ADVISORY";
      title.textContent = "歪み注意報";
    }
  }

  function render(now, previewKey) {
    const currentSlot = slotFor(now);
    const readings = Array.from({ length: 4 }, (_, index) => readingFor(slotFor(currentSlot.start + index * SLOT_LENGTH)));
    if (previewKey) readings[0] = readingFor(currentSlot, previewKey);
    const current = readings[0];

    document.body.dataset.weather = current.key;
    document.getElementById("current-date").textContent = dateFormatter.format(currentSlot.start);
    document.getElementById("current-period").textContent = `${periodLabel(currentSlot)}の予報 / 日本標準時`;
    document.getElementById("condition-code").textContent = current.condition.code;
    document.getElementById("condition-name").textContent = current.condition.name;
    document.getElementById("condition-summary").textContent = current.condition.summary || "　";
    document.getElementById("current-temperature").textContent = current.temperature === null ? "--" : current.temperature;
    document.getElementById("temperature-unit").textContent = current.temperature === null ? "" : "℃";
    document.getElementById("current-precipitation").textContent = valueOrDash(current.precipitation, "%");
    document.getElementById("current-safety").textContent = current.condition.safety;
    document.getElementById("next-update").textContent = `${timeLabel(currentSlot.end)} JST`;

    renderAlert(current);

    const grid = document.getElementById("forecast-grid");
    const outlookIsBroken = current.key === "blank" || current.key === "distortion" || current.key === "visit";
    const corruptionOffset = hash(`${current.slot.key}:${current.key}:outlook`) % BROKEN_FORECASTS.length;
    stopForecastNoise();
    grid.classList.toggle("is-corrupted", outlookIsBroken);
    grid.replaceChildren(...readings.map((reading, index) => {
      const brokenForecast = outlookIsBroken && index > 0
        ? BROKEN_FORECASTS[(corruptionOffset + index - 1) % BROKEN_FORECASTS.length]
        : null;
      return forecastCard(reading, index, brokenForecast);
    }));
    if (outlookIsBroken) startForecastNoise(grid);

    return currentSlot.key;
  }

  function renderPreviewNotice(previewKey) {
    const notice = document.getElementById("preview-notice");
    notice.hidden = !previewKey;
    document.body.classList.toggle("is-preview", Boolean(previewKey));
    if (previewKey) document.getElementById("preview-condition").textContent = CONDITIONS[previewKey].name;
  }

  function start() {
    const previewKey = previewKeyFromSearch(window.location.search);
    renderPreviewNotice(previewKey);
    let renderedSlot = render(Date.now(), previewKey);
    const clock = document.getElementById("city-clock");
    let clockAnomalyStartsAt = Date.now() + 1800 + Math.random() * 3200;
    let clockAnomalyEndsAt = 0;

    function updateClock(now) {
      clock.dateTime = new Date(now).toISOString();

      if (!clockAnomalyEndsAt && now >= clockAnomalyStartsAt) {
        clockAnomalyEndsAt = now + 3500 + Math.random() * 3500;
      }

      if (clockAnomalyEndsAt && now < clockAnomalyEndsAt) {
        const impossibleTime = randomImpossibleTime();
        const display = `${impossibleTime} JST`;
        clock.textContent = display;
        clock.setAttribute("aria-label", "時刻表示に異常が発生しています");
        return;
      }

      if (clockAnomalyEndsAt) {
        clockAnomalyEndsAt = 0;
        clockAnomalyStartsAt = now + 6000 + Math.random() * 8000;
      }

      const actualTime = clockFormatter.format(now);
      clock.textContent = `${actualTime} JST`;
      clock.setAttribute("aria-label", `${actualTime} 日本標準時`);
    }

    function tick() {
      const now = Date.now();
      updateClock(now);
      const nextSlot = slotFor(now).key;
      if (nextSlot !== renderedSlot) renderedSlot = render(now, previewKey);
    }

    tick();
    startAmbientNoise();
    window.addEventListener("pagehide", stopAmbientNoise, { once: true });
    window.setInterval(tick, 1000);
  }

  return {
    BLOCKED_CLOCK_VALUE,
    BROKEN_FORECASTS,
    CONDITIONS,
    SLOT_LENGTH,
    chooseWeather,
    hash,
    jstParts,
    previewKeyFromSearch,
    randomImpossibleTime,
    readingFor,
    scrambledText,
    slotFor,
    start
  };
});
