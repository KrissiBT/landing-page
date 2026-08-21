/* Site editor front-end. Talks to the Go API and drives the live preview. */
'use strict';

/* ════════════════════════════════════════════════════
   STATE
   ════════════════════════════════════════════════════ */
const state = {
  site: null,          // full model (what gets PUT)
  saved: null,         // JSON snapshot of last saved model
  sel: null,           // {type:'post'|'folder'|'shortcut'|'site'|'images', id}
  errors: [],          // server validation errors
  previewReady: false,
  previewWidth: 'desktop',
  idTouched: false,    // user edited the id field manually
  collapsed: JSON.parse(localStorage.getItem('collapsedFolders') || '{}'),
  git: null,
};

const $ = (sel, root = document) => root.querySelector(sel);
const $$ = (sel, root = document) => [...root.querySelectorAll(sel)];
const esc = s => String(s ?? '').replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
const today = () => new Date().toISOString().slice(0, 10);
const slugify = s => s.toLowerCase().normalize('NFKD').replace(/[\u0300-\u036f]/g, '')
  .replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '').slice(0, 60);

function isDirty() { return state.site && JSON.stringify(state.site) !== state.saved; }

/* ════════════════════════════════════════════════════
   API
   ════════════════════════════════════════════════════ */
async function api(method, url, body, isForm) {
  const opts = { method, headers: {} };
  if (body !== undefined) {
    if (isForm) opts.body = body;
    else { opts.headers['Content-Type'] = 'application/json'; opts.body = JSON.stringify(body); }
  }
  const res = await fetch(url, opts);
  let data = null;
  try { data = await res.json(); } catch { /* non-JSON */ }
  if (!res.ok) {
    const err = new Error((data && (data.error || (data.errors || []).join('; '))) || res.statusText);
    err.status = res.status; err.data = data;
    throw err;
  }
  return data;
}

async function loadSite() {
  state.site = await api('GET', '/api/site');
  state.saved = JSON.stringify(state.site);
  $('#brand-title').textContent = state.site.title || 'Site Editor';
  renderSidebar();
  updateSaveStatus();
}

async function save() {
  if (!state.site) return;
  const btn = $('#btn-save');
  btn.disabled = true;
  setStatus('Saving…', '');
  try {
    await api('PUT', '/api/site', state.site);
    state.saved = JSON.stringify(state.site);
    state.errors = [];
    renderErrors();
    toast('Saved', 'ok');
    renderSidebar();
    refreshGit();
  } catch (e) {
    state.errors = (e.data && e.data.errors) || [e.message];
    renderErrors();
    toast('Not saved: ' + (state.errors[0] || 'error'), 'err');
  }
  updateSaveStatus();
}

/* ════════════════════════════════════════════════════
   STATUS / TOASTS / MODAL / LOG
   ════════════════════════════════════════════════════ */
function setStatus(text, cls) {
  const el = $('#save-status');
  el.textContent = text;
  el.className = 'status-chip ' + cls;
}

function updateSaveStatus() {
  const dirty = isDirty();
  $('#btn-save').disabled = !dirty;
  if (!dirty && state.errors.length) { state.errors = []; renderErrors(); }
  if (state.errors.length) setStatus('⚠ ' + state.errors.length + ' problem' + (state.errors.length > 1 ? 's' : ''), 'error');
  else if (dirty) setStatus('● Unsaved changes', 'dirty');
  else setStatus('✓ Saved ' + new Date().toLocaleTimeString(), 'saved');
  document.title = (dirty ? '● ' : '') + 'Site Editor';
}

function toast(msg, cls = '', ms = 2600) {
  const el = document.createElement('div');
  el.className = 'toast ' + cls;
  el.textContent = msg;
  $('#toasts').appendChild(el);
  setTimeout(() => el.remove(), ms);
}

function openModal(title, bodyHTML) {
  $('#modal-title').textContent = title;
  $('#modal-body').innerHTML = bodyHTML;
  $('#modal').hidden = false;
  const first = $('#modal-body input, #modal-body textarea, #modal-body button');
  if (first) first.focus();
}
function closeModal() { $('#modal').hidden = true; $('#modal-body').innerHTML = ''; }

function log(lines) {
  const out = $('#log-out');
  out.textContent += (out.textContent ? '\n' : '') + [].concat(lines).filter(Boolean).join('\n');
  out.scrollTop = out.scrollHeight;
  $('#log-drawer').hidden = false;
}

function confirmDialog(title, message, okLabel = 'Delete') {
  return new Promise(resolve => {
    openModal(title, `
      <p>${esc(message)}</p>
      <div class="modal-actions">
        <button class="btn-lite" id="cf-no">Cancel</button>
        <button class="btn-dark danger" id="cf-yes" style="background:#c8342b;border-color:#a42a22;color:#fff">${esc(okLabel)}</button>
      </div>`);
    $('#cf-no').onclick = () => { closeModal(); resolve(false); };
    $('#cf-yes').onclick = () => { closeModal(); resolve(true); };
    $('#cf-yes').focus();
  });
}

/* ════════════════════════════════════════════════════
   SIDEBAR
   ════════════════════════════════════════════════════ */
function renderSidebar() {
  const s = state.site;
  const q = $('#search').value.trim().toLowerCase();
  const savedSite = state.saved ? JSON.parse(state.saved) : null;
  const postDirty = p => !savedSite || JSON.stringify(savedSite.posts.find(x => x.id === p.id)) !== JSON.stringify(p);

  // Posts grouped by folder
  const tree = $('#post-tree');
  const byFolder = {};
  s.posts.forEach(p => (byFolder[p.folder] ||= []).push(p));
  const orphanFolders = Object.keys(byFolder).filter(f => !s.folders.some(x => x.id === f));
  const groups = [...s.folders.map(f => ({ id: f.id, label: f.label, icon: f.icon })),
    ...orphanFolders.map(f => ({ id: f, label: f + ' (missing folder)', icon: '⚠️' }))];

  tree.innerHTML = groups.map(f => {
    let posts = (byFolder[f.id] || []).slice().sort((a, b) => (b.date || '').localeCompare(a.date || ''));
    if (q) posts = posts.filter(p => (p.title + ' ' + p.id + ' ' + (p.excerpt || '')).toLowerCase().includes(q));
    if (q && !posts.length) return '';
    const collapsed = !q && state.collapsed[f.id];
    return `
      <div class="tree-folder ${collapsed ? 'collapsed' : ''}" data-folder="${esc(f.id)}">
        <button class="side-item" data-toggle="${esc(f.id)}">
          <span class="tree-caret">▼</span><span class="ico">${esc(f.icon)}</span>
          <span class="lbl">${esc(f.label)}</span><span class="sub">${posts.length}</span>
        </button>
        <div class="tree-children">
          ${posts.length ? posts.map(p => `
            <button class="side-item post ${isSel('post', p.id) ? 'active' : ''} ${postDirty(p) ? 'dirty' : ''}" data-sel="post" data-id="${esc(p.id)}" title="${esc(p.id)}">
              <span class="ico">📄</span><span class="lbl">${esc(p.title || '(untitled)')}</span>
              <span class="sub">${esc((p.date || '').slice(0, 7))}</span>
            </button>`).join('') : '<div class="tree-empty">empty</div>'}
        </div>
      </div>`;
  }).join('') || '<div class="tree-empty">No posts match.</div>';

  $('#folder-list').innerHTML = s.folders.map(f => `
    <li><button class="side-item ${isSel('folder', f.id) ? 'active' : ''}" data-sel="folder" data-id="${esc(f.id)}">
      <span class="ico">${esc(f.icon)}</span><span class="lbl">${esc(f.label)}</span></button></li>`).join('');

  $('#shortcut-list').innerHTML = s.shortcuts.map(sc => `
    <li><button class="side-item ${isSel('shortcut', sc.id) ? 'active' : ''}" data-sel="shortcut" data-id="${esc(sc.id)}">
      <span class="ico">${esc(sc.icon)}</span><span class="lbl">${esc(sc.label)}</span></button></li>`).join('');

  $$('#sidebar [data-sel="site"], #sidebar [data-sel="images"]').forEach(b =>
    b.classList.toggle('active', state.sel && state.sel.type === b.dataset.sel));
}

function isSel(type, id) { return state.sel && state.sel.type === type && state.sel.id === id; }

$('#sidebar').addEventListener('click', e => {
  const toggle = e.target.closest('[data-toggle]');
  if (toggle) {
    const id = toggle.dataset.toggle;
    state.collapsed[id] = !state.collapsed[id];
    localStorage.setItem('collapsedFolders', JSON.stringify(state.collapsed));
    renderSidebar();
    return;
  }
  const item = e.target.closest('[data-sel]');
  if (item) select(item.dataset.sel, item.dataset.id);
});
$('#search').addEventListener('input', renderSidebar);

/* ════════════════════════════════════════════════════
   SELECTION / EDITOR PANE
   ════════════════════════════════════════════════════ */
function select(type, id) {
  state.sel = { type, id };
  state.idTouched = true;
  renderSidebar();
  renderEditor();
  // Drive the preview to show what we're editing.
  if (type === 'post') sendPreviewPost(findPost(id));
  else if (type === 'folder') postToPreview({ type: 'preview:open', id });
  else if (type === 'site') postToPreview({ type: 'preview:open', id: 'about' });
}

const findPost = id => state.site.posts.find(p => p.id === id);
const findFolder = id => state.site.folders.find(f => f.id === id);
const findShortcut = id => state.site.shortcuts.find(s => s.id === id);

function renderEditor() {
  const body = $('#editor-body');
  const empty = $('#editor-empty');
  if (!state.sel) { body.hidden = true; empty.hidden = false; return; }
  empty.hidden = true; body.hidden = false;

  switch (state.sel.type) {
    case 'post': renderPostForm(findPost(state.sel.id)); break;
    case 'folder': renderFolderForm(findFolder(state.sel.id)); break;
    case 'shortcut': renderShortcutForm(findShortcut(state.sel.id)); break;
    case 'site': renderSiteForm(); break;
    case 'images': renderImageLibrary(); break;
  }
  renderErrors();
}

function renderErrors() {
  let box = $('#errors');
  if (!state.errors.length) { if (box) box.remove(); return; }
  if (!box) {
    box = document.createElement('div');
    box.id = 'errors'; box.className = 'errors';
    $('#editor').prepend(box);
  }
  box.innerHTML = `<strong>Couldn't save — fix these first:</strong><ul>${state.errors.map(e => `<li>${esc(e)}</li>`).join('')}</ul>`;
}

/* Generic: bind inputs with data-bind="field" to an object and re-render on change */
function bindFields(root, obj, onChange) {
  $$('[data-bind]', root).forEach(el => {
    const key = el.dataset.bind;
    el.addEventListener('input', () => {
      obj[key] = el.value;
      onChange && onChange(key, el);
      updateSaveStatus();
    });
  });
}

/* ── Post form ───────────────────────────────────── */
function renderPostForm(post) {
  if (!post) { state.sel = null; renderEditor(); return; }
  const body = $('#editor-body');
  const folders = state.site.folders.map(f => `<option value="${esc(f.id)}" ${f.id === post.folder ? 'selected' : ''}>${esc(f.icon)} ${esc(f.label)}</option>`).join('');
  const folderMissing = !state.site.folders.some(f => f.id === post.folder);

  body.innerHTML = `
    <div class="card">
      <h2>📄 <span id="post-heading">${esc(post.title || 'New post')}</span><span class="spacer"></span>
        <button class="btn-lite" id="btn-copy-link" title="Copy the public link">🔗 Copy link</button>
        <button class="btn-lite danger" id="btn-delete">Delete</button>
      </h2>
      <div class="row c2">
        <div class="field"><label>Title</label><input type="text" data-bind="title" value="${esc(post.title)}" placeholder="My amazing build" autofocus></div>
        <div class="field"><label>ID <span class="help" style="display:inline">(used in the link: #post/…)</span></label>
          <input type="text" data-bind="id" value="${esc(post.id)}" id="post-id" spellcheck="false">
        </div>
      </div>
      <div class="row c3">
        <div class="field"><label>Excerpt</label><input type="text" data-bind="excerpt" value="${esc(post.excerpt)}" placeholder="One line shown in the folder listing"></div>
        <div class="field ${folderMissing ? 'invalid' : ''}"><label>Folder</label>
          <select data-bind="folder">${folderMissing ? `<option value="${esc(post.folder)}" selected>⚠️ ${esc(post.folder)} (missing)</option>` : ''}${folders}</select></div>
        <div class="field"><label>Date</label><input type="date" data-bind="date" value="${esc(post.date)}"></div>
      </div>

      <div class="field">
        <label>Content (HTML)</label>
        <div class="toolbar" id="toolbar">
          <button data-wrap="<h2>|</h2>" title="Heading"><b>H2</b></button>
          <button data-wrap="<h3>|</h3>" title="Sub-heading"><b>H3</b></button>
          <button data-wrap="<p>|</p>" title="Paragraph">¶</button>
          <button data-wrap="<strong>|</strong>" title="Bold (Ctrl+B)"><b>B</b></button>
          <button data-wrap="<em>|</em>" title="Italic (Ctrl+I)"><i>I</i></button>
          <span class="sep"></span>
          <button data-block="<ul>\n  <li>|</li>\n</ul>" title="Bullet list">• List</button>
          <button data-block="<pre><code>|</code></pre>" title="Code block">&lt;/&gt; Code</button>
          <button data-wrap="<code>|</code>" title="Inline code">\`code\`</button>
          <button data-action="link" title="Link (Ctrl+K)">🔗 Link</button>
          <button data-action="image" title="Insert image">🖼️ Image</button>
          <button data-action="meta" title="Date / folder line">📅 Meta line</button>
          <button data-action="template" title="Insert a starter template">📝 Template</button>
          <span class="grow"></span>
          <button data-action="tidy" title="Trim trailing spaces">🧹</button>
        </div>
        <textarea id="content" data-bind="content" spellcheck="true" placeholder="<h2>Title</h2>\n<p>Write your post as HTML. Drop or paste images here.</p>">${esc(post.content)}</textarea>
        <div class="editor-foot">
          <span>Drag &amp; drop or paste images to upload · Tab indents · <kbd>Ctrl</kbd>+<kbd>S</kbd> saves</span>
          <span id="content-stats"></span>
        </div>
      </div>
    </div>`;

  const originalId = post.id;
  state.idTouched = post.title !== '' && post.id !== slugify(post.title) && post.id !== '';
  if (post.id === '') state.idTouched = false;

  bindFields(body, post, (key, el) => {
    if (key === 'title') {
      $('#post-heading').textContent = post.title || 'New post';
      if (!state.idTouched) { post.id = slugify(post.title); $('#post-id').value = post.id; }
    }
    if (key === 'id') state.idTouched = true;
    if (key === 'id' || key === 'title') {
      // Keep selection pointing at the (possibly renamed) post.
      state.sel.id = post.id;
    }
    if (key === 'content') updateStats();
    renderSidebar();
    schedulePreview(post);
  });

  // Ensure the id gets committed even if sel changed mid-way.
  void originalId;

  const ta = $('#content');
  setupTextarea(ta, post);
  updateStats();

  $('#btn-delete').onclick = async () => {
    if (await confirmDialog('Delete post', `Delete "${post.title || post.id}"? This is written to content.js on the next save.`)) {
      state.site.posts = state.site.posts.filter(p => p !== post);
      state.sel = null;
      renderSidebar(); renderEditor(); updateSaveStatus();
      sendPreviewSite();
      toast('Post removed — save to apply');
    }
  };
  $('#btn-copy-link').onclick = () => {
    const url = publicBase() + '#post/' + encodeURIComponent(post.id);
    navigator.clipboard.writeText(url).then(() => toast('Copied ' + url, 'ok')).catch(() => prompt('Link:', url));
  };

  function updateStats() {
    const txt = ta.value;
    const words = (txt.replace(/<[^>]+>/g, ' ').match(/\S+/g) || []).length;
    $('#content-stats').textContent = `${words} words · ${txt.length} chars`;
  }
}

// Best-effort public URL: the site's own URL if we know it, else the preview path.
function publicBase() {
  return localStorage.getItem('publicBase') || (location.origin + '/site/');
}

/* ── Textarea helpers: toolbar, tab, shortcuts, drop/paste ── */
function setupTextarea(ta, post) {
  const toolbar = $('#toolbar');

  function replaceSel(before, after = '', placeholder = '') {
    const s = ta.selectionStart, e = ta.selectionEnd;
    const selected = ta.value.slice(s, e) || placeholder;
    const insert = before + selected + after;
    ta.setRangeText(insert, s, e, 'end');
    if (!ta.value.slice(s, e).length || placeholder) {
      ta.selectionStart = s + before.length;
      ta.selectionEnd = s + before.length + selected.length;
    }
    ta.focus();
    ta.dispatchEvent(new Event('input', { bubbles: true }));
  }

  function insertAtCursor(text) {
    const s = ta.selectionStart;
    ta.setRangeText(text, s, ta.selectionEnd, 'end');
    ta.focus();
    ta.dispatchEvent(new Event('input', { bubbles: true }));
  }

  function wrapFromSpec(spec, block) {
    const [before, after] = spec.split('|');
    if (block) {
      // Put block on its own line(s).
      const s = ta.selectionStart;
      const atLineStart = s === 0 || ta.value[s - 1] === '\n';
      replaceSel((atLineStart ? '' : '\n') + before, after + '\n', '');
    } else {
      replaceSel(before, after, '');
    }
  }

  toolbar.addEventListener('click', e => {
    const btn = e.target.closest('button');
    if (!btn) return;
    e.preventDefault();
    if (btn.dataset.wrap) return wrapFromSpec(btn.dataset.wrap, false);
    if (btn.dataset.block) return wrapFromSpec(btn.dataset.block.replace(/\\n/g, '\n'), true);
    switch (btn.dataset.action) {
      case 'link': return insertLink();
      case 'image': return openImagePicker(p => insertAtCursor(`<img src="${p}" alt="">`));
      case 'meta': {
        const f = findFolder(post.folder);
        const d = post.date ? new Date(post.date + 'T00:00:00').toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' }) : '';
        return insertAtCursor(`<p class="post-meta">📅 ${d} &nbsp;·&nbsp; ${f ? f.icon + ' ' + f.label : ''}</p>\n`);
      }
      case 'template': {
        if (ta.value.trim() && !confirm('Replace the current content with a template?')) return;
        const f = findFolder(post.folder);
        const d = post.date ? new Date(post.date + 'T00:00:00').toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' }) : '';
        ta.value = `<h2>${esc(post.title || 'Title')}</h2>\n<p class="post-meta">📅 ${d} &nbsp;·&nbsp; ${f ? f.icon + ' ' + f.label : ''}</p>\n\n<p>Intro paragraph…</p>\n\n<h3>Section</h3>\n<ul>\n  <li>Point one</li>\n  <li>Point two</li>\n</ul>\n\n<p>Closing thoughts.</p>\n`;
        ta.dispatchEvent(new Event('input', { bubbles: true }));
        return;
      }
      case 'tidy':
        ta.value = ta.value.replace(/[ \t]+$/gm, '');
        ta.dispatchEvent(new Event('input', { bubbles: true }));
        return;
    }
  });

  function insertLink() {
    const sel = ta.value.slice(ta.selectionStart, ta.selectionEnd);
    const url = prompt('Link URL:', 'https://');
    if (!url) return;
    replaceSel(`<a href="${url}" target="_blank" rel="noopener">`, '</a>', sel || 'link text');
  }

  ta.addEventListener('keydown', e => {
    if (e.key === 'Tab') {
      e.preventDefault();
      const s = ta.selectionStart, en = ta.selectionEnd;
      if (s !== en && ta.value.slice(s, en).includes('\n')) {
        // Indent / outdent selected lines.
        const lineStart = ta.value.lastIndexOf('\n', s - 1) + 1;
        const block = ta.value.slice(lineStart, en);
        const out = e.shiftKey ? block.replace(/^ {1,2}/gm, '') : block.replace(/^/gm, '  ');
        ta.setRangeText(out, lineStart, en, 'select');
      } else if (e.shiftKey) {
        const lineStart = ta.value.lastIndexOf('\n', s - 1) + 1;
        const m = ta.value.slice(lineStart).match(/^ {1,2}/);
        if (m) { ta.setRangeText('', lineStart, lineStart + m[0].length, 'end'); ta.selectionStart = ta.selectionEnd = Math.max(lineStart, s - m[0].length); }
      } else {
        ta.setRangeText('  ', s, en, 'end');
      }
      ta.dispatchEvent(new Event('input', { bubbles: true }));
    } else if (e.key === 'Enter' && !e.shiftKey && !e.ctrlKey) {
      // Keep indentation of the current line.
      const s = ta.selectionStart;
      const lineStart = ta.value.lastIndexOf('\n', s - 1) + 1;
      const indent = (ta.value.slice(lineStart, s).match(/^[ \t]*/) || [''])[0];
      if (indent) { e.preventDefault(); ta.setRangeText('\n' + indent, s, ta.selectionEnd, 'end'); ta.dispatchEvent(new Event('input', { bubbles: true })); }
    } else if ((e.ctrlKey || e.metaKey) && !e.shiftKey) {
      const k = e.key.toLowerCase();
      if (k === 'b') { e.preventDefault(); replaceSel('<strong>', '</strong>'); }
      else if (k === 'i') { e.preventDefault(); replaceSel('<em>', '</em>'); }
      else if (k === 'k') { e.preventDefault(); insertLink(); }
    }
  });

  // Drag & drop / paste images
  ta.addEventListener('dragover', e => { if (hasFiles(e)) { e.preventDefault(); ta.classList.add('dragover'); } });
  ta.addEventListener('dragleave', () => ta.classList.remove('dragover'));
  ta.addEventListener('drop', async e => {
    ta.classList.remove('dragover');
    if (!hasFiles(e)) return;
    e.preventDefault();
    const files = [...e.dataTransfer.files].filter(f => f.type.startsWith('image/') || /\.svg$/i.test(f.name));
    if (!files.length) return toast('Only images can be dropped here', 'err');
    // Place the cursor where the drop happened, if the browser tells us.
    if (document.caretPositionFromPoint) {
      const pos = document.caretPositionFromPoint(e.clientX, e.clientY);
      if (pos && pos.offsetNode === ta.firstChild) ta.selectionStart = ta.selectionEnd = pos.offset;
    }
    const saved = await upload(files);
    saved.forEach(f => insertAtCursor(`<img src="${f.path}" alt="">\n`));
  });
  ta.addEventListener('paste', async e => {
    const files = [...(e.clipboardData?.files || [])].filter(f => f.type.startsWith('image/'));
    if (!files.length) return;
    e.preventDefault();
    const saved = await upload(files.map((f, i) => f.name === 'image.png' ? new File([f], `pasted-${Date.now()}${i ? '-' + i : ''}.png`, { type: f.type }) : f));
    saved.forEach(f => insertAtCursor(`<img src="${f.path}" alt="">\n`));
  });
}

const hasFiles = e => e.dataTransfer && [...e.dataTransfer.types].includes('Files');

async function upload(files) {
  const fd = new FormData();
  files.forEach(f => fd.append('file', f, f.name));
  setStatus(`Uploading ${files.length} file${files.length > 1 ? 's' : ''}…`, '');
  try {
    const res = await api('POST', '/api/upload', fd, true);
    toast(`Uploaded ${res.files.map(f => f.name).join(', ')}`, 'ok');
    updateSaveStatus();
    refreshGit();
    return res.files;
  } catch (e) {
    toast('Upload failed: ' + e.message, 'err', 5000);
    updateSaveStatus();
    return [];
  }
}

/* ── Image picker / library ──────────────────────── */
async function openImagePicker(onPick) {
  openModal('Insert image', `
    <div class="upload-zone" id="pick-zone">Drop images here or <button class="link" id="pick-browse">browse</button><input type="file" id="pick-file" accept="image/*" multiple hidden></div>
    <div class="gallery" id="pick-gallery">Loading…</div>`);
  wireUploadZone($('#pick-zone'), $('#pick-file'), $('#pick-browse'), async files => {
    const saved = await upload(files);
    if (saved.length) { onPick(saved[0].path); closeModal(); }
  });
  const imgs = await api('GET', '/api/images');
  const g = $('#pick-gallery');
  if (!g) return;
  g.innerHTML = imgs.length ? imgs.map(thumbHTML).join('') : '<p style="color:#6b7280">No images yet — upload one above.</p>';
  g.onclick = e => {
    const t = e.target.closest('.thumb');
    if (t && !e.target.closest('.del')) { onPick(t.dataset.path); closeModal(); }
  };
}

const thumbHTML = im => `
  <div class="thumb" data-path="${esc(im.path)}" data-name="${esc(im.name)}" title="${esc(im.name)} · ${(im.size / 1024).toFixed(0)} KB">
    <img src="/site/${esc(im.path)}" alt="" loading="lazy">
    <div class="name">${esc(im.name)}</div>
    <button class="del" title="Delete file">✕</button>
  </div>`;

function wireUploadZone(zone, fileInput, browseBtn, onFiles) {
  browseBtn.onclick = e => { e.preventDefault(); fileInput.click(); };
  fileInput.onchange = () => { if (fileInput.files.length) onFiles([...fileInput.files]); fileInput.value = ''; };
  zone.addEventListener('dragover', e => { if (hasFiles(e)) { e.preventDefault(); zone.classList.add('dragover'); } });
  zone.addEventListener('dragleave', () => zone.classList.remove('dragover'));
  zone.addEventListener('drop', e => {
    zone.classList.remove('dragover');
    if (!hasFiles(e)) return;
    e.preventDefault();
    onFiles([...e.dataTransfer.files]);
  });
}

async function renderImageLibrary() {
  const body = $('#editor-body');
  body.innerHTML = `
    <div class="card">
      <h2>🖼️ Image library <span class="spacer"></span><span class="help" id="img-count"></span></h2>
      <div class="upload-zone" id="lib-zone">Drop images here or <button class="link" id="lib-browse">browse</button> — they're saved to <code>assets/images/</code><input type="file" id="lib-file" accept="image/*" multiple hidden></div>
      <div class="gallery" id="lib-gallery">Loading…</div>
      <p class="help" style="margin-top:12px">Click an image to copy its <code>&lt;img&gt;</code> tag. Hover and press ✕ to delete the file (posts referencing it will show a broken image).</p>
    </div>`;
  wireUploadZone($('#lib-zone'), $('#lib-file'), $('#lib-browse'), async files => { await upload(files); renderImageLibrary(); });
  const imgs = await api('GET', '/api/images');
  const g = $('#lib-gallery');
  if (!g) return;
  $('#img-count').textContent = `${imgs.length} file${imgs.length !== 1 ? 's' : ''}`;
  g.innerHTML = imgs.length ? imgs.map(thumbHTML).join('') : '<p style="color:#6b7280">No images yet.</p>';
  g.onclick = async e => {
    const t = e.target.closest('.thumb');
    if (!t) return;
    if (e.target.closest('.del')) {
      if (await confirmDialog('Delete image', `Delete ${t.dataset.name} from assets/images? This cannot be undone (unless it's committed in git).`)) {
        try { await api('DELETE', '/api/images/' + encodeURIComponent(t.dataset.name)); toast('Deleted', 'ok'); renderImageLibrary(); refreshGit(); }
        catch (err) { toast(err.message, 'err'); }
      }
      return;
    }
    const tag = `<img src="${t.dataset.path}" alt="">`;
    navigator.clipboard.writeText(tag).then(() => toast('Copied ' + tag, 'ok'));
  };
}

/* ── Folder form ─────────────────────────────────── */
function renderFolderForm(folder) {
  if (!folder) { state.sel = null; renderEditor(); return; }
  const body = $('#editor-body');
  const count = state.site.posts.filter(p => p.folder === folder.id).length;
  body.innerHTML = `
    <div class="card">
      <h2>${esc(folder.icon)} <span id="f-heading">${esc(folder.label || 'New folder')}</span><span class="spacer"></span>
        <button class="btn-lite danger" id="btn-delete" ${count ? 'disabled title="Move or delete its posts first"' : ''}>Delete</button></h2>
      <div class="row icon">
        <div class="field"><label>Icon</label><div class="with-btn"><input type="text" data-bind="icon" value="${esc(folder.icon)}" id="f-icon" style="text-align:center;font-size:18px"><button class="emoji-btn" data-emoji-for="f-icon" title="Pick emoji">😀</button></div></div>
        <div class="field"><label>Label</label><input type="text" data-bind="label" value="${esc(folder.label)}" autofocus></div>
      </div>
      <div class="field"><label>ID</label><input type="text" data-bind="id" value="${esc(folder.id)}" id="f-id" spellcheck="false">
        <div class="help">${count} post${count !== 1 ? 's' : ''} in this folder${count ? ' — changing the id will update them too' : ''}.</div></div>
    </div>`;
  const oldId = folder.id;
  state.idTouched = folder.id !== '' && folder.id !== slugify(folder.label);
  bindFields(body, folder, key => {
    if (key === 'label') {
      $('#f-heading').textContent = folder.label || 'New folder';
      if (!state.idTouched) { folder.id = slugify(folder.label); $('#f-id').value = folder.id; }
    }
    if (key === 'id') state.idTouched = true;
    if (key === 'id' || key === 'label') {
      // Cascade id rename to posts.
      const prev = state.sel.id;
      if (folder.id !== prev) state.site.posts.forEach(p => { if (p.folder === prev) p.folder = folder.id; });
      state.sel.id = folder.id;
    }
    renderSidebar();
    schedulePreview();
  });
  void oldId;
  wireEmojiButtons(body);
  $('#btn-delete').onclick = async () => {
    if (await confirmDialog('Delete folder', `Delete folder "${folder.label}"?`)) {
      state.site.folders = state.site.folders.filter(f => f !== folder);
      state.sel = null; renderSidebar(); renderEditor(); updateSaveStatus(); sendPreviewSite();
    }
  };
}

/* ── Shortcut form ───────────────────────────────── */
function renderShortcutForm(sc) {
  if (!sc) { state.sel = null; renderEditor(); return; }
  const body = $('#editor-body');
  body.innerHTML = `
    <div class="card">
      <h2>${esc(sc.icon)} <span id="s-heading">${esc(sc.label || 'New shortcut')}</span><span class="spacer"></span>
        <button class="btn-lite danger" id="btn-delete">Delete</button></h2>
      <div class="row icon">
        <div class="field"><label>Icon</label><div class="with-btn"><input type="text" data-bind="icon" value="${esc(sc.icon)}" id="s-icon" style="text-align:center;font-size:18px"><button class="emoji-btn" data-emoji-for="s-icon" title="Pick emoji">😀</button></div></div>
        <div class="field"><label>Label</label><input type="text" data-bind="label" value="${esc(sc.label)}" autofocus></div>
      </div>
      <div class="row c2">
        <div class="field"><label>URL</label><input type="url" data-bind="url" value="${esc(sc.url)}" placeholder="https://"></div>
        <div class="field"><label>ID</label><input type="text" data-bind="id" value="${esc(sc.id)}" id="s-id" spellcheck="false"></div>
      </div>
    </div>`;
  state.idTouched = sc.id !== '' && sc.id !== slugify(sc.label);
  bindFields(body, sc, key => {
    if (key === 'label') {
      $('#s-heading').textContent = sc.label || 'New shortcut';
      if (!state.idTouched) { sc.id = slugify(sc.label); $('#s-id').value = sc.id; }
    }
    if (key === 'id') state.idTouched = true;
    state.sel.id = sc.id;
    renderSidebar();
    schedulePreview();
  });
  wireEmojiButtons(body);
  $('#btn-delete').onclick = async () => {
    if (await confirmDialog('Delete shortcut', `Delete shortcut "${sc.label}"?`)) {
      state.site.shortcuts = state.site.shortcuts.filter(s => s !== sc);
      state.sel = null; renderSidebar(); renderEditor(); updateSaveStatus(); sendPreviewSite();
    }
  };
}

/* ── Site & social form ──────────────────────────── */
function renderSiteForm() {
  const s = state.site;
  const body = $('#editor-body');
  const socialRows = () => Object.entries(s.social).map(([k, v]) => `
    <div class="social-row" data-key="${esc(k)}">
      <span class="key">${esc(k)}</span>
      <input type="url" data-skey="${esc(k)}" data-sfield="url" value="${esc(v.url)}" placeholder="https://">
      <input type="text" data-skey="${esc(k)}" data-sfield="label" value="${esc(v.label)}" placeholder="Label">
      <button class="mini danger" data-sdel="${esc(k)}" title="Remove">✕</button>
    </div>`).join('');

  body.innerHTML = `
    <div class="card">
      <h2>⚙️ Site</h2>
      <div class="field"><label>Title</label><input type="text" data-bind="title" value="${esc(s.title)}"></div>
      <div class="field"><label>Subtitle</label><input type="text" data-bind="subtitle" value="${esc(s.subtitle)}"></div>
      <div class="field"><label>Public site URL <span class="help" style="display:inline">(used by "Copy link" — stored in this browser only)</span></label>
        <input type="url" id="public-base" value="${esc(localStorage.getItem('publicBase') || '')}" placeholder="https://kristofer.is/"></div>

      <h3>Social links</h3>
      <div id="social-rows">${socialRows()}</div>
      <div class="with-btn" style="max-width:360px">
        <input type="text" id="social-new" placeholder="new key, e.g. youtube" spellcheck="false">
        <button class="btn-lite" id="social-add">Add</button>
      </div>
      <p class="help">Keys <code>github</code>, <code>instagram</code>, <code>linkedin</code> get proper icons on the desktop; others show 🔗.</p>
    </div>`;

  bindFields(body, s, key => { if (key === 'title') $('#brand-title').textContent = s.title; schedulePreview(); });
  $('#public-base').addEventListener('input', e => localStorage.setItem('publicBase', e.target.value.trim()));

  const rows = $('#social-rows');
  rows.addEventListener('input', e => {
    const k = e.target.dataset.skey, f = e.target.dataset.sfield;
    if (!k) return;
    s.social[k][f] = e.target.value;
    updateSaveStatus(); schedulePreview();
  });
  rows.addEventListener('click', async e => {
    const k = e.target.dataset.sdel;
    if (!k) return;
    delete s.social[k];
    rows.innerHTML = socialRows();
    updateSaveStatus(); schedulePreview();
  });
  $('#social-add').onclick = () => {
    const k = slugify($('#social-new').value).replace(/-/g, '');
    if (!k) return;
    if (s.social[k]) return toast('That key already exists', 'err');
    s.social[k] = { url: '', label: k[0].toUpperCase() + k.slice(1) };
    rows.innerHTML = socialRows();
    $('#social-new').value = '';
    updateSaveStatus();
    rows.querySelector(`[data-skey="${k}"]`).focus();
  };
}

/* ── Emoji picker ────────────────────────────────── */
const EMOJI = '🖨️ ⚡ 🔧 🔩 🪛 🛠️ ⚙️ 🧰 🪚 🔨 🪜 🧲 🔋 🔌 💡 🔦 📟 📡 🖥️ 💻 ⌨️ 🖱️ 💾 📀 🧮 🤖 🚀 🛰️ 🔭 🔬 🧪 🧬 🌡️ 📐 📏 ✂️ 🖊️ ✏️ 📝 📚 📖 📁 📂 🗂️ 📦 🎁 🏷️ 🗺️ 🧭 💪 🏋️ 🚴 🏃 ⛺ 🌲 🌿 🪵 🔥 💧 ❄️ 🌍 🏠 🏢 🏭 🧑‍💻 🤵 🧑‍🔧 🧑‍🏫 👾 🎮 🎲 🎯 🎨 🎵 🎸 📷 🎥 📺 📻 ☎️ 📱 🔒 🔑 🛡️ ⭐ ✨ 💎 🏆 🥇 📈 📊 💼 🧾 💰 🛒 🍕 ☕ 🍺 ❤️ 🔗 🔳 🌐 📌 ✅ ⚠️ 🚧 ♻️ 🐙 🐧 🦊'.split(' ');
function wireEmojiButtons(root) {
  $$('[data-emoji-for]', root).forEach(btn => {
    btn.onclick = e => {
      e.preventDefault();
      const input = $('#' + btn.dataset.emojiFor);
      openModal('Pick an icon', `<div class="emoji-grid">${EMOJI.map(x => `<button type="button">${x}</button>`).join('')}</div>
        <p class="help" style="margin-top:10px">Or type/paste any emoji into the field.</p>`);
      $('#modal-body').onclick = ev => {
        const b = ev.target.closest('button');
        if (!b) return;
        input.value = b.textContent;
        input.dispatchEvent(new Event('input', { bubbles: true }));
        closeModal();
      };
    };
  });
}

/* ════════════════════════════════════════════════════
   CREATE NEW ITEMS
   ════════════════════════════════════════════════════ */
function newPost() {
  const folder = (state.sel && state.sel.type === 'post' && findPost(state.sel.id)?.folder)
    || (state.sel && state.sel.type === 'folder' && state.sel.id)
    || (state.site.folders[0] && state.site.folders[0].id) || '';
  if (!folder) return toast('Create a folder first', 'err');
  const post = { id: '', title: '', folder, date: today(), excerpt: '', content: '' };
  state.site.posts.push(post);
  state.sel = { type: 'post', id: '' };
  state.idTouched = false;
  renderSidebar(); renderEditor(); updateSaveStatus();
  $('#editor-body input[data-bind="title"]').focus();
}
function newFolder() {
  const f = { id: '', label: '', icon: '📁' };
  state.site.folders.push(f);
  state.sel = { type: 'folder', id: '' };
  renderSidebar(); renderEditor(); updateSaveStatus();
}
function newShortcut() {
  const sc = { id: '', label: '', icon: '🔗', url: '' };
  state.site.shortcuts.push(sc);
  state.sel = { type: 'shortcut', id: '' };
  renderSidebar(); renderEditor(); updateSaveStatus();
}
$('#btn-new-post').onclick = newPost;
$('#empty-new').onclick = newPost;
$('#btn-new-folder').onclick = newFolder;
$('#btn-new-shortcut').onclick = newShortcut;

/* ════════════════════════════════════════════════════
   PREVIEW
   ════════════════════════════════════════════════════ */
const frame = $('#preview-frame');
let previewTimer = null;

function postToPreview(msg) {
  if (!state.previewReady) return;
  frame.contentWindow.postMessage(msg, location.origin);
}
function sendPreviewSite(focusPostId) {
  postToPreview({ type: 'preview:site', site: state.site, focus: focusPostId });
}
function sendPreviewPost(post) {
  if (!post) return;
  if (!post.id) return sendPreviewSite(); // unnamed yet: nothing to open
  postToPreview({ type: 'preview:post', post });
}
// Debounced: post edits send just the post; structural edits send the whole site.
function schedulePreview(post) {
  clearTimeout(previewTimer);
  previewTimer = setTimeout(() => {
    if (post && post.id) {
      // If the id changed we need a full refresh so old windows close.
      sendPreviewSite(post.id);
    } else {
      sendPreviewSite();
    }
  }, 250);
}

window.addEventListener('message', e => {
  if (e.origin !== location.origin || !e.data) return;
  if (e.data.type === 'preview:ready') {
    state.previewReady = true;
    sendPreviewSite(state.sel && state.sel.type === 'post' ? state.sel.id : undefined);
    if (state.sel && state.sel.type === 'folder') postToPreview({ type: 'preview:open', id: state.sel.id });
  }
});
frame.addEventListener('load', () => { state.previewReady = false; });

$('#btn-preview-reload').onclick = () => { state.previewReady = false; frame.contentWindow.location.reload(); };
$$('.seg button').forEach(b => b.onclick = () => {
  $$('.seg button').forEach(x => x.classList.toggle('on', x === b));
  $('.preview-frame-wrap').classList.toggle('mobile', b.dataset.w === 'mobile');
});

/* ════════════════════════════════════════════════════
   GIT
   ════════════════════════════════════════════════════ */
async function refreshGit() {
  try {
    const st = await api('GET', '/api/git/status');
    state.git = st;
    const chip = $('#git-chip');
    if (!st.available) { chip.textContent = 'git: unavailable'; chip.title = st.error || ''; $('#btn-commit').disabled = $('#btn-push').disabled = true; return; }
    const n = st.dirty.length;
    chip.textContent = `${st.branch} · ${n ? n + ' to commit' : 'clean'}${st.ahead ? ' · ↑' + st.ahead : ''}${st.behind ? ' · ↓' + st.behind : ''}`;
    chip.className = 'status-chip ' + (n ? 'dirty' : 'muted');
    chip.title = (st.last ? `Last: ${st.last.hash} ${st.last.subject} (${st.last.when})\n` : '')
      + st.dirty.join('\n')
      + (st.other ? `\n(${st.other} other changed file${st.other > 1 ? 's' : ''} outside the editor — not staged)` : '');
    $('#btn-commit').disabled = n === 0;
    $('#btn-push').disabled = st.ahead === 0;
    $('#btn-push').textContent = st.ahead ? `Push ↑${st.ahead}` : 'Push';
  } catch (e) {
    $('#git-chip').textContent = 'git: error';
  }
}

$('#btn-commit').onclick = () => {
  if (isDirty() && !confirm('You have unsaved changes that will NOT be included. Commit anyway?')) return;
  const st = state.git || { dirty: [] };
  const selTitle = state.sel && state.sel.type === 'post' && findPost(state.sel.id)?.title;
  const suggestion = selTitle ? `Update post: ${selTitle}` : 'Update site content';
  openModal('Commit changes', `
    <div class="field"><label>Message</label><input type="text" id="commit-msg" value="${esc(suggestion)}"></div>
    <div class="field"><label>Files to be staged (content.js and assets/images)</label>
      <pre style="font:12px var(--mono);background:#f7f8fa;padding:8px;border-radius:6px;max-height:160px;overflow:auto">${esc(st.dirty.join('\n') || '(nothing)')}</pre>
      ${st.other ? `<div class="help">${st.other} other changed file${st.other > 1 ? 's' : ''} (code, styles…) won't be included — commit those from the terminal.</div>` : ''}</div>
    <div class="modal-actions"><button class="btn-lite" id="commit-cancel">Cancel</button><button class="btn-dark" id="commit-go">Commit</button></div>`);
  $('#commit-cancel').onclick = closeModal;
  const go = async () => {
    const message = $('#commit-msg').value.trim();
    if (!message) return;
    $('#commit-go').disabled = true;
    try {
      const r = await api('POST', '/api/git/commit', { message });
      log(r.log); toast('Committed', 'ok'); closeModal();
    } catch (e) {
      log((e.data && e.data.log) || []); toast(e.message, 'err', 5000); $('#commit-go').disabled = false;
    }
    refreshGit();
  };
  $('#commit-go').onclick = go;
  $('#commit-msg').onkeydown = e => { if (e.key === 'Enter') go(); };
  $('#commit-msg').select();
};

$('#btn-push').onclick = async () => {
  const btn = $('#btn-push');
  btn.disabled = true; btn.textContent = 'Pushing…';
  try {
    const r = await api('POST', '/api/git/push');
    log(r.log); toast('Pushed', 'ok');
  } catch (e) {
    log((e.data && e.data.log) || [e.message]); toast(e.message, 'err', 5000);
  }
  refreshGit();
};

$('#btn-log').onclick = () => { $('#log-drawer').hidden = !$('#log-drawer').hidden; };
$('#btn-log-close').onclick = () => { $('#log-drawer').hidden = true; };

/* ════════════════════════════════════════════════════
   GLOBAL KEYS / GUARDS / BOOT
   ════════════════════════════════════════════════════ */
$('#btn-save').onclick = save;
$('#modal-close').onclick = closeModal;
$('#modal').addEventListener('click', e => { if (e.target.id === 'modal') closeModal(); });

document.addEventListener('keydown', e => {
  const mod = e.ctrlKey || e.metaKey;
  if (mod && e.key.toLowerCase() === 's') { e.preventDefault(); if (isDirty()) save(); }
  else if (mod && e.key.toLowerCase() === 'n' && !e.shiftKey) { e.preventDefault(); newPost(); }
  else if (e.key === '/' && !/INPUT|TEXTAREA|SELECT/.test(document.activeElement.tagName)) { e.preventDefault(); $('#search').focus(); }
  else if (e.key === 'Escape') { if (!$('#modal').hidden) closeModal(); else if (document.activeElement === $('#search')) { $('#search').value = ''; renderSidebar(); $('#search').blur(); } }
});

window.addEventListener('beforeunload', e => { if (isDirty()) { e.preventDefault(); e.returnValue = ''; } });

// Whole-window drag hint (uploads go through the textarea / zones)
let dragDepth = 0;
document.addEventListener('dragenter', e => { if (hasFiles(e)) { dragDepth++; $('#drop-hint').hidden = false; } });
document.addEventListener('dragleave', () => { if (--dragDepth <= 0) { dragDepth = 0; $('#drop-hint').hidden = true; } });
document.addEventListener('drop', () => { dragDepth = 0; $('#drop-hint').hidden = true; });
document.addEventListener('dragover', e => { if (hasFiles(e)) e.preventDefault(); });

(async function boot() {
  try {
    await loadSite();
    refreshGit();
    setInterval(refreshGit, 30_000);
  } catch (e) {
    setStatus('Failed to load: ' + e.message, 'error');
  }
})();
