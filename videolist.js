(function () {
  const dialog = document.getElementById("portfolio-dialog");
  const player = document.getElementById("portfolio-player");
  const title = document.getElementById("portfolio-dialog-title");
  const closeButton = document.getElementById("portfolio-dialog-close");
  const youtubeLink = document.getElementById("portfolio-youtube-link");

  if (!dialog || !player || !title || !closeButton || !youtubeLink) return;

  function stopVideo() {
    player.removeAttribute("src");
  }

  function openVideo(videoId, videoTitle) {
    if (!videoId) return;

    title.textContent = videoTitle || "映像サンプル";
    youtubeLink.href = `https://www.youtube.com/watch?v=${encodeURIComponent(videoId)}`;
    player.src = `https://www.youtube-nocookie.com/embed/${encodeURIComponent(videoId)}?autoplay=1&rel=0`;

    if (typeof dialog.showModal === "function") {
      dialog.showModal();
    } else {
      dialog.setAttribute("open", "");
    }
  }

  function closeVideo() {
    if (typeof dialog.close === "function" && dialog.open) {
      dialog.close();
    } else {
      dialog.removeAttribute("open");
      stopVideo();
    }
  }

  document.addEventListener("click", function (event) {
    const trigger = event.target.closest("[data-video-id]");
    if (trigger) {
      openVideo(trigger.dataset.videoId, trigger.dataset.videoTitle);
    }
  });

  closeButton.addEventListener("click", closeVideo);
  dialog.addEventListener("close", stopVideo);
  dialog.addEventListener("cancel", stopVideo);
  dialog.addEventListener("click", function (event) {
    if (event.target === dialog) closeVideo();
  });
})();
