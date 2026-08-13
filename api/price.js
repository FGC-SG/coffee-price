// /api/price — indicative London ICE Robusta (RC) price, USD/MT.
// Runs server-side on Vercel (no CORS/browser limits). Best-effort, indicative only.
// Returns: { price:Number, source:String, asof:"YYYY-MM-DD" }  on success
//          { message:String }  with a non-200 status on failure.
//
// Robusta trades in USD per metric tonne, so a valid quote should sit in a sane band.
// Anything outside PLAUSIBLE_BAND is rejected rather than risk feeding a wrong-unit
// (e.g. Arabica cents/lb) or garbage number into a valuation tool.

const PLAUSIBLE_MIN = 800;    // USD/MT
const PLAUSIBLE_MAX = 8000;   // USD/MT

function today() {
  return new Date().toISOString().slice(0, 10);
}

function sane(n) {
  return typeof n === "number" && isFinite(n) && n >= PLAUSIBLE_MIN && n <= PLAUSIBLE_MAX;
}

// Primary: Yahoo Finance chart API. RC=F is the London/ICE-Europe Robusta continuous
// contract, quoted in USD/tonne (matches our USD/MT base).
async function fromYahoo() {
  const url = "https://query1.finance.yahoo.com/v8/finance/chart/RC=F?interval=1d&range=5d";
  const r = await fetch(url, {
    headers: { "User-Agent": "Mozilla/5.0", "Accept": "application/json" },
  });
  if (!r.ok) throw new Error("yahoo http " + r.status);
  const j = await r.json();
  const res = j && j.chart && j.chart.result && j.chart.result[0];
  if (!res) throw new Error("yahoo empty");
  let price = res.meta && (res.meta.regularMarketPrice ?? res.meta.previousClose);
  if (!sane(price)) {
    // fall back to the last non-null close in the series
    const q = res.indicators && res.indicators.quote && res.indicators.quote[0];
    const closes = (q && q.close) || [];
    for (let i = closes.length - 1; i >= 0; i--) {
      if (sane(closes[i])) { price = closes[i]; break; }
    }
  }
  if (!sane(price)) throw new Error("yahoo price out of band");
  return { price: Math.round(price), source: "ICE Robusta (RC) via Yahoo Finance — indicative" };
}

// Fallback: Stooq CSV. Symbol rc.f = Robusta coffee continuous.
async function fromStooq() {
  const url = "https://stooq.com/q/l/?s=rc.f&f=sd2t2ohlcv&h&e=csv";
  const r = await fetch(url, { headers: { "User-Agent": "Mozilla/5.0" } });
  if (!r.ok) throw new Error("stooq http " + r.status);
  const text = await r.text();
  const lines = text.trim().split("\n");
  if (lines.length < 2) throw new Error("stooq empty");
  const cols = lines[0].toLowerCase().split(",");
  const vals = lines[1].split(",");
  const ci = cols.indexOf("close");
  const price = parseFloat(vals[ci]);
  if (!sane(price)) throw new Error("stooq price out of band");
  return { price: Math.round(price), source: "Robusta (rc.f) via Stooq — indicative" };
}

module.exports = async (req, res) => {
  res.setHeader("Cache-Control", "no-store, max-age=0");
  res.setHeader("Content-Type", "application/json; charset=utf-8");

  const errors = [];
  for (const fn of [fromYahoo, fromStooq]) {
    try {
      const out = await fn();
      res.status(200).end(JSON.stringify({ ...out, asof: today() }));
      return;
    } catch (e) {
      errors.push(e.message || String(e));
    }
  }
  res.status(502).end(JSON.stringify({
    message: "no live indicative price available (" + errors.join("; ") + ") — enter manually",
  }));
};
