import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { geometryFromSvg } from './station-arrow-geometry.mjs';

// Build-time source of truth for the station arrow shapes: each hand-authored
// SVG under public/images is parsed once and exposed as ready-to-render geometry
// through the `virtual:station-arrows` module, so the app never hard-codes a path
// and editing the SVG (e.g. in Inkscape) is all that's needed to reshape a marker.
const VIRTUAL_ID = 'virtual:station-arrows';
const RESOLVED_ID = '\0' + VIRTUAL_ID;

// name → SVG file (relative to the project root). The app reads `arrows.<name>`.
const ARROW_SVGS = {
  notPeak: 'public/images/arrow-not-peak.svg',
  peak: 'public/images/arrow-peak.svg',
};

export function stationArrows() {
  let root = process.cwd();
  const fileFor = (rel) => resolve(root, rel);

  return {
    name: 'station-arrows',

    configResolved(config) {
      root = config.root;
    },

    resolveId(id) {
      if (id === VIRTUAL_ID) return RESOLVED_ID;
    },

    load(id) {
      if (id !== RESOLVED_ID) return;

      const arrows = {};
      for (const [name, rel] of Object.entries(ARROW_SVGS)) {
        const svg = readFileSync(fileFor(rel), 'utf8');
        arrows[name] = geometryFromSvg(svg);
      }
      return `export const arrows = ${JSON.stringify(arrows)};`;
    },

    configureServer(server) {
      // Reload when an arrow SVG is edited so the dev marker updates live.
      const watched = Object.values(ARROW_SVGS).map(fileFor);
      server.watcher.add(watched);
      server.watcher.on('change', (file) => {
        if (!watched.includes(file)) return;
        const mod = server.moduleGraph.getModuleById(RESOLVED_ID);
        if (mod) server.moduleGraph.invalidateModule(mod);
        server.ws.send({ type: 'full-reload' });
      });
    },
  };
}
