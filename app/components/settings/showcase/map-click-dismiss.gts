import type { TOC } from '@ember/component/template-only';
import HandTap from 'ember-phosphor-icons/components/ph-hand-tap';

export interface SettingsShowcaseMapClickDismissSignature {
  Args: {
    enabled: boolean;
  };
  Element: HTMLDivElement;
}

// A mini map-with-panel mock, in the same panel-beside-map arrangement the real
// map uses on a wide screen: the tap lands on the map, and the panel next to it
// is drawn as already leaving (faded, dashed) once the preference is on, or
// staying put (solid) while it is off.
const SettingsShowcaseMapClickDismiss: TOC<SettingsShowcaseMapClickDismissSignature> =
  <template>
    <div
      class="flex h-20 items-stretch gap-1.5 rounded-lg bg-slate-100 p-2"
      ...attributes
    >
      <div
        class="flex w-1/3 items-center justify-center rounded-md border text-center text-[0.5rem] leading-tight font-semibold transition
          {{if
            @enabled
            'border-dashed border-slate-300 bg-white/40 text-slate-400'
            'border-slate-300 bg-white text-slate-600'
          }}"
      >
        Höhematte
      </div>
      <div
        class="flex flex-1 items-center justify-center rounded-md bg-slate-200"
      >
        <HandTap @size={{22}} @weight="fill" class="text-slate-500" />
      </div>
    </div>
  </template>;

export default SettingsShowcaseMapClickDismiss;
