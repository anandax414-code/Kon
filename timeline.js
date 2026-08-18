// timeline.js — interactive SVG timeline of script lifespans + catalyst events
(function () {
  const NS = 'http://www.w3.org/2000/svg';
  const ROW_H = 56;
  const ROW_GAP = 14;
  const PADDING_TOP = 36;
  const PADDING_BOTTOM = 44;
  const LABEL_W = 150;
  const YEAR_MIN = -250;
  const YEAR_MAX = 2030;
  let PX_PER_YEAR_BASE = 0.62;
  let zoomFactor = 1;

  let activeScriptFilter = new Set(); // empty = show all
  let activeSelectionId = null; // currently selected band/catalyst for detail panel

  function el(tag, attrs, children) {
    const node = document.createElementNS(NS, tag);
    if (attrs) {
      Object.keys(attrs).forEach((k) => node.setAttribute(k, attrs[k]));
    }
    if (children) {
      children.forEach((c) => c && node.appendChild(c));
    }
    return node;
  }

  function yearToX(year) {
    return LABEL_W + (year - YEAR_MIN) * PX_PER_YEAR_BASE * zoomFactor;
  }

  function formatYear(y) {
    if (y < 0) return Math.abs(y) + ' BC';
    return String(Math.round(y));
  }

  function buildLegend(data) {
    const legend = document.getElementById('timeline-legend');
    legend.innerHTML = '';
    data.scripts.forEach((s) => {
      const btn = document.createElement('button');
      btn.type = 'button';
      btn.className = 'legend-item';
      btn.style.setProperty('--legend-color', s.color);
      btn.setAttribute('aria-pressed', 'false');
      btn.dataset.scriptId = s.id;
      btn.innerHTML = `<span class="legend-item__swatch"></span>${s.name}`;
      btn.addEventListener('click', () => toggleFilter(s.id));
      legend.appendChild(btn);
    });
  }

  function toggleFilter(id) {
    if (activeScriptFilter.has(id)) {
      activeScriptFilter.delete(id);
    } else {
      activeScriptFilter.add(id);
    }
    applyFilterVisuals();
  }

  function applyFilterVisuals() {
    const hasFilter = activeScriptFilter.size > 0;
    document.querySelectorAll('.legend-item').forEach((btn) => {
      const active = activeScriptFilter.has(btn.dataset.scriptId);
      btn.setAttribute('aria-pressed', String(active));
    });
    document.querySelectorAll('.tl-band').forEach((band) => {
      const id = band.dataset.scriptId;
      band.classList.toggle('is-dimmed', hasFilter && !activeScriptFilter.has(id));
    });
    document.querySelectorAll('.tl-catalyst').forEach((marker) => {
      const id = marker.dataset.scriptId;
      marker.classList.toggle('is-dimmed', hasFilter && !activeScriptFilter.has(id));
    });
  }

  function showDetail(html, color) {
    const panel = document.getElementById('timeline-detail');
    panel.style.setProperty('--detail-color', color || 'var(--color-terracotta)');
    panel.innerHTML = html;
  }

  function scriptDetailHTML(script) {
    return `
      <p class="timeline-detail__eyebrow">${script.subtitle}</p>
      <h3 class="timeline-detail__title">${script.name} &middot; peak ${script.peakLabel}</h3>
      <p class="timeline-detail__text">${script.summary}</p>
      <a class="timeline-detail__link" href="#scripts" data-jump-card="${script.id}">Read full history &amp; sources &rarr;</a>
    `;
  }

  function catalystDetailHTML(script, catalyst) {
    return `
      <p class="timeline-detail__eyebrow">${script.name} &middot; ${catalyst.label}</p>
      <h3 class="timeline-detail__title">Catalyst event</h3>
      <p class="timeline-detail__text">${catalyst.text}</p>
      <a class="timeline-detail__link" href="#scripts" data-jump-card="${script.id}">See ${script.name}'s full timeline &rarr;</a>
    `;
  }

  function render(data) {
    const svg = document.getElementById('timeline-svg');
    svg.innerHTML = '';

    const scripts = data.scripts;
    const totalRows = scripts.length;
    const chartHeight = PADDING_TOP + totalRows * (ROW_H + ROW_GAP) + PADDING_BOTTOM;
    const chartWidth = yearToX(YEAR_MAX) + 60;

    svg.setAttribute('width', chartWidth);
    svg.setAttribute('height', chartHeight);
    svg.setAttribute('viewBox', `0 0 ${chartWidth} ${chartHeight}`);

    // Century gridlines
    const gridGroup = el('g', { class: 'tl-grid' });
    for (let year = -200; year <= 2000; year += 200) {
      const x = yearToX(year);
      gridGroup.appendChild(
        el('line', {
          class: 'tl-axis-line',
          x1: x,
          x2: x,
          y1: PADDING_TOP - 12,
          y2: chartHeight - PADDING_BOTTOM + 8,
        })
      );
      gridGroup.appendChild(
        el('text', {
          class: 'tl-axis-text',
          x: x,
          y: chartHeight - PADDING_BOTTOM + 24,
          'text-anchor': 'middle',
        }, [document.createTextNode(formatYear(year))])
      );
    }
    // Present day marker
    const nowX = yearToX(2026);
    gridGroup.appendChild(
      el('line', {
        class: 'tl-axis-line',
        x1: nowX, x2: nowX,
        y1: PADDING_TOP - 12,
        y2: chartHeight - PADDING_BOTTOM + 8,
        'stroke-dasharray': '3,3',
        stroke: 'var(--color-terracotta)',
      })
    );
    gridGroup.appendChild(
      el('text', {
        class: 'tl-axis-text',
        x: nowX, y: PADDING_TOP - 18,
        'text-anchor': 'middle',
        fill: 'var(--color-terracotta)',
        'font-weight': '600',
      }, [document.createTextNode('Today')])
    );
    svg.appendChild(gridGroup);

    scripts.forEach((script, i) => {
      const rowY = PADDING_TOP + i * (ROW_H + ROW_GAP);
      const bandH = ROW_H;
      const baseX1 = yearToX(Math.max(script.periodStart, YEAR_MIN));
      const baseX2 = yearToX(Math.min(script.periodEnd, YEAR_MAX));
      const peakX1 = yearToX(script.peakStart);
      const peakX2 = yearToX(script.peakEnd);

      const group = el('g', {
        class: 'tl-band',
        'data-script-id': script.id,
        tabindex: '0',
        role: 'button',
        'aria-label': `${script.name}: ${script.peakLabel}`,
      });

      // base (full lifespan) bar
      group.appendChild(
        el('rect', {
          class: 'tl-band__base',
          x: baseX1,
          y: rowY + bandH * 0.28,
          width: Math.max(2, baseX2 - baseX1),
          height: bandH * 0.44,
          rx: 6,
          fill: script.color,
        })
      );
      // peak bar (brighter, thicker)
      group.appendChild(
        el('rect', {
          class: 'tl-band__peak',
          x: peakX1,
          y: rowY + bandH * 0.14,
          width: Math.max(3, peakX2 - peakX1),
          height: bandH * 0.72,
          rx: 8,
          fill: script.color,
        })
      );
      // row label (script name) — fixed to left
      group.appendChild(
        el('text', {
          class: 'tl-label',
          x: 8,
          y: rowY + bandH * 0.42,
        }, [document.createTextNode(script.name)])
      );
      group.appendChild(
        el('text', {
          class: 'tl-sublabel',
          x: 8,
          y: rowY + bandH * 0.42 + 15,
        }, [document.createTextNode(script.statusLabel)])
      );

      group.addEventListener('click', () => selectScript(script));
      group.addEventListener('keydown', (e) => {
        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault();
          selectScript(script);
        }
      });

      svg.appendChild(group);

      // Catalyst markers
      script.catalysts.forEach((cat, ci) => {
        const cx = yearToX(cat.year);
        const cy = rowY + bandH / 2;
        const marker = el('g', {
          class: 'tl-catalyst',
          'data-script-id': script.id,
          'data-catalyst-index': ci,
          tabindex: '0',
          role: 'button',
          'aria-label': `${script.name} catalyst: ${cat.label}`,
          style: `--marker-color:${script.color}`,
        });
        marker.appendChild(el('circle', { cx, cy, r: 5 }));
        marker.addEventListener('click', (e) => {
          e.stopPropagation();
          selectCatalyst(script, cat, marker);
        });
        marker.addEventListener('keydown', (e) => {
          if (e.key === 'Enter' || e.key === ' ') {
            e.preventDefault();
            selectCatalyst(script, cat, marker);
          }
        });
        svg.appendChild(marker);
      });
    });

    function selectScript(script) {
      document.querySelectorAll('.tl-band').forEach((b) => b.classList.remove('is-active'));
      const band = svg.querySelector(`.tl-band[data-script-id="${script.id}"]`);
      if (band) band.classList.add('is-active');
      showDetail(scriptDetailHTML(script), script.color);
    }

    function selectCatalyst(script, cat) {
      document.querySelectorAll('.tl-band').forEach((b) => b.classList.remove('is-active'));
      showDetail(catalystDetailHTML(script, cat), script.color);
    }
  }

  function setupZoom(data) {
    document.querySelectorAll('[data-zoom]').forEach((btn) => {
      btn.addEventListener('click', () => {
        const action = btn.dataset.zoom;
        if (action === 'in') zoomFactor = Math.min(4, zoomFactor * 1.35);
        else if (action === 'out') zoomFactor = Math.max(0.4, zoomFactor / 1.35);
        else zoomFactor = 1;
        render(data);
        applyFilterVisuals();
      });
    });
  }

  function setupCardJump() {
    document.getElementById('timeline-detail').addEventListener('click', (e) => {
      const link = e.target.closest('[data-jump-card]');
      if (!link) return;
      const id = link.dataset.jumpCard;
      const target = document.querySelector(`[data-card-id="${id}"]`);
      if (target) {
        target.setAttribute('data-open', 'true');
        setTimeout(() => target.scrollIntoView({ behavior: 'smooth', block: 'center' }), 250);
      }
    });
  }

  window.initTimeline = function (data) {
    buildLegend(data);
    render(data);
    setupZoom(data);
    setupCardJump();
  };
})();
