import Component from '@glimmer/component';
import { action } from '@ember/object';
import { on } from '@ember/modifier';
import { fn, get } from '@ember/helper';
import { htmlSafe } from '@ember/template';
import type { SafeString } from '@ember/template';
import { t } from 'ember-intl';
import {
  DIRECTIONS,
  directionIndexForAzimuth,
} from 'winds-mobi-client-web/helpers/azimuth-to-cardinal';
import {
  WIND_COLOUR_BANDS,
  windBandForSpeed,
} from 'winds-mobi-client-web/helpers/wind-to-colour';

export interface AlarmCompassRoseSignature {
  Args: {
    directionBands: (number | null)[];
    onChange: (directionBands: (number | null)[]) => void;
    currentDirection: number;
    currentSpeed: number;
    currentGusts: number;
  };
  Element: HTMLDivElement;
}

// CENTER/LABEL_RADIUS leave a small margin past the rose's own outer edge
// (INNER_RADIUS + 10 * BAND_WIDTH = 90) for the single-line direction
// letter. The armed threshold itself is a separate list below the rose
// (see `armedThresholds`), not a second line here.
const CENTER = 100;
const INNER_RADIUS = 20;
const BAND_WIDTH = 7;
const LABEL_RADIUS = 96;

interface Cell {
  key: string;
  direction: number;
  band: number;
  path: string;
  style: SafeString;
  isCurrentWind: boolean;
  isCurrentGusts: boolean;
}

interface DirectionLabel {
  direction: number;
  text: string;
  x: number;
  y: number;
}

interface ArmedThreshold {
  direction: number;
  directionLabel: string;
  minSpeed: number;
}

// Point on the circle of the given radius at `bearingDeg` clockwise from
// north (0deg = straight up), matching the app's existing wind-direction
// convention (see azimuth-to-cardinal.ts / station-marker.gts's arrow
// rotation) — not the standard math-angle convention.
function polarPoint(radius: number, bearingDeg: number) {
  const rad = (bearingDeg * Math.PI) / 180;

  return {
    x: CENTER + radius * Math.sin(rad),
    y: CENTER - radius * Math.cos(rad),
  };
}

// Path for one annular-sector "cell": the wedge of a ring between
// `innerRadius`/`outerRadius` and `startDeg`/`endDeg`, i.e. one
// direction x band intersection.
function annularSectorPath(
  innerRadius: number,
  outerRadius: number,
  startDeg: number,
  endDeg: number
): string {
  const outerStart = polarPoint(outerRadius, startDeg);
  const outerEnd = polarPoint(outerRadius, endDeg);
  const innerEnd = polarPoint(innerRadius, endDeg);
  const innerStart = polarPoint(innerRadius, startDeg);
  const largeArc = endDeg - startDeg > 180 ? 1 : 0;

  return [
    `M ${outerStart.x} ${outerStart.y}`,
    `A ${outerRadius} ${outerRadius} 0 ${largeArc} 1 ${outerEnd.x} ${outerEnd.y}`,
    `L ${innerEnd.x} ${innerEnd.y}`,
    `A ${innerRadius} ${innerRadius} 0 ${largeArc} 0 ${innerStart.x} ${innerStart.y}`,
    'Z',
  ].join(' ');
}

// A per-direction radial "bar chart": 8 compass-direction wedges, each
// subdivided into 10 rings — one per WIND_COLOUR_BANDS entry. Clicking a
// ring arms that direction at that band (filling every ring from the centre
// out to it, in each band's own colour), so direction and speed/gust
// threshold are picked in a single gesture. Clicking the already-armed
// (topmost filled) ring again clears that direction back to off. The
// station's current reading (`@currentDirection`/`@currentSpeed`/
// `@currentGusts`) is highlighted for context regardless of what's armed —
// its direction sector's wind-speed cell and its gusts cell both get the
// same thin solid black outline, so the user can see where "now" sits
// relative to whatever threshold they're setting.
//
// The SVG is the primary pointer/touch surface and is marked `aria-hidden`;
// a parallel, visually-hidden `<select>` per direction (one of the real,
// standard band options or "Off") is the keyboard/screen-reader-operable
// path, driving the exact same `directionBands` state.
export default class AlarmCompassRose extends Component<AlarmCompassRoseSignature> {
  bandOptions = WIND_COLOUR_BANDS.map((band, index) => ({ band, index }));

  // The cell(s) the station's current reading falls in: same direction
  // sector, one ring for average wind speed and one for gusts (usually
  // different bands, occasionally the same cell). Highlighted below with a
  // thin solid black outline regardless of that cell's fill color, so the
  // reading stays visible whether or not the user has armed anything there
  // yet.
  get currentDirectionIndex(): number {
    return directionIndexForAzimuth(this.args.currentDirection);
  }

  get currentWindBandIndex(): number {
    return WIND_COLOUR_BANDS.indexOf(windBandForSpeed(this.args.currentSpeed));
  }

  get currentGustsBandIndex(): number {
    return WIND_COLOUR_BANDS.indexOf(windBandForSpeed(this.args.currentGusts));
  }

  get cells(): Cell[] {
    const cells: Cell[] = [];

    for (let direction = 0; direction < DIRECTIONS.length; direction++) {
      const armedBand = this.args.directionBands[direction] ?? null;
      const startDeg = direction * 45 - 22.5;
      const endDeg = direction * 45 + 22.5;
      const isCurrentDirection = direction === this.currentDirectionIndex;

      for (const [band, colourBand] of WIND_COLOUR_BANDS.entries()) {
        const filled = armedBand !== null && band <= armedBand;
        const fill = filled ? colourBand.color : 'var(--color-slate-200)';
        const isCurrentWind =
          isCurrentDirection && band === this.currentWindBandIndex;
        const isCurrentGusts =
          isCurrentDirection && band === this.currentGustsBandIndex;

        const stroke =
          isCurrentWind || isCurrentGusts
            ? 'stroke: var(--color-black); stroke-width: 1;'
            : 'stroke: var(--color-white); stroke-width: 0.5;';

        cells.push({
          key: `${direction}-${band}`,
          direction,
          band,
          path: annularSectorPath(
            INNER_RADIUS + band * BAND_WIDTH,
            INNER_RADIUS + (band + 1) * BAND_WIDTH,
            startDeg,
            endDeg
          ),
          style: htmlSafe(`fill: ${fill}; ${stroke}`),
          isCurrentWind,
          isCurrentGusts,
        });
      }
    }

    return cells;
  }

  // String form of each direction's armed band, for the fallback `<select>`s
  // (native `value` binding needs a string; `""` means "off").
  get selectedValues(): string[] {
    return DIRECTIONS.map((_, direction) => {
      const band = this.args.directionBands[direction] ?? null;

      return band === null ? '' : String(band);
    });
  }

  get directionLabels(): DirectionLabel[] {
    return DIRECTIONS.map((text, direction) => {
      const point = polarPoint(LABEL_RADIUS, direction * 45);

      return { direction, text, x: point.x, y: point.y };
    });
  }

  // Armed directions only, each paired with the actual km/h threshold —
  // the armed band's own `min`, not `max`: band-or-higher semantics mean
  // the alarm first fires exactly at that band's lower boundary, so that's
  // the number worth showing (e.g. arming "wind-10" reads as "N >5 km/h",
  // not "N >10 km/h"). Rendered as a list below the rose rather than a
  // second line under each letter — keeps the rose itself small and lets
  // this use a standard Tailwind text size without needing extra margin
  // baked into the rose's own geometry.
  get armedThresholds(): ArmedThreshold[] {
    return DIRECTIONS.map((directionLabel, direction) => {
      const band = this.args.directionBands[direction] ?? null;

      return { direction, directionLabel, band };
    })
      .filter(
        (entry): entry is typeof entry & { band: number } => entry.band !== null
      )
      .map(({ direction, directionLabel, band }) => ({
        direction,
        directionLabel,
        minSpeed: WIND_COLOUR_BANDS[band]!.min,
      }));
  }

  @action
  armDirection(direction: number, band: number): void {
    const current = this.args.directionBands[direction] ?? null;
    const next = [...this.args.directionBands];

    next[direction] = current === band ? null : band;
    this.args.onChange(next);
  }

  @action
  handleSelectChange(direction: number, event: Event): void {
    const { value } = event.target as HTMLSelectElement;
    const next = [...this.args.directionBands];

    next[direction] = value === '' ? null : Number(value);
    this.args.onChange(next);
  }

  <template>
    {{! template-lint-disable no-inline-styles }}
    <div class="mx-auto flex w-full flex-col items-center" ...attributes>
      <svg
        aria-hidden="true"
        class="w-full"
        viewBox="0 0 200 200"
        data-test-alarm-compass-rose
      >
        {{! Purely a pointer/touch surface, deliberately aria-hidden -- the
          real keyboard/screen-reader-operable control is the sr-only
          <select> per direction below, driving the same state. }}
        {{! template-lint-disable no-invalid-interactive }}
        {{#each this.cells as |cell|}}
          <path
            d={{cell.path}}
            style={{cell.style}}
            data-test-alarm-compass-cell="{{cell.direction}}-{{cell.band}}"
            data-test-alarm-compass-current-wind={{if
              cell.isCurrentWind
              "true"
            }}
            data-test-alarm-compass-current-gusts={{if
              cell.isCurrentGusts
              "true"
            }}
            {{on "click" (fn this.armDirection cell.direction cell.band)}}
          />
        {{/each}}
        {{! template-lint-enable no-invalid-interactive }}

        {{#each this.directionLabels as |label|}}
          <text
            x={{label.x}}
            y={{label.y}}
            text-anchor="middle"
            dominant-baseline="middle"
            style="fill: var(--color-slate-500); font-size: 10px; font-weight: 600;"
            data-test-alarm-compass-label={{label.text}}
          >{{label.text}}</text>
        {{/each}}
      </svg>

      {{#if this.armedThresholds.length}}
        <ul
          class="mt-2 flex flex-wrap justify-center gap-x-3 gap-y-1 text-xs text-slate-600"
          data-test-alarm-compass-thresholds
        >
          {{#each this.armedThresholds as |entry|}}
            <li data-test-alarm-compass-threshold={{entry.directionLabel}}>
              <span class="font-semibold">{{entry.directionLabel}}</span>
              {{t "alarms.compassRose.threshold" value=entry.minSpeed}}
            </li>
          {{/each}}
        </ul>
      {{/if}}

      <fieldset class="sr-only">
        <legend>{{t "alarms.compassRose.legend"}}</legend>
        {{#each DIRECTIONS as |directionLabel direction|}}
          <label>
            {{directionLabel}}
            <select
              data-test-alarm-direction-select={{directionLabel}}
              value={{get this.selectedValues direction}}
              {{on "change" (fn this.handleSelectChange direction)}}
            >
              <option value="">{{t "alarms.compassRose.off"}}</option>
              {{#each this.bandOptions as |bandOption|}}
                <option
                  value={{bandOption.index}}
                >{{bandOption.band.key}}</option>
              {{/each}}
            </select>
          </label>
        {{/each}}
      </fieldset>
    </div>
  </template>
}
