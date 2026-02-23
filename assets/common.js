document.addEventListener("click", function(e) {
  const toggle = e.target.closest(".menu-toggle");

  if (toggle) {
    const navLinks = document.querySelector(".nav-links");
    if (navLinks) {
      navLinks.classList.toggle("open");
    }
  }
});
