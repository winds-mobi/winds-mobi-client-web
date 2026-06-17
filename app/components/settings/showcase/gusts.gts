import SettingsWindArrow from 'winds-mobi-client-web/components/settings/wind-arrow';

export interface SettingsShowcaseGustsSignature {
  Args: {
    enabled: boolean;
  };
  Element: HTMLDivElement;
}

// A single station arrow on a map-like backdrop; its gusts-coloured centre
// circle appears or disappears with the preference, exactly as the on-map
// marker does. The sample's gusts (38) sit in a higher wind band than its
// average (18), so the centre lights up when enabled.
<template>
  <div
    class="flex items-center justify-center rounded-lg bg-slate-100 p-4"
    ...attributes
  >
    <SettingsWindArrow
      class="h-16 w-16"
      @direction={{135}}
      @speed={{18}}
      @gusts={{38}}
      @showGusts={{@enabled}}
    />
  </div>
</template>
