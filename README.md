# Kristofers Desktop — Windows XP Desktop Site

A Windows XP–themed portfolio and blog. Draggable windows, taskbar, Start menu, and desktop icons — all in vanilla HTML, CSS, and JavaScript. No build step, no frameworks, no dependencies.

Content is managed with a small local editor (Go, no dependencies) that gives you a live preview of the real site, image uploads, and one-click git commit/push.

---

## File Structure

```
landing page/
├── index.html       ← page structure
├── style.css        ← XP visual theme (edit for style changes)
├── app.js           ← window manager, desktop logic, deep-link router
├── content.js       ← ✅ ALL CONTENT — written by the editor (JSON inside a JS file)
├── assets/
│   └── images/      ← post images (the editor uploads here)
└── editor/          ← the content editor (run locally, never deployed)
    ├── main.go, store.go, api.go, git.go, migrate.go
    ├── ui/          ← editor front-end (embedded into the binary)
    └── backups/     ← automatic content.js backups (gitignored)
```

Deploy `index.html`, `style.css`, `app.js`, `content.js` and `assets/` to your web host. Do not deploy `editor/`.

---

## Editing Content — the Editor

```bash
cd editor
go run . -open          # builds, starts on http://127.0.0.1:8080 and opens your browser
```

Flags: `-port 8080`, `-content ../content.js`, `-open`, `-deploy-cmd "rsync …"` (run after a successful push), `-migrate` (one-time conversion of an old hand-written content.js).

What you get:

- **Sidebar** — posts grouped by folder (search with `/`), folders, shortcuts, site settings, image library.
- **Post editor** — title (id is auto-slugged), folder, date, excerpt, and an HTML editor with a toolbar (H2/H3, lists, code, links, images, meta line, starter template), Tab indentation, `Ctrl+B/I/K`.
- **Live preview** — the real site, rendered in an iframe with the real CSS. It updates as you type, re-rendering the post window in place. Toggle desktop/mobile width.
- **Images** — drag & drop or paste into the editor; files land in `assets/images/` and an `<img>` tag is inserted at the cursor. The image library shows everything that's there.
- **Save** (`Ctrl+S`) — validates first (unique ids, folder exists, valid date…), keeps a timestamped backup in `editor/backups/`, writes `content.js` atomically. Unsaved changes are flagged and guarded on close.
- **Git** — the status chip shows branch and pending content changes. **Commit…** stages only `content.js` and `assets/images/`; **Push** runs `git push` (and then `-deploy-cmd` if you set one). Output is in the Log drawer.
- **Copy link** — copies the public URL for a post (set your site URL once under *Site & social links*).

The editor listens on 127.0.0.1 only.

### content.js format (if you ever edit it by hand)

`content.js` is `const SITE = { …JSON… };` with a comment header. Any valid JSON edit works; the editor reloads the file automatically if it changes on disk. Post `content` is an HTML string (newlines as `\n`).

```json
{
  "title": "Kristofers Desktop",
  "subtitle": "3D Printing · Electronics · Fabrication · Software",
  "social":    { "github": { "url": "https://github.com/…", "label": "GitHub" } },
  "shortcuts": [ { "id": "gym", "label": "Gym Map", "icon": "💪", "url": "http://…" } ],
  "folders":   [ { "id": "3d-printing", "label": "3D Printing", "icon": "🖨️" } ],
  "posts":     [ { "id": "first-3d-print", "title": "…", "folder": "3d-printing",
                   "date": "2024-01-15", "excerpt": "…", "content": "<h2>…</h2>" } ]
}
```

Rules the editor enforces: ids are lowercase letters, digits and dashes; unique across posts, folders and shortcuts; `about` and `not-found` are reserved; every post's `folder` must exist; dates are `YYYY-MM-DD`. Social keys `github`, `instagram`, `linkedin` get real icons; others show 🔗.

---

## Sharing a Post — Deep Links

Every post, folder and the About window has a URL:

| URL | Opens |
|---|---|
| `https://your.site/#post/first-3d-print` | the post (and its folder behind it on desktop) |
| `https://your.site/#folder/electronics` | a folder window |
| `https://your.site/#about` | My Computer |

The URL follows whichever window is focused, Back/Forward work, and unknown ids show a themed "Not found" window. Each post window has a **🔗 Copy link** button in its status bar.

Limitation: because this is a single static page, link previews (OpenGraph cards) on social media show the site, not the individual post.

---

## Supported HTML Inside Post Content

Post content is plain HTML, so anything goes:

| Element | Example |
|---|---|
| Headings | `<h2>`, `<h3>` |
| Paragraphs | `<p>` |
| Meta line | `<p class="post-meta">📅 June 1, 2025 &nbsp;·&nbsp; 🖨️ 3D Printing</p>` |
| Lists | `<ul>`, `<ol>`, `<li>` |
| Images | `<img src="assets/images/photo.jpg" alt="…">` (scaled to fit automatically) |
| Links | `<a href="https://…" target="_blank" rel="noopener">text</a>` |
| Code blocks | `<pre><code>your code</code></pre>` |
| Bold / italic | `<strong>`, `<em>` |
| Horizontal rule | `<hr>` |

For code that contains `<` or `>` characters, escape them as `&lt;` and `&gt;`.

---

## Hosting

Plain static files — host anywhere:

| Platform | How |
|---|---|
| **Your own server** | Upload `index.html`, `style.css`, `app.js`, `content.js`, `assets/` (e.g. `-deploy-cmd "rsync -av --exclude editor ./ user@host:/var/www/site/"`) |
| **GitHub Pages** | Settings → Pages → deploy from `main` |
| **Netlify / Vercel** | Point at the repo; no build command |

---

## Customising the Look (style.css)

### Change the wallpaper

Find the `#desktop` rule in `style.css` and replace the `background` property:

```css
#desktop { background: #2b4a8b; }                                        /* solid colour */
#desktop { background: url('assets/images/wallpaper.jpg') center/cover; } /* your image  */
```

### Change the accent colour

The CSS variables at the top of `style.css` control the main colours:

```css
:root {
  --xp-blue-hi:  #4EA6FD;   /* title bar highlight */
  --xp-blue-mid: #1A5FD4;   /* title bar mid tone  */
  --xp-blue-lo:  #0E40B0;   /* title bar shadow     */
  --xp-border:   #0831D9;   /* window border        */
  --start-green: #3D8220;   /* Start button         */
}
```

---

## Keyboard Shortcuts

**Site**

| Key | Action |
|---|---|
| `Escape` | Close the Start menu |
| `Enter` / `Space` | Open a focused desktop icon |
| `Tab` | Move between desktop icons |

**Editor**

| Key | Action |
|---|---|
| `Ctrl+S` | Save |
| `Ctrl+N` | New post |
| `/` | Focus search |
| `Ctrl+B` / `Ctrl+I` / `Ctrl+K` | Bold / italic / link (in the HTML editor) |
| `Tab` / `Shift+Tab` | Indent / outdent |

---

## Development notes

- `editor/` has Go table tests for the content store and migration: `cd editor && go test ./...`
- The site's deep-link router and the editor's preview hook live in `app.js` (`ROUTER` and `EDITOR LIVE PREVIEW` sections). The preview hook only activates when the page is loaded as `?preview=1` inside an iframe.
- Desktop shortcuts (icons that open a URL) are just entries in `shortcuts` — no code changes needed.
