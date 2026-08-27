let alarmAudio: HTMLAudioElement | undefined;

// Plays the alarm tone on a newly-triggered station (see
// app/components/alarm/watcher.gts). Browsers block audio with no prior
// user gesture in the tab; that generally holds once the visitor has
// interacted with the app at all this session, but is not guaranteed
// (mobile Safari especially) — failure here is silent on purpose, with the
// pulsing bell and red marker ring (app/modifiers/select-map-marker.ts) as
// the real fallback signal.
export function playAlarmSound(): void {
  alarmAudio ??= new Audio('/sounds/alarm.wav');
  alarmAudio.currentTime = 0;
  void alarmAudio.play().catch(() => {
    // Autoplay blocked — nothing to do here, see comment above.
  });
}
