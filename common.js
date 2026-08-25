document.addEventListener("click", function(e) {
  if (!(e.target instanceof Element)) return;

  const toggle = e.target.closest(".menu-toggle");
  if (!toggle) return;

  const controlledId = toggle.getAttribute("aria-controls");
  const navLinks = controlledId
    ? document.getElementById(controlledId)
    : document.querySelector(".nav-links");

  if (!navLinks) return;

  const isOpen = navLinks.classList.toggle("open");
  toggle.setAttribute("aria-expanded", String(isOpen));
});
