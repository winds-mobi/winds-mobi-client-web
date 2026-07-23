import type { StyleSpecification } from 'ember-maplibre-gl';

export const OSM_SWISS_STYLE: StyleSpecification = {
  version: 8,
  sources: {
    osmswissstyle: {
      attribution:
        '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors',
      maxzoom: 19,
      tiles: ['https://tile.osm.ch/switzerland/{z}/{x}/{y}.png'],
      tileSize: 256,
      type: 'raster',
    },
    terrainSource: {
      type: 'raster-dem',
      attribution: '© Mapzen terrain tiles',
      encoding: 'terrarium',
      maxzoom: 15,
      tiles: [
        'https://s3.amazonaws.com/elevation-tiles-prod/terrarium/{z}/{x}/{y}.png',
      ],
      tileSize: 256,
    },
  },
  layers: [
    {
      id: 'osmswissstyle',
      source: 'osmswissstyle',
      type: 'raster',
    },
  ],
  sky: {},
};

// A plain background instead of real raster tiles: acceptance/integration
// tests don't have network access to tile.osm.ch, and MapLibre needs *some*
// style to construct a map at all (see tests/helpers/webgl.ts for the
// separate, unrelated WebGL constraint on what these tests can assert).
export const TEST_MAP_STYLE: StyleSpecification = {
  version: 8,
  sources: {},
  layers: [
    {
      id: 'background',
      type: 'background',
      paint: {
        'background-color': '#f1f5f9',
      },
    },
  ],
};
