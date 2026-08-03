import type { TOC } from '@ember/component/template-only';
import { Type } from '@warp-drive/core/types/symbols';
import StationWindContent from 'winds-mobi-client-web/components/station/wind/presenter';
import type { History } from 'winds-mobi-client-web/services/store.js';

export interface SettingsShowcaseWindDirectionSignature {
  Element: HTMLDivElement;
}

const now = Date.now();
const SAMPLE_HISTORY: History[] = [0, 10, 20, 30, 40].map((speed, index) => ({
  id: `preview-${index}`,
  direction: index * 72,
  speed,
  gusts: speed + 5,
  temperature: 17,
  humidity: 54,
  rain: 0,
  timestamp: now - (4 - index) * 6 * 60 * 1000,
  [Type]: 'history',
}));

// Renders the real wind history chart with sample data instead of a
// bespoke mini chart, so this preview always matches production exactly --
// including reading the beta toggle itself via
// StationWindContent#windDirectionEnabled, with no @enabled prop needed.
const SettingsShowcaseWindDirection: TOC<SettingsShowcaseWindDirectionSignature> =
  <template>
    <div class="rounded-lg bg-slate-100 p-2" ...attributes>
      <StationWindContent
        @history={{SAMPLE_HISTORY}}
        @stationId="settings-preview"
      />
    </div>
  </template>;

export default SettingsShowcaseWindDirection;
