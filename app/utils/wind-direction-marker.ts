import windToColour from 'winds-mobi-client-web/helpers/wind-to-colour';

export interface WindDirectionMarkerColours {
  lineColor: string;
  fillColor: string;
}

// The card behind this chart is always plain white (this app has no dark
// mode -- see section-card.gts / compact-card.gts). A genuinely transparent
// fill (CSS `transparent`) lets the connecting line, which Highcharts draws
// as one continuous path underneath the whole marker layer, show straight
// through the hollow center -- there's no "line has a hole here" option, a
// marker is just drawn on top of whatever line segment already passes
// through its position. Painting the center in the actual background
// colour instead punches a real opaque hole that hides that segment, giving
// the same visual result (a hollow ring) without the line bleeding through.
const CARD_BACKGROUND_COLOUR = 'white';

// Mirrors the map marker's outline/hub convention (see station-favicon.ts):
// the ring stays the wind-speed colour, and the center is only filled with
// the gusts colour when gusts fall in a different wind band -- otherwise
// it's left as a hollow ring (see CARD_BACKGROUND_COLOUR above for why that's
// a background-coloured fill rather than literal transparency).
export function windDirectionMarkerColours(
  speed: number,
  gusts: number
): WindDirectionMarkerColours {
  const speedColour = windToColour(speed);
  const gustsColour = windToColour(gusts);

  return {
    lineColor: speedColour,
    fillColor:
      gustsColour === speedColour ? CARD_BACKGROUND_COLOUR : gustsColour,
  };
}
