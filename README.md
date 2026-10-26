# MedStack

**Congressional App Challenge submission: Virginia District 11 (VA-11)**

Point your phone at a pill bottle. MedStack reads the label, adds the drug to a
medication stack, and draws a **safety map**: every drug is a node, and every
dangerous combination is a colored line that appears the instant you scan a new
bottle. Tap a line for a plain-English warning with a severity rating, read aloud.

Built for the caregiver managing medications for a family member, where pills
come from different doctors and no one is checking whether the full combination
is safe together.

## How it works

1. **Scan.** The browser camera captures the label, and **Groq** vision extracts
   the drug name and dosage.
2. **Resolve.** For every pair in the stack, **Firecrawl** performs a two-step
   lookup: it scrapes the drug's interaction index page, finds the real pairwise
   URL for the other drug, then scrapes that specific page.
3. **Translate.** **Groq** rewrites the raw clinical text into one plain sentence
   plus a green, yellow, or red severity.
4. **See.** The safety map draws the line. Red means know before the first dose.

There is no bundled drug database and no hardcoded interaction table. Every
result in the app is scraped live at the moment you scan.

### Why two steps

Drugs.com's pairwise interaction pages are addressed by internal numeric IDs,
not drug names. A name-guessed URL silently redirects to one drug's general
interactions page, which returns a clean scrape that never mentions the second
drug. Resolving the real pairwise link from the index page first is what makes
arbitrary drug pairs work.

## Features

- **Scan or add manually.** The camera reads a label, or you can type a drug in.
- **Interaction check.** Every time the stack changes, each pair is checked and
  given a red, yellow, or green rating.
- **Safety map.** A node graph of your medications, or a plain list with letter
  grades if you prefer.
- **Rename.** If a scan reads "ibuprofen" but you know it as Advil, rename it.
  The real drug name is kept for lookups and shown underneath.
- **Groups.** Organize medications into groups, like a morning routine.
- **Accounts.** Sign up and sign in; each account keeps its own stack saved on
  the device.

## Tech

- Frontend: React + Vite (mobile-first web app, runs in a phone browser)
- Backend: Node + Express (single service that also serves the built frontend)
- **Firecrawl** for live interaction data with two-step pairwise URL resolution
- **Groq** for label vision and plain-English severity
- Browser APIs for camera capture and speech synthesis
- Deployed on Render with Docker

No database for interaction data. Results are resolved live, with an in-memory
cache so each pair is only scraped once per session. Accounts and saved stacks
are stored locally in the browser (demo-grade, not secured; not for real
sensitive data).

## Run locally

You need two API keys. Put them in `backend/.env` (gitignored, never commit):

```
GROQ_API_KEY=your_groq_key
FIRECRAWL_API_KEY=your_firecrawl_key
PORT=8080
```

```bash
# backend
cd backend
npm install
node --env-file=.env --watch src/server.js   # http://localhost:8080

# frontend (separate terminal)
cd frontend
npm install
npm run dev                                   # http://localhost:5173
```

Check `localhost:8080/api/health`: both `groq` and `firecrawl` should be `true`.

> Camera and speech require HTTPS or localhost. On a phone, use the deployed
> HTTPS URL, not a LAN IP.

## Known limitations

- Brand names may not match Drugs.com's index links; generic names are more reliable.
- Each pair costs two Firecrawl calls plus one Groq call, so large stacks can hit
  free-tier rate limits. Add medications one at a time.
- If a pair is not listed in the index, the app reports that honestly rather than
  guessing.
- Accounts are local to the device and not securely stored. This is a prototype.

## Not medical advice

MedStack is a prototype. It surfaces possible interactions to prompt a
conversation with a doctor or pharmacist. It does not replace one.
