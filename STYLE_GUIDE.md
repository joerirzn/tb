# Toolbox Style Guide

Shared visual language for every tool in this folder (Toolbox launcher,
Banner Generator, Cover Converter, Sessions Radio Maker, Thumbnail Maker).

## What this is
A **dark-mode translation of Apple's web design system** — reverent,
quiet-UI, photography-first minimalism, adapted for tools instead of
product marketing. Apple's own documentation is explicitly light-dominant
("dark-mode counterparts... were not surfaced"), so this translation uses
Apple's own dark-tile palette (`surface-tile-1/2/3`, pure black nav) as the
*default* canvas instead of the rare exception, and promotes **Sky Link
Blue** (`#2997ff` — Apple's own "on dark surfaces" accent variant) to the
single accent color throughout, since Action Blue (`#0066cc`) is
documented as disappearing against a dark tile.

The one deliberate carve-out, same as every prior pass: the literal
**image work-surface** (drop-zone, live preview canvas) stays pure black —
it mirrors the actual exported artwork, the way Photoshop/Lightroom keep a
dark canvas regardless of app chrome.

## Color tokens
```css
:root{
  --bg: #000000;              /* true void — Apple's surface-black / nav bar */
  --surface: #272729;         /* card / panel — Apple's surface-tile-1 */
  --surface-2: #2a2a2c;       /* adjacent surface, micro-step lighter */
  --surface-3: #252527;       /* embedded frames, micro-step darker */
  --border: rgba(255,255,255,0.08);   /* hairline on dark */
  --border-hover: rgba(255,255,255,0.16);
  --text: #ffffff;            /* body-on-dark */
  --text-muted: #cccccc;      /* body-muted — secondary copy on a dark tile */
  --text-faint: #86868b;      /* derived analog of ink-muted-48, for fine print */
  --accent: #2997ff;          /* Sky Link Blue — the one accent, works on dark */
  --accent-focus: #0071e3;    /* focus-ring variant */
  --on-accent: #ffffff;       /* text on a filled blue pill */
  --success: #30d158;         /* functional only — queue "done" state, never a fill */
}
```
Blue is Apple's *only* interactive signal — every link, every primary pill,
every selected/focus state. Reserve the **filled** blue pill for the single
most important action per screen; other interactive chrome (utility
buttons like Clear/Reset, the Toolbox back-link) stays neutral (white
text, translucent border) the way Apple's own nav utility buttons
(Sign In, Bag) stay dark/neutral rather than blue — blue is for actions
and links, not incidental chrome.

## Typography
SF Pro is proprietary; substitute with Inter per Apple's own documented
fallback:
```css
--font-display: 'Inter', -apple-system, system-ui, "Segoe UI", Roboto, Helvetica, Arial, sans-serif;
--font-body:    'Inter', -apple-system, system-ui, "Segoe UI", Roboto, Helvetica, Arial, sans-serif;
```
No monospace token — Apple's system has none; small labels are Inter, not
mono, and **not uppercase** (Apple never uppercases UI text).

- **Weight ladder is 300 / 400 / 600 / 700 — 500 never appears.** Mid-weight
  reads always round up to 600.
- **Body copy runs at 17px, not 16px**, weight 400, line-height 1.47. This
  one extra pixel is a deliberate Apple signature — don't round it down.
- Headlines: weight 600 (not 700) with tight **negative** letter-spacing
  (roughly -0.02em to -0.03em at large sizes). Weight 300 is reserved for
  rare "airy" large reads (a lead paragraph, a big secondary CTA label) —
  don't use it as a default anywhere.
- Small labels / captions: 12–14px, weight 600 for emphasis (card labels,
  section labels) or 400 for plain secondary text — sentence case, never
  uppercase, never tracked wide.
- Button label: 17px/400 on a primary pill (matches body size — Apple
  doesn't shrink CTA text), 14px/400 on compact utility buttons.

## Shape scale
```
sm    8px    compact utility buttons/chips (Apple's button-dark-utility)
lg    18px   ALL cards / panels — Apple's store-utility-card radius
pill  9999px ALL primary actions, ALL text inputs (Apple pill-shapes its
             search input too — inputs are pills here, not just buttons)
full  9999px icon circles / avatars
```
No intermediate radius between 8 and 18 — Apple's own rule is "don't mix
radii grammars."

## Spacing
Base unit 8px: 8 · 12 · 16 · 20 · 24 · 32 · 48. Card padding 24px. Button
padding ~11px × 22px on a primary pill, tighter (8px × 15px) on compact
utility buttons.

## Components

**Primary pill button** — the one filled-blue action per screen
```css
background: var(--accent);
color: var(--on-accent);
border: none;
border-radius: 9999px;
font: 400 17px var(--font-body);
padding: 11px 22px;
transition: transform 0.1s ease;
/* active/press: transform: scale(0.95) — Apple's system-wide micro-interaction,
   never an opacity fade or color darken */
/* disabled: background var(--surface-2); color var(--text-faint); */
```

**Secondary/ghost pill** (a true second CTA, e.g. "Learn more" style)
```css
background: transparent;
color: var(--accent);
border: 1px solid var(--accent);
border-radius: 9999px;
```

**Utility pill** (Clear, Reset, None, back-link — incidental chrome, stays
neutral, not blue)
```css
background: transparent;
color: var(--text);
border: 1px solid var(--border-hover);
border-radius: 9999px;
padding: 8px 15px;
font: 400 14px var(--font-body);
/* hover: border-color var(--text-faint) */
```
The one destructive exception (Clear/Remove hover) still turns `#e55` on
`:hover` only — never a resting color.

**Card / panel** — Apple's store-utility-card, directly reused
```css
background: var(--surface);
border: 1px solid var(--border);
border-radius: 18px;
padding: 24px;
/* no shadow, ever */
```

**Text input** — pill-shaped, matching Apple's search-input
```css
background: var(--surface);
border: 1px solid var(--border);
color: var(--text);
border-radius: 9999px;
padding: 12px 20px;
font: 400 17px var(--font-body);
/* focus: border-color var(--accent) */
```

**Image work-surface (drop-zone / live canvas)** — stays literal black
```css
background: #000;
border: 1.5px dashed var(--border-hover);
border-radius: 18px;
/* hover/drag-over: border-color var(--accent); background rgba(41,151,255,0.08) */
```

**Selected / active state** (overlay swatch, queue item, chip) — Apple's
`configurator-option-chip-selected`: the border upgrades to accent, nothing
else changes
```css
border-color: var(--accent);
/* optionally: background rgba(41,151,255,0.08) */
```

**Icon circle**
```css
width: 32-44px; height: 32-44px;
border-radius: 9999px;
background: var(--surface-2);
```

## Elevation
Flat everywhere — Apple's system has **exactly one** shadow in the entire
language, reserved for product photography resting on a surface, never for
cards, buttons, or text. We have no product photography, so: no shadows,
anywhere. Elevation comes only from a surface-color step (`--bg` →
`--surface` → `--surface-2`).

## Interaction details
- Buttons press with `transform: scale(0.95)` — never opacity, never a
  color darken. This is Apple's one micro-interaction, used everywhere.
- Only Default and Active/Pressed states are documented — don't invent a
  separate hover treatment beyond a subtle border-color shift.
- Focus-visible: `outline: 2px solid var(--accent-focus); outline-offset: 3px`

## When restyling a tool
1. Keep functionality and copy untouched — this only governs the visual
   layer
2. The image work-surface (drop-zone/canvas) stays black; everything else
   repoints to the tokens above
3. If a tool draws brand-specific color onto its *exported output* (canvas
   fill/stroke, not UI chrome), leave that literal alone — e.g. Sessions
   Radio Maker draws real Spinnin'-red `#FF4948` text onto exported assets
   via a hardcoded JS constant; that's product output, not UI theme
4. Strip `text-transform: uppercase`, wide letter-spacing, and any
   monospace font-family from labels — Apple never uppercases UI text and
   has no mono token
5. Audit for `font-weight: 500` and round it up to 600 (or down to 400) —
   the ladder is 300/400/600/700 only
6. Cards get 18px radius; buttons and inputs get pill radius (9999px);
   nothing in between
