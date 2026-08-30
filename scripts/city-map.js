(function () {
  "use strict";

  const MAP_WIDTH = 1600;
  const MAP_HEIGHT = 1200;
  const MAX_ZOOM = 4;

  const PLACES = [
    {
      id: "hospital",
      code: "NA-HSP-01",
      category: "MEDICAL FACILITY",
      title: "江縫栄市立総合病院",
      reading: "えぬえいしりつそうごうびょういん",
      summary: "北司零寺2-1-1に所在する、市内の基幹施設です。公開案内では総9階建てとされています。",
      note: "江縫栄市立総合病院前駅から徒歩2分。救急搬送診療は市民のみ適用されます。",
      x: 24.8,
      y: 61.0,
      color: "#a51f2d",
      links: [
        { label: "施設概要", href: "overview" },
        { label: "Access", href: "access" },
        { label: "Café Palette", href: "cafepalette" }
      ]
    },
    {
      id: "cafe-palette",
      code: "NA-CFE-01",
      category: "HOSPITAL CAFÉ",
      title: "Café Palette",
      reading: "カフェ・パレット",
      summary: "江縫栄市立総合病院の1階にあるカフェです。病院利用者以外も立ち寄れる、外付け型の小さな喫茶店として案内されています。",
      note: "江縫栄市立総合病院1階。入口と営業時間は店舗案内をご確認ください。",
      x: 20.9,
      y: 69.0,
      color: "#b56d7f",
      links: [
        { label: "店舗案内", href: "cafepalette" },
        { label: "病院Access", href: "access" }
      ]
    },
    {
      id: "fleur-de-paix",
      code: "NA-SHP-26",
      category: "TAKEOUT SHOP",
      title: "Fleur de Paix",
      reading: "フルール・ド・ペ",
      summary: "江縫栄市立総合病院の近くにある、ドリンクのテイクアウト専門店です。",
      note: "院内店舗ではありません。病院北東側の街区に案内されています。",
      x: 30.6,
      y: 46.4,
      color: "#8d667e",
      links: [
        { label: "メニュー", href: "flepaix" },
        { label: "病院Access", href: "access" }
      ]
    },
    {
      id: "hospital-station",
      code: "NA-STA-02",
      category: "LOCAL STATION",
      title: "江縫栄市立総合病院前駅",
      reading: "えぬえいしりつそうごうびょういんまえ",
      summary: "病院最寄りの市内駅です。駅前から病院正面玄関までは徒歩2分と案内されています。",
      note: "江縫栄駅とは別の駅です。表示される番線・出口・到着時刻に相違がある場合は駅員へお知らせください。",
      x: 36.0,
      y: 69.2,
      color: "#c45862",
      links: [
        { label: "交通情報", href: "access" },
        { label: "江縫栄駅", href: "station" }
      ]
    },
    {
      id: "enuei-station",
      code: "NA-STA-01",
      category: "BOUNDARY STATION",
      title: "江縫栄駅",
      reading: "えぬえいえき",
      summary: "到着地、終着点、入口、境界の合間。多くの怪奇現象が流れ着く、市外と市内の境界駅です。",
      note: "駅を出て踏切を渡らなければ、まだ大丈夫です。駅員を装ったものに注意してください。",
      x: 54.2,
      y: 28.7,
      color: "#273c63",
      links: [
        { label: "帰還列車運行案内", href: "station" },
        { label: "Access", href: "access" }
      ]
    },
    {
      id: "shireiji",
      code: "NA-TMP-01",
      category: "TEMPLE / DISTRICT",
      title: "司零寺",
      reading: "しれいじ",
      summary: "大きなアカシアの樹を目印とする寺院です。住所としては北司零寺と南司零寺があります。",
      note: "当地域では輪廻転生の概念が通用しないため、宗教的な意味はほとんど持ちません。",
      x: 15.6,
      y: 82.5,
      color: "#2e786b",
      links: [
        { label: "記録保管庫", href: "archive" },
        { label: "文章記録", href: "textarchive" }
      ]
    },
    {
      id: "library",
      code: "NA-LIB-01",
      category: "PUBLIC ARCHIVE",
      title: "朱紗大型図書館",
      reading: "あかしゃおおがたとしょかん",
      summary: "保管庫の多い朱紗通りに位置する大型図書館です。公開記録の閲覧窓口として案内されています。",
      note: "閲覧できる記録と、記録されているものが同一であるとは限りません。",
      x: 51.5,
      y: 54.0,
      color: "#4b6971",
      links: [
        { label: "図書館", href: "library" },
        { label: "記録保管庫", href: "archive" },
        { label: "文章記録", href: "textarchive" }
      ]
    },
    {
      id: "university",
      code: "NA-EDU-01",
      category: "EDUCATIONAL FACILITY",
      title: "江縫栄私立大学",
      reading: "えぬえいしりつだいがく",
      summary: "朱紗通り北側に記録されている教育機関です。地図上の校地境界は一部未観測となっています。",
      note: "公開案内図では北側が欠損しています。欠損範囲への経路案内は行われません。",
      x: 52.2,
      y: 15.0,
      color: "#536879",
      links: [
        { label: "文章記録", href: "textarchive" },
        { label: "関連情報", href: "links" }
      ]
    },
    {
      id: "kanon-studio",
      code: "NA-STU-01",
      category: "RECORDING FACILITY",
      title: "果音スタジオ",
      reading: "かのんすたじお",
      summary: "朱紗通りの音声・映像制作施設です。観測画像では施設名に表記揺れが生じる場合があります。",
      note: "公開作品の一部は、歌見本・映像記録から確認できます。",
      x: 52.7,
      y: 39.0,
      color: "#6a687d",
      links: [
        { label: "歌見本", href: "utamihon" },
        { label: "映像記録", href: "videoarchive" }
      ]
    },
    {
      id: "katasu",
      code: "NA-DST-03",
      category: "CITY DISTRICT",
      title: "潟巣",
      reading: "かたす",
      summary: "朱紗通りの南側にある街区です。中高一貫校、女子学園、霊園などが記録されています。",
      note: "潟巣駅に8番出口はありません。案内表示に8番出口がある場合、その案内には従わないでください。",
      x: 55.1,
      y: 76.0,
      color: "#48685f",
      links: [
        { label: "記録保管庫", href: "archive" },
        { label: "文章記録", href: "textarchive" }
      ]
    },
    {
      id: "workshop-quarter",
      code: "NA-DST-04",
      category: "WORKSHOP QUARTER",
      title: "工房街",
      reading: "こうぼうがい",
      summary: "小規模な町工房が密集する街区です。硝子・鉱石、染織・服飾、製本・修復などの工房群が細街路に沿って並びます。",
      note: "工房ごとに営業時間と入口が異なります。同じ看板が複数見える場合は、最初に見つけた入口へ戻ってください。",
      x: 82.8,
      y: 48.0,
      color: "#8a673d",
      links: [
        { label: "画像記録", href: "imagearchive" },
        { label: "関連情報", href: "links" }
      ]
    },
    {
      id: "da-at25",
      code: "NA-SHP-25",
      category: "CONVENIENCE STORE",
      title: "Da' At25",
      reading: "コンビニエンスストア",
      summary: "潟巣側の生活区に登録されているコンビニエンスストアです。店舗名の正式表記は「Da' At25」です。",
      note: "営業時間・取扱商品・店舗数は現在の公開案内に登録されていません。",
      x: 63.3,
      y: 92.2,
      color: "#39758f",
      links: [
        { label: "関連情報", href: "links" }
      ]
    }
  ];

  function init() {
    const viewport = document.getElementById("map-viewport");
    const canvas = document.getElementById("map-canvas");
    const pinsLayer = document.getElementById("map-pins");
    const placeList = document.getElementById("map-place-list");
    const scaleStatus = document.getElementById("map-scale-status");
    const zoomInButton = document.getElementById("map-zoom-in");
    const zoomOutButton = document.getElementById("map-zoom-out");
    const resetButton = document.getElementById("map-reset");
    if (!viewport || !canvas || !pinsLayer || !placeList) return;

    const state = {
      fitScale: 1,
      scale: 1,
      x: 0,
      y: 0,
      pointers: new Map(),
      pinch: null,
      selectedPlaceId: null
    };

    const pinButtons = new Map();
    const listButtons = new Map();

    function viewportSize() {
      return { width: viewport.clientWidth, height: viewport.clientHeight };
    }

    function clampTransform() {
      const bounds = viewportSize();
      const scaledWidth = MAP_WIDTH * state.scale;
      const scaledHeight = MAP_HEIGHT * state.scale;

      if (scaledWidth <= bounds.width) {
        state.x = (bounds.width - scaledWidth) / 2;
      } else {
        state.x = Math.min(0, Math.max(bounds.width - scaledWidth, state.x));
      }

      if (scaledHeight <= bounds.height) {
        state.y = (bounds.height - scaledHeight) / 2;
      } else {
        state.y = Math.min(0, Math.max(bounds.height - scaledHeight, state.y));
      }
    }

    function renderTransform() {
      clampTransform();
      canvas.style.transform = `translate(${state.x}px, ${state.y}px) scale(${state.scale})`;
      canvas.style.setProperty("--pin-scale", String(1 / state.scale));
      scaleStatus.textContent = `${Math.round((state.scale / state.fitScale) * 100)}%`;
    }

    function resetView() {
      const bounds = viewportSize();
      const padding = bounds.width < 560 ? 18 : 32;
      state.fitScale = Math.min(
        (bounds.width - padding * 2) / MAP_WIDTH,
        (bounds.height - padding * 2) / MAP_HEIGHT
      );
      state.scale = state.fitScale;
      state.x = (bounds.width - MAP_WIDTH * state.scale) / 2;
      state.y = (bounds.height - MAP_HEIGHT * state.scale) / 2;
      renderTransform();
    }

    function zoomAt(nextScale, clientX, clientY) {
      const rect = viewport.getBoundingClientRect();
      const localX = clientX - rect.left;
      const localY = clientY - rect.top;
      const worldX = (localX - state.x) / state.scale;
      const worldY = (localY - state.y) / state.scale;
      const minScale = state.fitScale;
      const maxScale = state.fitScale * MAX_ZOOM;

      state.scale = Math.min(maxScale, Math.max(minScale, nextScale));
      state.x = localX - worldX * state.scale;
      state.y = localY - worldY * state.scale;
      renderTransform();
    }

    function zoomFromCenter(factor) {
      const rect = viewport.getBoundingClientRect();
      zoomAt(state.scale * factor, rect.left + rect.width / 2, rect.top + rect.height / 2);
    }

    function renderLinks(links) {
      const container = document.getElementById("place-links");
      container.replaceChildren();
      links.forEach((link) => {
        const anchor = document.createElement("a");
        anchor.href = link.href;
        anchor.textContent = `${link.label} →`;
        container.append(anchor);
      });
    }

    function selectPlace(placeId, options) {
      const place = PLACES.find((item) => item.id === placeId);
      if (!place) return;
      state.selectedPlaceId = placeId;

      document.getElementById("place-code").textContent = place.code;
      document.getElementById("place-category").textContent = place.category;
      document.getElementById("place-reading").textContent = place.reading;
      document.getElementById("place-title").textContent = place.title;
      document.getElementById("place-summary").textContent = place.summary;
      document.getElementById("place-note").textContent = place.note;
      renderLinks(place.links);

      pinButtons.forEach((button, id) => {
        const active = id === placeId;
        button.classList.toggle("is-active", active);
        button.setAttribute("aria-pressed", String(active));
      });
      listButtons.forEach((button, id) => button.classList.toggle("is-active", id === placeId));

      if (options && options.center) {
        const rect = viewport.getBoundingClientRect();
        const targetScale = Math.max(state.scale, state.fitScale * 1.55);
        state.scale = Math.min(state.fitScale * MAX_ZOOM, targetScale);
        state.x = rect.width / 2 - (place.x / 100) * MAP_WIDTH * state.scale;
        state.y = rect.height / 2 - (place.y / 100) * MAP_HEIGHT * state.scale;
        renderTransform();
      }
    }

    PLACES.forEach((place) => {
      const pin = document.createElement("button");
      pin.type = "button";
      pin.className = "city-map-pin";
      pin.textContent = place.code.replace("NA-", "").split("-")[0];
      pin.style.left = `${place.x}%`;
      pin.style.top = `${place.y}%`;
      pin.style.setProperty("--pin-color", place.color);
      pin.setAttribute("aria-label", `${place.title}の情報を表示`);
      pin.setAttribute("aria-pressed", "false");
      pin.addEventListener("click", (event) => {
        event.stopPropagation();
        selectPlace(place.id);
      });
      pinsLayer.append(pin);
      pinButtons.set(place.id, pin);

      const listButton = document.createElement("button");
      listButton.type = "button";
      const code = document.createElement("span");
      const title = document.createElement("span");
      code.textContent = place.code.replace("NA-", "");
      title.textContent = place.title;
      listButton.append(code, title);
      listButton.addEventListener("click", () => selectPlace(place.id, { center: true }));
      placeList.append(listButton);
      listButtons.set(place.id, listButton);
    });

    viewport.addEventListener("wheel", (event) => {
      event.preventDefault();
      const factor = event.deltaY < 0 ? 1.14 : 1 / 1.14;
      zoomAt(state.scale * factor, event.clientX, event.clientY);
    }, { passive: false });

    viewport.addEventListener("dblclick", (event) => {
      event.preventDefault();
      zoomAt(state.scale * 1.45, event.clientX, event.clientY);
    });

    function startPinch() {
      if (state.pointers.size !== 2) return;
      const points = Array.from(state.pointers.values());
      const rect = viewport.getBoundingClientRect();
      const midpoint = {
        x: (points[0].x + points[1].x) / 2 - rect.left,
        y: (points[0].y + points[1].y) / 2 - rect.top
      };
      state.pinch = {
        distance: Math.hypot(points[1].x - points[0].x, points[1].y - points[0].y),
        scale: state.scale,
        worldX: (midpoint.x - state.x) / state.scale,
        worldY: (midpoint.y - state.y) / state.scale
      };
    }

    viewport.addEventListener("pointerdown", (event) => {
      if (event.target.closest("button, a")) return;
      viewport.setPointerCapture(event.pointerId);
      state.pointers.set(event.pointerId, { x: event.clientX, y: event.clientY });
      if (state.pointers.size === 2) startPinch();
    });

    viewport.addEventListener("pointermove", (event) => {
      const previous = state.pointers.get(event.pointerId);
      if (!previous) return;
      state.pointers.set(event.pointerId, { x: event.clientX, y: event.clientY });

      if (state.pointers.size === 1) {
        state.x += event.clientX - previous.x;
        state.y += event.clientY - previous.y;
        renderTransform();
        return;
      }

      if (state.pointers.size === 2 && state.pinch) {
        const points = Array.from(state.pointers.values());
        const rect = viewport.getBoundingClientRect();
        const distance = Math.hypot(points[1].x - points[0].x, points[1].y - points[0].y);
        const midpoint = {
          x: (points[0].x + points[1].x) / 2 - rect.left,
          y: (points[0].y + points[1].y) / 2 - rect.top
        };
        state.scale = Math.min(
          state.fitScale * MAX_ZOOM,
          Math.max(state.fitScale, state.pinch.scale * (distance / state.pinch.distance))
        );
        state.x = midpoint.x - state.pinch.worldX * state.scale;
        state.y = midpoint.y - state.pinch.worldY * state.scale;
        renderTransform();
      }
    });

    function finishPointer(event) {
      state.pointers.delete(event.pointerId);
      state.pinch = null;
      if (state.pointers.size === 2) startPinch();
    }

    viewport.addEventListener("pointerup", finishPointer);
    viewport.addEventListener("pointercancel", finishPointer);

    viewport.addEventListener("keydown", (event) => {
      const movement = 42;
      if (event.key === "+" || event.key === "=") {
        event.preventDefault();
        zoomFromCenter(1.2);
      } else if (event.key === "-" || event.key === "_") {
        event.preventDefault();
        zoomFromCenter(1 / 1.2);
      } else if (event.key === "0") {
        event.preventDefault();
        resetView();
      } else if (["ArrowUp", "ArrowDown", "ArrowLeft", "ArrowRight"].includes(event.key)) {
        event.preventDefault();
        if (event.key === "ArrowUp") state.y += movement;
        if (event.key === "ArrowDown") state.y -= movement;
        if (event.key === "ArrowLeft") state.x += movement;
        if (event.key === "ArrowRight") state.x -= movement;
        renderTransform();
      }
    });

    zoomInButton.addEventListener("click", () => zoomFromCenter(1.25));
    zoomOutButton.addEventListener("click", () => zoomFromCenter(1 / 1.25));
    resetButton.addEventListener("click", resetView);

    let resizeFrame = 0;
    window.addEventListener("resize", () => {
      window.cancelAnimationFrame(resizeFrame);
      resizeFrame = window.requestAnimationFrame(resetView);
    });

    resetView();
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", init, { once: true });
  } else {
    init();
  }
})();
