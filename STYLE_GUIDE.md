# Toolbox Style Guide

Shared visual language for every tool in this folder (Toolbox launcher,
Banner Generator, Cover Converter, Sessions Radio Maker, Thumbnail Maker).

## What this is
An adaptation of **xAI's marketing design system** — near-black canvas,
white-translucent outline pills as the entire interactive vocabulary, one
proprietary geometric sans (Universal Sans → Inter) at weight 400 only, and
uppercase GeistMono for every label and number. It's dark-canvas natively,
so nothing needed "translating" — `{colors.canvas}` (`#0a0a0a`) already
matches what these tools were built on.

The brand is deliberately monochrome: no accent hue, no gradients, no
shadows — hairline borders and a rare filled-white pill carry all the
emphasis. Two scoped exceptions, both practical necessities a marketing site
doesn't have to solve:
1. **The image work-surface** (drop-zone, live preview canvas) stays pure
   black (`#000`) — it mirrors the actual exported artwork, same as
   Photoshop/Lightroom keep a dark canvas regardless of app chrome.
2. **Status feedback** (queue item active/done, upload progress) needs a
   signal a pure white/black hierarchy can't give cleanly — see "Functional
   status color" below. Used only for that, nowhere else.

## Color tokens
```css
:root{
  --bg: #0a0a0a;                 /* canvas */
  --surface: #191919;            /* canvas-card */
  --surface-soft: #1a1c20;       /* canvas-soft — hovered rows, tooltips */
  --surface-mid: #363a3f;        /* canvas-mid — nested surfaces */
  --border: #212327;             /* hairline */
  --border-outline: rgba(255, 255, 255, 0.25); /* the pill-button border */
  --border-outline-hover: rgba(255, 255, 255, 0.5);
  --text: #ffffff;               /* ink */
  --text-muted: #dadbdf;         /* body */
  --text-faint: #7d8187;         /* body-mid / mute */
  --on-primary: #0a0a0a;         /* text on the rare filled-white pill */

  /* Functional status only — never decorative, never a button/badge color */
  --success: #05b169;
  --danger-hover: #e55;          /* destructive hover only, no resting color */
}
```
No accent hue exists otherwise. White *is* the brand's color — used as
outline-pill borders, the rare filled-primary pill, and focus rings.

## Typography
Universal Sans is proprietary; substitutes:
```css
--font-display: 'Inter', -apple-system, system-ui, "Segoe UI", Roboto, Helvetica, Arial, sans-serif;
--font-mono:    'Geist Mono', 'JetBrains Mono', ui-monospace, SFMono-Regular, Menlo, monospace;
```
Load Inter + Geist Mono (or JetBrains Mono) from Google Fonts in `<head>`.

- **Weight 400 everywhere. Never bold.** The brand never bolds — negative
  tracking and size hierarchy do the emphasis work instead. This applies to
  headlines, labels, and button text alike.
- Tight **negative** letter-spacing on display sizes only (roughly
  `-0.02em` to `-0.04em` at the largest sizes); body stays at 0 tracking.
- Tool/page title: 32–48px, weight 400, letter-spacing ~-0.02em
- Body / descriptions: 14–16px, weight 400, `color: var(--text-muted)`,
  line-height 1.4–1.5
- **Eyebrows, small labels, and every number** (dimensions, counts, episode
  numbers, zoom %, prices) render in `--font-mono`, uppercase where it's a
  label, positive letter-spacing ~0.08–0.1em — "reads like a code comment,"
  per the brand's own description
- Button label: 14px, weight 400 (not 600 — stays consistent with the
  no-bold rule)

## Shape scale
```
sm    8px    ALL cards / panels / inputs — the brand's one card radius
pill  9999px ALL buttons — the entire interactive shape
full  9999px icon circles / avatar / swatch circles
```
No intermediate radius steps (no 12/16/24px tier) — the brand's shape system
is deliberately just these three. Sharp corners only on full-bleed bands
(page background itself), never on a component.

## Spacing
Base unit 4px: 4 · 8 · 12 · 16 · 24 · 32 · 48 · 64.
Card interior padding: 24px. Dense tool sidebars/rails can go tighter
(12–16px) where a working tool needs more density than a marketing card —
just keep the same radius/border/type rules.

## Components

**Outline pill button** — the default, used for ~every action
```css
background: transparent;
color: var(--text);
border: 1px solid var(--border-outline);
border-radius: 9999px;
font: 400 14px var(--font-display);
padding: 10px 20px;              /* tighter 8px 14px acceptable in sidebars */
transition: border-color 0.15s ease, background 0.15s ease;
/* hover: border-color var(--border-outline-hover); background rgba(255,255,255,0.04) */
```

**Filled primary pill** — rare, reserve for the single most important action
per tool (the one export/download button)
```css
background: #ffffff;
color: var(--on-primary);
border: 1px solid #ffffff;
border-radius: 9999px;
font: 400 14px var(--font-display);
padding: 10px 20px;
/* hover: background #fafaf7 (ink-hover) */
/* disabled: background var(--surface-mid); color var(--text-faint); border-color var(--border); cursor not-allowed */
```
Everything that isn't this one action stays an outline pill — don't let two
filled buttons compete on the same screen.

**Card / panel**
```css
background: var(--surface);
border: 1px solid var(--border);
border-radius: 8px;
padding: 24px;               /* 12-16px in dense sidebars */
/* no shadow, ever */
```

**Eyebrow / label / tag** (GeistMono)
```css
font-family: var(--font-mono);
font-size: 11-12px;
font-weight: 400;
letter-spacing: 0.08em;
text-transform: uppercase;
color: var(--text-faint);
```
Tags that need a visible chip (not just inline text) get a hairline pill:
`border: 1px solid var(--border); border-radius: 9999px; padding: 4px 12px;`
background stays transparent or `var(--surface)`.

**Text input**
```css
background: var(--surface-soft);
border: 1px solid var(--border);
color: var(--text);
border-radius: 8px;
padding: 12px 16px;
font: 400 15px var(--font-display);
/* focus: border-color rgba(255,255,255,0.5) — no color shift, brand stays monochrome */
```

**Image work-surface (drop-zone / live canvas)** — the one deliberately
literal-black exception
```css
background: #000;
border: 1.5px dashed var(--border-outline);
border-radius: 8px;
/* hover/drag-over: border-color var(--border-outline-hover); background rgba(255,255,255,0.03) */
```

**Icon circle**
```css
width: 32-40px; height: 32-40px;
border-radius: 9999px;
background: var(--surface-soft);
border: 1px solid var(--border);
```

**Functional status color** (queues, upload progress — not present in a
marketing-site spec, but necessary in a tool)
```css
/* waiting:  color: var(--text-faint) */
/* active:   color: var(--text) — plain white, no accent hue needed */
/* done:     color: var(--success) — the one functional exception, text-only, never a fill */
```

## Elevation
Flat by default — no shadow, hairline border only, ever. On hover/lift,
brighten the border (`var(--border-outline-hover)` or `var(--border)` →
lighter) and optionally a 1–2px `translateY` — never add a shadow tier.

## Interaction details
- Hover/press transitions: 120–150ms ease, on `border-color`, `background`,
  `transform` only
- The filled-white pill darkens text-on-white contrast automatically; it
  never changes hue
- Focus-visible required everywhere: `outline: 2px solid rgba(255,255,255,0.6);
  outline-offset: 3px`

## When restyling a tool
1. Keep functionality and copy untouched — this only governs the visual
   layer
2. The image work-surface (drop-zone/canvas) stays black; everything else
   repoints to the tokens above
3. If a tool draws brand-specific color onto its *exported output* (canvas
   fill/stroke, not UI chrome), leave that literal alone — e.g. Sessions
   Radio Maker draws real Spinnin'-red `#FF4948` text onto exported assets
   via a hardcoded JS constant; that's product output, not UI theme
4. Every button becomes an outline pill except the one primary action per
   screen; cards get 8px radius and a hairline border, never a shadow;
   labels and numbers move to GeistMono
