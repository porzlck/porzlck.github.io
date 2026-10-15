
(function () {
  function initTagSearch() {
    // 只在标签总览页运行
    const page = document.querySelector('#page');
    if (!page) return;

    const cloud = page.querySelector('.tag-cloud-list');
    if (!cloud) return;

    // 防止重复创建搜索框
    if (page.querySelector('#pz-tag-search')) return;

    const tags = Array.from(
      cloud.querySelectorAll('a[href]')
    );

    if (tags.length === 0) return;

    // 创建搜索区域
    const panel = document.createElement('div');
    panel.id = 'pz-tag-search';
    panel.innerHTML = `
      <div class="pz-tag-search-box">
        <i class="fas fa-search"></i>
        <input
          type="search"
          class="pz-tag-input"
          placeholder="搜索标签，如 DP、线段树..."
          aria-label="搜索标签"
          autocomplete="off"
        >
        <button
          type="button"
          class="pz-tag-clear"
          aria-label="清空搜索"
          hidden
        >×</button>
      </div>
      <div class="pz-tag-count" aria-live="polite"></div>
    `;

    // 放到标签云上方
    cloud.before(panel);

    const empty = document.createElement('div');
    empty.className = 'pz-tag-empty';
    empty.textContent = '没有找到匹配的标签';
    empty.hidden = true;
    cloud.after(empty);

    const input = panel.querySelector('.pz-tag-input');
    const clear = panel.querySelector('.pz-tag-clear');
    const counter = panel.querySelector('.pz-tag-count');

    function filterTags() {
      const keyword = input.value
        .trim()
        .normalize('NFKC')
        .toLowerCase();

      let visibleCount = 0;

      tags.forEach(tag => {
        const name = tag.textContent
          .trim()
          .normalize('NFKC')
          .toLowerCase();

        const matched = name.includes(keyword);

        tag.classList.toggle(
          'pz-tag-hidden',
          !matched
        );

        if (matched) visibleCount++;
      });

      counter.textContent =
        `找到 ${visibleCount} / ${tags.length} 个标签`;

      clear.hidden = input.value.length === 0;
      empty.hidden = visibleCount !== 0;
    }

    // 输入时实时筛选
    input.addEventListener('input', filterTags);

    // 清空按钮
    clear.addEventListener('click', () => {
      input.value = '';
      filterTags();
      input.focus();
    });

    // 初始显示全部标签
    filterTags();
  }

  if (document.readyState === 'loading') {
    document.addEventListener(
      'DOMContentLoaded',
      initTagSearch
    );
  } else {
    initTagSearch();
  }

  // Butterfly PJAX 页面跳转兼容
  document.addEventListener(
    'pjax:complete',
    initTagSearch
  );
})();
