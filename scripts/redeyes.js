(() => {
  const terminal = document.querySelector(".containment-shell");
  const openButton = document.getElementById("open-record");
  const restartButton = document.getElementById("restart-record");
  const seal = document.getElementById("message-seal");
  const documentPanel = document.getElementById("message-document");
  const message = document.getElementById("message-copy");
  const terminalStatus = document.getElementById("terminal-status");
  const bufferStatus = document.getElementById("buffer-status");
  const readoutPrimary = document.getElementById("readout-primary");
  const readoutSecondary = document.getElementById("readout-secondary");
  const meter = document.querySelector(".infection-meter span");
  const systemAlert = document.getElementById("system-alert");

  if (!terminal || !openButton || !seal || !documentPanel || !message) return;

  const originalMessage = message.textContent;
  const corruptionTokens = ["赤", "瞳", "視", "てる"];
  const finalMessage = "よっぽど覚えられたいらしい、随分と変わったお方だこと。\n良いでしょう、おぼえておくね。";
  const timers = [];
  let corruptionTimer;
  let signalTimer;
  let alertTimer;
  let corruptionLevel = 0;

  function setTerminalStatus(label, className) {
    terminalStatus.textContent = label;
    terminalStatus.className = className;
  }

  function showAlert(text) {
    if (!systemAlert) return;

    const detail = systemAlert.querySelector("span");
    if (detail) detail.textContent = text;
    systemAlert.classList.add("is-visible");
    window.clearTimeout(alertTimer);
    alertTimer = window.setTimeout(() => {
      systemAlert.classList.remove("is-visible");
    }, 2400);
  }

  function queue(callback, delay) {
    timers.push(window.setTimeout(callback, delay));
  }

  function clearSequence() {
    timers.splice(0).forEach(window.clearTimeout);
    window.clearInterval(corruptionTimer);
    window.clearInterval(signalTimer);
  }

  function corruptMessage() {
    terminal.dataset.state = "contaminating";
    setTerminalStatus("ALERT", "status-alert");
    bufferStatus.textContent = "MUTATING";
    readoutPrimary.textContent = "CONTAINMENT: UNSTABLE";
    message.classList.add("is-corrupting");
    showAlert("記録内で文字列の置換を検出しました。");

    corruptionTimer = window.setInterval(() => {
      corruptionLevel = Math.min(corruptionLevel + 0.025, 0.42);
      const characters = originalMessage.split("");
      const replaceable = characters
        .map((character, index) => (/[^\s=]/.test(character) ? index : -1))
        .filter(index => index >= 0);
      const replacementCount = Math.max(1, Math.floor(replaceable.length * corruptionLevel));

      for (let index = 0; index < replacementCount; index += 1) {
        const position = replaceable[Math.floor(Math.random() * replaceable.length)];
        characters[position] = corruptionTokens[Math.floor(Math.random() * corruptionTokens.length)];
      }

      message.textContent = characters.join("");
    }, 520);
  }

  function breachRecord() {
    window.clearInterval(corruptionTimer);
    terminal.dataset.state = "breached";
    setTerminalStatus("BREACHED", "status-breached");
    bufferStatus.textContent = "OVERRIDDEN";
    readoutPrimary.textContent = "CONTAINMENT: FAILED";
    message.classList.remove("is-corrupting");
    message.classList.add("is-breached");

    const lines = [];
    for (let line = 0; line < 12; line += 1) {
      lines.push("赤瞳視てる".repeat(10));
    }
    message.textContent = lines.join("\n");
    showAlert("閲覧端末の表示権限が上書きされました。");
  }

  function retainViewer() {
    terminal.dataset.state = "retained";
    setTerminalStatus("RETAINED", "status-breached");
    bufferStatus.textContent = "MESSAGE RECEIVED";
    readoutPrimary.textContent = "CONTAINMENT: UNKNOWN";
    readoutSecondary.textContent = "SIGNAL: --.--";
    message.classList.remove("is-breached");
    message.classList.add("is-retained");
    message.textContent = finalMessage;
    restartButton.hidden = false;
    showAlert("記録が閲覧者を保持しました。");
  }

  function beginSignalReadout() {
    const startedAt = Date.now();
    signalTimer = window.setInterval(() => {
      const elapsed = Math.min((Date.now() - startedAt) / 25000, 1);
      const signal = (elapsed * 99.99).toFixed(2).padStart(5, "0");
      readoutSecondary.textContent = `SIGNAL: ${signal}`;
    }, 180);
  }

  function openRecord() {
    clearSequence();
    corruptionLevel = 0;
    terminal.dataset.state = "reading";
    setTerminalStatus("READING", "status-reading");
    bufferStatus.textContent = "OPEN / READ ONLY";
    readoutPrimary.textContent = "CONTAINMENT: STABLE";
    readoutSecondary.textContent = "SIGNAL: 00.00";
    openButton.disabled = true;
    seal.hidden = true;
    documentPanel.hidden = false;
    restartButton.hidden = true;
    message.className = "message-copy";
    message.textContent = originalMessage;
    meter.classList.remove("is-running");
    void meter.offsetWidth;
    meter.classList.add("is-running");
    documentPanel.focus({ preventScroll: true });
    beginSignalReadout();

    queue(corruptMessage, 8000);
    queue(breachRecord, 16000);
    queue(() => {
      window.clearInterval(signalTimer);
      retainViewer();
    }, 25000);
  }

  function restartRecord() {
    clearSequence();
    corruptionLevel = 0;
    terminal.dataset.state = "sealed";
    setTerminalStatus("SEALED", "status-sealed");
    bufferStatus.textContent = "UNOPENED";
    readoutPrimary.textContent = "CONTAINMENT: STABLE";
    readoutSecondary.textContent = "SIGNAL: 0.00";
    message.className = "message-copy";
    message.textContent = originalMessage;
    documentPanel.hidden = true;
    seal.hidden = false;
    openButton.disabled = false;
    restartButton.hidden = true;
    meter.classList.remove("is-running");
    systemAlert?.classList.remove("is-visible");
    openButton.focus();
  }

  openButton.addEventListener("click", openRecord);
  restartButton?.addEventListener("click", restartRecord);
})();
