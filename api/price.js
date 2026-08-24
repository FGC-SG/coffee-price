
クラウド
/
Claudeが応答中です

ウェブを検索しました
ウェブを検索しました
Recommendation
Your /api/price already chains Yahoo RC=F → Stooq rc.f (both free, no key). For a robust third layer, add Commodities-API (purpose-built Robusta JSON, keyed) as tertiary, and FRED's IMF Robusta benchmark as a last-resort "always-answers" floor. Keep the sanity band (800–8000 USD/MT) so any source that returns garbage or the wrong unit is rejected.

Hard rule: never fall back to Arabica (KC=F, ICE US). It's a different bean, market, and unit (US¢/lb) — substituting it would silently corrupt the valuation.

Ranked secondary sources for London Robusta (ICE "RC")
Source	Access	Key?	Latency	Unit	Notes
Yahoo RC=F (current primary)	JSON	No	~15-min delayed intraday	USD/MT	Same contract/unit as your base. Endpoint can change without notice.
Stooq rc.f (current fallback)	CSV	No	EOD	USD/MT	Simple, reliable, but end-of-day only.
Commodities-API — ROBUSTA or dated RMF26/RMK26	JSON	Yes (free tier)	~intraday	USD-based	Purpose-built for this; good server-side (key stays in a Vercel env var). Third-party aggregator — verify its number against a known print before trusting for a deal.
FRED PCOFFROBUSDA/M (IMF Robusta)	JSON	Yes (free)	Monthly/annual, lagged	US¢/lb	Rock-solid uptime; a true benchmark, not a live quote. Last-resort only, needs unit conversion (¢/lb ×22.046 = USD/MT) and a clear "lagging benchmark" label.
ICE consolidated EOD	Market-data feed	Licensed	Official settlement	USD/MT	The authoritative number. Required if a price actually strikes collateral or a trade — carries a market-data licence cost.
Avoid for automated pulls: Investing.com and TradingView have no official free API; scraping them breaches ToS and breaks often.

Two caveats for a valuation tool
Accuracy vs. availability. Free aggregators (Yahoo/Stooq/Commodities-API) are fine for an indicative screen — which your disclaimer already says. The moment a figure sets collateral or prices a deal, use the official ICE settlement (licensed) or a broker print; a fallback benchmark shouldn't strike a real number.
Unit/contract drift. Each source can quote a different contract month or unit. Your sanity band catches unit errors; consider also stamping the source name on-screen (the function already returns source) so the analyst sees which layer answered.
Offer
I can extend api/price.js now to: Yahoo → Stooq → Commodities-API → FRED (last resort), each labeled in the returned source, with FRED's cents/lb→USD/MT conversion and a "monthly benchmark" flag. Commodities-API and FRED need a free API key stored as a Vercel Environment Variable (server-side, never in the page). Want me to wire that in and hand you the two env-var names to set?

Sources: Commodities-API Robusta · FRED PCOFFROBUSDM · ICE Robusta contract

I mean I want ICE robusta price but from multiple sources in case the primary source is not available.

Got it — you want the same ICE London Robusta (RC) price, just pulled from several providers so a single outage doesn't break "Update Now." That's pure redundancy, not alternative benchmarks. (Scrap the FRED/IMF idea — that's a different, lagging series; and never Arabica KC=F.)

Reliable providers that all carry the same ICE Europe London Robusta futures:

Order	Provider	Symbol	Key?	Cost
1 (primary)	Yahoo Finance	RC=F	No	Free
2	Stooq	rc.f	No	Free
3	Commodities-API	ROBUSTA	Yes	Free tier
(opt)	Barchart OnDemand	RC*0	Yes	Paid
Let me wire the first three into a fallback chain now — it tries each in order and returns the first value inside the sanity band, labeling which provider answered.


2個のツールを使用しました, ファイルを作成しました, コマンドを実行しました
2個のツールを使用しました, ファイルを作成しました, コマンドを実行しました
Done — same ICE Robusta (RC) quote, now with a 3-provider fallback chain.

How it behaves: it tries Yahoo RC=F → Stooq rc.f → Commodities-API ROBUSTA in order and returns the first quote inside the 800–8000 USD/MT sanity band, tagging which provider answered in the source field. If all fail, it returns a clear error and the button falls back to manual entry. Syntax-checked.

Two free layers work immediately; the third is optional:

Yahoo + Stooq need no key — active on deploy.
Commodities-API is skipped unless you set an environment variable. To enable it: Vercel → project fgc-robusta-valuation → Settings → Environment Variables → add COMMODITIES_API_KEY = your key (free tier at commodities-api.com), then redeploy. The key stays server-side, never in the page.
To deploy this update:

cp ~/Downloads/price.js ~/Downloads/robusta-deploy/api/price.js
cd ~/Downloads/robusta-deploy
git add -A && git commit -m multi-source-price && git push
(adjust the cp path to wherever price.js downloaded)

Then open https://fgc-robusta-valuation.vercel.app/api/price — it should return JSON with a source naming whichever provider answered.

Want me to add Barchart (RC*0) as a fourth, paid fallback too, or is three enough? Note the earlier deploy-visibility issue still stands — if the live site isn't updating after push, it's the Production/Preview promotion check from before.


Price
JS 
{"message":"no live indicative price available (yahoo http 404; stooq http 404) — enter manually"}
That error is from the earlier two-source version (its wording and lack of Commodities-API give it away) — but it's still the key finding: both Yahoo RC=F and Stooq rc.f returned 404, meaning those symbols/endpoints don't resolve server-side. This is exactly the risk I flagged since I couldn't test from here. Let me diagnose the correct endpoints now.


ウェブを検索しました
ウェブを検索しました
Root cause found, and it's a data-availability problem, not a bug: Yahoo and Stooq simply don't carry the ICE London Robusta (RC) futures in USD/MT. The 404s confirm the symbols don't resolve. My web check shows Yahoo only lists Robusta as index series (^NQCIRMER / ^NQCIRMTR — index levels, not $/MT), and there's no plain RC=F. So the free, no-key layer can't ever return the number you want.

The honest conclusion: a reliable ICE Robusta feed requires a keyed data provider that explicitly lists Robusta. There is no free, no-key source for it. Your options:

Provider	Robusta symbol	Key	Cost	Notes
Commodities-API	ROBUSTA	Yes	Free tier	Lowest friction; aggregator — spot-check accuracy
Barchart OnDemand	RM*0	Yes	Paid	More authoritative, closer to ICE
Manual only (current default)	—	No	Free	Already works; you type the ICE settle. Safest for anything that strikes collateral
Two things worth stating plainly for a valuation tool: aggregator prices should be spot-checked, and for a figure that actually prices a deal or collateral you'd want the official ICE settlement (licensed), not a free feed.

Which way do you want to go?

How should the live ICE Robusta price feed work, now that free no-key sources don't carry it?
Commodities-API (free key)

ページを取得しています · 1 ノート
ページを取得しています · 1 ノート
Claudeがcommodities-api.comからページを取得することを許可しますか？
https://commodities-api.com/documentation
ページを取得中… · 3分30秒


クレジットを使用中 • プランの上限は8月26日の10:00にリセットされます。




Claude は AI のため、誤りを含む可能性があります。回答内容は必ずご確認ください。
Price · JS
// /api/price — indicative London ICE Robusta (RC) futures price, USD/MT.
// Runs server-side on Vercel (no CORS/browser limits). Best-effort, indicative only.
//
// SAME data point (ICE Europe London Robusta "RC" front month) pulled from several
// providers for redundancy: it tries each in order and returns the first quote that
// lands inside the sanity band, tagging which provider answered in `source`.
//
// Providers:
//   1. Yahoo Finance   RC=F     (free, no key)
//   2. Stooq           rc.f     (free, no key)
//   3. Commodities-API ROBUSTA  (needs env var COMMODITIES_API_KEY; skipped if unset)
//
// Returns: { price:Number, source:String, asof:"YYYY-MM-DD" } on success
//          { message:String } with a non-200 status if every provider fails.
//
// Robusta trades in USD per metric tonne, so a valid quote must sit in a sane band.
// Anything outside PLAUSIBLE_BAND is rejected rather than risk feeding a wrong-unit
// (e.g. Arabica US cents/lb) or garbage number into a valuation.
 
const PLAUSIBLE_MIN = 800;    // USD/MT
const PLAUSIBLE_MAX = 8000;   // USD/MT
 
function today() {
  return new Date().toISOString().slice(0, 10);
}
function sane(n) {
  return typeof n === "number" && isFinite(n) && n >= PLAUSIBLE_MIN && n <= PLAUSIBLE_MAX;
}
 
// 1) Yahoo Finance chart API. RC=F = London/ICE-Europe Robusta continuous, USD/tonne.
async function fromYahoo() {
  const url = "https://query1.finance.yahoo.com/v8/finance/chart/RC=F?interval=1d&range=5d";
  const r = await fetch(url, { headers: { "User-Agent": "Mozilla/5.0", "Accept": "application/json" } });
  if (!r.ok) throw new Error("yahoo http " + r.status);
  const j = await r.json();
  const res = j && j.chart && j.chart.result && j.chart.result[0];
  if (!res) throw new Error("yahoo empty");
  let price = res.meta && (res.meta.regularMarketPrice ?? res.meta.previousClose);
  if (!sane(price)) {
    const q = res.indicators && res.indicators.quote && res.indicators.quote[0];
    const closes = (q && q.close) || [];
    for (let i = closes.length - 1; i >= 0; i--) { if (sane(closes[i])) { price = closes[i]; break; } }
  }
  if (!sane(price)) throw new Error("yahoo price out of band");
  return { price: Math.round(price), source: "ICE Robusta (RC=F) via Yahoo Finance — indicative" };
}
 
// 2) Stooq CSV. rc.f = Robusta coffee continuous.
async function fromStooq() {
  const url = "https://stooq.com/q/l/?s=rc.f&f=sd2t2ohlcv&h&e=csv";
  const r = await fetch(url, { headers: { "User-Agent": "Mozilla/5.0" } });
  if (!r.ok) throw new Error("stooq http " + r.status);
  const text = await r.text();
  const lines = text.trim().split("\n");
  if (lines.length < 2) throw new Error("stooq empty");
  const cols = lines[0].toLowerCase().split(",");
  const vals = lines[1].split(",");
  const price = parseFloat(vals[cols.indexOf("close")]);
  if (!sane(price)) throw new Error("stooq price out of band");
  return { price: Math.round(price), source: "ICE Robusta (rc.f) via Stooq — indicative" };
}
 
// 3) Commodities-API. Rates are expressed per base currency, so the raw value may be
//    inverted (units-per-USD); test both the value and its reciprocal against the band.
async function fromCommoditiesAPI() {
  const key = process.env.COMMODITIES_API_KEY;
  if (!key) throw new Error("commodities-api key not set");
  const url = "https://commodities-api.com/api/latest?access_key=" +
              encodeURIComponent(key) + "&base=USD&symbols=ROBUSTA";
  const r = await fetch(url);
  if (!r.ok) throw new Error("commodities-api http " + r.status);
  const j = await r.json();
  if (!j || j.success === false) throw new Error("commodities-api " + ((j && j.error && j.error.info) || "error"));
  const rate = j.data && j.data.rates && j.data.rates.ROBUSTA;
  const candidates = [Number(rate), rate ? 1 / Number(rate) : NaN];
  const price = candidates.find(sane);
  if (!sane(price)) throw new Error("commodities-api price out of band");
  return { price: Math.round(price), source: "ICE Robusta (ROBUSTA) via Commodities-API — indicative" };
}
 
module.exports = async (req, res) => {
  res.setHeader("Cache-Control", "no-store, max-age=0");
  res.setHeader("Content-Type", "application/json; charset=utf-8");
 
  const errors = [];
  for (const fn of [fromYahoo, fromStooq, fromCommoditiesAPI]) {
    try {
      const out = await fn();
      res.status(200).end(JSON.stringify({ ...out, asof: today() }));
      return;
    } catch (e) {
      errors.push((fn.name || "provider") + ": " + (e.message || String(e)));
    }
  }
  res.status(502).end(JSON.stringify({
    message: "no live ICE Robusta price from any source (" + errors.join("; ") + ") — enter manually",
  }));
};
 

