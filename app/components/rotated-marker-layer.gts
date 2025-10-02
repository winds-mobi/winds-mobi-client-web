/* eslint-disable @typescript-eslint/no-unsafe-assignment */
import MarkerLayer from 'ember-leaflet/components/marker-layer';

export default class RotatedMarkerLayer extends MarkerLayer {
  leafletOptions = [...this.leafletOptions, 'rotationAngle', 'rotationOrigin'];

  leafletDescriptors = [
    ...this.leafletDescriptors,
    'rotationAngle',
    'rotationOrigin',
  ];
}
