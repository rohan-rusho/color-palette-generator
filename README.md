# Color Palette Generator 🎨

Generate beautiful, harmonious 5-color palettes in one click.

## Features

- **Generate** — one click (or press `Space`) builds a fresh 5-color palette from a shared hue family (analogous, complementary, or triadic).
- **Lock colors** — tap the lock on any swatch to keep it while the rest reshuffle.
- **Click to copy** — click any swatch to copy its hex code. "Copy all hex codes" copies all five at once.
- **Contrast-safe text preview** — every color shows sample text in the most readable color for that background (picked with WCAG relative luminance), so you know your text will stay legible.

## Run locally

No build step, no dependencies — just open `index.html` in a browser, or serve it:

```bash
python3 -m http.server 8000
# then open http://localhost:8000
```

## Deploy

Deploy anywhere that serves static files (GitHub Pages, Netlify, Vercel…). Upload the whole folder as-is.

## Tech

Pure HTML, CSS, and vanilla JavaScript. Google Fonts only (Bricolage Grotesque, Inter, JetBrains Mono).
