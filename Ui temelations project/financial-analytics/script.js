(function () {
  "use strict";

  // ---------- Helpers ----------
  const $ = (selector) => document.querySelector(selector);

  function formatNumber(value) {
    return value.toLocaleString("en-IN", { minimumFractionDigits: 2, maximumFractionDigits: 2 });
  }

  function formatDate(date) {
    return date.toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" });
  }

  function percent(value) {
    return (value >= 0 ? "+" : "") + value.toFixed(2) + "%";
  }

  function safeStorage(action, key, value) {
    try {
      if (action === "get") return localStorage.getItem(key);
      if (action === "set") localStorage.setItem(key, value);
      if (action === "remove") localStorage.removeItem(key);
    } catch (error) {
      return null;
    }
    return null;
  }

  // ---------- Demo companies ----------
  // Prices and yearly drift are rough starting points for simulated history.
  const COMPANIES = [
    { sym: "RELIANCE", name: "Reliance Industries", ex: "NSE", cur: "₹", price: 2950, drift: 0.12, vol: 0.22 },
    { sym: "TCS", name: "Tata Consultancy Services", ex: "NSE", cur: "₹", price: 3900, drift: 0.1, vol: 0.2 },
    { sym: "INFY", name: "Infosys", ex: "NSE", cur: "₹", price: 1850, drift: 0.14, vol: 0.24 },
    { sym: "HDFCBANK", name: "HDFC Bank", ex: "NSE", cur: "₹", price: 1650, drift: 0.08, vol: 0.19 },
    { sym: "ICICIBANK", name: "ICICI Bank", ex: "NSE", cur: "₹", price: 1250, drift: 0.18, vol: 0.22 },
    { sym: "SBIN", name: "State Bank of India", ex: "NSE", cur: "₹", price: 800, drift: 0.2, vol: 0.27 },
    { sym: "TATAMOTORS", name: "Tata Motors", ex: "NSE", cur: "₹", price: 950, drift: -0.05, vol: 0.34 },
    { sym: "ITC", name: "ITC", ex: "NSE", cur: "₹", price: 470, drift: 0.03, vol: 0.18 },
    { sym: "WIPRO", name: "Wipro", ex: "NSE", cur: "₹", price: 480, drift: -0.04, vol: 0.26 },
    { sym: "BHARTIARTL", name: "Bharti Airtel", ex: "NSE", cur: "₹", price: 1550, drift: 0.25, vol: 0.23 },
    { sym: "AAPL", name: "Apple", ex: "NASDAQ", cur: "$", price: 225, drift: 0.15, vol: 0.25 },
    { sym: "MSFT", name: "Microsoft", ex: "NASDAQ", cur: "$", price: 430, drift: 0.16, vol: 0.24 },
    { sym: "GOOGL", name: "Alphabet (Google)", ex: "NASDAQ", cur: "$", price: 175, drift: 0.13, vol: 0.28 },
    { sym: "AMZN", name: "Amazon", ex: "NASDAQ", cur: "$", price: 190, drift: 0.11, vol: 0.3 },
    { sym: "TSLA", name: "Tesla", ex: "NASDAQ", cur: "$", price: 250, drift: -0.08, vol: 0.55 },
    { sym: "NVDA", name: "NVIDIA", ex: "NASDAQ", cur: "$", price: 120, drift: 0.45, vol: 0.5 }
  ];

  const PERIODS = { "1W": 5, "1M": 21, "3M": 63, "6M": 126, "1Y": 252, "5Y": 1259 };

  const state = {
    current: null,
    period: "1Y",
    apiKey: safeStorage("get", "alphaKey") || "",
    watch: ["RELIANCE", "TCS", "AAPL"]
  };

  try {
    const saved = JSON.parse(safeStorage("get", "watchlist"));
    if (Array.isArray(saved)) state.watch = saved;
  } catch (error) {
    // Keep the default watchlist.
  }

  const cache = {};

  // ---------- Simulated price history ----------
  function seeded(seed) {
    return function () {
      seed = (seed * 16807) % 2147483647;
      return (seed - 1) / 2147483646;
    };
  }

  function hash(text) {
    let h = 7;
    for (let i = 0; i < text.length; i++) h = (h * 31 + text.charCodeAt(i)) % 2147483647;
    return h || 1;
  }

  function tradingDates(count) {
    const dates = [];
    const day = new Date();
    while (dates.length < count) {
      if (day.getDay() !== 0 && day.getDay() !== 6) dates.push(new Date(day));
      day.setDate(day.getDate() - 1);
    }
    return dates.reverse();
  }

  function buildDemo(company) {
    if (cache[company.sym]) return cache[company.sym];

    const count = 1300;
    const rand = seeded(hash(company.sym));
    const walk = [0];

    // Random daily moves, then pulled back so the history ends at the starting price
    // and follows the company's yearly growth rate (a "bridge" around the trend).
    for (let i = 1; i < count; i++) {
      const noise = (rand() + rand() + rand() + rand() - 2) * 1.73;
      walk.push(walk[i - 1] + (company.vol / Math.sqrt(252)) * noise);
    }

    const closes = walk.map((w, i) => {
      const bridge = w - (walk[count - 1] * i) / (count - 1);
      const trend = (company.drift * (i - (count - 1))) / 252;
      return company.price * Math.exp(trend + bridge);
    });

    cache[company.sym] = {
      sym: company.sym,
      name: company.name,
      ex: company.ex,
      cur: company.cur,
      closes,
      dates: tradingDates(count),
      live: false
    };
    return cache[company.sym];
  }

  // ---------- Live data (optional, Alpha Vantage) ----------
  async function liveSearch(query) {
    const url = "https://www.alphavantage.co/query?function=SYMBOL_SEARCH&keywords=" +
      encodeURIComponent(query) + "&apikey=" + encodeURIComponent(state.apiKey);
    const json = await (await fetch(url)).json();
    const match = (json.bestMatches || [])[0];
    if (!match) throw new Error("No listed company found for that search.");
    return { sym: match["1. symbol"], name: match["2. name"], cur: match["8. currency"] };
  }

  async function loadLive(match) {
    const url = "https://www.alphavantage.co/query?function=TIME_SERIES_DAILY&symbol=" +
      encodeURIComponent(match.sym) + "&outputsize=compact&apikey=" + encodeURIComponent(state.apiKey);
    const json = await (await fetch(url)).json();
    const series = json["Time Series (Daily)"];

    if (!series) throw new Error(json.Note || json.Information || "No price data came back for that symbol.");

    const days = Object.keys(series).sort();
    return {
      sym: match.sym,
      name: match.name,
      ex: "",
      cur: match.cur === "INR" ? "₹" : match.cur === "USD" ? "$" : match.cur + " ",
      closes: days.map((d) => Number(series[d]["4. close"])),
      dates: days.map((d) => new Date(d)),
      live: true
    };
  }

  // ---------- Statistics ----------
  function growth(closes, days) {
    const n = closes.length;
    if (n <= days) return null;
    return (closes[n - 1] / closes[n - 1 - days] - 1) * 100;
  }

  function average(closes, days) {
    const n = closes.length;
    if (n < days) return null;
    return closes.slice(n - days).reduce((a, b) => a + b, 0) / days;
  }

  function volatility(closes) {
    const recent = closes.slice(-253);
    const returns = [];
    for (let i = 1; i < recent.length; i++) returns.push(recent[i] / recent[i - 1] - 1);
    const mean = returns.reduce((a, b) => a + b, 0) / returns.length;
    const variance = returns.reduce((a, r) => a + (r - mean) * (r - mean), 0) / returns.length;
    return Math.sqrt(variance) * Math.sqrt(252) * 100;
  }

  function dayChange(stock) {
    const n = stock.closes.length;
    return (stock.closes[n - 1] / stock.closes[n - 2] - 1) * 100;
  }

  // Scores trend signals and explains each one in plain words.
  function assess(stock) {
    const closes = stock.closes;
    const price = closes[closes.length - 1];
    const avg50 = average(closes, 50);
    const avg200 = average(closes, 200);
    const year = growth(closes, 252);
    const reasons = [];
    let score = 0;

    if (avg50 !== null) {
      const above = price > avg50;
      score += above ? 1 : -1;
      reasons.push(above ? "Price is above its 50-day average, which shows short-term strength."
                         : "Price is below its 50-day average, which shows short-term weakness.");
    }

    if (avg200 !== null) {
      const above = price > avg200;
      score += above ? 1 : -1;
      reasons.push(above ? "Price is above its 200-day average, which shows a healthy long-term trend."
                         : "Price is below its 200-day average, which shows a weak long-term trend.");
    }

    if (avg50 !== null && avg200 !== null) {
      const rising = avg50 > avg200;
      score += rising ? 1 : -1;
      reasons.push(rising ? "The 50-day average is above the 200-day average, a common sign of an uptrend."
                          : "The 50-day average is below the 200-day average, a common sign of a downtrend.");
    }

    if (year !== null) {
      if (year > 10) score += 1;
      if (year < 0) score -= 1;
      reasons.push((year >= 0 ? "Grew " : "Fell ") + Math.abs(year).toFixed(1) + "% over the last year.");
    }

    const vol = volatility(closes);
    const risk = vol < 20 ? "Low" : vol < 35 ? "Medium" : "High";
    reasons.push("Price swings are " + risk.toLowerCase() + " (about " + vol.toFixed(0) + "% a year).");

    let label = "Mixed or flat";
    let tone = "mixed";
    if (score >= 3) {
      label = "Growing";
      tone = "growing";
    } else if (score <= -2) {
      label = "Not growing (declining)";
      tone = "declining";
    }

    return { label, tone, reasons };
  }

  // ---------- Chart ----------
  let chartState = null;

  function drawChart(stock) {
    const days = PERIODS[state.period];
    const count = Math.min(days + 1, stock.closes.length);
    const closes = stock.closes.slice(-count);
    const dates = stock.dates.slice(-count);

    const W = 700;
    const H = 260;
    const pad = { l: 56, r: 12, t: 14, b: 26 };
    const min = Math.min(...closes);
    const max = Math.max(...closes);
    const span = max - min || 1;
    const lo = min - span * 0.08;
    const hi = max + span * 0.08;
    const innerW = W - pad.l - pad.r;
    const innerH = H - pad.t - pad.b;

    const x = (i) => pad.l + (i / (closes.length - 1)) * innerW;
    const y = (v) => pad.t + innerH - ((v - lo) / (hi - lo)) * innerH;
    const up = closes[closes.length - 1] >= closes[0];
    const color = up ? "var(--up)" : "var(--down)";

    const line = closes.map((v, i) => (i ? "L" : "M") + x(i).toFixed(1) + " " + y(v).toFixed(1)).join(" ");
    const area = line + " L" + x(closes.length - 1) + " " + (H - pad.b) + " L" + x(0) + " " + (H - pad.b) + " Z";

    let grid = "";
    for (let t = 0; t <= 4; t++) {
      const value = lo + ((hi - lo) / 4) * t;
      grid +=
        '<line x1="' + pad.l + '" x2="' + (W - pad.r) + '" y1="' + y(value) + '" y2="' + y(value) + '" stroke="var(--line)"/>' +
        '<text x="' + (pad.l - 8) + '" y="' + (y(value) + 4) + '" text-anchor="end">' + value.toFixed(0) + "</text>";
    }

    let labels = "";
    const every = Math.ceil(closes.length / 5);
    dates.forEach((date, i) => {
      if (i % every === 0) {
        const text = date.toLocaleDateString("en-IN", { day: "numeric", month: "short" });
        labels += '<text x="' + x(i) + '" y="' + (H - 6) + '" text-anchor="middle">' + text + "</text>";
      }
    });

    $("#chart").innerHTML =
      grid + labels +
      '<path d="' + area + '" fill="' + color + '" opacity="0.1"/>' +
      '<path d="' + line + '" fill="none" stroke="' + color + '" stroke-width="2.2"/>' +
      '<line id="guide" y1="' + pad.t + '" y2="' + (H - pad.b) + '" stroke="var(--muted)" stroke-dasharray="3 3" visibility="hidden"/>';

    chartState = { closes, dates, W, pad, innerW, x, cur: stock.cur };
  }

  function bindChartHover() {
    const svg = $("#chart");
    const tip = $("#tooltip");

    svg.addEventListener("pointermove", (event) => {
      if (!chartState) return;
      const rect = svg.getBoundingClientRect();
      const px = ((event.clientX - rect.left) / rect.width) * chartState.W;
      const last = chartState.closes.length - 1;
      const index = Math.min(last, Math.max(0, Math.round(((px - chartState.pad.l) / chartState.innerW) * last)));
      const guide = $("#guide");

      guide.setAttribute("x1", chartState.x(index));
      guide.setAttribute("x2", chartState.x(index));
      guide.setAttribute("visibility", "visible");

      tip.hidden = false;
      tip.style.left = (chartState.x(index) / chartState.W) * 100 + "%";
      tip.textContent = formatDate(chartState.dates[index]) + "  " + chartState.cur + formatNumber(chartState.closes[index]);
    });

    svg.addEventListener("pointerleave", () => {
      tip.hidden = true;
      const guide = $("#guide");
      if (guide) guide.setAttribute("visibility", "hidden");
    });
  }

  // ---------- Rendering ----------
  function toneOf(value) {
    return value >= 0 ? "up" : "down";
  }

  function renderDetail(stock) {
    state.current = stock;
    const closes = stock.closes;
    const price = closes[closes.length - 1];
    const change = dayChange(stock);
    const result = assess(stock);
    const watched = state.watch.includes(stock.sym);

    const growthCells = Object.keys(PERIODS)
      .map((key) => {
        const value = growth(closes, PERIODS[key]);
        const text = value === null ? "n/a" : percent(value);
        const tone = value === null ? "" : toneOf(value);
        return "<div><span>" + key + '</span><strong class="' + tone + '">' + text + "</strong></div>";
      })
      .join("");

    const yearSlice = closes.slice(-252);
    const low = Math.min(...yearSlice);
    const high = Math.max(...yearSlice);
    const position = ((price - low) / ((high - low) || 1)) * 100;

    const periodButtons = Object.keys(PERIODS)
      .map((key) => '<button data-period="' + key + '" aria-pressed="' + (key === state.period) + '">' + key + "</button>")
      .join("");

    const star = stock.live
      ? ""
      : '<button class="star' + (watched ? " on" : "") + '" id="starBtn">' + (watched ? "★ In watchlist" : "☆ Add to watchlist") + "</button>";

    $("#detail").innerHTML =
      '<div class="stock-head">' +
        "<div><h1>" + stock.name + '</h1><span class="symbol">' + stock.sym + (stock.ex ? " · " + stock.ex : "") +
        (stock.live ? " · live data" : " · simulated data") + "</span></div>" + star +
      "</div>" +
      '<div><span class="price">' + stock.cur + formatNumber(price) + "</span>" +
        '<span class="change ' + toneOf(change) + '">' + (change >= 0 ? "▲ " : "▼ ") + percent(change) + " today</span></div>" +
      '<div class="periods" role="group" aria-label="Chart period">' + periodButtons + "</div>" +
      '<div class="chart-wrap"><svg id="chart" viewBox="0 0 700 260" role="img" aria-label="Price chart"></svg>' +
        '<div class="tooltip" id="tooltip" hidden></div></div>' +
      '<div class="growth">' + growthCells + "</div>" +
      '<div class="verdict ' + result.tone + '"><h3>Is it growing? ' + result.label + "</h3><ul>" +
        result.reasons.map((r) => "<li>" + r + "</li>").join("") + "</ul></div>" +
      "<h2 style=\"margin-top:16px\">52-week range</h2>" +
      '<div class="range-bar"><i style="left:calc(' + position.toFixed(1) + '% - 2px)"></i></div>' +
      '<div class="range-labels"><span>Low ' + stock.cur + formatNumber(low) + "</span><span>High " + stock.cur + formatNumber(high) + "</span></div>";

    drawChart(stock);
    bindChartHover();
  }

  function rowHtml(stock) {
    const price = stock.closes[stock.closes.length - 1];
    const change = dayChange(stock);
    return (
      '<button class="row" data-sym="' + stock.sym + '">' +
        "<span>" + stock.name + "<small>" + stock.sym + "</small></span>" +
        '<span class="num">' + stock.cur + formatNumber(price) +
        '<small class="' + toneOf(change) + '">' + (change >= 0 ? "▲ " : "▼ ") + percent(change) + "</small></span>" +
      "</button>"
    );
  }

  function renderSide() {
    const all = COMPANIES.map(buildDemo);
    const sorted = all.slice().sort((a, b) => dayChange(b) - dayChange(a));
    const watched = state.watch.map((sym) => COMPANIES.find((c) => c.sym === sym)).filter(Boolean).map(buildDemo);

    $("#watchlist").innerHTML = watched.length
      ? watched.map(rowHtml).join("")
      : '<p class="empty">Your watchlist is empty. Open a company and choose "Add to watchlist".</p>';
    $("#gainers").innerHTML = sorted.slice(0, 3).map(rowHtml).join("");
    $("#losers").innerHTML = sorted.slice(-3).reverse().map(rowHtml).join("");
  }

  function setMessage(text) {
    $("#message").textContent = text;
  }

  function setMode() {
    const live = Boolean(state.apiKey);
    const badge = $("#modeBadge");
    badge.textContent = live ? "Live search on" : "Demo data";
    badge.classList.toggle("live", live);
  }

  // ---------- Search ----------
  function matches(query) {
    const q = query.trim().toLowerCase();
    if (!q) return [];
    return COMPANIES.filter((c) => c.sym.toLowerCase().includes(q) || c.name.toLowerCase().includes(q));
  }

  function openDemo(sym) {
    const company = COMPANIES.find((c) => c.sym === sym);
    if (!company) return;
    setMessage("");
    $("#suggest").hidden = true;
    renderDetail(buildDemo(company));
  }

  function showSuggestions() {
    const list = matches($("#search").value).slice(0, 6);
    const box = $("#suggest");

    box.hidden = !list.length;
    box.innerHTML = list
      .map((c) => '<li><button type="button" data-sym="' + c.sym + '">' + c.name + "<small>" + c.sym + "</small></button></li>")
      .join("");
  }

  async function runSearch() {
    const query = $("#search").value.trim();
    if (!query) return;

    const found = matches(query);
    if (found.length) {
      openDemo(found[0].sym);
      return;
    }

    if (!state.apiKey) {
      setMessage('"' + query + '" is not in the demo list. Try Reliance, TCS, Infosys, Apple or Tesla, or choose "Live data" to search any listed company.');
      return;
    }

    setMessage("Searching…");
    try {
      const match = await liveSearch(query);
      const stock = await loadLive(match);
      setMessage("");
      renderDetail(stock);
    } catch (error) {
      setMessage(error.message || "Could not load live data. Check your API key and internet connection.");
    }
  }

  // ---------- Page ----------
  function saveWatch() {
    safeStorage("set", "watchlist", JSON.stringify(state.watch));
  }

  function init() {
    setMode();
    renderSide();
    openDemo("RELIANCE");

    $("#searchForm").addEventListener("submit", (event) => {
      event.preventDefault();
      runSearch();
    });

    $("#search").addEventListener("input", showSuggestions);

    document.addEventListener("click", (event) => {
      const sym = event.target.closest("[data-sym]");
      if (sym) {
        openDemo(sym.dataset.sym);
        return;
      }

      const period = event.target.closest("[data-period]");
      if (period && state.current) {
        state.period = period.dataset.period;
        document.querySelectorAll("[data-period]").forEach((b) => {
          b.setAttribute("aria-pressed", String(b.dataset.period === state.period));
        });
        drawChart(state.current);
        return;
      }

      if (event.target.closest("#starBtn") && state.current) {
        const at = state.watch.indexOf(state.current.sym);
        if (at >= 0) state.watch.splice(at, 1);
        else state.watch.push(state.current.sym);
        saveWatch();
        renderSide();
        renderDetail(state.current);
        return;
      }

      if (!event.target.closest(".search-form")) $("#suggest").hidden = true;
    });

    $("#keyBtn").addEventListener("click", () => {
      $("#keyPanel").hidden = !$("#keyPanel").hidden;
      $("#keyInput").value = state.apiKey;
    });

    $("#keySave").addEventListener("click", () => {
      state.apiKey = $("#keyInput").value.trim();
      safeStorage("set", "alphaKey", state.apiKey);
      setMode();
      setMessage(state.apiKey ? "Key saved. Search any listed company by name or symbol." : "");
    });

    $("#keyClear").addEventListener("click", () => {
      state.apiKey = "";
      safeStorage("remove", "alphaKey");
      $("#keyInput").value = "";
      setMode();
      setMessage("");
    });
  }

  init();
})();
