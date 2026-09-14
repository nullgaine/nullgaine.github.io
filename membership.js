(() => {
  const tabs = [...document.querySelectorAll('.lang-tabs [role="tab"]')];
  const panels = [...document.querySelectorAll('.lang-content[role="tabpanel"]')];
  const order = tabs.map((tab) => tab.dataset.lang);

  if (!tabs.length || !panels.length) return;

  function showLanguage(lang, moveFocus = false) {
    if (!order.includes(lang)) lang = 'ja';

    tabs.forEach((tab) => {
      const active = tab.dataset.lang === lang;
      tab.classList.toggle('active', active);
      tab.setAttribute('aria-selected', String(active));
      tab.tabIndex = active ? 0 : -1;
      if (active && moveFocus) tab.focus();
    });

    panels.forEach((panel) => {
      panel.hidden = panel.id !== `lang-${lang}`;
    });

    document.documentElement.lang = lang;
    try {
      localStorage.setItem('membershipNoticeLang', lang);
    } catch (_) {}
  }

  tabs.forEach((tab) => {
    tab.addEventListener('click', () => showLanguage(tab.dataset.lang));
  });

  document.querySelector('.lang-tabs')?.addEventListener('keydown', (event) => {
    const current = document.activeElement.closest('[data-lang]');
    if (!current) return;

    let index = order.indexOf(current.dataset.lang);
    if (event.key === 'ArrowRight') index = (index + 1) % order.length;
    else if (event.key === 'ArrowLeft') index = (index - 1 + order.length) % order.length;
    else if (event.key === 'Home') index = 0;
    else if (event.key === 'End') index = order.length - 1;
    else return;

    event.preventDefault();
    showLanguage(order[index], true);
  });

  let initial = 'ja';
  try {
    const saved = localStorage.getItem('membershipNoticeLang');
    if (order.includes(saved)) initial = saved;
  } catch (_) {}

  showLanguage(initial);
})();
