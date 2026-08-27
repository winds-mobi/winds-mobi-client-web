// The one JS-level constant for "this station is alarming" — every file
// that needs the color (not just a Tailwind class) imports this instead of
// writing `var(--color-alarm)` as a literal string a second time. Currently
// used by app/modifiers/select-map-marker.ts's SVG `stroke` attribute — no
// Tailwind class to reach for there, unlike the cards/panel below. Not used
// by app/components/alarm/compass-rose.gts's threshold text, deliberately —
// that's a neutral-slate readout of the picked value, not itself a signal
// that something is alarming.
//
// The CSS side of this is app/styles/app.css's `@theme` block:
// `--color-alarm: var(--color-rose-500);` — that line is the actual color
// definition; this constant and the `*-alarm` Tailwind utilities below both
// just point at it. Retune the color itself there, not here.
export const ALARM_COLOR = 'var(--color-alarm)';

// The glow applied to station cards/panels (nearby-card.gts,
// compact-card.gts, station/index.gts) so the "alarming" signal is visible
// even where the bell itself isn't shown — compact cards render no header
// at all. Both pieces are forced with Tailwind's `!`, not just the border:
// on the station detail panel specifically, its landscape/md breakpoints
// already set their own arbitrary `shadow-[...]` box-shadow, and two
// same-property utilities (ours and theirs) don't reliably resolve by
// source order without it (see CLAUDE.md's Button `class` note) — forcing
// both means the full glow, not just the border, shows there too.
// - `border-2! border-alarm!` — thicker and colored, overriding the
//   existing static `border border-slate-200`. Tailwind auto-generates the
//   `*-alarm` utility family (`border-alarm`, `shadow-alarm`, ...) from the
//   same `--color-alarm` theme token `ALARM_COLOR` above points at — the
//   same mechanism this app already uses for `bg-wind-05` etc.
// - `shadow-[0_0_16px_2px_var(--color-alarm)]!` — a soft, centered glow (no
//   offset, wide blur) rather than a directional drop-shadow or a hard
//   ring; reads as "this is emitting attention" rather than "this has
//   elevation" or "this is outlined." Built from `ALARM_COLOR` rather than
//   a second literal `var(--color-alarm)` string.
export const ALARM_GLOW_CLASS = `border-2! border-alarm! shadow-[0_0_16px_2px_${ALARM_COLOR}]!`;
