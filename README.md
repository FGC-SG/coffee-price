# Robusta Grade Valuation

Standalone Indonesia Robusta grade valuation calculator for **Felicity Global Capital**.

Prices SNI Grades 1–6 off the London ICE Robusta (RC) base price. The base grade is
EK-1 G4/80def (Grade 4b). Each grade's FOB = Base FOB × (1 + % delta), where the
**% delta vs base is user-editable** per grade. Delta values are seeded from the
Grade 1 / Grade 5 anchors via 3-anchor interpolation and can be reset on demand.

Features: live recompute, on-screen and printed base-price source disclosure,
Print / Save-PDF, and CSV export.

## Deploy

Static site — no build step. Served as-is by Vercel.

- `index.html` — the app (single file, inline CSS/JS)
- `vercel.json` — clean URLs + baseline security headers

## Disclaimer

Internal decision-support tool — not an official price or trade recommendation.
The base price is indicative unless replaced with an official ICE settlement.
