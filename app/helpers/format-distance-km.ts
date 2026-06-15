import Helper from '@ember/component/helper';
import { service } from '@ember/service';
import type IntlService from 'ember-intl/services/intl';
import { distanceKm } from 'winds-mobi-client-web/utils/distance';

export function renderDistanceKmText(
  intl: IntlService,
  fromLatitude?: number,
  fromLongitude?: number,
  toLatitude?: number,
  toLongitude?: number
) {
  if (
    fromLatitude === undefined ||
    fromLongitude === undefined ||
    toLatitude === undefined ||
    toLongitude === undefined
  ) {
    return undefined;
  }

  const distance = distanceKm(
    fromLatitude,
    fromLongitude,
    toLatitude,
    toLongitude
  );

  return `${intl.formatNumber(distance, {
    maximumFractionDigits: distance < 10 ? 1 : 0,
  })} km`;
}

interface FormatDistanceKmSignature {
  Args: {
    Positional: [
      fromLatitude?: number,
      fromLongitude?: number,
      toLatitude?: number,
      toLongitude?: number,
    ];
  };
  Return: string | undefined;
}

export default class FormatDistanceKmHelper extends Helper<FormatDistanceKmSignature> {
  @service declare intl: IntlService;

  compute([
    fromLatitude,
    fromLongitude,
    toLatitude,
    toLongitude,
  ]: FormatDistanceKmSignature['Args']['Positional']) {
    return renderDistanceKmText(
      this.intl,
      fromLatitude,
      fromLongitude,
      toLatitude,
      toLongitude
    );
  }
}
