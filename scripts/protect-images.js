(() => {
  const protectedArea = document.querySelector("[data-image-protection]");
  const alert = document.querySelector(".records-protection-alert");

  if (!protectedArea) return;

  let alertTimer;

  function showProtectionAlert() {
    if (!alert) return;

    alert.classList.add("is-visible");
    window.clearTimeout(alertTimer);
    alertTimer = window.setTimeout(() => {
      alert.classList.remove("is-visible");
    }, 2200);
  }

  protectedArea.addEventListener("contextmenu", (event) => {
    if (!event.target.closest("img")) return;

    event.preventDefault();
    showProtectionAlert();
  });

  protectedArea.addEventListener("dragstart", (event) => {
    if (!event.target.closest("img")) return;

    event.preventDefault();
    showProtectionAlert();
  });
})();
