document.addEventListener("DOMContentLoaded", function() {
  console.log("JS OK");

  document.addEventListener("click", function(e) {
    if (e.target.closest(".menu-toggle")) {
      const navLinks = document.querySelector(".nav-links");
      if (navLinks) {
        navLinks.classList.toggle("open");
      }
    }
  });
});
