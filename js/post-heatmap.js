
(function () {
  'use strict';

  const WEEKS = 16;
  const rootId = 'pz-post-heatmap';

  function node(tag, className, text) {
    const element = document.createElement(tag);
    if (className) element.className = className;
    if (text !== undefined) element.textContent = text;
    return element;
  }

  function dateKey(date) {
    const y = date.getFullYear();
    const m = String(date.getMonth() + 1).padStart(2, '0');
    const d = String(date.getDate()).padStart(2, '0');
    return `${y}-${m}-${d}`;
  }

  function render(root, counts) {
    root.textContent = '';

    const header = node('div', 'pz-hm-header');
    const title = node('div', 'pz-hm-title', '文章发布热力图');
    const period = node('span', 'pz-hm-period', '最近 16 周');
    header.append(title, period);

    const grid = node('div', 'pz-hm-grid');

    const today = new Date();
    today.setHours(12, 0, 0, 0);

    const start = new Date(today);
    const mondayOffset = (start.getDay() + 6) % 7;
    start.setDate(
      start.getDate() - mondayOffset - (WEEKS - 1) * 7
    );

    let total = 0;

    for (let i = 0; i < WEEKS * 7; i++) {
      const date = new Date(start);
      date.setDate(start.getDate() + i);

      const future = date.getTime() > today.getTime();
      const key = dateKey(date);

      const count = future
        ? 0
        : Math.max(0, Math.floor(Number(counts[key]) || 0));

      const level = count === 0 ? 0 : Math.min(count, 4);

      const cell = node(
        'span',
        `pz-hm-cell pz-hm-level-${level}`
      );

      if (future) {
        cell.classList.add('pz-hm-future');
      } else {
        cell.title = `${key}：发布 ${count} 篇文章`;
        total += count;
      }

      cell.setAttribute('aria-hidden', 'true');
      grid.appendChild(cell);
    }

    grid.setAttribute('role', 'img');
    grid.setAttribute(
      'aria-label',
      `最近16个自然周的文章发布热力图，共发布${total}篇文章`
    );

    const footer = node('div', 'pz-hm-footer');
    const stats = node(
      'span',
      'pz-hm-stats',
      `这 16 周共发布 ${total} 篇`
    );

    const archive = node(
      'a',
      'pz-hm-archive',
      '查看归档 →'
    );
    archive.href = '/archives/';
    footer.append(stats, archive);

    const legend = node('div', 'pz-hm-legend');
    legend.appendChild(node('span', '', '少'));

    for (let level = 0; level <= 4; level++) {
      legend.appendChild(
        node('span', `pz-hm-legend-cell pz-hm-level-${level}`)
      );
    }

    legend.appendChild(node('span', '', '多'));

    root.append(header, grid, footer, legend);
  }

  async function init() {
    const root = document.getElementById(rootId);

    if (!root || root.dataset.initialized === '1') {
      return;
    }

    root.dataset.initialized = '1';

    const url =
      root.dataset.source || '/heatmap/posts.json';

    try {
      const response = await fetch(url, {
        cache: 'no-cache'
      });

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}`);
      }

      const data = await response.json();
      render(root, data && data.counts ? data.counts : {});
    } catch (error) {
      root.textContent =
        '文章热力图加载失败，请检查数据文件路径。';
      console.error('[post-heatmap]', error);
    }
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }

  // Butterfly PJAX 页面切换后重新初始化
  document.addEventListener('pjax:complete', init);
})();
