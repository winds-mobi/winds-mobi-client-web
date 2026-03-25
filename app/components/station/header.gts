import Component from '@glimmer/component';
import { formatNumber } from 'ember-intl';
import timeAgo from 'winds-mobi-client-web/helpers/time-ago';
import type { Station } from 'winds-mobi-client-web/services/store.js';

export interface StationHeaderSignature {
  Args: {
    station: Station;
  };
  Blocks: {
    default: [];
  };
  Element: null;
}

export default class StationHeader extends Component<StationHeaderSignature> {
  get lastReadingRelativeSeconds() {
    return Math.round(
      this.args.station.last.timestamp / 1000 - Date.now() / 1000
    );
  }

  <template>
    <div class="min-w-0">
      <h2
        data-test-station-title
        class="min-w-0 truncate text-xl font-bold text-slate-950"
      >
        {{@station.name}}
      </h2>

      <div
        class="mt-1 flex flex-wrap items-center gap-x-2 gap-y-1 text-xs font-medium text-slate-500"
      >
        <span>{{formatNumber @station.altitude maximumFractionDigits=0}} m</span>
        <span aria-hidden="true" class="text-slate-300">&middot;</span>
        <span>{{timeAgo this.lastReadingRelativeSeconds}}</span>
        <span aria-hidden="true" class="text-slate-300">&middot;</span>
        <a
          data-test-station-provider-link
          href={{@station.providerUrl}}
          target="_blank"
          rel="noopener noreferrer"
          class="underline decoration-slate-300 underline-offset-3 transition hover:text-slate-900 hover:decoration-slate-500"
        >
          {{@station.providerName}}
        </a>
      </div>
    </div>
  </template>
}
