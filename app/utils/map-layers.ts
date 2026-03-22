import { IconLayer } from '@deck.gl/layers';
import windToColour from 'winds-mobi-client-web/helpers/wind-to-colour';
import type { Station } from 'winds-mobi-client-web/services/store';
import type { DeckLayer } from 'winds-mobi-client-web/utils/map-runtime';
import type { MapCoordinate } from 'winds-mobi-client-web/utils/map-view';

const STATION_ICON_SIZE = 42;
const GPS_ICON_SIZE = 16;
const STALE_READING_THRESHOLD = 24 * 60 * 60 * 1000;
const STALE_STATION_COLOUR = 'rgb(148, 163, 184)';
const stationArrowIconUrlCache = new Map<string, string>();

type GpsLayerDatum = {
  coordinates: MapCoordinate;
};

function svgToDataUrl(svg: string) {
  return `data:image/svg+xml;charset=UTF-8,${encodeURIComponent(svg)}`;
}

const STATION_ARROW_PATH =
  'M -60,147.1 C -31.1,138.5 -10,111.7 -10,80 -10,48.3 -31.1,21.5 -60,12.9 V -70 h -40 v 82.9 c -28.9,8.6 -50,35.4 -50,67.1 0,31.7 21.1,58.5 50,67.1 V 195 l -50,-25 70,100 70,-100 -50,25 z M -115,80 c 0,-19.3 15.7,-35 35,-35 19.3,0 35,15.7 35,35 0,19.3 -15.7,35 -35,35 -19.3,0 -35,-15.7 -35,-35 z';

function stationArrowColour(speed: number, timestamp: number) {
  if (!Number.isFinite(timestamp)) {
    return windToColour(speed);
  }

  const isStale = Date.now() - timestamp > STALE_READING_THRESHOLD;

  return isStale ? STALE_STATION_COLOUR : windToColour(speed);
}

function buildStationArrowSvgForColour(colour: string, isSelected = false) {
  const selectedStroke = isSelected
    ? 'stroke="#000000" stroke-width="18" stroke-linejoin="round" stroke-linecap="round" paint-order="stroke fill"'
    : '';

  return `
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox="-150 -70 140 340"
    >
      <path d="${STATION_ARROW_PATH}" fill="${colour}" ${selectedStroke} />
    </svg>
  `;
}

export function buildStationArrowSvg(
  speed: number,
  timestamp: number,
  isSelected = false
) {
  return buildStationArrowSvgForColour(
    stationArrowColour(speed, timestamp),
    isSelected
  );
}

export function buildStationArrowIconUrl(
  speed: number,
  timestamp: number,
  isSelected = false
) {
  const colour = stationArrowColour(speed, timestamp);
  const cacheKey = `${colour}:${isSelected ? 'selected' : 'default'}`;
  const cachedIconUrl = stationArrowIconUrlCache.get(cacheKey);

  if (cachedIconUrl) {
    return cachedIconUrl;
  }

  const iconUrl = svgToDataUrl(
    buildStationArrowSvgForColour(colour, isSelected)
  );
  stationArrowIconUrlCache.set(cacheKey, iconUrl);

  return iconUrl;
}

export function resetStationArrowIconUrlCacheForTest() {
  stationArrowIconUrlCache.clear();
}

export function getStationArrowIconUrlCacheSizeForTest() {
  return stationArrowIconUrlCache.size;
}

export function buildStationLayer(
  stations: Station[],
  selectedStationId: string | undefined,
  onStationSelect: (stationId: string) => void
): DeckLayer {
  return new IconLayer<Station>({
    id: 'stations',
    data: stations,
    pickable: true,
    sizeUnits: 'pixels',
    getPosition: (station) => [station.longitude, station.latitude],
    getAngle: (station) => station.last.direction,
    getSize: () => STATION_ICON_SIZE,
    getIcon: (station) => ({
      url: buildStationArrowIconUrl(
        station.last.speed,
        station.last.timestamp,
        station.id === selectedStationId
      ),
      width: STATION_ICON_SIZE,
      height: STATION_ICON_SIZE,
      anchorX: STATION_ICON_SIZE / 2,
      anchorY: STATION_ICON_SIZE / 2,
    }),
    onClick: ({ object }) => {
      if (object) {
        onStationSelect(object.id);
      }
    },
  }) as unknown as DeckLayer;
}

export function buildGpsLayer(coordinates: MapCoordinate): DeckLayer {
  return new IconLayer<GpsLayerDatum>({
    id: 'gps-location',
    data: [{ coordinates }],
    sizeUnits: 'pixels',
    getPosition: ({ coordinates: [longitude, latitude] }) => [
      longitude,
      latitude,
    ],
    getSize: () => GPS_ICON_SIZE,
    getIcon: () => ({
      url: '/images/you-are-here.svg',
      width: GPS_ICON_SIZE,
      height: GPS_ICON_SIZE,
      anchorX: GPS_ICON_SIZE / 2,
      anchorY: GPS_ICON_SIZE / 2,
    }),
  }) as unknown as DeckLayer;
}
