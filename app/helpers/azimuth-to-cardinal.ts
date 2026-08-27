export const DIRECTIONS = ['N', 'NE', 'E', 'SE', 'S', 'SW', 'W', 'NW'];

// Divide the 360 degrees circle by 8 (as we have 8 directions now, 45° per direction)
export function directionIndexForAzimuth(degrees: number): number {
  return Math.round(degrees / 45) % 8;
}

export default function azimuthToCardinal(degrees: number) {
  return DIRECTIONS[directionIndexForAzimuth(degrees)];
}
