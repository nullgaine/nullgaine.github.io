document.addEventListener("click", function(e) {
  if (e.target.matches(".menu-toggle")) {
    const navLinks = document.querySelector(".nav-links");
    if (navLinks) {
      navLinks.classList.toggle("open");
    }
  }
});
