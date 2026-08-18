// cards.js — expandable detail cards for each script
(function () {
  function communityListHTML(communities) {
    return communities
      .map((c) => `<li><strong>${c.name}</strong><span>${c.note}</span></li>`)
      .join('');
  }

  function catalystListHTML(catalysts) {
    return catalysts
      .map((c) => `<li><strong>${c.label}</strong><span>${c.text}</span></li>`)
      .join('');
  }

  function sourcesHTML(sources) {
    return sources
      .map((s) => `<a href="${s.url}" target="_blank" rel="noopener">${s.label}</a>`)
      .join('');
  }

  function regionsHTML(regions) {
    return regions
      .map(
        (r) =>
          `<li><strong>${r.state}</strong><span>${r.places.join(', ')} — ${r.note}</span></li>`
      )
      .join('');
  }

  function cardHTML(script) {
    return `
      <button class="script-card__header" aria-expanded="false">
        <span class="script-card__glyph">${script.name.charAt(0)}</span>
        <span class="script-card__heading">
          <span class="script-card__name">${script.name}</span>
          <span class="script-card__subtitle">${script.subtitle} &middot; peak ${script.peakLabel}</span>
        </span>
        <span class="script-card__status">${script.statusLabel}</span>
        <svg class="script-card__chevron" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="m6 9 6 6 6-6"/></svg>
      </button>
      <div class="script-card__body">
        <div class="script-card__body-inner">
          <div class="script-card__content">
            <p class="script-card__summary">${script.summary}</p>
            <div class="script-card__block">
              <h4>Primary communities</h4>
              <ul>${communityListHTML(script.communities)}</ul>
            </div>
            <div class="script-card__block">
              <h4>Historical catalysts</h4>
              <ul>${catalystListHTML(script.catalysts)}</ul>
            </div>
            <div class="script-card__block">
              <h4>Contemporary usage</h4>
              <p>${script.contemporary}</p>
            </div>
            <div class="script-card__block">
              <h4>Where it's used today</h4>
              <ul>${regionsHTML(script.regions)}</ul>
            </div>
            <div class="script-card__sources">${sourcesHTML(script.sources)}</div>
          </div>
        </div>
      </div>
    `;
  }

  window.initCards = function (data) {
    const container = document.getElementById('script-cards');
    container.innerHTML = '';

    data.scripts.forEach((script) => {
      const card = document.createElement('article');
      card.className = 'script-card';
      card.dataset.cardId = script.id;
      card.style.setProperty('--card-color', script.color);
      card.setAttribute('data-open', 'false');
      card.innerHTML = cardHTML(script);
      container.appendChild(card);

      const header = card.querySelector('.script-card__header');
      header.addEventListener('click', () => {
        const isOpen = card.getAttribute('data-open') === 'true';
        card.setAttribute('data-open', String(!isOpen));
        header.setAttribute('aria-expanded', String(!isOpen));
      });
    });
  };
})();
