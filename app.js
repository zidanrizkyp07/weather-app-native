// ─── CONFIG ────────────────────────────────────────────────────────────────
// All APIs used here are FREE and require NO API KEY:
//   Geocoding  → Nominatim (OpenStreetMap)
//   Weather    → Open-Meteo

const NOMINATIM = "https://nominatim.openstreetmap.org";
const OPEN_METEO = "https://api.open-meteo.com/v1/forecast";

// ─── WMO WEATHER CODE MAPPING ──────────────────────────────────────────────
const WMO_CODES = {
  0:  { label: "Clear sky",              icon: "☀️" },
  1:  { label: "Mainly clear",           icon: "🌤" },
  2:  { label: "Partly cloudy",          icon: "⛅" },
  3:  { label: "Overcast",              icon: "☁️" },
  45: { label: "Foggy",                  icon: "🌫" },
  48: { label: "Icy fog",               icon: "🌫" },
  51: { label: "Light drizzle",          icon: "🌦" },
  53: { label: "Moderate drizzle",       icon: "🌦" },
  55: { label: "Dense drizzle",          icon: "🌧" },
  61: { label: "Slight rain",            icon: "🌧" },
  63: { label: "Moderate rain",          icon: "🌧" },
  65: { label: "Heavy rain",             icon: "🌧" },
  71: { label: "Slight snowfall",        icon: "🌨" },
  73: { label: "Moderate snowfall",      icon: "❄️" },
  75: { label: "Heavy snowfall",         icon: "❄️" },
  77: { label: "Snow grains",            icon: "🌨" },
  80: { label: "Slight showers",         icon: "🌦" },
  81: { label: "Moderate showers",       icon: "🌦" },
  82: { label: "Violent showers",        icon: "⛈" },
  85: { label: "Slight snow showers",    icon: "🌨" },
  86: { label: "Heavy snow showers",     icon: "❄️" },
  95: { label: "Thunderstorm",           icon: "⛈" },
  96: { label: "Thunderstorm w/ hail",   icon: "⛈" },
  99: { label: "Thunderstorm w/ hail",   icon: "⛈" },
};

const DAY_NAMES = ["Sun","Mon","Tue","Wed","Thu","Fri","Sat"];

// ─── ELEMENT REFS ──────────────────────────────────────────────────────────
const cityInput    = document.getElementById("city-input");
const searchBtn    = document.getElementById("search-btn");
const suggestionsEl = document.getElementById("suggestions");
const weatherCard  = document.getElementById("weather-card");
const errorMsg     = document.getElementById("error-msg");
const errorText    = document.getElementById("error-text");
const loadingEl    = document.getElementById("loading");
const emptyState   = document.getElementById("empty-state");

// ─── STATE ─────────────────────────────────────────────────────────────────
let debounceTimer = null;
let localTimeInterval = null;

// ─── SEARCH & GEOCODING ────────────────────────────────────────────────────
cityInput.addEventListener("input", () => {
  clearTimeout(debounceTimer);
  const q = cityInput.value.trim();
  if (q.length < 2) { hideSuggestions(); return; }
  debounceTimer = setTimeout(() => fetchSuggestions(q), 320);
});

cityInput.addEventListener("keydown", e => {
  if (e.key === "Enter") { hideSuggestions(); triggerSearch(); }
});

searchBtn.addEventListener("click", () => { hideSuggestions(); triggerSearch(); });

document.addEventListener("click", e => {
  if (!suggestionsEl.contains(e.target) && e.target !== cityInput) {
    hideSuggestions();
  }
});

// Quick city buttons
document.querySelectorAll(".quick-btn").forEach(btn => {
  btn.addEventListener("click", () => {
    cityInput.value = btn.dataset.city;
    triggerSearch();
  });
});

async function fetchSuggestions(query) {
  try {
    const url = `${NOMINATIM}/search?q=${encodeURIComponent(query)}&format=json&limit=5&featuretype=city&addressdetails=1`;
    const res = await fetch(url, { headers: { "Accept-Language": "en" } });
    const data = await res.json();

    const cities = data.filter(d => ["city","town","village","municipality"].includes(d.addresstype) || d.type === "city" || d.class === "place");

    if (!cities.length) { hideSuggestions(); return; }

    suggestionsEl.innerHTML = cities.map(c => {
      const name    = c.address?.city || c.address?.town || c.address?.village || c.name;
      const country = c.address?.country || "";
      const state   = c.address?.state || "";
      const sub     = [state, country].filter(Boolean).join(", ");
      return `<div class="suggestion-item" data-lat="${c.lat}" data-lon="${c.lon}" data-name="${name}" data-display="${c.display_name}">
        <span class="sug-flag">📍</span>
        <span>${name}</span>
        <span class="sug-sub">${sub}</span>
      </div>`;
    }).join("");

    suggestionsEl.querySelectorAll(".suggestion-item").forEach(item => {
      item.addEventListener("click", () => {
        const name = item.dataset.name;
        const lat  = parseFloat(item.dataset.lat);
        const lon  = parseFloat(item.dataset.lon);
        cityInput.value = name;
        hideSuggestions();
        fetchWeather(lat, lon, name, item.dataset.display);
      });
    });

    suggestionsEl.classList.remove("hidden");
  } catch {
    hideSuggestions();
  }
}

function hideSuggestions() {
  suggestionsEl.classList.add("hidden");
  suggestionsEl.innerHTML = "";
}

async function triggerSearch() {
  const q = cityInput.value.trim();
  if (!q) return;

  showLoading();
  try {
    const url = `${NOMINATIM}/search?q=${encodeURIComponent(q)}&format=json&limit=1&addressdetails=1`;
    const res = await fetch(url, { headers: { "Accept-Language": "en" } });
    const data = await res.json();
    if (!data.length) throw new Error(`No results for "${q}"`);

    const result = data[0];
    const name   = result.address?.city || result.address?.town || result.address?.village || result.name;
    fetchWeather(parseFloat(result.lat), parseFloat(result.lon), name, result.display_name);
  } catch (err) {
    showError(err.message || "City not found. Try again.");
  }
}

// ─── WEATHER FETCHING ──────────────────────────────────────────────────────
async function fetchWeather(lat, lon, cityName, displayName) {
  showLoading();
  try {
    const params = new URLSearchParams({
      latitude: lat,
      longitude: lon,
      current: [
        "temperature_2m","relative_humidity_2m","apparent_temperature",
        "weather_code","wind_speed_10m","surface_pressure","visibility",
      ].join(","),
      daily: [
        "temperature_2m_max","temperature_2m_min","weather_code",
        "sunrise","sunset",
      ].join(","),
      timezone: "auto",
      wind_speed_unit: "kmh",
    });

    const res  = await fetch(`${OPEN_METEO}?${params}`);
    if (!res.ok) throw new Error("Weather service error. Please try again.");
    const data = await res.json();

    renderWeather(data, cityName, displayName);
  } catch (err) {
    showError(err.message || "Failed to load weather data.");
  }
}

// ─── RENDERING ─────────────────────────────────────────────────────────────
function renderWeather(data, cityName, displayName) {
  const cur  = data.current;
  const dly  = data.daily;
  const tz   = data.timezone;

  const wmo  = WMO_CODES[cur.weather_code] || { label: "Unknown", icon: "🌡" };
  const addr = parseDisplayName(displayName);

  // City & country
  document.getElementById("city-name").textContent    = cityName;
  document.getElementById("country-name").textContent = addr.country;
  document.getElementById("weather-icon").textContent  = wmo.icon;
  document.getElementById("temperature").textContent   = Math.round(cur.temperature_2m);
  document.getElementById("feels-like").textContent    = `Feels like ${Math.round(cur.apparent_temperature)}°C`;
  document.getElementById("weather-desc").textContent  = wmo.label;
  document.getElementById("humidity").textContent      = `${cur.relative_humidity_2m}%`;
  document.getElementById("wind-speed").textContent    = `${Math.round(cur.wind_speed_10m)} km/h`;
  document.getElementById("pressure").textContent      = `${Math.round(cur.surface_pressure)} hPa`;

  const visKm = cur.visibility != null ? (cur.visibility / 1000).toFixed(1) + " km" : "N/A";
  document.getElementById("visibility").textContent = visKm;

  // Sunrise / sunset (from first daily entry)
  document.getElementById("sunrise").textContent = formatTime(dly.sunrise[0]);
  document.getElementById("sunset").textContent  = formatTime(dly.sunset[0]);

  // Local time (live clock)
  clearInterval(localTimeInterval);
  function updateTime() {
    const now = new Date();
    const opts = { timeZone: tz, hour: "2-digit", minute: "2-digit", second: "2-digit", hour12: false };
    document.getElementById("local-time").textContent =
      "Local time · " + now.toLocaleTimeString("en-GB", opts);
  }
  updateTime();
  localTimeInterval = setInterval(updateTime, 1000);

  // 7-day forecast
  const grid = document.getElementById("forecast-grid");
  grid.innerHTML = dly.time.map((dateStr, i) => {
    const date    = new Date(dateStr + "T00:00:00");
    const dayName = i === 0 ? "Today" : DAY_NAMES[date.getDay()];
    const fc      = WMO_CODES[dly.weather_code[i]] || { icon: "🌡" };
    return `<div class="forecast-day">
      <span class="forecast-day-name">${dayName}</span>
      <span class="forecast-icon">${fc.icon}</span>
      <span class="forecast-max">${Math.round(dly.temperature_2m_max[i])}°</span>
      <span class="forecast-min">${Math.round(dly.temperature_2m_min[i])}°</span>
    </div>`;
  }).join("");

  showCard();
}

// ─── HELPERS ───────────────────────────────────────────────────────────────
function parseDisplayName(displayName) {
  const parts   = displayName.split(",").map(p => p.trim());
  const country = parts[parts.length - 1] || "";
  return { country };
}

function formatTime(isoString) {
  if (!isoString) return "N/A";
  const d = new Date(isoString);
  return d.toLocaleTimeString("en-GB", { hour: "2-digit", minute: "2-digit", hour12: false });
}

// ─── UI STATE HELPERS ──────────────────────────────────────────────────────
function showLoading() {
  weatherCard.classList.add("hidden");
  errorMsg.classList.add("hidden");
  emptyState.classList.add("hidden");
  loadingEl.classList.remove("hidden");
}

function showCard() {
  loadingEl.classList.add("hidden");
  errorMsg.classList.add("hidden");
  emptyState.classList.add("hidden");
  weatherCard.classList.remove("hidden");
}

function showError(msg) {
  loadingEl.classList.add("hidden");
  weatherCard.classList.add("hidden");
  emptyState.classList.add("hidden");
  errorText.textContent = msg;
  errorMsg.classList.remove("hidden");
}