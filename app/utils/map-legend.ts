import { WIND_COLOUR_BANDS } from 'winds-mobi-client-web/helpers/wind-to-colour';

export interface WindLegendBand {
  color: string;
  label: string;
}

export interface WindLegendControlOptions {
  bands: WindLegendBand[];
  title: string;
}

export function buildWindLegendBands(): WindLegendBand[] {
  return WIND_COLOUR_BANDS.map((band) => ({
    color: band.color,
    label: Number.isFinite(band.max) ? `${band.max}` : `${band.min}+`,
  }));
}

export function buildWindLegendControlElement(
  options: WindLegendControlOptions
) {
  const container = document.createElement('div');
  container.className = 'maplibregl-ctrl';
  container.setAttribute('data-test-map-wind-legend', '');

  const panel = document.createElement('aside');
  panel.className =
    'w-20 rounded-2xl border border-slate-200 bg-white/92 px-2.5 py-2 shadow-lg shadow-slate-900/10 backdrop-blur';

  const title = document.createElement('p');
  title.className =
    'text-[10px] font-semibold uppercase tracking-[0.16em] text-slate-500';
  title.textContent = options.title;

  const list = document.createElement('ul');
  list.className = 'mt-2 space-y-1';

  for (const band of options.bands) {
    const item = document.createElement('li');
    item.className =
      'flex items-center gap-1.5 text-[11px] font-medium text-slate-700';

    const swatch = document.createElement('span');
    swatch.className = 'h-2 w-2 shrink-0 rounded-full ring-1 ring-slate-300/80';
    swatch.style.backgroundColor = band.color;

    const label = document.createElement('span');
    label.textContent = band.label;

    item.append(swatch, label);
    list.append(item);
  }

  panel.append(title, list);
  container.append(panel);

  return container;
}
