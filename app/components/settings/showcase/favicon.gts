import type { TOC } from '@ember/component/template-only';
import SettingsWindArrow from 'winds-mobi-client-web/components/settings/wind-arrow';

export interface SettingsShowcaseFaviconSignature {
  Args: {
    enabled: boolean;
  };
  Element: HTMLDivElement;
}

// A small browser-tab mock: when the preference is on, the favicon slot holds
// the selected station's wind arrow; when off, it falls back to the standard
// winds.mobi favicon. The tab title stays the station's name either way, so the
// preview isolates exactly what the toggle changes.
const SettingsShowcaseFavicon: TOC<SettingsShowcaseFaviconSignature> = <template>
  <div
    class="flex items-center gap-2 rounded-t-lg border border-b-0 border-slate-300 bg-slate-100 px-3 py-2 shadow-inner"
    ...attributes
  >
    <span class="flex h-4 w-4 shrink-0 items-center justify-center">
      {{#if @enabled}}
        <SettingsWindArrow
          class="h-4 w-4"
          @direction={{135}}
          @speed={{15}}
          @gusts={{40}}
          @showGusts={{true}}
        />
      {{else}}
        <img src="/favicon.ico" alt="" class="h-4 w-4" />
      {{/if}}
    </span>
    <span class="truncate text-xs font-medium text-slate-600">
      Höhematte | winds.mobi
    </span>
  </div>
</template>;

export default SettingsShowcaseFavicon;
