/**
 * ╔══════════════════════════════════════════════════════╗
 * ║           content.js  —  YOUR CONTENT FILE           ║
 * ╚══════════════════════════════════════════════════════╝
 *
 * This is the ONLY file you need to edit to:
 *   • Change your name / site title
 *   • Update social media links
 *   • Add new project categories (desktop folders)
 *   • Add new blog posts
 *
 * ── HOW TO ADD A NEW POST ────────────────────────────
 *  1. Copy one of the post objects below
 *  2. Give it a unique `id`  (no spaces — use-dashes)
 *  3. Set `folder` to match one of your folder ids
 *  4. Write content as HTML in the `content` field
 *     Images:  <img src="assets/images/my-photo.jpg">
 *     Code:    <pre><code>your code here</code></pre>
 *  5. Save — done!
 * ─────────────────────────────────────────────────────
 */

const SITE = {

  // ── Site identity ────────────────────────────────────
  title: "MuhCodes Workshop",
  subtitle: "3D Printing · Electronics · Fabrication",

  // ── Social media ─────────────────────────────────────
  // Set any value to null to hide that icon from the desktop
  social: {
    github:    { url: "https://github.com/krissibt",          label: "GitHub"    },
    instagram: { url: "https://instagram.com/kristoferHenry",       label: "Instagram" },
    linkedin:  { url: "https://linkedin.com/in/kristofer-henry-aa2963165",     label: "LinkedIn"  },
  },

  // ── External link shortcuts ──────────────────────────
  // Each shortcut shows up as a desktop icon that opens a URL.
  shortcuts: [
    { id: "qr-site", label: "QR Generator", icon: "🔳", url: "http://kristofer.is/qr/" },
  ],

  // ── Desktop folders (project categories) ─────────────
  // Each folder shows up as an icon on the desktop.
  // Clicking it opens a window listing all posts in that folder.
  folders: [
    { id: "3d-printing",  label: "3D Printing",  icon: "🖨️" },
    { id: "electronics",  label: "Electronics",  icon: "⚡"  },
    { id: "fabrication",  label: "Fabrication",  icon: "🔧" },
    { id: "kristofer",  label: "Kristofer",  icon: "🤵"  },
  ],

  // ── Blog posts ────────────────────────────────────────
  posts: [
    {
      id:      "first-3d-print",
      title:   "My First 3D Print",
      folder:  "3d-printing",
      date:    "2024-01-15",
      excerpt: "Getting started with the Ender 3 and what I wish I'd known.",
      content: `
        <h2>My First 3D Print</h2>
        <p class="post-meta">📅 January 15, 2024 &nbsp;·&nbsp; 🖨️ 3D Printing</p>
        <p>After months of deliberating I finally pulled the trigger on an Ender 3.
        Setting it up was straightforward — the community documentation is fantastic.</p>

        <h3>What I Learned</h3>
        <ul>
          <li>Bed leveling is everything — take your time and do it right</li>
          <li>First-layer settings matter more than anything else</li>
          <li>PLA is extremely forgiving for beginners</li>
          <li>The community Cura profiles are a great starting point</li>
        </ul>

        <p>My first successful print was a simple cable clip. Doesn't sound exciting,
        but watching a 3D object appear layer by layer for the first time is genuinely magical.</p>

        <h3>Next Steps</h3>
        <p>Now that the machine is dialed in, I want to print functional parts —
        brackets, enclosures, custom tooling. Stay tuned.</p>
      `
    },

    {
      id:      "ender3-mods",
      title:   "Essential Ender 3 Mods",
      folder:  "3d-printing",
      date:    "2024-02-05",
      excerpt: "The upgrades that actually make a difference.",
      content: `
        <h2>Essential Ender 3 Mods</h2>
        <p class="post-meta">📅 February 5, 2024 &nbsp;·&nbsp; 🖨️ 3D Printing</p>

        <p>After a month of printing I've landed on the mods that genuinely improve the machine.</p>

        <h3>Printed Mods</h3>
        <ul>
          <li><strong>Cable strain relief</strong> — the stock wiring is a disaster waiting to happen</li>
          <li><strong>Filament guide</strong> — smooth the path to the extruder</li>
          <li><strong>Pi camera mount</strong> — for OctoPrint remote monitoring</li>
        </ul>

        <h3>Purchased Upgrades</h3>
        <ul>
          <li><strong>PEI spring steel sheet</strong> — prints pop right off when cool, zero adhesion issues</li>
          <li><strong>All-metal hotend</strong> — needed for higher-temp materials</li>
          <li><strong>Capricorn PTFE tube</strong> — tighter tolerance, better retraction</li>
        </ul>
      `
    },

    {
      id:      "arduino-led-matrix",
      title:   "Arduino LED Matrix Display",
      folder:  "electronics",
      date:    "2024-02-20",
      excerpt: "Building a scrolling text display with a MAX7219 8×8 LED matrix.",
      content: `
        <h2>Arduino LED Matrix Display</h2>
        <p class="post-meta">📅 February 20, 2024 &nbsp;·&nbsp; ⚡ Electronics</p>

        <p>I needed a desk display that could scroll messages. The MAX7219 LED matrix module
        is perfect — cheap, easy to wire, and the LedControl library handles all the heavy lifting.</p>

        <h3>Parts List</h3>
        <ul>
          <li>Arduino Uno (or clone)</li>
          <li>MAX7219 8×8 LED matrix module (~$2 on AliExpress)</li>
          <li>3 jumper wires</li>
        </ul>

        <h3>Wiring</h3>
        <p>VCC → 5V, GND → GND, DIN → D12, CLK → D11, CS → D10</p>

        <h3>Code</h3>
        <pre><code>#include &lt;LedControl.h&gt;
// DIN=12, CLK=11, CS=10, 1 matrix
LedControl lc = LedControl(12, 11, 10, 1);

void setup() {
  lc.shutdown(0, false);
  lc.setIntensity(0, 8);
  lc.clearDisplay(0);
}

void loop() {
  // Scroll your message here
}</code></pre>

        <p>Total cost: about $5. Works great as a build status indicator.</p>
      `
    },

    {
      id:      "laser-cut-enclosure",
      title:   "Laser-Cut Project Enclosure",
      folder:  "fabrication",
      date:    "2024-03-10",
      excerpt: "Designing and cutting a custom electronics enclosure from 3mm MDF.",
      content: `
        <h2>Laser-Cut Project Enclosure</h2>
        <p class="post-meta">📅 March 10, 2024 &nbsp;·&nbsp; 🔧 Fabrication</p>

        <p>After breadboarding my LED controller I needed a proper enclosure.
        I designed one in Inkscape and had it cut from 3mm MDF at a local makerspace.</p>

        <h3>Design Tips</h3>
        <ul>
          <li>Add 0.1–0.2 mm kerf compensation to your slots for a snug fit</li>
          <li>Finger joints every 15–20 mm give good strength without glue</li>
          <li>Countersink screw holes look much cleaner than surface-mounted hardware</li>
          <li>Leave 3mm clearance around PCB mounting holes for assembly access</li>
        </ul>

        <h3>Finishing</h3>
        <p>Two coats of spray primer followed by matte black paint.
        Laser-cut MDF soaks up paint fast — primer is essential.</p>

        <p>Total material cost: ~$8. Way better than a generic plastic enclosure.</p>
      `
    },

    // ── Kristofer folder — one post per job ──────────────────────────────
    {
      id:      "job-munasafn",
      title:   "Munasafn RVK Tool Library",
      folder:  "kristofer",
      date:    "2021-03-01",
      excerpt: "Technical Lead · Chief Technology Officer · 5 yrs 2 months",
      content: `
        <h2>Munasafn RVK Tool Library</h2>
        <p class="post-meta">📍 Reykjavík, Iceland &nbsp;·&nbsp; 5 years 2 months</p>

        <h3>Chief Technology Officer</h3>
        <p class="post-meta">August 2022 – Present</p>
        <p>Leading the technical direction of the organisation — architecture decisions,
        infrastructure, and tooling across all digital systems.</p>

        <h3>Technical Lead</h3>
        <p class="post-meta">March 2021 – Present</p>
        <p>Hands-on technical leadership: building and maintaining the platforms that
        power the tool library's operations and member-facing services.</p>
      `
    },

    {
      id:      "job-hopp",
      title:   "Hopp",
      folder:  "kristofer",
      date:    "2019-05-01",
      excerpt: "Head of Engineering · Franchise Consultant · 2 yrs 5 months",
      content: `
        <h2>Hopp</h2>
        <p class="post-meta">📍 Reykjavík, Iceland &nbsp;·&nbsp; 2 years 5 months</p>

        <h3>Head of Engineering</h3>
        <p class="post-meta">May 2019 – May 2021</p>
        <p>Built and led the engineering team at Hopp, overseeing product development
        and technical operations across the platform.</p>

        <h3>Franchise Consultant</h3>
        <p class="post-meta">May 2021 – September 2021</p>
        <p>Advised on technical requirements and processes for franchise operations
        following the transition from the engineering leadership role.</p>
      `
    },

    {
      id:      "job-innovation-center",
      title:   "Innovation Center Iceland",
      folder:  "kristofer",
      date:    "2019-01-01",
      excerpt: "Technical Specialist · 5 months",
      content: `
        <h2>Innovation Center Iceland</h2>
        <p class="post-meta">📍 Iceland &nbsp;·&nbsp; 5 months</p>

        <h3>Technical Specialist</h3>
        <p class="post-meta">January 2019 – May 2019</p>
        <p>Provided programming and IT support for Verksmiðjan — an innovation
        competition for children aged 13 to 16. Helped young participants bring
        their project ideas to life through hands-on technical guidance.</p>
      `
    },

    {
      id:      "job-advania",
      title:   "Advania Data Centers",
      folder:  "kristofer",
      date:    "2017-08-01",
      excerpt: "Technician · 1 yr 6 months",
      content: `
        <h2>Advania Data Centers</h2>
        <p class="post-meta">📍 Iceland &nbsp;·&nbsp; 1 year 6 months</p>

        <h3>Technician</h3>
        <p class="post-meta">August 2017 – January 2019</p>
        <p>Data center operations and technical maintenance at one of Iceland's
        leading data center providers.</p>
      `
    },

    {
      id:      "job-koder",
      title:   "Kóder",
      folder:  "kristofer",
      date:    "2016-02-01",
      excerpt: "Teacher · Vice Chairman · 3 years",
      content: `
        <h2>Kóder</h2>
        <p class="post-meta">📍 Iceland &nbsp;·&nbsp; 3 years</p>

        <h3>Vice Chairman</h3>
        <p class="post-meta">June 2017 – January 2019</p>
        <p>Board-level role helping shape the direction of Kóder's programmes
        and community initiatives.</p>

        <h3>Teacher</h3>
        <p class="post-meta">February 2016 – January 2019</p>
        <p>Teaching programming and technology skills as part of Kóder's
        mission to spread coding education in Iceland.</p>
      `
    },

    {
      id:      "job-genesis",
      title:   "Genesis Mining",
      folder:  "kristofer",
      date:    "2016-04-01",
      excerpt: "Technician · 1 yr 5 months",
      content: `
        <h2>Genesis Mining</h2>
        <p class="post-meta">📍 Iceland &nbsp;·&nbsp; 1 year 5 months</p>

        <h3>Technician</h3>
        <p class="post-meta">April 2016 – August 2017</p>
        <p>Hardware operations and maintenance at one of the world's largest
        cloud mining operations, based in Iceland.</p>
      `
    },

  ],

}; // ← end of SITE config
