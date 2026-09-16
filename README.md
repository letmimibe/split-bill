# Patungan

A responsive receipt-splitting website, with a warm brown/beige theme, English by default, and an EN/ID language switch. The language preference is saved on the device; receipt and bill data remain in memory only.

## Cloudflare Pages deployment

- Production branch: `main`
- Framework: None
- Build command: leave empty
- Output directory: `dist`
- Root directory: leave empty (repository root)
- Add an encrypted Production secret named `GEMINI_API_KEY` in Settings → Variables and Secrets, then deploy.
- Cloudflare compiles `functions/api/receipt.js` into a Pages Function for `/api/receipt` automatically on Git-connected deployments. The secret never appears in browser code.

The website sends receipt photos to Google Gemini only when uploaded or explicitly retried. Free-tier Gemini content may be used by Google to improve its products. The app does not persist photos or log them. Standard reading uses `gemini-3.5-flash-lite`; the explicit “Read more carefully” action uses `gemini-3.8-flash`. No automatic retries or provider fallbacks consume extra quota. Google project quotas apply across all visitors. An Origin check reduces cross-site browser use but is not authentication or a complete abuse protection system; consider Cloudflare rate limiting/Turnstile before wider public promotion. Keep the Gemini project on its free tier if paid usage is not wanted.

## Receipt review and calculation

AI output is schema-constrained and validated on the server. Review the extracted items, original currency, charges and total before applying them. Unknown amounts remain blank and cannot silently become a usable bill. Tax already included in line prices is excluded from added tax. The app never converts currency. Price means the full line total including quantity. Shared items split equally; additional charges and discounts split proportionally. Calculation uses integer minor units and largest-remainder rounding. IDR is rounded to whole rupiah.

## Fonts

Neulis Neue is requested through local font faces (Regular, Medium, Bold). A licensed webfont has not been supplied, so devices without Neulis Neue use Nunito Sans from Google Fonts, then a system sans-serif. To guarantee Neulis Neue on every device, supply licensed WOFF2 files or an Adobe Fonts web-project stylesheet, and update the `@font-face` sources in `dist/style.css`. Do not upload desktop font files without a web embedding license.

## Local development

For the complete app with the API route, use Cloudflare Wrangler:

```
npx wrangler pages dev dist
```

Put a development key in an untracked `.dev.vars` file as `GEMINI_API_KEY=...`. Never commit it. A plain static server can preview the UI but cannot run `/api/receipt`.

For UI-only preview:

```
python3 -m http.server 8000 --directory dist
```

`.openai/hosting.json` is retained from the original Sites deployment. Production is now the Git-connected Cloudflare Pages project.
