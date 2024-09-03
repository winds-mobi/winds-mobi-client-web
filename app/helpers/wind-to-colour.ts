const COLORS = [
  { color: 'rgb(9, 179, 0)', max: 5 }, // Green for <5 km/h
  { color: 'rgb(0, 179, 71)', max: 10 }, // Light Green for 5-10 km/h
  { color: 'rgb(0, 179, 152)', max: 15 }, // Teal for 10-15 km/h
  { color: 'rgb(0, 125, 179)', max: 20 }, // Light Blue for 15-20 km/h
  { color: 'rgb(0, 45, 179)', max: 25 }, // Blue for 20-25 km/h
  { color: 'rgb(36, 0, 179)', max: 30 }, // Dark Blue for 25-30 km/h
  { color: 'rgb(116, 0, 179)', max: 35 }, // Purple for 30-35 km/h
  { color: 'rgb(179, 0, 161)', max: 40 }, // Magenta for 35-40 km/h
  { color: 'rgb(179, 0, 80)', max: 45 }, // Pink for 40-45 km/h
  { color: 'rgb(179, 0, 0)', max: Infinity }, // Dark Red for >50 km/h
];

export default function windToColour(speed: number) {
  for (const entry of COLORS) {
    if (speed < entry.max) {
      return entry.color;
    }
  }
}
