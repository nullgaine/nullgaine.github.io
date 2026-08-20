(function () {
  const records = Array.from(document.querySelectorAll(".video-record"));
  const search = document.getElementById("video-search");
  const count = document.getElementById("archive-count");
  const empty = document.getElementById("archive-empty");
  const dialog = document.getElementById("video-dialog");
  const player = document.getElementById("video-player");
  const dialogTitle = document.getElementById("video-dialog-title");
  const closeButton = document.getElementById("video-dialog-close");

  function normalize(value) {
    return String(value || "")
      .normalize("NFKC")
      .toLocaleLowerCase()
      .replace(/[\s　_\-‐‑‒–—―./:・,，、]+/g, "");
  }

  function updateRecords() {
    const query = normalize(search.value);
    let visible = 0;

    records.forEach(record => {
      const show = !query || normalize(record.dataset.search).includes(query);
      record.hidden = !show;
      if (show) visible += 1;
    });

    count.textContent = `表示記録：${visible} / ${records.length}`;
    empty.hidden = visible !== 0;
  }

  function openVideo(videoId, title) {
    if (!videoId) return;

    if (typeof dialog.showModal !== "function") {
      window.open(`https://www.youtube.com/watch?v=${encodeURIComponent(videoId)}`, "_blank", "noopener");
      return;
    }

    dialogTitle.textContent = title || "映像記録";
    player.src = `https://www.youtube-nocookie.com/embed/${encodeURIComponent(videoId)}?autoplay=1&rel=0`;
    dialog.showModal();
  }

  function closeVideo() {
    if (dialog.open) dialog.close();
    player.src = "";
  }

  search.addEventListener("input", updateRecords);

  document.querySelectorAll("[data-video-id]").forEach(button => {
    button.addEventListener("click", () => {
      openVideo(button.dataset.videoId, button.dataset.videoTitle);
    });
  });

  closeButton.addEventListener("click", closeVideo);
  dialog.addEventListener("close", () => {
    player.src = "";
  });
  dialog.addEventListener("click", event => {
    if (event.target === dialog) closeVideo();
  });

  if (location.hash) {
    const target = document.getElementById(location.hash.slice(1));
    if (target?.classList.contains("video-record")) {
      requestAnimationFrame(() => target.scrollIntoView({ block: "center" }));
    }
  }

  updateRecords();
})();
