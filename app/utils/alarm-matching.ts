import { directionIndexForAzimuth } from 'winds-mobi-client-web/helpers/azimuth-to-cardinal';
import {
  WIND_COLOUR_BANDS,
  windBandForSpeed,
} from 'winds-mobi-client-web/helpers/wind-to-colour';
import type { AlarmConfig } from 'winds-mobi-client-web/services/alarms';
import type { Station } from 'winds-mobi-client-web/services/store';

// True once a station's latest reading, in its current direction, reaches
// or exceeds the band armed for that direction (band-or-higher semantics —
// arming wind-30 for a direction means "alert at 30 km/h+ from there").
export function stationTriggersAlarm(
  station: Station,
  config: AlarmConfig
): boolean {
  const directionIndex = directionIndexForAzimuth(station.last.direction);
  const armedBandIndex = config.directionBands[directionIndex];

  if (armedBandIndex === null || armedBandIndex === undefined) {
    return false;
  }

  const speed =
    config.metric === 'gusts' ? station.last.gusts : station.last.speed;
  const bandIndex = WIND_COLOUR_BANDS.indexOf(windBandForSpeed(speed));

  return bandIndex >= armedBandIndex;
}
