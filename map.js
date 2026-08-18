// map.js — MapLibre GL dashboard for geographic script distribution
(function () {
  let map;
  let markerEls = [];
  let activeFilter = null; // scriptId or null for all

  function scriptById(data, id) {
    return data.scripts.find((s) => s.id === id);
  }

  function buildFilters(data) {
    const container = document.getElementById('map-filters');
    container.innerHTML = '';

    const allBtn = document.createElement('button');
    allBtn.type = 'button';
    allBtn.className = 'map-filter-btn';
    allBtn.setAttribute('aria-pressed', 'true');
    allBtn.style.setProperty('--filter-color', 'var(--color-primary)');
    allBtn.innerHTML = `<span class="map-filter-btn__swatch"></span><span class="map-filter-btn__name">All scripts</span><span class="map-filter-btn__count">${data.mapMarkers.length}</span>`;
    allBtn.addEventListener('click', () => setFilter(null));
    container.appendChild(allBtn);

    data.scripts.forEach((s) => {
      const count = data.mapMarkers.filter((m) => m.script === s.id).length;
      if (count === 0) return;
      const btn = document.createElement('button');
      btn.type = 'button';
      btn.className = 'map-filter-btn';
      btn.dataset.scriptId = s.id;
      btn.setAttribute('aria-pressed', 'false');
      btn.style.setProperty('--filter-color', s.color);
      btn.innerHTML = `<span class="map-filter-btn__swatch"></span><span class="map-filter-btn__name">${s.name}</span><span class="map-filter-btn__count">${count}</span>`;
      btn.addEventListener('click', () => setFilter(s.id));
      container.appendChild(btn);
    });

    function setFilter(id) {
      activeFilter = id;
      container.querySelectorAll('.map-filter-btn').forEach((b) => {
        b.setAttribute('aria-pressed', String(b.dataset.scriptId === id || (!id && !b.dataset.scriptId)));
      });
      updateMarkerVisibility();
    }
  }

  function updateMarkerVisibility() {
    markerEls.forEach(({ marker, script }) => {
      const show = !activeFilter || script === activeFilter;
      marker.getElement().style.display = show ? '' : 'none';
    });
  }

  function buildCensusBars(data) {
    const container = document.getElementById('census-bars');
    container.innerHTML = '';
    const max = Math.max(...data.censusData.byState.map((s) => s.speakers));
    data.censusData.byState.forEach((s) => {
      const row = document.createElement('div');
      row.className = 'census-bar-row';
      const pct = (s.speakers / max) * 100;
      row.innerHTML = `
        <div class="census-bar-row__top">
          <span>${s.state}</span>
          <strong>${s.speakers.toLocaleString('en-IN')}</strong>
        </div>
        <div class="census-bar-track">
          <div class="census-bar-fill" style="width:${pct}%"></div>
        </div>
      `;
      container.appendChild(row);
    });
  }

  function makeMarkerEl(color) {
    const wrap = document.createElement('div');
    wrap.style.width = '22px';
    wrap.style.height = '22px';
    wrap.style.borderRadius = '50%';
    wrap.style.background = color;
    wrap.style.border = '3px solid var(--color-surface-2, #fff)';
    wrap.style.boxShadow = '0 2px 8px rgba(0,0,0,0.35)';
    wrap.style.cursor = 'pointer';
    return wrap;
  }

  function showPopupPanel(marker, script) {
    const panel = document.getElementById('map-popup-panel');
    panel.hidden = false;
    panel.style.setProperty('--popup-color', script.color);
    panel.innerHTML = `
      <button class="map-popup-panel__close" aria-label="Close">
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><path d="M18 6 6 18M6 6l12 12"/></svg>
      </button>
      <p class="map-popup-panel__eyebrow">${script.name} script &middot; ${marker.state}</p>
      <h3 class="map-popup-panel__title">${marker.name}</h3>
      <p class="map-popup-panel__detail">${marker.detail}</p>
    `;
    panel.querySelector('.map-popup-panel__close').addEventListener('click', () => {
      panel.hidden = true;
    });
  }

  function initMapLibre(data) {
    map = new maplibregl.Map({
      container: 'konkani-map',
      style: 'https://tiles.openfreemap.org/styles/positron',
      center: [75.2, 13.5],
      zoom: 5.6,
      attributionControl: true,
    });
    map.addControl(new maplibregl.NavigationControl({ showCompass: false }), 'top-right');
    map.scrollZoom.disable();
    map.on('wheel', (e) => {
      if (e.originalEvent.ctrlKey || e.originalEvent.metaKey) return;
    });

    map.on('load', () => {
      data.mapMarkers.forEach((m) => {
        const script = scriptById(data, m.script);
        if (!script) return;
        const el = makeMarkerEl(script.color);
        const marker = new maplibregl.Marker({ element: el })
          .setLngLat([m.lng, m.lat])
          .addTo(map);
        el.addEventListener('click', () => showPopupPanel(m, script));
        markerEls.push({ marker, script: m.script, el });
      });
    });

    window.__konkaniMap = {
      __applyThemeColors: function () {
        // MapLibre positron style already reads well in both themes; no-op hook reserved for future theming.
      },
    };
  }

  window.initMap = function (data) {
    buildFilters(data);
    buildCensusBars(data);
    initMapLibre(data);
  };
})();
