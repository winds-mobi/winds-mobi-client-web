import Component from '@glimmer/component';
import MarkerLayer from 'ember-leaflet/components/marker-layer';

export interface MarkerLayerSignature {
  // The arguments accepted by the component
  Args: {};
  // Any blocks yielded by the component
  Blocks: {
    default: [];
  };
  // The element to which `...attributes` is applied in the component template
  Element: null;
}

export default class MarkerLayerComponent extends MarkerLayer<MarkerLayerSignature> {
  leafletOptions = [...this.leafletOptions, 'rotationAngle', 'rotationOrigin'];

  leafletDescriptors = [
    ...this.leafletDescriptors,
    'rotationAngle',
    'rotationOrigin',
  ];
}
