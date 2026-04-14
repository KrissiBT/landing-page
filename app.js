/* ════════════════════════════════════════════════════
   MuhCodes Workshop — XP Desktop Engine
   ════════════════════════════════════════════════════ */

'use strict';

/* ── Helpers ──────────────────────────────────────── */
const isMobile = () => window.innerWidth <= 700;

const SOCIAL_ICONS = {
  github: `<svg viewBox="0 0 24 24" fill="currentColor" xmlns="http://www.w3.org/2000/svg" style="width:34px;height:34px;color:#fff">
    <path d="M12 0C5.37 0 0 5.37 0 12c0 5.31 3.435 9.795 8.205 11.385.6.105.825-.255.825-.57 0-.285-.015-1.23-.015-2.235-3.015.555-3.795-.735-4.035-1.41-.135-.345-.72-1.41-1.23-1.695-.42-.225-1.02-.78-.015-.795.945-.015 1.62.87 1.845 1.23 1.08 1.815 2.805 1.305 3.495.99.105-.78.42-1.305.765-1.605-2.67-.3-5.46-1.335-5.46-5.925 0-1.305.465-2.385 1.23-3.225-.12-.3-.54-1.53.12-3.18 0 0 1.005-.315 3.3 1.23.96-.27 1.98-.405 3-.405s2.04.135 3 .405c2.295-1.56 3.3-1.23 3.3-1.23.66 1.65.24 2.88.12 3.18.765.84 1.23 1.905 1.23 3.225 0 4.605-2.805 5.625-5.475 5.925.435.375.81 1.095.81 2.22 0 1.605-.015 2.895-.015 3.3 0 .315.225.69.825.57A12.02 12.02 0 0 0 24 12c0-6.63-5.37-12-12-12z"/>
  </svg>`,
  instagram: `<svg viewBox="0 0 24 24" fill="currentColor" xmlns="http://www.w3.org/2000/svg" style="width:34px;height:34px;color:#fff">
    <path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zM12 0C8.741 0 8.333.014 7.053.072 2.695.272.273 2.69.073 7.052.014 8.333 0 8.741 0 12c0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98C8.333 23.986 8.741 24 12 24c3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98C15.668.014 15.259 0 12 0zm0 5.838a6.162 6.162 0 1 0 0 12.324 6.162 6.162 0 0 0 0-12.324zM12 16a4 4 0 1 1 0-8 4 4 0 0 1 0 8zm6.406-11.845a1.44 1.44 0 1 0 0 2.881 1.44 1.44 0 0 0 0-2.881z"/>
  </svg>`,
  linkedin: `<svg viewBox="0 0 24 24" fill="currentColor" xmlns="http://www.w3.org/2000/svg" style="width:34px;height:34px;color:#fff">
    <path d="M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433a2.062 2.062 0 0 1-2.063-2.065 2.064 2.064 0 1 1 2.063 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z"/>
  </svg>`,
};

/* ════════════════════════════════════════════════════
   WINDOW MANAGER
   ════════════════════════════════════════════════════ */
class WindowManager {
  constructor() {
    this.wins   = new Map();  // id → { el, state, prevRect }
    this.zTop   = 100;
    this.cascade = { x: 60, y: 50, step: 28, count: 0 };
    this.container = document.getElementById('windows-container');
    this.taskbarRow = document.getElementById('taskbar-windows');
  }

  /* ── Public API ─────────────────────────────────── */

  open(id, title, iconHTML, bodyHTML, opts = {}) {
    if (this.wins.has(id)) {
      const win = this.wins.get(id);
      if (win.state === 'minimized') { this._show(win); win.state = 'open'; }
      this.focus(id);
      return;
    }

    const w = opts.width  || (isMobile() ? null : 580);
    const h = opts.height || (isMobile() ? null : 420);
    const el = this._buildEl(id, title, iconHTML, bodyHTML);

    // Size
    if (w) el.style.width  = w + 'px';
    if (h) el.style.height = h + 'px';

    // Position
    if (isMobile()) {
      el.style.left = '0'; el.style.top = '0';
    } else {
      const pos = this._nextCascade();
      el.style.left = pos.x + 'px';
      el.style.top  = pos.y + 'px';
    }

    el.style.zIndex = ++this.zTop;
    this.container.appendChild(el);

    const record = { el, state: 'open', prevRect: null };
    this.wins.set(id, record);

    this._addTaskbarBtn(id, title, iconHTML);
    this.focus(id);
    if (!isMobile()) this._makeDraggable(el, id);
  }

  close(id) {
    const win = this.wins.get(id);
    if (!win) return;
    win.el.remove();
    document.getElementById('twbtn-' + id)?.remove();
    this.wins.delete(id);
  }

  minimize(id) {
    const win = this.wins.get(id);
    if (!win || win.state === 'minimized') return;
    this._hide(win);
    win.state = 'minimized';
    const btn = document.getElementById('twbtn-' + id);
    if (btn) btn.classList.remove('active');
  }

  toggleMaximize(id) {
    const win = this.wins.get(id);
    if (!win) return;

    if (win.state === 'maximized') {
      const r = win.prevRect;
      Object.assign(win.el.style, r);
      win.state = 'open';
      win.el.classList.remove('window-maximized');
    } else {
      win.prevRect = {
        left: win.el.style.left, top:  win.el.style.top,
        width: win.el.style.width, height: win.el.style.height,
      };
      Object.assign(win.el.style, { left:'0', top:'0', width:'100%', height:'100%' });
      win.state = 'maximized';
      win.el.classList.add('window-maximized');
    }
  }

  focus(id) {
    this.wins.forEach((win, wid) => {
      const active = wid === id;
      win.el.classList.toggle('window-active', active);
      document.getElementById('twbtn-' + wid)?.classList.toggle('active', active);
    });
    const win = this.wins.get(id);
    if (win) win.el.style.zIndex = ++this.zTop;
  }

  /* ── Internals ──────────────────────────────────── */

  _nextCascade() {
    const MAX_X = window.innerWidth  - 200;
    const MAX_Y = window.innerHeight - 200;
    const { step } = this.cascade;
    let x = 60 + (this.cascade.count * step) % (MAX_X - 60);
    let y = 50 + (this.cascade.count * step) % (MAX_Y - 50);
    this.cascade.count++;
    return { x, y };
  }

  _buildEl(id, title, iconHTML, bodyHTML) {
    const el = document.createElement('div');
    el.className = 'window window-active';
    el.id = 'win-' + id;

    el.innerHTML = `
      <div class="window-titlebar" data-id="${id}">
        <div class="window-title-left">
          <span class="window-icon">${iconHTML}</span>
          <span class="window-title-text">${title}</span>
        </div>
        <div class="window-controls">
          <button class="win-btn btn-minimize" title="Minimize">&#8722;</button>
          <button class="win-btn btn-maximize" title="Maximize">&#9633;</button>
          <button class="win-btn btn-close"    title="Close">&#10005;</button>
        </div>
      </div>
      <div class="window-menubar">
        <button class="menu-btn">File</button>
        <button class="menu-btn">Edit</button>
        <button class="menu-btn">View</button>
        <button class="menu-btn">Help</button>
      </div>
      <div class="window-content">${bodyHTML}</div>
    `;

    el.querySelector('.btn-close').onclick    = () => this.close(id);
    el.querySelector('.btn-minimize').onclick = () => this.minimize(id);
    el.querySelector('.btn-maximize').onclick = () => this.toggleMaximize(id);
    el.querySelector('.window-titlebar').addEventListener('mousedown', () => this.focus(id));
    el.addEventListener('mousedown', () => this.focus(id), true);

    return el;
  }

  _addTaskbarBtn(id, title, iconHTML) {
    const btn = document.createElement('button');
    btn.className = 'taskbar-win-btn active';
    btn.id = 'twbtn-' + id;
    btn.setAttribute('role', 'listitem');
    btn.innerHTML = `<span class="tw-icon">${iconHTML}</span><span class="tw-label">${title}</span>`;

    btn.onclick = () => {
      const win = this.wins.get(id);
      if (!win) return;
      if (win.state === 'minimized') {
        this._show(win); win.state = 'open'; this.focus(id);
      } else if (win.el.classList.contains('window-active') && this._isTopWindow(id)) {
        this.minimize(id);
      } else {
        this.focus(id);
      }
    };

    this.taskbarRow.appendChild(btn);
  }

  _isTopWindow(id) {
    const win = this.wins.get(id);
    if (!win) return false;
    return parseInt(win.el.style.zIndex) === this.zTop;
  }

  _show(win) { win.el.style.display = ''; }
  _hide(win) { win.el.style.display = 'none'; }

  _makeDraggable(el, id) {
    const titlebar = el.querySelector('.window-titlebar');
    let dragging = false, ox = 0, oy = 0, startL = 0, startT = 0;

    const onDown = (e) => {
      if (e.target.closest('.window-controls')) return;
      if (this.wins.get(id)?.state === 'maximized') return;
      dragging = true;
      ox = e.clientX; oy = e.clientY;
      startL = parseInt(el.style.left) || 0;
      startT = parseInt(el.style.top)  || 0;
      e.preventDefault();
    };

    const onMove = (e) => {
      if (!dragging) return;
      el.style.left = (startL + e.clientX - ox) + 'px';
      el.style.top  = Math.max(0, startT + e.clientY - oy) + 'px';
    };

    const onUp = () => { dragging = false; };

    titlebar.addEventListener('mousedown', onDown);
    document.addEventListener('mousemove', onMove);
    document.addEventListener('mouseup',   onUp);
  }
}

/* ════════════════════════════════════════════════════
   GLOBAL INSTANCE
   ════════════════════════════════════════════════════ */
const WM = new WindowManager();

/* ════════════════════════════════════════════════════
   CONTENT RENDERERS
   ════════════════════════════════════════════════════ */

function openFolder(folderId) {
  const folder = SITE.folders.find(f => f.id === folderId);
  if (!folder) return;

  const posts = SITE.posts.filter(p => p.folder === folderId);
  const count = posts.length;

  const items = count === 0
    ? `<div class="folder-empty">This folder is empty.<br>Add posts in content.js</div>`
    : posts.map(post => `
        <div class="post-item" role="button" tabindex="0"
             onclick="openPost('${post.id}')"
             onkeydown="if(event.key==='Enter')openPost('${post.id}')">
          <span class="post-item-icon">${folderId === 'kristofer' ? '🏢' : '📄'}</span>
          <div>
            <div class="post-item-title">${post.title}</div>
            <div class="post-item-meta">${formatDate(post.date)}</div>
            <div class="post-item-excerpt">${post.excerpt || ''}</div>
          </div>
        </div>
      `).join('');

  const body = `
    <div class="folder-view">${items}</div>
    <div class="window-statusbar">${count} object${count !== 1 ? 's' : ''}</div>
  `;

  WM.open(folderId, folder.label, folder.icon, body, { width: 520, height: 400 });
}

function openPost(postId) {
  const post = SITE.posts.find(p => p.id === postId);
  if (!post) return;

  WM.open(postId, post.title, '📄',
    `<div class="post-content">${post.content}</div>`,
    { width: 620, height: 500 });
}

function openAbout() {
  const socials = Object.entries(SITE.social)
    .filter(([_, info]) => info)
    .map(([platform, info]) => `
      <a class="about-link-btn" href="${info.url}" target="_blank" rel="noopener">
        <span>${getSocialEmoji(platform)}</span> ${info.label}
      </a>
    `).join('');

  const body = `
    <div class="about-content">
      <div class="about-logo">💻</div>
      <h2>${SITE.title}</h2>
      <p>${SITE.subtitle || ''}</p>
      <p>A Windows XP–themed portfolio and blog — built with vanilla HTML, CSS and JavaScript.</p>
      <hr>
      <p><strong>Find me online:</strong></p>
      <div class="about-links">${socials}</div>
      <hr>
      <p style="color:#888;font-size:11px">
        Double-click desktop icons to open windows.<br>
        Drag window title bars to move them around.
      </p>
    </div>
  `;

  WM.open('about', 'My Computer', '💻', body, { width: 440, height: 380 });
}

/* ════════════════════════════════════════════════════
   DESKTOP ICONS
   ════════════════════════════════════════════════════ */

function renderDesktop() {
  const container = document.getElementById('desktop-icons');
  container.innerHTML = '';

  // Folder icons
  SITE.folders.forEach(folder => {
    container.appendChild(makeIcon(folder.icon, folder.label, () => openFolder(folder.id)));
  });

  // My Computer
  container.appendChild(makeIcon('💻', 'My Computer', openAbout));

  // Social icons
  Object.entries(SITE.social).forEach(([platform, info]) => {
    if (!info) return;
    const iconSVG = SOCIAL_ICONS[platform] || '🔗';
    const iconEl  = document.createElement('span');
    iconEl.innerHTML = iconSVG;
    const action = () => window.open(info.url, '_blank', 'noopener');

    // Pass rendered SVG or emoji
    const hasTag = iconSVG.startsWith('<');
    container.appendChild(makeIcon(hasTag ? iconSVG : iconSVG, info.label, action, true));
  });
}

function makeIcon(iconContent, label, action, isSVG = false) {
  const div = document.createElement('div');
  div.className = 'desktop-icon';
  div.setAttribute('role', 'listitem');
  div.setAttribute('tabindex', '0');

  const imgEl = document.createElement('div');
  imgEl.className = 'icon-image';
  if (isSVG && typeof iconContent === 'string' && iconContent.startsWith('<')) {
    imgEl.innerHTML = iconContent;
  } else {
    imgEl.textContent = iconContent;
  }

  const labelEl = document.createElement('div');
  labelEl.className = 'icon-label';
  labelEl.textContent = label;

  div.appendChild(imgEl);
  div.appendChild(labelEl);

  // Desktop: double-click to open; single-click to select
  div.addEventListener('click', (e) => {
    document.querySelectorAll('.desktop-icon').forEach(i => i.classList.remove('selected'));
    div.classList.add('selected');
  });

  div.addEventListener('dblclick', (e) => {
    e.stopPropagation();
    action();
  });

  // Mobile: single tap to open
  let tapTimer = null;
  div.addEventListener('touchend', (e) => {
    e.preventDefault();
    if (tapTimer) {
      clearTimeout(tapTimer);
      tapTimer = null;
      action();
    } else {
      div.classList.add('selected');
      tapTimer = setTimeout(() => { tapTimer = null; }, 300);
    }
  });

  div.addEventListener('keydown', (e) => {
    if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); action(); }
  });

  return div;
}

/* ════════════════════════════════════════════════════
   START MENU
   ════════════════════════════════════════════════════ */

function renderStartMenu() {
  const left  = document.getElementById('start-menu-left');
  const right = document.getElementById('start-menu-right');

  left.innerHTML = `
    <div class="start-item" role="listitem" tabindex="0"
         onclick="openAbout();closeStartMenu()"
         onkeydown="if(event.key==='Enter'){openAbout();closeStartMenu()}">
      <span class="start-item-icon">💻</span>
      <span>My Computer</span>
    </div>
    <div class="start-separator"></div>
    ${SITE.folders.map(f => `
      <div class="start-item" role="listitem" tabindex="0"
           onclick="openFolder('${f.id}');closeStartMenu()"
           onkeydown="if(event.key==='Enter'){openFolder('${f.id}');closeStartMenu()}">
        <span class="start-item-icon">${f.icon}</span>
        <span>${f.label}</span>
      </div>
    `).join('')}
  `;

  const socialItems = Object.entries(SITE.social)
    .filter(([_, info]) => info)
    .map(([platform, info]) => `
      <div class="start-item" role="listitem" tabindex="0"
           onclick="window.open('${info.url}','_blank','noopener');closeStartMenu()"
           onkeydown="if(event.key==='Enter'){window.open('${info.url}','_blank','noopener');closeStartMenu()}">
        <span class="start-item-icon">${getSocialEmoji(platform)}</span>
        <span>${info.label}</span>
      </div>
    `).join('');

  right.innerHTML = `
    <div class="start-section-title">Connect</div>
    ${socialItems}
  `;
}

function closeStartMenu() {
  const menu = document.getElementById('start-menu');
  menu.hidden = true;
  document.getElementById('start-btn').setAttribute('aria-expanded', 'false');
}

function toggleStartMenu(e) {
  e.stopPropagation();
  const menu = document.getElementById('start-menu');
  const btn  = document.getElementById('start-btn');
  const open = menu.hidden;
  menu.hidden = !open;
  btn.setAttribute('aria-expanded', String(open));
}

/* ════════════════════════════════════════════════════
   CLOCK
   ════════════════════════════════════════════════════ */
function updateClock() {
  const now = new Date();
  const h   = now.getHours().toString().padStart(2, '0');
  const m   = now.getMinutes().toString().padStart(2, '0');
  document.getElementById('clock').textContent = `${h}:${m}`;
}

/* ════════════════════════════════════════════════════
   SHUT-DOWN EASTER EGG
   ════════════════════════════════════════════════════ */
function doShutDown() {
  closeStartMenu();
  document.getElementById('shutdown-overlay').hidden = false;
}

/* ════════════════════════════════════════════════════
   UTILITIES
   ════════════════════════════════════════════════════ */
function getSocialEmoji(platform) {
  return { github: '🐙', instagram: '📷', linkedin: '💼' }[platform] || '🔗';
}

function formatDate(dateStr) {
  if (!dateStr) return '';
  try {
    return new Date(dateStr + 'T00:00:00').toLocaleDateString('en-US', {
      year: 'numeric', month: 'long', day: 'numeric'
    });
  } catch { return dateStr; }
}

/* ════════════════════════════════════════════════════
   INIT
   ════════════════════════════════════════════════════ */
function init() {
  // Title
  document.title = SITE.title;

  // Render desktop icons
  renderDesktop();

  // Render start menu
  renderStartMenu();

  // Update clock immediately, then every 30s
  updateClock();
  setInterval(updateClock, 30_000);

  // Start button
  document.getElementById('start-btn').addEventListener('click', toggleStartMenu);

  // Close start menu on outside click
  document.addEventListener('click', () => closeStartMenu());
  document.getElementById('start-menu').addEventListener('click', e => e.stopPropagation());

  // Deselect icons on desktop click
  document.getElementById('desktop').addEventListener('click', (e) => {
    if (!e.target.closest('.desktop-icon') && !e.target.closest('.window')) {
      document.querySelectorAll('.desktop-icon').forEach(i => i.classList.remove('selected'));
    }
  });

  // Handle resize: reflow mobile windows
  window.addEventListener('resize', () => {
    WM.wins.forEach((win, id) => {
      if (isMobile() && win.state === 'open') {
        win.el.style.left = '0';
        win.el.style.top  = '0';
      }
    });
  });

  // Keyboard: Escape closes start menu, Windows key toggles it
  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape') closeStartMenu();
  });
}

document.addEventListener('DOMContentLoaded', init);
