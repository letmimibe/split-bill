# Patungan

**Split the bill without killing the vibe.**

Patungan is a lightweight, mobile-first bill-splitting app for shared meals. Upload a receipt, check what was read, assign each item to the people who had it, and let Patungan handle the maths — including shared dishes, tax, service charge, discounts, and rounding.

**Live product:** https://split-bill-akz.pages.dev/

> Good food. Good company. A little less maths.

## The problem

Splitting a restaurant bill should be the least memorable part of dinner. In practice, it often means passing a receipt around, opening a calculator, figuring out who shared what, accounting for tax and service, and eventually sending a long explanation to the group chat.

Patungan turns that into a short flow:

**Upload → Review → Assign → Share**

The goal is not to make bill splitting feel like accounting software. It should feel quick, understandable, and friendly enough to use while everyone is still at the table.

## What Patungan does

- **AI receipt reading** — upload a receipt photo and let Gemini extract line items, prices, currency, tax, service charge, discount, and total.
- **Human review before applying** — extracted data is shown for confirmation instead of silently becoming the bill.
- **Item-level splitting** — assign an item to one person or split it equally between several people.
- **Fair extras** — tax, service charge, and discounts are distributed proportionally.
- **Multi-currency support** — the app preserves the receipt currency and never pretends to perform currency conversion.
- **iPhone-friendly uploads** — JPG, PNG, WebP, HEIC, and HEIF are supported. HEIC/HEIF images are converted locally before receipt reading.
- **Long screenshot handling** — unusually tall screenshots are segmented so receipt text stays readable instead of being compressed into a tiny image.
- **Shareable results** — copy the breakdown, save a branded result as an image or PDF, or share it through WhatsApp/native sharing.
- **EN / ID interface** — English and Bahasa Indonesia are available, with the preference saved on-device.
- **Mobile-first experience** — designed around the way the product is most likely to be used: at the table, from a phone.

## How it works

### 1. Upload a receipt

The browser prepares the image before sending it for receipt reading. Large images are resized, iPhone HEIC/HEIF files are converted to JPEG, and long screenshots can be divided into sequential segments.

### 2. Review the AI result

Gemini returns structured receipt information, but Patungan does not treat AI output as unquestionable truth. Users see the extracted items and charges first and can correct anything uncertain before applying it to the bill.

### 3. Say who had what

Add the people at the table, then assign each item to one or more people. Shared items are divided equally between their owners.

### 4. Settle and share

Patungan calculates each person's final share, shows which items belong to them, and produces a compact breakdown that can be copied, exported, or shared.

## Product principles

**Fast to start.** No account, onboarding flow, or database is required to split one bill.

**Easy to verify.** AI speeds up data entry, but the receipt remains visible and the extracted result remains editable.

**The maths must reconcile.** A friendly interface is only useful if everyone's rounded share still adds up to the final bill.

**Sharing should be easier than explaining.** The result includes each person's amount and their assigned item names, with image/PDF export and native sharing for the last step.

**Feel like the dinner table, not a banking dashboard.** The visual language is deliberately warm and informal rather than fintech-heavy.

## AI, with guardrails

Receipt reading is useful precisely because manually typing a long bill is tedious. It also introduces uncertainty, so the AI layer is intentionally separated from the calculation layer.

The receipt reader:

- keeps the Gemini API key server-side in a Cloudflare Pages Function;
- sends receipt images only when the user explicitly uploads or retries them;
- treats text found inside a receipt as untrusted data, not instructions;
- requests receipt fields in a predictable JSON structure;
- validates the provider response on the server before returning it to the browser;
- preserves unknown prices as unknown instead of silently inventing a usable amount;
- requires a review step before extracted data replaces the current bill;
- uses a separate, explicit **Read more carefully** action rather than silently spending another AI request.

Standard reading currently uses `gemini-3.5-flash-lite`; the careful retry uses `gemini-3.8-flash`.

## Privacy and trust

Patungan itself does **not persist uploaded receipt photos**. Images are prepared in the browser and sent to Google Gemini for receipt reading through the server-side API route. Receipt and bill state otherwise lives in the current browser session rather than a Patungan user database.

Google's processing of Gemini API content is governed by the Gemini API terms:

https://ai.google.dev/gemini-api/terms

For a public production deployment, provider quotas and abuse controls still matter. The current Origin check reduces casual cross-site browser use but is not authentication; Cloudflare rate limiting or Turnstile would be sensible additions before significantly wider distribution.

## Calculation model

Patungan keeps AI extraction and money calculation separate. Once a bill is applied, deterministic code handles the split.

- Item price means the **full line total**, including quantity.
- An item with multiple owners is divided equally between those owners.
- Added tax and service charge are allocated proportionally to each person's item subtotal.
- Discounts are allocated proportionally as well.
- Tax already included in item prices is not added a second time.
- Currency is displayed, not converted.
- Money is calculated using integer minor units rather than floating-point currency arithmetic.
- Final rounding uses a largest-remainder approach so individual shares still add up to the bill.
- IDR uses whole rupiah; currencies with fractional minor units retain their appropriate precision.

## A few edge cases I cared about

Small details became a surprisingly large part of making the product feel dependable:

- iPhone camera photos may arrive as HEIC rather than JPEG.
- A scrolling screenshot should not become an unreadable thumbnail just because it is very tall.
- A blurry or uncertain receipt should be reviewable rather than confidently converted into bad numbers.
- One shared plate may belong to three people while everyone else has individual items.
- Discounts should not create a one-rupiah disagreement between the displayed bill and everyone's combined share.
- Saving a result on iPhone should use the native share sheet so **Save Image** can put it into Photos.
- The final summary should say not only how many items someone had, but what those items were.

## Architecture

```text
Receipt photo / screenshot
        ↓
Browser preprocessing
resize · HEIC conversion · long-image segmentation
        ↓
Cloudflare Pages Function
/api/receipt
        ↓
Gemini Interactions API
        ↓
server validation
        ↓
editable receipt review
        ↓
deterministic split calculation
        ↓
copy · image · PDF · native/WhatsApp share
```

The project intentionally has **no application database** at this stage. That keeps the core one-off bill-splitting flow small and reduces the amount of user data Patungan needs to hold.

## Interesting implementation decisions

### Why preprocess images in the browser?

Sending a full-resolution phone photo is usually unnecessary for receipt text and makes requests heavier. Patungan resizes/compresses ordinary images before upload. Long screenshots use a different path: preserving readable width matters more than forcing the entire image into one small frame.

### Why split long screenshots?

If a very tall screenshot is resized based on its longest dimension, the text can become tiny. Patungan instead creates overlapping sequential segments and sends them as parts of the same receipt.

### Why keep a review state?

OCR and multimodal models can misread numbers. The product treats AI as a data-entry shortcut, not as the source of truth. A review state makes uncertainty visible before it can affect everyone's payment.

### Why calculate in minor units?

Currency arithmetic with ordinary floating-point numbers can produce subtle rounding errors. Converting values to integer minor units makes the calculation predictable, after which the remainder can be distributed deterministically.

### Why keep export/share separate from receipt reading?

The receipt reader and result-sharing UI solve different problems. Keeping export/share in its own module means changes to a branded image, PDF, or iOS sharing flow do not need to disturb the AI receipt pipeline.

## Iteration notes

One useful lesson from building Patungan was that structured AI integrations can fail before the model ever sees the image. An earlier receipt-reader implementation used a structured-output configuration that Gemini rejected at the request layer. The receipt flow was moved to the Gemini Interactions API, while application-side validation remained responsible for deciding whether a result is safe to use.

That debugging pass also led to a better loading state: receipt processing now gives immediate visual feedback instead of making an upload appear frozen while the provider request is running.

Later iterations added HEIC support, segmented long screenshots, item names in each person's final summary, branded image/PDF export, and a native iOS sharing path.

## Local development

The production site is a Git-connected Cloudflare Pages project.

For the complete app, including `/api/receipt`:

```bash
npx wrangler pages dev dist
```

Create an untracked `.dev.vars` file:

```text
GEMINI_API_KEY=your_development_key
```

Never commit the key.

For UI-only preview:

```bash
python3 -m http.server 8000 --directory dist
```

A plain static server can preview the interface but cannot run the receipt-reading API route.

### Cloudflare Pages settings

```text
Production branch: main
Framework: None
Build command: (empty)
Output directory: dist
Root directory: repository root
Secret: GEMINI_API_KEY
```

Cloudflare compiles `functions/api/receipt.js` into the `/api/receipt` Pages Function on Git-connected deployments.

## Possible next steps

The current product is intentionally focused on the one-table, one-session flow. Future directions could include opt-in/local-first bill history, shareable collaborative sessions, payment links or QR handoff, and stronger public-deployment abuse protection.

---

**Made while eating dubai chewy cookies.**  
Built by [@letmimibe](https://github.com/letmimibe).