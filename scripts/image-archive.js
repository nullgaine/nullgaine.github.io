(() => {
  const lightbox = document.querySelector("[data-image-lightbox]");
  if (!lightbox) return;

  const image = lightbox.querySelector("[data-image-lightbox-image]");
  const title = lightbox.querySelector("[data-image-lightbox-title]");
  const code = lightbox.querySelector("[data-image-lightbox-code]");
  const closeButton = lightbox.querySelector(".image-lightbox-close");
  const openButtons = document.querySelectorAll("[data-image-src]");
  let returnFocus = null;

  function openLightbox(button) {
    returnFocus = button;
    image.src = button.dataset.imageSrc || "";
    image.alt = button.querySelector("img")?.alt || "画像記録";
    title.textContent = button.dataset.imageTitle || "画像記録";
    code.textContent = button.dataset.imageCode || "NA-IM";
    lightbox.hidden = false;
    document.body.classList.add("image-lightbox-open");
    closeButton.focus();
  }

  function closeLightbox() {
    if (lightbox.hidden) return;
    lightbox.hidden = true;
    image.src = "";
    document.body.classList.remove("image-lightbox-open");
    returnFocus?.focus();
    returnFocus = null;
  }

  openButtons.forEach((button) => {
    button.addEventListener("click", () => openLightbox(button));
  });

  lightbox.querySelectorAll("[data-image-close]").forEach((button) => {
    button.addEventListener("click", closeLightbox);
  });

  document.addEventListener("keydown", (event) => {
    if (event.key === "Escape") closeLightbox();
  });
})();
