import { array } from '@ember/helper';

export interface SettingsShowcaseNearbyCompactListSignature {
  Args: {
    enabled: boolean;
  };
  Element: HTMLDivElement;
}

// A schematic (not real station data) comparing one big landscape card
// against a 2x2 grid of the same card shrunk down, mirroring the actual
// big/small toggle on /nearby (a name+time header, then a stat pair and a
// round thumbnail) without rendering real stations. Whichever size matches
// the current preference is highlighted; the other stays dim.
<template>
  <div
    class="flex items-center justify-center gap-3 rounded-lg bg-slate-100 p-4"
    ...attributes
  >
    <div
      class="flex aspect-[3/2] w-28 flex-col justify-between rounded-md bg-white p-2 ring-1 ring-slate-200 transition
        {{if @enabled 'opacity-40' 'opacity-100'}}"
    >
      <div class="flex items-start justify-between gap-1">
        <div class="h-2 w-2/3 rounded-full bg-slate-300"></div>
        <div class="h-1.5 w-3 rounded-full bg-slate-300"></div>
      </div>
      <div class="flex items-end justify-between gap-1">
        <div class="flex flex-col gap-1">
          <div class="h-1.5 w-6 rounded-full bg-slate-300"></div>
          <div class="h-1.5 w-6 rounded-full bg-slate-300"></div>
        </div>
        <div class="size-5 rounded-full bg-slate-300"></div>
      </div>
    </div>

    <div
      class="grid grid-cols-2 gap-1 transition
        {{if @enabled 'opacity-100' 'opacity-40'}}"
    >
      {{#each (array 1 2 3 4)}}
        <div
          class="flex aspect-[3/2] w-13 flex-col justify-between rounded bg-white p-1 ring-1 ring-slate-200"
        >
          <div class="flex items-start justify-between gap-0.5">
            <div class="h-1 w-2/3 rounded-full bg-slate-300"></div>
            <div class="h-1 w-1.5 rounded-full bg-slate-300"></div>
          </div>
          <div class="flex items-end justify-between gap-0.5">
            <div class="h-1 w-3 rounded-full bg-slate-300"></div>
            <div class="size-2.5 rounded-full bg-slate-300"></div>
          </div>
        </div>
      {{/each}}
    </div>
  </div>
</template>
