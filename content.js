/**
 * ╔══════════════════════════════════════════════════════╗
 * ║           content.js  —  YOUR CONTENT FILE           ║
 * ╚══════════════════════════════════════════════════════╝
 *
 * This file is written by the site editor (editor/). Run it with:
 *     cd editor && go run . -open
 *
 * The data below is plain JSON assigned to a global, so it is also safe to
 * edit by hand — just keep it valid JSON.
 */

const SITE = {
  "title": "Kristofers Desktop",
  "subtitle": "3D Printing · Electronics · Fabrication · Software",
  "social": {
    "github": {
      "url": "https://github.com/krissibt",
      "label": "GitHub"
    },
    "instagram": {
      "url": "https://instagram.com/kristoferHenry",
      "label": "Instagram"
    },
    "linkedin": {
      "url": "https://linkedin.com/in/kristofer-henry-aa2963165",
      "label": "LinkedIn"
    }
  },
  "shortcuts": [
    {
      "id": "gym",
      "label": "Gym Map",
      "icon": "💪",
      "url": "http://kristofer.is/gymMap/"
    },
    {
      "id": "qr",
      "label": "Open source qr code generator",
      "icon": "🪛",
      "url": "http://kristofer.is/qr/"
    }
  ],
  "folders": [
    {
      "id": "3d-printing",
      "label": "3D Printing",
      "icon": "🖨️"
    },
    {
      "id": "electronics",
      "label": "Electronics",
      "icon": "⚡"
    },
    {
      "id": "fabrication",
      "label": "Fabrication",
      "icon": "🔧"
    },
    {
      "id": "kristofer",
      "label": "Kristofer",
      "icon": "🤵"
    }
  ],
  "posts": [
    {
      "id": "first-3d-print",
      "title": "My First 3D Print",
      "folder": "3d-printing",
      "date": "2024-01-15",
      "excerpt": "Getting started with the Ender 3 and what I wish I'd known.",
      "content": "<h2>My First 3D Print</h2>\n        <p class=\"post-meta\">📅 January 15, 2024 &nbsp;·&nbsp; 🖨️ 3D Printing</p>\n        <p>After months of deliberating I finally pulled the trigger on an Ender 3.\n        Setting it up was straightforward — the community documentation is fantastic.</p>\n\n        <h3>What I Learned</h3>\n        <ul>\n          <li>Bed leveling is everything — take your time and do it right</li>\n          <li>First-layer settings matter more than anything else</li>\n          <li>PLA is extremely forgiving for beginners</li>\n          <li>The community Cura profiles are a great starting point</li>\n        </ul>\n\n        <p>My first successful print was a simple cable clip. Doesn't sound exciting,\n        but watching a 3D object appear layer by layer for the first time is genuinely magical.</p>\n\n        <h3>Next Steps</h3>\n        <p>Now that the machine is dialed in, I want to print functional parts —\n        brackets, enclosures, custom tooling. Stay tuned.</p>"
    },
    {
      "id": "ender3-mods",
      "title": "Essential Ender 3 Mods",
      "folder": "3d-printing",
      "date": "2024-02-05",
      "excerpt": "The upgrades that actually make a difference.",
      "content": "<h2>Essential Ender 3 Mods</h2>\n        <p class=\"post-meta\">📅 February 5, 2024 &nbsp;·&nbsp; 🖨️ 3D Printing</p>\n\n        <p>After a month of printing I've landed on the mods that genuinely improve the machine.</p>\n\n        <h3>Printed Mods</h3>\n        <ul>\n          <li><strong>Cable strain relief</strong> — the stock wiring is a disaster waiting to happen</li>\n          <li><strong>Filament guide</strong> — smooth the path to the extruder</li>\n          <li><strong>Pi camera mount</strong> — for OctoPrint remote monitoring</li>\n        </ul>\n\n        <h3>Purchased Upgrades</h3>\n        <ul>\n          <li><strong>PEI spring steel sheet</strong> — prints pop right off when cool, zero adhesion issues</li>\n          <li><strong>All-metal hotend</strong> — needed for higher-temp materials</li>\n          <li><strong>Capricorn PTFE tube</strong> — tighter tolerance, better retraction</li>\n        </ul>"
    },
    {
      "id": "arduino-led-matrix",
      "title": "Arduino LED Matrix Display",
      "folder": "electronics",
      "date": "2024-02-20",
      "excerpt": "Building a scrolling text display with a MAX7219 8×8 LED matrix.",
      "content": "<h2>Arduino LED Matrix Display</h2>\n        <p class=\"post-meta\">📅 February 20, 2024 &nbsp;·&nbsp; ⚡ Electronics</p>\n\n        <p>I needed a desk display that could scroll messages. The MAX7219 LED matrix module\n        is perfect — cheap, easy to wire, and the LedControl library handles all the heavy lifting.</p>\n\n        <h3>Parts List</h3>\n        <ul>\n          <li>Arduino Uno (or clone)</li>\n          <li>MAX7219 8×8 LED matrix module (~$2 on AliExpress)</li>\n          <li>3 jumper wires</li>\n        </ul>\n\n        <h3>Wiring</h3>\n        <p>VCC → 5V, GND → GND, DIN → D12, CLK → D11, CS → D10</p>\n\n        <h3>Code</h3>\n        <pre><code>#include &lt;LedControl.h&gt;\n// DIN=12, CLK=11, CS=10, 1 matrix\nLedControl lc = LedControl(12, 11, 10, 1);\n\nvoid setup() {\n  lc.shutdown(0, false);\n  lc.setIntensity(0, 8);\n  lc.clearDisplay(0);\n}\n\nvoid loop() {\n  // Scroll your message here\n}</code></pre>\n\n        <p>Total cost: about $5. Works great as a build status indicator.</p>"
    },
    {
      "id": "laser-cut-enclosure",
      "title": "Laser-Cut Project Enclosure",
      "folder": "fabrication",
      "date": "2024-03-10",
      "excerpt": "Designing and cutting a custom electronics enclosure from 3mm MDF.",
      "content": "<h2>Laser-Cut Project Enclosure</h2>\n        <p class=\"post-meta\">📅 March 10, 2024 &nbsp;·&nbsp; 🔧 Fabrication</p>\n\n        <p>After breadboarding my LED controller I needed a proper enclosure.\n        I designed one in Inkscape and had it cut from 3mm MDF at a local makerspace.</p>\n\n        <h3>Design Tips</h3>\n        <ul>\n          <li>Add 0.1–0.2 mm kerf compensation to your slots for a snug fit</li>\n          <li>Finger joints every 15–20 mm give good strength without glue</li>\n          <li>Countersink screw holes look much cleaner than surface-mounted hardware</li>\n          <li>Leave 3mm clearance around PCB mounting holes for assembly access</li>\n        </ul>\n\n        <h3>Finishing</h3>\n        <p>Two coats of spray primer followed by matte black paint.\n        Laser-cut MDF soaks up paint fast — primer is essential.</p>\n\n        <p>Total material cost: ~$8. Way better than a generic plastic enclosure.</p>"
    },
    {
      "id": "job-munasafn",
      "title": "Munasafn RVK Tool Library",
      "folder": "kristofer",
      "date": "2021-03-01",
      "excerpt": "Technical Lead · Chief Technology Officer · 5 yrs 2 months",
      "content": "<h2>Munasafn RVK Tool Library</h2>\n        <p class=\"post-meta\">📍 Reykjavík, Iceland &nbsp;·&nbsp; 5 years 2 months</p>\n\n        <h3>Chief Technology Officer</h3>\n        <p class=\"post-meta\">August 2022 – Present</p>\n        <p>Leading the technical direction of the organisation — architecture decisions,\n        infrastructure, and tooling across all digital systems.</p>\n\n        <h3>Technical Lead</h3>\n        <p class=\"post-meta\">March 2021 – Present</p>\n        <p>Hands-on technical leadership: building and maintaining the platforms that\n        power the tool library's operations and member-facing services.</p>"
    },
    {
      "id": "job-hopp",
      "title": "Hopp",
      "folder": "kristofer",
      "date": "2019-05-01",
      "excerpt": "Head of Engineering · Franchise Consultant · 2 yrs 5 months",
      "content": "<h2>Hopp</h2>\n        <p class=\"post-meta\">📍 Reykjavík, Iceland &nbsp;·&nbsp; 2 years 5 months</p>\n\n        <h3>Head of Engineering</h3>\n        <p class=\"post-meta\">May 2019 – May 2021</p>\n        <p>Built and led the engineering team at Hopp, overseeing product development\n        and technical operations across the platform.</p>\n\n        <h3>Franchise Consultant</h3>\n        <p class=\"post-meta\">May 2021 – September 2021</p>\n        <p>Advised on technical requirements and processes for franchise operations\n        following the transition from the engineering leadership role.</p>"
    },
    {
      "id": "job-innovation-center",
      "title": "Innovation Center Iceland",
      "folder": "kristofer",
      "date": "2019-01-01",
      "excerpt": "Technical Specialist · 5 months",
      "content": "<h2>Innovation Center Iceland</h2>\n        <p class=\"post-meta\">📍 Iceland &nbsp;·&nbsp; 5 months</p>\n\n        <h3>Technical Specialist</h3>\n        <p class=\"post-meta\">January 2019 – May 2019</p>\n        <p>Provided programming and IT support for Verksmiðjan — an innovation\n        competition for children aged 13 to 16. Helped young participants bring\n        their project ideas to life through hands-on technical guidance.</p>"
    },
    {
      "id": "job-advania",
      "title": "Advania Data Centers",
      "folder": "kristofer",
      "date": "2017-08-01",
      "excerpt": "Technician · 1 yr 6 months",
      "content": "<h2>Advania Data Centers</h2>\n        <p class=\"post-meta\">📍 Iceland &nbsp;·&nbsp; 1 year 6 months</p>\n\n        <h3>Technician</h3>\n        <p class=\"post-meta\">August 2017 – January 2019</p>\n        <p>Data center operations and technical maintenance at one of Iceland's\n        leading data center providers.</p>"
    },
    {
      "id": "job-koder",
      "title": "Kóder",
      "folder": "kristofer",
      "date": "2016-02-01",
      "excerpt": "Teacher · Vice Chairman · 3 years",
      "content": "<h2>Kóder</h2>\n        <p class=\"post-meta\">📍 Iceland &nbsp;·&nbsp; 3 years</p>\n\n        <h3>Vice Chairman</h3>\n        <p class=\"post-meta\">June 2017 – January 2019</p>\n        <p>Board-level role helping shape the direction of Kóder's programmes\n        and community initiatives.</p>\n\n        <h3>Teacher</h3>\n        <p class=\"post-meta\">February 2016 – January 2019</p>\n        <p>Teaching programming and technology skills as part of Kóder's\n        mission to spread coding education in Iceland.</p>"
    },
    {
      "id": "job-genesis",
      "title": "Genesis Mining",
      "folder": "kristofer",
      "date": "2016-04-01",
      "excerpt": "Technician · 1 yr 5 months",
      "content": "<h2>Genesis Mining</h2>\n        <p class=\"post-meta\">📍 Iceland &nbsp;·&nbsp; 1 year 5 months</p>\n\n        <h3>Technician</h3>\n        <p class=\"post-meta\">April 2016 – August 2017</p>\n        <p>Hardware operations and maintenance at one of the world's largest\n        cloud mining operations, based in Iceland.</p>"
    }
  ]
}; // ← end of SITE config
