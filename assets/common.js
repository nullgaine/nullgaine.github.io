document.addEventListener("click", function(e){
  if(e.target.id === "menuToggle"){
    document.getElementById("navMenu").classList.toggle("open");
  }
});
