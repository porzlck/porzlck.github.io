/* Replace Butterfly's native recent-post sidebar card without modifying the theme. */
(function () {
  'use strict';

  const DATA_URL = '/random-posts.json';
  const GROUP_SIZE = 5;
  let request = null;

  function getPosts() {
    if (!request) {
      request = fetch(DATA_URL, { cache: 'no-cache' })
        .then(function (response) {
          if (!response.ok) throw new Error('HTTP ' + response.status);
          return response.json();
        })
        .then(function (data) {
          if (!data || !Array.isArray(data.posts)) {
            throw new Error('随机文章 JSON 数据格式不正确');
          }
          return data.posts.filter(function (post) {
            return post && typeof post.title === 'string' &&
              typeof post.url === 'string' && post.url.length > 0;
          });
        })
        .catch(function (error) {
          request = null; // 允许下次点击时重新获取数据
          throw error;
        });
    }
    return request;
  }

  function shuffle(input) {
    const items = input.slice();
    for (let i = items.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [items[i], items[j]] = [items[j], items[i]];
    }
    return items;
  }

  function buildItem(post) {
    const item = document.createElement('div');
    item.className = 'aside-list-item' + (post.cover ? '' : ' no-cover');
    item.dataset.randomUrl = post.url;

    if (post.cover) {
      const thumbnail = document.createElement('a');
      thumbnail.className = 'thumbnail';
      thumbnail.href = post.url;
      thumbnail.title = post.title;

      const img = document.createElement('img');
      img.src = post.cover;
      img.alt = post.title;
      img.loading = 'lazy';
      img.onerror = function () {
        thumbnail.remove();
        item.classList.add('no-cover');
      };
      thumbnail.appendChild(img);
      item.appendChild(thumbnail);
    }

    const content = document.createElement('div');
    content.className = 'content';

    const link = document.createElement('a');
    link.className = 'title';
    link.href = post.url;
    link.title = post.title;
    link.textContent = post.title;
    content.appendChild(link);

    const time = document.createElement('time');
    time.dateTime = post.date || '';
    time.textContent = post.date || '';
    content.appendChild(time);
    item.appendChild(content);
    return item;
  }

  function showRandom(card, posts) {
    const list = card.querySelector('.aside-list');
    if (!list) return;

    const oldUrls = new Set(
      Array.from(list.querySelectorAll('[data-random-url]'), function (item) {
        return item.dataset.randomUrl;
      })
    );

    // 文章足够多时，下一组不与上一组重复。
    const fresh = posts.filter(function (post) { return !oldUrls.has(post.url); });
    const candidates = fresh.length >= GROUP_SIZE ? fresh : posts;
    const chosen = shuffle(candidates).slice(0, GROUP_SIZE);

    const fragment = document.createDocumentFragment();
    chosen.forEach(function (post) { fragment.appendChild(buildItem(post)); });

    if (chosen.length === 0) {
      const empty = document.createElement('div');
      empty.className = 'pz-random-empty';
      empty.textContent = '暂无可推荐的文章';
      fragment.appendChild(empty);
    }

    list.replaceChildren(fragment);
  }

  function init() {
    const card = document.querySelector('#aside-content .card-recent-post');
    if (!card || card.dataset.pzRandomInit === '1') return;

    const headline = card.querySelector('.item-headline');
    const name = headline && headline.querySelector('span');
    const list = card.querySelector('.aside-list');
    if (!headline || !name || !list) return;

    card.dataset.pzRandomInit = '1';
    const originalName = name.textContent;

    const button = document.createElement('button');
    button.type = 'button';
    button.className = 'pz-random-refresh';
    button.title = '再随机推荐 5 篇文章';
    button.setAttribute('aria-label', '再随机推荐 5 篇文章');
    button.innerHTML = '<i class="fas fa-sync-alt" aria-hidden="true"></i>';
    headline.appendChild(button);

    function refresh() {
      if (button.disabled) return;
      button.disabled = true;
      button.classList.add('pz-random-loading');

      getPosts().then(function (posts) {
        if (!card.isConnected) return;
        name.textContent = '随机文章';
        showRandom(card, posts);
      }).catch(function (error) {
        console.error('[随机文章]', error);
        // 数据文件加载失败时回退为 Butterfly 原本的最新文章。
        if (card.isConnected && !card.querySelector('[data-random-url]')) {
          name.textContent = originalName;
        }
      }).finally(function () {
        if (!card.isConnected) return;
        button.disabled = false;
        button.classList.remove('pz-random-loading');
      });
    }

    button.addEventListener('click', refresh);
    refresh();
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
  document.addEventListener('pjax:complete', init);
})();
