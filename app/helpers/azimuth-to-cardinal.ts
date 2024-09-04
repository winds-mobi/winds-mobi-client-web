export const DIRECTIONS = ['N', 'NE', 'E', 'SE', 'S', 'SW', 'W', 'NW'];

export default function windToColour(degrees: number) {
  // Divide the 360 degrees circle by 8 (as we have 8 directions now, 45° per direction)
  const index = Math.round(degrees / 45) % 8;

  return DIRECTIONS[index];
}
