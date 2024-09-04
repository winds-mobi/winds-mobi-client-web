import RotatedMarkerLayer from '../components/rotated-marker-layer';

export function initialize(owner) {
  const emberLeafletService = owner.lookup('service:ember-leaflet');

  if (emberLeafletService) {
    emberLeafletService.registerComponent('rotated-marker-layer', {
      as: 'rotated-marker',
      component: RotatedMarkerLayer,
    });
  }
}

export default {
  initialize,
};
