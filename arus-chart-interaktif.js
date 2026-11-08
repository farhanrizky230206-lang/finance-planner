/*
  Arus Finance — Grafik Arus Uang Mingguan Interaktif (v2)
  Pasang sebelum </body> di halaman DASHBOARD (misalnya app.html):
  <script src="./arus-chart-interaktif.js" defer></script>

  Menggunakan angka asli yang sudah ditulis oleh kode grafik ke atribut
  title, data-value, data-amount, atau aria-label pada batang .bar.in/.bar.out.
  Tidak mengambil data Supabase secara terpisah dan tidak menyimpan data baru.
*/
(() => {
  'use strict';
  if (window.__arusWeeklyChartInteractiveV2) return;
  window.__arusWeeklyChartInteractiveV2 = true;

  const CSS = `
    .chart-area > .chart-col {
      cursor: pointer; position: relative; border-radius: 12px 12px 0 0;
      -webkit-tap-highlight-color: transparent; transition: background .15s ease;
    }
    .chart-area > .chart-col:hover,
    .chart-area > .chart-col.arus-week-selected { background: rgba(42,139,101,.07); }
    .chart-area > .chart-col:focus-visible { outline: 2px solid #268766; outline-offset: -2px; }
    .chart-area > .chart-col .bar { transition: filter .15s ease, box-shadow .15s ease; }
    .chart-area > .chart-col:hover .bar,
    .chart-area > .chart-col.arus-week-selected .bar { filter: saturate(1.22); }
    .arus-week-tooltip {
      position: fixed; left: 0; top: 0; z-index: 2147483000;
      width: max-content; min-width: 225px; max-width: min(320px, calc(100vw - 24px));
      padding: 14px 15px; box-sizing: border-box; pointer-events: none;
      border: 1px solid rgba(255,255,255,.14); border-radius: 16px;
      color: #f6fff9; background: #173e33;
      box-shadow: 0 14px 40px rgba(10,46,34,.28);
      font: 13px/1.5 'DM Sans', system-ui, sans-serif;
      opacity: 0; visibility: hidden; transform: translateY(4px);
      transition: opacity .13s ease, transform .13s ease, visibility .13s ease;
    }
    .arus-week-tooltip.is-visible { opacity: 1; visibility: visible; transform: translateY(0); }
    .arus-week-title { font-size: 13px; font-weight: 750; padding-bottom: 10px; border-bottom: 1px solid rgba(255,255,255,.17); }
    .arus-week-row { display: flex; justify-content: space-between; align-items: center; gap: 16px; margin-top: 10px; }
    .arus-week-row span { color: #dcefe4; }
    .arus-week-row strong { white-space: nowrap; font-variant-numeric: tabular-nums; font-weight: 750; }
    .arus-week-dot { display: inline-block; width: 9px; height: 9px; border-radius: 3px; margin-right: 7px; }
    .arus-week-dot.in { background: #b8e7a2; }
    .arus-week-dot.out { background: #6db09a; }
    .arus-week-row.arus-week-total { padding-top: 10px; border-top: 1px solid rgba(255,255,255,.17); font-weight: 700; }
    .arus-week-hint { color: #718478; font-size: 11px; text-align: center; padding-top: 9px; }
    .arus-week-unavailable { color: #f1cf9c; font-size: 11px; margin-top: 8px; }
    @media (prefers-reduced-motion: reduce) {
      .arus-week-tooltip, .chart-area > .chart-col, .chart-area > .chart-col .bar { transition: none; }
    }
  `;

  const style = document.createElement('style');
  style.textContent = CSS;
  document.head.appendChild(style);

  const tooltip = document.createElement('div');
  tooltip.className = 'arus-week-tooltip';
  tooltip.setAttribute('role', 'status');
  tooltip.setAttribute('aria-live', 'polite');
  tooltip.setAttribute('aria-atomic', 'true');
  document.body.appendChild(tooltip);

  const format = new Intl.NumberFormat('id-ID', { maximumFractionDigits: 0 });
  const rupiah = amount => amount == null ? 'Tidak tersedia' : `${amount < 0 ? '−' : ''}Rp${format.format(Math.abs(amount))}`;
  let selected = null;
  let pinned = false;

  // Prioritaskan angka rupiah; jika tak ada, baca angka terakhir pada title.
  function parseAmount(input) {
    if (input === null || input === undefined || String(input).trim() === '') return null;
    if (typeof input === 'number') return Number.isFinite(input) ? input : null;
    const s = String(input).trim();
    const rp = [...s.matchAll(/Rp\s*(-?[\d.,]+)/gi)];
    const match = rp.length ? rp[rp.length - 1][1] : (s.match(/-?\d[\d.,]*/g) || []).at(-1);
    if (!match) return null;
    const normalized = match.replace(/\./g, '').replace(/,/g, '.');
    const number = Number(normalized);
    return Number.isFinite(number) ? number : null;
  }

  function amountFrom(bar, col, kind) {
    const candidates = [
      bar?.getAttribute('data-amount'), bar?.getAttribute('data-value'),
      bar?.getAttribute('title'), bar?.getAttribute('aria-label'),
      col?.getAttribute(`data-${kind}`), col?.getAttribute(`data-${kind === 'income' ? 'in' : 'out'}`),
      bar?.textContent?.trim()
    ];
    for (const candidate of candidates) {
      const n = parseAmount(candidate);
      if (n !== null) return n;
    }
    return null;
  }

  function readWeek(col) {
    const chart = col.closest('.chart-area');
    if (!chart) return null;
    const cols = [...chart.querySelectorAll(':scope > .chart-col')];
    const i = cols.indexOf(col);
    if (i < 0) return null;
    const labels = chart.nextElementSibling?.classList.contains('chart-x')
      ? [...chart.nextElementSibling.querySelectorAll('span')] : [];
    const label = labels[i]?.textContent?.trim() || `Minggu ${i + 1}`;
    const income = amountFrom(col.querySelector('.bar.in'), col, 'income');
    const expense = amountFrom(col.querySelector('.bar.out'), col, 'expense');
    const difference = income !== null && expense !== null ? income - expense : null;
    return { label, income, expense, difference };
  }

  function render(info) {
    // Semua teks dinamis memakai textContent untuk mencegah HTML injection.
    tooltip.replaceChildren();
    const title = document.createElement('div');
    title.className = 'arus-week-title';
    title.textContent = `📊 ${/^minggu/i.test(info.label) ? info.label : `Tanggal ${info.label}`}`;
    tooltip.appendChild(title);

    const addRow = (label, amount, type, total = false) => {
      const row = document.createElement('div');
      row.className = `arus-week-row${total ? ' arus-week-total' : ''}`;
      const name = document.createElement('span');
      if (type) {
        const dot = document.createElement('i');
        dot.className = `arus-week-dot ${type}`;
        name.appendChild(dot);
      }
      name.append(label);
      const number = document.createElement('strong');
      number.textContent = rupiah(amount);
      row.append(name, number);
      tooltip.appendChild(row);
    };

    addRow('Masuk', info.income, 'in');
    addRow('Keluar', info.expense, 'out');
    addRow(info.difference === null ? 'Selisih' : info.difference < 0 ? 'Defisit' : 'Selisih', info.difference, null, true);

    if (info.income === null || info.expense === null) {
      const note = document.createElement('div');
      note.className = 'arus-week-unavailable';
      note.textContent = 'Nominal belum tersedia pada elemen grafik. Tambahkan data-value/title pada batang grafik.';
      tooltip.appendChild(note);
    }
  }

  function place(col, event) {
    const rect = col.getBoundingClientRect();
    const x0 = Number.isFinite(event?.clientX) ? event.clientX : rect.left + rect.width / 2;
    const y0 = Number.isFinite(event?.clientY) ? event.clientY : rect.top + rect.height / 2;
    const width = tooltip.offsetWidth || 235;
    const height = tooltip.offsetHeight || 160;
    const margin = 12;
    let x = x0 + 16;
    let y = y0 - height - 15;
    if (x + width > window.innerWidth - margin) x = x0 - width - 16;
    if (x < margin) x = Math.max(margin, (window.innerWidth - width) / 2);
    if (y < margin) y = y0 + 18;
    if (y + height > window.innerHeight - margin) y = Math.max(margin, window.innerHeight - height - margin);
    tooltip.style.left = `${Math.round(x)}px`;
    tooltip.style.top = `${Math.round(y)}px`;
  }

  function show(col, event, pin = false) {
    const info = readWeek(col);
    if (!info) return;
    if (selected && selected !== col) selected.classList.remove('arus-week-selected');
    selected = col;
    pinned = pin;
    col.classList.add('arus-week-selected');
    render(info);
    tooltip.classList.add('is-visible');
    place(col, event);
  }

  function hide() {
    if (selected) selected.classList.remove('arus-week-selected');
    selected = null;
    pinned = false;
    tooltip.classList.remove('is-visible');
  }

  function findCol(node) {
    return node instanceof Element ? node.closest('.chart-area > .chart-col') : null;
  }

  function decorate() {
    for (const chart of document.querySelectorAll('.chart-area')) {
      chart.setAttribute('role', 'group');
      chart.setAttribute('aria-label', 'Grafik mingguan. Arahkan mouse atau pilih minggu untuk melihat rincian.');
      for (const col of chart.querySelectorAll(':scope > .chart-col')) {
        col.tabIndex = 0;
        col.setAttribute('role', 'button');
        const week = readWeek(col);
        if (week) col.setAttribute('aria-label', `${week.label}, masuk ${rupiah(week.income)}, keluar ${rupiah(week.expense)}.`);
      }
      const x = chart.nextElementSibling;
      if (x?.classList.contains('chart-x') && !x.nextElementSibling?.classList.contains('arus-week-hint')) {
        const hint = document.createElement('div');
        hint.className = 'arus-week-hint';
        hint.textContent = 'Arahkan mouse atau ketuk minggu untuk melihat nominal';
        x.insertAdjacentElement('afterend', hint);
      }
    }
  }

  document.addEventListener('pointerover', event => {
    if (event.pointerType === 'touch') return;
    const col = findCol(event.target);
    if (col && !pinned) show(col, event);
  });
  document.addEventListener('pointermove', event => {
    if (event.pointerType === 'touch') return;
    if (selected && !pinned && selected.contains(event.target)) place(selected, event);
  }, { passive: true });
  document.addEventListener('pointerout', event => {
    if (pinned) return;
    const col = findCol(event.target);
    if (col && selected === col && !col.contains(event.relatedTarget)) hide();
  });
  document.addEventListener('click', event => {
    const col = findCol(event.target);
    if (!col) { if (pinned) hide(); return; }
    if (pinned && selected === col) hide();
    else show(col, event, true);
  });
  document.addEventListener('focusin', event => {
    const col = findCol(event.target);
    if (col && !pinned) show(col, null);
  });
  document.addEventListener('focusout', event => {
    const col = findCol(event.target);
    if (col && !pinned && !col.contains(event.relatedTarget)) hide();
  });
  document.addEventListener('keydown', event => {
    if (event.key === 'Escape') hide();
    if ((event.key === 'Enter' || event.key === ' ') && findCol(event.target)) {
      event.preventDefault();
      const col = findCol(event.target);
      if (pinned && selected === col) hide(); else show(col, null, true);
    }
  });

  // Jika dashboard merender ulang grafik setelah login/perubahan transaksi.
  const observer = new MutationObserver(mutations => {
    if (mutations.some(m => [...m.addedNodes].some(n =>
      n instanceof Element && (n.matches?.('.chart-area,.chart-col,.chart-x') || n.querySelector?.('.chart-area,.chart-col,.chart-x'))
    ))) {
      hide();
      decorate();
    }
  });
  observer.observe(document.body, { childList: true, subtree: true });
  decorate();
})();
