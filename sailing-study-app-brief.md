# Sailing Study App — Build Brief for Claude Code

## Goal
A personal study site to help me pass my US Sailing "Basic Keelboat" class
evaluation in Milwaukee. I need to review terminology, points of sail,
tacking/jibing logic, and be quizzed until concepts stick. This will run on
my phone and laptop, so it needs to work well on mobile.

## Tech stack (my constraints)
- I know **Node and React** — please use that.
- Must be **free to host** and deployable as a **GitHub Pages** site.
- Recommended: **Vite + React**, deployed via `gh-pages` npm package or a
  GitHub Actions workflow to the `gh-pages` branch. Please set up whichever
  is simplest to maintain, and explain how I re-deploy after future edits
  (e.g. `npm run deploy`).
- No backend/server — everything client-side. Use `localStorage` for saving
  quiz progress/scores between visits (this is a real browser, not a Claude
  artifact, so localStorage is fine here).
- Keep dependencies minimal. Plain CSS or a lightweight approach is fine —
  no need for a heavy UI framework.

## Content to cover
I'm using US Sailing's **Basic Keelboat** textbook and an instructor cheat
sheet. Structure the content data (e.g. as JSON or TS files under
`src/data/`) so I can easily add/edit terms myself later without touching
component code. Cover:

1. **Boat nomenclature** — bow, stern, port, starboard, deck, cabin trunk,
   cockpit, tiller, rudder, keel, hull, transom, companionway.
2. **Rig parts** — mainsail, jib, mast, boom, spreader, forestay, backstay,
   shrouds, mainsheet, jib sheets, halyards (main + jib), outhaul, downhaul,
   winch, cam cleat, telltales.
3. **Points of sail** — No-Go (No-Sail) Zone, close reach, beam reach, broad
   reach, run. **Note: skip close-hauled — my boats don't use that term,
   close reach is the closest point to the wind we sail.**
4. **Tacking vs. jibing** — bow-through-the-wind vs. stern-through-the-wind,
   port tack vs. starboard tack (named for which side the wind hits, same
   side the boom is out on), and the related "heading up" (push tiller away
   → bow turns toward wind) / "falling off" (pull tiller in → bow turns away
   from wind) distinction. A tack is just heading-up pushed all the way
   through; a jibe is falling-off carried past dead downwind.
5. **Sail trim** — sheeting in vs. easing/sheeting out, safety position
   (close reach + ease mainsheet).
6. **Right of way (COLREGS basics)** — avoid collision at all cost, sailboats
   over powerboats (except commercial/towing vessels), starboard tack over
   port tack, leeward over windward, overtaking vessel gives way.
7. **Docking/leaving dock & mooring basics, crew overboard (quick turn /
   figure 8)** — lighter coverage, just enough to quiz on the checklist
   items.
8. **The "Three Key Questions"**: Where is the wind coming from? What is my
   point of sail? Are my sails trimmed properly? (+ bonus: has anything
   changed since I started asking?)

I'll upload photos of my textbook pages and instructor cheat sheet as I go —
build the data structure so it's easy for me (or a future Claude session) to
transcribe new pages into it.

## Diagrams (important — reuse this logic)
I already have a working reference implementation of an interactive
points-of-sail wheel diagram (plain HTML/SVG/JS) that shows, per boat icon:
- Boat heading placed on a wind-relative wheel (wind blowing from the top of
  frame, straight down, with a clearly labeled arrow + dashed centerline).
- No-Go Zone as a shaded wedge at the top.
- A boom/sail line whose angle approximates trim for that point of sail
  (roughly in-line with centerline near close reach, swinging toward
  perpendicular near a run).
- A small dot marking the **helmsperson**, always on the **windward** side
  (opposite the boom).
- A **wind indicator** (single streamer near the shrouds/mast) that points
  straight back near irons and straight out to the side at beam reach — this
  is distinct from jib telltales.
- Scenario cards pairing a written prompt with the diagram, a color-coded
  answer chip (Tack / Jibe / Head Up / Fall Off), and a collapsible "Why?"
  explanation.

Please **port this SVG-diagram approach into a reusable React component**
(e.g. `<PointsOfSailDiagram heading={...} obstacle={...} target={...} />`)
so it can be reused across both a reference/reading page and the quiz
itself (e.g. quiz could show a diagram and ask "what maneuver is this?").

I can hand you the existing HTML file's SVG-generation logic as a reference
if useful — ask me for it if you want to see the exact math (wind-angle to
XY conversion, boom-angle formula, etc.) rather than reinventing it.

## Quiz mechanics
- Question bank organized by the topic areas above, stored as data (not
  hardcoded in components) so it's easy to extend.
- Multiple question types:
  - Simple recall (term → definition, definition → term)
  - "What tack is this?" / "Tack, jibe, head up, or fall off?" using the
    diagram component with a random heading/scenario
  - Multiple choice and free-text (forgiving grading — trim whitespace,
    case-insensitive, accept minor variants)
- Score tracking per topic area (so I can see which sections I'm weak on),
  persisted in localStorage.
- A "missed questions" review mode that re-quizzes anything I got wrong.
- Let me choose to quiz on **all topics** or a **specific topic** (mirrors
  how I've been studying with you section by section).

## Pages/structure (suggest a sensible default, open to your judgment)
- Home / topic picker
- Reference pages per topic (readable summaries + diagrams, not just quiz)
- Quiz flow (question → answer → immediate feedback → next)
- Results/progress view

## Design
- Clean, legible on a phone screen, nautical but not kitschy — reuse the
  color palette from my existing diagram file if you'd like a starting
  point (deep teal `#0f3d3e`, warm paper background `#f5f1e6`, rust accent
  `#b5533c`, gold accent `#c8973a`), but feel free to make it your own.

## Deliverables I want from you (Claude Code)
1. Working Vite + React app scaffolded and runnable locally.
2. GitHub Pages deployment configured and documented (README with exact
   commands).
3. The reusable points-of-sail diagram component.
4. Initial question bank seeded with the content above (I'll expand it).
5. A short README section explaining how I add new terms/questions myself.
