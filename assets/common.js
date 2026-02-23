document.addEventListener("click", function(e) {

  if (e.target.closest(".menu-toggle")) {

    console.log("クリックされた");

    const navLinks = document.querySelector(".nav-links");

    if (navLinks) {
      navLinks.classList.toggle("open");
    } else {
      console.log("nav-linksが見つからない");
    }
  }

});
