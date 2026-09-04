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
    },
    {
      "id": "meshcore-line-of-sight-map",
      "label": "Meshcore line of sight map ",
      "icon": "📡",
      "url": "https://krissibt.github.io/LOSmap/"
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
      "id": "kristofer",
      "label": "Kristofer",
      "icon": "🤵"
    },
    {
      "id": "random-stuff",
      "label": "Random Stuff",
      "icon": "📁"
    }
  ],
  "posts": [
    {
      "id": "arduino-led-matrix",
      "title": "My first pcb",
      "folder": "electronics",
      "date": "2019-12-19",
      "excerpt": "Building a scrolling text display with a MAX7219 8×8 LED matrix.",
      "content": "<h2>ESP LED Matrix Display</h2>\n<p>this is my first ever pcb </p>\n<img src=\"assets/images/pasted-1787273156830.png\" alt=\"\">\n"
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
    },
    {
      "id": "minecraft-compass",
      "title": "Minecraft compass",
      "folder": "3d-printing",
      "date": "2025-06-24",
      "excerpt": "A Compass that finds your bed or your buddy ",
      "content": "<h2>Minecraft compass</h2>\n<p class=\"post-meta\">📅 August 21, 2026 &nbsp;·&nbsp; 🖨️ 3D Printing</p>\n\n<p>The Minecraft compass is an iconic item that always points you back to your spawn point. I wanted to bring this into the real world, not just as a static prop, but as a fully functional navigation tool that guides you to a designated target.</p>\n\n<h3>Functionality</h3>\n<img src=\"assets/images/pasted-1787271902130.png\" alt=\"Minecraft Compass Design\">\n\n<p>\nThe Minecraft compass works by utilizing the Seeed Studio XIAO ESP32 (<a href=\"https://www.seeedstudio.com/Seeed-Studio-XIAO-ESP32C5-p-6609.html\" target=\"_blank\" rel=\"noopener\">https://www.seeedstudio.com/Seeed-Studio-XIAO-ESP32C5-p-6609.html</a>) and the ESP-NOW protocol. ESP-NOW is a connectionless Wi-Fi communication protocol that allows multiple ESP32 boards to talk to each other instantly without needing a router. This means we can have a target node broadcasting its coordinates directly to the compass in real-time.\n</p>\n\n<p><strong>The Hardware Stack:</strong></p>\n<ul>\n  <li><strong>The Brains:</strong> XIAO ESP32-C5 (compact enough to hide inside the prop while packing enough power for Wi-Fi and complex LED math).</li>\n  <li><strong>The Magnetometer (QMC5883L):</strong> To know which way the compass is currently facing in the real world, we need a digital compass sensor to read magnetic north.</li>\n  <li><strong>The Location Data (GPS):</strong> The compass calculates the distance and angle between its current location and the target location (either via a built-in GPS module or a companion phone app).</li>\n</ul>\n<img src=\"assets/images/pasted-1787272944901.png\" alt=\"\">\n\n\n<h3>The Display Illusion</h3>\n<p>\nInstead of using a mechanical motor or slapping a standard LCD screen on top, I wanted this to feel authentic to the game's aesthetic.\n</p>\n\n<p>\nThe display uses a custom grid of addressable LEDs (like WS2812Bs) arranged perfectly to match the pixels of the in-game compass. Over the top of these LEDs sits a layer of semi-transparent, diffused glass (or acrylic). When the LEDs light up in the shape of the red and gray needle, the diffusion blends the light so it looks exactly like the shifting pixels of the in-game item. As you turn around, the code updates which LEDs are illuminated, making the needle \"spin\" across the pixel grid.\n</p>\n\n<h3>The Math Behind the Magic</h3>\n<p>To make the needle point at our target, the system performs three operations continuously:</p>\n<ol>\n  <li><strong>Calculate Bearing:</strong> Use the Haversine formula to find the absolute angle between our current GPS coordinates and the target's GPS coordinates.</li>\n  <li><strong>Read Heading:</strong> Read the QMC5883L magnetometer to figure out which direction the compass itself is currently pointing relative to true North.</li>\n  <li><strong>Find the Difference:</strong> Subtract our heading from the target bearing to get the <em>relative angle</em>. We then map this angle (0–360 degrees) to our specific LED layout to light up the correct pixels.</li>\n</ol>\n\n<h3>Closing Thoughts</h3>\n<p>\nMerging 3D printing, custom LED matrices, and wireless geolocation into a handheld prop has been an incredible challenge. Whether we end up pulling the GPS data from a dedicated module or offloading that heavy lifting to a smartphone, the core illusion remains exactly the same. It feels like holding a piece of the game right in the palm of your hand.\n</p>"
    },
    {
      "id": "font",
      "title": "Font",
      "folder": "random-stuff",
      "date": "2026-09-04",
      "excerpt": "",
      "content": "<h1>I needed a font for branding my leatherman so i had claude help me generate one </h1>\n<img src=\"assets/images/preview.png\" alt=\"\">\nlink here <a href=\"http://kristofer.is/MultitoolHeavy.ttf\" target=\"_blank\" rel=\"noopener\">Multi tool heavy </a>"
    }
  ]
}; // ← end of SITE config
