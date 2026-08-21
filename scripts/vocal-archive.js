(() => {
  "use strict";

  // 旧インラインスクリプトを動かさず、ここだけを操作系の正本にする。
  window.__vocalArchiveReplacement = true;

  const source = document.querySelector("body > div");
  if (!source) return;

  document.documentElement.lang = "ja";
  document.title = "歌唱記録照合端末｜N/A市記録保管庫";
  source.classList.add("vocal-catalog");

  const groupTitles = Array.from(source.querySelectorAll(".body-title"));
  const groupContents = Array.from(source.querySelectorAll(".body-content"));
  if (!groupTitles.length || groupTitles.length !== groupContents.length) return;

  const firstGroup = groupTitles[0];
  const legacyIntro = document.createElement("div");
  legacyIntro.className = "vocal-legacy-intro";
  while (source.firstChild && source.firstChild !== firstGroup) {
    legacyIntro.appendChild(source.firstChild);
  }
  source.insertBefore(legacyIntro, firstGroup);

  function appendSongRow(target, bufferedNodes) {
    if (!bufferedNodes.length) return;
    const row = document.createElement("div");
    row.className = "song-row";
    bufferedNodes.forEach(node => row.appendChild(node));
    row.querySelectorAll("br").forEach(br => br.replaceWith(" "));

    const title = (row.textContent || "").replace(/\s+/g, " ").trim();
    if (!title) return;

    row.dataset.search = title.toLocaleLowerCase("ja");
    if (row.querySelector("a[href]")) row.classList.add("has-sample");
    row.querySelectorAll("a[href]").forEach(link => {
      link.target = "_blank";
      link.rel = "noopener noreferrer";
      link.title = `${title}の音源を新しいタブで開く`;
    });
    target.appendChild(row);
  }

  groupContents.forEach((content, index) => {
    const originalNodes = Array.from(content.childNodes);
    const rebuilt = document.createDocumentFragment();
    let buffer = [];

    const flush = () => {
      appendSongRow(rebuilt, buffer);
      buffer = [];
    };

    originalNodes.forEach(node => {
      if (node.nodeType === Node.ELEMENT_NODE && node.tagName === "H3") {
        flush();
        node.classList.add("vocal-subhead");
        rebuilt.appendChild(node);
        return;
      }
      if (node.nodeType === Node.ELEMENT_NODE && node.tagName === "BR") {
        flush();
        return;
      }
      buffer.push(node);
    });
    flush();

    content.replaceChildren(rebuilt);
    const count = content.querySelectorAll(".song-row").length;
    groupTitles[index].dataset.count = String(count).padStart(3, "0");
  });

  const allRows = Array.from(source.querySelectorAll(".song-row"));
  const sampleRows = allRows.filter(row => row.classList.contains("has-sample"));

  const toolbar = document.createElement("div");
  toolbar.className = "vocal-toolbar";
  toolbar.innerHTML = `
    <div class="vocal-toolbar-inner">
      <a class="vocal-home" href="archive.html">記録保管庫へ戻る</a>
      <label class="vocal-search-wrap">
        <span class="vocal-search-label">SEARCH</span>
        <input id="vocal-search" class="vocal-search" type="search" autocomplete="off" placeholder="曲名を入力（例：砂の惑星）">
      </label>
      <div class="vocal-controls" aria-label="一覧の操作">
        <button id="vocal-samples" class="vocal-tool-button" type="button" aria-pressed="false">音源あり</button>
        <button id="vocal-open" class="vocal-tool-button" type="button">全て開く</button>
        <button id="vocal-close" class="vocal-tool-button" type="button">全て閉じる</button>
        <button id="vocal-reset" class="vocal-tool-button" type="button">解除</button>
      </div>
    </div>`;

  const shell = document.createElement("main");
  shell.className = "vocal-shell";
  shell.innerHTML = `
    <section class="vocal-masthead" aria-labelledby="vocal-title">
      <div class="vocal-heading">
        <p class="vocal-kicker">N/A CITY / VOCAL REFERENCE TERMINAL</p>
        <h1 id="vocal-title">歌唱記録照合端末</h1>
        <p class="vocal-lead">外峯零の歌唱可能曲と、公開済み音源を照合するための参照記録です。</p>
      </div>
      <dl class="vocal-status" aria-label="歌唱記録の状態">
        <div><dt>SONGS</dt><dd id="vocal-total">${String(allRows.length).padStart(4, "0")}</dd></div>
        <div><dt>SAMPLES</dt><dd>${String(sampleRows.length).padStart(4, "0")}</dd></div>
        <div><dt>STATUS</dt><dd class="vocal-online">ACTIVE</dd></div>
      </dl>
    </section>
    <section class="vocal-guide" aria-labelledby="vocal-guide-title">
      <div>
        <p class="vocal-guide-label">USAGE NOTE / PUBLIC REFERENCE</p>
        <h2 id="vocal-guide-title">曲名を検索して、歌唱記録を照合できます。</h2>
        <p>無印は歌唱可能曲、赤い標識付きは公開音源のある曲です。掲載外の曲もリクエスト受付中。うろ覚え・応えられない場合はご愛嬌で……。</p>
      </div>
      <ul class="vocal-legend" aria-label="記号の説明">
        <li>歌唱可能</li>
        <li class="sample">公開音源あり</li>
      </ul>
    </section>`;

  const empty = document.createElement("p");
  empty.className = "vocal-empty";
  empty.textContent = "LOOKUP RESULT: 該当する歌唱記録は見つかりませんでした。";

  source.before(shell);
  shell.appendChild(source);
  shell.appendChild(empty);
  document.body.prepend(toolbar);

  const search = document.getElementById("vocal-search");
  const samplesButton = document.getElementById("vocal-samples");
  const openButton = document.getElementById("vocal-open");
  const closeButton = document.getElementById("vocal-close");
  const resetButton = document.getElementById("vocal-reset");
  const totalOutput = document.getElementById("vocal-total");

  function setGroupOpen(title, content, open) {
    content.hidden = !open;
    title.classList.toggle("collapsed", !open);
    title.setAttribute("aria-expanded", String(open));
  }

  function refreshSubheads(content) {
    const children = Array.from(content.children);
    children.forEach((child, index) => {
      if (!child.classList.contains("vocal-subhead")) return;
      let hasVisibleRow = false;
      for (let i = index + 1; i < children.length; i += 1) {
        if (children[i].classList.contains("vocal-subhead")) break;
        if (children[i].classList.contains("song-row") && !children[i].hidden) {
          hasVisibleRow = true;
          break;
        }
      }
      child.hidden = !hasVisibleRow;
    });
  }

  let marks = [];
  function clearHighlights() {
    marks.forEach(mark => {
      const parent = mark.parentNode;
      if (!parent) return;
      parent.replaceChild(document.createTextNode(mark.textContent), mark);
      parent.normalize();
    });
    marks = [];
  }

  function highlight(row, keyword) {
    if (!keyword) return;
    const walker = document.createTreeWalker(row, NodeFilter.SHOW_TEXT);
    const textNodes = [];
    while (walker.nextNode()) textNodes.push(walker.currentNode);
    textNodes.forEach(node => {
      const lower = node.nodeValue.toLocaleLowerCase("ja");
      const at = lower.indexOf(keyword);
      if (at < 0) return;
      const mark = document.createElement("mark");
      mark.textContent = node.nodeValue.slice(at, at + keyword.length);
      const fragment = document.createDocumentFragment();
      fragment.append(node.nodeValue.slice(0, at), mark, node.nodeValue.slice(at + keyword.length));
      node.replaceWith(fragment);
      marks.push(mark);
    });
  }

  function applyFilters() {
    clearHighlights();
    const keyword = search.value.trim().toLocaleLowerCase("ja");
    const samplesOnly = samplesButton.getAttribute("aria-pressed") === "true";
    const filtering = Boolean(keyword || samplesOnly);
    let visibleTotal = 0;

    groupTitles.forEach((title, index) => {
      const content = groupContents[index];
      let visibleInGroup = 0;
      content.querySelectorAll(".song-row").forEach(row => {
        const matchesText = !keyword || row.dataset.search.includes(keyword);
        const matchesSample = !samplesOnly || row.classList.contains("has-sample");
        const visible = matchesText && matchesSample;
        row.hidden = !visible;
        if (visible) {
          visibleInGroup += 1;
          visibleTotal += 1;
          highlight(row, keyword);
        }
      });
      refreshSubheads(content);
      title.hidden = visibleInGroup === 0;
      if (visibleInGroup === 0) {
        content.hidden = true;
      } else if (filtering) {
        setGroupOpen(title, content, true);
      } else {
        setGroupOpen(title, content, false);
      }
    });

    totalOutput.textContent = filtering
      ? `${String(visibleTotal).padStart(4, "0")} / ${String(allRows.length).padStart(4, "0")}`
      : String(allRows.length).padStart(4, "0");
    empty.classList.toggle("visible", visibleTotal === 0);
  }

  groupTitles.forEach((title, index) => {
    title.setAttribute("role", "button");
    title.setAttribute("tabindex", "0");
    setGroupOpen(title, groupContents[index], false);
    const toggle = () => setGroupOpen(title, groupContents[index], groupContents[index].hidden);
    title.addEventListener("click", toggle);
    title.addEventListener("keydown", event => {
      if (event.key !== "Enter" && event.key !== " ") return;
      event.preventDefault();
      toggle();
    });
  });

  search.addEventListener("input", applyFilters);
  samplesButton.addEventListener("click", () => {
    const next = samplesButton.getAttribute("aria-pressed") !== "true";
    samplesButton.setAttribute("aria-pressed", String(next));
    applyFilters();
  });
  openButton.addEventListener("click", () => {
    groupTitles.forEach((title, index) => {
      if (!title.hidden) setGroupOpen(title, groupContents[index], true);
    });
  });
  closeButton.addEventListener("click", () => {
    groupTitles.forEach((title, index) => {
      if (!title.hidden) setGroupOpen(title, groupContents[index], false);
    });
  });
  resetButton.addEventListener("click", () => {
    search.value = "";
    samplesButton.setAttribute("aria-pressed", "false");
    groupTitles.forEach((title, index) => {
      title.hidden = false;
      groupContents[index].querySelectorAll(".song-row,.vocal-subhead").forEach(item => {
        item.hidden = false;
      });
      setGroupOpen(title, groupContents[index], false);
    });
    clearHighlights();
    totalOutput.textContent = String(allRows.length).padStart(4, "0");
    empty.classList.remove("visible");
    search.focus();
  });
})();
