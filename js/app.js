/* ==========================================================================
   COLOR PALETTE GENERATOR — app logic
   Generates harmonious 5-color palettes, locks, copy-to-clipboard,
   and contrast-safe text preview (WCAG relative luminance).
   ========================================================================== */
(function () {
  "use strict";

  var paletteEl = document.getElementById("palette");
  var previewEl = document.getElementById("preview-row");
  var randomizeBtn = document.getElementById("randomize-btn");
  var copyAllBtn = document.getElementById("copy-all-btn");
  var toastEl = document.getElementById("toast");
  var header = document.getElementById("site-header");
  var navToggle = document.getElementById("nav-toggle");
  var mobileMenu = document.getElementById("mobile-menu");

  var palette = []; // { hex, locked }
  var toastTimer = null;

  /* ---------- Color math ---------- */

  function hslToHex(h, s, l) {
    h = ((h % 360) + 360) % 360;
    s = Math.max(0, Math.min(100, s)) / 100;
    l = Math.max(0, Math.min(100, l)) / 100;
    var c = (1 - Math.abs(2 * l - 1)) * s;
    var x = c * (1 - Math.abs(((h / 60) % 2) - 1));
    var m = l - c / 2;
    var r = 0, g = 0, b = 0;
    if (h < 60) { r = c; g = x; b = 0; }
    else if (h < 120) { r = x; g = c; b = 0; }
    else if (h < 180) { r = 0; g = c; b = x; }
    else if (h < 240) { r = 0; g = x; b = c; }
    else if (h < 300) { r = x; g = 0; b = c; }
    else { r = c; g = 0; b = x; }
    function toHex(v) {
      var n = Math.round((v + m) * 255);
      var hex = n.toString(16);
      return hex.length === 1 ? "0" + hex : hex;
    }
    return ("#" + toHex(r) + toHex(g) + toHex(b)).toUpperCase();
  }

  function hexToRgb(hex) {
    var n = parseInt(hex.slice(1), 16);
    return { r: (n >> 16) & 255, g: (n >> 8) & 255, b: n & 255 };
  }

  // WCAG relative luminance, 0 (black) .. 1 (white)
  function luminance(hex) {
    var rgb = hexToRgb(hex);
    function channel(v) {
      v = v / 255;
      return v <= 0.03928 ? v / 12.92 : Math.pow((v + 0.055) / 1.055, 2.4);
    }
    return 0.2126 * channel(rgb.r) + 0.7152 * channel(rgb.g) + 0.0722 * channel(rgb.b);
  }

  // Readable text color for a background: dark ink on light colors, cream on dark.
  function textColorFor(hex) {
    return luminance(hex) > 0.45 ? "#1a1206" : "#fff6e9";
  }

  /* ---------- Palette generation ---------- */

  function randomPalette() {
    var baseHue = Math.floor(Math.random() * 360);
    var scheme = Math.floor(Math.random() * 3); // 0 analogous, 1 complementary, 2 triadic
    var hues = [];
    var i;
    if (scheme === 0) {
      for (i = 0; i < 5; i++) hues.push(baseHue + i * 18 - 36);
    } else if (scheme === 1) {
      hues = [baseHue, baseHue + 24, baseHue + 180, baseHue + 204, baseHue + 155];
    } else {
      hues = [baseHue, baseHue + 32, baseHue + 120, baseHue + 152, baseHue + 240];
    }
    var lightness = [62, 52, 42, 72, 32];
    var saturation = [72, 68, 76, 64, 70];
    var out = [];
    for (i = 0; i < 5; i++) {
      var l = lightness[i] + Math.floor(Math.random() * 13) - 6;
      var s = saturation[i] + Math.floor(Math.random() * 17) - 8;
      out.push(hslToHex(hues[i], s, l));
    }
    return out;
  }

  function generate() {
    var fresh = randomPalette();
    for (var i = 0; i < 5; i++) {
      if (!palette[i] || !palette[i].locked) {
        palette[i] = { hex: fresh[i], locked: palette[i] ? palette[i].locked : false };
      }
    }
    render();
  }

  /* ---------- Rendering ---------- */

  function render() {
    paletteEl.innerHTML = "";
    previewEl.innerHTML = "";

    palette.forEach(function (color, i) {
      var text = textColorFor(color.hex);

      var swatch = document.createElement("button");
      swatch.type = "button";
      swatch.className = "swatch";
      swatch.style.backgroundColor = color.hex;
      swatch.style.color = text;
      swatch.setAttribute("aria-label", "Color " + (i + 1) + ", " + color.hex + ". Activate to copy hex code.");

      var top = document.createElement("span");
      top.className = "swatch-copy";
      top.textContent = "Click to copy";
      swatch.appendChild(top);

      var bottom = document.createElement("span");
      bottom.className = "swatch-bottom";
      var hexLabel = document.createElement("span");
      hexLabel.className = "swatch-hex";
      hexLabel.textContent = color.hex;
      bottom.appendChild(hexLabel);
      var lock = document.createElement("span");
      lock.className = "lock-btn" + (color.locked ? " locked" : "");
      lock.setAttribute("role", "button");
      lock.setAttribute("tabindex", "0");
      lock.setAttribute("aria-pressed", color.locked ? "true" : "false");
      lock.setAttribute("aria-label", (color.locked ? "Unlock" : "Lock") + " color " + color.hex);
      lock.textContent = color.locked ? "🔒 Locked" : "🔓 Lock";
      lock.addEventListener("click", function (e) {
        e.stopPropagation();
        toggleLock(i);
      });
      lock.addEventListener("keydown", function (e) {
        if (e.key === "Enter" || e.key === " ") {
          e.preventDefault();
          e.stopPropagation();
          toggleLock(i);
        }
      });
      bottom.appendChild(lock);
      swatch.appendChild(bottom);

      swatch.addEventListener("click", function () {
        copyText(color.hex, color.hex + " copied to clipboard");
      });
      paletteEl.appendChild(swatch);

      var chip = document.createElement("div");
      chip.className = "preview-chip";
      chip.style.backgroundColor = color.hex;
      chip.style.color = text;
      var strong = document.createElement("strong");
      strong.textContent = "Aa — readable text";
      chip.appendChild(strong);
      var sample = document.createElement("span");
      sample.textContent = "The quick brown fox jumps over the lazy dog.";
      chip.appendChild(sample);
      var hexNote = document.createElement("span");
      hexNote.className = "preview-hex";
      hexNote.textContent = color.hex + " · text " + text;
      chip.appendChild(document.createElement("br"));
      chip.appendChild(hexNote);
      previewEl.appendChild(chip);
    });
  }

  function toggleLock(i) {
    palette[i].locked = !palette[i].locked;
    render();
    showToast(palette[i].locked ? palette[i].hex + " locked" : palette[i].hex + " unlocked");
  }

  /* ---------- Clipboard & toast ---------- */

  function copyText(text, message) {
    function done() { showToast(message); }
    if (navigator.clipboard && navigator.clipboard.writeText) {
      navigator.clipboard.writeText(text).then(done, function () { fallbackCopy(text); done(); });
    } else {
      fallbackCopy(text);
      done();
    }
  }

  function fallbackCopy(text) {
    var ta = document.createElement("textarea");
    ta.value = text;
    ta.style.position = "fixed";
    ta.style.opacity = "0";
    document.body.appendChild(ta);
    ta.select();
    try { document.execCommand("copy"); } catch (e) { /* clipboard unavailable */ }
    document.body.removeChild(ta);
  }

  function showToast(message) {
    toastEl.textContent = message;
    toastEl.classList.add("show");
    if (toastTimer) clearTimeout(toastTimer);
    toastTimer = setTimeout(function () { toastEl.classList.remove("show"); }, 2200);
  }

  /* ---------- Wire up ---------- */

  randomizeBtn.addEventListener("click", generate);
  copyAllBtn.addEventListener("click", function () {
    copyText(palette.map(function (c) { return c.hex; }).join(", "), "All 5 hex codes copied");
  });

  document.addEventListener("keydown", function (e) {
    var tag = (e.target && e.target.tagName) || "";
    if (e.code === "Space" && tag !== "INPUT" && tag !== "TEXTAREA" && tag !== "BUTTON" && tag !== "SELECT") {
      e.preventDefault();
      generate();
    }
  });

  // Header shadow on scroll
  window.addEventListener("scroll", function () {
    header.classList.toggle("scrolled", window.scrollY > 8);
  }, { passive: true });

  // Mobile menu
  navToggle.addEventListener("click", function () {
    var open = mobileMenu.classList.toggle("open");
    navToggle.setAttribute("aria-expanded", open ? "true" : "false");
  });
  mobileMenu.querySelectorAll("a").forEach(function (a) {
    a.addEventListener("click", function () {
      mobileMenu.classList.remove("open");
      navToggle.setAttribute("aria-expanded", "false");
    });
  });

  // Reveal on scroll
  var revealEls = document.querySelectorAll(".reveal");
  if ("IntersectionObserver" in window) {
    var observer = new IntersectionObserver(function (entries) {
      entries.forEach(function (entry) {
        if (entry.isIntersecting) {
          entry.target.classList.add("visible");
          observer.unobserve(entry.target);
        }
      });
    }, { threshold: 0.12 });
    revealEls.forEach(function (el) { observer.observe(el); });
  } else {
    revealEls.forEach(function (el) { el.classList.add("visible"); });
  }

  document.getElementById("year").textContent = new Date().getFullYear();

  // First palette
  generate();
})();
