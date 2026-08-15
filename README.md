# Basic Keelboat Study

A personal study site for the US Sailing "Basic Keelboat" evaluation —
reference pages, an interactive points-of-sail diagram, and a quiz engine
with score tracking. Vite + React, no backend, everything (including quiz
progress) is saved to `localStorage` in your browser.

Live site: https://kpetski.github.io/sailing-101/

## Running locally

```bash
npm install
npm run dev
```

Then open the printed `http://localhost:5173/sailing-101/` URL.

## Deploying to GitHub Pages

Deploys are done with the `gh-pages` npm package, which builds the app and
pushes the `dist/` output to a `gh-pages` branch that GitHub Pages serves
from.

**One-time setup** (already done for this repo, listed for reference):
1. In GitHub → repo Settings → Pages, set "Source" to "Deploy from a
   branch" and branch to `gh-pages` / `/(root)` — this happens
   automatically the first time you run `npm run deploy` (the `gh-pages`
   package creates the branch), you just need to select it in Settings
   afterward if it isn't picked up automatically.

**Every time you want to publish new changes:**

```bash
npm run deploy
```

This runs `npm run build` (type-checks + builds to `dist/`) and then
publishes `dist/` to the `gh-pages` branch. Give it a minute or two, then
refresh the live site.

> The Vite `base` in `vite.config.ts` and the `homepage` field in
> `package.json` are both set to `/sailing-101/` to match this repo's name.
> If you ever rename the repo, update both.

## Adding or editing study content

Everything content-related lives under `src/data/` as plain TypeScript —
no component code needs to change to add material.

- **`src/data/terms.ts`** — the term/definition glossary, grouped by topic.
  Add a new entry like:

  ```ts
  { id: "some-unique-id", topic: "rig", term: "Vang", definition: "..." },
  ```

  `topic` must be one of the ids in `src/data/topics.ts`. Recall quiz
  questions (both "term → definition" and "definition → term", including
  multiple-choice where there are enough terms in the topic to build
  distractors) are **generated automatically** from this file — you don't
  need to touch `src/data/questions.ts` for plain glossary content.

- **`src/data/questions.ts`** — hand-written question types that need more
  than a term/definition pair:
  - `MANEUVER_QUESTIONS` — "what maneuver is this?" scenarios that pair a
    prompt with a `<PointsOfSailDiagram>` (boat heading(s), an optional
    turn arc, obstacle, and/or target) and a `tack | jibe | headUp |
    fallOff` answer. Copy the shape of an existing entry — heading numbers
    are "wheel degrees" where `0` = dead upwind, `±180` = dead downwind,
    positive = starboard side.
  - `POINT_OF_SAIL_QUESTIONS` — single-boat "what point of sail is this?"
    diagram questions.
  - `LabelQuestion`s ("what is the highlighted part called?") are generated
    automatically from `src/components/LabelDiagram.tsx` — see below.

- **`src/data/topics.ts`** — the 8 topic categories shown on the home page
  and used to group everything else. Add a new topic here first if you
  want a whole new category.

To add new photos/pages from your textbook: just add more entries to
`terms.ts` under the topic they belong to (or add a new topic). The
reference page for that topic (`src/pages/TopicReference.tsx`) picks them
up automatically.

- **`src/components/LabelDiagram.tsx`** — an original schematic side-profile
  sailboat (hull + rig), *not* traced from any textbook image, with named
  label points (`HULL_LABEL_POINTS`, `RIG_LABEL_POINTS`) whose `id`s match
  term ids in `terms.ts`. Powers both the "tap a dot to reveal its name"
  practice section on the Boat Nomenclature / Rig Parts reference pages and
  the "what is the highlighted part called?" quiz questions. To add a new
  labeled part: add the term to `terms.ts`, then add `{ id, x, y }` to the
  matching points array here (coordinates are in the SVG's own coordinate
  space — `HullArt`/`RigArt` show the viewBox).

## Using your own textbook photos (local only)

The public site uses original schematic art (`LabelDiagram.tsx`), not your
textbook's actual illustrations — those are copyrighted by US Sailing, and
this is a public site, so embedding a photo of them would be redistributing
copyrighted material to anyone who visits the URL.

If you'd rather study against your *actual* textbook photos, there's a
local-only version of the labeling tool that never gets built or deployed:

1. Save your photos into `local-assets/` (gitignored) as `hull.jpg` and
   `rig.jpg` — see `local-assets/README.md` for exact instructions.
2. Run `npm run dev` and open the Boat Nomenclature or Rig Parts reference
   page. A "Your photo — local only, never deployed" card appears
   automatically once it detects the file.
3. **Calibrate**: click on the photo for each part in turn, then **Save to
   disk** (writes `local-assets/hull-points.json` etc.). **Practice** and
   **Match** modes then work the same way as the built-in diagram, but
   against your real photo.

This is safe to leave in place — `vite.config.ts`'s `localAssetsPlugin` uses
`apply: 'serve'`, so the code that serves `local-assets/` only runs for
`vite dev` and is never invoked during `vite build` / `npm run deploy`, and
nothing under `local-assets/` is ever imported by app code (it's fetched by
URL at runtime), so there's no path by which it ends up in `dist/` or the
`gh-pages` branch.

**TODO (someday):** look for a real, license-compatible replacement for the
public schematic diagram — e.g. a public-domain or CC0/CC-BY-licensed
small-keelboat hull + rig diagram, or commission/draw one from scratch
matching the textbook's exact term set. A quick search turned up mostly
big-ship or gaff-rig diagrams under CC-BY-SA that didn't match well; nothing
found yet that's both a clean license and the right boat type.

## How it's built

- **`src/components/PointsOfSailDiagram.tsx`** — the reusable SVG diagram
  (ported from an earlier plain-HTML prototype), used on both reference
  pages and in quiz questions. Takes one or two boat headings, an optional
  turn arc, and optional obstacle/target markers.
- **`src/pages/`** — `Home` (topic picker + progress), `TopicReference`
  (per-topic reading material), `Quiz` (question flow + results).
- **`src/hooks/useQuizProgress.ts`** — per-topic score tracking and a
  "missed questions" set, persisted to `localStorage`.
- **`src/lib/grading.ts`** — forgiving free-text grading (trims whitespace,
  case-insensitive, ignores trailing punctuation).
- Routing uses `HashRouter` (URLs look like `/#/quiz`) so it works on
  GitHub Pages without any server-side rewrite rules.
