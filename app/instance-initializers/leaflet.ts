//@ts-expect-error Not yet
import RotatedMarkerLayer from 'winds-mobi-client-web/components/rotated-marker-layer';
import type Owner from '@ember/owner';

export function initialize(owner: Owner) {
  const emberLeafletService = owner.lookup('service:ember-leaflet');

  if (emberLeafletService) {
    //@ts-expect-error Not true
    emberLeafletService.registerComponent('rotated-marker-layer', {
      as: 'rotated-marker',
      component: RotatedMarkerLayer,
    });
  }
}

export default {
  initialize,
};
