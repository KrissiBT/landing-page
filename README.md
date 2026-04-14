# MuhCodes Workshop — Windows XP Desktop Site

A Windows XP–themed portfolio and blog. Draggable windows, taskbar, Start menu, and desktop icons — all in vanilla HTML, CSS, and JavaScript. No build step, no frameworks, no dependencies.

---

## File Structure

```
landing page/
├── index.html       ← page structure (don't edit this)
├── style.css        ← XP visual theme (edit for style changes)
├── app.js           ← window manager & desktop logic (don't edit unless adding features)
├── content.js       ← ✅ YOUR FILE — edit this to update all content
└── assets/
    └── images/      ← drop your post images here
```

**You only need to edit `content.js`** for all normal content updates.

---

## content.js Quick Reference

### 1 — Change your site title

```js
title: "MuhCodes Workshop",
subtitle: "3D Printing · Electronics · Fabrication",
```

### 2 — Update social media links

```js
social: {
  github:    { url: "https://github.com/yourname",    label: "GitHub"    },
  instagram: { url: "https://instagram.com/yourname", label: "Instagram" },
  linkedin:  { url: "https://linkedin.com/in/yourname", label: "LinkedIn" },
},
```

Set any entry to `null` to hide that icon from the desktop:

```js
linkedin: null,   // hides LinkedIn icon
```

### 3 — Add a new project category (folder)

Add an object to the `folders` array. The `id` must be unique and contain no spaces.

```js
folders: [
  { id: "3d-printing", label: "3D Printing", icon: "🖨️" },
  { id: "electronics", label: "Electronics", icon: "⚡"  },
  { id: "cnc",         label: "CNC Routing", icon: "🪚" },  // ← new folder
],
```

A new desktop icon appears automatically.

### 4 — Add a new blog post

Copy and paste one of the existing post objects in the `posts` array and fill it in:

```js
{
  id:      "my-new-post",          // unique, no spaces
  title:   "My Post Title",
  folder:  "3d-printing",          // must match a folder id above
  date:    "2025-06-01",           // YYYY-MM-DD
  excerpt: "One-line summary shown in the folder list.",
  content: `
    <h2>My Post Title</h2>
    <p class="post-meta">📅 June 1, 2025 &nbsp;·&nbsp; 🖨️ 3D Printing</p>

    <p>Your content here. Full HTML is supported.</p>

    <h3>A Sub-heading</h3>
    <ul>
      <li>Bullet point</li>
      <li>Another point</li>
    </ul>
  `
},
```

---

## Adding Images to Posts

1. Drop the image into `assets/images/`
2. Reference it inside a post's `content` field:

```html
<img src="assets/images/my-photo.jpg" alt="Description" style="max-width:100%;border-radius:4px">
```

---

## Supported HTML Inside Post Content

Since post content is plain HTML, you can use anything:

| Element | Example |
|---|---|
| Headings | `<h2>`, `<h3>` |
| Paragraphs | `<p>` |
| Lists | `<ul>`, `<ol>`, `<li>` |
| Images | `<img src="assets/images/...">` |
| Links | `<a href="https://...">text</a>` |
| Code blocks | `<pre><code>your code</code></pre>` |
| Bold / italic | `<strong>`, `<em>` |
| Horizontal rule | `<hr>` |

For code that contains `<` or `>` characters, escape them:
- `<` → `&lt;`
- `>` → `&gt;`

---

## Hosting

Because this is plain HTML/CSS/JS with no build step, you can host it anywhere:

| Platform | How |
|---|---|
| **GitHub Pages** | Push to a repo → Settings → Pages → deploy from `main` |
| **Netlify** | Drag the folder into [netlify.com/drop](https://app.netlify.com/drop) |
| **Vercel** | `vercel` CLI in the project folder |
| **Any web host** | Upload all files via FTP/SFTP |

---

## Customising the Look (style.css)

### Change the wallpaper

Find the `#desktop` rule in `style.css` and replace the `background` property with any CSS value:

```css
/* Solid colour */
#desktop { background: #2b4a8b; }

/* Your own image */
#desktop { background: url('assets/images/wallpaper.jpg') center/cover; }
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

| Key | Action |
|---|---|
| `Escape` | Close the Start menu |
| `Enter` / `Space` | Open a focused desktop icon |
| `Tab` | Move between desktop icons |

---

## Adding a New Desktop Icon (non-folder)

To add a custom icon that opens anything — a link, an about page, etc. — edit the `renderDesktop()` function in `app.js`:

```js
// After the social icons block, add:
container.appendChild(makeIcon('🗂️', 'My Label', () => {
  // anything here — open a window, navigate to a URL, etc.
  window.open('https://example.com', '_blank');
}));
```
