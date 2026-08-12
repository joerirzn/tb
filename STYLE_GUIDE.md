# Toolbox Style Guide

Shared visual language for all tools linked from the Toolbox (Social Banner
Creator, Cover Converter, Sessions Asset Generator, Thumbnail Maker, and
Toolbox itself). Paste this file into a new chat, opened in the tool's own
folder, and ask Claude to restyle that tool's `index.html` to match it.

## Why this look
Single dark workspace theme, on purpose — every tool here is a black-canvas
export tool for red-accented label brands (Spinnin' and friends), so a dark
UI that echoes the assets it produces reads as intentional, not lazy. No
light-mode variant is needed; commit fully to dark.

## Color tokens
```css
:root{
  --bg: #0b0b0c;            /* page background */
  --surface: #17171a;       /* card / input background */
  --surface-hover: #1e1f22; /* card hover, input focus */
  --border: #2c2c31;        /* default border */
  --border-hover: #3d3d43;  /* hover border */
  --text: #f2f1ee;          /* primary text, warm off-white */
  --text-muted: #9a9a9e;    /* secondary text */
  --text-faint: #616166;    /* tertiary / hints / footers */
  --accent: #ff4948;        /* the one accent — red, sampled from Spinnin' brand assets */
}
```
Use `--accent` sparingly: primary buttons, active/hover states, small
eyebrows/labels, focus rings. Never introduce a second accent hue — if a tool
needs semantic color (error/success), keep it separate from `--accent` and
desaturate it so it doesn't compete.

## Typography
System stack everywhere — no webfont loading, and it matches the Helvetica
Bold text these tools draw onto exported assets:
```css
font-family: -apple-system, "Helvetica Neue", Helvetica, Arial, sans-serif;
```
- Page/tool title: `font-weight: 800`, `letter-spacing: -0.02em`, `text-wrap: balance`
- Card/section titles: `font-weight: 700–800`, size ~18px
- Body/description text: `font-weight: 400–500`, `color: var(--text-muted)`, ~13.5–15px, line-height ~1.55–1.6
- Small labels/eyebrows/tags: `font-weight: 700`, `font-size: 10.5–11px`, `letter-spacing: 0.08–0.14em`, `text-transform: uppercase`, `color: var(--accent)` or `var(--text-faint)` depending on emphasis
- Numeric fields (episode numbers, dimensions, counters): `font-variant-numeric: tabular-nums`

## Layout conventions
- Generous page padding (~28px mobile, up to 64px top on marketing-style pages)
- Tool UIs with inputs + output: a sticky left rail (~320–340px) for
  controls, scrollable main area on the right for previews/grid — see
  Sessions Asset Generator
- Launcher/index pages: centered content column (max-width ~960px), grid of
  cards — see Toolbox itself
- Use flex/grid `gap`, never stacked margins
- Border-radius: 8px on inputs/buttons/tags, 12–14px on cards
- Card border: `1px solid var(--border)`, background `var(--surface)`

## Components

**Primary button**
```css
background: var(--accent);
color: #fff;
font-weight: 700;
font-size: 13.5px;
padding: 13px 16px;
border-radius: 8px;
transition: transform .1s ease, background .15s ease;
/* hover: lighten to #ff5f5e; active: scale(0.98); disabled: opacity .45 */
```

**Card (clickable / launcher tile)**
```css
background: var(--surface);
border: 1px solid var(--border);
border-radius: 14px;
/* hover: background var(--surface-hover), border var(--border-hover),
   transform: translateY(-2px) */
```
Give clickable cards a small circular arrow affordance top-right that fills
with `--accent` and turns its stroke white on hover — see Toolbox cards.

**Input fields**
```css
background: var(--surface-2, var(--surface-hover));
border: 1px solid var(--border);
color: var(--text);
border-radius: 8px;
padding: 12px 14px;
font-weight: 600;
/* focus: border-color var(--accent), background one step lighter */
```

**Tags / meta chips**
```css
font-size: 10.5px;
font-weight: 700;
color: var(--text-faint);
background: #000;
border: 1px solid var(--border);
border-radius: 5px;
padding: 4px 8px;
```

## Interaction details
- All hover transitions: 120–150ms ease, on `transform`, `background`,
  `border-color` only — never animate layout properties
- Focus-visible state required on every interactive element: `outline: 2px
  solid var(--accent); outline-offset: 3px`
- Respect `prefers-reduced-motion` if any non-trivial motion is added

## When restyling an existing tool
1. Keep the tool's actual functionality and copy untouched — this guide only
   governs visual layer (color, type, spacing, component chrome)
2. Swap hardcoded colors for the tokens above
3. Re-check contrast on `--text-muted` / `--text-faint` against `--surface`
   and `--bg` after the swap
4. Screenshot before/after (headless Chrome works well) to confirm nothing
   broke
