# ☁ Aether — Live Weather App

A beautiful, minimal weather app built with **pure HTML, CSS, and JavaScript** — no frameworks, no build tools, no API keys needed.

## ✨ Features

- 🌍 Search any city worldwide
- 🌡 Current temperature, feels-like, humidity, wind, pressure, visibility
- 🌄 Sunrise & sunset times
- 📅 7-day forecast
- 🕐 Live local clock for the searched city
- 💡 City autocomplete suggestions
- 📱 Fully responsive (mobile + desktop)

## 🚀 Deploy to GitHub Pages (5 minutes)

### Method 1 — Upload via GitHub web UI

1. Go to [github.com](https://github.com) and create a **new repository** (e.g. `weather-app`)
2. Click **"uploading an existing file"**
3. Drag and drop all three files: `index.html`, `style.css`, `app.js`
4. Click **"Commit changes"**
5. Go to **Settings → Pages → Source → Deploy from a branch → main / root**
6. Your site will be live at: `https://YOUR_USERNAME.github.io/weather-app`

### Method 2 — Git CLI

```bash
git init
git add .
git commit -m "Initial commit: Aether weather app"
git remote add origin https://github.com/YOUR_USERNAME/weather-app.git
git push -u origin main
```

Then enable GitHub Pages in your repo settings (Settings → Pages → main branch / root folder).

## 🛠 APIs Used (all free, no API key)

| API | Purpose | Docs |
|---|---|---|
| [Open-Meteo](https://open-meteo.com) | Weather data (current + 7-day forecast) | [docs](https://open-meteo.com/en/docs) |
| [Nominatim / OpenStreetMap](https://nominatim.openstreetmap.org) | City geocoding & autocomplete | [docs](https://nominatim.org/release-docs/develop/api/Overview/) |

## 📁 File Structure

```
weather-app/
├── index.html   ← HTML structure
├── style.css    ← All styles (dark theme, responsive)
└── app.js       ← API calls, rendering logic
```

## 🎨 Tech Stack

- **HTML5** semantic markup
- **CSS3** — custom properties, grid, animations, blur effects
- **Vanilla JS** — fetch API, async/await, DOM manipulation
- **Google Fonts** — Syne (display) + DM Sans (body)

## 🔧 Customization Tips

- Change the default quick-city buttons in `index.html`
- Swap `°C` to `°F` by changing `temperature_unit: "fahrenheit"` in `app.js`
- Adjust the color scheme via CSS variables in `:root` in `style.css`

## 📌 Notes

- Nominatim has a usage policy of **max 1 request/second** — the app uses a 320ms debounce on search, so you're well within limits
- Open-Meteo is completely free for non-commercial use with generous rate limits