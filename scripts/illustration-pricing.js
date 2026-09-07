(function(){
  const modal = document.getElementById("sampleModal");
  const mount = document.getElementById("sampleMount");
  if (!modal || !mount) return;

  let samples = [];
  let index = 0;
  let lastTrigger = null;

  function normalizedSamples(raw){
    return raw.split(",").map(function(path){
      const clean = path.trim();
      if (!clean || clean.startsWith("/") || clean.startsWith("http")) return clean;
      return "/" + clean.replace(/^\.?\//, "");
    }).filter(Boolean);
  }

  function render(title){
    mount.innerHTML = "";
    const image = document.createElement("img");
    image.className = "sample-modal__image";
    image.src = samples[index];
    image.alt = title + "の作例";

    const nav = document.createElement("div");
    nav.className = "sample-modal__nav";
    const previous = document.createElement("button");
    previous.type = "button";
    previous.textContent = "←";
    previous.setAttribute("aria-label", "前の作例");
    const counter = document.createElement("span");
    counter.className = "sample-modal__counter";
    counter.textContent = (index + 1) + " / " + samples.length;
    const next = document.createElement("button");
    next.type = "button";
    next.textContent = "→";
    next.setAttribute("aria-label", "次の作例");
    previous.addEventListener("click", function(){ index = (index - 1 + samples.length) % samples.length; render(title); });
    next.addEventListener("click", function(){ index = (index + 1) % samples.length; render(title); });
    if (samples.length > 1) nav.append(previous, counter, next);

    const caption = document.createElement("p");
    caption.className = "sample-modal__caption";
    caption.id = "sampleTitle";
    caption.textContent = title;
    image.addEventListener("error", function(){
      const error = document.createElement("div");
      error.className = "sample-modal__error";
      error.textContent = "作例画像を読み込めませんでした";
      image.replaceWith(error);
    }, {once:true});
    mount.append(image);
    if (samples.length > 1) mount.append(nav);
    mount.append(caption);
  }

  function open(trigger){
    const card = trigger.closest("article");
    const title = card && card.querySelector("h3") ? card.querySelector("h3").textContent.trim() : "作例";
    samples = normalizedSamples(trigger.getAttribute("data-sample") || "");
    if (!samples.length) return;
    index = 0;
    lastTrigger = trigger;
    render(title);
    modal.setAttribute("aria-hidden", "false");
    document.documentElement.style.overflow = "hidden";
    modal.querySelector(".sample-modal__close").focus();
  }

  function close(){
    modal.setAttribute("aria-hidden", "true");
    mount.innerHTML = "";
    document.documentElement.style.overflow = "";
    if (lastTrigger) lastTrigger.focus();
  }

  document.querySelectorAll(".sample-button[data-sample]").forEach(function(button){ button.addEventListener("click", function(){ open(button); }); });
  modal.querySelectorAll("[data-close]").forEach(function(control){ control.addEventListener("click", close); });
  window.addEventListener("keydown", function(event){ if (event.key === "Escape" && modal.getAttribute("aria-hidden") === "false") close(); });
})();
