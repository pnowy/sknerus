<p align="center">
<img src="/public/logo.png" alt="Sknerus Logo" width="200" height="200" /><br>
</p>

<h1 align="center">Sknerus</h1>

<p align="center">
<a href="https://github.com/pnowy/sknerus/actions/workflows/ci.yaml"><img src="https://github.com/pnowy/sknerus/actions/workflows/ci.yaml/badge.svg" alt="CI"></a>&nbsp;<a href="https://github.com/pnowy/sknerus/actions/workflows/release.yaml"><img src="https://github.com/pnowy/sknerus/actions/workflows/release.yaml/badge.svg" alt="Release"></a>&nbsp;<img alt="License" src="https://img.shields.io/github/license/pnowy/sknerus">
</p>

<p align="center">
<a href="#why-sknerus">Why Sknerus?</a>&nbsp;&bull;&nbsp;<a href="#features">Features</a>&nbsp;&bull;&nbsp;<a href="#screenshots">Screenshots</a><br><a href="#installation">Installation</a>&nbsp;&bull;&nbsp;<a href="#configuration">Configuration</a>&nbsp;&bull;&nbsp;<a href="#demo-data">Demo Data</a>
</p>

<br>

<p align="center">
<b>Sknerus</b> is a self-hosted personal finance tracker focused on clarity and speed. Track income and expenses across custom categories, visualize spending trends over time, and get a clear picture of your cashflow — all from a clean, modern interface.
</p>

<p align="center">
<i>💰 <b>Sknerus</b> (pronounced <i>skneh-roos</i>) is Polish for <b>Scrooge</b> — a penny-pinching miser who knows exactly where every złoty goes. If you're obsessive enough about your finances to self-host a tracker, the name fits.</i>
</p>

<br>

# Why Sknerus?

[ExpenseOwl](https://github.com/tanq16/expenseowl) was the original inspiration for this project — a wonderfully simple self-hosted expense tracker. However, it is no longer actively developed and maintained, and it lacked a few things I needed: multi-chart dashboards, recurring transactions with full CRUD, multi-currency support, and a richer data visualization experience.

Sknerus picks up where ExpenseOwl left off. It keeps the philosophy of **dead simple, self-hosted, single-user expense tracking**, while adding:

- A proper analytics dashboard with multiple chart types and time-range navigation
- Full recurring expense management (create, edit, delete templates)
- Multi-currency support with automatic exchange rate resolution
- A modern SSR React stack (TanStack Start) instead of a traditional server-rendered app

It is still *not* a budgeting app. No accounts, no complex budgets, no bank syncing. Just a fast, honest look at where your money goes.

# Features

### Core Functionality

- Add income and expenses with category, date, amount, currency, and optional tags
- Custom categories with color coding — reorder, rename, or remove them at any time
- Recurring transactions — define a template once, the app materializes entries automatically up to today
- Multi-currency support: record transactions in any currency, configure supported currencies, and exchange rates are resolved and cached automatically via [Frankfurter](https://www.frankfurter.app/)
- CSV export and import — bring your data in from any tool or take it anywhere
- Configurable fiscal month start date (e.g. set to 5 to count from the 5th of each month)
- Configurable default start page (dashboard or table view)
- Light and dark theme with system-preference detection
- PWA — installable on desktop and mobile for a native-app feel

### Dashboard

The dashboard is the heart of the app, organized into four tabs:

1. **Breakdown** — pie chart of spending by category for the selected period, plus cashflow cards showing total income, total expenses, and net balance. Click a category slice to temporarily exclude it from the chart.
2. **Income vs Expenses** — bar chart comparing income and spending month by month, giving a quick cashflow health view over time.
3. **Monthly** — stacked bar chart of expenses across all months, broken down by category, to spot seasonal patterns.
4. **Trends** — category-level trend lines across months to see which spending areas are growing or shrinking.

All dashboard views support flexible time-range navigation: switch between monthly, quarterly, and yearly scopes and step forward/backward through time.

### Table View

- Chronological list of all transactions for the selected period
- Toggle between flat list and grouped-by-day view
- Inline delete with confirmation
- Add new expenses directly from the table view

### Settings

- Add, rename, reorder, and delete categories (drag-and-drop ordering)
- Set primary currency and a list of supported currencies for multi-currency entry
- Configure fiscal month start date and default start page
- Manage recurring transactions (view, edit, delete templates)
- Export all expenses to CSV
- Import expenses from CSV (columns: `name`, `amount`, `currency`, `category`, `date`, `tags`)

# Screenshots

> Screenshots coming soon — you can generate a populated instance with demo data using the `SEED_DEMO_DATA` flag described below.

| Page | Desktop |
| --- | --- |
| Dashboard – Breakdown | _(placeholder)_ |
| Dashboard – Income vs Expenses | _(placeholder)_ |
| Dashboard – Monthly | _(placeholder)_ |
| Dashboard – Trends | _(placeholder)_ |
| Table View | _(placeholder)_ |
| Settings | _(placeholder)_ |

# Installation

The recommended way to run Sknerus is with Docker.

### Docker CLI

```bash
docker run -d \
  --name sknerus \
  -p 3000:3000 \
  -v sknerus-data:/app/.data \
  ghcr.io/pnowy/sknerus:latest
```

### Docker Compose

```yaml
services:
  sknerus:
    image: ghcr.io/pnowy/sknerus:latest
    restart: unless-stopped
    ports:
      - "3000:3000"
    volumes:
      - ./data:/app/.data
    environment:
      # Optional — seed demo data on first run (no existing data required)
      # SEED_DEMO_DATA: "true"
```

The app will be available at `http://localhost:3000`.

### Building from Source

```bash
git clone https://github.com/pnowy/sknerus.git
cd sknerus
pnpm install
pnpm build
node .output/server/index.mjs
```

For development:

```bash
pnpm dev   # starts dev server at http://localhost:3000
```

# Configuration

All configuration is done either via environment variables (infrastructure-level) or through the in-app Settings page (user-level).

### Environment Variables

| Variable | Default | Description |
| --- | --- | --- |
| `PORT` | `3000` | Port the server listens on |
| `DATA_DIR` | `.data` | Directory where JSON data files are stored |
| `SEED_DEMO_DATA` | _(unset)_ | Set to `true` to seed demo data on first run (see below) |
| `LOG_LEVEL` | `info` | Log verbosity: `debug`, `info`, `warn`, `error` |

### In-App Settings

Everything else is configured from the `/settings` page:

- **Categories** — add, rename, reorder (drag-and-drop), and delete categories
- **Currency** — set the primary display currency
- **Supported Currencies** — currencies available when adding a transaction (exchange rates resolved automatically)
- **Start Date** — day of month that begins a new fiscal period (default: 1st)
- **Start Page** — which page loads first: dashboard or table view
- **Recurring Transactions** — manage recurring income and expense templates
- **Export / Import** — download all data as CSV or upload a CSV to import transactions

### Data Storage

Sknerus uses a simple file-based JSON storage by default. Data is stored in three files inside `DATA_DIR`:

- `expenses.json` — all transactions
- `config.json` — categories, currency, and app settings
- `recurring.json` — recurring transaction templates

Mount `DATA_DIR` as a persistent volume to retain data across container restarts.

> **Note:** Sknerus does not include authentication. Use a reverse proxy (e.g. Nginx, Caddy, Traefik) with basic auth or SSO in front of it if exposing beyond localhost.

# Demo Data

Sknerus ships with a built-in demo data generator that seeds ~2.5 years of realistic family budget data (Jan 2023 → current month). It is useful for exploring the app before entering your own data.

**To enable:** set `SEED_DEMO_DATA=true` and start with no existing data (or a fresh `DATA_DIR`).

The seed generates:

- **12 categories**: Salary, Groceries, Housing, Utilities, Transport, Health, Entertainment, Kids, Dining Out, Clothing, Education, Subscriptions
- **Income**: primary salary (with annual raises), partner salary starting a few months in, December bonuses, occasional freelance income
- **Fixed costs**: rent, internet, streaming subscriptions, gym membership
- **Variable costs**: groceries (3–4 trips/month), fuel, utilities with seasonal swings (higher in winter), dining out
- **Seasonal patterns**: clothing peaks in spring/autumn, summer vacation in July, Christmas spending in December, school supplies in August/September
- **Sporadic entries**: doctor visits, pharmacy, dental, car service, home maintenance

Once data exists, the seed is skipped automatically on subsequent starts — safe to leave the flag enabled.