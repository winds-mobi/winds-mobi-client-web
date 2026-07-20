// The `animate-spin-once-a`/`-b` Tailwind utilities (see app/styles/app.css)
// share an identical keyframe under two different names, purely so a CSS
// animation genuinely restarts on every press: it only replays when its
// `animation-name` value actually changes, so re-applying the *same* class
// twice in a row wouldn't play it again. Alternating on a running press
// count keeps that value different every time, with no manual timing/reset
// (no setTimeout, no `animationend` listener, no forced reflow) needed.
export function oneOffSpinClass(pressCount: number): string {
  if (pressCount === 0) {
    return '';
  }

  return pressCount % 2 === 1 ? 'animate-spin-once-a' : 'animate-spin-once-b';
}
