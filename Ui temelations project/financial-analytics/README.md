# Ledgerline – Stock Analytics

![Preview](preview.png)

## What the UI pattern is
A stock analytics page lets a person search for a company and see at once whether its share price is going up or down, how much it has grown over different periods, and whether the trend looks healthy.

## Where it is commonly used
Brokerage apps, finance portals, investor dashboards and market-news sites.

## Why it is relevant to modern web interfaces
People want a quick answer to "is this growing?" before they read details. Search-first layouts, plain-language summaries and watchlists make market data usable for beginners as well as experts.

## Patterns observed
- Search box with live suggestions.
- Large price with a coloured up or down arrow for today's change.
- Period switch (1W to 5Y) that redraws the chart.
- Growth figures for each period in one row.
- Watchlist plus "biggest gainers" and "biggest losers" lists.

## What this implementation does differently
- A plain-language **"Is it growing?"** verdict. It scores the price against its 50-day and 200-day averages and the one-year change, and lists each reason in a sentence.
- Price swings are shown as Low, Medium or High risk.
- A 52-week range bar shows where the price sits between its yearly low and high.
- Works with no server: 16 demo companies (Indian and US) with simulated price history.
- Optional **Live data**: paste a free Alpha Vantage key to search any listed company. Live results are limited to roughly the last 100 trading days, so longer periods show "n/a".

## Important notes
- Demo prices are simulated for the template and are not real market data.
- The live-data option needs internet and an API key, and the free plan has request limits.
- This is not financial advice.

## Files
- `index.html` – page structure
- `style.css` – layout, colours and responsive rules
- `script.js` – demo data, search, chart, growth statistics, verdict and watchlist

## Run it
Open `index.html` in a modern browser and search for a company such as Reliance, TCS, Infosys, Apple or Tesla.
