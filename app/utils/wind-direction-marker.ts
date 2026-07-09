import windToColour from 'winds-mobi-client-web/helpers/wind-to-colour';

export interface WindDirectionMarkerColours {
  lineColor: string;
  fillColor: string;
}

// Mirrors the map marker's outline/hub convention (see station-favicon.ts):
// the ring stays the wind-speed colour, and the center only switches to the
// gusts colour when gusts fall in a different wind band -- otherwise it's a
// plain speed-coloured dot.
export function windDirectionMarkerColours(
  speed: number,
  gusts: number
): WindDirectionMarkerColours {
  const speedColour = windToColour(speed);
  const gustsColour = windToColour(gusts);

  return {
    lineColor: speedColour,
    fillColor: gustsColour === speedColour ? speedColour : gustsColour,
  };
}
