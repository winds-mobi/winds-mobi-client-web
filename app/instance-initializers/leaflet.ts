import RotatedMarkerLayer from '../components/rotated-marker-layer';
import type Owner from '@ember/owner';

export function initialize(owner: Owner) {
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
